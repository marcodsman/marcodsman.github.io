// Web Speech API read-aloud helpers
// All functions are no-ops when the API is unavailable (e.g. some mobile browsers).

const SPEECH_AVAILABLE = "speechSynthesis" in window;

let currentUtterance = null;

function speak(text, { rate = 0.88, pitch = 1.0, onEnd = null } = {}) {
  if (!SPEECH_AVAILABLE) return;
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.rate  = rate;
  u.pitch = pitch;
  u.lang  = "en-GB";
  if (onEnd) u.onend = onEnd;
  currentUtterance = u;
  window.speechSynthesis.speak(u);
}

function stopSpeech() {
  if (!SPEECH_AVAILABLE) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

// Build a small speak button element.
// label: button text  |  getText: function returning the string to read
function makeSpeakButton(label, getText, extraClass = "") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `speak-btn ghost ${extraClass}`.trim();
  btn.title = "Read aloud";
  btn.innerHTML = `<span class="speak-icon">🔊</span> ${label}`;

  let speaking = false;

  btn.onclick = (e) => {
    e.stopPropagation();
    if (!SPEECH_AVAILABLE) {
      btn.textContent = "Speech not available";
      return;
    }
    if (speaking) {
      stopSpeech();
      speaking = false;
      btn.classList.remove("speaking");
      return;
    }
    speaking = true;
    btn.classList.add("speaking");
    speak(getText(), {
      onEnd: () => {
        speaking = false;
        btn.classList.remove("speaking");
      }
    });
  };

  if (!SPEECH_AVAILABLE) btn.disabled = true;
  return btn;
}

// Read a sector's number sequence aloud at a pace suitable for memorisation.
// Pauses between numbers help the listener absorb each one.
function speakSectorSequence(sector) {
  if (!SPEECH_AVAILABLE) return;
  // Build a text with commas so the TTS engine naturally pauses
  const text = `${sector.name}. ${sector.numbers.join(", ")}.`;
  speak(text, { rate: 0.72 });
}

// Read the full wheel sequence aloud.
function speakWheelSequence() {
  if (!SPEECH_AVAILABLE) return;
  const text = `Full wheel sequence. ${WHEEL.join(", ")}.`;
  speak(text, { rate: 0.72 });
}

// Read a question prompt aloud.
function speakPrompt(prompt) {
  // Strip any HTML tags that may be in the prompt string
  const plain = prompt.replace(/<[^>]+>/g, "");
  speak(plain, { rate: 0.92 });
}
