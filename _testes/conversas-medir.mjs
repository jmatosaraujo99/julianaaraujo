// Medidas e comando das Conversas que Contam, no Chromium do Playwright.
// Corre de dentro da pasta do site:  node _testes/conversas-medir.mjs [pasta-das-capturas]
// 1. Em 1280×720, 1920×1080 e 390×844, com a história real e com uma cópia
//    em que todos os textos estão no limite máximo, percorre cada momento,
//    cada reação e os 4 ecrãs do fim (com o relógio e a impaciência à vista):
//    no computador nada pode sair do ecrã nem rolar; no telemóvel pode rolar,
//    mas o Confirmar fica sempre à vista.
// 2. Testa o comando: ← realça, → confirma, ← na reação desfaz, o fim, a
//    pausa (P, B, .), o relógio a acabar duas vezes e o recarregar.
// (a pasta começa por _ e o GitHub Pages não a publica)
import { createRequire } from "node:module";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { createServer } from "node:http";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import assert from "node:assert/strict";

const require = createRequire("C:/Users/julia/gestao-formacao/package.json");
const { chromium } = require("playwright");

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const CAPTURAS = process.argv[2] || null;
if(CAPTURAS && !existsSync(CAPTURAS)) mkdirSync(CAPTURAS, { recursive: true });
const PAG = readFileSync(join(RAIZ, "conversas-que-contam.html"), "utf8");

/* ---------- a história com todos os textos no limite máximo ---------- */
const ctx = vm.createContext({});
vm.runInContext(PAG.match(/<script id="motor">([\s\S]*?)<\/script>/)[1], ctx);
const BLOCO = PAG.match(/<script data-historia="([^"]*)">([\s\S]*?)<\/script>/);
vm.runInContext(BLOCO[2], ctx);
function encher(s, max){
  let t = String(s || "Texto de teste");
  while(t.length < max) t += " " + String(s || "palavra");
  t = t.slice(0, max);
  return t.slice(0, t.lastIndexOf(" ") > max - 14 ? t.lastIndexOf(" ") : max).trim();
}
const MAX = JSON.parse(JSON.stringify(ctx.HISTORIAS[0]));
MAX.titulo = encher("O fim de semana que não houve", 30);
MAX.pessoa = "Hugo e Paula";
MAX.papel = encher(MAX.papel, 140); MAX.abertura = encher(MAX.abertura, 200); MAX.necessidade = encher(MAX.necessidade, 200);
MAX.impaciencia = { calma: encher(MAX.impaciencia.calma, 120), dura: encher(MAX.impaciencia.dura, 120) };
Object.values(MAX.pistas).forEach((p) => { p.texto = encher(p.texto, 140); if(p.principal) p.sozinha = encher(p.sozinha, 160); });
Object.keys(MAX.finais).forEach((k) => { MAX.finais[k] = encher(MAX.finais[k], 280); });
MAX.perguntas = [encher(MAX.perguntas[0], 160), encher(MAX.perguntas[1] || MAX.perguntas[0], 160)];
MAX.momentos.forEach((m) => {
  if(m.evento) m.evento = encher(m.evento, 200);
  (m.eventosSe || []).forEach((e) => { e.texto = encher(e.texto, 200); });
  m.fala = { calma: encher(m.fala.calma, 160), dura: encher(m.fala.dura, 160) };
  m.opcoes.forEach((o) => {
    o.texto = encher(o.texto, 110);
    o.reacao = { calma: encher(o.reacao.calma, 200), dura: encher(o.reacao.dura, 200) };
    if(o.fechada) o.fechada = encher(o.fechada, 200);
    o.porque = encher(o.porque, 220);
    // as explicações mais compridas: duas técnicas de nome comprido, ou o erro de nome mais comprido
    if(o.tipo === "bom" || o.tipo === "perguntar") o.tecnicas = ["parte", "comportamento"];
    else o.erro = "prometer";
    if(o.tipo === "bom" && !o.pista) o.pista = "p2";
  });
});
if(MAX.filme) MAX.filme = MAX.filme.map((q) => ({ ...q, legenda: encher(q.legenda, 120) }));
const PAG_MAX = PAG.replace(BLOCO[2], "\nHISTORIAS.push(" + JSON.stringify(MAX) + ");\n");

