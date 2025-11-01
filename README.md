# Electron TTS Voice Assistant

A high-quality, offline Text-to-Speech application with 5 professional female voices running locally on your PC.

## Features

- **5 High-Quality Female Voices** (~1GB total)
  - Lessac (Clear & Professional) - 220MB
  - Amy (Natural & Warm) - 60MB
  - LJSpeech (Classic Female) - 200MB
  - Kathleen (Expressive) - 15MB
  - LibriTTS Female (High Quality) - 70MB

- **Clipboard Integration**
  - Hotkey: `Ctrl+Shift+S` to speak copied text
  - "Get from Clipboard" button

- **Voice Demo**
  - Test each voice before selecting
  - Click "Demo" button next to each model

- **Always On Top**
  - Pin button to keep window on top
  - Toggle on/off as needed

- **Clean Modern UI**
  - Minimal sidebar for voice selection
  - Large text input area
  - Real-time status indicators

- **100% Offline**
  - All processing happens locally
  - No internet required after setup
  - Complete privacy

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Download Piper TTS:**
   - Visit https://github.com/rhasspy/piper/releases
   - Download `piper_windows_amd64.zip`
   - Extract and copy `piper.exe` to `piper/` folder

3. **Download voice models:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File download_models.ps1
   ```

4. **Run the app:**
   ```bash
   npm start
   ```

## Detailed Setup

See [SETUP.md](SETUP.md) for complete installation instructions.

## Usage

1. **Select a Voice:** Click on any voice model in the left sidebar
2. **Demo Voices:** Click "Demo" button to hear each voice
3. **Enter Text:** Type or paste text in the main area
4. **Speak:** Click "Speak" button or use hotkey
5. **Clipboard:** Copy text anywhere, press `Ctrl+Shift+S`

## System Requirements

- Windows 10/11
- Node.js 16+
- 4GB RAM (8GB recommended)
- 1GB free disk space
- Audio output device

## Keyboard Shortcuts

- `Ctrl+Shift+S` - Speak copied text from clipboard

## Tech Stack

- Electron 28
- Piper TTS (Neural Text-to-Speech)
- ONNX Runtime
- Native Windows audio

## License

MIT

## Credits

- TTS Engine: [Piper TTS](https://github.com/rhasspy/piper) by Rhasspy
- Voice Models: [Piper Voices](https://huggingface.co/rhasspy/piper-voices)
