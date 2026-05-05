// --- Sectors view ---
// Three modes:
//   1. Study cards  – read-only reference for each sector with coloured number strip
//   2. Chunk drill  – ordered fill-in: given first N numbers of a sector, type the rest
//   3. Chain drill  – rapid-fire "what comes next?" on a specific sector

function renderSectors() {
  const content = document.querySelector("#content");
  content.innerHTML = `
    <div class="mode-label">Sectors</div>
    <div class="question">Learn the wheel in chunks</div>
    <p class="tiny">
      Dealers learn the wheel by memorising named sectors. Study each sector as a sequence,
      then drill it until the order is automatic.
    </p>

    <div class="grid" id="sectorCardList"></div>

    <h3 class="section-title" style="margin-top:20px;">Drills</h3>
    <div class="grid">
      <button class="option" id="drillChunk">Sector chunk drill — fill in the missing number in a sector run</button>
      <button class="option" id="drillChain">Chain drill — rapid-fire: what comes next in the sector?</button>
      <button class="primary"  id="drillMixed">Mixed sector Q&amp;A (15 questions)</button>
    </div>
  `;

  const list = document.querySelector("#sectorCardList");
  SECTORS.forEach(sector => {
    const card = document.createElement("div");
    card.className = "sector-card";
    card.style.borderColor = sector.color;
    card.innerHTML = `
      <div class="sector-card-header">
        <span class="sector-name" style="color:${sector.color}">${sector.name}</span>
        <span class="sector-meta">${sector.numbers.length} numbers · ${sector.chips} chips</span>
      </div>
      <div class="tiny" style="margin-bottom:8px;">${sector.description}</div>
      <div class="sector-sequence">
        ${sector.numbers.map(n => `<span class="num ${numColor(n)}">${n}</span>`).join("")}
      </div>
      <div class="tiny" style="margin-top:8px;color:var(--muted);">${sector.placement}</div>
    `;
    // speak button — captures sector in closure
    const s = sector;
    card.appendChild(makeSpeakButton("Read sequence", () =>
      `${s.name}. ${s.numbers.join(", ")}.`
    ));
    list.appendChild(card);
  });

  document.querySelector("#drillChunk").onclick = startChunkDrill;
  document.querySelector("#drillChain").onclick = startChainDrill;
  document.querySelector("#drillMixed").onclick = () => {
    startSession({
      title: "Sector Mixed Drill",
      type: "practice",
      lessonId: null,
      questions: makeQuestions(["sectors"], 15)
    });
  };
}

// --- Chunk drill ---
// Shows a sector's numbers with one blank in the middle, player must pick the correct one.

let chunkDrill = null;

function startChunkDrill() {
  const sector = rand(SECTORS);
  // pick a random interior position to blank out
  const blankPos = 1 + Math.floor(Math.random() * (sector.numbers.length - 2));
  const correct = sector.numbers[blankPos];

  chunkDrill = {
    sector,
    blankPos,
    correct,
    score: 0,
    rounds: 0,
    feedback: ""
  };

  renderChunkDrill();
}

function renderChunkDrill() {
  const content = document.querySelector("#content");
  const { sector, blankPos, correct } = chunkDrill;

  const distractors = sample(
    WHEEL.filter(n => n !== correct).map(String), 3
  );
  const options = shuffle([String(correct), ...distractors]);

  content.innerHTML = `
    <div class="mode-label">Chunk Drill · ${sector.name}</div>
    <div class="question">What number fills the gap?</div>

    <div class="sector-sequence" style="margin-bottom:20px;">
      ${sector.numbers.map((n, i) => {
        if (i === blankPos) {
          return `<span class="num blank-num">?</span>`;
        }
        return `<span class="num ${numColor(n)}">${n}</span>`;
      }).join("")}
    </div>

    <p class="tiny">Score this session: ${chunkDrill.score} / ${chunkDrill.rounds}</p>

    <div class="options" id="chunkOptions"></div>
    <div class="feedback neutral" id="chunkFeedback">${chunkDrill.feedback}</div>

    <div class="actions">
      <button class="ghost" id="chunkBack">Back to sectors</button>
    </div>
  `;

  const optWrap = document.querySelector("#chunkOptions");
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = opt;
    btn.onclick = () => answerChunkDrill(opt, btn, correct, sector);
    optWrap.appendChild(btn);
  });

  document.querySelector("#chunkBack").onclick = () => {
    chunkDrill = null;
    renderSectors();
  };
}

