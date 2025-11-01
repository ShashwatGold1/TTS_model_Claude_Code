const { ipcRenderer } = require('electron');

// Web Speech API for Windows voices
const synth = window.speechSynthesis;
let windowsVoices = [];
let piperVoices = [];
let allVoices = [];
let currentVoice = null;
let currentVoiceType = 'windows'; // 'windows' or 'piper'
let isSpeaking = false;
let currentUtterance = null;

// Voice settings
let voiceSpeed = 1.0;
let voicePitch = 1.0;
let defaultVoice = null;

// DOM Elements
const modelsList = document.getElementById('modelsList');
const textInput = document.getElementById('textInput');
const speakBtn = document.getElementById('speakBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const getClipboardBtn = document.getElementById('getClipboardBtn');
const alwaysOnTopBtn = document.getElementById('alwaysOnTopBtn');
const statusIndicator = document.getElementById('statusIndicator');
const currentModelName = document.getElementById('currentModelName');
const speedSlider = document.getElementById('speedSlider');
const pitchSlider = document.getElementById('pitchSlider');
const speedValue = document.getElementById('speedValue');
const pitchValue = document.getElementById('pitchValue');
const setDefaultBtn = document.getElementById('setDefaultBtn');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');

// Initialize
function init() {
    // Load saved settings
    loadSettings();

    // Load Windows voices
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadWindowsVoices;
    }
    loadWindowsVoices();

    // Load Piper voices
    loadPiperVoices();

    setupEventListeners();
}

function loadSettings() {
    // Load from localStorage
    const savedSpeed = localStorage.getItem('voiceSpeed');
    const savedPitch = localStorage.getItem('voicePitch');
    const savedDefaultVoice = localStorage.getItem('defaultVoice');

    if (savedSpeed) {
        voiceSpeed = parseFloat(savedSpeed);
        speedSlider.value = voiceSpeed;
        speedValue.textContent = voiceSpeed.toFixed(1);
    }

    if (savedPitch) {
        voicePitch = parseFloat(savedPitch);
        pitchSlider.value = voicePitch;
        pitchValue.textContent = voicePitch.toFixed(1);
    }

    if (savedDefaultVoice) {
        defaultVoice = JSON.parse(savedDefaultVoice);
    }
}

function saveSettings() {
    localStorage.setItem('voiceSpeed', voiceSpeed);
    localStorage.setItem('voicePitch', voicePitch);
    if (defaultVoice) {
        localStorage.setItem('defaultVoice', JSON.stringify(defaultVoice));
    }
}

function loadWindowsVoices() {
    windowsVoices = synth.getVoices().filter(v => v.lang.startsWith('en'));
    renderAllVoices();
}

function loadPiperVoices() {
    // Define available Piper models
    piperVoices = [
        { name: 'Amy (Piper - Natural & Warm)', key: 'amy', type: 'piper', size: '61 MB' },
        { name: 'Lessac (Piper - Professional)', key: 'lessac', type: 'piper', size: '220 MB' },
        { name: 'LJSpeech (Piper - Classic)', key: 'ljspeech', type: 'piper', size: '109 MB' },
        { name: 'Kathleen (Piper - Expressive)', key: 'kathleen', type: 'piper', size: '61 MB' },
        { name: 'LibriTTS (Piper - Balanced)', key: 'libritts', type: 'piper', size: '75 MB' }
    ];

    renderAllVoices();
}

function renderAllVoices() {
    if (windowsVoices.length === 0) return; // Wait for Windows voices to load

    allVoices = [];
    modelsList.innerHTML = '';

    // Add header for Windows voices
    const windowsHeader = document.createElement('div');
    windowsHeader.style.cssText = 'padding: 10px 20px; background: #1a252f; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #95a5a6;';
    windowsHeader.textContent = 'Windows Voices';
    modelsList.appendChild(windowsHeader);

    // Render Windows voices
    windowsVoices.forEach((voice, index) => {
        const voiceData = { voice, type: 'windows', name: voice.name };
        allVoices.push(voiceData);
        const modelItem = createVoiceItem(voiceData, index === 0);
        modelsList.appendChild(modelItem);
    });

    // Add header for Piper voices
    const piperHeader = document.createElement('div');
    piperHeader.style.cssText = 'padding: 10px 20px; background: #1a252f; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #95a5a6; margin-top: 10px;';
    piperHeader.textContent = 'Piper TTS (Open Source)';
    modelsList.appendChild(piperHeader);

    // Render Piper voices
    piperVoices.forEach((voice) => {
        allVoices.push(voice);
        const modelItem = createVoiceItem(voice, false);
        modelsList.appendChild(modelItem);
    });

    // Set first Windows voice as default
    if (windowsVoices.length > 0) {
        currentVoice = windowsVoices[0];
        currentVoiceType = 'windows';
        currentModelName.textContent = getDisplayName(currentVoice.name);
    }
}

