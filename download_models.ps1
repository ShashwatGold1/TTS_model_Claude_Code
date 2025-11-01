# Automated Model Downloader for TTS Application
# This script downloads all required voice models

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TTS Voice Models Downloader" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Create models directory if it doesn't exist
if (-not (Test-Path "models")) {
    Write-Host "Creating models directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path "models" | Out-Null
    Write-Host "Models directory created." -ForegroundColor Green
} else {
    Write-Host "Models directory already exists." -ForegroundColor Green
}

Write-Host ""

# Define models to download
$models = @(
    @{
        Name = "Lessac (Clear & Professional) - High Quality"
        Files = @(
            @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx", "models/en_US-lessac-high.onnx"),
            @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx.json", "models/en_US-lessac-high.onnx.json")
        )
    },
    @{
        Name = "Amy (Natural & Warm) - Medium Quality"
        Files = @(
            @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx", "models/en_US-amy-medium.onnx"),
            @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json", "models/en_US-amy-medium.onnx.json")
        )
    },
    @{
        Name = "LJSpeech (Classic Female) - High Quality"
        Files = @(
            @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/high/en_US-ljspeech-high.onnx", "models/en_US-ljspeech-high.onnx"),
            @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/high/en_US-ljspeech-high.onnx.json", "models/en_US-ljspeech-high.onnx.json")
        )
    },
    @{
        Name = "Kathleen (Expressive) - Low Quality"
        Files = @(
            @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kathleen/low/en_US-kathleen-low.onnx", "models/en_US-kathleen-low.onnx"),
            @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kathleen/low/en_US-kathleen-low.onnx.json", "models/en_US-kathleen-low.onnx.json")
        )
    },
    @{
        Name = "LibriTTS Female (High Quality) - Medium"
        Files = @(
            @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx", "models/en_US-libritts_r-medium.onnx"),
            @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx.json", "models/en_US-libritts_r-medium.onnx.json")
        )
    }
)

$totalModels = $models.Count
$currentModel = 0

foreach ($model in $models) {
    $currentModel++
    Write-Host "[$currentModel/$totalModels] Downloading: $($model.Name)" -ForegroundColor Cyan

    foreach ($file in $model.Files) {
        $url = $file[0]
        $output = $file[1]
        $fileName = Split-Path $output -Leaf

        # Check if file already exists
        if (Test-Path $output) {
            Write-Host "  ✓ $fileName already exists, skipping..." -ForegroundColor Yellow
            continue
        }

        try {
            Write-Host "  → Downloading $fileName..." -ForegroundColor Gray

            # Download with progress
            $ProgressPreference = 'SilentlyContinue'
            Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
            $ProgressPreference = 'Continue'

            # Verify file was downloaded
            if (Test-Path $output) {
                $fileSize = (Get-Item $output).Length / 1MB
                Write-Host "  ✓ Downloaded $fileName ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Failed to download $fileName" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "  ✗ Error downloading $fileName : $_" -ForegroundColor Red
        }
    }
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Download Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Check which models are complete
$completeModels = 0
$incompleteModels = 0

foreach ($model in $models) {
    $allFilesExist = $true
    foreach ($file in $model.Files) {
        if (-not (Test-Path $file[1])) {
            $allFilesExist = $false
            break
        }
    }

    if ($allFilesExist) {
        Write-Host "✓ $($model.Name)" -ForegroundColor Green
        $completeModels++
    } else {
        Write-Host "✗ $($model.Name) - Incomplete" -ForegroundColor Red
        $incompleteModels++
    }
}

Write-Host ""
Write-Host "Complete: $completeModels / $totalModels models" -ForegroundColor $(if ($completeModels -eq $totalModels) { "Green" } else { "Yellow" })

if ($incompleteModels -gt 0) {
    Write-Host ""
    Write-Host "Some models failed to download. Please run this script again." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "All models downloaded successfully!" -ForegroundColor Green
    Write-Host "You can now run npm start to launch the application." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
