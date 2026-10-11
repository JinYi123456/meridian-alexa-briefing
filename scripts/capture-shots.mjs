/**
 * capture-shots.mjs — capture "in-action" screenshots of Meridian via puppeteer-core
 * Usage: node scripts/capture-shots.mjs
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://127.0.0.1:54245/index.html";
const OUT = "media/gallery";
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1.5 },
});

const page = await browser.newPage();

// 05: mid-orchestration (thinking + progress chips)
await page.goto(`${BASE}?auto=1`, { waitUntil: "networkidle2", timeout: 60000 });
await sleep(9000); // chip clicked, thinking begins, tool chips start appearing
await page.screenshot({ path: `${OUT}/05-agent-thinking.png` });

// 06: completed plan — blocks + final reply
await page.waitForFunction(
  () => {
    const b = [...document.querySelectorAll("[class*=bubble]")];
    return !document.querySelector("[class*=think]") && b.length >= 2 && b[b.length - 1]?.textContent?.length > 30;
  },
  { timeout: 120000, polling: 1500 }
).catch(() => console.warn("run may not have completed"));
await sleep(2500);
await page.screenshot({ path: `${OUT}/06-plan-complete.png` });

// 07: drag mid-motion (inside iframe)
const dragRes = await page.evaluate(async () => {
  const f = document.querySelector("iframe");
  if (!f) return "no-iframe";
  const w = f.contentWindow, d = f.contentDocument;
  const b = d.querySelector('.block') || d.querySelectorAll("[class*=block]")[0];
  if (!b) return "no-blocks";
  const r = b.getBoundingClientRect();
  const pe = (t, x, y, btns) => {
    const el = d.elementFromPoint(x, y) || b;
    el.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, pointerId: 1, bubbles: true, buttons: btns }));
  };
  pe("pointerdown", r.x + r.width / 2, r.y + r.height / 2, 1);
  await new Promise((s) => setTimeout(s, 120));
  for (let i = 1; i <= 14; i++) {
    pe("pointermove", r.x + r.width / 2 + 100 * (i / 14), r.y + r.height / 2 - 70 * (i / 14), 1);
    await new Promise((s) => setTimeout(s, 45));
  }
  return "dragging";
});
console.log("drag:", dragRes);
await sleep(900);
await page.screenshot({ path: `${OUT}/07-drag-rebalance.png` });
await sleep(45000); // let reprioritize finish
await page.screenshot({ path: `${OUT}/08-rebalanced.png` });

// 09: mobile in-action
const mp = await browser.newPage();
await mp.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await mp.goto(`${BASE}`, { waitUntil: "networkidle2", timeout: 60000 });
await sleep(5000);
await mp.screenshot({ path: `${OUT}/09-mobile-live.png` });

await browser.close();
console.log("DONE — shots in", OUT);
