let view = "lessons";

const content = document.querySelector("#content");
const tabs = document.querySelectorAll(".tab");

function setView(nextView) {
  view = nextView;
  session = null;
  currentQuestion = null;
  locked = false;
  wheelGame = null;
  chunkDrill = null;
  chainDrill = null;
  if (typeof colourDrill !== "undefined") colourDrill = null;
  if (typeof neighbourDrill !== "undefined") neighbourDrill = null;

  tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.view === view));

  if (view === "lessons")  renderLessons();
  if (view === "practice") renderPractice();
  if (view === "weak")     renderWeak();
  if (view === "mock")     renderMockStart();
  if (view === "wheel")     renderWheelTrainer();
  if (view === "sectors")   renderSectors();
  if (view === "reference") renderReference();

  updateStats();
}

function renderLessons() {
  content.innerHTML = `
    <div class="mode-label">Lessons</div>
    <div class="question">Choose a level</div>
    <div class="grid" id="lessonList"></div>
  `;

  const list = document.querySelector("#lessonList");

  LESSONS.forEach((lesson, index) => {
    const done = state.completed[lesson.id];
    const previousDone = index === 0 || state.completed[LESSONS[index - 1].id];
    const lockedLesson = !previousDone;

    const item = document.createElement("div");
    item.className = "lesson";
    item.innerHTML = `
      <div>
        <h3>${lesson.title}</h3>
        <p>${lesson.desc}</p>
      </div>
      <div style="display:grid;gap:8px;justify-items:end;">
        <span class="badge ${done ? "done" : ""}">${done ? "✓" : index + 1}</span>
        <button ${lockedLesson ? "disabled" : ""}>${done ? "Review" : "Start"}</button>
      </div>
    `;

    item.querySelector("button").onclick = () => startLesson(lesson);
    list.appendChild(item);
  });
}

function renderPractice() {
  content.innerHTML = `
    <div class="mode-label">Practice</div>
    <div class="question">What do you want to practise?</div>
    <div class="grid">
      <button class="option" data-topic="payouts">Payouts and bet coverage</button>
      <button class="option" data-topic="maths">Payout maths</button>
      <button class="option" data-topic="wheel">Wheel sequence</button>
      <button class="option" data-topic="neighbours">Wheel neighbours</button>
      <button class="option" data-topic="announced">French announced bets</button>
      <button class="option" data-topic="sectors">Sector knowledge</button>
      <button class="option" data-topic="callbets">Call bets (Finales)</button>
      <button class="option" data-topic="procedure">Table procedure</button>
      <button class="primary" data-topic="mixed">Mixed practice</button>
    </div>
  `;

  content.querySelectorAll("[data-topic]").forEach(button => {
    button.onclick = () => {
      const topic = button.dataset.topic;
      const topics = topic === "mixed"
        ? ["payouts", "maths", "wheel", "neighbours", "announced", "sectors", "callbets", "procedure"]
        : [topic];

      startSession({
        title: topic === "mixed" ? "Mixed Practice" : button.textContent,
        type: "practice",
        lessonId: null,
        questions: makeQuestions(topics, 15)
      });
    };
  });
}

