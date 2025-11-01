const { ipcRenderer } = require('electron');

let models = {};
let currentModel = 'amy';
let isSpeaking = false;
let currentSpeed = 1.0;
let currentPitch = 1.0;
let defaultModel = 'amy';
let defaultSpeed = 1.0;
let defaultPitch = 1.0;

// DOM Elements
const modelsList = document.getElementById('modelsList');
const textInput = document.getElementById('textInput');
const speakStopBtn = document.getElementById('speakStopBtn');
const clearBtn = document.getElementById('clearBtn');
const alwaysOnTopBtn = document.getElementById('alwaysOnTopBtn');
const statusIndicator = document.getElementById('statusIndicator');
const speedSlider = document.getElementById('speedSlider');
const pitchSlider = document.getElementById('pitchSlider');
const speedValue = document.getElementById('speedValue');
const pitchValue = document.getElementById('pitchValue');
const minimizeBtn = document.getElementById('minimizeBtn');
const maximizeBtn = document.getElementById('maximizeBtn');
const closeBtn = document.getElementById('closeBtn');
const themeButtons = document.querySelectorAll('.theme-btn');
const setDefaultBtn = document.getElementById('setDefaultBtn');

// Initialize
function init() {
    ipcRenderer.send('get-models');
    ipcRenderer.send('get-default-settings');
    setupEventListeners();
    loadTheme();
}

function setupEventListeners() {
    speakStopBtn.addEventListener('click', handleSpeakStop);
    clearBtn.addEventListener('click', handleClear);
    alwaysOnTopBtn.addEventListener('click', handleAlwaysOnTop);

    // Speed and pitch sliders
    speedSlider.addEventListener('input', handleSpeedChange);
    pitchSlider.addEventListener('input', handlePitchChange);

    // Window controls
    minimizeBtn.addEventListener('click', () => {
        ipcRenderer.send('window-minimize');
    });
    maximizeBtn.addEventListener('click', () => {
        ipcRenderer.send('window-maximize');
    });
    closeBtn.addEventListener('click', () => {
        ipcRenderer.send('window-close');
    });

    // Theme buttons
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            applyTheme(theme);
            localStorage.setItem('tts-theme', theme);
            // Update active state
            themeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Set as default button
    setDefaultBtn.addEventListener('click', handleSetDefault);
}

// Handle Set as Default
function handleSetDefault() {
    const settings = {
        defaultModel: currentModel,
        defaultSpeed: currentSpeed,
        defaultPitch: currentPitch
    };

    ipcRenderer.send('save-default-settings', settings);

    // Visual feedback
    setDefaultBtn.textContent = '✓ Saved!';
    setDefaultBtn.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';

    setTimeout(() => {
        setDefaultBtn.textContent = '⭐ Set as Default';
        setDefaultBtn.style.background = '';
    }, 2000);
}

