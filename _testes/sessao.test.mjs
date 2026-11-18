// Testes do montador de sessões e do retrato da sala do Positive Switch.
// Corre de dentro da pasta do site:  node _testes/sessao.test.mjs
// (a pasta começa por _ e o GitHub Pages não a publica)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import assert from "node:assert/strict";

const pagina = readFileSync(fileURLToPath(new URL("../positive-switch.html", import.meta.url)), "utf8");
const bloco = pagina.match(/<script id="sessao-logica">([\s\S]*?)<\/script>/);
assert.ok(bloco, "falta o bloco <script id=\"sessao-logica\"> na página");
const caixa = {};
vm.runInNewContext(bloco[1], { globalThis: caixa });
// os resultados vêm de outro contexto: copiam-se para o deepEqual comparar só os valores
const copia = x => JSON.parse(JSON.stringify(x));
const S0 = caixa.SESSAO;
const S = {
  PLANOS: copia(S0.PLANOS), tamanhoSessao: S0.tamanhoSessao, perguntas: (r, f) => copia(S0.perguntas(r, f)),
  montarSessao: (...a) => copia(S0.montarSessao(...a)), retrato: (...a) => copia(S0.retrato(...a))
};

// as frases da página, lidas tal como estão escritas (9 colunas)
const cartas = [];
let area = null;
for (const l of pagina.split(/\r?\n/)) {
  const m = l.match(/^  ([a-z]+): \[$/); if (m) { area = m[1]; continue; }
  if (/^  \],?$/.test(l)) { area = null; continue; }
  if (area && l.startsWith('    "')) {
    const p = l.trim().replace(/,$/, "").slice(1, -1).split("|");
    assert.equal(p.length, 9, "colunas: " + p[0]);
    cartas.push({ id: area + "-" + p[0], area, nivel: +p[8], tecnicas: p[6].split(",") });
  }
}
assert.equal(cartas.length, 240, "a página tem 240 frases");
const AREAS = [...new Set(cartas.map(c => c.area))];
const TECS = [...new Set(cartas.flatMap(c => c.tecnicas))];

