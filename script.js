let isListening = false;
let recognition = null;
let microphonePermissionGranted = false;

// Initialize speech recognition
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 3;
        recognition.serviceURI = '';

        recognition.onstart = function() {
            console.log('Speech recognition started');
            showStatus('🎤 Listening... Speak now!', 'listening');
            document.getElementById('speakBtn').classList.add('listening');
            document.getElementById('listeningIndicator').style.display = 'block';
            isListening = true;
        };

        recognition.onresult = function(event) {
            console.log('Speech recognition result:', event.results);
            const transcript = event.results[0][0].transcript;
            showStatus(`✅ You said: "${transcript}"`, 'success');
            const inputBox = document.getElementById('textInput');
            inputBox.value = transcript;
            processInput(transcript, false); // treat as text input for direct action
            inputBox.value = ''; // Clear the input box after processing
            hideListeningIndicator();
        };

        recognition.onerror = function(event) {
            console.log('Speech recognition error:', event.error);
            let errorMessage = 'Error occurred';
            switch(event.error) {
                case 'not-allowed':
                    errorMessage = 'Microphone access denied. Please allow microphone permission.';
                    break;
                case 'no-speech':
                    errorMessage = 'No speech detected. Please speak louder and try again.';
                    break;
                case 'network':
                    errorMessage = 'Network error. Please check your connection.';
                    break;
                case 'audio-capture':
                    errorMessage = 'No microphone found. Please check your microphone.';
                    break;
                case 'aborted':
                    errorMessage = 'Speech recognition was aborted.';
                    break;
                case 'service-not-allowed':
                    errorMessage = 'Speech recognition service not allowed.';
                    break;
                default:
                    errorMessage = 'Error: ' + event.error;
            }
            showStatus(errorMessage, 'error');
            stopListening();
        };

        recognition.onend = function() {
            console.log('Speech recognition ended');
            stopListening();
        };

        recognition.onaudiostart = function() {
            console.log('Audio capturing started');
        };

        recognition.onaudioend = function() {
            console.log('Audio capturing ended');
        };

        recognition.onsoundstart = function() {
            console.log('Sound detected');
        };

        recognition.onsoundend = function() {
            console.log('Sound ended');
        };

        recognition.onspeechstart = function() {
            console.log('Speech started');
        };

        recognition.onspeechend = function() {
            console.log('Speech ended');
        };

        showStatus('🎤 Voice recognition ready! Click the microphone button to speak.', 'info');
    } else {
        showStatus('❌ Speech recognition not supported in this browser. Please use Chrome.', 'error');
        document.getElementById('speakBtn').disabled = true;
    }
}

// Request microphone permission once and reuse it
async function requestMicrophonePermission() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        microphonePermissionGranted = true;
    } catch (err) {
        microphonePermissionGranted = false;
    }
}

function hideListeningIndicator() {
    document.getElementById('listeningIndicator').style.display = 'none';
}

function toggleListening() {
    if (!microphonePermissionGranted) {
        requestMicrophonePermission().then(() => {
            if (microphonePermissionGranted) {
                startListening();
            } else {
                showStatus('Microphone permission denied. Please allow access to use voice input.', 'error');
            }
        });
    } else {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }
}

function startListening() {
    if (recognition) {
        try {
            recognition.start();
        } catch (error) {
            console.log('Error starting recognition:', error);
            showStatus('⚠️ Error starting speech recognition. Please try again.', 'error');
        }
    } else {
        showStatus('⚠️ Speech recognition not available', 'error');
    }
}

function stopListening() {
    isListening = false;
    document.getElementById('speakBtn').classList.remove('listening');
    hideListeningIndicator();
    if (recognition) {
        try {
            recognition.stop();
        } catch (error) {
            console.log('Error stopping recognition:', error);
        }
    }
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    // Auto-hide success and info messages after 5 seconds
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        const input = document.getElementById('textInput');
        const text = input.value.trim();
        if (text) {
            processInput(text, false);
            input.value = '';
        }
    }
}

