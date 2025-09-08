# Build, pack, and install fresh local versions of @abstractplay/renderer and @abstractplay/gameslib
$ErrorActionPreference = "Stop"

$GAMESLIB_PATH = Resolve-Path "../gameslib"
$RENDERERLIB_PATH = Resolve-Path "../renderer"

# === RENDERER ===
Push-Location $RENDERERLIB_PATH

# 1) Create a unique prerelease version (e.g., 1.0.0-dev.20250903T211500)
$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$base = ($pkg.version -split "-")[0]
$stamp = Get-Date -Format "yyyyMMddTHHmmss"
$rendererVersion = "$base-dev.$stamp"

# Update the version without tagging
npm version $rendererVersion --no-git-tag-version

# 2) Build
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "renderer build failed" }

# 3) Pack to a tarball and capture its name robustly
$packJson = npm pack --json | ConvertFrom-Json
$rendererTgzName = $packJson[0].filename
$rendererTgzPath = Join-Path (Get-Location) $rendererTgzName

Pop-Location  # back to `front`

# === GAMESLIB ===
Push-Location $GAMESLIB_PATH

# 1) Create a unique prerelease version (e.g., 1.0.0-dev.20250903T211500)
$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$base = ($pkg.version -split "-")[0]
$stamp = Get-Date -Format "yyyyMMddTHHmmss"
$gameslibVersion = "$base-dev.$stamp"

# Update the version without tagging
npm version $gameslibVersion --no-git-tag-version

# 2) Install the renderer first
npm install --force $rendererTgzPath --loglevel verbose

# 3) Build
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "gameslib build failed" }

# 4) Pack to a tarball and capture its name robustly
$packJson = npm pack --json | ConvertFrom-Json
$gameslibTgzName = $packJson[0].filename
$gameslibTgzPath = Join-Path (Get-Location) $gameslibTgzName

Pop-Location  # back to `front`

# === INSTALL IN FRONT ===
# 5) Remove any previously installed copies to be extra sure
$rendererInstalledPath = "node_modules\@abstractplay\renderer"
$gameslibInstalledPath = "node_modules\@abstractplay\gameslib"
if (Test-Path $rendererInstalledPath) { Remove-Item $rendererInstalledPath -Recurse -Force }
if (Test-Path $gameslibInstalledPath) { Remove-Item $gameslibInstalledPath -Recurse -Force }

# 6) Install both packages
npm install --force $rendererTgzPath $gameslibTgzPath --loglevel verbose

Write-Host "Installed @abstractplay/renderer@$rendererVersion from $rendererTgzPath"
Write-Host "Installed @abstractplay/gameslib@$gameslibVersion from $gameslibTgzPath"
