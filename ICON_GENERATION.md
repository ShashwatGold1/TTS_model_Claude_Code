# TTS Voice - Icon Generation Guide

This document explains how to generate the icon files for TTS Voice application.

## Icon Files

The project uses the official TTS Voice logo with a blue-to-purple gradient. The following icon files are available:

- `TTS_Voice.svg` - Original logo source file (256x256)
- `icon.svg` - Copy of TTS_Voice.svg for build process (256x256)
- `icon.png` - Application icon (generated from SVG)
- `icon.ico` - Windows executable icon (multi-resolution)

## Current Implementation

### Title Bar Logo
The title bar uses an embedded SVG logo defined in `index.html` (lines 14-27). The logo features:
- Blue to purple gradient (#0041FF to #B700FF)
- Microphone design with rounded corners
- Hand gesture accent
- Size: 24x24px displayed, 256x256 viewBox
- Crisp rendering at any scale

### System Tray Icon
The system tray uses an SVG-based icon embedded as a data URL in `main.js` at line 163.
The icon uses the same TTS_Voice.svg design for consistent branding.

## Generating PNG and ICO Files

### Method 1: Using Python (Recommended)

1. Install required packages:
```bash
pip install cairosvg pillow
```

2. Run the generation script:
```bash
python create_icon.py
```

This will create:
- `icon.png` (256x256)
- `icon_16.png`, `icon_32.png`, `icon_48.png`, etc.
- `icon.ico` (multi-resolution Windows icon)

### Method 2: Using Online Tools

1. Open `icon.svg` in a web browser
2. Use an online SVG to PNG converter:
   - [CloudConvert](https://cloudconvert.com/svg-to-png)
   - [Convertio](https://convertio.co/svg-png/)

3. For ICO files, use:
   - [ICO Convert](https://icoconvert.com/)
   - [ConvertICO](https://converticon.com/)

### Method 3: Using Inkscape

1. Install [Inkscape](https://inkscape.org/)
2. Open `icon.svg`
3. File → Export PNG Image
4. Set width/height to desired size (256, 512, etc.)
5. Export

## Icon Specifications

| Usage | Format | Size | Location |
|-------|--------|------|----------|
| Title Bar | SVG (embedded) | 24x24 | index.html |
| System Tray | SVG (data URL) | 256x256 | main.js |
| Windows Icon | ICO | Multi-size | icon.ico |
| App Icon | PNG | 256x256 | icon.png |
| Taskbar | PNG | 256x256 | icon.png |

## Building with Icons

When packaging the app with electron-builder, the icons will be automatically included. Add this to `package.json`:

```json
"build": {
  "appId": "com.ttsvoice.app",
  "productName": "TTS Voice",
  "win": {
    "icon": "icon.ico",
    "target": ["nsis", "portable"]
  },
  "mac": {
    "icon": "icon.icns"
  },
  "linux": {
    "icon": "icon.png"
  }
}
```

## Notes

- The icon uses the same purple gradient as the app theme
- All icons maintain consistent branding
- SVG source ensures scalability without quality loss
- The microphone symbol represents text-to-speech functionality
