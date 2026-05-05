let wheelGame = null;

// SVG dimensions (viewBox units)
const CX = 250, CY = 250, R_OUTER = 245, R_POCKET_OUTER = 220, R_POCKET_INNER = 130,
      R_NUM = 178, R_SEPARATOR = 222, R_INNER_RING = 128, R_HUB = 72;

function pocketColor(n) {
  if (n === 0)       return "#0a7a42";
  if (REDS.has(n))   return "#9b1521";
  return "#1a1a1a";
}

function polarToXY(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function wedgePath(cx, cy, r1, r2, startDeg, endDeg) {
  const [x1, y1] = polarToXY(cx, cy, r2, startDeg);
  const [x2, y2] = polarToXY(cx, cy, r2, endDeg);
  const [x3, y3] = polarToXY(cx, cy, r1, endDeg);
  const [x4, y4] = polarToXY(cx, cy, r1, startDeg);
  const largeArc = (endDeg - startDeg) > 180 ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${r2} ${r2} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${r1} ${r1} 0 ${largeArc} 0 ${x4} ${y4}`,
    "Z"
  ].join(" ");
}

function drawCircularWheel({ missingSlots = [], filled = {}, targetIndex = null, highlightNumbers = [], showSectorColors = false }) {
  const wrap = document.querySelector("#circleWheel");
  if (!wrap) return;

  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 500 500");
  svg.setAttribute("class", "roulette-wheel-svg");
  svg.setAttribute("xmlns", NS);

  const defs = document.createElementNS(NS, "defs");

  const rimGrad = document.createElementNS(NS, "radialGradient");
  rimGrad.id = "rimGrad";
  rimGrad.innerHTML = `
    <stop offset="0%"   stop-color="#a06820"/>
    <stop offset="45%"  stop-color="#7a4e14"/>
    <stop offset="100%" stop-color="#3d2408"/>
  `;
  defs.appendChild(rimGrad);

  const hubGrad = document.createElementNS(NS, "radialGradient");
  hubGrad.id = "hubGrad";
  hubGrad.innerHTML = `
    <stop offset="0%"   stop-color="#245c38"/>
    <stop offset="70%"  stop-color="#122e1c"/>
    <stop offset="100%" stop-color="#080f0b"/>
  `;
  defs.appendChild(hubGrad);

  const sheen = document.createElementNS(NS, "radialGradient");
  sheen.id = "pocketSheen";
  sheen.setAttribute("cx", "50%"); sheen.setAttribute("cy", "30%");
  sheen.setAttribute("r", "60%");
  sheen.innerHTML = `
    <stop offset="0%"  stop-color="rgba(255,255,255,0.07)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
  `;
  defs.appendChild(sheen);

  const hatch = document.createElementNS(NS, "pattern");
  hatch.id = "hatch"; hatch.setAttribute("patternUnits","userSpaceOnUse");
  hatch.setAttribute("width","8"); hatch.setAttribute("height","8");
  hatch.setAttribute("patternTransform","rotate(45)");
  const hatchLine = document.createElementNS(NS, "line");
  hatchLine.setAttribute("x1","0"); hatchLine.setAttribute("y1","0");
  hatchLine.setAttribute("x2","0"); hatchLine.setAttribute("y2","8");
  hatchLine.setAttribute("stroke","rgba(255,209,102,0.25)"); hatchLine.setAttribute("stroke-width","3");
  hatch.appendChild(hatchLine);
  defs.appendChild(hatch);

  svg.appendChild(defs);

  const rim = document.createElementNS(NS, "circle");
  rim.setAttribute("cx", CX); rim.setAttribute("cy", CY); rim.setAttribute("r", R_OUTER);
  rim.setAttribute("fill", "url(#rimGrad)");
  rim.setAttribute("stroke", "#5a3a0a"); rim.setAttribute("stroke-width", "3");
  svg.appendChild(rim);

  const sepOuter = document.createElementNS(NS, "circle");
  sepOuter.setAttribute("cx", CX); sepOuter.setAttribute("cy", CY); sepOuter.setAttribute("r", R_POCKET_OUTER + 4);
  sepOuter.setAttribute("fill", "none");
  sepOuter.setAttribute("stroke", "#c8962a"); sepOuter.setAttribute("stroke-width", "3");
  svg.appendChild(sepOuter);

  const sepInner = document.createElementNS(NS, "circle");
  sepInner.setAttribute("cx", CX); sepInner.setAttribute("cy", CY); sepInner.setAttribute("r", R_POCKET_INNER - 2);
  sepInner.setAttribute("fill", "none");
  sepInner.setAttribute("stroke", "#c8962a"); sepInner.setAttribute("stroke-width", "2.5");
  svg.appendChild(sepInner);

  const totalPockets = WHEEL.length;
  const degPerPocket = 360 / totalPockets;

  WHEEL.forEach((n, index) => {
    const startDeg = index * degPerPocket - degPerPocket / 2;
    const endDeg   = startDeg + degPerPocket;
    const midDeg   = startDeg + degPerPocket / 2;

    const isMissing = missingSlots.includes(index);
    const filledNum = filled[index];
    const isBlank   = isMissing && filledNum === undefined;
    const isFilled  = isMissing && filledNum !== undefined;
    const isTarget  = targetIndex === index;
    const isHot     = highlightNumbers.includes(n);
    const displayN  = isMissing ? filledNum : n;

    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", [
      "pocket",
      isBlank  ? "blank"  : "",
      isFilled ? "filled" : "",
      isTarget ? "target" : "",
      isHot    ? "hot"    : ""
    ].filter(Boolean).join(" "));

    const path = document.createElementNS(NS, "path");
    path.setAttribute("class", "pocket-bg");
    path.setAttribute("d", wedgePath(CX, CY, R_POCKET_INNER, R_POCKET_OUTER, startDeg, endDeg));

    if (isBlank) {
      path.setAttribute("fill", "#1e3828");
    } else if (isHot || showSectorColors) {
      const sector = SECTORS.find(s => s.numbers.includes(n));
      path.setAttribute("fill", sector ? sector.color + "cc" : pocketColor(n));
    } else {
      path.setAttribute("fill", pocketColor(n));
    }

    path.setAttribute("stroke", "#0a0a0a");
    path.setAttribute("stroke-width", "1");
    g.appendChild(path);

    if (isBlank) {
      const hatchPath = document.createElementNS(NS, "path");
      hatchPath.setAttribute("d", wedgePath(CX, CY, R_POCKET_INNER, R_POCKET_OUTER, startDeg, endDeg));
      hatchPath.setAttribute("fill", "url(#hatch)");
      hatchPath.setAttribute("stroke", "none");
      g.appendChild(hatchPath);
    }

    if (isFilled || isTarget) {
      const accent = document.createElementNS(NS, "path");
      accent.setAttribute("d", wedgePath(CX, CY, R_POCKET_INNER, R_POCKET_OUTER, startDeg, endDeg));
      accent.setAttribute("fill", "none");
      accent.setAttribute("stroke", isTarget ? "#58a6ff" : "#20c875");
      accent.setAttribute("stroke-width", "3");
      g.appendChild(accent);
    }

    const [lx, ly] = polarToXY(CX, CY, R_NUM, midDeg);
    const text = document.createElementNS(NS, "text");
    text.setAttribute("class", `pocket-label${n === 0 ? " zero-label" : ""}`);
    text.setAttribute("x", lx);
    text.setAttribute("y", ly);
    text.setAttribute("transform", `rotate(${midDeg}, ${lx}, ${ly})`);

    if (isBlank) {
      text.textContent = "?";
      text.setAttribute("fill", "#ffd166");
      text.setAttribute("font-size", "13");
    } else {
      text.textContent = displayN !== undefined ? displayN : "";
    }
    g.appendChild(text);

    if (isBlank && wheelGame) {
      const hitArea = document.createElementNS(NS, "path");
      hitArea.setAttribute("d", wedgePath(CX, CY, R_POCKET_INNER, R_POCKET_OUTER, startDeg, endDeg));
      hitArea.setAttribute("fill", "transparent");
      hitArea.setAttribute("stroke", "none");
      hitArea.addEventListener("click", () => placeSelectedNumber(index));
      hitArea.style.cursor = "pointer";
      g.appendChild(hitArea);
    }

    svg.appendChild(g);
  });

  const sheenCircle = document.createElementNS(NS, "circle");
  sheenCircle.setAttribute("cx", CX); sheenCircle.setAttribute("cy", CY); sheenCircle.setAttribute("r", R_POCKET_OUTER);
  sheenCircle.setAttribute("fill", "url(#pocketSheen)");
  sheenCircle.setAttribute("pointer-events", "none");
  svg.appendChild(sheenCircle);

  const bowl = document.createElementNS(NS, "circle");
  bowl.setAttribute("cx", CX); bowl.setAttribute("cy", CY); bowl.setAttribute("r", R_POCKET_INNER - 3);
  bowl.setAttribute("fill", "#0d2018");
  bowl.setAttribute("stroke", "#c8962a"); bowl.setAttribute("stroke-width", "2");
  svg.appendChild(bowl);

  const hub = document.createElementNS(NS, "circle");
  hub.setAttribute("cx", CX); hub.setAttribute("cy", CY); hub.setAttribute("r", R_HUB);
  hub.setAttribute("fill", "url(#hubGrad)");
  hub.setAttribute("stroke", "#c8962a"); hub.setAttribute("stroke-width", "2.5");
  svg.appendChild(hub);

  const hubRing = document.createElementNS(NS, "circle");
  hubRing.setAttribute("cx", CX); hubRing.setAttribute("cy", CY); hubRing.setAttribute("r", R_HUB - 14);
  hubRing.setAttribute("fill", "none");
  hubRing.setAttribute("stroke", "rgba(200,150,42,0.45)"); hubRing.setAttribute("stroke-width", "1.5");
  svg.appendChild(hubRing);

  const hubLabel = document.createElementNS(NS, "text");
  hubLabel.setAttribute("x", CX); hubLabel.setAttribute("y", CY - 8);
  hubLabel.setAttribute("text-anchor", "middle"); hubLabel.setAttribute("dominant-baseline", "middle");
  hubLabel.setAttribute("fill", "#ffd166");
  hubLabel.setAttribute("font-family", "system-ui, sans-serif");
  hubLabel.setAttribute("font-size", "12");
  hubLabel.setAttribute("font-weight", "900");
  hubLabel.setAttribute("letter-spacing", "1");
  hubLabel.textContent = "FRENCH";
  svg.appendChild(hubLabel);

  const hubLabel2 = document.createElementNS(NS, "text");
  hubLabel2.setAttribute("x", CX); hubLabel2.setAttribute("y", CY + 10);
  hubLabel2.setAttribute("text-anchor", "middle"); hubLabel2.setAttribute("dominant-baseline", "middle");
  hubLabel2.setAttribute("fill", "#ffd166");
  hubLabel2.setAttribute("font-family", "system-ui, sans-serif");
  hubLabel2.setAttribute("font-size", "12");
  hubLabel2.setAttribute("font-weight", "900");
  hubLabel2.setAttribute("letter-spacing", "1");
  hubLabel2.textContent = "ROULETTE";
  svg.appendChild(hubLabel2);

  wrap.innerHTML = "";
  wrap.appendChild(svg);
}

// ---------------------------------------------------------------------------
// Placement game — shared by bank mode (round 1) and blind mode (round 2)
// ---------------------------------------------------------------------------

function startWheelPlacementGame(missingSlots, { blind = false, showSectorColors = false, sectorId = null } = {}) {
  const bank = blind ? [] : shuffle(missingSlots.map(index => WHEEL[index]));

  wheelGame = {
    mode: blind ? "blind" : "bank",
    missingSlots,
    bank,
    filled: {},
    selected: null,
    selectedIndex: null,
    correct: 0,
    wrong: 0,
    showSectorColors,
    sectorId,
    feedback: blind
      ? "Click a blank pocket on the wheel and type the number from memory."
      : "Select a number below, then click the matching blank space on the wheel."
  };

  renderWheelPlacementGame();
}

function renderWheelPlacementGame() {
  const remaining = wheelGame.mode === "bank"
    ? wheelGame.bank.filter(n => !Object.values(wheelGame.filled).includes(n))
    : wheelGame.missingSlots.filter(i => wheelGame.filled[i] === undefined);
  const complete = remaining.length === 0;

  const content = document.querySelector("#content");
  const blind = wheelGame.mode === "blind";
  const modeLabel = blind ? "Blind Recall Drill" : "Wheel Placement Drill";
  const scaffold = wheelGame.showSectorColors;

  content.innerHTML = `
    <div class="mode-label">${modeLabel}</div>
    <div class="question">${complete ? "Wheel complete" : blind ? "Place all numbers from memory" : "Place the missing numbers"}</div>

    <div class="progress">
      <div class="bar" style="width:${Math.round((wheelGame.correct / wheelGame.missingSlots.length) * 100)}%"></div>
    </div>
    <p class="tiny">Correct: ${wheelGame.correct} · Mistakes: ${wheelGame.wrong}</p>

    <div class="wheel-stage">
      <div class="roulette-wheel-wrap">
        <div class="wheel-svg-wrap" id="circleWheel"></div>
      </div>
      ${blind ? `<div id="blindKeypadWrap"></div>` : `<div class="number-bank" id="numberBank"></div>`}
    </div>

    <div class="feedback ${complete ? "good" : "neutral"}" id="wheelFeedback">
      ${complete ? "Excellent. All numbers placed correctly." : wheelGame.feedback}
    </div>

    <div class="actions">
      ${complete ? `
        <button class="primary" id="againWheel">Same drill again</button>
        ${!blind ? `<button class="blue" id="goBlind">Round 2: Blind mode</button>` : ""}
      ` : ""}
      <button class="ghost" id="showAnswerWheel">Show full wheel</button>
      <button class="ghost" id="backWheel">Back to wheel menu</button>
    </div>
  `;

  drawCircularWheel({
    missingSlots: wheelGame.missingSlots,
    filled: wheelGame.filled,
    targetIndex: wheelGame.mode === "bank" && wheelGame.selected !== null
      ? wheelGame.missingSlots.find(i => WHEEL[i] === wheelGame.selected)
      : null,
    showSectorColors: scaffold
  });

  if (blind && !complete) {
    renderBlindKeypad();
  } else if (!blind) {
    renderNumberBank();
  }

  if (complete) {
    const bonus = Math.max(5, wheelGame.missingSlots.length - wheelGame.wrong);
    state.xp += bonus;
    state.dailyXp += bonus;
    state.weakTopics.wheel = Math.max(0, (state.weakTopics.wheel || 0) - 2);
    studyStreakTick();
    saveState();
    updateStats();

    document.querySelector("#againWheel").onclick = () => {
      startWheelPlacementGame(wheelGame.missingSlots, { blind, showSectorColors: scaffold, sectorId: wheelGame.sectorId });
    };
    const goBlindBtn = document.querySelector("#goBlind");
    if (goBlindBtn) {
      goBlindBtn.onclick = () => {
        startWheelPlacementGame(wheelGame.missingSlots, { blind: true, showSectorColors: false, sectorId: wheelGame.sectorId });
      };
    }
  }

  document.querySelector("#showAnswerWheel").onclick = showFullWheel;
  document.querySelector("#backWheel").onclick = () => {
    wheelGame = null;
    renderWheelTrainer();
  };
}

// Bank mode: chip buttons
function renderNumberBank() {
  const bank = document.querySelector("#numberBank");
  if (!bank) return;
  bank.innerHTML = "";

  wheelGame.bank.forEach((number, bankIndex) => {
    const used = Object.values(wheelGame.filled).includes(number);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = [
      "bank-chip",
      wheelGame.selectedIndex === bankIndex ? "selected" : "",
      used ? "used" : ""
    ].filter(Boolean).join(" ");
    btn.textContent = number;
    btn.disabled = used;
    btn.onclick = () => {
      wheelGame.selected = number;
      wheelGame.selectedIndex = bankIndex;
      wheelGame.feedback = `Selected ${number}. Now click its correct blank space on the wheel.`;
      renderWheelPlacementGame();
    };
    bank.appendChild(btn);
  });
}

// Blind mode: numeric keypad shown after clicking a blank pocket
function renderBlindKeypad() {
  const wrap = document.querySelector("#blindKeypadWrap");
  if (!wrap) return;

  if (wheelGame.pendingSlot === undefined || wheelGame.pendingSlot === null) {
    wrap.innerHTML = `<p class="tiny" style="text-align:center;margin-top:10px;">Click a blank pocket on the wheel to enter its number.</p>`;
    return;
  }

  const usedNumbers = Object.values(wheelGame.filled);
  wrap.innerHTML = `<p class="tiny" style="text-align:center;margin-bottom:6px;">What number goes in that pocket?</p>
    <div class="keypad" id="theKeypad"></div>`;

  const keypad = document.querySelector("#theKeypad");
  for (let n = 0; n <= 36; n++) {
    const used = usedNumbers.includes(n);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = n;
    let cls = "keypad-key";
    if (used) cls += " used";
    else if (n === 0) cls += " kp-zero";
    else if (REDS.has(n)) cls += " kp-red";
    btn.className = cls;
    btn.disabled = used;
    btn.onclick = () => blindEnterNumber(n);
    keypad.appendChild(btn);
  }
}

function blindEnterNumber(n) {
  const slotIndex = wheelGame.pendingSlot;
  if (slotIndex === null || slotIndex === undefined) return;

  const correctNumber = WHEEL[slotIndex];
  wheelGame.pendingSlot = null;

  if (n === correctNumber) {
    wheelGame.filled[slotIndex] = n;
    wheelGame.correct++;
    wheelGame.feedback = `Correct — ${n} belongs there.`;
    state.xp += 2;
    state.dailyXp += 2;
    studyStreakTick();
    state.weakSlots[slotIndex] = Math.max(0, (state.weakSlots[slotIndex] || 0) - 1);
  } else {
    wheelGame.wrong++;
    wheelGame.feedback = `No — ${n} doesn't go there. The correct number is ${correctNumber}. Try that pocket again.`;
    state.weakSlots[slotIndex] = (state.weakSlots[slotIndex] || 0) + 3;
    state.weakTopics.wheel = (state.weakTopics.wheel || 0) + 2;
    state.hearts = Math.max(0, state.hearts - 1);
  }

  saveState();
  updateStats();
  renderWheelPlacementGame();
}

