// Abre cada cenário das Conversas que Contam a 1280×720 (Difícil) e confere:
// as fotografias do filme carregam, a cara do momento 1 carrega e nada sai do ecrã.
// Uso (de dentro da pasta do site): node _testes/conversas-cenarios.mjs [pasta-das-capturas]
// (a pasta começa por _ e o GitHub Pages não a publica)
import { createRequire } from "node:module";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { createServer } from "node:http";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire("C:/Users/julia/gestao-formacao/package.json");
const { chromium } = require("playwright");
const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const CAPT = process.argv[2] || null;
if (CAPT && !existsSync(CAPT)) mkdirSync(CAPT, { recursive: true });

const TIPOS = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json" };
const srv = createServer((q, r) => {
  const p = join(RAIZ, decodeURIComponent(q.url.split("?")[0]));
  if (!existsSync(p)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "content-type": TIPOS[extname(p)] || "application/octet-stream" });
  r.end(readFileSync(p));
}).listen(0);
const URL_ = `http://127.0.0.1:${srv.address().port}/conversas-que-contam.html`;

const pag = readFileSync(join(RAIZ, "conversas-que-contam.html"), "utf8");
const ids = [...pag.matchAll(/<script data-historia="([^"]*)">/g)].map((m) => m[1]);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
let falhas = 0;

for (const id of ids) {
  await page.goto(URL_);
  await page.evaluate(() => localStorage.clear());
  await page.goto(URL_);
  const h = await page.evaluate((id) => { const x = HISTORIAS.find((h) => h.id === id); return { titulo: x.titulo, filme: x.filme.length }; }, id);
  await page.getByText(h.titulo, { exact: true }).first().click();
  await page.getByText("Difícil", { exact: true }).first().click();
  await page.getByRole("button", { name: "Começar" }).click();
  await page.waitForTimeout(800);
  const filme = await page.evaluate(() => [...document.querySelectorAll(".filme-quadro img")].map((i) => ({ src: i.getAttribute("src"), ok: i.complete && i.naturalWidth > 0 })));
  for (let i = 0; i < h.filme; i++) { await page.keyboard.press("ArrowRight"); await page.waitForTimeout(250); }
  await page.waitForTimeout(900);
  const m1 = await page.evaluate(() => {
    const cara = [...document.querySelectorAll("img")].find((i) => /media\/conversas\/.*-(calma|tensa|zangada|aliviada)\.webp/.test(i.getAttribute("src") || "") && i.getBoundingClientRect().height > 0);
    const de = document.documentElement;
    const fora = [...document.querySelectorAll("#jogo *")].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && (r.right > innerWidth + 1 || r.bottom > innerHeight + 1); }).length;
    return { cara: cara && cara.getAttribute("src"), caraOk: !!cara && cara.naturalWidth > 0, rola: de.scrollHeight > innerHeight + 1 && scrollY === 0 ? false : false, fora, momento: (document.querySelector("#jogo")?.innerText.match(/MOMENTO \d DE \d/) || [""])[0] };
  });
  const maus = filme.filter((f) => !f.ok);
  const ok = filme.length === h.filme && !maus.length && m1.caraOk && m1.fora === 0 && m1.momento;
  if (!ok) falhas++;
  console.log(`${ok ? "ok   " : "FALHA"} ${id.padEnd(17)} filme ${filme.length - maus.length}/${h.filme} · cara ${m1.cara || "—"} · ${m1.momento || "sem momento"} · fora do ecrã ${m1.fora}`);
  if (CAPT) await page.screenshot({ path: join(CAPT, `${id}-m1.png`) });
}
await browser.close(); srv.close();
console.log(falhas ? `${falhas} cenário(s) com problemas` : `os ${ids.length} cenários abrem bem`);
process.exit(falhas ? 1 : 0);
