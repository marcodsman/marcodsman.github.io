let session = null;
let currentQuestion = null;
let locked = false;

function startLesson(lesson) {
  startSession({
    title: lesson.title,
    type: "lesson",
    lessonId: lesson.id,
    questions: makeQuestions(lesson.topics, lesson.count)
  });
}

function startSession(nextSession) {
  session = { ...nextSession, index: 0, correct: 0, review: [] };
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  locked = false;
  currentQuestion = session.questions[session.index];
  const progress = Math.round((session.index / session.questions.length) * 100);
  const content = document.querySelector("#content");

  content.innerHTML = `
    <div class="mode-label">${session.title} · Question ${session.index + 1} of ${session.questions.length}</div>
    <div class="progress"><div class="bar" style="width:${progress}%"></div></div>
    <div style="height:16px"></div>
    <div class="question">${currentQuestion.prompt}</div>
    <div id="answerArea"></div>
    <div class="feedback neutral" id="feedback"></div>
    <div class="actions">
      <button class="primary hidden" id="nextButton">Next</button>
      <button class="ghost" id="quitButton">Quit</button>
    </div>
  `;

  document.querySelector("#quitButton").onclick = () => setView(view);
  document.querySelector("#nextButton").onclick = nextQuestion;

  // Speak button next to the question prompt
  const promptEl = content.querySelector(".question");
  const q = currentQuestion;
  promptEl.appendChild(makeSpeakButton("", () => q.prompt, "speak-btn-inline"));

  if (currentQuestion.type === "mc")   renderMc(currentQuestion);
  if (currentQuestion.type === "text") renderText(currentQuestion);
}

function renderMc(q) {
  const area = document.querySelector("#answerArea");
  const options = shuffle(unique([q.answer, ...q.options]).slice(0, 4));

  area.innerHTML = `<div class="options"></div>`;
  const wrap = area.querySelector(".options");

  options.forEach(option => {
    const button = document.createElement("button");
    button.className = "option";
    button.textContent = option;
    button.onclick = () => answerQuestion(option, button);
    wrap.appendChild(button);
  });
}

function renderText(q) {
  const area = document.querySelector("#answerArea");
  area.innerHTML = `
    <div class="answer-row">
      <input id="textAnswer" autocomplete="off" placeholder="Type your answer..." />
      <button id="checkButton">Check</button>
    </div>
    ${q.hint ? `<p class="tiny">${q.hint}</p>` : ""}
  `;

  const input = document.querySelector("#textAnswer");
  document.querySelector("#checkButton").onclick = () => answerQuestion(input.value, null);
  input.addEventListener("keydown", e => { if (e.key === "Enter") answerQuestion(input.value, null); });
  input.focus();
}

function answerQuestion(value, button) {
  if (locked) return;
  locked = true;

  const ok = checkAnswer(currentQuestion, value);
  const feedback = document.querySelector("#feedback");
  const nextButton = document.querySelector("#nextButton");

  if (currentQuestion.type === "mc") {
    document.querySelectorAll(".option").forEach(opt => {
      if (normalize(opt.textContent) === normalize(currentQuestion.answer)) opt.classList.add("correct");
    });
    if (!ok && button) button.classList.add("wrong");
  }

  if (ok) {
    session.correct++;
    feedback.className = "feedback good";
    feedback.textContent = currentQuestion.explanation
      ? `Correct. ${currentQuestion.explanation}`
      : "Correct.";
  } else {
    feedback.className = "feedback bad";
    feedback.textContent = currentQuestion.explanation
      ? `Not quite. Correct answer: ${currentQuestion.answer}. ${currentQuestion.explanation}`
      : `Not quite. Correct answer: ${currentQuestion.answer}.`;
  }

  recordAnswer(ok, currentQuestion);
  session.review.push({
    prompt: currentQuestion.prompt,
    answer: currentQuestion.answer,
    chosen: String(value),
    ok
  });

  nextButton.classList.remove("hidden");
  updateStats();
}

