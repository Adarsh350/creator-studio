#!/usr/bin/env node
// Per-line Kokoro narration for creator-studio (and /brag --voice). The voice is the clock: each line
// is its own WAV placed at its scene's anchor time, so picture and voice stay in sync.
//
//   node <skill-dir>/scripts/narrate.mjs <output-dir>/narration.json
//   node <skill-dir>/scripts/narrate.mjs --self-test
//
// narration.json (paths relative to <output-dir>/composition):
//   { "voice": "am_michael", "speed": 1, "lang": "en-us", "duration": 23,
//     "music": "assets/music/track.mp3", "musicStart": 0,
//     "lines": [ { "id": "hook", "at": 0.4, "text": "..." } ] }
//
// Writes composition/assets/vo/<id>.wav and <output-dir>/narration-timing.json,
// prints the <audio> tags and the music duck lane, and exits 1 on overlap or overrun.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const GAP = 0.15; // min silence between lines
const TAIL = 0.6; // last line ends this far before the video ends (music fade)
const DUCK_LU = 10; // bed sits this many LU under the voice while it speaks
const VO_TRACK = 60; // one dedicated track, clear of music (10) and SFX (11+)

function hf(args) {
  const quoted = args.map((a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a));
  const r = spawnSync(["npx", "hyperframes", ...quoted].join(" "), {
    shell: true,
    encoding: "utf8",
    env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: "1", HYPERFRAMES_NO_TELEMETRY: "1" },
  });
  const json = (r.stdout || "").slice((r.stdout || "").indexOf("{"));
  try {
    return JSON.parse(json);
  } catch {
    throw new Error(`hyperframes ${args[0]} failed:\n${r.stdout}\n${r.stderr}`);
  }
}

const lufs = (file) => hf(["audio", file, "--json"]).items[0].loudness.lufsIntegrated;
const r2 = (n) => Math.round(n * 100) / 100;

// Pure timing check: lines are [{id, at, dur}] sorted by `at`.
export function problems(lines, duration) {
  const out = [];
  lines.forEach((l, i) => {
    const next = lines[i + 1];
    if (next && l.at + l.dur + GAP > next.at)
      out.push(`${l.id} ends ${r2(l.at + l.dur)}s, overlaps ${next.id} at ${next.at}s`);
  });
  const last = lines.at(-1);
  if (last && last.at + last.dur > duration - TAIL)
    out.push(`${last.id} ends ${r2(last.at + last.dur)}s, past ${r2(duration - TAIL)}s (video ${duration}s)`);
  return out;
}

// Absolute-volume envelope for the bed: full, dip 0.25s before each line, recover 0.35s after.
export function duckLane(lines, bed, duck, musicStart = 0) {
  const pts = [{ t: 0, v: bed }];
  for (const l of lines) {
    const s = l.at - musicStart;
    const e = s + l.dur;
    const last = pts.at(-1);
    if (pts.length > 1 && s - 0.25 <= last.t) {
      // previous recovery hasn't finished: stay ducked through this line
      pts.at(-2).t = r2(e);
      last.t = r2(e + 0.35);
    } else pts.push({ t: r2(s - 0.25), v: bed }, { t: r2(s), v: duck }, { t: r2(e), v: duck }, { t: r2(e + 0.35), v: bed });
  }
  return { version: 1, lanes: [{ target: "volume", points: pts.filter((p) => p.t >= 0) }] };
}

function selfTest() {
  const ok = (c, m) => { if (!c) throw new Error(`self-test: ${m}`); };
  ok(problems([{ id: "a", at: 0, dur: 2 }, { id: "b", at: 2.1, dur: 1 }], 10).length === 1, "overlap");
  ok(problems([{ id: "a", at: 0, dur: 2 }, { id: "b", at: 3, dur: 1 }], 10).length === 0, "clean");
  ok(problems([{ id: "a", at: 8, dur: 1.6 }], 10).length === 1, "overrun");
  const lane = duckLane([{ at: 1, dur: 2 }, { at: 3.3, dur: 1 }], 0.36, 0.1).lanes[0].points;
  ok(lane.filter((p) => p.v === 0.1).length === 2, `close lines merge into one dip: ${JSON.stringify(lane)}`);
  ok(lane.at(-1).v === 0.36 && lane.every((p, i) => !i || p.t >= lane[i - 1].t), "ends at bed, monotonic");
  console.log("self-test ok");
}

