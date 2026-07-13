/* Icon library — hand-rolled SVG, no Microsoft assets. Shared by apps.js and wm.js. */
const ICONS = {
  notepad: `<svg viewBox="0 0 32 32"><path d="M6 2h16l6 6v22H6z" fill="#fff" stroke="#8b8b8b"/><path d="M22 2l6 6h-6z" fill="#d6d6d6" stroke="#8b8b8b"/><g stroke="#4d9cf0" stroke-width="1.4"><line x1="10" y1="13" x2="24" y2="13"/><line x1="10" y1="17" x2="24" y2="17"/><line x1="10" y1="21" x2="19" y2="21"/></g></svg>`,
  folder: `<svg viewBox="0 0 32 32"><path d="M2 7h10l3 3h15v15.5a2.5 2.5 0 0 1-2.5 2.5h-23A2.5 2.5 0 0 1 2 25.5z" fill="#e8b93c" stroke="#b28418"/><path d="M2 12h28v13.5a2.5 2.5 0 0 1-2.5 2.5h-23A2.5 2.5 0 0 1 2 25.5z" fill="#ffdf7e" stroke="#c99b2d"/></svg>`,
  cmd: `<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="24" rx="2" fill="#0a0a0a" stroke="#7a7a7a"/><path d="M6 11l5 4-5 4" stroke="#e8e8e8" stroke-width="2" fill="none"/><line x1="13" y1="21" x2="21" y2="21" stroke="#e8e8e8" stroke-width="2"/></svg>`,
  recycle: `<svg viewBox="0 0 32 32"><path d="M8 10h16l-2 18H10z" fill="#dce9f7" stroke="#5b7ba8" opacity=".92"/><ellipse cx="16" cy="10" rx="8.5" ry="2.6" fill="#eef5fc" stroke="#5b7ba8"/><path d="M12 14l1 10M16 14v10M20 14l-1 10" stroke="#8fb0d8" stroke-width="1.3" fill="none"/></svg>`,
  doc: `<svg viewBox="0 0 32 32"><path d="M6 2h16l6 6v22H6z" fill="#fff" stroke="#8b8b8b"/><path d="M22 2l6 6h-6z" fill="#d6d6d6" stroke="#8b8b8b"/><rect x="9" y="11" width="14" height="4" fill="#2a5bd7"/><g stroke="#9db4e6" stroke-width="1.4"><line x1="9" y1="19" x2="23" y2="19"/><line x1="9" y1="23" x2="18" y2="23"/></g></svg>`,
  wheel: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#0a5c2e" stroke="#d4af37" stroke-width="1.6"/><circle cx="16" cy="16" r="9" fill="none" stroke="#b03a2e" stroke-width="5" stroke-dasharray="4.7 4.7"/><circle cx="16" cy="16" r="4" fill="#7b3f00" stroke="#d4af37"/></svg>`,
  computer: `<svg viewBox="0 0 32 32"><rect x="4" y="5" width="24" height="17" rx="2" fill="#dbe7f5" stroke="#5b7ba8"/><rect x="7" y="8" width="18" height="11" fill="#2a6fd6"/><rect x="12" y="24" width="8" height="3" fill="#c8c4b7" stroke="#8b8b8b"/><rect x="9" y="27" width="14" height="2.5" fill="#dcd8ca" stroke="#8b8b8b"/></svg>`,
  ie: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#38a1e0"/><text x="16" y="22" text-anchor="middle" font-size="19" font-family="Times New Roman,serif" font-style="italic" fill="#fff">e</text><ellipse cx="16" cy="14" rx="14" ry="5.5" fill="none" stroke="#f7c948" stroke-width="2" transform="rotate(-18 16 14)"/></svg>`,
  app: `<svg viewBox="0 0 32 32"><rect x="3" y="4" width="26" height="24" rx="2" fill="#fff" stroke="#5b7ba8"/><rect x="3" y="4" width="26" height="6" rx="2" fill="#2a6fd6"/><circle cx="25" cy="7" r="1.5" fill="#e8b0a0"/><rect x="7" y="14" width="12" height="2.4" fill="#9db4e6"/><rect x="7" y="19" width="18" height="2.4" fill="#d3e0f5"/></svg>`,
  github: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#24292f"/><path d="M16 6.5a9.5 9.5 0 0 0-3 18.5c.47.09.65-.2.65-.45v-1.6c-2.65.58-3.2-1.13-3.2-1.13-.43-1.1-1.05-1.4-1.05-1.4-.86-.58.07-.57.07-.57.95.07 1.45.98 1.45.98.85 1.45 2.22 1.03 2.76.79.09-.61.33-1.03.6-1.27-2.1-.24-4.32-1.05-4.32-4.7 0-1.03.37-1.87.98-2.53-.1-.24-.42-1.2.09-2.5 0 0 .8-.26 2.6.96a9 9 0 0 1 4.74 0c1.8-1.22 2.6-.96 2.6-.96.51 1.3.19 2.26.1 2.5.6.66.97 1.5.97 2.53 0 3.66-2.22 4.46-4.34 4.7.34.3.65.88.65 1.76v2.6c0 .25.17.55.66.45A9.5 9.5 0 0 0 16 6.5z" fill="#fff"/></svg>`,
  fcc: `<svg viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="4" fill="#0a0a23"/><path d="M11 23c-2.5-2.8-1.8-6.2.6-8.3-.4 2 .3 3.2 1.5 3.9-.6-3.8 1.4-7.6 4.4-9.6-1 2.8.3 4.4 1.8 5.9 1.4 1.4 2.4 3.3 1 5.7 1.8-.6 2.6-1.9 2.5-3.5 1.7 2.5 1.4 5.5-1.3 7.9-2.9 2.3-7.9 2.3-10.5-2z" fill="#fff"/></svg>`,
  mine: `<svg viewBox="0 0 32 32"><g stroke="#1b1b1b" stroke-width="2.2" stroke-linecap="round"><line x1="16" y1="3" x2="16" y2="29"/><line x1="3" y1="16" x2="29" y2="16"/><line x1="7" y1="7" x2="25" y2="25"/><line x1="25" y1="7" x2="7" y2="25"/></g><circle cx="16" cy="16" r="9.5" fill="#1b1b1b"/><circle cx="12.8" cy="12.8" r="2.7" fill="#fff"/></svg>`,
};

const GLYPHS = {
  min: `<svg viewBox="0 0 11 11"><rect x="1" y="8" width="7" height="2.2" fill="#fff"/></svg>`,
  max: `<svg viewBox="0 0 11 11"><rect x="1.5" y="1.5" width="8" height="8" fill="none" stroke="#fff" stroke-width="1.6"/><line x1="1.5" y1="2.6" x2="9.5" y2="2.6" stroke="#fff" stroke-width="2.2"/></svg>`,
  close: `<svg viewBox="0 0 11 11"><path d="M2 2l7 7M9 2l-7 7" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>`,
};

/* Resolve a content.json icon hint (ICONS key or /img/... path) to inline markup. */
function iconMarkup(hint, size) {
  if (hint && hint.startsWith("/")) {
    return `<img src="${encodeURI(hint)}" alt="" style="width:${size || 24}px;height:${size || 24}px;object-fit:contain">`;
  }
  return ICONS[hint] || ICONS.app;
}