function createVoiceItem(voiceData, isActive) {
    const modelItem = document.createElement('div');
    modelItem.className = 'model-item';
    if (isActive) modelItem.classList.add('active');

    const displayName = voiceData.type === 'windows'
        ? getDisplayName(voiceData.voice.name)
        : voiceData.name;

    const subtitle = voiceData.type === 'windows'
        ? `<small style="opacity:0.7;font-size:11px;">${voiceData.voice.lang}</small>`
        : `<small style="opacity:0.7;font-size:11px;">${voiceData.size}</small>`;

    modelItem.innerHTML = `
        <div class="model-name">${displayName}<br>${subtitle}</div>
        <button class="demo-btn">Demo</button>
    `;

    const demoBtn = modelItem.querySelector('.demo-btn');
    demoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDemo(voiceData, demoBtn);
    });

    modelItem.addEventListener('click', () => {
        selectVoice(voiceData, modelItem);
    });

    return modelItem;
}

function getDisplayName(name) {
    return name.replace('Microsoft ', '').replace('Google ', '').replace(' Desktop', '');
}

function selectVoice(voiceData, element) {
    currentVoice = voiceData.type === 'windows' ? voiceData.voice : voiceData;
    currentVoiceType = voiceData.type;

    // Update UI
    document.querySelectorAll('.model-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');

    const displayName = voiceData.type === 'windows'
        ? getDisplayName(voiceData.voice.name)
        : voiceData.name;
    currentModelName.textContent = displayName;
    showStatus('Voice changed', 'ready');
}

function handleDemo(voiceData, btn) {
    btn.classList.add('playing');
    btn.textContent = 'Playing...';

    const demoText = "Hello! This is a demonstration of my voice. I hope you find my speech clear and natural.";

    speakText(demoText, voiceData, () => {
        btn.classList.remove('playing');
        btn.textContent = 'Demo';
    });
}

function setupEventListeners() {
    speakBtn.addEventListener('click', handleSpeak);
    stopBtn.addEventListener('click', handleStop);
    clearBtn.addEventListener('click', handleClear);
    getClipboardBtn.addEventListener('click', handleGetClipboard);
    alwaysOnTopBtn.addEventListener('click', handleAlwaysOnTop);

    // Speed and pitch sliders - use both 'input' and 'change' events
    speedSlider.addEventListener('input', (e) => {
        voiceSpeed = parseFloat(e.target.value);
        speedValue.textContent = voiceSpeed.toFixed(1);
        console.log('Speed changed to:', voiceSpeed);
        saveSettings();
    });

    speedSlider.addEventListener('change', (e) => {
        voiceSpeed = parseFloat(e.target.value);
        speedValue.textContent = voiceSpeed.toFixed(1);
        console.log('Speed finalized at:', voiceSpeed);
        saveSettings();
    });

    pitchSlider.addEventListener('input', (e) => {
        voicePitch = parseFloat(e.target.value);
        pitchValue.textContent = voicePitch.toFixed(1);
        console.log('Pitch changed to:', voicePitch);
        saveSettings();
    });

    pitchSlider.addEventListener('change', (e) => {
        voicePitch = parseFloat(e.target.value);
        pitchValue.textContent = voicePitch.toFixed(1);
        console.log('Pitch finalized at:', voicePitch);
        saveSettings();
    });

    // Set as default voice
    setDefaultBtn.addEventListener('click', () => {
        defaultVoice = {
            voice: currentVoice,
            type: currentVoiceType,
            speed: voiceSpeed,
            pitch: voicePitch
        };
        saveSettings();
        showStatus('Default voice set!', 'ready');
    });

    // Reset settings
    resetSettingsBtn.addEventListener('click', () => {
        voiceSpeed = 1.0;
        voicePitch = 1.0;
        speedSlider.value = 1.0;
        pitchSlider.value = 1.0;
        speedValue.textContent = '1.0';
        pitchValue.textContent = '1.0';
        defaultVoice = null;
        localStorage.clear();
        showStatus('Settings reset!', 'ready');
    });
}