function main(planPath) {
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  const comp = join(dirname(planPath), "composition");
  mkdirSync(join(comp, "assets/vo"), { recursive: true });
  const lines = [...plan.lines].sort((a, b) => a.at - b.at).map((l) => {
    const base = join(comp, "assets/vo", l.id);
    const wav = `${base}.wav`;
    const key = { text: l.text, voice: plan.voice ?? "af_heart", speed: plan.speed ?? 1, lang: plan.lang ?? "en-us" };
    let meta = existsSync(`${base}.json`) && existsSync(wav) ? JSON.parse(readFileSync(`${base}.json`, "utf8")) : null;
    if (!meta || Object.keys(key).some((k) => meta[k] !== key[k])) {
      // re-runs only regenerate lines whose text or voice changed
      writeFileSync(`${base}.txt`, l.text);
      const r = hf(["tts", `${base}.txt`, "--voice", key.voice, "--speed", String(key.speed),
        "--lang", key.lang, "--output", wav, "--json"]);
      meta = { ...key, dur: r.durationSeconds, lufs: lufs(wav) };
      writeFileSync(`${base}.json`, JSON.stringify(meta));
    }
    console.log(`${l.id}  ${meta.dur}s  "${l.text}"`);
    return { ...l, dur: meta.dur, lufs: meta.lufs };
  });

  const issues = problems(lines, plan.duration);
  let lane = null;
  if (plan.music) {
    const voLufs = Math.max(...lines.map((l) => l.lufs));
    const bed = plan.musicVolume ?? 0.36;
    const duck = r2(Math.min(bed, 10 ** ((voLufs - DUCK_LU - lufs(join(comp, plan.music))) / 20)));
    lane = duckLane(lines, bed, Math.max(duck, 0.05), plan.musicStart ?? 0);
  }
  writeFileSync(join(dirname(planPath), "narration-timing.json"),
    JSON.stringify({ voice: plan.voice, lines, issues, musicAutomation: lane }, null, 2));
  // Captions come from the script itself, so no speech-to-text is needed. `caption` overrides
  // `text` where the spoken text is a phonetic respelling ("Ee-yah-ra" for "Iyara").
  const ts = (s) => new Date(Math.round(s * 1000)).toISOString().slice(11, 23).replace(".", ",");
  writeFileSync(join(dirname(planPath), "brag.srt"), lines
    .map((l, i) => `${i + 1}\n${ts(l.at)} --> ${ts(l.at + l.dur)}\n${l.caption ?? l.text}\n`).join("\n"));

  console.log("\n<!-- voiceover: one track, lines placed at their anchors -->");
  for (const l of lines)
    console.log(`<audio id="vo-${l.id}" class="clip" src="assets/vo/${l.id}.wav" data-start="${l.at}" data-duration="${l.dur}" data-track-index="${VO_TRACK}" data-volume="1"></audio>`);
  if (lane) console.log(`\n<!-- on the music <audio>: drop data-volume, add -->\ndata-automation='${JSON.stringify(lane)}'`);
  if (issues.length) {
    console.error(`\nTiming problems (move "at", tighten the line, or re-run with a higher speed):\n- ${issues.join("\n- ")}`);
    process.exit(1);
  }
}

const arg = process.argv[2];
if (arg === "--self-test") selfTest();
else if (arg) main(arg);
else {
  console.error("usage: narrate.mjs <output-dir>/narration.json | --self-test");
  process.exit(2);
}
