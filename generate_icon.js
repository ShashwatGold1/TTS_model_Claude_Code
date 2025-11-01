// Generate icon.png from TTS_Voice.svg using sharp or built-in methods
const fs = require('fs');
const { spawn } = require('child_process');

console.log('Attempting to generate icon.png from TTS_Voice.svg...\n');

// Method 1: Try using Inkscape if available
function tryInkscape() {
    return new Promise((resolve, reject) => {
        const inkscape = spawn('inkscape', [
            'TTS_Voice.svg',
            '--export-type=png',
            '--export-filename=icon.png',
            '--export-width=256',
            '--export-height=256'
        ]);

        inkscape.on('close', (code) => {
            if (code === 0) {
                console.log('✓ Successfully created icon.png using Inkscape');
                resolve(true);
            } else {
                reject(new Error('Inkscape failed'));
            }
        });

        inkscape.on('error', () => {
            reject(new Error('Inkscape not found'));
        });
    });
}

// Method 2: Try using ImageMagick/convert if available
function tryImageMagick() {
    return new Promise((resolve, reject) => {
        const convert = spawn('magick', [
            'convert',
            'TTS_Voice.svg',
            '-resize',
            '256x256',
            'icon.png'
        ]);

        convert.on('close', (code) => {
            if (code === 0) {
                console.log('✓ Successfully created icon.png using ImageMagick');
                resolve(true);
            } else {
                reject(new Error('ImageMagick failed'));
            }
        });

        convert.on('error', () => {
            reject(new Error('ImageMagick not found'));
        });
    });
}

// Method 3: Instructions for manual conversion
function showManualInstructions() {
    console.log('\n⚠ Automatic conversion tools not available.\n');
    console.log('Please convert TTS_Voice.svg to icon.png manually using one of these methods:\n');
    console.log('METHOD 1 - Online Converter (Easiest):');
    console.log('  1. Open https://cloudconvert.com/svg-to-png');
    console.log('  2. Upload TTS_Voice.svg');
    console.log('  3. Set width and height to 256');
    console.log('  4. Download as icon.png\n');
    console.log('METHOD 2 - Inkscape:');
    console.log('  1. Install Inkscape from https://inkscape.org/');
    console.log('  2. Run: inkscape TTS_Voice.svg --export-type=png --export-filename=icon.png --export-width=256\n');
    console.log('METHOD 3 - Python:');
    console.log('  1. Install: pip install cairosvg');
    console.log('  2. Run: python create_icon.py\n');
}

// Try methods in sequence
async function generateIcon() {
    try {
        await tryInkscape();
    } catch (e1) {
        try {
            await tryImageMagick();
        } catch (e2) {
            showManualInstructions();
        }
    }
}

generateIcon();