function showFullWheel() {
  wheelGame = null;
  const content = document.querySelector("#content");
  content.innerHTML = `
    <div class="mode-label">Full Wheel Answer</div>
    <div class="question">Study the complete sequence</div>
    <p class="tiny">Try reading it around the circle, then restart a drill.</p>
    <div class="roulette-wheel-wrap">
      <div class="wheel-svg-wrap" id="circleWheel"></div>
    </div>
    <div class="actions">
      <button class="primary" id="restartWheelMenu">Back to wheel menu</button>
    </div>
  `;
  drawCircularWheel({ missingSlots: [], filled: {}, targetIndex: null });
  const actions = content.querySelector(".actions");
  actions.insertBefore(
    makeSpeakButton("Read full sequence", () => `Full wheel sequence. ${WHEEL.join(", ")}.`),
    actions.firstChild
  );
  document.querySelector("#restartWheelMenu").onclick = renderWheelTrainer;
}

// ---------------------------------------------------------------------------
// Speed mode
// ---------------------------------------------------------------------------

let speedTimer = null;

function startSpeedMode() {
  if (speedTimer) clearInterval(speedTimer);

  const missingSlots = WHEEL.map((_, i) => i);
  const bank = shuffle([...WHEEL]);

  wheelGame = {
    mode: "speed",
    missingSlots,
    bank,
    filled: {},
    selected: null,
    selectedIndex: null,
    correct: 0,
    wrong: 0,
    startTime: Date.now(),
    elapsed: 0,
    feedback: "Select a number then click its pocket — as fast as you can!"
  };

  speedTimer = setInterval(() => {
    if (!wheelGame || wheelGame.mode !== "speed") { clearInterval(speedTimer); return; }
    wheelGame.elapsed = Math.floor((Date.now() - wheelGame.startTime) / 1000);
    const timerEl = document.querySelector("#speedTimerDisplay");
    if (timerEl) {
      const m = Math.floor(wheelGame.elapsed / 60);
      const s = wheelGame.elapsed % 60;
      timerEl.textContent = `${m}:${String(s).padStart(2, "0")}`;
    }
  }, 500);

  renderSpeedMode();
}

