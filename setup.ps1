# creator-studio setup (Windows). Safe to re-run: installed skills and packages are skipped.
#   powershell -ExecutionPolicy Bypass -File setup.ps1 [-Music] [-Force]
# -Music adds MusicGen (torch + transformers, about 1 GB). -Force reinstalls engine skills over local edits.
param([switch]$Music, [switch]$Force)
$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Skills = Join-Path $HOME '.claude/skills'

function Need($cmd, $hint) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "$cmd not found. Install it ($hint) and re-run." }
}
# npm.cmd/npx.cmd, never npm/npx: their .ps1 shims re-parse $MyInvocation.Line, which breaks splatted args.
function Run {
  & $args[0] @($args | Select-Object -Skip 1)
  if ($LASTEXITCODE) { throw "failed: $($args -join ' ')" }
}

Need node 'winget install OpenJS.NodeJS.LTS'
Need git 'winget install Git.Git'
Need ffmpeg 'winget install Gyan.FFmpeg'
if ([int](node -p "process.versions.node.split('.')[0]") -lt 20) { throw 'Node 20+ required.' }

# 1. Engine skills, from upstream (not vendored: each keeps its own license and updates).
$engines = [ordered]@{
  'heygen-com/hyperframes'        = 'hyperframes', 'hyperframes-cli', 'hyperframes-registry', 'media-use'
  'latent-spaces/brag'            = 'brag', 'brag-slim'
  'alchaincyf/huashu-art-motion'  = 'huashu-art-motion'
  'remotion-dev/skills'           = 'remotion-best-practices'
  'google-labs-code/stitch-skills' = 'remotion'
}
foreach ($repo in $engines.Keys) {
  foreach ($skill in $engines[$repo]) {
    if (-not $Force -and (Test-Path (Join-Path $Skills "$skill/SKILL.md"))) { Write-Host "skill ${skill}: present"; continue }
    Write-Host "skill ${skill}: installing from $repo"
    Run npx.cmd -y skills add $repo -g -a claude-code -y -s $skill
  }
}

# 2. Playwright for scripts/capture-site.mjs.
Push-Location $Root
try {
  Run npm.cmd install --no-audit --no-fund --loglevel=error
  Run npx.cmd playwright install chromium
} finally { Pop-Location }

# 3. Python venv with Kokoro (voice) and, with -Music, MusicGen. Reuses an existing HYPERFRAMES_PYTHON.
$py = [Environment]::GetEnvironmentVariable('HYPERFRAMES_PYTHON', 'User')
if (-not $py -or -not (Test-Path $py)) {
  $venv = Join-Path $HOME '.creator-studio/venv'
  $py = Join-Path $venv 'Scripts/python.exe'
  if (-not (Test-Path $py)) {
    $base = if (Get-Command py -ErrorAction SilentlyContinue) { @('py', '-3') } else { @('python') }
    Need $base[0] 'winget install Python.Python.3.12'
    Run @base -m venv $venv
  }
}
& $py -c 'import sys; sys.exit(sys.version_info < (3, 10))'
if ($LASTEXITCODE) { throw "Python 3.10+ required ($py)." }
$pkgs = @('kokoro-onnx', 'soundfile')
$probe = 'import kokoro_onnx, soundfile'
if ($Music) { $pkgs += 'transformers', 'torch', 'numpy'; $probe += ', transformers, torch' }
$ErrorActionPreference = 'Continue'  # PS 5.1 turns redirected native stderr into a terminating error under Stop
& $py -c $probe 2>$null
$missing = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
if ($missing) { Run $py -m pip install --disable-pip-version-check -q @pkgs }
[Environment]::SetEnvironmentVariable('HYPERFRAMES_PYTHON', $py, 'User')
$env:HYPERFRAMES_PYTHON = $py
Write-Host "HYPERFRAMES_PYTHON=$py (User scope; restart Claude Code to pick it up)"

# 4. Health check. A missing Docker is fine; on Windows ARM, whisper needs HYPERFRAMES_WHISPER_PATH (see README).
$env:HYPERFRAMES_NO_TELEMETRY = '1'
npx.cmd hyperframes doctor
Write-Host 'creator-studio setup done.'