function addMessage(content, isUser = false) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.innerHTML = `${isUser ? '🧑‍💻' : '🤖'} ${content}`;
    messageDiv.appendChild(bubbleDiv);
    chatContainer.appendChild(messageDiv);
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function processInput(input, fromAudio = false) {
    addMessage(input, true);
    // Process the command
    const response = getRajeshResponse(input, fromAudio);
    addMessage(response, false);
}

function getRajeshResponse(command, fromAudio = false) {
    command = command.toLowerCase();
    if (command.includes('play')) {
        const song = command.replace('play', '').trim();
        if (song) {
            const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(song)}`;
            if (fromAudio) {
                return `🎵 <a href="${searchUrl}" target="_blank">Click here to open YouTube and play "${song}"</a>`;
            } else {
                window.open(searchUrl, '_blank');
                return `🎵 Opening YouTube to play "${song}"! The search results should open in a new tab.`;
            }
        } else {
            return "What song would you like me to play?";
        }
    }
    else if (command.includes('time')) {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        return `⏰ It's ${time}`;
    }
    else if (command.includes('joke')) {
        const jokes = [
            "Why don't scientists trust atoms? Because they make up everything! 😄",
            "Why did the scarecrow win an award? Because he was outstanding in his field! 😄",
            "Why don't eggs tell jokes? They'd crack each other up! 😄",
            "What do you call a fake noodle? An impasta! 😄",
            "Why did the math book look so sad? Because it had too many problems! 😄",
            "What do you call a bear with no teeth? A gummy bear! 😄",
            "Why don't skeletons fight each other? They don't have the guts! 😄",
            "What do you call a fish wearing a bowtie? So-fish-ticated! 😄",
            "Why did the cookie go to the doctor? Because it was feeling crumbly! 😄",
            "What do you call a can opener that doesn't work? A can't opener! 😄"
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
    }
    else if (command.includes('who is')) {
        const person = command.replace('who is', '').trim();
        if (person) {
            const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(person)}`;
            if (fromAudio) {
                return `🔍 <a href="${wikiUrl}" target="_blank">Click here to open Wikipedia for "${person}"</a>`;
            } else {
                window.open(wikiUrl, '_blank');
                return `🔍 Opening Wikipedia to search for "${person}"! The page should open in a new tab.`;
            }
        } else {
            return "Who would you like to know about?";
        }
    }
    else if (command.includes('gmail') || command.includes('email')) {
        const gmailUrl = 'https://mail.google.com';
        if (fromAudio) {
            return `📧 <a href="${gmailUrl}" target="_blank">Click here to open Gmail</a>`;
        } else {
            window.open(gmailUrl, '_blank');
            return `📧 Opening Gmail in a new tab!`;
        }
    }
    else if (command.includes('github')) {
        const githubUrl = 'https://github.com/KarriRajeshKumar';
        if (fromAudio) {
            return `🐙 <a href="${githubUrl}" target="_blank">Click here to open my GitHub profile</a>`;
        } else {
            window.open(githubUrl, '_blank');
            return `🐙 Opening my GitHub profile in a new tab!`;
        }
    }
    else if (command.includes('linkedin')) {
        const linkedinUrl = 'https://linkedin.com/in/karri-rajeshkumar-5200b7279';
        if (fromAudio) {
            return `💼 <a href="${linkedinUrl}" target="_blank">Click here to open my LinkedIn profile</a>`;
        } else {
            window.open(linkedinUrl, '_blank');
            return `💼 Opening my LinkedIn profile in a new tab!`;
        }
    }
    else if (command.includes('hello') || command.includes('hi')) {
        return "👋 Hello! How can I help you today?";
    }
    else if (command.includes('how are you')) {
        return "I'm doing great! Thanks for asking. How about you? 😊";
    }
    else if (command.includes('bye') || command.includes('goodbye')) {
        return "👋 Goodbye! Have a great day!";
    }
    else if (command.includes('thank')) {
        return "You're welcome! 😊 Is there anything else I can help you with?";
    }
    else if (command.trim()) {
        return "I heard you, but I don't understand that yet 😅 Try asking me to play music, tell a joke, or search for someone!";
    }
    return "";
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initSpeechRecognition();
    // Request microphone permission once on page load
    requestMicrophonePermission();
}); 