function handleSpeak() {
    const text = textInput.value.trim();
    if (!text) {
        showStatus('Please enter some text', 'error');
        return;
    }
    speakText(text, currentVoice);
}

function speakText(text, voiceData, callback) {
    if (isSpeaking) {
        synth.cancel();
        if (piperProcess) {
            ipcRenderer.send('stop-piper');
        }
    }

    const type = voiceData.type || currentVoiceType;

    if (type === 'windows') {
        speakWithWindows(text, voiceData.voice || voiceData, callback);
    } else {
        speakWithPiper(text, voiceData, callback);
    }
}

function speakWithWindows(text, voice, callback) {
    console.log('Speaking with speed:', voiceSpeed, 'pitch:', voicePitch);

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.voice = voice;
    currentUtterance.rate = voiceSpeed;
    currentUtterance.pitch = voicePitch;
    currentUtterance.volume = 1.0;

    console.log('Utterance rate:', currentUtterance.rate, 'pitch:', currentUtterance.pitch);

    currentUtterance.onstart = () => {
        isSpeaking = true;
        updateUIForSpeaking(true);
        showStatus('Speaking...', 'speaking');
    };

    currentUtterance.onend = () => {
        isSpeaking = false;
        updateUIForSpeaking(false);
        showStatus('Speech completed', 'ready');
        if (callback) callback();
    };

    currentUtterance.onerror = (event) => {
        isSpeaking = false;
        updateUIForSpeaking(false);
        showStatus(`Error: ${event.error}`, 'error');
        if (callback) callback();
    };

    synth.speak(currentUtterance);
}

function speakWithPiper(text, voiceData, callback) {
    isSpeaking = true;
    updateUIForSpeaking(true);
    showStatus('Generating speech with Piper...', 'speaking');

    ipcRenderer.send('speak-piper', text, voiceData.key);

    // Set timeout callback
    window.piperCallback = callback;
}

function handleStop() {
    synth.cancel();
    ipcRenderer.send('stop-piper');
    isSpeaking = false;
    updateUIForSpeaking(false);
    showStatus('Speech stopped', 'ready');
}

function handleClear() {
    textInput.value = '';
    textInput.focus();
}

function handleGetClipboard() {
    ipcRenderer.send('get-clipboard');
}

function handleAlwaysOnTop() {
    ipcRenderer.send('toggle-always-on-top');
}

function updateUIForSpeaking(speaking) {
    isSpeaking = speaking;
    speakBtn.disabled = speaking;
    stopBtn.disabled = !speaking;
    textInput.disabled = speaking;
}

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

// IPC Listeners
ipcRenderer.on('clipboard-text', (event, text) => {
    if (text && text.trim()) {
        textInput.value = text;
        showStatus('Clipboard text loaded', 'ready');
    } else {
        showStatus('Clipboard is empty', 'error');
    }
});

ipcRenderer.on('speak-clipboard', (event, text) => {
    if (text && text.trim()) {
        textInput.value = text;
        speakText(text, currentVoice);
    }
});

ipcRenderer.on('always-on-top-status', (event, isActive) => {
    if (isActive) {
        alwaysOnTopBtn.classList.add('active');
    } else {
        alwaysOnTopBtn.classList.remove('active');
    }
});

ipcRenderer.on('piper-complete', () => {
    isSpeaking = false;
    updateUIForSpeaking(false);
    showStatus('Speech completed', 'ready');
    if (window.piperCallback) {
        window.piperCallback();
        window.piperCallback = null;
    }
});

ipcRenderer.on('piper-error', (event, error) => {
    isSpeaking = false;
    updateUIForSpeaking(false);
    showStatus(`Piper error: ${error}`, 'error');
    if (window.piperCallback) {
        window.piperCallback();
        window.piperCallback = null;
    }
});

// Initialize app
init();
