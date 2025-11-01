const { app, BrowserWindow, ipcMain, globalShortcut, clipboard } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let isAlwaysOnTop = true;
let piperProcess = null;

// Piper model configurations
const piperModels = {
  amy: { path: 'models/en_US-amy-medium.onnx', config: 'models/en_US-amy-medium.onnx.json' },
  lessac: { path: 'models/en_US-lessac-high.onnx', config: 'models/en_US-lessac-high.onnx.json' },
  ljspeech: { path: 'models/en_US-ljspeech-high.onnx', config: 'models/en_US-ljspeech-high.onnx.json' },
  kathleen: { path: 'models/en_US-kathleen-low.onnx', config: 'models/en_US-kathleen-low.onnx.json' },
  libritts: { path: 'models/en_US-libritts_r-medium.onnx', config: 'models/en_US-libritts_r-medium.onnx.json' }
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    alwaysOnTop: isAlwaysOnTop,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: true,
    resizable: true,
    minimizable: true
  });

  mainWindow.loadFile('index_simple.html');

  // Register global hotkey: Ctrl+Shift+S
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    const clipboardText = clipboard.readText();
    if (clipboardText && clipboardText.trim()) {
      mainWindow.webContents.send('speak-clipboard', clipboardText);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

if (app) {
  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    globalShortcut.unregisterAll();
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
}

// IPC Handlers
ipcMain.on('toggle-always-on-top', (event) => {
  isAlwaysOnTop = !isAlwaysOnTop;
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(isAlwaysOnTop);
  }
  event.reply('always-on-top-status', isAlwaysOnTop);
});

ipcMain.on('get-clipboard', (event) => {
  const text = clipboard.readText();
  event.reply('clipboard-text', text);
});

// Piper TTS handlers
ipcMain.on('speak-piper', async (event, text, modelKey) => {
  try {
    await speakWithPiper(text, modelKey);
    event.reply('piper-complete');
  } catch (error) {
    event.reply('piper-error', error.message);
  }
});

ipcMain.on('stop-piper', () => {
  if (piperProcess) {
    piperProcess.kill();
    piperProcess = null;
  }
});

async function speakWithPiper(text, modelKey) {
  return new Promise((resolve, reject) => {
    const model = piperModels[modelKey];
    if (!model) {
      reject(new Error('Model not found: ' + modelKey));
      return;
    }

    const modelPath = path.join(__dirname, model.path);
    const configPath = path.join(__dirname, model.config);
    const outputPath = path.join(app.getPath('temp'), 'tts_output.wav');
    const piperExe = path.join(__dirname, 'piper', 'piper.exe');

    // Check if files exist
    if (!fs.existsSync(modelPath)) {
      reject(new Error(`Model file not found: ${modelPath}`));
      return;
    }

    if (!fs.existsSync(piperExe)) {
      reject(new Error('Piper executable not found'));
      return;
    }

    // Kill existing process
    if (piperProcess) {
      piperProcess.kill();
    }

    // Run Piper TTS
    piperProcess = spawn(piperExe, [
      '--model', modelPath,
      '--config', configPath,
      '--output_file', outputPath
    ]);

    // Send text to stdin
    piperProcess.stdin.write(text);
    piperProcess.stdin.end();

    let errorOutput = '';

    piperProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    piperProcess.on('close', (code) => {
      if (code === 0) {
        // Play the generated audio
        playAudio(outputPath)
          .then(() => {
            try {
              fs.unlinkSync(outputPath);
            } catch (e) {}
            piperProcess = null;
            resolve();
          })
          .catch((err) => {
            piperProcess = null;
            reject(err);
          });
      } else {
        piperProcess = null;
        reject(new Error(`Piper failed with code ${code}: ${errorOutput}`));
      }
    });

    piperProcess.on('error', (err) => {
      piperProcess = null;
      reject(err);
    });
  });
}

function playAudio(filePath) {
  return new Promise((resolve, reject) => {
    const player = spawn('powershell', [
      '-c',
      `(New-Object Media.SoundPlayer '${filePath}').PlaySync()`
    ]);

    player.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Audio playback failed with code ${code}`));
      }
    });

    player.on('error', (err) => {
      reject(err);
    });
  });
}
