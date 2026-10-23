# creator-studio

A Claude Code skill that gives you one place to ask for any video. That covers launch films, service explainers, before-and-after website reveals, kinetic type and walkthroughs. It asks up to four questions, picks the engine (brag, HyperFrames, huashu-art-motion, Remotion) and renders on your machine for free. Voice comes from Kokoro, music from MusicGen, captions from whisper and images from Codex. The output is a single MP4 in `~/Downloads`.

Type `/creator-studio` in Claude Code, or just ask for a video.

## Install

You need Node 20+, Python 3.10+, ffmpeg, git and Chrome or Chromium.

**macOS / Linux**

```bash
git clone https://github.com/Adarsh350/creator-studio ~/.claude/skills/creator-studio
bash ~/.claude/skills/creator-studio/setup.sh            # add --music for MusicGen (~1 GB)
```

Add the `export HYPERFRAMES_PYTHON=...` line it prints to your shell rc file.

**Windows**

```powershell
git clone https://github.com/Adarsh350/creator-studio "$HOME\.claude\skills\creator-studio"
powershell -ExecutionPolicy Bypass -File "$HOME\.claude\skills\creator-studio\setup.ps1"   # add -Music for MusicGen
```

Restart Claude Code after setup. Environment variables set during setup are not visible to a session that was already running.

Setup is safe to re-run. It does four things:

- Installs the engine skills from their upstream repos: `heygen-com/hyperframes`, `latent-spaces/brag`, `alchaincyf/huashu-art-motion`, `remotion-dev/skills` and `google-labs-code/stitch-skills`. It skips any you already have; pass `--force` / `-Force` to reinstall them.
- Installs Playwright and Chromium for `scripts/capture-site.mjs`.
- Creates a Python venv with Kokoro at `~/.creator-studio/venv`.
- Runs `npx hyperframes doctor`. A missing Docker is fine.

## Updates

You don't need to do anything. At the start of every run the skill runs `git pull --ff-only` on itself, so you always get the latest version. If you edit your local copy, the pull stops quietly and keeps your edits. Run `git -C ~/.claude/skills/creator-studio status` to see them.

On the maintainer's machine, `scripts/autosync.mjs` runs as a Claude Code Stop hook. After a session that changed the skill, it asks Claude to commit the changes with proper messages and then pushes them to `main`.

## Costs: free by default, paid only on purpose

Everything in the default pipeline is local and free. The skill tells Claude to flag these before using them:

- HeyGen: avatars, voices, catalog music, cloud render.
- ElevenLabs.
- Gemini or Lyria.
- Lambda or Cloud Run.
- Any image API other than Codex.

Two settings keep this true:

- Never put a `HEYGEN_API_KEY` in a `.env` near a project. HyperFrames' media tooling finds it and silently switches to paid providers.
- Snapshots always run with `--describe false`.

## Platform notes

- **whisper.cpp:** HyperFrames installs it on the first `transcribe`. On Windows ARM, build it yourself and set `HYPERFRAMES_WHISPER_PATH` to `whisper-cli.exe`.
- **MusicGen on Windows ARM:** PyPI has no win-arm64 torch wheel, so `-Music` fails there. Use a torch build for your platform, or go music-only with bundled or Openverse tracks.
- **Images:** generating images needs the Codex CLI or the OpenAI VS Code extension, signed in to ChatGPT. Without it, the skill asks you for images.

## Layout

```
SKILL.md                 the skill: intake, routing, output rules, pipeline
references/              before-after, service-explainer and narration workflows
scripts/narrate.mjs      per-line Kokoro voiceover, music ducking, captions
scripts/capture-site.mjs site screenshots and section outline (Playwright)
scripts/codex_image.py   image generation through the Codex quota
scripts/autosync.mjs     maintainer Stop hook: commit and push skill edits
setup.ps1 / setup.sh     one-time machine setup
```

Each script has a self-test: `node scripts/narrate.mjs --self-test`, `node scripts/capture-site.mjs --self-test`, `node scripts/autosync.mjs --self-test` and `python scripts/codex_image.py --check`.

The engine skills keep their own licenses: HyperFrames is Apache-2.0, brag and huashu-art-motion are MIT. This repo doesn't vendor them.
