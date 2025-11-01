const { ipcRenderer } = require('electron');

// Web Speech API
const synth = window.speechSynthesis;
let voices = [];
let currentVoice = null;
let isSpeaking = false;
let currentUtterance = null;

// Female voices to use (will be populated from available system voices)
const femaleVoiceNames = [
    'Microsoft Zira', // Windows female
    'Microsoft Ana', // Spanish female
    'Google US English Female',
    'Google UK English Female',
    'Microsoft Heera' // Indian English female
];

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

// Initialize
function init() {
    // Wait for voices to be loaded
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
    }
    loadVoices();
    setupEventListeners();
}

function loadVoices() {
    voices = synth.getVoices();

    // Get ALL English voices - no filtering, no limits
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));

    if (englishVoices.length === 0) {
        showStatus('No voices available', 'error');
        return;
    }

    // Set first voice as default
    currentVoice = englishVoices[0];
    currentModelName.textContent = currentVoice.name;

    console.log('Total English voices found:', englishVoices.length);
    englishVoices.forEach((v, i) => console.log(`${i+1}. ${v.name} (${v.lang})`));

    // Render ALL voice list
    renderVoices(englishVoices);
}

function renderVoices(voiceList) {
    modelsList.innerHTML = '';

    voiceList.forEach((voice, index) => {
        const modelItem = document.createElement('div');
        modelItem.className = 'model-item';
        if (index === 0) modelItem.classList.add('active');
        modelItem.dataset.voiceName = voice.name;

        const displayName = voice.name.replace('Microsoft ', '').replace('Google ', '');

        modelItem.innerHTML = `
            <div class="model-name">${displayName}</div>
            <button class="demo-btn">Demo</button>
        `;

        const demoBtn = modelItem.querySelector('.demo-btn');
        demoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDemo(voice);
        });

        modelItem.addEventListener('click', () => {
            selectVoice(voice, modelItem);
        });

        modelsList.appendChild(modelItem);
    });
}

function selectVoice(voice, element) {
    currentVoice = voice;

    // Update UI
    document.querySelectorAll('.model-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');

    const displayName = voice.name.replace('Microsoft ', '').replace('Google ', '');
    currentModelName.textContent = displayName;
    showStatus('Voice changed', 'ready');
}

function handleDemo(voice) {
    const demoText = "Hello! This is a demonstration of my voice. I hope you find my speech clear and natural.";
    speakText(demoText, voice);
}

function setupEventListeners() {
    speakBtn.addEventListener('click', handleSpeak);
    stopBtn.addEventListener('click', handleStop);
    clearBtn.addEventListener('click', handleClear);
    getClipboardBtn.addEventListener('click', handleGetClipboard);
    alwaysOnTopBtn.addEventListener('click', handleAlwaysOnTop);
}

// Handle Speak
function handleSpeak() {
    const text = textInput.value.trim();
    if (!text) {
        showStatus('Please enter some text', 'error');
        return;
    }
    speakText(text, currentVoice);
}

function speakText(text, voice) {
    // Stop any ongoing speech
    if (isSpeaking) {
        synth.cancel();
    }

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.voice = voice;
    currentUtterance.rate = 1.0; // Normal speed
    currentUtterance.pitch = 1.0; // Normal pitch
    currentUtterance.volume = 1.0; // Full volume

    currentUtterance.onstart = () => {
        isSpeaking = true;
        updateUIForSpeaking(true);
        showStatus('Speaking...', 'speaking');
    };

    currentUtterance.onend = () => {
        isSpeaking = false;
        updateUIForSpeaking(false);
        showStatus('Speech completed', 'ready');
        currentUtterance = null;
    };

    currentUtterance.onerror = (event) => {
        isSpeaking = false;
        updateUIForSpeaking(false);
        showStatus(`Error: ${event.error}`, 'error');
        currentUtterance = null;
    };

    synth.speak(currentUtterance);
}

// Handle Stop
function handleStop() {
    synth.cancel();
    isSpeaking = false;
    updateUIForSpeaking(false);
    showStatus('Speech stopped', 'ready');
}

// Handle Clear
function handleClear() {
    textInput.value = '';
    textInput.focus();
}

// Handle Get Clipboard
function handleGetClipboard() {
    ipcRenderer.send('get-clipboard');
}

// Handle Always On Top
function handleAlwaysOnTop() {
    ipcRenderer.send('toggle-always-on-top');
}

// Update UI for speaking state
function updateUIForSpeaking(speaking) {
    isSpeaking = speaking;
    speakBtn.disabled = speaking;
    stopBtn.disabled = !speaking;
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
    textInput.value = text;
    speakText(text, currentVoice);
});

ipcRenderer.on('always-on-top-status', (event, isActive) => {
    if (isActive) {
        alwaysOnTopBtn.classList.add('active');
    } else {
        alwaysOnTopBtn.classList.remove('active');
    }
});

// Initialize app
init();
