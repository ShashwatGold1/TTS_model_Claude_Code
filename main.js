const { app, BrowserWindow, ipcMain, globalShortcut, clipboard, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Enable live reload for development
try {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
} catch (err) {
  // electron-reload not installed, skip
}

let mainWindow;
let floatingWindow;
let tray = null;
let isAlwaysOnTop = true;
let currentModel = 'amy';  // Currently selected model in UI (for display only)
let currentSpeed = 1.0;
let currentPitch = 1.0;
let defaultModel = 'amy';  // Default model for hotkey and speak button
let defaultSpeed = 1.0;
let defaultPitch = 1.0;
let piperProcess = null;
let audioPlayerProcess = null;
let userDataPath;
let settingsPath;

// Model configurations
const models = {
  // Open-source Piper TTS models
  lessac: {
    name: 'Lessac (Clear & Professional)',
    type: 'piper',
    path: 'models/en_US-lessac-high.onnx',
    config: 'models/en_US-lessac-high.onnx.json'
  },
  amy: {
    name: 'Amy (Natural & Warm)',
    type: 'piper',
    path: 'models/en_US-amy-medium.onnx',
    config: 'models/en_US-amy-medium.onnx.json'
  },
  ljspeech: {
    name: 'LJSpeech (Classic Female)',
    type: 'piper',
    path: 'models/en_US-ljspeech-high.onnx',
    config: 'models/en_US-ljspeech-high.onnx.json'
  },
  kathleen: {
    name: 'Kathleen (Expressive)',
    type: 'piper',
    path: 'models/en_US-kathleen-low.onnx',
    config: 'models/en_US-kathleen-low.onnx.json'
  },
  libritts: {
    name: 'LibriTTS Female (High Quality)',
    type: 'piper',
    path: 'models/en_US-libritts_r-medium.onnx',
    config: 'models/en_US-libritts_r-medium.onnx.json'
  },
  // Microsoft TTS voices
  zira: {
    name: 'Zira (Microsoft Female)',
    type: 'microsoft',
    voiceName: 'Microsoft Zira Desktop'
  },
  david: {
    name: 'David (Microsoft Male)',
    type: 'microsoft',
    voiceName: 'Microsoft David Desktop'
  },
  hazel: {
    name: 'Hazel (Microsoft Female)',
    type: 'microsoft',
    voiceName: 'Microsoft Hazel Desktop'
  }
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    title: 'TTS Voice',
    alwaysOnTop: isAlwaysOnTop,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false  // Fix DevTools fetch error
    },
    icon: path.join(__dirname, 'icon.png'),
    frame: false,  // Remove default frame for custom title bar
    resizable: true,
    minimizable: true,
    transparent: false,
    backgroundColor: '#2c3e50'
  });

  // Remove default menu bar
  mainWindow.setMenu(null);

  mainWindow.loadFile('index.html');

  // Enable DevTools with F12
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // Register global hotkey: Ctrl+Shift+S
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    if (mainWindow) {
      const clipboardText = clipboard.readText();
      if (clipboardText && clipboardText.trim()) {
        mainWindow.webContents.send('speak-clipboard', clipboardText);
      }
    } else {
      // App is closed - create hidden window and speak
      speakFromTray();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create floating window
function createFloatingWindow() {
  if (floatingWindow) {
    floatingWindow.show();
    floatingWindow.focus();
    return;
  }

  floatingWindow = new BrowserWindow({
    width: 200,
    height: 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    thickFrame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enablePreferredSizeMode: false
    }
  });

  floatingWindow.setBackgroundColor('#00000000');

  floatingWindow.loadFile('floating.html');

  floatingWindow.on('closed', () => {
    floatingWindow = null;
  });

  // Force window to redraw when ready to fix transparency
  floatingWindow.once('ready-to-show', () => {
    if (floatingWindow) {
      floatingWindow.show();
      // Trigger a resize to force proper transparency rendering
      setTimeout(() => {
        if (floatingWindow && !floatingWindow.isDestroyed()) {
          const bounds = floatingWindow.getBounds();
          floatingWindow.setBounds({ ...bounds, width: bounds.width + 1 });
          setTimeout(() => {
            if (floatingWindow && !floatingWindow.isDestroyed()) {
              floatingWindow.setBounds(bounds);
            }
          }, 10);
        }
      }, 100);
    }
  });

  // Refresh transparency when window is moved
  let moveTimeout;
  floatingWindow.on('move', () => {
    clearTimeout(moveTimeout);
    moveTimeout = setTimeout(() => {
      refreshFloatingWindow();
    }, 150);
  });

  // Refresh transparency when window gains or loses focus
  floatingWindow.on('focus', () => {
    setTimeout(() => {
      refreshFloatingWindow();
    }, 50);
  });

  floatingWindow.on('blur', () => {
    setTimeout(() => {
      refreshFloatingWindow();
    }, 50);
  });
}

