# Running this script will build, pack and install a new local version of the renderer and gameslib package from disc (assumed to be at ../renderer and 
# ../gameslib).
$GAMESLIB_PATH = "../gameslib"
$RENDERERLIB_PATH = "../renderer"
$CURRENT_DIR = Get-Location

# Find max renderer version between front and gameslib
$versionStrings1 = npm cache ls | Select-String '\\renderer\\abstractplay-renderer-[0-9]+\.[0-9]+\.([0-9]+)(-beta)?\.tgz' -AllMatches
$maxNumber1 = 1;
if ($null -ne $versionStrings1.Matches -and $versionStrings1.Matches -ne '') {
  $versions1 = $versionStrings1.Matches | ForEach-Object { [int]$_.Groups[1].Value }
  $maxNumber1 = ($versions1 | Measure-Object -Maximum).Maximum + 1
}

Set-Location $GAMESLIB_PATH
$versionStrings2 = npm cache ls | Select-String '\\renderer\\abstractplay-renderer-[0-9]+\.[0-9]+\.([0-9]+)(-beta)?\.tgz' -AllMatches
$maxNumber2 = 1;
if ($null -ne $versionStrings2.Matches -and $versionStrings2.Matches -ne '') {
  $versions2 = $versionStrings2.Matches | ForEach-Object { [int]$_.Groups[1].Value }
  $maxNumber2 = ($versions2 | Measure-Object -Maximum).Maximum + 1
}
$maxNumber = if ($maxNumber1 -gt $maxNumber2) { $maxNumber1 } else { $maxNumber2 }

$NEW_VERSION = "1.0." + $maxNumber
Write-Output "New renderer version is: $NEW_VERSION"

Set-Location $RENDERERLIB_PATH
# Update the version number in the package.json file
npm version $NEW_VERSION --no-git-tag-version --allow-same-version

# Remove old pack files (otherwise they seem to get added to the new package)
Remove-Item .\abstractplay-renderer-*.tgz

npm run build
if ($LASTEXITCODE -ne 0) {
  Set-Location $CURRENT_DIR
  throw "npm run build failed in renderer!"
}

# Package the library into a .tgz file
npm pack

# Save the path to the .tgz file
$RENDERER_TGZ_PATH = "${RENDERERLIB_PATH}\abstractplay-renderer-${NEW_VERSION}.tgz"

# Install in gameslib
Set-Location $GAMESLIB_PATH

# Install the package
npm install $RENDERER_TGZ_PATH --loglevel verbose

# Find new gameslib version
Set-Location $CURRENT_DIR
$versionStrings = npm cache ls | Select-String '\\gameslib\\abstractplay-gameslib-[0-9]+\.[0-9]+\.([0-9]+)(-beta)?\.tgz' -AllMatches
$versions = $versionStrings.Matches | ForEach-Object { [int]$_.Groups[1].Value }
$maxNumber = 1;
if ($null -ne $versionStrings.Matches -and $versionStrings.Matches -ne '') {
  $versions = $versionStrings1.Matches | ForEach-Object { [int]$_.Groups[1].Value }
  $maxNumber = ($versions | Measure-Object -Maximum).Maximum + 1
}

$NEW_VERSION = "1.0." + $maxNumber
Write-Output "New gameslib version is: $NEW_VERSION"

# Change to the package directory
Set-Location $GAMESLIB_PATH

# Update the version number in the package.json file
npm version $NEW_VERSION --no-git-tag-version --allow-same-version

# Package the library into a .tgz file
npm run build
if ($LASTEXITCODE -ne 0) {
  Set-Location $CURRENT_DIR
  throw "npm run build failed in gameslib!"
}

# Save the path to the .tgz file
$GAMESLIB_TGZ_PATH = "${GAMESLIB_PATH}\abstractplay-gameslib-${NEW_VERSION}.tgz"

# Change back to the original directory
Set-Location $CURRENT_DIR

# Install both the packages
npm install $GAMESLIB_TGZ_PATH $RENDERER_TGZ_PATH --loglevel verbose
