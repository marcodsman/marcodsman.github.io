/* Checks every URL a visitor can actually reach from the live site
   (live projects, certifications, socials, writing link). Archived
   projects are skipped — they render without links by design.
   403/429 count as alive: CodePen and friends bot-wall non-browser UAs. */
import { readFile } from "node:fs/promises";

const content = JSON.parse(await readFile("content/content.json", "utf8"));
const urls = new Set();

for (const p of content.projects || []) {
  if (p.status === "live" && /^https?:/.test(p.url)) urls.add(p.url);
}
for (const c of content.certifications || []) urls.add(c.url);
for (const s of content.contact?.socials || []) urls.add(s.url);
if (content.skills?.writingUrl) urls.add(content.skills.writingUrl);

const BOT_WALLED = new Set([403, 429]);
let dead = 0;

for (const url of urls) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; marcodasilva.co.za link check)" },
      signal: AbortSignal.timeout(20000),
    });
    const ok = res.ok || BOT_WALLED.has(res.status);
    console.log(`${ok ? "ok  " : "DEAD"} ${res.status} ${url}`);
    if (!ok) dead++;
  } catch (err) {
    console.log(`DEAD ---- ${url} (${err.cause?.code || err.name})`);
    dead++;
  }
}

console.log(`\n${urls.size} links checked, ${dead} dead`);
if (dead) process.exit(1);
