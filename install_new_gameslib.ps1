# Running this script will build, pack and install a new local version of the gameslib package from disc (assumed to be at ../gameslib). It assumes the renderer library didn't change.
$versionStrings = npm cache ls | Select-String '\\gameslib\\abstractplay-gameslib-[0-9]+\.[0-9]+\.([0-9]+)(-beta)?\.tgz' -AllMatches

# Convert the matches to integers
$versions = $versionStrings.Matches | ForEach-Object { [int]$_.Groups[1].Value }

# Find the maximum plus one.
$maxNumber = ($versions | Measure-Object -Maximum).Maximum + 1

$NEW_VERSION = "1.0." + $maxNumber
Write-Output "The new version is: $NEW_VERSION"

# Save the current directory
$CURRENT_DIR = Get-Location

# Define the path to your package
$PACKAGE_PATH = "../gameslib"

# Change to the package directory
Set-Location $PACKAGE_PATH

# Update the version number in the package.json file
npm version $NEW_VERSION --no-git-tag-version

# Package the library into a .tgz file
npm run build
if ($LASTEXITCODE -ne 0) {
  Set-Location $CURRENT_DIR
  throw "npm run build failed in gameslib!"
}

# Save the path to the .tgz file
$PACKAGE_TGZ_PATH = "${PACKAGE_PATH}\abstractplay-gameslib-${NEW_VERSION}.tgz"

# Change back to the original directory
Set-Location $CURRENT_DIR

# Install the package
npm install $PACKAGE_TGZ_PATH --loglevel verbose