function checkAnswer(q, value) {
  if (q.check === "numberSet")      return sameNumberSet(value, q.answer);
  if (q.check === "numberSequence") return sameNumberSequence(value, q.answer);
  if (q.check === "number")         return Number(String(value).trim()) === Number(q.answer);

  const accepted = q.accepted || [q.answer];
  return accepted.some(answer => normalize(value) === normalize(answer));
}

function recordAnswer(ok, q) {
  state.answered++;

  if (ok) {
    state.correct++;
    state.xp += session.type === "mock" ? 1 : 5;
    state.dailyXp += session.type === "mock" ? 1 : 5;
    studyStreakTick();
    state.weakTopics[q.topic] = Math.max(0, (state.weakTopics[q.topic] || 0) - 1);
    state.weakQuestions[q.id] = Math.max(0, (state.weakQuestions[q.id] || 0) - 1);
  } else {
    state.weakTopics[q.topic] = (state.weakTopics[q.topic] || 0) + 2;
    state.weakQuestions[q.id] = (state.weakQuestions[q.id] || 0) + 2;
    if (session.type !== "mock") state.hearts = Math.max(0, state.hearts - 1);
  }

  srUpdate(q.id, ok);
  saveState();
}

function nextQuestion() {
  if (session.type !== "mock" && state.hearts <= 0) {
    renderOutOfHearts();
    return;
  }

  session.index++;
  if (session.index >= session.questions.length) {
    finishSession();
  } else {
    renderCurrentQuestion();
  }
}

function renderOutOfHearts() {
  const content = document.querySelector("#content");
  content.innerHTML = `
    <div class="mode-label">Out of hearts</div>
    <div class="question">Take a break or reset hearts</div>
    <p class="tiny">Hearts reset daily. You can also reset them now while studying.</p>
    <div class="actions">
      <button class="primary" id="resetHearts">Reset hearts</button>
      <button class="ghost" id="backLessons">Back to lessons</button>
    </div>
  `;

  document.querySelector("#resetHearts").onclick = () => {
    state.hearts = 5;
    saveState();
    updateStats();
    renderCurrentQuestion();
  };
  document.querySelector("#backLessons").onclick = () => setView("lessons");
}

function finishSession() {
  const percent = Math.round((session.correct / session.questions.length) * 100);
  const passed = percent >= 80;

  if (session.type === "lesson" && passed) {
    state.completed[session.lessonId] = true;
    state.xp += 20;
    state.dailyXp += 20;
    saveState();
  }

  const wrong = session.review.filter(item => !item.ok);
  const content = document.querySelector("#content");

  content.innerHTML = `
    <div class="mode-label">${session.title} complete</div>
    <div class="result">
      <div class="tiny">${session.correct} correct out of ${session.questions.length}</div>
      <div class="big" style="color:${passed ? "var(--green)" : "var(--red)"}">${percent}%</div>
      <div style="font-weight:950;">${passed ? "Passed" : "Keep practising"}</div>
    </div>

    <div style="height:16px"></div>

    <h2 class="section-title">Review</h2>
    <div class="grid" id="reviewList"></div>

    <div class="actions">
      <button class="primary" id="againButton">Practise again</button>
      <button class="ghost" id="homeButton">Back</button>
    </div>
  `;

  const reviewList = document.querySelector("#reviewList");

  if (!wrong.length) {
    reviewList.innerHTML = `<p class="tiny">Perfect round. Nice work.</p>`;
  } else {
    wrong.forEach(item => {
      const div = document.createElement("div");
      div.className = "lesson";
      div.innerHTML = `
        <div>
          <h3>${item.prompt}</h3>
          <p>Your answer: ${escapeHtml(item.chosen || "blank")}</p>
          <p>Correct: ${escapeHtml(item.answer)}</p>
        </div>
        <span class="badge">!</span>
      `;
      reviewList.appendChild(div);
    });
  }

  document.querySelector("#againButton").onclick = () => {
    startSession({
      title: session.title,
      type: session.type,
      lessonId: session.lessonId,
      questions: makeQuestions(
        session.questions.map(q => q.topic),
        session.questions.length
      )
    });
  };

  document.querySelector("#homeButton").onclick = () => setView(session.type === "mock" ? "mock" : "lessons");

  updateStats();
}