function renderWeak() {
  const weakEntries = Object.entries(state.weakTopics).filter(([, count]) => count > 0);
  const totalWeak = weakEntries.reduce((sum, [, count]) => sum + count, 0);

  if (!weakEntries.length) {
    content.innerHTML = `
      <div class="mode-label">Weak Spots</div>
      <div class="question">No weak spots yet</div>
      <p class="tiny">When you get questions wrong, they will appear here for review.</p>
      <div class="actions">
        <button class="primary" id="startMixed">Start mixed practice</button>
      </div>
    `;
    document.querySelector("#startMixed").onclick = () => {
      startSession({
        title: "Mixed Practice",
        type: "practice",
        lessonId: null,
        questions: makeQuestions(["payouts", "maths", "wheel", "neighbours", "announced", "sectors", "callbets", "procedure"], 15)
      });
    };
    return;
  }

  const now = Date.now();
  const srDueCount = Object.values(state.sr).filter(r => now >= r.due && r.interval > 0).length;
  const srDueNote = srDueCount > 0
    ? `<span class="sr-due-badge">${srDueCount} card${srDueCount !== 1 ? "s" : ""} due for review</span>`
    : `<span class="sr-ok-badge">No cards overdue</span>`;

  content.innerHTML = `
    <div class="mode-label">Weak Spots</div>
    <div class="question">Review your weakest topics</div>
    <p class="tiny">Weakness score: ${totalWeak}. Correct answers reduce it. ${srDueNote}</p>
    <div class="grid" id="weakList"></div>
    <div class="actions">
      <button class="primary" id="startWeak">Review weak spots</button>
    </div>
  `;

  const list = document.querySelector("#weakList");
  weakEntries
    .sort((a, b) => b[1] - a[1])
    .forEach(([topic, count]) => {
      const div = document.createElement("div");
      div.className = "lesson";
      div.innerHTML = `
        <div>
          <h3>${topicLabel(topic)}</h3>
          <p>Weakness score: ${count}</p>
        </div>
        <span class="badge">${count}</span>
      `;
      list.appendChild(div);
    });

  document.querySelector("#startWeak").onclick = () => {
    // Build SR-weighted questions: gather all question IDs that have lapses,
    // then weight them so overdue ones appear most often.
    const dueIds = Object.entries(state.sr)
      .filter(([, r]) => r.lapses > 0 || Date.now() >= r.due)
      .sort(([, a], [, b]) => srWeight(b.id || "") - srWeight(a.id || ""))
      .map(([id]) => id);

    // Fall back to topic-based generation if no SR data yet
    if (dueIds.length === 0) {
      const topics = weakEntries
        .sort((a, b) => b[1] - a[1])
        .flatMap(([topic, count]) => Array.from({ length: Math.min(count, 5) }, () => topic));
      startSession({
        title: "Weak Spot Review",
        type: "weak",
        lessonId: null,
        questions: makeQuestions(topics, 15)
      });
      return;
    }

    // Weighted pick: overdue questions surface first
    const picked = [];
    const remaining = [...dueIds];
    for (let i = 0; i < Math.min(15, remaining.length * 3); i++) {
      const weights = remaining.map(id => srWeight(id));
      const total = weights.reduce((s, w) => s + w, 0);
      let r = Math.random() * total;
      for (let j = 0; j < remaining.length; j++) {
        r -= weights[j];
        if (r <= 0) { picked.push(remaining[j % remaining.length]); break; }
      }
      if (picked.length < i + 1) picked.push(remaining[0]);
    }

    // Re-generate the actual question objects by topic inference from id prefix
    const questions = picked.slice(0, 15).map(id => {
      const topic = id.split("-")[0];
      return makeQuestion(topic) || makeQuestion("wheel");
    });

    startSession({ title: "Weak Spot Review", type: "weak", lessonId: null, questions });
  };
}

function renderMockStart() {
  content.innerHTML = `
    <div class="mode-label">Mock Exam</div>
    <div class="question">Dealer knowledge test</div>
    <p class="tiny">
      30 questions covering all topics. Pass mark: 80%. Hearts are not used in mock exam mode.
      You will review your result at the end.
    </p>
    <div class="actions">
      <button class="primary" id="startMock">Start mock exam</button>
    </div>
  `;

  document.querySelector("#startMock").onclick = () => {
    startSession({
      title: "Mock Exam",
      type: "mock",
      lessonId: null,
      questions: makeQuestions(["payouts", "maths", "wheel", "neighbours", "announced", "sectors", "callbets", "procedure"], 30)
    });
  };
}

tabs.forEach(tab => {
  tab.onclick = () => setView(tab.dataset.view);
});

maintainDailyState();
updateStats();
renderLessons();