/* ---------- um servidor pequeno, só para esta pasta ---------- */
const TIPOS = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".jpg": "image/jpeg", ".webp": "image/webp" };
const servidor = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if(p === "/max.html"){ res.writeHead(200, { "content-type": TIPOS[".html"] }); res.end(PAG_MAX); return; }
  const f = join(RAIZ, p === "/" ? "index.html" : p);
  if(!f.startsWith(RAIZ) || !existsSync(f)){ res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TIPOS[extname(f)] || "application/octet-stream", "cache-control": "no-store" });
  res.end(readFileSync(f));
});
await new Promise((r) => servidor.listen(0, "127.0.0.1", r));
const BASE = "http://127.0.0.1:" + servidor.address().port;

const browser = await chromium.launch();
let falhas = 0;
const falha = (txt) => { falhas++; console.log("  FALHA " + txt); };

/* ---------- medir o ecrã que está à vista ---------- */
async function medir(page, onde, telemovel){
  await page.waitForFunction(() => [...document.querySelectorAll(".vez:not([hidden]) img")].every((i) => i.complete), null, { timeout: 5000 }).catch(() => {});
  const m = await page.evaluate(() => {
    const vw = innerWidth, vh = innerHeight, palco = document.getElementById("palcoJogo");
    const fora = [];
    const visiveis = [...document.querySelectorAll(".jogo *")].filter((el) => {
      const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden" && !el.closest("svg") && !el.closest(".lembrete");
    });
    visiveis.forEach((el) => {
      const r = el.getBoundingClientRect();
      if(r.right > vw + 1 || r.left < -1) fora.push((el.id || el.className || el.tagName) + " sai " + Math.round(r.left) + "–" + Math.round(r.right));
    });
    const textos = [...palco.querySelectorAll("p, .txt, li, b, small")].filter((el) => el.getBoundingClientRect().height > 0 && el.textContent.trim());
    const letras = textos.map((el) => parseFloat(getComputedStyle(el).fontSize));
    const btn = document.getElementById("btnAvancar").getBoundingClientRect();
    const cara = document.querySelector(".vez:not([hidden]) .rosto:not([hidden]) img");
    const leg = document.querySelector("#vezFilme:not([hidden]) .filme-legenda");
    return {
      cara: cara ? Math.round(cara.getBoundingClientRect().width) : 0,
      caraCarregou: cara ? cara.complete && cara.naturalWidth > 0 : null,
      legenda: leg ? { letra: parseFloat(getComputedStyle(leg).fontSize), fundo: leg.getBoundingClientRect().bottom, palco: palco.getBoundingClientRect().bottom } : null,
      larguraPagina: document.documentElement.scrollWidth, vw, vh,
      appFundo: document.querySelector(".app").getBoundingClientRect().bottom,
      transborda: palco.scrollHeight - palco.clientHeight,
      f: parseFloat(getComputedStyle(palco).getPropertyValue("--f")) || 1,
      letraMin: Math.min(...letras), fala: parseFloat(getComputedStyle(document.querySelector(".vez:not([hidden]) .fala p, .vez:not([hidden]) .f-texto, .vez:not([hidden]) .perguntas li, .vez:not([hidden]) .pt, .vez:not([hidden]) .cm-pt b") || palco).fontSize),
      btn: { top: btn.top, bottom: btn.bottom, visivel: getComputedStyle(document.getElementById("btnAvancar")).visibility !== "hidden" },
      fora, rolagem: document.documentElement.scrollHeight
    };
  });
  if(m.larguraPagina > m.vw + 1) falha(`${onde}: a página rola para o lado (${m.larguraPagina} > ${m.vw})`);
  if(m.fora.length) falha(`${onde}: sai do ecrã: ${m.fora.slice(0, 3).join("; ")}`);
  if(m.caraCarregou === false) falha(`${onde}: a cara não carregou`);
  // a cara tira espaço ao resto? o mesmo ecrã sem a cara, para comparar o encolher
  if(m.cara) m.fSemCara = await page.evaluate(() => {
    const fig = document.querySelector(".vez:not([hidden]) .rosto:not([hidden])");
    fig.hidden = true; dispatchEvent(new Event("resize"));
    const f = parseFloat(getComputedStyle(document.getElementById("palcoJogo")).getPropertyValue("--f")) || 1;
    fig.hidden = false; dispatchEvent(new Event("resize"));
    return f;
  });
  if(m.legenda && !telemovel && m.legenda.fundo > m.legenda.palco + 1) falha(`${onde}: a legenda do filme sai do quadro`);
  if(!telemovel){
    if(m.appFundo > m.vh + 1) falha(`${onde}: a ferramenta passa o fundo do ecrã (${Math.round(m.appFundo)} > ${m.vh})`);
    if(m.transborda > 1) falha(`${onde}: o texto não cabe (sobram ${m.transborda} px, --f ${m.f})`);
    if(m.btn.bottom > m.vh + 1) falha(`${onde}: o botão principal fica fora do ecrã`);
  } else if(m.btn.visivel){
    if(m.btn.top < 0 || m.btn.bottom > m.vh + 1) falha(`${onde}: o Confirmar não está à vista no topo`);
    // rola até ao fim da história (o texto «Sobre» vem depois e aí o botão já não acompanha)
    await page.evaluate(() => { const r = document.getElementById("jogo").getBoundingClientRect(); scrollTo(0, scrollY + r.bottom - innerHeight + 4); });
    const b = await page.evaluate(() => { const r = document.getElementById("btnAvancar").getBoundingClientRect(), p = document.getElementById("palcoJogo").getBoundingClientRect(); return { top: r.top, bottom: r.bottom, palco: p.bottom }; });
    if(b.top < 0 || b.bottom > m.vh + 1) falha(`${onde}: o Confirmar não está à vista ao rolar até ao fim`);
    if(b.palco > b.top + 1) falha(`${onde}: o Confirmar tapa o fim do texto`);
    await page.evaluate(() => scrollTo(0, 0));
  }
  return m;
}

