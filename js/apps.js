/* App registry for Marco XP. buildApps(content) returns {apps, desktop, menuLeft, menuRight}.
   Window bodies are functions of the shared content so everything renders from
   /content/content.json — edit that file, both this site and /classic/ update. */

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function statusBadge(p) {
  if (!p.status) return "";
  return `<span class="status-badge ${p.status}">${p.status === "archived" ? "archived — demo host shut down" : "live"}</span>`;
}

function chips(tech) {
  return (tech || []).map((t) => `<span class="chip">${escHtml(t)}</span>`).join("");
}

/* Featured rows open detail windows; embedded apps open their iframe windows directly. */
function projectTarget(p) {
  if (p.id === "roulette-trainer") return { open: "roulette" };
  if (p.url === "/classic/") return { open: "classic" };
  if (p.type === "featured") return { open: "proj:" + p.id };
  return { href: p.url };
}

function fileRow(p) {
  const t = projectTarget(p);
  const attr = t.open ? `data-open="${t.open}"` : `data-href="${escHtml(t.href)}"`;
  const size = (p.tech && p.tech[0]) || "";
  return `<div class="file-row" ${attr} tabindex="0" role="button">
    <span class="ico">${iconMarkup(p.icon, 24)}</span>
    <b>${escHtml(p.name)}</b>${p.status === "archived" ? '<span class="status-badge archived">archived</span>' : ""}
    <small>${escHtml(size)}</small>
  </div>`;
}

