/* Renders the /classic/ data sections from the shared content layer.
   Also absorbs the old expand.js behaviour (More/Less toggle, glitch icon hover). */
(function () {
  "use strict";

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const isExternal = (url) => /^https?:\/\//.test(url);

  const badge = (p) =>
    p.status === "archived" ? ' <span class="archived-badge">archived</span>' : "";

  const anchorAttrs = (url) =>
    `href="${esc(url)}"${isExternal(url) ? ' target="_blank" rel="noopener"' : ""}`;

  function renderFeatured(projects) {
    const featured = projects.filter((p) => p.type === "featured");
    const box = document.getElementById("featured-projects");
    let html = "";
    featured.forEach((p, i) => {
      const col = i < 2 ? "col-md-6" : "col-md-4";
      if (i === 0 || i === 2) html += '<div class="row">';
      const media = p.image
        ? `<img src="${encodeURI(p.image)}" alt="${esc(p.name)} screenshot" />`
        : `<p class="tile-desc">${esc(p.description || "")}</p>`;
      html += `
        <div class="${col}">
          <div class="project-tile">
            <a ${anchorAttrs(p.url)}><h3>${esc(p.name)}${badge(p)}</h3></a>
            <a ${anchorAttrs(p.url)}>${media}</a>
          </div>
        </div>`;
      if (i === 1 || i === featured.length - 1) html += "</div>";
    });
    box.innerHTML = html;
  }

  function renderExtras(projects) {
    const extras = projects.filter((p) => p.type === "extra");
    const box = document.getElementById("extra-projects");
    const perCol = Math.ceil(extras.length / 3);
    let html = "";
    for (let c = 0; c < 3; c++) {
      const chunk = extras.slice(c * perCol, (c + 1) * perCol);
      html += `<div class="col-md-4">${chunk
        .map((p) => `<a ${anchorAttrs(p.url)}><h3>${esc(p.name)}${badge(p)}</h3></a><br />`)
        .join("")}</div>`;
    }
    box.innerHTML = html;
    box.style.display = "none";

    const toggle = document.querySelector(".more-less");
    const text = toggle.querySelector(".more-less-text");
    const chevron = toggle.querySelector("i");
    toggle.addEventListener("click", () => {
      const open = box.style.display !== "none";
      box.style.display = open ? "none" : "flex";
      text.textContent = open ? "More" : "Less";
      chevron.classList.toggle("fa-chevron-down", open);
      chevron.classList.toggle("fa-chevron-up", !open);
    });
  }

  function renderCerts(certifications) {
    const box = document.getElementById("cert-rows");
    const wide = certifications.filter((c) => c.wide);
    const rest = certifications.filter((c) => !c.wide);
    const cert = (c, col) => `
      <div class="${col} align-bottom">
        <a ${anchorAttrs(c.url)}><h3>${esc(c.name)}</h3></a>
        <a ${anchorAttrs(c.url)}><img src="${encodeURI(c.image)}" alt="${esc(c.name)}" /></a>
      </div>`;
    let html = wide.map((c) => `<div class="row">${cert(c, "col-md-12")}</div>`).join("");
    for (let i = 0; i < rest.length; i += 3) {
      html += `<div class="row">${rest.slice(i, i + 3).map((c) => cert(c, "col-md-4")).join("")}</div>`;
    }
    box.innerHTML = html;
  }

  function renderContact(contact) {
    const head = document.getElementById("email-head");
    head.textContent = contact.availability;
    head.href = `mailto:${contact.email}`;
    const link = document.getElementById("email-link");
    link.textContent = contact.email;
    link.href = `mailto:${contact.email}`;

    const box = document.getElementById("social-links");
    box.innerHTML = contact.socials
      .map((s) => {
        let inner;
        if (s.icon === "github") inner = '<i class="fab fa-github-square fa-3x"></i>';
        else if (s.icon === "fcc") inner = '<i class="fab fa-free-code-camp fa-3x"></i>';
        else inner = `<img class="icon" width="${s.id === "glitch" ? 48 : 40}" src="${encodeURI(s.icon)}" alt="${esc(s.label)}" />`;
        return `<a ${anchorAttrs(s.url)} aria-label="${esc(s.label)}" data-social="${esc(s.id)}">${inner}</a>`;
      })
      .join("\n");

    const glitch = contact.socials.find((s) => s.iconHover);
    if (glitch) {
      const img = box.querySelector(`a[data-social="${glitch.id}"] img`);
      if (img) {
        img.addEventListener("mouseenter", () => (img.src = encodeURI(glitch.iconHover)));
        img.addEventListener("mouseleave", () => (img.src = encodeURI(glitch.icon)));
      }
    }
  }

  function renderSkills(skills) {
    const lead = document.getElementById("skills-lead");
    let html = esc(skills.summary);
    if (skills.writingUrl) {
      html = html.replace(
        /\bwrite\b/,
        `<a target="_blank" rel="noopener" href="${esc(skills.writingUrl)}">write</a>`
      );
    }
    lead.innerHTML = html;
  }

  fetch("../content/content.json")
    .then((r) => {
      if (!r.ok) throw new Error(`content.json ${r.status}`);
      return r.json();
    })
    .then((content) => {
      document.getElementById("hero-title").textContent = content.hero.title;
      document.getElementById("hero-subtitle").textContent = content.hero.subtitle;
      renderSkills(content.skills);
      renderFeatured(content.projects);
      renderExtras(content.projects);
      renderCerts(content.certifications);
      renderContact(content.contact);
    })
    .catch((err) => {
      console.error("Failed to load shared content:", err);
      document.getElementById("skills-lead").textContent =
        "Content failed to load — email marco@marcodasilva.co.za or find me at github.com/marcodsman.";
    });
})();
