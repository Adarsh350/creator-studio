"""Free image generation through the Codex CLI's built-in image tool.

Runs `codex exec` on the ChatGPT login (~/.codex/auth.json): no API key, no
per-image billing, but each image draws on the ChatGPT message allowance.
Codex saves the PNG under ~/.codex/generated_images/<thread_id>/; this wrapper
finds it from the JSON event stream and copies it where you asked.

Speed (measured 2026-10-04, ~33s/image on Codex 0.159.2): an imperative prompt
that forbids reading skills/docs, low reasoning effort, a throwaway cwd, and
--ephemeral. Without the "do not read" line Codex loads its imagegen skill
first, which is the slow part.

Binary: the VS Code extension's bundled codex, NOT the npm `codex` on PATH
(stale 0.114 on this machine; it rejects every current model). Override with
CODEX_BIN. Model: CODEX_IMAGE_MODEL (default gpt-5.6-luna; the image tool does
not depend on the chat model, so the cheapest one is right).

    python <skill-dir>/scripts/codex_image.py --check                  # no quota used
    python <skill-dir>/scripts/codex_image.py --live "prompt" out.png  # one real image
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any, Optional

DEFAULT_MODEL = "gpt-5.6-luna"
DEFAULT_TIMEOUT = 300  # seconds; observed 30-60s, generous for a busy queue

_PROMPT = (
    'Call the image_generation tool now, exactly once, with this prompt: "{prompt}". '
    "Do not read any files, skills or docs and do not plan or explain. "
    "After the image is generated, reply with only the saved file path."
)


class CodexImageError(RuntimeError):
    pass


def _codex_home() -> Path:
    return Path(os.getenv("CODEX_HOME") or Path.home() / ".codex")


def find_codex() -> Optional[str]:
    """CODEX_BIN, else the newest extension-bundled binary, else PATH."""
    explicit = os.getenv("CODEX_BIN")
    if explicit:
        return explicit
    exe = "codex.exe" if os.name == "nt" else "codex"
    found = list((Path.home() / ".vscode" / "extensions").glob(f"openai.chatgpt-*/bin/*/{exe}"))

    def version(p: Path) -> tuple:
        m = re.search(r"openai\.chatgpt-([\d.]+)", str(p))
        return tuple(int(x) for x in m.group(1).split(".")) if m else (0,)

    if found:
        return str(max(found, key=version))
    return shutil.which("codex")  # may be stale; check() reports its version


def codex_version() -> Optional[str]:
    binary = find_codex()
    if not binary:
        return None
    try:
        out = subprocess.run([binary, "--version"], capture_output=True, text=True, timeout=20)
    except (OSError, subprocess.TimeoutExpired):
        return None
    return out.stdout.strip() or None


def generate(
    prompt: str,
    out_path: str,
    *,
    aspect: str = "16:9",
    model: Optional[str] = None,
    timeout: int = DEFAULT_TIMEOUT,
) -> dict[str, Any]:
    """Generate one image and write it to `out_path` (PNG). Uses ChatGPT quota."""
    binary = find_codex()
    if not binary:
        raise CodexImageError("Codex not found. Install the OpenAI VS Code extension or set CODEX_BIN.")
    text = _PROMPT.format(prompt=f"{prompt.strip()}, {aspect} aspect ratio".replace('"', "'"))
    cmd = [
        binary, "exec", "-",
        "-m", model or os.getenv("CODEX_IMAGE_MODEL", DEFAULT_MODEL),
        "--skip-git-repo-check", "--ephemeral", "--json",
        "-c", "model_reasoning_effort=low",
    ]
    started = time.time()
    with tempfile.TemporaryDirectory() as cwd:  # empty cwd: nothing to load, nothing to write
        try:
            run = subprocess.run(cmd, input=text, capture_output=True, text=True,
                                 encoding="utf-8", timeout=timeout, cwd=cwd)
        except subprocess.TimeoutExpired as exc:
            raise CodexImageError(f"Codex image generation timed out after {timeout}s") from exc

    thread_id, reply, error = None, "", ""
    for line in run.stdout.splitlines():
        try:
            ev = json.loads(line)
        except ValueError:
            continue
        if ev.get("type") == "thread.started":
            thread_id = ev.get("thread_id")
        elif ev.get("type") == "turn.failed":
            error = ev.get("error", {}).get("message", "turn failed")
        elif ev.get("item", {}).get("type") == "agent_message":
            reply = ev["item"].get("text", "")

    source: Optional[Path] = None
    if reply and Path(reply.strip()).is_file():
        source = Path(reply.strip())
    elif thread_id:
        pngs = sorted((_codex_home() / "generated_images" / thread_id).glob("*.png"))
        source = pngs[-1] if pngs else None
    if source is None:
        raise CodexImageError(error or f"Codex produced no image (exit {run.returncode}): {reply[:200]}")

    dest = Path(out_path)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, dest)
    return {"backend": "codex", "path": str(dest), "seconds": round(time.time() - started, 1),
            "thread_id": thread_id}


if __name__ == "__main__":
    if sys.argv[1:2] == ["--live"] and len(sys.argv) == 4:
        print(generate(sys.argv[2], sys.argv[3]))
    else:
        v = codex_version()
        print(f"codex: {find_codex()}\nversion: {v}")
        assert v and "0.114" not in v, "stale or missing Codex; install/update the OpenAI VS Code extension"
        print("OK")
