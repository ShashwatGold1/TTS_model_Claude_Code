// Simple icon creator using the TTS Voice logo
// This creates a data URL from TTS_Voice.svg for system tray

const fs = require('fs');

// Create canvas-like structure
function createIconDataURL() {
    // Read TTS Voice logo from TTS_Voice.svg
    const svgContent = fs.readFileSync('TTS_Voice.svg', 'utf-8');
    const canvas = Buffer.from(svgContent);
    return 'data:image/svg+xml;base64,' + canvas.toString('base64');
}

console.log('Icon Data URL:');
console.log(createIconDataURL());
console.log('\nCopy this data URL to use in main.js for the tray icon');
