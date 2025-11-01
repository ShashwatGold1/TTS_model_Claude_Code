const { ipcRenderer } = require('electron');

// Web Speech API
const synth = window.speechSynthesis;
let voices = [];
let currentVoice = null;
let isSpeaking = false;
let currentUtterance = null;

// Female voice priorities
const femaleVoicePriorities = [
    'zira', 'heera', 'susan', 'samantha', 'victoria', 'kate',
    'ana', 'paulina', 'female', 'woman'
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
    ipcRenderer.send('log', 'Initializing TTS Voice Assistant...');

    // Wait for voices to be loaded
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
    }

    // Try to load voices immediately
    setTimeout(() => {
        loadVoices();
    }, 100);

    setupEventListeners();
}

function loadVoices() {
    voices = synth.getVoices();

    if (voices.length === 0) {
        ipcRenderer.send('log', 'No voices loaded yet, waiting...');
        return;
    }

    ipcRenderer.send('log', `Found ${voices.length} total voices`);

    // Filter for English voices - SHOW ALL (no gender filtering)
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));

    // Score voices - prioritize female but include all
    const scoredVoices = englishVoices.map(voice => {
        const nameLower = voice.name.toLowerCase();
        let score = 50; // Default score for all voices

        // Boost female voices higher
        for (let i = 0; i < femaleVoicePriorities.length; i++) {
            if (nameLower.includes(femaleVoicePriorities[i])) {
                score = 100 - i; // Higher priority = higher score
                break;
            }
        }

        // Keep male voices but with lower priority
        if (nameLower.includes('male') || nameLower.includes('david') ||
            nameLower.includes('mark') || nameLower.includes('james')) {
            score = 30; // Lower but still included
        }

        return { voice, score };
    });

    // Sort by score (highest first, females on top, then males)
    scoredVoices.sort((a, b) => b.score - a.score);

    // Take ALL English voices (show everything available)
    const selectedVoices = scoredVoices.map(v => v.voice);

    if (selectedVoices.length === 0) {
        ipcRenderer.send('log', 'No suitable voices found');
        showStatus('No voices available', 'error');
        return;
    }

    // Log all selected voices
    selectedVoices.forEach((v, i) => {
        ipcRenderer.send('log', `Voice ${i + 1}: ${v.name} (${v.lang})`);
    });

    // Set first voice as default (should be highest scored female)
    currentVoice = selectedVoices[0];
    const displayName = getDisplayName(currentVoice.name);
    currentModelName.textContent = displayName;

    ipcRenderer.send('log', `Default voice: ${currentVoice.name}`);

    // Render voice list
    renderVoices(selectedVoices);
}

function getDisplayName(name) {
    return name
        .replace('Microsoft ', '')
        .replace('Google ', '')
        .replace(' - English (United States)', '')
        .replace(' - English (India)', '')
        .replace(' - English (United Kingdom)', '');
}

function renderVoices(voiceList) {
    modelsList.innerHTML = '';

    voiceList.forEach((voice, index) => {
        const modelItem = document.createElement('div');
        modelItem.className = 'model-item';
        if (index === 0) modelItem.classList.add('active');
        modelItem.dataset.voiceName = voice.name;

        const displayName = getDisplayName(voice.name);
        const lang = voice.lang;

        modelItem.innerHTML = `
            <div class="model-name">${displayName}<br><small style="opacity:0.7;font-size:11px;">${lang}</small></div>
            <button class="demo-btn">Demo</button>
        `;

        const demoBtn = modelItem.querySelector('.demo-btn');
        demoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDemo(voice, demoBtn);
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

    const displayName = getDisplayName(voice.name);
    currentModelName.textContent = displayName;
    showStatus('Voice changed', 'ready');

    ipcRenderer.send('log', `Voice changed to: ${voice.name}`);
}

function handleDemo(voice, btn) {
    btn.classList.add('playing');
    btn.textContent = 'Playing...';

    const demoText = "Hello! This is a demonstration of my voice. I hope you find my speech clear and natural.";

    speakText(demoText, voice, () => {
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

function speakText(text, voice, callback) {
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
        if (callback) callback();
    };

    currentUtterance.onerror = (event) => {
        isSpeaking = false;
        updateUIForSpeaking(false);
        showStatus(`Error: ${event.error}`, 'error');
        currentUtterance = null;
        if (callback) callback();
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
    if (text && text.trim()) {
        textInput.value = text;
        speakText(text, currentVoice);
        showStatus('Speaking clipboard text...', 'speaking');
    }
});

ipcRenderer.on('show-status', (event, message, type) => {
    showStatus(message, type);
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