function renderSpeedMode() {
  const remaining = wheelGame.bank.filter(n => !Object.values(wheelGame.filled).includes(n));
  const complete = remaining.length === 0;

  if (complete && speedTimer) {
    clearInterval(speedTimer);
    speedTimer = null;
  }

  const elapsed = wheelGame.elapsed;
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  const timeStr = `${m}:${String(s).padStart(2, "0")}`;

  const content = document.querySelector("#content");
  content.innerHTML = `
    <div class="mode-label">Speed Mode — Full Wheel</div>
    ${complete
      ? `<div class="question">Done!</div>
         <div class="speed-timer">${timeStr}</div>
         <div class="speed-score-row">
           <span>Placed: <strong>${wheelGame.correct}</strong></span>
           <span>Mistakes: <strong>${wheelGame.wrong}</strong></span>
         </div>`
      : `<div class="speed-timer${elapsed >= 120 ? " urgent" : ""}" id="speedTimerDisplay">${timeStr}</div>
         <div class="speed-score-row">
           <span>Left: <strong>${remaining.length}</strong></span>
           <span>Mistakes: <strong>${wheelGame.wrong}</strong></span>
         </div>`
    }

    <div class="wheel-stage">
      <div class="roulette-wheel-wrap">
        <div class="wheel-svg-wrap" id="circleWheel"></div>
      </div>
      <div class="number-bank" id="numberBank"></div>
    </div>

    <div class="feedback neutral" id="wheelFeedback">${wheelGame.feedback}</div>

    <div class="actions">
      ${complete ? `<button class="primary" id="speedAgain">Play again</button>` : ""}
      <button class="ghost" id="backWheel">Back to wheel menu</button>
    </div>
  `;

  drawCircularWheel({
    missingSlots: wheelGame.missingSlots,
    filled: wheelGame.filled,
    targetIndex: wheelGame.selected !== null
      ? wheelGame.missingSlots.find(i => WHEEL[i] === wheelGame.selected)
      : null
  });

  renderNumberBank();

  if (complete) {
    const bonus = Math.max(10, 40 - wheelGame.wrong * 2);
    state.xp += bonus;
    state.dailyXp += bonus;
    studyStreakTick();
    saveState();
    updateStats();
    document.querySelector("#speedAgain").onclick = startSpeedMode;
  }

  document.querySelector("#backWheel").onclick = () => {
    if (speedTimer) { clearInterval(speedTimer); speedTimer = null; }
    wheelGame = null;
    renderWheelTrainer();
  };
}

