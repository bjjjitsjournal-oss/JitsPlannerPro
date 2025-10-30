# update-android.ps1 - Replace android folder with complete Gradle build
Write-Host "🚀 Updating Android folder for v1.0.87..." -ForegroundColor Cyan

# Exact path to your downloaded file
$archivePath = "C:\Users\joe\Downloads\android-v1.0.87.tar.gz"

# Check if file exists
if (-not (Test-Path $archivePath)) {
    Write-Host "❌ ERROR: Cannot find $archivePath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found archive: $archivePath" -ForegroundColor Green

# Extract to temp folder
Write-Host "📦 Extracting archive..." -ForegroundColor Cyan
$tempExtract = "$env:TEMP\android-extract"
if (Test-Path $tempExtract) {
    Remove-Item $tempExtract -Recurse -Force
}
New-Item -ItemType Directory -Path $tempExtract -Force | Out-Null

# Extract .tar.gz using Windows tar (built into Windows 10+)
tar -xzf $archivePath -C $tempExtract

# Check if extraction worked
if (-not (Test-Path "$tempExtract\android")) {
    Write-Host "❌ ERROR: Extraction failed - android folder not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Extracted successfully" -ForegroundColor Green

# Backup old android folder
if (Test-Path "android") {
    Write-Host "📁 Backing up old android folder..." -ForegroundColor Cyan
    $backupName = "android-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Rename-Item "android" $backupName
    Write-Host "✅ Old folder backed up as: $backupName" -ForegroundColor Green
}

# Move new android folder
Write-Host "📂 Installing new android folder..." -ForegroundColor Cyan
Move-Item "$tempExtract\android" "android"
Write-Host "✅ Android folder updated!" -ForegroundColor Green

# Clean up temp
Remove-Item $tempExtract -Recurse -Force

# Git operations
Write-Host ""
Write-Host "🔧 Preparing git commit..." -ForegroundColor Cyan
git add android/

Write-Host ""
git status --short

Write-Host ""
Write-Host "✅ DONE! Android folder replaced with complete Gradle build!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: git commit -m 'Add complete Android Gradle project for v1.0.87'" -ForegroundColor White
Write-Host "2. Run: git push origin replit-agent" -ForegroundColor White
Write-Host "3. Go to Codemagic and start android-release build" -ForegroundColor White
Write-Host "4. Your v1.0.87 AAB will build successfully! 🚀" -ForegroundColor Cyan
