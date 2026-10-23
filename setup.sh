#!/usr/bin/env bash
# creator-studio setup (macOS, Linux). Safe to re-run: installed skills and packages are skipped.
#   bash setup.sh [--music] [--force]
# --music adds MusicGen (torch + transformers, about 1 GB). --force reinstalls engine skills over local edits.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS="$HOME/.claude/skills"
MUSIC=0; FORCE=0
for a in "$@"; do case "$a" in --music) MUSIC=1 ;; --force) FORCE=1 ;; *) echo "unknown option: $a" >&2; exit 2 ;; esac; done

need() { command -v "$1" >/dev/null || { echo "$1 not found. Install it ($2) and re-run." >&2; exit 1; }; }
need node "https://nodejs.org or brew install node"
need git "brew install git / apt install git"
need ffmpeg "brew install ffmpeg / apt install ffmpeg"
need python3 "brew install python / apt install python3 python3-venv"
[ "$(node -p "process.versions.node.split('.')[0]")" -ge 20 ] || { echo "Node 20+ required." >&2; exit 1; }

# 1. Engine skills, from upstream (not vendored: each keeps its own license and updates).
install_skills() {
  local repo="$1"; shift
  for skill in "$@"; do
    if [ "$FORCE" = 0 ] && [ -f "$SKILLS/$skill/SKILL.md" ]; then echo "skill $skill: present"; continue; fi
    echo "skill $skill: installing from $repo"
    npx -y skills add "$repo" -g -a claude-code -y -s "$skill"
  done
}
install_skills heygen-com/hyperframes hyperframes hyperframes-cli hyperframes-registry media-use
install_skills latent-spaces/brag brag brag-slim
install_skills alchaincyf/huashu-art-motion huashu-art-motion
install_skills remotion-dev/skills remotion-best-practices
install_skills google-labs-code/stitch-skills remotion

# 2. Playwright for scripts/capture-site.mjs.
(cd "$ROOT" && npm install --no-audit --no-fund --loglevel=error && npx playwright install chromium)

# 3. Python venv with Kokoro (voice) and, with --music, MusicGen. Reuses an existing HYPERFRAMES_PYTHON.
PY="${HYPERFRAMES_PYTHON:-}"
if [ -z "$PY" ] || [ ! -x "$PY" ]; then
  VENV="$HOME/.creator-studio/venv"
  PY="$VENV/bin/python"
  [ -x "$PY" ] || python3 -m venv "$VENV"
fi
"$PY" -c 'import sys; sys.exit(sys.version_info < (3, 10))' || { echo "Python 3.10+ required ($PY)." >&2; exit 1; }
PKGS=(kokoro-onnx soundfile); PROBE="import kokoro_onnx, soundfile"
if [ "$MUSIC" = 1 ]; then PKGS+=(transformers torch numpy); PROBE="$PROBE, transformers, torch"; fi
"$PY" -c "$PROBE" 2>/dev/null || "$PY" -m pip install --disable-pip-version-check -q "${PKGS[@]}"

# 4. Health check. A missing Docker is fine.
HYPERFRAMES_PYTHON="$PY" HYPERFRAMES_NO_TELEMETRY=1 npx hyperframes doctor || true
echo
echo "creator-studio setup done. Add this to your ~/.zshrc or ~/.bashrc, then restart Claude Code:"
echo "  export HYPERFRAMES_PYTHON=\"$PY\""