// Speed mode uses the same placeSelectedNumber, but we need to re-render via renderSpeedMode
// Patch placeSelectedNumber to route speed mode correctly — handled by checking wheelGame.mode inside.

// ---------------------------------------------------------------------------
// Neighbour chain drill
// ---------------------------------------------------------------------------

let neighbourDrill = null;

function startNeighbourDrill() {
  wheelGame = null;
  const numbers = shuffle(WHEEL.filter(n => n !== 0));
  neighbourDrill = {
    queue: numbers,
    index: 0,
    correct: 0,
    wrong: 0,
    showAnswer: false
  };
  renderNeighbourDrill();
}

function renderNeighbourDrill() {
  if (!neighbourDrill) return;
  const content = document.querySelector("#content");

  if (neighbourDrill.index >= neighbourDrill.queue.length) {
    // Finished
    const bonus = Math.max(5, Math.floor(neighbourDrill.correct / 2));
    state.xp += bonus;
    state.dailyXp += bonus;
    studyStreakTick();
    saveState();
    updateStats();

    content.innerHTML = `
      <div class="mode-label">Neighbour Chain</div>
      <div class="question">Round complete!</div>
      <p class="tiny">Correct: ${neighbourDrill.correct} · Mistakes: ${neighbourDrill.wrong}</p>
      <div class="actions">
        <button class="primary" id="nbAgain">Play again</button>
        <button class="ghost" id="nbBack">Back to wheel menu</button>
      </div>
    `;
    document.querySelector("#nbAgain").onclick = startNeighbourDrill;
    document.querySelector("#nbBack").onclick = () => { neighbourDrill = null; renderWheelTrainer(); };
    return;
  }

  const target = neighbourDrill.queue[neighbourDrill.index];
  const wheelIndex = WHEEL.indexOf(target);
  const leftNeighbour  = WHEEL[(wheelIndex - 1 + WHEEL.length) % WHEEL.length];
  const rightNeighbour = WHEEL[(wheelIndex + 1) % WHEEL.length];
  const correctPair = [leftNeighbour, rightNeighbour].sort((a, b) => a - b);

  // Generate wrong options: two plausible wrong pairs
  const wrongOptions = [];
  let attempts = 0;
  while (wrongOptions.length < 3 && attempts < 100) {
    attempts++;
    const ri = Math.floor(Math.random() * WHEEL.length);
    const n1 = WHEEL[(ri - 1 + WHEEL.length) % WHEEL.length];
    const n2 = WHEEL[(ri + 1) % WHEEL.length];
    const pair = [n1, n2].sort((a, b) => a - b);
    const pairKey = pair.join(",");
    const correctKey = correctPair.join(",");
    if (pairKey !== correctKey && !wrongOptions.some(o => o.join(",") === pairKey)) {
      wrongOptions.push(pair);
    }
  }

  const allOptions = shuffle([correctPair, ...wrongOptions.slice(0, 3)]);
  const colorClass = target === 0 ? "zero-num" : REDS.has(target) ? "red-num" : "";
  const total = neighbourDrill.queue.length;
  const done = neighbourDrill.index;

  content.innerHTML = `
    <div class="mode-label">Neighbour Chain Drill</div>
    <div class="progress"><div class="bar" style="width:${Math.round(done / total * 100)}%"></div></div>
    <p class="tiny">Question ${done + 1} of ${total} · Correct: ${neighbourDrill.correct} · Mistakes: ${neighbourDrill.wrong}</p>

    <p class="tiny" style="text-align:center;margin-bottom:0;">What are the two neighbours of…</p>
    <div class="neighbour-target ${colorClass}">${target}</div>
    <p class="neighbour-hint">Select the pair of numbers immediately beside it on the wheel.</p>

    <div class="neighbour-options" id="nbOptions"></div>

    ${neighbourDrill.showAnswer ? `
      <div class="neighbour-flash">
        <span class="num ${numColor(leftNeighbour)}">${leftNeighbour}</span>
        <span style="color:var(--muted);font-size:1.4rem;">–</span>
        <span class="num ${numColor(target)}">${target}</span>
        <span style="color:var(--muted);font-size:1.4rem;">–</span>
        <span class="num ${numColor(rightNeighbour)}">${rightNeighbour}</span>
      </div>
      <div class="actions">
        <button class="primary" id="nbNext">Next →</button>
        <button class="ghost" id="nbBack">Back to wheel menu</button>
      </div>
    ` : `
      <div class="actions" style="margin-top:12px;">
        <button class="ghost" id="nbBack">Back to wheel menu</button>
      </div>
    `}
  `;

  const optWrap = document.querySelector("#nbOptions");
  allOptions.forEach(pair => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.innerHTML = pair.map(n => `<span class="num ${numColor(n)}" style="display:inline-grid;place-items:center;width:36px;height:36px;border-radius:999px;margin:0 3px;font-size:0.85rem;">${n}</span>`).join(" &amp; ");
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.gap = "8px";

    if (neighbourDrill.showAnswer) {
      btn.disabled = true;
      if (pair.join(",") === correctPair.join(",")) btn.classList.add("correct");
    } else {
      btn.onclick = () => {
        const isCorrect = pair.join(",") === correctPair.join(",");
        if (isCorrect) {
          neighbourDrill.correct++;
          state.xp += 1;
          state.dailyXp += 1;
          studyStreakTick();
        } else {
          neighbourDrill.wrong++;
          state.weakTopics.wheel = (state.weakTopics.wheel || 0) + 1;
          state.hearts = Math.max(0, state.hearts - 1);
        }
        neighbourDrill.showAnswer = true;
        saveState();
        updateStats();
        renderNeighbourDrill();
      };
    }
    optWrap.appendChild(btn);
  });

  if (neighbourDrill.showAnswer) {
    document.querySelector("#nbNext").onclick = () => {
      neighbourDrill.index++;
      neighbourDrill.showAnswer = false;
      renderNeighbourDrill();
    };
  }

  document.querySelector("#nbBack").onclick = () => {
    neighbourDrill = null;
    renderWheelTrainer();
  };
}

