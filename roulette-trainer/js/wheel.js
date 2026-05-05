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

function drawCircularWheelInto(wrap, opts) {
  if (!wrap) return;
  const { missingSlots = [], filled = {}, targetIndex = null, highlightNumbers = [], showSectorColors = false } = opts;

  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 500 500");
  svg.setAttribute("class", "roulette-wheel-svg");
  svg.setAttribute("xmlns", NS);

  const defs = document.createElementNS(NS, "defs");

  const rimGrad = document.createElementNS(NS, "radialGradient");
  rimGrad.id = "rimGrad2";
  rimGrad.innerHTML = `
    <stop offset="0%"   stop-color="#a06820"/>
    <stop offset="45%"  stop-color="#7a4e14"/>
    <stop offset="100%" stop-color="#3d2408"/>
  `;
  defs.appendChild(rimGrad);

  const hubGrad = document.createElementNS(NS, "radialGradient");
  hubGrad.id = "hubGrad2";
  hubGrad.innerHTML = `
    <stop offset="0%"   stop-color="#245c38"/>
    <stop offset="70%"  stop-color="#122e1c"/>
    <stop offset="100%" stop-color="#080f0b"/>
  `;
  defs.appendChild(hubGrad);

  const sheen = document.createElementNS(NS, "radialGradient");
  sheen.id = "pocketSheen2";
  sheen.setAttribute("cx", "50%"); sheen.setAttribute("cy", "30%");
  sheen.setAttribute("r", "60%");
  sheen.innerHTML = `
    <stop offset="0%"  stop-color="rgba(255,255,255,0.07)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
  `;
  defs.appendChild(sheen);

  svg.appendChild(defs);

  const rim = document.createElementNS(NS, "circle");
  rim.setAttribute("cx", CX); rim.setAttribute("cy", CY); rim.setAttribute("r", R_OUTER);
  rim.setAttribute("fill", "url(#rimGrad2)");
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

    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", wedgePath(CX, CY, R_POCKET_INNER, R_POCKET_OUTER, startDeg, endDeg));
    path.setAttribute("fill", showSectorColors
      ? (() => { const s = SECTORS.find(sec => sec.numbers.includes(n)); return s ? s.color + "cc" : pocketColor(n); })()
      : pocketColor(n));
    path.setAttribute("stroke", "#0a0a0a");
    path.setAttribute("stroke-width", "1");
    svg.appendChild(path);

    const [lx, ly] = polarToXY(CX, CY, R_NUM, midDeg);
    const text = document.createElementNS(NS, "text");
    text.setAttribute("class", `pocket-label${n === 0 ? " zero-label" : ""}`);
    text.setAttribute("x", lx); text.setAttribute("y", ly);
    text.setAttribute("transform", `rotate(${midDeg}, ${lx}, ${ly})`);
    text.textContent = n;
    svg.appendChild(text);
  });

  const bowl = document.createElementNS(NS, "circle");
  bowl.setAttribute("cx", CX); bowl.setAttribute("cy", CY); bowl.setAttribute("r", R_POCKET_INNER - 3);
  bowl.setAttribute("fill", "#0d2018");
  bowl.setAttribute("stroke", "#c8962a"); bowl.setAttribute("stroke-width", "2");
  svg.appendChild(bowl);

  const hub = document.createElementNS(NS, "circle");
  hub.setAttribute("cx", CX); hub.setAttribute("cy", CY); hub.setAttribute("r", R_HUB);
  hub.setAttribute("fill", "url(#hubGrad2)");
  hub.setAttribute("stroke", "#c8962a"); hub.setAttribute("stroke-width", "2.5");
  svg.appendChild(hub);

  wrap.innerHTML = "";
  wrap.appendChild(svg);
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
    peeksLeft: blind ? 0 : 3,
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
  const peeksLeft = wheelGame.peeksLeft !== undefined ? wheelGame.peeksLeft : 3;

  const peekBtn = (!complete && !blind)
    ? `<button class="ghost" id="peekWheel" ${peeksLeft === 0 ? "disabled" : ""}>Peek at full wheel (${peeksLeft} left)</button>`
    : "";

  content.innerHTML = `
    <div class="mode-label">${modeLabel}</div>
    <div class="question">${complete ? "Drill complete!" : blind ? "Place all numbers from memory" : "Place the missing numbers"}</div>

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
      ${complete ? "All placed — great work!" : wheelGame.feedback}
    </div>

    <div class="actions">
      ${complete ? `
        <button class="primary" id="againWheel">Same drill again</button>
        ${!blind ? `<button class="blue" id="goBlind">Round 2: Blind mode ↗</button>` : ""}
      ` : ""}
      ${peekBtn}
      <button class="ghost" id="showAnswerWheel">Show full wheel</button>
      <button class="ghost" id="backWheel">Back to wheel menu</button>
    </div>
  `;

  drawCircularWheel({
    missingSlots: wheelGame.missingSlots,
    filled: wheelGame.filled,
    targetIndex: null,
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

    // Record sector mastery
    if (wheelGame.sectorId) {
      if (!state.sectorMastery) state.sectorMastery = {};
      if (!state.sectorMastery[wheelGame.sectorId]) state.sectorMastery[wheelGame.sectorId] = { bankClears: 0, blindClears: 0 };
      if (blind) {
        state.sectorMastery[wheelGame.sectorId].blindClears++;
      } else {
        state.sectorMastery[wheelGame.sectorId].bankClears++;
      }
    }

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

  const peekEl = document.querySelector("#peekWheel");
  if (peekEl) {
    peekEl.onclick = () => {
      wheelGame.peeksLeft = peeksLeft - 1;
      showPeekOverlay();
    };
  }

  document.querySelector("#showAnswerWheel").onclick = showFullWheel;
  document.querySelector("#backWheel").onclick = () => {
    wheelGame = null;
    renderWheelTrainer();
  };
}

function showPeekOverlay() {
  const existing = document.querySelector("#peekOverlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "peekOverlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;";
  overlay.innerHTML = `
    <div style="color:#ffd166;font-size:13px;font-weight:700;letter-spacing:1px;">PEEK — closes in 3 seconds</div>
    <div class="wheel-svg-wrap" id="peekCircleWheel" style="width:min(90vw,340px);height:min(90vw,340px);"></div>
    <button class="ghost" id="closePeek" style="margin-top:8px;">Close</button>
  `;
  document.body.appendChild(overlay);

  drawCircularWheelInto(document.querySelector("#peekCircleWheel"), { missingSlots: [], filled: {}, targetIndex: null });

  const close = () => { overlay.remove(); renderWheelPlacementGame(); };
  document.querySelector("#closePeek").onclick = close;
  setTimeout(close, 3000);
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
    wheelGame.feedback = `✓ Correct! ${wheelSlotContext(slotIndex)}`;
    state.xp += 2;
    state.dailyXp += 2;
    studyStreakTick();
    state.weakSlots[slotIndex] = Math.max(0, (state.weakSlots[slotIndex] || 0) - 1);
  } else {
    wheelGame.wrong++;
    wheelGame.feedback = `✗ No — the answer is ${correctNumber}. ${wheelSlotContext(slotIndex)}`;
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
    targetIndex: null
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

function sectorMasteryBadge(sectorId) {
  const m = (state.sectorMastery || {})[sectorId] || { bankClears: 0, blindClears: 0 };
  if (m.blindClears >= 1) return { label: "Mastered", icon: "★", cls: "badge-mastered" };
  if (m.bankClears >= 1)  return { label: "Practiced", icon: "◆", cls: "badge-practiced" };
  return null;
}

function renderWheelTrainer() {
  wheelGame = null;
  neighbourDrill = null;
  if (speedTimer) { clearInterval(speedTimer); speedTimer = null; }

  const weakSlotIndices = Object.entries(state.weakSlots || {})
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([i]) => Number(i));

  const content = document.querySelector("#content");
  content.innerHTML = `
    <div class="mode-label">Wheel Trainer</div>
    <div class="question">Learn the wheel</div>
    <p class="tiny">Start by studying a sector, then drill it. Work through all four sectors, then challenge yourself with the full wheel.</p>

    <h3 class="section-title" style="margin-top:18px;">Step 1 — Learn a sector</h3>
    <p class="tiny">Pick a sector to study its numbers and position on the wheel, then drill it.</p>
    <div id="sectorCards"></div>

    <h3 class="section-title" style="margin-top:20px;">Step 2 — Full wheel drills</h3>
    <p class="tiny">Once you know the sectors, mix them together.</p>
    <div class="diff-row" style="flex-wrap:wrap;gap:8px;">
      <button class="primary" id="missingEasy3">3 missing</button>
      <button class="primary" id="missingEasy">5 missing</button>
      <button class="blue"    id="missingMedium">10 missing</button>
      <button class="danger"  id="missingHard">18 missing</button>
      ${weakSlotIndices.length >= 3
        ? `<button class="ghost" id="missingWeak">My weak spots (${weakSlotIndices.length})</button>`
        : ""}
    </div>

    <h3 class="section-title" style="margin-top:20px;">Other drills</h3>
    <div class="diff-row" style="flex-wrap:wrap;gap:8px;">
      <button class="primary" id="startColour">Red or Black? (chunked)</button>
      <button class="blue"    id="startNeighbour">Neighbour chains</button>
      <button class="ghost"   id="startSpeed">Speed mode (full wheel)</button>
      <button class="ghost"   id="wheelPractice">Wheel Q&amp;A</button>
    </div>
  `;

  // Sector cards — the centrepiece
  const sectorCardsEl = document.querySelector("#sectorCards");
  SECTORS.forEach(sector => {
    const badge = sectorMasteryBadge(sector.id);
    const badgeHtml = badge
      ? `<span class="mastery-badge ${badge.cls}">${badge.icon} ${badge.label}</span>`
      : `<span class="mastery-badge badge-new">Not started</span>`;

    const card = document.createElement("div");
    card.className = "sector-learn-card";
    card.style.borderColor = sector.color + "99";
    card.innerHTML = `
      <div class="slc-header">
        <span class="slc-name" style="color:${sector.color}">${sector.name}</span>
        ${badgeHtml}
      </div>
      <div class="slc-desc tiny">${sector.description}</div>
      <div class="slc-nums">${sector.numbers.map(n => `<span class="num ${numColor(n)}">${n}</span>`).join("")}</div>
      <div class="slc-actions">
        <button class="ghost slc-study" data-id="${sector.id}">Study</button>
        <button class="primary slc-bank" data-id="${sector.id}">Drill with bank</button>
        <button class="blue slc-blind" data-id="${sector.id}">Blind recall</button>
      </div>
    `;
    sectorCardsEl.appendChild(card);
  });

  // Wire sector card buttons
  sectorCardsEl.addEventListener("click", e => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    const sector = SECTORS.find(s => s.id === btn.dataset.id);
    if (!sector) return;
    const slots = sector.numbers.map(n => WHEEL.indexOf(n));

    if (btn.classList.contains("slc-study")) {
      renderSectorStudy(sector);
    } else if (btn.classList.contains("slc-bank")) {
      startWheelPlacementGame(slots, { showSectorColors: true, sectorId: sector.id });
    } else if (btn.classList.contains("slc-blind")) {
      startWheelPlacementGame(slots, { blind: true, showSectorColors: false, sectorId: sector.id });
    }
  });

  // Full wheel buttons
  document.querySelector("#missingEasy3").onclick = () => startWheelPlacementGame(randomMissingSlots(3), {});
  document.querySelector("#missingEasy").onclick   = () => startWheelPlacementGame(randomMissingSlots(5), {});
  document.querySelector("#missingMedium").onclick = () => startWheelPlacementGame(randomMissingSlots(10), {});
  document.querySelector("#missingHard").onclick   = () => startWheelPlacementGame(randomMissingSlots(18), {});

  const weakBtn = document.querySelector("#missingWeak");
  if (weakBtn) weakBtn.onclick = () => startWheelPlacementGame(weakSlotIndices, {});

  document.querySelector("#startColour").onclick = renderColourMenu;
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
}

function renderSectorStudy(sector) {
  const content = document.querySelector("#content");
  const slots = sector.numbers.map(n => WHEEL.indexOf(n));

  content.innerHTML = `
    <div class="mode-label">Sector Study</div>
    <div class="question" style="color:${sector.color}">${sector.name}</div>
    <p class="tiny">${sector.description} · ${sector.numbers.length} numbers · ${sector.chips} chips</p>

    <div class="sector-sequence" style="margin:12px 0;">
      ${sector.numbers.map(n => `<span class="num ${numColor(n)}">${n}</span>`).join("")}
    </div>
    <p class="tiny"><strong>Placement:</strong> ${sector.placement}</p>

    <div class="roulette-wheel-wrap" style="margin:16px 0;">
      <div class="wheel-svg-wrap" id="circleWheel"></div>
    </div>

    <div class="actions">
      <button class="primary" id="studyDrillBank">Drill with bank →</button>
      <button class="blue"    id="studyDrillBlind">Blind recall →</button>
      <button class="ghost"   id="studyBack">Back to wheel menu</button>
    </div>
  `;

  drawCircularWheel({ missingSlots: [], filled: {}, targetIndex: null, highlightNumbers: sector.numbers });

  const speakBtn = makeSpeakButton("Read sequence", () => `${sector.name}. ${sector.numbers.join(", ")}.`);
  content.querySelector(".actions").insertBefore(speakBtn, content.querySelector(".actions").firstChild);

  document.querySelector("#studyDrillBank").onclick  = () => startWheelPlacementGame(slots, { showSectorColors: true, sectorId: sector.id });
  document.querySelector("#studyDrillBlind").onclick = () => startWheelPlacementGame(slots, { blind: true, showSectorColors: false, sectorId: sector.id });
  document.querySelector("#studyBack").onclick = renderWheelTrainer;
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
    wheelGame.feedback = `✓ Correct! ${wheelSlotContext(slotIndex)}`;
    state.xp += 2;
    state.dailyXp += 2;
    studyStreakTick();
    state.weakSlots[slotIndex] = Math.max(0, (state.weakSlots[slotIndex] || 0) - 1);
  } else {
    wheelGame.wrong++;
    wheelGame.feedback = `✗ No — ${wheelGame.selected} doesn't go there. ${wheelSlotContext(slotIndex)}`;
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

function wheelSlotContext(slotIndex) {
  const n = WHEEL[slotIndex];
  const sector = SECTORS.find(s => s.numbers.includes(n));
  const wi = slotIndex;
  const left = WHEEL[(wi - 1 + WHEEL.length) % WHEEL.length];
  const right = WHEEL[(wi + 1) % WHEEL.length];
  const sectorStr = sector ? ` · Sector: ${sector.shortName}` : "";
  return `Neighbours: ${left} — ${n} — ${right}${sectorStr}`;
}

// ---------------------------------------------------------------------------
// Colour drill — red or black? Chunked by tens to expose the pattern.
// ---------------------------------------------------------------------------

const COLOUR_CHUNKS = [
  {
    id: "1-10",
    label: "Numbers 1–10",
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    desc: "Odds are red, evens are black — except the very last pair.",
    pattern: "1–10: 1, 3, 5, 7, 9 are red. 2, 4, 6, 8 are black. Then it flips: 10 is black, 11 is black."
  },
  {
    id: "11-18",
    label: "Numbers 11–18",
    numbers: [11, 12, 13, 14, 15, 16, 17, 18],
    desc: "The pattern flips here: odds are black, evens are red.",
    pattern: "11–18: odds (11, 13, 15, 17) are black. Evens (12, 14, 16, 18) are red."
  },
  {
    id: "19-28",
    label: "Numbers 19–28",
    numbers: [19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
    desc: "Pattern flips back: odds are red, evens are black — same as 1–10.",
    pattern: "19–28 mirrors 1–10. Odds red, evens black, then 28 is black and 29 is also black."
  },
  {
    id: "29-36",
    label: "Numbers 29–36",
    numbers: [29, 30, 31, 32, 33, 34, 35, 36],
    desc: "Pattern flips again: odds are black, evens are red — same as 11–18.",
    pattern: "29–36 mirrors 11–18. Odds black, evens red."
  },
  {
    id: "all",
    label: "All 36 (final challenge)",
    numbers: Array.from({ length: 36 }, (_, i) => i + 1),
    desc: "Mix all four chunks together once you know each one.",
    pattern: "Whole layout: pattern flips at 11 and again at 29. Inside each band, odd/even alternates colour."
  }
];

let colourDrill = null;

function renderColourMenu() {
  wheelGame = null;
  neighbourDrill = null;
  colourDrill = null;

  const content = document.querySelector("#content");
  content.innerHTML = `
    <div class="mode-label">Red or Black?</div>
    <div class="question">Learn the colours in chunks</div>
    <p class="tiny">
      The colour pattern flips at 11 and again at 29. Take it ten at a time —
      study a chunk, then drill it. Once each chunk feels easy, try the full layout.
    </p>

    <h3 class="section-title" style="margin-top:14px;">Pick a chunk</h3>
    <div class="colour-chunk-grid" id="colourChunkGrid"></div>

    <div class="actions" style="margin-top:18px;">
      <button class="ghost" id="colourBack">Back to wheel menu</button>
    </div>
  `;

  const grid = document.querySelector("#colourChunkGrid");
  COLOUR_CHUNKS.forEach(chunk => {
    const card = document.createElement("div");
    card.className = "colour-chunk-card";
    card.innerHTML = `
      <div class="colour-chunk-title">${chunk.label}</div>
      <div class="colour-chunk-desc">${chunk.desc}</div>
      <div class="colour-chunk-strip">
        ${chunk.numbers.map(n => `<span class="num ${numColor(n)}">${n}</span>`).join("")}
      </div>
    `;
    card.onclick = () => renderColourStudy(chunk);
    grid.appendChild(card);
  });

  document.querySelector("#colourBack").onclick = renderWheelTrainer;
}

function renderColourStudy(chunk) {
  const content = document.querySelector("#content");

  // Split into reds and blacks for visual contrast
  const reds   = chunk.numbers.filter(n => REDS.has(n));
  const blacks = chunk.numbers.filter(n => !REDS.has(n));

  content.innerHTML = `
    <div class="mode-label">Study — ${chunk.label}</div>
    <div class="question">Look at the pattern</div>

    <div class="colour-study-card">
      <div class="tiny" style="margin-bottom:6px;"><strong>In order:</strong></div>
      <div class="colour-study-row">
        ${chunk.numbers.map(n => `<span class="num ${numColor(n)}">${n}</span>`).join("")}
      </div>

      <div class="tiny" style="margin-top:14px;color:#ff7c87;"><strong>Reds (${reds.length}):</strong></div>
      <div class="colour-study-row">
        ${reds.map(n => `<span class="num red">${n}</span>`).join("")}
      </div>

      <div class="tiny" style="margin-top:10px;"><strong>Blacks (${blacks.length}):</strong></div>
      <div class="colour-study-row">
        ${blacks.map(n => `<span class="num">${n}</span>`).join("")}
      </div>

      <div class="pattern-note">${chunk.pattern}</div>
    </div>

    <div class="actions">
      <button class="primary" id="csStart">Start drill →</button>
      <button class="ghost"   id="csBack">Back to chunks</button>
    </div>
  `;

  const speakBtn = makeSpeakButton(
    "Read the chunk",
    () => `${chunk.label}. ` + chunk.numbers.map(n => `${n} ${REDS.has(n) ? "red" : "black"}`).join(", ") + "."
  );
  content.querySelector(".colour-study-card").appendChild(speakBtn);

  document.querySelector("#csStart").onclick = () => startColourDrill(chunk);
  document.querySelector("#csBack").onclick  = renderColourMenu;
}

function startColourDrill(chunk) {
  // Each number appears twice for repetition; shuffled.
  const queue = shuffle([...chunk.numbers, ...chunk.numbers]);
  colourDrill = {
    chunk,
    queue,
    index: 0,
    correct: 0,
    wrong: 0,
    showAnswer: false,
    lastAnswer: null
  };
  renderColourDrill();
}

function renderColourDrill() {
  if (!colourDrill) return;
  const content = document.querySelector("#content");
  const { chunk, queue, index, correct, wrong, showAnswer, lastAnswer } = colourDrill;

  if (index >= queue.length) {
    const total = queue.length;
    const accuracy = Math.round((correct / total) * 100);
    const passed = accuracy >= 90;
    const bonus = Math.max(5, correct - wrong);
    state.xp += bonus;
    state.dailyXp += bonus;
    studyStreakTick();
    saveState();
    updateStats();

    content.innerHTML = `
      <div class="mode-label">Colour Drill — ${chunk.label}</div>
      <div class="question">${passed ? "Excellent!" : "Round complete"}</div>
      <p class="tiny">
        Correct: ${correct} / ${total} (${accuracy}%) · Mistakes: ${wrong}
      </p>
      <div class="pattern-note">${chunk.pattern}</div>
      <div class="actions">
        <button class="primary" id="cdAgain">Drill ${chunk.label} again</button>
        <button class="blue"    id="cdNext">Pick another chunk</button>
        <button class="ghost"   id="cdBack">Back to wheel menu</button>
      </div>
    `;
    document.querySelector("#cdAgain").onclick = () => startColourDrill(chunk);
    document.querySelector("#cdNext").onclick  = renderColourMenu;
    document.querySelector("#cdBack").onclick  = renderWheelTrainer;
    return;
  }

  const target = queue[index];
  const isRed = REDS.has(target);
  const total = queue.length;

  let revealClass = "";
  if (showAnswer) revealClass = isRed ? "reveal-red" : "reveal-black";

  content.innerHTML = `
    <div class="mode-label">Colour Drill — ${chunk.label}</div>
    <div class="progress"><div class="bar" style="width:${Math.round(index / total * 100)}%"></div></div>
    <p class="tiny">Question ${index + 1} of ${total} · Correct: ${correct} · Mistakes: ${wrong}</p>

    <p class="tiny" style="text-align:center;margin:14px 0 0;">Is this number red or black?</p>
    <div class="colour-target-num ${revealClass}">${target}</div>

    ${showAnswer ? `
      <p class="tiny" style="text-align:center;margin:6px 0 0;font-weight:850;color:${
        lastAnswer === "correct" ? "var(--green)" : "var(--red)"
      };">
        ${lastAnswer === "correct" ? "✓ Correct" : "✗ No"} — ${target} is ${isRed ? "RED" : "BLACK"}.
      </p>
      <div class="actions" style="justify-content:center;margin-top:14px;">
        <button class="primary" id="cdNext2">Next →</button>
        <button class="ghost"   id="cdQuit">Stop drilling</button>
      </div>
    ` : `
      <div class="colour-choice-row">
        <button class="colour-choice-btn choice-red"   id="cdRed">RED</button>
        <button class="colour-choice-btn choice-black" id="cdBlack">BLACK</button>
      </div>
      <div class="actions" style="justify-content:center;">
        <button class="ghost" id="cdQuit">Stop drilling</button>
      </div>
    `}
  `;

  if (showAnswer) {
    document.querySelector("#cdNext2").onclick = () => {
      colourDrill.index++;
      colourDrill.showAnswer = false;
      colourDrill.lastAnswer = null;
      renderColourDrill();
    };
  } else {
    const answer = (chose) => {
      const correctChoice = isRed ? "red" : "black";
      if (chose === correctChoice) {
        colourDrill.correct++;
        colourDrill.lastAnswer = "correct";
        state.xp += 1;
        state.dailyXp += 1;
        studyStreakTick();
      } else {
        colourDrill.wrong++;
        colourDrill.lastAnswer = "wrong";
        state.weakTopics.payouts = (state.weakTopics.payouts || 0) + 1;
        state.hearts = Math.max(0, state.hearts - 1);
      }
      colourDrill.showAnswer = true;
      saveState();
      updateStats();
      renderColourDrill();
    };
    document.querySelector("#cdRed").onclick   = () => answer("red");
    document.querySelector("#cdBlack").onclick = () => answer("black");
  }

  document.querySelector("#cdQuit").onclick = renderColourMenu;
}