function answerChunkDrill(chosen, btn, correct, sector) {
  document.querySelectorAll("#chunkOptions .option").forEach(b => b.onclick = null);

  const ok = String(chosen) === String(correct);
  chunkDrill.rounds++;
  if (ok) chunkDrill.score++;

  document.querySelectorAll("#chunkOptions .option").forEach(b => {
    if (normalize(b.textContent) === normalize(String(correct))) b.classList.add("correct");
  });
  if (!ok) btn.classList.add("wrong");

  const fb = document.querySelector("#chunkFeedback");
  if (ok) {
    fb.className = "feedback good";
    fb.textContent = `Correct. Full sequence: ${sector.numbers.join(" → ")}`;
    state.xp += 3;
    state.dailyXp += 3;
    state.weakTopics.sectors = Math.max(0, (state.weakTopics.sectors || 0) - 1);
  } else {
    fb.className = "feedback bad";
    fb.textContent = `Not quite. The answer was ${correct}. Sequence: ${sector.numbers.join(" → ")}`;
    state.weakTopics.sectors = (state.weakTopics.sectors || 0) + 2;
    state.hearts = Math.max(0, state.hearts - 1);
  }
  studyStreakTick();
  saveState();
  updateStats();

  // auto-advance after a short pause
  setTimeout(() => {
    const newSector = rand(SECTORS);
    const blankPos = 1 + Math.floor(Math.random() * (newSector.numbers.length - 2));
    chunkDrill.sector = newSector;
    chunkDrill.blankPos = blankPos;
    chunkDrill.correct = newSector.numbers[blankPos];
    chunkDrill.feedback = "";
    renderChunkDrill();
  }, 1400);
}

// --- Chain drill ---
// Shows one number from a sector, player taps the next number in sequence.
// Builds a streak; wrong answer shows the correct next number and resets.

let chainDrill = null;

function startChainDrill() {
  pickNextChainRound();
}

function pickNextChainRound() {
  const sector = rand(SECTORS);
  const pos = Math.floor(Math.random() * (sector.numbers.length - 1));
  const current = sector.numbers[pos];
  const correct = sector.numbers[pos + 1];

  chainDrill = {
    sector,
    current,
    correct,
    streak: chainDrill ? chainDrill.streak : 0,
    best: chainDrill ? chainDrill.best : 0,
    feedback: ""
  };

  renderChainDrill();
}

function renderChainDrill() {
  const content = document.querySelector("#content");
  const { sector, current, correct } = chainDrill;

  const distractors = sample(
    WHEEL.filter(n => n !== correct).map(String), 3
  );
  const options = shuffle([String(correct), ...distractors]);

  content.innerHTML = `
    <div class="mode-label">Chain Drill · ${sector.name}</div>
    <div class="question" style="font-size:3rem;text-align:center;">${current}</div>
    <p class="tiny" style="text-align:center;">What comes next in <strong>${sector.name}</strong>?</p>

    <div style="display:flex;gap:16px;justify-content:center;margin-bottom:12px;">
      <div class="pill">Streak: <strong id="chainStreak">${chainDrill.streak}</strong></div>
      <div class="pill">Best: <strong id="chainBest">${chainDrill.best}</strong></div>
    </div>

    <div class="options" id="chainOptions"></div>
    <div class="feedback neutral" id="chainFeedback">${chainDrill.feedback}</div>

    <div class="actions">
      <button class="ghost" id="chainBack">Back to sectors</button>
    </div>
  `;

  const optWrap = document.querySelector("#chainOptions");
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = opt;
    btn.onclick = () => answerChainDrill(opt, btn, correct, sector);
    optWrap.appendChild(btn);
  });

  document.querySelector("#chainBack").onclick = () => {
    chainDrill = null;
    renderSectors();
  };
}

function answerChainDrill(chosen, btn, correct, sector) {
  document.querySelectorAll("#chainOptions .option").forEach(b => b.onclick = null);

  const ok = String(chosen) === String(correct);

  document.querySelectorAll("#chainOptions .option").forEach(b => {
    if (normalize(b.textContent) === normalize(String(correct))) b.classList.add("correct");
  });
  if (!ok) btn.classList.add("wrong");

  const fb = document.querySelector("#chainFeedback");

  if (ok) {
    chainDrill.streak++;
    if (chainDrill.streak > chainDrill.best) chainDrill.best = chainDrill.streak;
    fb.className = "feedback good";
    fb.textContent = `Correct! Streak: ${chainDrill.streak}`;
    state.xp += 2;
    state.dailyXp += 2;
    state.weakTopics.sectors = Math.max(0, (state.weakTopics.sectors || 0) - 1);
  } else {
    fb.className = "feedback bad";
    fb.textContent = `After ${current} comes ${correct} in ${sector.name}. Streak reset.`;
    chainDrill.streak = 0;
    state.weakTopics.sectors = (state.weakTopics.sectors || 0) + 2;
    state.hearts = Math.max(0, state.hearts - 1);
  }
  studyStreakTick();
  saveState();
  updateStats();

  setTimeout(pickNextChainRound, 1200);
}
