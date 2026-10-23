---
name: creator-studio
description: The one door for every video on this machine - launch and promo films, product videos from a repo, a link or a folder of screenshots, service and feature explainers from a service page link or screenshots, before/after reveals of a client's old and new website, explainers, data and kinetic-type clips, art-style animation, UI walkthroughs, social clips, narrated or music-only. Asks what you need, picks the engine (brag launch workflow, HyperFrames, huashu-art-motion, Remotion), runs the free local pipeline (Kokoro voice, MusicGen, whisper, Codex images) and delivers a single MP4 to Downloads. Use for "/creator-studio", "/brag", "make a video", "launch video", "turn these screenshots into a video", "explain this service", "service explainer", "feature video", "product video for this service page", "before and after video", "old site vs new site", "website makeover video", "explainer", "animate this", or any video, motion or promo request.
argument-hint: "[what to make] [repo | link | screenshot paths] [--vertical|--square] [--voice [id]]"
---

# Creator Studio

One entry point. `<skill-dir>` below is this skill's base directory (a clone of the private `Adarsh350/creator-studio` repo). At the start of every run, refresh it quietly: `git -C <skill-dir> pull --ff-only -q` (ignore failures; offline or local edits just keep the current copy). First time on a machine: `<skill-dir>/setup.ps1` (Windows) or `<skill-dir>/setup.sh` (macOS, Linux).

The engines behind it (`brag`, `brag-slim`, `hyperframes`, `hyperframes-cli`, `hyperframes-registry`, `media-use`, `huashu-art-motion`, `remotion`, `remotion-best-practices`) are hidden from the `/` menu; load them with the Skill tool when the route below says so. Everything runs locally and free. Paid tools are listed at the bottom: flag before use.

## 1. Intake

Ask with one AskUserQuestion call, and only for what the invocation didn't already say (up to four questions):

| Question | Options |
|---|---|
| What are we making? | Launch or promo of a product · Service or feature explainer · Before/after of a client website · Data, kinetic-type or art clip (walkthroughs, site loops and anything else go under "Other") |
| What's the source? | A repo or this project · A link · Screenshots · Just a brief |
| Format? | Landscape 16:9 · Vertical 9:16 · Square 1:1 |
| Voice? | Narrated · Music only |