// ---------------------------------------------------------------------------
// Main wheel trainer menu
// ---------------------------------------------------------------------------

function renderWheelTrainer() {
  wheelGame = null;
  neighbourDrill = null;
  if (speedTimer) { clearInterval(speedTimer); speedTimer = null; }

  // Build weak slots list: top 5 most-errored slot indices
  const weakSlotIndices = Object.entries(state.weakSlots || {})
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([i]) => Number(i));

  const content = document.querySelector("#content");
  content.innerHTML = `
    <div class="mode-label">Wheel Trainer</div>
    <div class="question">Build the wheel from memory</div>
    <p class="tiny">
      Start with a sector to learn a region, then drill it with or without the number bank.
      Use colour scaffolding in round 1, then strip it for round 2.
    </p>

    <h3 class="section-title" style="margin-top:16px;">Place missing numbers</h3>
    <p class="tiny">With number bank (recognition). Round 2 switches to blind recall.</p>

    <div class="diff-row">
      <button class="primary" id="missingEasy3">Easy: 3 missing</button>
      <button class="primary" id="missingEasy">Easy: 5 missing</button>
      <button class="blue"    id="missingMedium">Medium: 10 missing</button>
      <button class="danger"  id="missingHard">Hard: 18 missing</button>
      ${weakSlotIndices.length >= 3
        ? `<button class="ghost" id="missingWeak">Weak spots: ${weakSlotIndices.length}</button>`
        : ""}
    </div>

    <h3 class="section-title" style="margin-top:18px;">Sector drills</h3>
    <p class="tiny">Blank only that sector's pockets — learn one arc at a time.</p>
    <div class="drill-grid" id="sectorDrillButtons"></div>

    <h3 class="section-title" style="margin-top:18px;">Other drills</h3>
    <div class="diff-row">
      <button class="blue"  id="startNeighbour">Neighbour chains</button>
      <button class="ghost" id="startSpeed">Speed mode (full wheel)</button>
      <button class="ghost" id="wheelPractice">Wheel Q&amp;A</button>
    </div>

    <h3 class="section-title" style="margin-top:20px;">Highlight a sector on the wheel</h3>
    <div class="actions" id="sectorHighlightButtons"></div>
    <div id="sectorInfoBox"></div>

    <div class="roulette-wheel-wrap" style="margin-top:16px;">
      <div class="wheel-svg-wrap" id="circleWheel"></div>
    </div>
  `;

  drawCircularWheel({ missingSlots: [], filled: {}, targetIndex: null });

  // Standard difficulty buttons
  document.querySelector("#missingEasy3").onclick = () => {
    const slots = randomMissingSlots(3);
    startWheelPlacementGame(slots, { showSectorColors: false });
  };
  document.querySelector("#missingEasy").onclick = () => {
    const slots = randomMissingSlots(5);
    startWheelPlacementGame(slots, { showSectorColors: false });
  };
  document.querySelector("#missingMedium").onclick = () => {
    const slots = randomMissingSlots(10);
    startWheelPlacementGame(slots, { showSectorColors: false });
  };
  document.querySelector("#missingHard").onclick = () => {
    const slots = randomMissingSlots(18);
    startWheelPlacementGame(slots, { showSectorColors: false });
  };

  const weakBtn = document.querySelector("#missingWeak");
  if (weakBtn) {
    weakBtn.onclick = () => startWheelPlacementGame(weakSlotIndices, { showSectorColors: false });
  }

  // Sector drill cards
  const sectorGrid = document.querySelector("#sectorDrillButtons");
  SECTORS.forEach(sector => {
    const card = document.createElement("div");
    card.className = "drill-card";
    card.style.borderColor = sector.color + "88";
    card.innerHTML = `
      <div class="drill-card-title" style="color:${sector.color}">${sector.name}</div>
      <div class="drill-card-desc">${sector.numbers.length} numbers — blank them all, with sector colours shown</div>
    `;
    card.onclick = () => {
      const slots = sector.numbers.map(n => WHEEL.indexOf(n));
      startWheelPlacementGame(slots, { showSectorColors: true, sectorId: sector.id });
    };
    sectorGrid.appendChild(card);
  });

  // Neighbour + speed + Q&A
  document.querySelector("#startNeighbour").onclick = startNeighbourDrill;
  document.querySelector("#startSpeed").onclick = startSpeedMode;
  document.querySelector("#wheelPractice").onclick = () => {
    startSession({
      title: "Wheel Practice",
      type: "practice",
      lessonId: null,
      questions: makeQuestions(["wheel", "neighbours"], 20)
    });
  };

  // Sector highlight buttons
  const btnWrap = document.querySelector("#sectorHighlightButtons");
  SECTORS.forEach(sector => {
    const btn = document.createElement("button");
    btn.className = "ghost";
    btn.textContent = sector.shortName;
    btn.style.borderColor = sector.color;
    btn.onclick = () => highlightSector(sector);
    btnWrap.appendChild(btn);
  });

  const clearBtn = document.createElement("button");
  clearBtn.className = "ghost";
  clearBtn.textContent = "Clear";
  clearBtn.onclick = () => {
    drawCircularWheel({ missingSlots: [], filled: {}, targetIndex: null });
    document.querySelector("#sectorInfoBox").innerHTML = "";
  };
  btnWrap.appendChild(clearBtn);
}

