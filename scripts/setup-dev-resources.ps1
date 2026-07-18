$ErrorActionPreference = "Stop"

$TemurinVersion = "25.0.3+9"
$JarUrl = "https://github.com/UBUMonitor/ubumonitor-analytics-api/releases/download/v0.0.1/ubumonitoranalytics-0.0.1.jar"
$ResourcesDir = "src-tauri/resources"

New-Item -ItemType Directory -Force -Path $ResourcesDir | Out-Null

# --- JAR ---
$JarPath = Join-Path $ResourcesDir "app.jar"
if (Test-Path $JarPath) {
    Write-Host "JAR ya existe, saltando descarga."
} else {
    Write-Host "Descargando JAR..."
    Invoke-WebRequest -Uri $JarUrl -OutFile $JarPath
}

# --- JRE ---
$JavaExePath = Join-Path $ResourcesDir "jre/bin/java.exe"
if (Test-Path $JavaExePath) {
    Write-Host "JRE ya existe, saltando descarga."
    exit 0
}

$VersionTag = "jdk-$TemurinVersion"
$VersionFile = $TemurinVersion -replace '\+', '_'
$Url = "https://github.com/adoptium/temurin25-binaries/releases/download/$VersionTag/OpenJDK25U-jre_x64_windows_hotspot_$VersionFile.zip"

Write-Host "Descargando JRE desde: $Url"
Invoke-WebRequest -Uri $Url -OutFile "jre_download.zip"
Expand-Archive -Path "jre_download.zip" -DestinationPath "jre_extracted" -Force

$InnerFolder = Get-ChildItem "jre_extracted" | Select-Object -First 1
New-Item -ItemType Directory -Force -Path "$ResourcesDir/jre" | Out-Null
Move-Item -Path "$($InnerFolder.FullName)/*" -Destination "$ResourcesDir/jre"

Remove-Item -Recurse -Force "jre_extracted", "jre_download.zip"

Write-Host "JRE listo en $ResourcesDir/jre"