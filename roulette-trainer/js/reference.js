// Reference view: bet placement diagrams + house edge explainer

function renderReference() {
  const content = document.querySelector("#content");
  content.innerHTML = `
    <div class="mode-label">Reference</div>
    <div class="question">Diagrams &amp; Maths</div>

    <div class="ref-tabs">
      <button class="ref-tab active" data-ref="announced">Announced Bet Placements</button>
      <button class="ref-tab" data-ref="callbets">Call Bets (Finales)</button>
      <button class="ref-tab" data-ref="edge">House Edge</button>
    </div>

    <div id="refContent"></div>
  `;

  content.querySelectorAll(".ref-tab").forEach(btn => {
    btn.onclick = () => {
      content.querySelectorAll(".ref-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderRefSection(btn.dataset.ref);
    };
  });

  renderRefSection("announced");
}

function renderRefSection(section) {
  const box = document.querySelector("#refContent");
  if (section === "announced") renderAnnouncedDiagrams(box);
  if (section === "callbets")  renderCallBetsReference(box);
  if (section === "edge")      renderHouseEdge(box);
}

// ---------------------------------------------------------------------------
// Announced bet placement diagrams
// ---------------------------------------------------------------------------

// The roulette table layout (European, 3 columns of 12):
// Row 1 (top): 3  6  9  12  15  18  21  24  27  30  33  36
// Row 2 (mid): 2  5  8  11  14  17  20  23  26  29  32  35
// Row 3 (bot): 1  4  7  10  13  16  19  22  25  28  31  34
// Zero sits to the left spanning all 3 rows.

const TABLE_LAYOUT = [
  [3,6,9,12,15,18,21,24,27,30,33,36],
  [2,5,8,11,14,17,20,23,26,29,32,35],
  [1,4,7,10,13,16,19,22,25,28,31,34]
];

// Cell size in SVG units
const TC = 34, TH = 30;
// Grid starts at x=52 (after zero), y=8
const TX0 = 52, TY0 = 8;

function tableNumberPos(n) {
  // Returns SVG centre [x, y] for a given number
  if (n === 0) return [TX0 - TC / 2 - 2, TY0 + TH * 1.5]; // zero on the left
  for (let row = 0; row < 3; row++) {
    const col = TABLE_LAYOUT[row].indexOf(n);
    if (col !== -1) {
      return [TX0 + col * TC + TC / 2, TY0 + row * TH + TH / 2];
    }
  }
  return null;
}

function buildTableSVG(betNumbers, betPlacements) {
  // betPlacements: array of { type, numbers, label? }
  // types: "straight", "split", "street", "corner", "sixline"
  const W = TX0 + 12 * TC + 4;
  const H = TY0 + 3 * TH + TY0;
  const NS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("class", "table-svg");

  const defs = document.createElementNS(NS, "defs");
  const chipGrad = document.createElementNS(NS, "radialGradient");
  chipGrad.id = "chipG";
  chipGrad.innerHTML = `<stop offset="0%" stop-color="#fff8d0"/><stop offset="100%" stop-color="#c8962a"/>`;
  defs.appendChild(chipGrad);
  svg.appendChild(defs);

  // Background
  const bg = document.createElementNS(NS, "rect");
  bg.setAttribute("x","0"); bg.setAttribute("y","0");
  bg.setAttribute("width", W); bg.setAttribute("height", H);
  bg.setAttribute("fill","#0d2a18"); bg.setAttribute("rx","6");
  svg.appendChild(bg);

  // Zero cell
  const zeroRect = document.createElementNS(NS, "rect");
  zeroRect.setAttribute("x", 2); zeroRect.setAttribute("y", TY0);
  zeroRect.setAttribute("width", TC - 4); zeroRect.setAttribute("height", 3 * TH);
  zeroRect.setAttribute("rx","3");
  zeroRect.setAttribute("fill", betNumbers.includes(0) ? "#0a7a42" : "#0a5530");
  zeroRect.setAttribute("stroke", "#1a6040"); zeroRect.setAttribute("stroke-width","1");
  svg.appendChild(zeroRect);

  const zeroText = document.createElementNS(NS, "text");
  zeroText.setAttribute("x", 2 + (TC - 4) / 2); zeroText.setAttribute("y", TY0 + 3 * TH / 2);
  zeroText.setAttribute("text-anchor","middle"); zeroText.setAttribute("dominant-baseline","middle");
  zeroText.setAttribute("fill","#fff"); zeroText.setAttribute("font-size","13");
  zeroText.setAttribute("font-weight","900");
  zeroText.setAttribute("font-family","system-ui,sans-serif");
  zeroText.textContent = "0";
  svg.appendChild(zeroText);

  // Number cells
  TABLE_LAYOUT.forEach((row, rowIdx) => {
    row.forEach((n, colIdx) => {
      const x = TX0 + colIdx * TC;
      const y = TY0 + rowIdx * TH;
      const isRed = REDS.has(n);
      const highlighted = betNumbers.includes(n);

      const rect = document.createElementNS(NS, "rect");
      rect.setAttribute("x", x + 1); rect.setAttribute("y", y + 1);
      rect.setAttribute("width", TC - 2); rect.setAttribute("height", TH - 2);
      rect.setAttribute("rx","2");
      if (highlighted) {
        rect.setAttribute("fill", isRed ? "#c0202e" : "#2a2a2a");
        rect.setAttribute("stroke", "#ffd166"); rect.setAttribute("stroke-width","1.5");
      } else {
        rect.setAttribute("fill", isRed ? "#7a1018" : "#131313");
        rect.setAttribute("stroke","#1a3a28"); rect.setAttribute("stroke-width","0.5");
      }
      svg.appendChild(rect);

      const text = document.createElementNS(NS, "text");
      text.setAttribute("x", x + TC / 2); text.setAttribute("y", y + TH / 2);
      text.setAttribute("text-anchor","middle"); text.setAttribute("dominant-baseline","middle");
      text.setAttribute("fill", highlighted ? "#fff" : "#6a8a7a");
      text.setAttribute("font-size","10"); text.setAttribute("font-weight","800");
      text.setAttribute("font-family","system-ui,sans-serif");
      text.textContent = n;
      svg.appendChild(text);
    });
  });

  // Draw chip placements
  betPlacements.forEach(p => {
    if (p.type === "straight") {
      const pos = tableNumberPos(p.numbers[0]);
      if (!pos) return;
      drawChip(svg, NS, pos[0], pos[1], p.label || "1");
    }

    if (p.type === "split") {
      // chip sits on the line between two adjacent numbers
      const p1 = tableNumberPos(p.numbers[0]);
      const p2 = tableNumberPos(p.numbers[1]);
      if (!p1 || !p2) return;
      drawChip(svg, NS, (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, p.label || "1");
    }

    if (p.type === "street") {
      // chip on the right edge of the row (or left, but right is conventional)
      const pos = tableNumberPos(p.numbers[1]); // middle number of the street
      if (!pos) return;
      drawChip(svg, NS, pos[0], pos[1], p.label || "1");
    }

    if (p.type === "corner") {
      const positions = p.numbers.map(tableNumberPos).filter(Boolean);
      if (positions.length < 4) return;
      const cx = positions.reduce((s, pp) => s + pp[0], 0) / positions.length;
      const cy = positions.reduce((s, pp) => s + pp[1], 0) / positions.length;
      drawChip(svg, NS, cx, cy, p.label || "1");
    }
  });

  return svg;
}

function drawChip(svg, NS, cx, cy, label) {
  const circle = document.createElementNS(NS, "circle");
  circle.setAttribute("cx", cx); circle.setAttribute("cy", cy); circle.setAttribute("r","8");
  circle.setAttribute("fill","url(#chipG)");
  circle.setAttribute("stroke","#8a6010"); circle.setAttribute("stroke-width","1.5");
  svg.appendChild(circle);

  const text = document.createElementNS(NS, "text");
  text.setAttribute("x", cx); text.setAttribute("y", cy);
  text.setAttribute("text-anchor","middle"); text.setAttribute("dominant-baseline","middle");
  text.setAttribute("fill","#3a2000"); text.setAttribute("font-size","7");
  text.setAttribute("font-weight","900"); text.setAttribute("font-family","system-ui,sans-serif");
  text.textContent = label;
  svg.appendChild(text);
}

// Chip placement specs for each announced bet
const ANNOUNCED_PLACEMENTS = [
  {
    name: "Voisins du Zéro",
    chips: 9,
    numbers: [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25],
    placements: [
      { type: "street",   numbers: [0,2,3],      label: "2" },  // 0/2/3 two chips
      { type: "split",    numbers: [4,7],         label: "1" },
      { type: "split",    numbers: [12,15],       label: "1" },
      { type: "split",    numbers: [18,21],       label: "1" },
      { type: "split",    numbers: [19,22],       label: "1" },
      { type: "corner",   numbers: [25,26,28,29], label: "2" }, // 25/26/28/29 two chips
      { type: "split",    numbers: [32,35],       label: "1" }
    ],
    note: "9 chips total. The 0/2/3 street and 25/26/28/29 corner each use 2 chips; all other bets are 1 chip."
  },
  {
    name: "Tiers du Cylindre",
    chips: 6,
    numbers: [27,13,36,11,30,8,23,10,5,24,16,33],
    placements: [
      { type: "split", numbers: [5,8],   label: "1" },
      { type: "split", numbers: [10,11], label: "1" },
      { type: "split", numbers: [13,16], label: "1" },
      { type: "split", numbers: [23,24], label: "1" },
      { type: "split", numbers: [27,30], label: "1" },
      { type: "split", numbers: [33,36], label: "1" }
    ],
    note: "6 chips, all splits. The simplest of the four announced bets to place."
  },
  {
    name: "Orphelins",
    chips: 5,
    numbers: [1,20,14,31,9,17,34,6],
    placements: [
      { type: "straight", numbers: [1],    label: "1" },
      { type: "split",    numbers: [6,9],  label: "1" },
      { type: "split",    numbers: [14,17],label: "1" },
      { type: "split",    numbers: [17,20],label: "1" },
      { type: "split",    numbers: [31,34],label: "1" }
    ],
    note: "5 chips. Number 1 is straight-up. Number 17 is covered by two split bets (14/17 and 17/20)."
  },
  {
    name: "Zero Spiel",
    chips: 4,
    numbers: [12,35,3,26,0,32,15],
    placements: [
      { type: "straight", numbers: [26],   label: "1" },
      { type: "split",    numbers: [0,3],  label: "1" },
      { type: "split",    numbers: [12,15],label: "1" },
      { type: "split",    numbers: [32,35],label: "1" }
    ],
    note: "4 chips. Number 26 is straight-up; the remaining 6 numbers are covered by 3 splits."
  }
];

function renderAnnouncedDiagrams(box) {
  box.innerHTML = `
    <p class="tiny" style="margin-bottom:16px;">
      Each diagram shows which numbers are covered (highlighted) and where the chips sit on the layout.
      Gold dots = chip positions. Numbers on the chip = chip count for that bet.
    </p>
    <div class="grid" id="diagramGrid"></div>
  `;

  const grid = box.querySelector("#diagramGrid");

  ANNOUNCED_PLACEMENTS.forEach(bet => {
    const card = document.createElement("div");
    card.className = "ref-card";

    const sector = SECTORS.find(s => s.name === bet.name);
    const color = sector ? sector.color : "#888";

    card.innerHTML = `
      <div class="ref-card-header" style="color:${color}">${bet.name}
        <span class="ref-card-chips">${bet.chips} chips</span>
      </div>
      <div class="table-svg-wrap"></div>
      <div class="tiny ref-card-note">${bet.note}</div>
    `;

    const svgWrap = card.querySelector(".table-svg-wrap");
    svgWrap.appendChild(buildTableSVG(bet.numbers, bet.placements));
    grid.appendChild(card);
  });
}

// ---------------------------------------------------------------------------
// Call bets reference table
// ---------------------------------------------------------------------------

function renderCallBetsReference(box) {
  const pleinBets  = CALL_BETS.filter(b => b.type === "finale-plein");
  const chevalBets = CALL_BETS.filter(b => b.type === "finale-cheval");

  box.innerHTML = `
    <p class="tiny" style="margin-bottom:16px;">
      Call bets are verbal bets placed by announcing the bet name. The dealer places the chips.
    </p>

    <h3 class="section-title">Finales en plein</h3>
    <p class="tiny" style="margin-bottom:10px;">
      A straight-up bet on every number ending in the called digit.
      Digits 0–6 cover 4 numbers (4 chips); digits 7–9 cover only 3 numbers (3 chips).
    </p>
    <div class="call-bet-grid" id="pleinGrid"></div>

    <h3 class="section-title" style="margin-top:20px;">Finales à cheval</h3>
    <p class="tiny" style="margin-bottom:10px;">
      Splits on pairs of numbers sharing the called digit endings.
      Where one digit in the pair has no matching tens partner, that number is placed as a straight-up.
    </p>
    <div class="call-bet-grid" id="chevalGrid"></div>
  `;

  const pleinGrid = box.querySelector("#pleinGrid");
  pleinBets.forEach(bet => {
    const div = document.createElement("div");
    div.className = "call-bet-chip";
    div.innerHTML = `
      <div class="cbc-name">${bet.name}</div>
      <div class="cbc-nums">${bet.numbers.join(", ")}</div>
      <div class="cbc-chips">${bet.chips} chip${bet.chips !== 1 ? "s" : ""}</div>
    `;
    pleinGrid.appendChild(div);
  });

  const chevalGrid = box.querySelector("#chevalGrid");
  chevalBets.forEach(bet => {
    const div = document.createElement("div");
    div.className = "call-bet-chip";
    div.innerHTML = `
      <div class="cbc-name">${bet.name}</div>
      <div class="cbc-desc">${bet.description}</div>
      <div class="cbc-chips">${bet.chips} chips</div>
    `;
    chevalGrid.appendChild(div);
  });
}

// ---------------------------------------------------------------------------
// House edge explainer
// ---------------------------------------------------------------------------

function renderHouseEdge(box) {
  box.innerHTML = `
    <div class="edge-explainer">

      <div class="edge-section">
        <h3 class="edge-heading">The single-zero wheel</h3>
        <p class="tiny">
          A European/French roulette wheel has 37 pockets numbered 0–36.
          Every bet is calculated as if there were only 36 numbers —
          the zero is the house's built-in advantage.
        </p>
      </div>

      <div class="edge-section">
        <h3 class="edge-heading">The maths behind the edge</h3>
        <p class="tiny">For a straight-up bet on one number:</p>
        <div class="edge-calc">
          <div class="edge-row">
            <span class="edge-label">Probability of winning</span>
            <span class="edge-value">1 in 37 &nbsp;≈ 2.70%</span>
          </div>
          <div class="edge-row">
            <span class="edge-label">Payout (profit)</span>
            <span class="edge-value">35 × stake</span>
          </div>
          <div class="edge-row">
            <span class="edge-label">Fair payout would be</span>
            <span class="edge-value">36 × stake</span>
          </div>
          <div class="edge-row edge-highlight">
            <span class="edge-label">House edge</span>
            <span class="edge-value">1 ÷ 37 &nbsp;= 2.70%</span>
          </div>
        </div>
        <p class="tiny" style="margin-top:10px;">
          The same 2.70% applies to every bet on a European wheel — straight-up, splits,
          dozens, even-money bets — because the zero is always present.
        </p>
      </div>

      <div class="edge-section">
        <h3 class="edge-heading">How to explain it to a player</h3>
        <p class="tiny">
          "For every €100 bet over the long run, the house expects to keep €2.70.
          In any single spin anything can happen — but the zero is why the casino
          has a small mathematical edge over time."
        </p>
      </div>

      <div class="edge-section">
        <h3 class="edge-heading">La Partage and En Prison (French rules)</h3>
        <p class="tiny">
          Some French tables apply special rules on even-money bets when zero hits:
        </p>
        <div class="edge-calc">
          <div class="edge-row">
            <span class="edge-label">La Partage</span>
            <span class="edge-value">Player gets half the stake back</span>
          </div>
          <div class="edge-row">
            <span class="edge-label">En Prison</span>
            <span class="edge-value">Bet is held for the next spin</span>
          </div>
          <div class="edge-row edge-highlight">
            <span class="edge-label">Edge on even-money with La Partage</span>
            <span class="edge-value">1.35%</span>
          </div>
        </div>
        <p class="tiny" style="margin-top:10px;">
          These rules halve the house edge on even-money bets only. Always check your venue's rules.
        </p>
      </div>

      <div class="edge-section">
        <h3 class="edge-heading">Quick reference — all bets, same edge</h3>
        <div class="edge-calc">
          ${[
            ["Straight up",  "1/37",  "35:1"],
            ["Split",        "2/37",  "17:1"],
            ["Street",       "3/37",  "11:1"],
            ["Corner",       "4/37",  "8:1"],
            ["Six line",     "6/37",  "5:1"],
            ["Dozen/Column", "12/37", "2:1"],
            ["Even money",   "18/37", "1:1"]
          ].map(([name, prob, pays]) => `
            <div class="edge-row">
              <span class="edge-label">${name}</span>
              <span class="edge-value">${prob} &nbsp;·&nbsp; pays ${pays}</span>
            </div>
          `).join("")}
          <div class="edge-row edge-highlight">
            <span class="edge-label">House edge (all bets)</span>
            <span class="edge-value">2.70%</span>
          </div>
        </div>
      </div>

    </div>
  `;
}
