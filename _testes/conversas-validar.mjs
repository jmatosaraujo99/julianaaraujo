// Validação das Conversas que Contam (formato.md, secção 5).
// Corre de dentro da pasta do site:
//   node _testes/conversas-validar.mjs                 → as histórias que estão na página
//   node _testes/conversas-validar.mjs historia-x.js   → uma história nova, antes de a colar
// Confere os campos e os limites, percorre todos os caminhos de cada nível e
// diz quantos dão cada final. Sai com erro (código 1) se alguma coisa falhar.
// (a pasta começa por _ e o GitHub Pages não a publica)
import { readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import assert from "node:assert/strict";

const pagina = readFileSync(fileURLToPath(new URL("../conversas-que-contam.html", import.meta.url)), "utf8");
const motor = pagina.match(/<script id="motor">([\s\S]*?)<\/script>/);
assert.ok(motor, "falta o bloco <script id=\"motor\"> na página");
const blocos = process.argv[2]
  ? [readFileSync(process.argv[2], "utf8")]
  : [...pagina.matchAll(/<script data-historia="[^"]*">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
assert.ok(blocos.length, "não há nenhuma história (<script data-historia>) na página");
const cenasBloco = pagina.match(/const CENAS = \{([\s\S]*?)\n\};/);
assert.ok(cenasBloco, "não encontrei as CENAS na página");
const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const CENAS = new Set([...cenasBloco[1].matchAll(/^ {2}(\w+):/gm)].map((m) => m[1]));

const ctx = vm.createContext({});
vm.runInContext(motor[1], ctx);
blocos.forEach((b) => vm.runInContext(b, ctx));
const C = ctx.CONVERSAS, HISTORIAS = ctx.HISTORIAS;
const NIVEIS = C.ORDEM_NIVEIS;

let erros = 0, avisos = 0;
const erro = (h, txt) => { erros++; console.log(`  ERRO  ${h}: ${txt}`); };
const aviso = (h, txt) => { avisos++; console.log(`  aviso ${h}: ${txt}`); };

/* ---------------------------------------------------------------------- */
/* 1. Os campos e os limites de caracteres (contam com espaços)           */
/* ---------------------------------------------------------------------- */
function texto(h, onde, v, max, opcional){
  if(v == null || v === ""){ if(!opcional) erro(h, `${onde} está vazio`); return; }
  if(typeof v !== "string"){ erro(h, `${onde} não é texto`); return; }
  if(v.length > max) erro(h, `${onde} tem ${v.length} caracteres (máximo ${max}): «${v.slice(0, 60)}…»`);
  if(/\s{2,}|^\s|\s$/.test(v)) aviso(h, `${onde} tem espaços a mais`);
}
function tons(h, onde, v, max){
  if(!v || typeof v !== "object"){ erro(h, `${onde} precisa de { calma, dura }`); return; }
  texto(h, onde + ".calma", v.calma, max); texto(h, onde + ".dura", v.dura, max);
}
function vazio(v){ return v == null || (Array.isArray(v) && !v.length); }

function validarCampos(h){
  const id = h.id || "(sem id)";
  ["id", "titulo", "area", "pessoa"].forEach((k) => texto(id, k, h[k], 80));
  if(!CENAS.has(h.cena)) erro(id, `cena «${h.cena}» não existe nas CENAS`);
  if(h.artigo != null && !["a", "o", "as", "os"].includes(h.artigo)) erro(id, "artigo tem de ser a, o, as ou os");
  texto(id, "papel", h.papel, 140);
  texto(id, "abertura", h.abertura, 200);
  tons(id, "impaciencia", h.impaciencia, 120);
  texto(id, "necessidade", h.necessidade, 200);

  // a cara (4 expressões) e o filme do início: só de media/conversas, e os ficheiros têm de existir
  const ficheiro = (onde, rel) => {
    if(!/^media\/conversas\/[a-z0-9-]+\.webp$/.test(rel)){ erro(id, `${onde}: «${rel}» tem de ser media/conversas/<nome>.webp (minúsculas, números e hífens)`); return; }
    const abs = RAIZ + rel;
    if(!existsSync(abs)) erro(id, `${onde}: falta o ficheiro ${rel}`);
    else if(statSync(abs).size > 300 * 1024) aviso(id, `${onde}: ${rel} tem mais de 300 KB`);
  };
  if(h.rosto != null){
    if(!/^[a-z0-9-]+$/.test(h.rosto)) erro(id, "rosto: só minúsculas, números e hífens");
    else C.CARAS.forEach((c) => ficheiro("rosto", `media/conversas/${h.rosto}-${c}.webp`));
  }
  if(h.filme != null){
    if(!Array.isArray(h.filme) || h.filme.length < 3 || h.filme.length > 4) erro(id, "filme: 3 ou 4 fotografias");
    else h.filme.forEach((q, i) => {
      ficheiro(`filme[${i}]`, q.img);
      texto(id, `filme[${i}].legenda`, q.legenda, 120);
      if(q.som != null && q.som !== "relogio") erro(id, `filme[${i}].som: «relogio» ou null`);
    });
  }

  const pistas = h.pistas || {};
  const principais = Object.keys(pistas).filter((k) => pistas[k].principal);
  if(principais.length !== 1) erro(id, `tem de haver uma só pista principal (há ${principais.length})`);
  Object.keys(pistas).forEach((k) => {
    texto(id, `pistas.${k}.texto`, pistas[k].texto, 140);
    if(pistas[k].principal) texto(id, `pistas.${k}.sozinha`, pistas[k].sozinha, 160);
    else if(pistas[k].sozinha) aviso(id, `pistas.${k}.sozinha só é usada na pista principal`);
  });

  ["verdadeiro", "fragil", "meio", "rutura"].forEach((k) => texto(id, `finais.${k}`, (h.finais || {})[k], 280));
  if(!Array.isArray(h.perguntas) || h.perguntas.length < 1 || h.perguntas.length > 2) erro(id, "perguntas: 1 ou 2");
  else h.perguntas.forEach((q, i) => texto(id, `perguntas[${i}]`, q, 200));

  if(!Array.isArray(h.momentos) || !h.momentos.length){ erro(id, "não tem momentos"); return; }
  NIVEIS.forEach((n) => {
    const quer = n === "semrede" ? 6 : 5, tem = C.momentos(h, n).length;
    if(tem !== quer) erro(id, `o nível ${n} tem ${tem} momentos (devia ter ${quer})`);
  });

  const marcasFeitas = new Set();
  h.momentos.forEach((m, i) => {
    const onde = `momento ${i + 1} (${m.etapa})`;
    texto(id, onde + " etapa", m.etapa, 40);
    if(!vazio(m.so) && (!Array.isArray(m.so) || m.so.some((n) => !NIVEIS.includes(n)))) erro(id, `${onde}: so tem um nível que não existe`);
    texto(id, onde + " evento", m.evento, 200, true);
    (m.eventosSe || []).forEach((e, k) => {
      if(!marcasFeitas.has(e.marca)) erro(id, `${onde}: eventosSe[${k}] usa a marca «${e.marca}», que nenhuma opção de antes deixa`);
      texto(id, `${onde} eventosSe[${k}].texto`, e.texto, 200);
    });
    tons(id, onde + " fala", m.fala, 160);

    const ops = m.opcoes || [];
    if(ops.length !== 4) erro(id, `${onde}: tem ${ops.length} opções (são 4)`);
    const tipos = ops.map((o) => o.tipo);
    const n = (t) => tipos.filter((x) => x === t).length;
    if(n("bom") !== 1 || n("escala") !== 1 || n("certo") + n("perguntar") !== 2) erro(id, `${onde}: precisa de 1 bom, 1 escala e 2 certo/perguntar (tem ${tipos.join(", ")})`);
    if(ops.filter((o) => o.cai).length > 1) erro(id, `${onde}: mais de uma opção com cai`);
    const bom = ops.find((o) => o.tipo === "bom");
    if(bom && ops.every((o) => o === bom || String(o.texto).length < String(bom.texto).length)) aviso(id, `${onde}: a opção boa é a mais comprida`);

    ops.forEach((o, k) => {
      const oo = `${onde} opção ${k + 1}`;
      if(!["bom", "certo", "escala", "perguntar"].includes(o.tipo)) erro(id, `${oo}: tipo «${o.tipo}» não existe`);
      texto(id, oo + " texto", o.texto, 110);
      if(o.tipo === "bom" || o.tipo === "perguntar"){
        if(vazio(o.tecnicas)) erro(id, `${oo}: ${o.tipo} precisa de tecnicas`);
        if(o.erro) aviso(id, `${oo}: ${o.tipo} com erro (não aparece)`);
      }
      if(o.tipo === "certo" || o.tipo === "escala"){
        if(!o.erro) erro(id, `${oo}: ${o.tipo} precisa de erro`);
        if(!vazio(o.tecnicas)) aviso(id, `${oo}: ${o.tipo} com tecnicas (não aparecem)`);
      }
      (o.tecnicas || []).forEach((t) => { if(!C.TECNICAS[t]) erro(id, `${oo}: técnica «${t}» não existe em TECNICAS`); });
      if(o.erro && !C.ERROS[o.erro]) erro(id, `${oo}: erro «${o.erro}» não existe em ERROS`);
      if(o.efeito){
        Object.keys(o.efeito).forEach((nv) => {
          if(!NIVEIS.includes(nv)) erro(id, `${oo}: efeito para o nível «${nv}», que não existe`);
          const e = o.efeito[nv] || {};
          if(!Number.isInteger(e.c ?? 0) || !Number.isInteger(e.t ?? 0)) erro(id, `${oo}: efeito.${nv} precisa de c e t inteiros`);
        });
      }
      if(o.problema != null && ![1, 2, 3].includes(o.problema)) erro(id, `${oo}: problema tem de ser 1, 2 ou 3`);
      if(o.pista != null && !pistas[o.pista]) erro(id, `${oo}: pista «${o.pista}» não existe`);
      if(o.marca) marcasFeitas.add(o.marca);
      tons(id, oo + " reacao", o.reacao, 200);
      const daPrincipal = o.pista && pistas[o.pista] && pistas[o.pista].principal;
      if(daPrincipal) texto(id, oo + " fechada", o.fechada, 200);
      else if(o.fechada) aviso(id, `${oo}: fechada só é usada nas opções que dão a pista principal`);
      texto(id, oo + " porque", o.porque, 220);
    });
  });
}

/* ---------------------------------------------------------------------- */
/* 2. As regras do motor, com a própria história                          */
/* ---------------------------------------------------------------------- */
function jogoFixo(h, nivel){
  return { hist: h.id, nivel, ordem: C.momentos(h, nivel).map((m) => m.opcoes.map((_, i) => i)), passos: [] };
}
function porTipo(h, nivel, m, tipo, extra = () => true){
  return C.momentos(h, nivel)[m].opcoes.findIndex((o) => o.tipo === tipo && extra(o));
}
function regras(h){
  const pp = C.principal(h), pistaP = (o) => o.pista === pp, semP = (o) => o.pista !== pp;
  // os valores iniciais de cada nível
  for(const [n, c, t] of [["facil", 2, 1], ["medio", 2, 2], ["dificil", 1, 3], ["semrede", 1, 4]]){
    const s = C.estado(h, jogoFixo(h, n));
    assert.equal(s.c, c, `${n}: confiança inicial`); assert.equal(s.t, t, `${n}: tensão inicial`);
  }
  // o efeito por tipo e a tensão máxima do Fácil
  let j = jogoFixo(h, "dificil");
  const esc0 = porTipo(h, "dificil", 0, "escala");
  if(esc0 >= 0 && !C.momentos(h, "dificil")[0].opcoes[esc0].efeito){
    const s = C.estado(h, C.escolher(h, j, esc0));
    assert.deepEqual([s.c, s.t], [0, 5], "Difícil: escala dá c−1 t+2");
    assert.equal(C.estado(h, C.desfazer(C.escolher(h, j, esc0))).fase, "momento", "desfazer volta ao momento");
  }
  // o relógio: t+1 de cada vez, só duas vezes; o tempo não se desfaz
  j = jogoFixo(h, "medio");
  j = C.tempo(h, C.tempo(h, C.tempo(h, j)));
  assert.equal(j.passos.length, 2, "o relógio só acaba duas vezes por momento");
  assert.equal(C.estado(h, j).t, 4, "cada vez que o tempo acaba, t+1");
  assert.equal(C.desfazer(j), j, "o tempo que passou não se desfaz");
  // o Fácil também tem relógio (120 s), mas a tensão nunca passa de 4
  assert.equal(C.NIVEIS.facil.relogio, 120, "o Fácil tem 2 minutos");
  assert.ok(C.estado(h, C.tempo(h, C.tempo(h, jogoFixo(h, "facil")))).t <= 4, "no Fácil o relógio não passa a tensão de 4");
  // que cara aparece (formato.md, secção 6)
  const cara = (n, passos) => C.expressao(C.estado(h, { ...jogoFixo(h, n), passos }));
  assert.equal(cara("facil", []), "calma", "ao abrir com t = 1: calma");
  assert.equal(cara("dificil", []), "tensa", "ao abrir com t = 3: tensa");
  assert.equal(cara("semrede", []), "zangada", "ao abrir com t = 4: zangada");
  assert.equal(cara("facil", ["T"]), "tensa", "o relógio acabou com t < 4: tensa");
  assert.equal(cara("dificil", ["T"]), "zangada", "o relógio acabou com t ≥ 4: zangada");
  const bom0 = porTipo(h, "facil", 0, "bom"), esc0f = porTipo(h, "facil", 0, "escala");
  assert.equal(cara("facil", [bom0]), "aliviada", "reação com t ≤ 2 e a escolha ajudou: aliviada");
  assert.equal(cara("facil", [esc0f]), "calma", "reação com t ≤ 2 e a escolha não ajudou: calma");
  assert.equal(cara("dificil", [porTipo(h, "dificil", 0, "escala")]), "zangada", "reação com t ≥ 4: zangada");
  for(const [fim, c] of [["verdadeiro", "aliviada"], ["fragil", "calma"], ["meio", "tensa"], ["rutura", "zangada"]])
    assert.equal(C.expressao({ fase: "fim", final: fim }), c, `no final «${fim}»: ${c}`);

  // Sem rede: o que parece certo cobra-se no início do momento seguinte
  j = jogoFixo(h, "semrede");
  const cer = porTipo(h, "semrede", 0, "certo", (o) => !o.efeito && !o.marca);
  if(cer >= 0){
    let k = C.escolher(h, j, cer);
    const s1 = C.estado(h, k);
    assert.deepEqual([s1.c, s1.t], [1, 4], "Sem rede: certo não custa na hora");
    const s2 = C.estado(h, C.seguir(h, k));
    assert.deepEqual([s2.c, s2.t], [0, 5], "Sem rede: a conta chega no momento seguinte (c−1 t+1)");
  }
  // Sem rede: a pista principal com c < 3 (antes do efeito) dá a reação fechada, e o problema conta
  const bp = porTipo(h, "semrede", 0, "bom", pistaP);
  if(bp >= 0){
    const op = C.momentos(h, "semrede")[0].opcoes[bp];
    const s = C.estado(h, C.escolher(h, j, bp));
    assert.equal(s.ultima.fechada, true, "Sem rede: com c < 3 a pessoa fecha-se");
    assert.equal(s.ultima.texto, op.fechada, "Sem rede: a reação é a fechada");
    assert.ok(!s.pistas[pp], "Sem rede: a pista principal não fica descoberta");
    if(op.problema) assert.equal(s.p, op.problema, "com a fechada, o problema conta na mesma");
  }
  // Fácil: sem a pista principal nos momentos 1 e 2, ela aparece sozinha no 3.º
  j = jogoFixo(h, "facil");
  for(let m = 0; m < 2; m++){
    const s = C.estado(h, j);
    const o = s.abre.visiveis.find((x) => semP(C.momentos(h, "facil")[m].opcoes[x]));
    j = C.seguir(h, C.escolher(h, j, o));
  }
  const s3 = C.estado(h, j);
  assert.ok(s3.pistas[pp], "Fácil: a pista principal aparece sozinha no momento 3");
  assert.ok(s3.abre.narr.some((n) => n.texto === h.pistas[pp].sozinha), "Fácil: a fala «sozinha» aparece");
  // baralhar: a ordem é uma permutação e fica no jogo
  let semente = 7;
  const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
  const b = C.novoJogo(h, "semrede", rnd);
  b.ordem.forEach((o) => assert.deepEqual([...o].sort(), [0, 1, 2, 3], "a ordem baralhada é uma permutação"));
}

/* ---------------------------------------------------------------------- */
/* 3. Todos os caminhos de cada nível                                     */
/* ---------------------------------------------------------------------- */
function percorrer(h, nivel, escolha){
  const ms = C.momentos(h, nivel), tMax = C.NIVEIS[nivel].tMax;
  const r = { total: 0, verdadeiro: 0, fragil: 0, meio: 0, rutura: 0, pista: 0, cairam: 0 };
  (function ir(j){
    const s = C.estado(h, j);
    assert.ok(s.c >= 0 && s.c <= 5 && s.t >= 0 && s.t <= tMax && s.p >= 0 && s.p <= 3, `${nivel}: valores fora dos limites`);
    if(s.fase === "fim"){ r.total++; r[s.final]++; if(s.pistas[s.principal]) r.pista++; return; }
    if(s.fase === "reacao"){ assert.ok(s.ultima.texto, `${nivel}: reação vazia no momento ${s.m + 1}`); ir(C.seguir(h, j)); return; }
    if(s.abre.caiu) r.cairam++;
    let ops = s.abre.visiveis;
    if(escolha){ const f = escolha(ops.map((o) => ms[s.m].opcoes[o])); if(f) ops = ops.filter((o) => f(ms[s.m].opcoes[o])); }
    ops.forEach((o) => {
      const k = C.escolher(h, j, o);
      assert.deepEqual(C.desfazer(k).passos, j.passos, "desfazer devolve o jogo de antes");
      ir(k);
    });
  })(jogoFixo(h, nivel));
  return r;
}
// «escolher sempre a que parece certa»: a certo; se não houver, a perguntar
const sempreCerto = (ops) => ops.some((o) => o.tipo === "certo") ? (o) => o.tipo === "certo" : ops.some((o) => o.tipo === "perguntar") ? (o) => o.tipo === "perguntar" : null;
const pct = (a, b) => (100 * a / (b || 1)).toFixed(1).replace(".", ",") + " %";

/* ---------------------------------------------------------------------- */
for(const h of HISTORIAS){
  console.log(`\n${h.titulo} (${h.id})`);
  validarCampos(h);
  if(erros){ console.log("  (há erros nos campos: não percorro os caminhos)"); continue; }
  try{ regras(h); console.log("  regras do motor: ok"); }
  catch(e){ erro(h.id, "regra do motor: " + e.message); }

  console.log("\n  nível      caminhos  verdadeiro  frágil      a meio      rutura      pista principal");
  for(const n of NIVEIS){
    const r = percorrer(h, n);
    console.log(`  ${n.padEnd(9)}  ${String(r.total).padStart(8)}  ` +
      ["verdadeiro", "fragil", "meio", "rutura"].map((f) => `${String(r[f]).padStart(4)} ${pct(r[f], r.total).padStart(7)}`).join(" ") +
      `  ${pct(r.pista, r.total).padStart(7)}`);
    ["verdadeiro", "fragil", "meio", "rutura"].forEach((f) => {
      if(!r[f] && !(f === "rutura" && n === "facil")) erro(h.id, `no nível ${n} nenhum caminho dá o final «${f}»`);
    });
    if(n === "facil" && r.rutura) erro(h.id, "o Fácil não pode ter rutura");
    if(n === "dificil" || n === "semrede"){
      if(r.verdadeiro / r.total > .15) aviso(h.id, `no ${n}, ${pct(r.verdadeiro, r.total)} dos caminhos dão acordo verdadeiro (mais de 15 %: é óbvio)`);
      const c = percorrer(h, n, sempreCerto);
      if(c.verdadeiro) aviso(h.id, `no ${n}, escolher sempre a que parece certa dá acordo verdadeiro em ${c.verdadeiro} de ${c.total} caminhos`);
      else console.log(`  ${"".padEnd(9)}  sempre a que parece certa: ${["fragil", "meio", "rutura"].filter((f) => c[f]).map((f) => `${f} ${c[f]}`).join(", ")} (nunca verdadeiro)`);
    }
  }
}
console.log(`\n${erros} erro(s), ${avisos} aviso(s).`);
process.exit(erros ? 1 : 0);
