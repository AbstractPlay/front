# Build, pack, and install a fresh local @abstractplay/gameslib
$ErrorActionPreference = "Stop"

$PACKAGE_PATH = Resolve-Path "../gameslib"

Push-Location $PACKAGE_PATH

# 1) Create a unique prerelease version (e.g., 1.0.0-dev.20250903T211500)
$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$base = ($pkg.version -split "-")[0]
$stamp = Get-Date -Format "yyyyMMddTHHmmss"
$newVersion = "$base-dev.$stamp"

# Update the version without tagging
npm version $newVersion --no-git-tag-version

# 2) Build
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "gameslib build failed" }

# 3) Pack to a tarball and capture its name robustly
$packJson = npm pack --json | ConvertFrom-Json
$tgzName = $packJson[0].filename
$tgzPath = Join-Path (Get-Location) $tgzName

Pop-Location  # back to `front`

# 4) Remove any previously installed copy to be extra sure
$installedPath = "node_modules\@abstractplay\gameslib"
if (Test-Path $installedPath) { Remove-Item $installedPath -Recurse -Force }

# 5) Install that exact tarball
npm install --force $tgzPath --loglevel verbose

Write-Host "Installed @abstractplay/gameslib@$newVersion from $tgzPath"
