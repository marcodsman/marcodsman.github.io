/* Minesweeper for Marco XP — native shell app, zero dependencies.
   apps.js registers it via buildMinesweeperApp(); wm.js opens it like any window.
   9x9, 10 mines. First click is never a mine. Chording on revealed numbers.
   Touch: tap reveals, long-press flags. Keyboard: arrows + Enter, F to flag. */

function buildMinesweeperApp() {
  return {
    title: "Minesweeper", icon: "mine", label: "Minesweeper",
    menu: "Minesweeper", w: 296, h: 420, x: 330, y: 90,
    body: () => `<div class="ms">
      <div class="ms-frame">
        <div class="ms-top">
          <span class="ms-led ms-mines">010</span>
          <button class="ms-face" aria-label="New game">&#x1F642;</button>
          <span class="ms-led ms-time">000</span>
        </div>
        <div class="ms-grid" role="grid" aria-label="Minesweeper board, 9 by 9" tabindex="0"></div>
      </div>
      <div class="ms-help">left-click reveal &middot; right-click / long-press flag &middot; arrows + Enter, F flags</div>
    </div>`,
    init: (el) => initMinesweeper(el, 9, 9, 10),
  };
}

function initMinesweeper(el, W, H, N) {
  const grid = el.querySelector(".ms-grid");
  const face = el.querySelector(".ms-face");
  const ledMines = el.querySelector(".ms-mines");
  const ledTime = el.querySelector(".ms-time");
  const FACE = { play: "\u{1F642}", press: "\u{1F62E}", dead: "\u{1F635}", cool: "\u{1F60E}" };

  let mine, count, open, flag, started, over, secs, timer, cur, lpTimer, lpAt = 0;

  const led = (box, n) =>
    box.textContent = n < 0
      ? "-" + String(Math.min(-n, 99)).padStart(2, "0")
      : String(Math.min(n, 999)).padStart(3, "0");

  const neighbors = (i) => {
    const x = i % W, y = (i / W) | 0, out = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if ((dx || dy) && nx >= 0 && nx < W && ny >= 0 && ny < H) out.push(ny * W + nx);
    }
    return out;
  };
  const cellEl = (i) => grid.children[i];

  function reset() {
    clearInterval(timer);
    mine = new Array(W * H).fill(false);
    count = new Array(W * H).fill(0);
    open = new Array(W * H).fill(false);
    flag = new Array(W * H).fill(false);
    started = false; over = false; secs = 0; cur = -1;
    face.textContent = FACE.play;
    led(ledMines, N); led(ledTime, 0);
    grid.innerHTML = "";
    for (let i = 0; i < W * H; i++) {
      const c = document.createElement("div");
      c.className = "ms-cell";
      c.dataset.i = i;
      c.setAttribute("role", "gridcell");
      grid.appendChild(c);
    }
  }

  function start(safe) {
    started = true;
    let placed = 0;
    while (placed < N) {
      const i = (Math.random() * W * H) | 0;
      if (i === safe || mine[i]) continue;
      mine[i] = true; placed++;
    }
    for (let i = 0; i < W * H; i++) count[i] = neighbors(i).filter((j) => mine[j]).length;
    timer = setInterval(() => {
      if (!el.isConnected) { clearInterval(timer); return; }
      if (secs < 999) led(ledTime, ++secs);
    }, 1000);
  }

  function paint(i) {
    const c = cellEl(i);
    if (open[i]) {
      c.className = "ms-cell open" + (count[i] ? " n" + count[i] : "");
      c.textContent = count[i] || "";
    } else {
      c.textContent = flag[i] ? "\u{1F6A9}" : "";
    }
    if (i === cur) c.classList.add("cur");
  }

  function toggleFlag(i) {
    if (over || open[i]) return;
    flag[i] = !flag[i];
    paint(i);
    led(ledMines, N - flag.filter(Boolean).length);
  }

  function lose(hit) {
    over = true; clearInterval(timer);
    face.textContent = FACE.dead;
    for (let i = 0; i < W * H; i++) {
      const c = cellEl(i);
      if (mine[i] && !flag[i]) { c.classList.add("open"); c.textContent = "\u{1F4A3}"; }
      if (!mine[i] && flag[i]) c.textContent = "✖";
    }
    cellEl(hit).classList.add("hit");
  }

  function checkWin() {
    if (over || open.filter(Boolean).length !== W * H - N) return;
    over = true; clearInterval(timer);
    face.textContent = FACE.cool;
    for (let i = 0; i < W * H; i++) if (mine[i] && !flag[i]) { flag[i] = true; paint(i); }
    led(ledMines, 0);
  }

  function reveal(i) {
    if (over || flag[i] || open[i]) return;
    if (!started) start(i);
    if (mine[i]) { lose(i); return; }
    const stack = [i];
    while (stack.length) {
      const j = stack.pop();
      if (open[j] || flag[j]) continue;
      open[j] = true; paint(j);
      if (!count[j]) stack.push(...neighbors(j).filter((k) => !open[k]));
    }
    checkWin();
  }

  /* Click a satisfied number to reveal its unflagged neighbours. */
  function chord(i) {
    if (over || !open[i] || !count[i]) return;
    const ns = neighbors(i);
    if (ns.filter((j) => flag[j]).length !== count[i]) return;
    ns.forEach((j) => reveal(j));
  }

  grid.addEventListener("click", (e) => {
    if (Date.now() - lpAt < 600) return; // long-press already flagged this touch
    const c = e.target.closest(".ms-cell");
    if (!c) return;
    const i = +c.dataset.i;
    if (open[i]) chord(i); else reveal(i);
  });

  grid.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (Date.now() - lpAt < 600) return;
    const c = e.target.closest(".ms-cell");
    if (c) toggleFlag(+c.dataset.i);
  });

  /* Touch: long-press to flag (iOS fires no contextmenu). */
  grid.addEventListener("pointerdown", (e) => {
    if (!over) face.textContent = FACE.press;
    const c = e.target.closest(".ms-cell");
    if (!c || e.pointerType !== "touch") return;
    clearTimeout(lpTimer);
    lpTimer = setTimeout(() => { toggleFlag(+c.dataset.i); lpAt = Date.now(); }, 450);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((t) =>
    grid.addEventListener(t, () => {
      clearTimeout(lpTimer);
      if (!over) face.textContent = FACE.play;
    }));

  /* Keyboard: roving cursor on the focusable grid. */
  const setCur = (i) => {
    if (cur >= 0 && cellEl(cur)) cellEl(cur).classList.remove("cur");
    cur = i;
    cellEl(cur).classList.add("cur");
  };
  grid.addEventListener("focus", () => { if (cur < 0) setCur(W * H >> 1); });
  grid.addEventListener("keydown", (e) => {
    const move = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -W, ArrowDown: W }[e.key];
    if (move) {
      e.preventDefault();
      if (cur < 0) { setCur(W * H >> 1); return; }
      if (move === -1 && cur % W === 0) return;
      if (move === 1 && cur % W === W - 1) return;
      const n = cur + move;
      if (n >= 0 && n < W * H) setCur(n);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (cur >= 0) { if (open[cur]) chord(cur); else reveal(cur); }
    } else if (e.key === "f" || e.key === "F") {
      if (cur >= 0) toggleFlag(cur);
    }
  });

  face.addEventListener("click", reset);
  reset();
}