function buildApps(content) {
  const apps = {};
  const projects = content.projects || [];
  const featured = projects.filter((p) => p.type === "featured");
  const extras = projects.filter((p) => p.type === "extra");

  apps.about = {
    title: "about_me.txt - Notepad", icon: "notepad", label: "about_me.txt",
    menu: "Notepad (about_me.txt)", w: 420, h: 340, x: 120, y: 60,
    body: () => `<div class="notepad-wrap">
      <div class="menubar"><em>File</em><em>Edit</em><em>Format</em><em>View</em><em>Help</em></div>
      <textarea class="notepad" spellcheck="false">${escHtml(content.about.notepad)}</textarea>
    </div>`,
  };

  apps.projects = {
    title: "My Projects", icon: "folder", label: "My Projects",
    menu: "My Projects", w: 480, h: 360, x: 190, y: 100,
    body: () => `<div class="exp">
      <div class="exp-side">
        <h4>File and Folder Tasks</h4>
        <p>Everything here is real software, not a screenshot. Click a file to open it.</p>
      </div>
      <div class="exp-main">
        ${featured.map(fileRow).join("")}
        <details>
          <summary>freeCodeCamp era (${extras.length} more)</summary>
          ${extras.map(fileRow).join("")}
        </details>
      </div>
    </div>`,
  };

  featured.forEach((p) => {
    const t = projectTarget(p);
    if (t.open && t.open !== "proj:" + p.id) return; // embedded apps have their own windows
    apps["proj:" + p.id] = {
      title: p.name, icon: p.icon || "app", label: p.name,
      w: 440, h: 380, x: 240, y: 80,
      body: () => `<div class="proj">
        <h2>${escHtml(p.name)}${statusBadge(p)}</h2>
        <div>${chips(p.tech)}</div>
        ${p.image ? `<img src="${encodeURI(p.image)}" alt="${escHtml(p.name)} screenshot">` : ""}
        <p>${escHtml(p.description || "")}</p>
        ${p.status === "archived"
          ? `<p class="open-row">The live demo went down with its host, but the work was real — ask me about it.</p>`
          : `<p class="open-row"><a href="${escHtml(p.url)}" target="_blank" rel="noopener">Open ${escHtml(p.name)} &rarr;</a></p>`}
      </div>`,
    };
  });

  apps.roulette = {
    title: "French Roulette Trainer", icon: "wheel", label: "Roulette Trainer",
    w: 430, h: 620, x: 250, y: 10, noPad: true,
    body: () => `<iframe class="win-iframe" src="/roulette-trainer/" title="French Roulette Trainer"></iframe>`,
  };

  apps.classic = {
    title: "old_portfolio_2018 - Internet Explorer", icon: "ie", label: "Old Portfolio (2018)",
    w: 560, h: 440, x: 130, y: 60, noPad: true,
    body: () => `
      <div class="ie-bar">
        <label>Address</label>
        <span class="ie-addr">https://marcodasilva.co.za/classic/</span>
        <a href="/classic/" target="_blank" rel="noopener">Open in new tab</a>
      </div>
      <iframe class="win-iframe" src="/classic/" title="Classic 2018 portfolio"></iframe>`,
  };

  apps.cv = {
    title: "Marco_CV.doc", icon: "doc", label: "Marco_CV.doc",
    menu: "Marco_CV.doc", w: 440, h: 400, x: 220, y: 50,
    body: () => {
      const byId = Object.fromEntries(projects.map((p) => [p.id, p]));
      const certById = Object.fromEntries((content.certifications || []).map((c) => [c.id, c]));
      const sections = (content.cv.sections || []).map((s) => {
        let inner = "";
        if (s.body) inner = `<p>${escHtml(s.body)}</p>`;
        if (s.projectIds) inner = `<ul>${s.projectIds.map((id) => {
          const p = byId[id]; if (!p) return "";
          return `<li><b>${escHtml(p.name)}</b> — ${escHtml(p.description || (p.tech || []).join(", "))}</li>`;
        }).join("")}</ul>`;
        if (s.certIds) inner = `<ul>${s.certIds.map((id) => {
          const c = certById[id]; if (!c) return "";
          return `<li><a href="${escHtml(c.url)}" target="_blank" rel="noopener">${escHtml(c.name)}</a> — ${escHtml(c.issuer)}</li>`;
        }).join("")}</ul>`;
        return `<h3>${escHtml(s.title)}</h3>${inner}`;
      }).join("");
      const socials = (content.contact.socials || [])
        .map((s) => `<a href="${escHtml(s.url)}" target="_blank" rel="noopener">${escHtml(s.label)}</a>`)
        .join(" &middot; ");
      return `<div class="doc">
        <h2>${escHtml(content.cv.name)}</h2>
        <p class="muted">${escHtml(content.cv.tagline)}</p>
        ${sections}
        <h3>Contact</h3>
        <p><a href="mailto:${escHtml(content.contact.email)}">${escHtml(content.contact.email)}</a><br>${socials}</p>
        <p class="muted">${escHtml(content.contact.availability)}</p>
      </div>`;
    },
  };

  apps.cmd = {
    title: "Command Prompt", icon: "cmd", label: "Command Prompt",
    menu: "Command Prompt", w: 520, h: 320, x: 160, y: 170,
    body: () => `<div class="cmd">
      <div class="cmd-out">Microsoft Windows XP [Marco Build ${escHtml(content.meta.updated || "2026")}]
(C) ${escHtml(content.cv.name)}. Type 'help' to get started.
</div>
      <div class="cmd-line"><span>C:\\Users\\Marco&gt;</span><input type="text" autocomplete="off" spellcheck="false" aria-label="command input"></div>
    </div>`,
    init: (el, wm) => initCmd(el, wm, content),
  };

  apps.minesweeper = buildMinesweeperApp();

  apps.recycle = {
    title: "Recycle Bin", icon: "recycle", label: "Recycle Bin",
    menu: "Recycle Bin", w: 420, h: 260, x: 300, y: 150,
    body: () => `<div class="exp">
      <div class="exp-side">
        <h4>Recycle Bin Tasks</h4>
        <p>Some things are deleted for a reason. You can still peek.</p>
      </div>
      <div class="exp-main">
        <div class="file-row" data-open="classic" tabindex="0" role="button">
          <span class="ico">${ICONS.ie}</span>
          <b>old_portfolio_2018.html</b><small>Bootstrap 4</small>
        </div>
      </div>
    </div>`,
  };

  const github = (content.contact.socials || []).find((s) => s.id === "github");

  return {
    apps,
    desktop: ["about", "projects", "roulette", "minesweeper", "cmd", "cv", "recycle"],
    menuLeft: ["about", "projects", "cmd", "cv"],
    menuRight: [
      { open: "roulette", label: "Roulette Trainer", icon: "wheel" },
      { open: "minesweeper", label: "Minesweeper", icon: "mine" },
      { open: "recycle", label: "Recycle Bin", icon: "recycle" },
      { open: "classic", label: "Old Portfolio (2018)", icon: "ie" },
      github ? { href: github.url, label: "GitHub", icon: "github" } : null,
    ].filter(Boolean),
  };
}

function initCmd(el, wm, content) {
  const out = el.querySelector(".cmd-out");
  const input = el.querySelector(".cmd-line input");
  el.querySelector(".cmd").addEventListener("click", () => input.focus());

  const projLines = (content.projects || [])
    .map((p) => `  ${p.status === "archived" ? "<ARCH>" : "<LIVE>"}  ${p.name}`)
    .join("\n");
  const socials = (content.contact.socials || []).map((s) => `${s.label}:  ${s.url}`).join("\n");

  const CMDS = {
    help: `Available commands:
  about     who is marco
  skills    the stack
  projects  list shipped work
  contact   how to reach me
  clear     clear the screen
  exit      close this window`,
    about: content.about.short,
    skills: (content.skills.list || []).join(", "),
    projects: projLines,
    contact: `Email:   ${content.contact.email}\n${socials}`,
  };

  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const raw = input.value.trim();
    input.value = "";
    out.textContent += `\nC:\\Users\\Marco>${raw}\n`;
    const cmd = raw.toLowerCase();
    if (cmd === "clear") out.textContent = "";
    else if (cmd === "exit") { wm.close("cmd"); return; }
    else if (cmd && CMDS[cmd]) out.textContent += CMDS[cmd] + "\n";
    else if (cmd) out.textContent += `'${raw}' is not recognized as an internal or external command,\noperable program or batch file.\n`;
    out.scrollTop = out.scrollHeight;
  });
}