**Before/after** replaces the source, format and voice questions with its own four (in a second call if "what are we making" had to be asked first): old site (link · Wayback date · screenshots · recording), new site (link · screenshots · recording), format (Vertical 9:16 · Feed 4:5 · Landscape 16:9), and script (Adarsh's standard script, verbatim · the compliant variant for UAE ads). If the client's consent to be shown and named wasn't stated, ask in plain text.

**Service or feature explainer** likewise asks its own: source (service page link · screenshots, unless one was given), format (Vertical 9:16 · Feed 4:5 · Landscape 16:9), length (45s · 30s · 60s) and voice (am_michael · af_heart · Music only).

Then get whatever the answer needs and you don't have yet: the screenshot paths (or a folder), the link, the brief. Tone stays inferred unless the user named one. Whose copy is it? Iyara Labs → `iyara-voice` + `iyara-labs` (if not installed, follow the Iyara rules in the references and ask Adarsh for anything factual). First person as Adarsh → `adarsh-voice`. A client → no Iyara context at all.

## 2. Route

| Making | Source | Engine |
|---|---|---|
| Launch or promo | repo, link or screenshots | `brag` (its full workflow). Pass `--full` for screenshots, `--voice [id]` when narrated, `--format vertical\|square`. Screenshots follow its step 1 "Source: screenshots". Upstream brag may lack `--voice` or the screenshots source (check its SKILL.md): then narrate per `<skill-dir>/references/narration.md`, and route screenshots to `hyperframes`. |
| Before/after of a client website | old + new as links, Wayback, screenshots or recordings | `hyperframes` (+ `hyperframes-cli`, `hyperframes-registry`) following `<skill-dir>/references/before-after.md`: capture with `scripts/capture-site.mjs`, the beat sheet, the reveal, the audio bed, the scripts and the consent gate are all there. |
| Service or feature explainer | service page link or screenshots | `hyperframes` (+ `hyperframes-cli`, `hyperframes-registry`, `media-use`) following `<skill-dir>/references/service-explainer.md`: capture with `scripts/capture-site.mjs --sections`, the claims gate, the six-line script, the hero object per service, the package card and the beat sheet are all there. |
| Data, kinetic type, keynote-UI, art style, hero or background loop | brief or reference | `huashu-art-motion`. Its built-in TTS is paid: narrate with Kokoro instead (below). |
| Walkthrough of Stitch or React screens with zooms | Stitch project or components | `remotion` (+ `remotion-best-practices`) |
| Anything else: captions over a talking head, charts, title cards, social cutdowns, music video | anything | `hyperframes` (+ `hyperframes-cli`, `hyperframes-registry`, `media-use`) |

Mixed pieces: render inserts in one engine and cut them in another (the MP4 is the interface). Unsure → `hyperframes`.

**Narration in any HyperFrames composition** (not only brag): put `narration.json` next to `composition/` and run `node <skill-dir>/scripts/narrate.mjs <work-dir>/narration.json`. It places one Kokoro clip per line at its anchor, checks overlaps, ducks the music and writes captions. The full workflow is in `<skill-dir>/references/narration.md`.

## 3. Output: one MP4 in Downloads, nothing else

- **Runs root** `<runs>`: `$LOCALAPPDATA/creator-studio/runs` on Windows, `~/.local/share/creator-studio/runs` on macOS and Linux.
- **Work dir** (every engine's output dir, brag's `<output-dir>` included): `<runs>/<slug>-<YYYY-MM-DD-HHmmss>/`. Plans, compositions, audio, captions, posters and snapshots all live there.
- **Deliver:** copy only the final video to `~/Downloads/<slug>-<YYYY-MM-DD>.mp4`. Add `-2`, `-3` and so on if the name exists. Never write a folder, a poster, an SRT, a txt or a plan into Downloads.
- **Share caption and notes** go in the chat reply: the caption, what to check by ear, and the work-dir path for re-rolls.
- **Re-rolls** ("change scene 3", "try another voice"): reuse the latest run dir for that slug, re-render, and overwrite the same Downloads file.
- **Prune** at the start of each run: `find "<runs>" -mindepth 1 -maxdepth 1 -type d -mtime +30 -exec rm -rf {} +`

## Pipeline (local, free)

1. **Script.** Follow the copy owner from step 1.
2. **Voice.** Kokoro on the device: `npx hyperframes tts "<text>" --voice am_michael --output vo.wav` (`--list` shows the voices; `af_heart` and `bm_george` are good alternatives). For timed narration use `narrate.mjs` (above). Alternatively, Adarsh records it. In the media-use audio engine, set `"provider": "kokoro"`.
3. **Images.** Codex quota (needs the Codex CLI or the OpenAI VS Code extension, signed in to ChatGPT), about 35s each: `python -X utf8 <skill-dir>/scripts/codex_image.py --live "<prompt>" <out.png>`. No Codex → ask the user for images instead of using a paid API. Import with `npx hyperframes media-use resolve --type image --from <file> --project <dir>`. Real things (product screens, logos, places) always come from their source and are never generated.
4. **Cutouts.** `npx hyperframes remove-background in.png -o out.png` (video works too, to `.webm` or `.mov` with alpha).
5. **Music and SFX.**
   - brag ships its own tracks.
   - Otherwise use the media-use audio engine with `"bgm": {"mode": "generate"}` (MusicGen, local; the first run downloads about 300 MB) and `"sfx"` per line.
   - The `"sfx"` sources are Openverse CC0 or CC BY, otherwise 21 bundled offline sounds. Credit CC BY sounds.
   - Run it: `node ~/.claude/skills/media-use/audio/scripts/audio.mjs --request audio_request.json --hyperframes <proj> --out audio_meta.json`.
   - Then run `wait-bgm.mjs --audio-meta audio_meta.json --hyperframes <proj> --timeout-ms 600000`. MusicGen is slow on CPU, so the 120s default times out.
6. **Captions.** Use the script text (via `narrate.mjs`) when there is one. For recorded speech, run `npx hyperframes transcribe vo.wav` (whisper.cpp, local).
7. **Render.**
   - HyperFrames: `npx hyperframes check`, then `snapshot`, then `render --quality high`.
   - huashu: `render.py` per its recipe.
   - Remotion: `npx remotion render`.
8. **Finish.**
   - Use ffmpeg for joins and format variants.
   - Loudness should land between -16 and -14 LUFS, with true peak at or below -1 dBTP. Use loudnorm `I=-15:TP=-2.5` before AAC.
   - Bake the poster as frame 0, then deliver per section 3. Social posts go through the Content Desk.

## Environment

- **Setup** (`setup.ps1` / `setup.sh`) installs the engine skills from upstream, Playwright for `capture-site.mjs`, and a Python venv with Kokoro (`--music` adds MusicGen), then sets `HYPERFRAMES_PYTHON` to that venv.
- **whisper.cpp:** HyperFrames installs it on first `transcribe` (Homebrew on macOS, a source build elsewhere). Windows ARM can't build it that way: build it once and set `HYPERFRAMES_WHISPER_PATH` to `whisper-cli.exe`.
- **Env vars set after the session started are invisible to it.** Kokoro or whisper then reports "not installed". Pass them inline (`HYPERFRAMES_PYTHON=<path> npx hyperframes ...`) instead of concluding the tool is missing.
- **Requirements:** Node 20+, Python 3.10+, ffmpeg, git, Chrome or Chromium.
- **Bash prefix:** `HYPERFRAMES_SKIP_SKILLS=1 HYPERFRAMES_NO_TELEMETRY=1`.
- **Health check:** `npx hyperframes doctor`. A missing Docker is fine.

## Paid: flag before use

- **HeyGen:** avatars, presenter video, HeyGen voices, catalog music, cloud render, `auth login`, `publish`, and the HyperFrames MCP compose and render tools.
- **Other services:** ElevenLabs, Gemini or Lyria, Lambda or Cloud Run, Volcano TTS in huashu, the Higgsfield MCP, and any image API other than Codex.
- **Snapshots:** always pass `--describe false`, otherwise Gemini is called.
- **API keys:** never put `HEYGEN_API_KEY` in a `.env` near a project. media-use finds it and silently switches to paid providers.
