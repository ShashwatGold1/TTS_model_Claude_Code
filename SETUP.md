# TTS Model Setup Guide

## Overview
This guide will help you set up 5 high-quality female TTS voices (approximately 1GB total) for offline use.

## Prerequisites
- Node.js installed
- Windows OS
- Approximately 1GB free disk space

## Installation Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Download Piper TTS Engine
Download the Piper executable for Windows:
1. Visit: https://github.com/rhasspy/piper/releases
2. Download: `piper_windows_amd64.zip` (latest version)
3. Extract the ZIP file
4. Create a folder named `piper` in your project directory
5. Copy `piper.exe` from the extracted folder to the `piper` folder

### Step 3: Download Voice Models

Create a `models` folder in your project directory, then download these 5 high-quality female voice models:

#### 1. Lessac (Clear & Professional) - ~220MB
```bash
# Model file
https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx

# Config file
https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx.json
```

#### 2. Amy (Natural & Warm) - ~60MB
```bash
# Model file
https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx

# Config file
https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json
```

#### 3. LJSpeech (Classic Female) - ~200MB
```bash
# Model file
https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/high/en_US-ljspeech-high.onnx

# Config file
https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/high/en_US-ljspeech-high.onnx.json
```

#### 4. Kathleen (Expressive) - ~15MB
```bash
# Model file
https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kathleen/low/en_US-kathleen-low.onnx

# Config file
https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kathleen/low/en_US-kathleen-low.onnx.json
```

#### 5. LibriTTS Female (High Quality) - ~70MB
```bash
# Model file
https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx

# Config file
https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx.json
```

### Step 4: Automated Download Script

You can use this PowerShell script to download all models automatically:

```powershell
# Create models directory
New-Item -ItemType Directory -Force -Path "models"

# Download models
$models = @(
    @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx", "models/en_US-lessac-high.onnx"),
    @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx.json", "models/en_US-lessac-high.onnx.json"),
    @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx", "models/en_US-amy-medium.onnx"),
    @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json", "models/en_US-amy-medium.onnx.json"),
    @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/high/en_US-ljspeech-high.onnx", "models/en_US-ljspeech-high.onnx"),
    @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/high/en_US-ljspeech-high.onnx.json", "models/en_US-ljspeech-high.onnx.json"),
    @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kathleen/low/en_US-kathleen-low.onnx", "models/en_US-kathleen-low.onnx"),
    @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kathleen/low/en_US-kathleen-low.onnx.json", "models/en_US-kathleen-low.onnx.json"),
    @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx", "models/en_US-libritts_r-medium.onnx"),
    @("https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx.json", "models/en_US-libritts_r-medium.onnx.json")
)

foreach ($model in $models) {
    Write-Host "Downloading $($model[1])..."
    Invoke-WebRequest -Uri $model[0] -OutFile $model[1]
    Write-Host "Downloaded $($model[1])"
}

Write-Host "All models downloaded successfully!"
```

Save this as `download_models.ps1` and run it in PowerShell.

### Step 5: Verify Installation

Your project structure should look like this:
```
TTS_model/
├── piper/
│   └── piper.exe
├── models/
│   ├── en_US-lessac-high.onnx
│   ├── en_US-lessac-high.onnx.json
│   ├── en_US-amy-medium.onnx
│   ├── en_US-amy-medium.onnx.json
│   ├── en_US-ljspeech-high.onnx
│   ├── en_US-ljspeech-high.onnx.json
│   ├── en_US-kathleen-low.onnx
│   ├── en_US-kathleen-low.onnx.json
│   ├── en_US-libritts_r-medium.onnx
│   └── en_US-libritts_r-medium.onnx.json
├── main.js
├── index.html
├── styles.css
├── renderer.js
└── package.json
```

### Step 6: Run the Application
```bash
npm start
```

## Features

### 1. Voice Model Selection
- Click on any voice model in the sidebar to select it as default
- Click "Demo" button next to each model to hear a sample

### 2. Text-to-Speech
- Type or paste text in the main text area
- Click "Speak" button to convert text to speech
- Click "Stop" to interrupt ongoing speech

### 3. Clipboard Integration
- Click "Get from Clipboard" to load clipboard text
- Press **Ctrl+Shift+S** hotkey to speak copied text instantly

### 4. Always On Top
- Click the pin button (📌) in sidebar to toggle always-on-top mode
- Green color indicates active, gray indicates inactive

## Voice Characteristics

| Voice | Quality | Style | Size | Best For |
|-------|---------|-------|------|----------|
| Lessac | Very High | Professional, Clear | 220MB | Formal content, presentations |
| Amy | Medium | Natural, Warm | 60MB | General use, friendly tone |
| LJSpeech | Very High | Classic, Neutral | 200MB | Audiobooks, long content |
| Kathleen | Low | Expressive | 15MB | Quick tasks, lightweight |
| LibriTTS | Medium-High | Balanced | 70MB | Versatile, daily use |

## Troubleshooting

### Models not found error
- Ensure all .onnx and .onnx.json files are in the `models` folder
- Check file names match exactly as specified

### Piper executable not found
- Verify `piper.exe` exists in the `piper` folder
- Download from: https://github.com/rhasspy/piper/releases

### No audio playback
- Check system audio is working
- Ensure Windows Media Player components are installed

### Hotkey not working
- Check if another application is using Ctrl+Shift+S
- Try restarting the application

## Performance Notes
- First speech generation may take 2-3 seconds (model loading)
- Subsequent generations are much faster (0.5-1 second)
- All processing happens locally - no internet required after setup

## System Requirements
- Windows 10/11
- 4GB RAM minimum (8GB recommended)
- 1GB free disk space
- Audio output device
