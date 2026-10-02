/**
 * Capture README screenshots of the running app (http://localhost:3100) into docs/screenshots/.
 * Usage: node scripts/capture.mjs   (requires the dev server on port 3100)
 * Uses system Chrome via puppeteer-core — no Chromium download.
 */
import puppeteer from "puppeteer-core";
import { mkdirSync, existsSync } from "fs";

const CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const CHROME = CANDIDATES.find((p) => existsSync(p));
if (!CHROME) {
  console.error("No Chrome/Edge found");
  process.exit(1);
}

const BASE = "http://localhost:3100";
const OUT = "docs/screenshots";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-first-run", "--disable-extensions", "--hide-scrollbars"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
});
const page = await browser.newPage();

const shoot = async (name, { wait = 1200, full = false, scrollText = null } = {}) => {
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: full ? 1 : 2 });
  // setViewport resets scroll — scroll AFTER the viewport change
  if (scrollText) await scrollToText(scrollText);
  await sleep(wait);
  // captureBeyondViewport:false so viewport shots honour the current scroll position
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full, captureBeyondViewport: !full });
  console.log("saved", name);
};

/** Scroll the first element containing `text` (case-insensitive) to the top of the viewport. */
const scrollToText = async (text) => {
  await page.evaluate((t) => {
    const needle = t.toLowerCase();
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) {
      if (walk.currentNode.textContent.toLowerCase().includes(needle)) {
        walk.currentNode.parentElement.scrollIntoView({ block: "start" });
        window.scrollBy(0, -70); // clear the sticky header
        return true;
      }
    }
    return false;
  }, text);
};

const clickButtonWithText = async (text) => {
  await page.evaluate((t) => {
    [...document.querySelectorAll("button")].find((b) => b.textContent.includes(t))?.click();
  }, text);
};

const clickLink = async (href) => {
  await page.evaluate((h) => {
    [...document.querySelectorAll("a")].find((a) => a.getAttribute("href") === h)?.click();
  }, href);
};

mkdirSync(OUT, { recursive: true });

// 1 — Landing (fresh profile → not signed in)
await page.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 60000 });
await shoot("01-landing", { wait: 1800 });

// 2 — Demo login → Dashboard
await clickButtonWithText("Demo Login");
await page.waitForFunction(() => location.pathname === "/dashboard", { timeout: 20000 });
await shoot("02-dashboard", { wait: 2200, full: true });

// 3 — Flagship investigation: run the pipeline
await page.goto(`${BASE}/investigate/TXN-1087`, { waitUntil: "networkidle0", timeout: 60000 });
await clickButtonWithText("START AI INVESTIGATION");
await page.waitForFunction(() => document.body.innerText.includes("INVESTIGATION PIPELINE COMPLETED"), { timeout: 60000 });
await shoot("03-agent-pipeline", { wait: 900 });

// 4 — Explainable risk section
await shoot("04-explainable-risk", { wait: 700, scrollText: "EXPLAINABLE RISK" });

// 5 — Human-in-the-loop review
await shoot("05-human-review", { wait: 700, scrollText: "HUMAN-IN-THE-LOOP" });

// 6-8 — Client-side nav keeps the in-memory investigation: graph, evidence, report
await clickLink("/graph");
await page.waitForFunction(() => location.pathname === "/graph", { timeout: 20000 });
await shoot("06-investigation-graph", { wait: 1600 });

await clickLink("/evidence");
await page.waitForFunction(() => location.pathname === "/evidence", { timeout: 20000 });
await shoot("07-evidence-board", { wait: 1400, full: true });

await clickLink("/reports");
await page.waitForFunction(() => location.pathname === "/reports", { timeout: 20000 });
await shoot("08-investigation-report", { wait: 1400, full: true });

// 9-10 — Lab and Customers (fresh loads are fine here)
await page.goto(`${BASE}/lab`, { waitUntil: "networkidle0", timeout: 60000 });
await shoot("09-simulation-lab", { wait: 1800, full: true });

await page.goto(`${BASE}/customers`, { waitUntil: "networkidle0", timeout: 60000 });
await shoot("10-customers", { wait: 1600 });

await browser.close();
console.log("ALL SCREENSHOTS DONE");