// Theme functions
function loadTheme() {
    const savedTheme = localStorage.getItem('tts-theme') || 'purple';
    applyTheme(savedTheme);
    // Set active state on the correct button
    themeButtons.forEach(btn => {
        if (btn.dataset.theme === savedTheme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
}

function handleSpeedChange(e) {
    currentSpeed = parseFloat(e.target.value);
    speedValue.textContent = currentSpeed.toFixed(1) + 'x';
    // Sync speed to main process
    ipcRenderer.send('set-speed', currentSpeed);
}

function handlePitchChange(e) {
    currentPitch = parseFloat(e.target.value);
    pitchValue.textContent = currentPitch.toFixed(1) + 'x';
    // Sync pitch to main process
    ipcRenderer.send('set-pitch', currentPitch);
}

// Handle Speak/Stop Toggle
function handleSpeakStop() {
    if (isSpeaking) {
        // Stop speaking
        ipcRenderer.send('stop-speech');
    } else {
        // Start speaking
        const text = textInput.value.trim();
        if (!text) {
            showStatus('Please enter some text', 'error');
            return;
        }
        speakText(text);
    }
}

function speakText(text) {
    isSpeaking = true;
    updateUIForSpeaking(true);
    showStatus('Speaking...', 'speaking');
    // Speak button always uses default settings
    ipcRenderer.send('speak-text', { text });
}

// Handle Clear
function handleClear() {
    textInput.value = '';
    textInput.focus();
}

// Handle Always On Top
function handleAlwaysOnTop() {
    ipcRenderer.send('toggle-always-on-top');
}

// Handle Demo
function handleDemo(modelKey) {
    const demoBtn = document.querySelector(`[data-model="${modelKey}"] .demo-btn`);
    if (demoBtn) {
        demoBtn.classList.add('playing');
        demoBtn.textContent = 'Playing...';
    }
    showStatus('Playing demo...', 'speaking');
    ipcRenderer.send('demo-voice', { modelKey, speed: currentSpeed, pitch: currentPitch });
}

// Handle Model Selection
function selectModel(modelKey) {
    currentModel = modelKey;
    ipcRenderer.send('set-model', modelKey);

    // Update UI - only visual selection in sidebar
    document.querySelectorAll('.model-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-model="${modelKey}"]`).classList.add('active');

    // Don't update banner - it should always show default model
    showStatus('Model selected for demo', 'ready');
}

// Update UI for speaking state
function updateUIForSpeaking(speaking) {
    isSpeaking = speaking;

    if (speaking) {
        speakStopBtn.classList.add('speaking');
        speakStopBtn.querySelector('.btn-icon').textContent = '⏹';
        speakStopBtn.title = 'Stop';
    } else {
        speakStopBtn.classList.remove('speaking');
        speakStopBtn.querySelector('.btn-icon').textContent = '▶';
        speakStopBtn.title = 'Speak';
    }

    textInput.disabled = speaking;
}

// Show status message
function showStatus(message, type = 'ready') {
    statusIndicator.textContent = message;
    statusIndicator.className = 'status-indicator';
    if (type !== 'ready') {
        statusIndicator.classList.add(type);
    }

    if (type === 'ready' || type === 'error') {
        setTimeout(() => {
            if (statusIndicator.textContent === message) {
                statusIndicator.textContent = 'Ready';
                statusIndicator.className = 'status-indicator';
            }
        }, 3000);
    }
}

// Render models list
function renderModels(modelsData) {
    models = modelsData;
    modelsList.innerHTML = '';

    // Separate models by type
    const piperModels = {};
    const microsoftModels = {};

    Object.keys(models).forEach(key => {
        if (models[key].type === 'microsoft') {
            microsoftModels[key] = models[key];
        } else {
            piperModels[key] = models[key];
        }
    });

    // Render Piper models section
    if (Object.keys(piperModels).length > 0) {
        const piperHeader = document.createElement('div');
        piperHeader.className = 'voice-section-header';
        piperHeader.textContent = 'Open-Source (Piper TTS)';
        modelsList.appendChild(piperHeader);

        Object.keys(piperModels).forEach((key) => {
            const model = piperModels[key];
            const modelItem = createModelItem(key, model);
            modelsList.appendChild(modelItem);
        });
    }

    // Render Microsoft models section
    if (Object.keys(microsoftModels).length > 0) {
        const msHeader = document.createElement('div');
        msHeader.className = 'voice-section-header';
        msHeader.textContent = 'Microsoft TTS';
        modelsList.appendChild(msHeader);

        Object.keys(microsoftModels).forEach((key) => {
            const model = microsoftModels[key];
            const modelItem = createModelItem(key, model);
            modelsList.appendChild(modelItem);
        });
    }
}

function createModelItem(key, model) {
    const modelItem = document.createElement('div');
    modelItem.className = 'model-item';
    // Show default model as active by default
    if (key === defaultModel) modelItem.classList.add('active');
    modelItem.dataset.model = key;

    const isDefault = key === defaultModel;

    modelItem.innerHTML = `
        <div class="model-info">
            <div class="model-name">${model.name}</div>
            ${isDefault ? `<div class="default-indicator">⭐ Default (${defaultSpeed.toFixed(1)}x / ${defaultPitch.toFixed(1)}x)</div>` : ''}
        </div>
        <button class="demo-btn" onclick="handleDemo('${key}')">Demo</button>
    `;

    modelItem.addEventListener('click', (e) => {
        if (!e.target.classList.contains('demo-btn')) {
            selectModel(key);
        }
    });

    return modelItem;
}

// IPC Listeners
ipcRenderer.on('models-list', (event, modelsData) => {
    renderModels(modelsData);
});

ipcRenderer.on('speak-complete', () => {
    updateUIForSpeaking(false);
    showStatus('Speech completed', 'ready');
});

ipcRenderer.on('speak-error', (event, error) => {
    updateUIForSpeaking(false);
    showStatus(`Error: ${error}`, 'error');
    console.error('Speech error:', error);
});

ipcRenderer.on('demo-complete', (event, modelKey) => {
    const demoBtn = document.querySelector(`[data-model="${modelKey}"] .demo-btn`);
    if (demoBtn) {
        demoBtn.classList.remove('playing');
        demoBtn.textContent = 'Demo';
    }
    showStatus('Demo completed', 'ready');
});

ipcRenderer.on('demo-error', (event, error) => {
    document.querySelectorAll('.demo-btn').forEach(btn => {
        btn.classList.remove('playing');
        btn.textContent = 'Demo';
    });
    showStatus(`Demo error: ${error}`, 'error');
});

ipcRenderer.on('speech-stopped', () => {
    updateUIForSpeaking(false);
    showStatus('Speech stopped', 'ready');
});

ipcRenderer.on('speak-clipboard', (event, text) => {
    textInput.value = text;
    // Use default model for hotkey
    isSpeaking = true;
    updateUIForSpeaking(true);
    showStatus('Speaking with default model...', 'speaking');
    ipcRenderer.send('speak-with-default', { text });
});

ipcRenderer.on('always-on-top-status', (event, isActive) => {
    if (isActive) {
        alwaysOnTopBtn.classList.add('active');
    } else {
        alwaysOnTopBtn.classList.remove('active');
    }
});

ipcRenderer.on('model-changed', (event, modelKey) => {
    currentModel = modelKey;
});

ipcRenderer.on('default-settings', (event, settings) => {
    // Store default settings
    defaultModel = settings.defaultModel;
    defaultSpeed = settings.defaultSpeed;
    defaultPitch = settings.defaultPitch;

    // Update sliders to show default values
    currentSpeed = defaultSpeed;
    currentPitch = defaultPitch;
    speedSlider.value = defaultSpeed;
    pitchSlider.value = defaultPitch;
    speedValue.textContent = defaultSpeed.toFixed(1) + 'x';
    pitchValue.textContent = defaultPitch.toFixed(1) + 'x';

    // Re-render models to show default badge
    renderModels(models);
});

ipcRenderer.on('settings-saved', () => {
    // Request updated default settings to refresh display
    ipcRenderer.send('get-default-settings');
});

// Make handleDemo globally accessible
window.handleDemo = handleDemo;

// Initialize app
init();