/* ---------- percorrer uma história num tamanho e num nível ---------- */
async function percorrer(page, url, nivel, telemovel, nome){
  // relógio ligado nos três níveis, para medir com ele à vista
  await page.goto(url);
  await page.evaluate((nivel) => {
    localStorage.clear();
    localStorage.setItem("conversas-que-contam-prefs", JSON.stringify({ v: 2, tema: null, nivel, hist: "terceira-visita", som: false, relogio: { facil: true, medio: true, dificil: true, semrede: true } }));
  }, nivel);
  await page.reload(); await page.evaluate(() => document.fonts.ready);
  if(nivel === "facil"){ const m = await medir(page, `${nome} início`, telemovel); resumo.push(["início", m]); if(CAPTURAS) await page.screenshot({ path: join(CAPTURAS, `${nome}-inicio.png`) }); }
  await page.keyboard.press("ArrowRight");
  let n = 0;
  for(let guarda = 0; guarda < 40; guarda++){
    const info = await page.evaluate(() => {
      const j = JSON.parse(localStorage.getItem("conversas-que-contam-jogo"));
      const h = HISTORIAS.find((x) => x.id === j.hist), s = CONVERSAS.estado(h, j);
      const ms = CONVERSAS.momentos(h, j.nivel);
      return { fase: j.filme >= 0 ? "filme" : s.fase, filme: j.filme, nFilme: (h.filme || []).length, m: s.m, t: s.t, limite: s.limite, tempos: s.abre ? s.abre.tempos : 0, ecra: j.ecra,
               vis: s.abre ? s.abre.visiveis.map((o) => ({ tipo: ms[s.m].opcoes[o].tipo, marca: ms[s.m].opcoes[o].marca })) : [] };
    });
    if(info.fase === "filme"){
      const m = await medir(page, `${nome} ${nivel} filme ${info.filme + 1}`, telemovel); resumo.push([`${nivel} filme${info.filme + 1}`, m]);
      if(CAPTURAS && nivel === "facil" && (info.filme === 0 || info.filme === info.nFilme - 1)) await page.screenshot({ path: join(CAPTURAS, `${nome}-filme${info.filme + 1}.png`) });
      await page.keyboard.press("ArrowRight");
    } else if(info.fase === "momento"){
      // o pior caso: a impaciência à vista (o relógio acabou duas vezes)
      if(info.tempos === 0){
        await page.evaluate(() => { const j = JSON.parse(localStorage.getItem("conversas-que-contam-jogo")); j.passos.push("T", "T"); localStorage.setItem("conversas-que-contam-jogo", JSON.stringify(j)); });
        await page.reload(); await page.evaluate(() => document.fonts.ready);
        continue;
      }
      const m = await medir(page, `${nome} ${nivel} momento ${info.m + 1}`, telemovel); resumo.push([`${nivel} m${info.m + 1}`, m]);
      if(CAPTURAS && (info.m === 0 || info.m === 2)) await page.screenshot({ path: join(CAPTURAS, `${nome}-${nivel}-m${info.m + 1}.png`) });
      // escolhe para haver mais narração à frente: a marca, a escalada, e a boa quando está no limite
      let i = info.vis.findIndex((o) => o.marca);
      if(i < 0) i = info.limite ? info.vis.findIndex((o) => o.tipo === "bom") : info.vis.findIndex((o) => o.tipo === "escala");
      if(i < 0) i = 0;
      await page.keyboard.press(String(i + 1)); await page.keyboard.press("ArrowRight");
    } else if(info.fase === "reacao"){
      const m = await medir(page, `${nome} ${nivel} reação ${info.m + 1}`, telemovel); resumo.push([`${nivel} r${info.m + 1}`, m]);
      if(CAPTURAS && nivel === "facil" && info.m === 0) await page.screenshot({ path: join(CAPTURAS, `${nome}-${nivel}-r1.png`) });
      await page.keyboard.press("ArrowRight");
    } else {
      const m = await medir(page, `${nome} ${nivel} fim ${info.ecra + 1}`, telemovel); resumo.push([`${nivel} fim${info.ecra + 1}`, m]);
      if(CAPTURAS && nivel === "semrede") await page.screenshot({ path: join(CAPTURAS, `${nome}-fim${info.ecra + 1}.png`) });
      if(info.ecra === 1){
        await page.keyboard.press("ArrowDown");
        const m2 = await medir(page, `${nome} ${nivel} fim 2 (o caminho que não fizeram)`, telemovel); resumo.push([`${nivel} fim2b`, m2]);
        if(CAPTURAS && nivel === "semrede") await page.screenshot({ path: join(CAPTURAS, `${nome}-fim2b.png`) });
        await page.keyboard.press("ArrowDown");
      }
      if(info.ecra === 3) break;
      await page.keyboard.press("ArrowRight");
    }
    n++;
  }
}