function semente(s){ return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
let n = 0;
function ok(nome, f){ f(); n++; console.log("ok  " + nome); }

ok("cada baralho tem pelo menos 4 fáceis e 4 difíceis", () => {
  for (const a of AREAS) {
    const d = [0, 0, 0, 0]; cartas.filter(c => c.area === a).forEach(c => d[c.nivel]++);
    assert.ok(d[1] >= 4 && d[3] >= 4, a + ": " + d.join("/"));
  }
});

ok("com tudo disponível, a sessão segue o plano: fáceis, médias, difíceis", () => {
  for (const min of [10, 20, 30]) {
    const ids = S.montarSessao(cartas, min, {}, semente(7));
    const niv = ids.map(id => cartas.find(c => c.id === id).nivel);
    const [f, m, d] = S.PLANOS[min];
    assert.deepEqual(niv, [...Array(f).fill(1), ...Array(m).fill(2), ...Array(d).fill(3)], min + " min");
  }
});

ok("todas as combinações de baralho, técnica e duração: tamanho certo, sem repetir, por ordem", () => {
  let combos = 0;
  for (const a of [null, ...AREAS]) for (const t of [null, ...TECS]) for (const min of [10, 20, 30]) {
    const pool = cartas.filter(c => (!a || c.area === a) && (!t || c.tecnicas.includes(t)));
    const ids = S.montarSessao(pool, min, {}, semente(combos + 1));
    const quer = Math.min(S.tamanhoSessao(min), pool.length);
    assert.equal(ids.length, quer, `${a}/${t}/${min}: ${ids.length} em vez de ${quer}`);
    assert.equal(new Set(ids).size, ids.length, "repetidas");
    const niv = ids.map(id => pool.find(c => c.id === id).nivel);
    for (let i = 1; i < niv.length; i++) assert.ok(niv[i] >= niv[i - 1], `${a}/${t}/${min}: níveis fora de ordem ${niv}`);
    combos++;
  }
  console.log("    " + combos + " combinações");
});

ok("primeiro as frases que ainda não saíram", () => {
  const pool = cartas.filter(c => c.area === "familia");
  const novas = new Set(pool.filter(c => c.nivel === 1).slice(0, 2).map(c => c.id)
    .concat(pool.filter(c => c.nivel === 2).slice(0, 8).map(c => c.id))
    .concat(pool.filter(c => c.nivel === 3).slice(0, 2).map(c => c.id)));
  const vistas = {}; pool.forEach(c => { if (!novas.has(c.id)) vistas[c.id] = 1; });
  const ids = S.montarSessao(pool, 30, vistas, semente(3));
  assert.deepEqual([...ids].sort(), [...novas].sort());
});

ok("baralho vazio ou duração desconhecida não rebenta", () => {
  assert.deepEqual(S.montarSessao([], 20, {}), []);
  assert.deepEqual(S.montarSessao(cartas, 15, {}), []);
});

const nome = t => ({ emocao: "Reconhecer a emoção", prazo: "Prazo concreto", eu: "Mensagem-eu", posso: "O que posso fazer é…", disco: "Disco riscado", pergunta: "Pergunta aberta" })[t] || t;

ok("retrato de uma sessão de 12 frases com marcações", () => {
  const reg = [
    { tecnicas: ["emocao", "posso"], pistas: 0, marca: "nao" },
    { tecnicas: ["emocao"], pistas: 2, marca: "parte" },
    { tecnicas: ["emocao", "prazo"], pistas: 3, marca: "nao" },
    { tecnicas: ["prazo"], pistas: 0, marca: "sim" },
    { tecnicas: ["prazo", "posso"], pistas: 0, marca: "sim" },
    { tecnicas: ["prazo"], pistas: 1, marca: "sim" },
    { tecnicas: ["posso"], pistas: 0, marca: "sim" },
    { tecnicas: ["posso"], pistas: 0, marca: "parte" },
    { tecnicas: ["eu"], pistas: 0, marca: null },
    { tecnicas: ["eu"], pistas: 1, marca: null },
    { tecnicas: ["emocao"], pistas: 0, marca: "sim" },
    { tecnicas: ["posso"], pistas: 0, marca: "nao" }
  ];
  const r = S.retrato(reg, ["posso", "emocao", "prazo", "disco", "pergunta", "eu"]);
  assert.equal(r.frases, 12); assert.equal(r.comPistas, 4); assert.equal(r.pistas, 7); assert.equal(r.marcadas, 10);
  const por = Object.fromEntries(r.tecnicas.map(o => [o.t, o]));
  assert.deepEqual([por.emocao.n, por.emocao.sim, por.emocao.parte, por.emocao.nao], [4, 1, 1, 2]);
  assert.deepEqual([por.prazo.n, por.prazo.sim, por.prazo.nao], [4, 3, 1]);
  assert.equal(r.destaque.por, "marcas"); assert.equal(r.destaque.o.t, "prazo");
  assert.equal(r.custou.por, "marcas"); assert.equal(r.custou.o.t, "emocao");
  assert.deepEqual(r.fora, ["disco", "pergunta"]);
  const q = S.perguntas(r, nome);
  assert.equal(q.length, 3);
  assert.equal(q[0], "Em «Reconhecer a emoção», a sala chegou lá 1 vez em 4 (e em parte 1 vez). O que vos trava?");
  assert.equal(q[1], "«Prazo concreto» saiu-vos bem 3 vezes em 4. Onde é que já a usam no dia a dia?");
  assert.equal(q[2], "«Disco riscado» não apareceu hoje. Em que situação do vosso dia a dia daria jeito?");
});

ok("sem marcações: destaque pela técnica mais treinada e dificuldade pelas pistas", () => {
  const reg = [
    { tecnicas: ["posso"], pistas: 0, marca: null }, { tecnicas: ["posso"], pistas: 0, marca: null },
    { tecnicas: ["posso", "eu"], pistas: 3, marca: null }, { tecnicas: ["prazo"], pistas: 0, marca: null }
  ];
  const r = S.retrato(reg, ["posso", "prazo", "eu"]);
  assert.equal(r.destaque.por, "treino"); assert.equal(r.destaque.o.t, "posso");
  assert.equal(r.custou.por, "pistas"); assert.equal(r.custou.o.t, "eu");
  assert.deepEqual(r.fora, []);
  const q = S.perguntas(r, nome);
  assert.equal(q[0], "Treinaram «O que posso fazer é…» 3 vezes. Em que conversa desta semana a podem usar?");
  assert.equal(q.length, 3);
});

ok("uma só técnica marcada não é ao mesmo tempo a melhor e a que custou", () => {
  const reg = [{ tecnicas: ["eu"], pistas: 0, marca: "sim" }, { tecnicas: ["eu"], pistas: 0, marca: "nao" }];
  const r = S.retrato(reg, ["eu"]);
  assert.equal(r.destaque.o.t, "eu");
  assert.equal(r.custou, null);
});

ok("retrato vazio dá perguntas gerais", () => {
  const r = S.retrato([], ["posso"]);
  assert.equal(r.frases, 0); assert.equal(r.destaque, null);
  assert.equal(S.perguntas(r, nome).length, 3);
});

console.log(n + " testes passaram");
