# Building TTS Voice Installer

## Prerequisites
- Node.js and npm installed
- All dependencies installed (`npm install`)
- Models folder with TTS models
- Piper folder with piper.exe

## Build Commands

### Build Single EXE Installer (Recommended)
```bash
npm run build
```

This will create:
- **File**: `dist/TTS Voice Setup 1.0.0.exe`
- **Size**: ~150-300MB (depending on models)
- **Type**: Single installer file

### Build to Directory (for testing)
```bash
npm run build:dir
```

This creates an unpacked directory in `dist/win-unpacked/` for testing.

## What Gets Included

The installer includes:
- ✅ All JavaScript files (main.js, renderer.js, etc.)
- ✅ All HTML/CSS files
- ✅ All models from `models/` folder
- ✅ Piper executable from `piper/` folder
- ✅ Icons (icon.png, TTS_Voice.svg, etc.)
- ✅ All node_modules dependencies
- ❌ Development files (.claude, .git, *.md, etc.)

## Installer Features

When user runs the installer:
1. Shows installation wizard (not one-click)
2. Lets user choose installation directory
3. Creates desktop shortcut
4. Creates Start Menu shortcut
5. Adds to Windows Apps & Features (for uninstall)

## Output Location

After build completes:
- **Installer**: `dist/TTS Voice Setup 1.0.0.exe`
- **Unpacked files**: `dist/win-unpacked/` (for testing)
- **Build logs**: `dist/builder-debug.yml`

## Build Time

- First build: 3-5 minutes
- Subsequent builds: 1-2 minutes

## Troubleshooting

### Icon Issues
If icon doesn't show:
- Ensure `icon.png` is at least 256x256 pixels
- Or use `icon.ico` format

### Large File Size
If installer is too large:
- Check models folder (each model is ~50-100MB)
- Consider removing unused models
- Use compression (already enabled)

### Build Fails
- Run `npm install` again
- Delete `node_modules` and `dist` folders, reinstall
- Check that all required files exist

## Distribution

To share your app:
1. Find the installer: `dist/TTS Voice Setup 1.0.0.exe`
2. Upload to cloud storage or website
3. Users download and run the installer
4. That's it!

## Version Updates

To release a new version:
1. Update `version` in `package.json`
2. Run `npm run build`
3. New installer will have the new version number