function randomMissingSlots(count) {
  return sample(WHEEL.map((_, i) => i), count).sort((a, b) => a - b);
}

function highlightSector(sector) {
  drawCircularWheel({
    missingSlots: [],
    filled: {},
    targetIndex: null,
    highlightNumbers: sector.numbers
  });

  const box = document.querySelector("#sectorInfoBox");
  if (!box) return;
  box.innerHTML = `
    <div class="sector-info-card" style="border-color:${sector.color}">
      <div class="sector-info-header" style="color:${sector.color}">${sector.name}</div>
      <div class="tiny">${sector.description}</div>
      <div class="sector-sequence">${sector.numbers.map(n => `<span class="num ${numColor(n)}">${n}</span>`).join("")}</div>
      <div class="tiny" style="margin-top:8px;"><strong>Chips:</strong> ${sector.chips} &nbsp;·&nbsp; <strong>Placement:</strong> ${sector.placement}</div>
    </div>
  `;
  const s = sector;
  box.querySelector(".sector-info-card").appendChild(
    makeSpeakButton("Read sequence", () => `${s.name}. ${s.numbers.join(", ")}.`)
  );
}

function placeSelectedNumber(slotIndex) {
  if (wheelGame && wheelGame.mode === "blind") {
    wheelGame.pendingSlot = slotIndex;
    wheelGame.feedback = "Which number belongs here?";
    renderWheelPlacementGame();
    return;
  }

  if (wheelGame && wheelGame.mode === "speed") {
    if (wheelGame.selected === null) {
      wheelGame.feedback = "Choose a number from the bank first.";
      renderSpeedMode();
      return;
    }
    const correctNumber = WHEEL[slotIndex];
    if (wheelGame.selected === correctNumber) {
      wheelGame.filled[slotIndex] = wheelGame.selected;
      wheelGame.correct++;
      wheelGame.feedback = `Correct — ${correctNumber}!`;
      state.xp += 1;
      state.dailyXp += 1;
      state.weakSlots[slotIndex] = Math.max(0, (state.weakSlots[slotIndex] || 0) - 1);
    } else {
      wheelGame.wrong++;
      wheelGame.feedback = `No — ${wheelGame.selected} is not there.`;
      state.weakSlots[slotIndex] = (state.weakSlots[slotIndex] || 0) + 3;
      state.hearts = Math.max(0, state.hearts - 1);
    }
    wheelGame.selected = null;
    wheelGame.selectedIndex = null;
    saveState();
    updateStats();
    renderSpeedMode();
    return;
  }

  // bank mode
  if (wheelGame.selected === null) {
    wheelGame.feedback = "Choose a number from the number bank first.";
    renderWheelPlacementGame();
    return;
  }

  const correctNumber = WHEEL[slotIndex];

  if (wheelGame.selected === correctNumber) {
    wheelGame.filled[slotIndex] = wheelGame.selected;
    wheelGame.correct++;
    wheelGame.feedback = `Correct — ${correctNumber} belongs there.`;
    state.xp += 2;
    state.dailyXp += 2;
    studyStreakTick();
    state.weakSlots[slotIndex] = Math.max(0, (state.weakSlots[slotIndex] || 0) - 1);
  } else {
    wheelGame.wrong++;
    wheelGame.feedback = `Not there — ${wheelGame.selected} does not go in that pocket. Try again.`;
    state.weakSlots[slotIndex] = (state.weakSlots[slotIndex] || 0) + 3;
    state.weakTopics.wheel = (state.weakTopics.wheel || 0) + 2;
    state.hearts = Math.max(0, state.hearts - 1);
  }

  wheelGame.selected = null;
  wheelGame.selectedIndex = null;
  saveState();
  updateStats();
  renderWheelPlacementGame();
}
