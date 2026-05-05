const STORAGE_KEY = "rouletteTrainerV2";

const defaultState = {
  xp: 0,
  hearts: 5,
  streak: 0,
  lastStudyDay: "",
  dailyXp: 0,
  dailyDay: "",
  answered: 0,
  correct: 0,
  completed: {},
  weakTopics: {},
  weakQuestions: {},
  // per wheel-slot error counts: { [slotIndex]: errorCount }
  weakSlots: {},
  // per-sector drill completion tracking: { [sectorId]: { bankClears: n, blindClears: n } }
  sectorMastery: {},
  // SM-2 per-question records: { [id]: { interval, ef, due, lapses } }
  // interval = days until next review; ef = ease factor (>=1.3); due = ms timestamp
  sr: {}
};

let state = loadState();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? { ...defaultState, ...JSON.parse(saved) } : { ...defaultState };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function maintainDailyState() {
  const today = todayKey();
  if (state.dailyDay !== today) {
    state.dailyDay = today;
    state.dailyXp = 0;
    state.hearts = 5;
  }
  saveState();
}

function studyStreakTick() {
  const today = todayKey();
  if (state.lastStudyDay === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  state.streak = state.lastStudyDay === yesterdayKey ? state.streak + 1 : 1;
  state.lastStudyDay = today;
}

function updateStats() {
  maintainDailyState();

  const accuracy = state.answered ? Math.round((state.correct / state.answered) * 100) : 0;
  document.querySelector("#xp").textContent = state.xp;
  document.querySelector("#hearts").textContent = state.hearts;
  document.querySelector("#streak").textContent = state.streak;
  document.querySelector("#accuracy").textContent = `${accuracy}%`;

  const goal = 50;
  const percent = Math.min(100, Math.round((state.dailyXp / goal) * 100));
  document.querySelector("#dailyBar").style.width = `${percent}%`;
  document.querySelector("#dailyText").textContent = `${Math.min(state.dailyXp, goal)} / ${goal} XP`;
}

// --- pure helpers ---

function rand(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function unique(items) {
  return [...new Set(items.map(String))];
}

function sample(items, count) {
  return shuffle(items).slice(0, count);
}

function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[.,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function numbersFrom(text) {
  return String(text).match(/\d+/g)?.map(Number) || [];
}

function sameNumberSet(input, answer) {
  const a = numbersFrom(input).sort((x, y) => x - y).join(",");
  const b = numbersFrom(answer).sort((x, y) => x - y).join(",");
  return a === b && b.length > 0;
}

function sameNumberSequence(input, answer) {
  return numbersFrom(input).join(",") === numbersFrom(answer).join(",");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function topicLabel(topic) {
  return {
    payouts: "Payouts",
    maths: "Payout Maths",
    wheel: "Wheel Sequence",
    neighbours: "Neighbours",
    announced: "French Bets",
    callbets: "Call Bets",
    procedure: "Procedure",
    sectors: "Sectors"
  }[topic] || topic;
}

function numColor(n) {
  if (n === 0) return "zero";
  if (REDS.has(n)) return "red";
  return "";
}

// ---------------------------------------------------------------------------
// SM-2 spaced repetition
// ---------------------------------------------------------------------------
// grade: 0 = wrong, 1 = correct-but-hard, 2 = correct-easy
// We map session answers to: wrong→0, correct→1 (hard by default),
// and bump to 2 when the user has answered the same question correctly
// multiple times without a lapse.

function srGet(id) {
  return state.sr[id] || { interval: 0, ef: 2.5, due: 0, lapses: 0 };
}

function srUpdate(id, correct) {
  const r = srGet(id);
  const now = Date.now();

  if (!correct) {
    // Wrong answer: reset interval to 1 day, record lapse
    r.lapses = (r.lapses || 0) + 1;
    r.interval = 1;
    r.ef = Math.max(1.3, r.ef - 0.2);
    r.due = now + 1 * 60 * 60 * 1000; // due again in 1 hour (aggressive re-show)
  } else {
    // Correct: advance interval using SM-2 formula
    const grade = r.lapses > 0 ? 1 : 2; // be conservative after lapses
    if (r.interval === 0) {
      r.interval = 1;
    } else if (r.interval === 1) {
      r.interval = 6;
    } else {
      r.interval = Math.round(r.interval * r.ef);
    }
    r.ef = Math.max(1.3, r.ef + (0.1 - (5 - grade * 2.5) * (0.08 + (5 - grade * 2.5) * 0.02)));
    r.due = now + r.interval * 24 * 60 * 60 * 1000;
    if (r.lapses > 0) r.lapses = Math.max(0, r.lapses - 1);
  }

  state.sr[id] = r;
}

// Returns a weight (higher = show sooner) for a question given its SR record.
// Due/overdue questions get weight 100+; new questions get 10; well-learned get 1.
function srWeight(id) {
  const r = srGet(id);
  const now = Date.now();
  if (r.interval === 0) return 10;          // never seen
  if (now >= r.due)     return 100 + Math.floor((now - r.due) / 3600000); // overdue: +1 per hour late
  return 1;                                  // not yet due
}

// Build a weighted question list. Topics are sampled proportionally to SR weight.
// Returns `count` question objects, biased toward due/overdue items.
function makeWeightedQuestions(topicFn, questionIds, count) {
  // topicFn(id) → question object (called fresh each time so questions are varied)
  // We over-generate candidates, weight them, then pick top `count`.
  const pool = questionIds.map(id => ({ id, weight: srWeight(id) }));
  const total = pool.reduce((s, p) => s + p.weight, 0);

  const result = [];
  for (let i = 0; i < count; i++) {
    let r = Math.random() * total;
    for (const p of pool) {
      r -= p.weight;
      if (r <= 0) {
        result.push(topicFn(p.id));
        break;
      }
    }
    // fallback if floating point misses
    if (result.length < i + 1) result.push(topicFn(pool[0].id));
  }
  return result;
}