const TAMANHOS = [[1280, 720], [1920, 1080], [390, 844]];
let resumo = [];
for(const [w, hgt] of TAMANHOS){
  const telemovel = w < 560;
  // sem animações, para as capturas não saírem a meio da entrada
  const contexto = await browser.newContext({ viewport: { width: w, height: hgt }, hasTouch: telemovel, isMobile: telemovel, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await contexto.newPage();
  page.on("pageerror", (e) => falha(`erro na página: ${e.message}`));
  for(const [nome, url] of [["real", BASE + "/conversas-que-contam.html"], ["max", BASE + "/max.html"]]){
    resumo = [];
    for(const nivel of ["facil", "medio", "dificil", "semrede"]) await percorrer(page, url, nivel, telemovel, `${w}x${hgt}-${nome}`);
    const fs = resumo.map((r) => r[1].f), letras = resumo.map((r) => r[1].letraMin), falas = resumo.map((r) => r[1].fala);
    const caras = resumo.map((r) => r[1].cara).filter(Boolean), legendas = resumo.map((r) => r[1].legenda).filter(Boolean).map((l) => l.letra);
    const momentos = resumo.filter((r) => r[1].fSemCara != null);
    const custo = momentos.filter((r) => r[1].f < r[1].fSemCara - .001);
    console.log(`${w}×${hgt} ${nome.padEnd(4)}: ${resumo.length} ecrãs · encolher --f mín. ${Math.min(...fs).toFixed(2)} · letra mais pequena ${Math.min(...letras)} px · texto principal ${Math.min(...falas).toFixed(0)}–${Math.max(...falas).toFixed(0)} px` +
      (telemovel ? ` · página até ${Math.max(...resumo.map((r) => r[1].rolagem))} px (rola)` : ""));
    console.log(`${"".padEnd(15)}cara ${Math.min(...caras)}–${Math.max(...caras)} px · legenda do filme ${Math.min(...legendas).toFixed(0)} px · a cara fez encolher ${custo.length} de ${momentos.length} ecrãs com cara` +
      (custo.length ? ` (${custo.map((r) => `${r[0]} ${r[1].fSemCara.toFixed(2)}→${r[1].f.toFixed(2)}`).join(", ")})` : ""));
  }
  await contexto.close();
}

/* ---------- o comando, o teclado e o toque ---------- */
{
  const contexto = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await contexto.newPage();
  page.on("pageerror", (e) => falha(`erro na página: ${e.message}`));
  await page.clock.install();
  await page.goto(BASE + "/conversas-que-contam.html");
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  const nivelEscolhido = () => page.evaluate(() => document.querySelector(".nivel[aria-checked=true]").dataset.n);
  const realcada = () => page.evaluate(() => { const b = document.querySelector("#opcoes .opcao[aria-pressed=true]"); return b ? b.querySelector(".letra").textContent : null; });
  const fase = () => page.evaluate(() => ["vezFilme", "vezMomento", "vezReacao", "vezFim"].find((id) => !document.getElementById(id).hidden));
  const etapa = () => page.evaluate(() => document.getElementById("etapa").textContent);
  const cara = (vez) => page.evaluate((vez) => { const f = document.querySelector("#" + vez + " .rosto"); return f.hidden ? null : f.querySelector("img").getAttribute("src").replace(/^.*\/|\.webp$/g, ""); }, vez);
  try{
    // início: ← muda o nível, → começa
    assert.equal(await nivelEscolhido(), "facil");
    await page.keyboard.press("ArrowLeft"); assert.equal(await nivelEscolhido(), "medio", "← muda para o nível seguinte");
    await page.keyboard.press("PageUp"); await page.keyboard.press("PageUp"); await page.keyboard.press("ArrowLeft");
    assert.equal(await nivelEscolhido(), "facil", "dá a volta aos 4 níveis");
    await page.keyboard.press("ArrowRight");
    // o filme: → seguinte, ← anterior, passa sozinho ao fim de 5 s, a última espera, recarregar mantém
    assert.equal(await fase(), "vezFilme", "→ começa pelo filme");
    assert.match(await etapa(), /1 de 4/);
    await page.keyboard.press("ArrowRight"); assert.match(await etapa(), /2 de 4/, "→ passa à fotografia seguinte");
    await page.keyboard.press("ArrowLeft"); assert.match(await etapa(), /1 de 4/, "← volta à anterior");
    await page.keyboard.press("ArrowLeft"); assert.match(await etapa(), /1 de 4/, "← na primeira não faz nada");
    await page.clock.runFor(5100); assert.match(await etapa(), /2 de 4/, "ao fim de 5 s passa sozinho");
    await page.keyboard.press("PageDown"); await page.reload();
    assert.match(await etapa(), /3 de 4/, "recarregar volta à mesma fotografia");
    await page.keyboard.press("ArrowRight"); await page.clock.runFor(12000);
    assert.match(await etapa(), /4 de 4/, "a última fica à espera");
    assert.equal(await page.evaluate(() => document.getElementById("filmeLegenda").textContent.length > 0), true, "a legenda aparece");
    await page.keyboard.press("ArrowRight");
    assert.equal(await fase(), "vezMomento", "→ na última leva ao momento 1");
    assert.equal(await cara("vezMomento"), "sandra-calma", "no Fácil, ao abrir, a Sandra está calma");
    // → sem realce não faz nada e lembra «← para escolher»
    await page.keyboard.press("ArrowRight");
    assert.equal(await fase(), "vezMomento", "→ sem realce não confirma");
    assert.ok(await page.evaluate(() => document.getElementById("lembrete").classList.contains("ver")), "aparece o lembrete");
    // ← passa o realce A → B → C → D → A
    const seq = [];
    for(let i = 0; i < 5; i++){ await page.keyboard.press("ArrowLeft"); seq.push(await realcada()); }
    assert.deepEqual(seq, ["A", "B", "C", "D", "A"], "← passa o realce de opção em opção");
    await page.keyboard.press("ArrowUp"); assert.equal(await realcada(), "D", "↑ volta para trás");
    await page.keyboard.press("2"); assert.equal(await realcada(), "B", "o 2 realça a B");
    const letrasAntes = await page.evaluate(() => [...document.querySelectorAll("#opcoes .txt")].map((x) => x.textContent).join("|"));
    // → confirma; ← na reação desfaz e deixa a opção realçada
    await page.keyboard.press("ArrowRight"); assert.equal(await fase(), "vezReacao", "→ confirma");
    assert.ok(await page.evaluate(() => !document.getElementById("explica").hidden), "no Fácil a explicação vem logo");
    await page.keyboard.press("ArrowLeft"); assert.equal(await fase(), "vezMomento", "← na reação desfaz");
    assert.equal(await realcada(), "B", "a opção desfeita fica realçada");
    // recarregar mantém as letras
    await page.reload();
    assert.equal(await page.evaluate(() => [...document.querySelectorAll("#opcoes .txt")].map((x) => x.textContent).join("|")), letrasAntes, "recarregar mantém a ordem das opções");
    // tocar realça, tocar outra vez confirma
    await page.click("#opcoes .opcao >> nth=2"); assert.equal(await realcada(), "C", "tocar realça");
    assert.equal(await fase(), "vezMomento");
    await page.click("#opcoes .opcao >> nth=2"); assert.equal(await fase(), "vezReacao", "tocar outra vez confirma");
    // PageDown continua até ao fim
    for(let g = 0; g < 30 && (await fase()) !== "vezFim"; g++){
      if((await fase()) === "vezMomento") await page.keyboard.press("1");
      await page.keyboard.press("PageDown");
    }
    assert.equal(await fase(), "vezFim", "chega ao fim");
    assert.match(await etapa(), /1 de 4/);
    for(let i = 2; i <= 4; i++){ await page.keyboard.press("ArrowRight"); assert.match(await etapa(), new RegExp(i + " de 4")); }
    await page.keyboard.press("ArrowRight"); assert.match(await etapa(), /4 de 4/, "no último ecrã → não faz nada");
    for(let i = 3; i >= 1; i--){ await page.keyboard.press("ArrowLeft"); assert.match(await etapa(), new RegExp(i + " de 4")); }
    await page.keyboard.press("ArrowLeft"); assert.equal(await fase(), "vezReacao", "← no primeiro ecrã do fim volta à última reação");
    // o relógio no Difícil: P, B e . pausam; ao acabar, impaciência e t+1, recomeça uma vez; à segunda fica a zero
    await page.click("#btnTerminar");
    await page.click('.nivel[data-n="dificil"]'); await page.click("#btnComecar");
    assert.equal(await fase(), "vezFilme");
    assert.ok(await page.evaluate(() => document.getElementById("relogio").hidden), "no filme não há relógio");
    await page.click("#btnSaltar"); assert.equal(await fase(), "vezMomento", "Saltar leva ao momento 1");
    assert.equal(await cara("vezMomento"), "sandra-tensa", "no Difícil, ao abrir (t = 3), a Sandra está tensa");
    assert.ok(await page.evaluate(() => !document.getElementById("relogio").hidden), "o Difícil tem relógio");
    await page.keyboard.press("p"); assert.ok(await page.evaluate(() => document.getElementById("relogio").classList.contains("parado")), "P pausa");
    await page.keyboard.press("b"); assert.ok(await page.evaluate(() => !document.getElementById("relogio").classList.contains("parado")), "B retoma");
    await page.keyboard.press("."); assert.ok(await page.evaluate(() => document.getElementById("relogio").classList.contains("parado")), ". pausa");
    await page.clock.runFor(70000);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("conversas-que-contam-jogo")).passos.length), 0, "em pausa o tempo não acaba");
    await page.keyboard.press("p");
    await page.clock.runFor(61000);
    const t1 = await page.evaluate(() => ({ passos: JSON.parse(localStorage.getItem("conversas-que-contam-jogo")).passos, impac: !document.getElementById("impac").hidden, num: document.getElementById("relogioNum").textContent }));
    assert.deepEqual(t1.passos, ["T"], "ao fim de 60 s o tempo acaba uma vez");
    assert.ok(t1.impac, "aparece a impaciência");
    assert.match(t1.num, /^(1:00|0:59)$/, "o relógio recomeça");
    assert.equal(await cara("vezMomento"), "sandra-zangada", "o relógio acabou com t = 4: zangada");
    await page.clock.runFor(61000);
    await page.clock.runFor(61000);
    const t2 = await page.evaluate(() => ({ passos: JSON.parse(localStorage.getItem("conversas-que-contam-jogo")).passos, num: document.getElementById("relogioNum").textContent, acabou: document.getElementById("relogio").classList.contains("acabou") }));
    assert.deepEqual(t2.passos, ["T", "T"], "à segunda vez fica a zero (nunca escolhe sozinho)");
    assert.ok(t2.acabou && t2.num === "0:00", "fica a zero e pisca");
    assert.equal(await fase(), "vezMomento", "o relógio nunca escolhe pela sala");
    console.log("comando, teclado, toque e relógio: ok");
  }catch(e){ falha("comando: " + e.message); }
  await contexto.close();
}

await browser.close();
servidor.close();
console.log(falhas ? `\n${falhas} falha(s).` : "\nTudo cabe e o comando funciona.");
process.exit(falhas ? 1 : 0);
