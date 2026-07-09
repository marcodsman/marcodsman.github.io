/* Marco XP window manager: windows, taskbar, start menu, clock, shutdown, boot.
   Depends on icons.js (ICONS/GLYPHS/iconMarkup) and apps.js (buildApps). */
(function () {
  "use strict";

  const desktop = document.getElementById("desktop");
  const iconsBox = document.getElementById("icons");
  const taskButtons = document.getElementById("task-buttons");
  const isMobile = () => matchMedia("(max-width:700px)").matches;

  const state = { z: 100, open: new Map(), cascade: 0 };
  let APPS = {};

  const wm = {
    open: openApp,
    close: closeWindow,
  };

  function openApp(id) {
    const app = APPS[id];
    if (!app) return;
    if (state.open.has(id)) { restoreWindow(id); focusWindow(id); return; }

    const el = document.createElement("div");
    el.className = "window";
    el.dataset.app = id;
    const off = (state.cascade++ % 6) * 26;
    const w = Math.min(app.w, innerWidth - 16);
    const h = Math.min(app.h, innerHeight - 60);
    el.style.left = Math.max(4, Math.min(app.x + off, innerWidth - w - 8)) + "px";
    el.style.top = Math.max(0, Math.min(app.y + off, innerHeight - h - 40)) + "px";
    el.style.width = w + "px";
    el.style.height = h + "px";
    el.innerHTML = `
      <div class="titlebar">
        <span class="t-ico">${iconMarkup(app.icon, 16)}</span>
        <span class="t-text">${app.title}</span>
        <button class="tb-btn mini" title="Minimize" aria-label="Minimize">${GLYPHS.min}</button>
        <button class="tb-btn maxi" title="Maximize" aria-label="Maximize">${GLYPHS.max}</button>
        <button class="tb-btn close" title="Close" aria-label="Close">${GLYPHS.close}</button>
      </div>
      <div class="win-body${app.noPad ? " no-pad" : ""}">${app.body()}</div>`;
    desktop.appendChild(el);

    const btn = document.createElement("button");
    btn.className = "task-btn";
    btn.innerHTML = `<span class="ti">${iconMarkup(app.icon, 15)}</span><span>${app.title}</span>`;
    btn.addEventListener("click", () => {
      const win = state.open.get(id);
      if (!win) return;
      if (win.el.classList.contains("minimized")) { restoreWindow(id); focusWindow(id); }
      else if (win.el.classList.contains("active")) minimizeWindow(id);
      else focusWindow(id);
    });
    taskButtons.appendChild(btn);

    state.open.set(id, { el, btn });
    wireWindow(el, id);
    if (app.init) app.init(el, wm);
    focusWindow(id);
  }

  function focusWindow(id) {
    for (const [wid, win] of state.open) {
      const on = wid === id;
      win.el.classList.toggle("active", on);
      win.btn.classList.toggle("active", on && !win.el.classList.contains("minimized"));
    }
    const win = state.open.get(id);
    if (win) win.el.style.zIndex = ++state.z;
  }
  function minimizeWindow(id) {
    const win = state.open.get(id);
    if (!win) return;
    win.el.classList.add("minimized");
    win.el.classList.remove("active");
    win.btn.classList.remove("active");
  }
  function restoreWindow(id) {
    const win = state.open.get(id);
    if (win) win.el.classList.remove("minimized");
  }
  function closeWindow(id) {
    const win = state.open.get(id);
    if (!win) return;
    win.el.remove();
    win.btn.remove();
    state.open.delete(id);
  }

  function wireWindow(el, id) {
    el.addEventListener("pointerdown", () => {
      if (!el.classList.contains("active")) focusWindow(id);
    }, true);

    const bar = el.querySelector(".titlebar");
    bar.querySelector(".mini").addEventListener("click", (e) => { e.stopPropagation(); minimizeWindow(id); });
    bar.querySelector(".maxi").addEventListener("click", (e) => { e.stopPropagation(); el.classList.toggle("max"); });
    bar.querySelector(".close").addEventListener("click", (e) => { e.stopPropagation(); closeWindow(id); });
    bar.addEventListener("dblclick", (e) => {
      if (!e.target.closest(".tb-btn") && !isMobile()) el.classList.toggle("max");
    });

    /* Drag. body.dragging disables pointer-events on iframes so embedded
       apps (roulette, classic) don't swallow the pointermove stream. */
    bar.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".tb-btn") || el.classList.contains("max") || isMobile()) return;
      const startX = e.clientX - el.offsetLeft;
      const startY = e.clientY - el.offsetTop;
      bar.setPointerCapture(e.pointerId);
      document.body.classList.add("dragging");
      const move = (ev) => {
        let x = ev.clientX - startX, y = ev.clientY - startY;
        x = Math.max(60 - el.offsetWidth, Math.min(x, innerWidth - 60));
        y = Math.max(0, Math.min(y, innerHeight - 62));
        el.style.left = x + "px";
        el.style.top = y + "px";
      };
      const up = () => {
        document.body.classList.remove("dragging");
        bar.removeEventListener("pointermove", move);
        bar.removeEventListener("pointerup", up);
        bar.removeEventListener("pointercancel", up);
      };
      bar.addEventListener("pointermove", move);
      bar.addEventListener("pointerup", up);
      bar.addEventListener("pointercancel", up);
    });

    /* Rows inside windows that open other apps or external links. */
    el.querySelectorAll("[data-open],[data-href]").forEach((row) => {
      const act = () => {
        if (row.dataset.open) openApp(row.dataset.open);
        else window.open(row.dataset.href, "_blank", "noopener");
      };
      row.addEventListener("click", act);
      row.addEventListener("keydown", (e) => { if (e.key === "Enter") act(); });
    });
  }

  /* ---------- Desktop icons ---------- */
  function buildDesktop(ids) {
    iconsBox.innerHTML = "";
    ids.forEach((id) => {
      const app = APPS[id];
      if (!app) return;
      const d = document.createElement("div");
      d.className = "icon";
      d.tabIndex = 0;
      d.innerHTML = `<span class="ico">${iconMarkup(app.icon, 34)}</span><span class="lbl">${app.label || app.title}</span>`;
      const open = () => { openApp(id); d.classList.remove("sel"); };
      d.addEventListener("click", () => {
        document.querySelectorAll(".icon.sel").forEach((i) => i.classList.remove("sel"));
        d.classList.add("sel");
        if (matchMedia("(pointer: coarse)").matches) open();
      });
      d.addEventListener("dblclick", open);
      d.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });
      iconsBox.appendChild(d);
    });
    desktop.addEventListener("click", (e) => {
      if (e.target === desktop) document.querySelectorAll(".icon.sel").forEach((i) => i.classList.remove("sel"));
    });
  }

  /* ---------- Start menu ---------- */
  const startBtn = document.getElementById("start-btn");
  const startMenu = document.getElementById("start-menu");

  function buildStartMenu(menuLeft, menuRight) {
    const left = document.getElementById("sm-left");
    const right = document.getElementById("sm-right");
    left.innerHTML = "";
    right.innerHTML = "";
    menuLeft.forEach((id) => {
      const app = APPS[id];
      if (!app) return;
      const item = document.createElement("div");
      item.className = "sm-item";
      item.innerHTML = `<span class="ico">${iconMarkup(app.icon, 24)}</span>${app.menu || app.title}`;
      item.addEventListener("click", () => { openApp(id); toggleStart(false); });
      left.appendChild(item);
    });
    menuRight.forEach((entry) => {
      let item;
      if (entry.href) {
        item = document.createElement("a");
        item.href = entry.href;
        item.target = "_blank";
        item.rel = "noopener";
        item.className = "sm-item";
        item.innerHTML = `<span class="ico">${iconMarkup(entry.icon, 24)}</span>${entry.label}`;
      } else {
        item = document.createElement("div");
        item.className = "sm-item";
        item.innerHTML = `<span class="ico">${iconMarkup(entry.icon, 24)}</span>${entry.label}`;
        item.addEventListener("click", () => { openApp(entry.open); toggleStart(false); });
      }
      right.appendChild(item);
    });
  }

  function toggleStart(force) {
    const on = force !== undefined ? force : !startMenu.classList.contains("open");
    startMenu.classList.toggle("open", on);
    startBtn.classList.toggle("pressed", on);
  }
  startBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleStart(); });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#start-menu") && !e.target.closest("#start-btn")) toggleStart(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleStart(false); });

  /* ---------- Shutdown ---------- */
  document.getElementById("turn-off").addEventListener("click", () => {
    toggleStart(false);
    document.getElementById("shutdown").classList.add("on");
  });
  document.getElementById("restart").addEventListener("click", () => {
    document.getElementById("shutdown").classList.remove("on");
  });

  /* ---------- Clock ---------- */
  function tick() {
    const d = new Date();
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    document.getElementById("clock").textContent = `${h}:${m} ${ap}`;
  }
  tick();
  setInterval(tick, 15000);

  /* ---------- Boot ---------- */
  const FALLBACK = {
    meta: { updated: "" },
    hero: { title: "Hi. I'm Marco.", subtitle: "I create websites and web apps." },
    about: {
      short: "Full-stack JavaScript developer in South Africa.",
      notepad: "Hi. I'm Marco.\n\nFull-stack JavaScript developer in South Africa.\n\nThe content file failed to load, but you can reach me at:\n\nmarco@marcodasilva.co.za\ngithub.com/marcodsman",
    },
    skills: { summary: "", list: ["JavaScript", "React", "Node"] },
    projects: [],
    certifications: [],
    cv: { name: "Marco Da Silva", tagline: "Full-stack JavaScript developer", sections: [] },
    contact: {
      email: "marco@marcodasilva.co.za",
      availability: "",
      socials: [{ id: "github", label: "GitHub", url: "https://github.com/marcodsman", icon: "github" }],
    },
  };

  function boot(content) {
    const built = buildApps(content);
    APPS = built.apps;
    buildDesktop(built.desktop);
    buildStartMenu(built.menuLeft, built.menuRight);
    const requested = new URLSearchParams(location.search).get("open");
    openApp(requested && APPS[requested] ? requested : "about");
  }

  /* Install Marco: the whole desktop works offline (like the roulette
     trainer it hosts). Registered after boot so it never delays first paint. */
  if ("serviceWorker" in navigator) {
    addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").then((reg) => reg.update()).catch(() => {});
    });
  }

  fetch("/content/content.json")
    .then((r) => {
      if (!r.ok) throw new Error(`content.json ${r.status}`);
      return r.json();
    })
    .then(boot)
    .catch((err) => {
      console.error("Failed to load shared content, booting fallback:", err);
      boot(FALLBACK);
    });
})();
