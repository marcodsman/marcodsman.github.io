# marcodasilva.co.za

Marco Da Silva's portfolio, served as an installable, offline-first **Windows XP desktop**.
Live at [marcodasilva.co.za](https://marcodasilva.co.za/) via GitHub Pages.

## Layout

| Path | What it is |
|---|---|
| `/` | The XP desktop shell (`index.html`, `css/xp.css`, `js/{icons,apps,wm}.js`) |
| `/js/minesweeper.js` | Playable Minesweeper (9×9, 10 mines) as a native desktop window — deep-linkable via `/?open=minesweeper` |
| `/content/content.json` | **The single content source.** Both the desktop and the classic site render from it — edit this one file to update both. |
| `/classic/` | The original 2018 Bootstrap portfolio, preserved, rendered from the shared content layer |
| `/roulette-trainer/` | Standalone PWA with **its own service worker** — the root SW deliberately never touches this scope |
| `/sw.js` | Root service worker: precached shell, network-first navigations, stale-while-revalidate content.json |
| `/404.html` | BSOD-styled 404 |

No build step, no dependencies at root. Develop with any static server:

```sh
python3 -m http.server 8931   # then open http://localhost:8931/
```

## Deploy rules

1. **Any change to shell assets** (`index.html`, `css/xp.css`, `js/*`, `content/content.json`)
   **must bump the cache name `marco-xp-vN` in `/sw.js`**, or returning visitors keep the stale
   cached version. Currently at `marco-xp-v3`.
2. Never let the root SW cache or intercept `/roulette-trainer/` — that app has its own SW.
3. Push to `master` deploys. CI (`.github/workflows/site-check.yml`) syntax-checks the JS,
   boots the desktop and the classic site in headless Chrome, and checks every outbound link
   the site renders (also weekly, to catch CodePen/Glitch link rot — 403s count as alive
   because CodePen bot-walls non-browser agents).

## What's left to do

Roughly in order of impact:

- [ ] **Content refresh** (the big one — needs Marco): the newest project apart from the
      roulette trainer is from 2018. Add a work-experience section to `content.json` and the
      CV window, add 1–2 recent substantial projects, and modernise the skills list
      (it still leads with Bootstrap 4 / Mocha / Chai).
- [ ] **Resolve the mixed message**: the shutdown screen says *"It is now safe to hire Marco"*
      while `contact.availability` says *"Not currently available for freelance work."*
- [x] ~~A playable XP app~~ — Minesweeper shipped (`js/minesweeper.js`). Solitaire would be
      the next one up, but it's a bigger build (drag-and-drop stacks, 52 hand-rolled cards).
- [ ] **Prerender content into the hidden semantic section** of `index.html` at deploy time —
      crawlers currently see only the short hand-written fallback, not the project list.
- [ ] **Analytics** — no visibility on traffic at all. GoatCounter or Plausible
      (needs Marco to create an account).
- [ ] **Eyeball the 12 CodePen links in a real browser** — CodePen 403s automated checks,
      so CI can only prove they're not 404; a human has to confirm the pens still render.
- [ ] Restore the Tidio chat script on `/classic/` if wanted (dropped during the migration).
- [ ] **freeCodeCamp profile link**: the old profile URL
      (`freecodecamp.org/fcce6dfa…`) now 404s — the social link currently points at the
      full-stack certification page instead. Swap in a working profile URL if one exists.
- [ ] `content.json` has an `embed` field the code ignores — `js/apps.js` hardcodes which
      projects open as embedded windows (`roulette-trainer`, `/classic/`). Use it or drop it.
- [ ] Window resize handles on desktop (windows currently open at fixed sizes; maximize only).