// Helper function to refresh floating window transparency
function refreshFloatingWindow() {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    // Trigger a tiny resize to force Windows to redraw with proper transparency
    const bounds = floatingWindow.getBounds();
    floatingWindow.setBounds({ ...bounds, width: bounds.width + 1, height: bounds.height + 1 });
    setImmediate(() => {
      if (floatingWindow && !floatingWindow.isDestroyed()) {
        floatingWindow.setBounds(bounds);
      }
    });
  }
}

// Load settings from file
function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(data);
      defaultModel = settings.defaultModel || 'amy';
      defaultSpeed = settings.defaultSpeed || 1.0;
      defaultPitch = settings.defaultPitch || 1.0;
      currentModel = defaultModel;  // Initialize current to default
      currentSpeed = defaultSpeed;
      currentPitch = defaultPitch;
      return settings;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return { defaultModel: 'amy', defaultSpeed: 1.0, defaultPitch: 1.0 };
}

// Save settings to file
function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Create system tray
function createTray() {
  // TTS Voice logo from icon.png file
  const icon = nativeImage.createFromPath(path.join(__dirname, 'icon.png'));

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'TTS Voice',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Show Window',
      click: () => {
        if (mainWindow === null) {
          createWindow();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: `Default Voice: ${models[defaultModel]?.name || 'Amy'}`,
      enabled: false
    },
    {
      label: `Speed: ${defaultSpeed.toFixed(1)}x | Pitch: ${defaultPitch.toFixed(1)}x`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('TTS Voice - Ctrl+Shift+S to speak clipboard');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow === null) {
      createWindow();
    } else if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Speak from tray (when app window is closed)
async function speakFromTray() {
  const clipboardText = clipboard.readText();
  if (!clipboardText || !clipboardText.trim()) {
    return;
  }

  try {
    const model = models[defaultModel];
    if (!model) {
      console.error('Model not found:', defaultModel);
      return;
    }

    if (model.type === 'microsoft') {
      await speakWithMicrosoft(clipboardText, defaultModel, defaultSpeed, defaultPitch);
    } else {
      await speakWithPiper(clipboardText, defaultModel, defaultSpeed, defaultPitch);
    }
  } catch (error) {
    console.error('Error speaking from tray:', error);
  }
}

// Update tray menu with current settings
function updateTrayMenu() {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'TTS Voice',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Show Window',
      click: () => {
        if (mainWindow === null) {
          createWindow();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: `Default Voice: ${models[defaultModel]?.name || 'Amy'}`,
      enabled: false
    },
    {
      label: `Speed: ${defaultSpeed.toFixed(1)}x | Pitch: ${defaultPitch.toFixed(1)}x`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  // Initialize paths
  userDataPath = app.getPath('userData');
  settingsPath = path.join(userDataPath, 'settings.json');

  // Enable auto-start on Windows boot
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true,
    args: ['--hidden']
  });

  loadSettings();
  createTray();
  createFloatingWindow();  // Start floating window
  createWindow();  // Also start main window

  // Global hotkey: Ctrl+Shift+S
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    const clipboardText = clipboard.readText();
    if (clipboardText && clipboardText.trim()) {
      // Create floating window if it doesn't exist
      if (!floatingWindow) {
        createFloatingWindow();
      }

      // Show floating window and speak
      floatingWindow.show();
      floatingWindow.webContents.send('update-text-preview', clipboardText);

      // Speak with default model
      speakWithDefaultModel(clipboardText);
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit on window close - minimize to tray instead
  if (process.platform !== 'darwin') {
    // Keep app running in tray
  }
});

app.on('before-quit', () => {
  globalShortcut.unregisterAll();
  if (piperProcess) {
    piperProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.on('toggle-always-on-top', (event) => {
  isAlwaysOnTop = !isAlwaysOnTop;
  mainWindow.setAlwaysOnTop(isAlwaysOnTop);
  event.reply('always-on-top-status', isAlwaysOnTop);
});

ipcMain.on('get-models', (event) => {
  event.reply('models-list', models);
});

ipcMain.on('set-model', (event, modelKey) => {
  currentModel = modelKey;
  updateTrayMenu();
  event.reply('model-changed', modelKey);
});

// Set speed
ipcMain.on('set-speed', (event, speed) => {
  currentSpeed = speed;
});

// Set pitch
ipcMain.on('set-pitch', (event, pitch) => {
  currentPitch = pitch;
});

// Get default settings
ipcMain.on('get-default-settings', (event) => {
  const settings = {
    defaultModel: defaultModel,
    defaultSpeed: defaultSpeed,
    defaultPitch: defaultPitch
  };
  event.reply('default-settings', settings);
});

// Save default settings
ipcMain.on('save-default-settings', (event, settings) => {
  defaultModel = settings.defaultModel;
  defaultSpeed = settings.defaultSpeed;
  defaultPitch = settings.defaultPitch;
  saveSettings(settings);
  updateTrayMenu();
  event.reply('settings-saved');
});

ipcMain.on('speak-text', async (event, data) => {
  const text = typeof data === 'string' ? data : data.text;
  // Use CURRENT model and settings selected in sidebar (not default)
  const speed = currentSpeed;
  const pitch = currentPitch;

  if (!text || !text.trim()) {
    event.reply('speak-error', 'No text provided');
    return;
  }

  try {
    const model = models[currentModel];
    if (!model) {
      throw new Error('Model not found');
    }

    if (model.type === 'microsoft') {
      await speakWithMicrosoft(text, currentModel, speed, pitch);
    } else {
      await speakWithPiper(text, currentModel, speed, pitch);
    }

    event.reply('speak-complete');
    refreshFloatingWindow();
  } catch (error) {
    event.reply('speak-error', error.message);
    refreshFloatingWindow();
  }
});

// Speak with default model (for hotkey)
ipcMain.on('speak-with-default', async (event, data) => {
  const text = typeof data === 'string' ? data : data.text;
  // Use DEFAULT model and settings for hotkey
  const speed = defaultSpeed;
  const pitch = defaultPitch;

  if (!text || !text.trim()) {
    event.reply('speak-error', 'No text provided');
    return;
  }

  try {
    const model = models[defaultModel];
    if (!model) {
      throw new Error('Model not found');
    }

    if (model.type === 'microsoft') {
      await speakWithMicrosoft(text, defaultModel, speed, pitch);
    } else {
      await speakWithPiper(text, defaultModel, speed, pitch);
    }

    event.reply('speak-complete');
    refreshFloatingWindow();
  } catch (error) {
    event.reply('speak-error', error.message);
    refreshFloatingWindow();
  }
});

ipcMain.on('demo-voice', async (event, data) => {
  const modelKey = typeof data === 'string' ? data : data.modelKey;
  const speed = typeof data === 'object' ? (data.speed || 1.0) : 1.0;
  const pitch = typeof data === 'object' ? (data.pitch || 1.0) : 1.0;

  const demoText = "Hello! This is a demonstration of my voice. I hope you find my speech clear and natural.";
  try {
    const model = models[modelKey];
    if (!model) {
      throw new Error('Model not found');
    }

    if (model.type === 'microsoft') {
      await speakWithMicrosoft(demoText, modelKey, speed, pitch);
    } else {
      await speakWithPiper(demoText, modelKey, speed, pitch);
    }

    event.reply('demo-complete', modelKey);
    refreshFloatingWindow();
  } catch (error) {
    event.reply('demo-error', error.message);
    refreshFloatingWindow();
  }
});

ipcMain.on('stop-speech', (event) => {
  // Kill piper process
  if (piperProcess) {
    try {
      piperProcess.kill('SIGTERM');
    } catch (e) {
      console.log('Error killing piper process:', e);
    }
    piperProcess = null;
  }

  // Kill audio player process
  if (audioPlayerProcess) {
    try {
      audioPlayerProcess.kill('SIGTERM');
    } catch (e) {
      console.log('Error killing audio player:', e);
    }
    audioPlayerProcess = null;
  }

  event.reply('speech-stopped');
});

// Window control handlers
ipcMain.on('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Floating window IPC handlers
ipcMain.on('speak-from-floating', () => {
  const clipboardText = clipboard.readText();
  if (clipboardText && clipboardText.trim()) {
    speakWithDefaultModel(clipboardText);
  }
});

ipcMain.on('close-floating-window', () => {
  if (floatingWindow) {
    floatingWindow.close();
  }
});

ipcMain.on('open-main-window', () => {
  if (!mainWindow) {
    createWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.on('update-floating-size', (event, isVertical) => {
  if (floatingWindow) {
    if (isVertical) {
      floatingWindow.setSize(60, 200);
    } else {
      floatingWindow.setSize(200, 60);
    }
  }
});

ipcMain.on('theme-changed', (event, theme) => {
  if (floatingWindow) {
    floatingWindow.webContents.send('theme-changed', theme);
  }
});

ipcMain.on('invalidate-floating-window', () => {
  refreshFloatingWindow();
});

ipcMain.on('refresh-floating-transparency', () => {
  refreshFloatingWindow();
});

// Helper function to speak with default model and update floating window status
async function speakWithDefaultModel(text) {
  try {
    if (floatingWindow) {
      floatingWindow.webContents.send('speaking-status', true);
    }

    const model = models[defaultModel];
    if (model.type === 'microsoft') {
      await speakWithMicrosoft(text, defaultModel, defaultSpeed, defaultPitch);
    } else {
      await speakWithPiper(text, defaultModel, defaultSpeed, defaultPitch);
    }

    if (floatingWindow) {
      floatingWindow.webContents.send('speaking-status', false);
    }
  } catch (error) {
    console.error('Error speaking:', error);
    if (floatingWindow) {
      floatingWindow.webContents.send('speaking-status', false);
    }
  }
}

async function speakWithMicrosoft(text, modelKey, speed = 1.0, pitch = 1.0) {
  return new Promise((resolve, reject) => {
    const model = models[modelKey];
    if (!model) {
      reject(new Error('Model not found'));
      return;
    }

    const outputPath = path.join(app.getPath('temp'), 'tts_microsoft.wav');

    // Create PowerShell script to use System.Speech for TTS with speed and pitch
    const psScript = `
Add-Type -AssemblyName System.Speech
\$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
\$synth.SelectVoice('${model.voiceName}')
\$synth.Rate = [Math]::Round((${speed} - 1.0) * 10)
\$synth.SetOutputToWaveFile('${outputPath.replace(/\\/g, '\\\\')}')
\$synth.Speak('${text.replace(/'/g, "''")}')
\$synth.Dispose()
`;

    const ttsProcess = spawn('powershell', ['-Command', psScript]);

    let errorOutput = '';

    ttsProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ttsProcess.on('close', (code) => {
      if (code === 0) {
        // Apply pitch shift if needed, then play the audio
        applyPitchAndPlay(outputPath, pitch)
          .then(() => {
            // Clean up
            try {
              fs.unlinkSync(outputPath);
            } catch (e) {
              // Ignore cleanup errors
            }
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        reject(new Error(`Microsoft TTS failed with code ${code}: ${errorOutput}`));
      }
    });

    ttsProcess.on('error', (err) => {
      reject(err);
    });
  });
}

async function speakWithPiper(text, modelKey, speed = 1.0, pitch = 1.0) {
  return new Promise((resolve, reject) => {
    const model = models[modelKey];
    if (!model) {
      reject(new Error('Model not found'));
      return;
    }

    const modelPath = path.join(__dirname, model.path);
    const configPath = path.join(__dirname, model.config);
    const outputPath = path.join(app.getPath('temp'), 'tts_output.wav');
    const piperExe = path.join(__dirname, 'piper', 'piper.exe');

    // Check if model files exist
    if (!fs.existsSync(modelPath)) {
      reject(new Error(`Model file not found: ${modelPath}`));
      return;
    }

    if (!fs.existsSync(piperExe)) {
      reject(new Error('Piper executable not found. Please run setup.'));
      return;
    }

    // Kill existing process
    if (piperProcess) {
      piperProcess.kill();
    }

    // Build Piper TTS arguments with speed
    const args = [
      '--model', modelPath,
      '--config', configPath,
      '--output_file', outputPath
    ];

    // Add length scale for speed - Piper uses length_scale where higher = slower
    // So if user wants 2x speed, we use length_scale 0.5 (1.0 / 2.0)
    // If user wants 0.5x speed, we use length_scale 2.0 (1.0 / 0.5)
    const lengthScale = 1.0 / speed;
    args.push('--length_scale', String(lengthScale));

    // Run Piper TTS
    piperProcess = spawn(piperExe, args);

    // Send text to stdin
    piperProcess.stdin.write(text);
    piperProcess.stdin.end();

    let errorOutput = '';

    piperProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    piperProcess.on('close', (code) => {
      if (code === 0) {
        // Apply pitch shift if needed, then play the audio
        applyPitchAndPlay(outputPath, pitch)
          .then(() => {
            // Clean up
            try {
              fs.unlinkSync(outputPath);
            } catch (e) {
              // Ignore cleanup errors
            }
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

function applyPitchAndPlay(filePath, pitch) {
  return new Promise((resolve, reject) => {
    if (pitch === 1.0) {
      // No pitch change needed, just play
      playAudio(filePath)
        .then(resolve)
        .catch(reject);
    } else {
      // Apply pitch shift using PowerShell and play with adjusted playback rate
      // For pitch shifting, we'll use playback rate manipulation
      // pitch > 1.0 = higher pitch (faster playback simulation)
      // pitch < 1.0 = lower pitch (slower playback simulation)
      playAudioWithPitch(filePath, pitch)
        .then(resolve)
        .catch(reject);
    }
  });
}

async function playAudioWithPitch(filePath, pitch) {
  return new Promise(async (resolve, reject) => {
    try {
      // Apply pitch shift by resampling the audio
      const pitchShiftedPath = await resampleAudioForPitch(filePath, pitch);

      // Play the pitch-shifted audio
      await playAudio(pitchShiftedPath);

      // Clean up the temporary pitch-shifted file
      try {
        fs.unlinkSync(pitchShiftedPath);
      } catch (e) {
        // Ignore cleanup errors
      }

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

async function resampleAudioForPitch(inputPath, pitch) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(app.getPath('temp'), 'tts_pitched.wav');

    // Calculate semitones from pitch multiplier
    // pitch 2.0 = +12 semitones (1 octave up)
    // pitch 0.5 = -12 semitones (1 octave down)
    const semitones = 12 * Math.log2(pitch);

    // Use ffmpeg if available, otherwise use PowerShell to resample
    // For now, we'll use a NAudio-based PowerShell approach
    const psScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Runtime.InteropServices;

public class WaveFileProcessor {
    [StructLayout(LayoutKind.Sequential, Pack=1)]
    public struct WaveHeader {
        public uint ChunkID;
        public uint ChunkSize;
        public uint Format;
        public uint Subchunk1ID;
        public uint Subchunk1Size;
        public ushort AudioFormat;
        public ushort NumChannels;
        public uint SampleRate;
        public uint ByteRate;
        public ushort BlockAlign;
        public ushort BitsPerSample;
        public uint Subchunk2ID;
        public uint Subchunk2Size;
    }

    public static void ChangePitch(string inputPath, string outputPath, double pitchFactor) {
        byte[] inputData = File.ReadAllBytes(inputPath);

        // Parse header
        WaveHeader header;
        using (MemoryStream ms = new MemoryStream(inputData)) {
            using (BinaryReader reader = new BinaryReader(ms)) {
                header = new WaveHeader {
                    ChunkID = reader.ReadUInt32(),
                    ChunkSize = reader.ReadUInt32(),
                    Format = reader.ReadUInt32(),
                    Subchunk1ID = reader.ReadUInt32(),
                    Subchunk1Size = reader.ReadUInt32(),
                    AudioFormat = reader.ReadUInt16(),
                    NumChannels = reader.ReadUInt16(),
                    SampleRate = reader.ReadUInt32(),
                    ByteRate = reader.ReadUInt32(),
                    BlockAlign = reader.ReadUInt16(),
                    BitsPerSample = reader.ReadUInt16(),
                    Subchunk2ID = reader.ReadUInt32(),
                    Subchunk2Size = reader.ReadUInt32()
                };
            }
        }

        // Modify sample rate for pitch shift
        uint newSampleRate = (uint)(header.SampleRate * pitchFactor);

        using (MemoryStream ms = new MemoryStream()) {
            using (BinaryWriter writer = new BinaryWriter(ms)) {
                writer.Write(header.ChunkID);
                writer.Write(header.ChunkSize);
                writer.Write(header.Format);
                writer.Write(header.Subchunk1ID);
                writer.Write(header.Subchunk1Size);
                writer.Write(header.AudioFormat);
                writer.Write(header.NumChannels);
                writer.Write(newSampleRate);
                writer.Write((uint)(newSampleRate * header.NumChannels * header.BitsPerSample / 8));
                writer.Write(header.BlockAlign);
                writer.Write(header.BitsPerSample);
                writer.Write(header.Subchunk2ID);
                writer.Write(header.Subchunk2Size);

                // Copy audio data
                writer.Write(inputData, 44, inputData.Length - 44);

                File.WriteAllBytes(outputPath, ms.ToArray());
            }
        }
    }
}
"@

[WaveFileProcessor]::ChangePitch('${inputPath.replace(/\\/g, '\\\\')}', '${outputPath.replace(/\\/g, '\\\\')}', ${pitch})
`;

    const processor = spawn('powershell', ['-Command', psScript]);

    let errorOutput = '';
    processor.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    processor.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(outputPath);
      } else {
        reject(new Error(`Pitch shift failed: ${errorOutput}`));
      }
    });

    processor.on('error', (err) => {
      reject(err);
    });
  });
}

function playAudio(filePath) {
  return new Promise((resolve, reject) => {
    // Use Windows Media Player command line
    audioPlayerProcess = spawn('powershell', [
      '-c',
      `(New-Object Media.SoundPlayer '${filePath}').PlaySync()`
    ]);

    audioPlayerProcess.on('close', (code, signal) => {
      audioPlayerProcess = null;
      // Accept codes 0, 1, or null (killed by stop button)
      if (code === 0 || code === 1 || code === null || signal === 'SIGTERM') {
        resolve();
      } else {
        reject(new Error(`Audio playback failed with code ${code}`));
      }
    });

    audioPlayerProcess.on('error', (err) => {
      audioPlayerProcess = null;
      // Don't reject on error if it's just a kill operation
      resolve();
    });
  });
}
