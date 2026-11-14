// Teste da análise de voz do Positive Switch, com sinais sintéticos.
// Corre de dentro da pasta do site:  node _testes/voz-analise.test.mjs
// (a pasta começa por _ e o GitHub Pages não a publica)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import assert from "node:assert/strict";

const pagina = readFileSync(fileURLToPath(new URL("../positive-switch.html", import.meta.url)), "utf8");
const bloco = pagina.match(/<script id="voz-analise">([\s\S]*?)<\/script>/);
assert.ok(bloco, "falta o bloco <script id=\"voz-analise\"> na página");
const caixa = {};
vm.runInNewContext(bloco[1], { globalThis: caixa });
const V = caixa.VOZ;

const SR = 48000;
const seg = (s, sr = SR) => Math.round(s * sr);
// voz de brincar: fundamental + 4 harmónicos, com a frequência a variar se for uma função
function voz(dur, f, amp = 0.3, sr = SR){
  const x = new Float32Array(seg(dur, sr));
  let fase = 0;
  for(let i = 0; i < x.length; i++){
    const hz = typeof f === "function" ? f(i / sr) : f;
    fase += 2 * Math.PI * hz / sr;
    x[i] = amp * (Math.sin(fase) + 0.5 * Math.sin(2 * fase) + 0.3 * Math.sin(3 * fase) + 0.2 * Math.sin(4 * fase)) / 2;
  }
  return x;
}
function seno(dur, hz, amp = 0.3, sr = SR){
  const x = new Float32Array(seg(dur, sr));
  for(let i = 0; i < x.length; i++) x[i] = amp * Math.sin(2 * Math.PI * hz * i / sr);
  return x;
}
function silencio(dur, ruido = 0, sr = SR){
  const x = new Float32Array(seg(dur, sr));
  let s = 7;   // ruído pseudoaleatório, sempre igual
  for(let i = 0; i < x.length; i++){ s = (s * 16807) % 2147483647; x[i] = ruido * (s / 2147483647 * 2 - 1); }
  return x;
}
function juntar(...partes){
  const n = partes.reduce((a, p) => a + p.length, 0), x = new Float32Array(n);
  let o = 0; for(const p of partes){ x.set(p, o); o += p.length; }
  return x;
}
// sílabas a ritmo conhecido: rajadas de voz com envelope em seno, sem buracos de pausa
function silabas(porSeg, dur, f = 150, sr = SR){
  const x = voz(dur, f, 0.35, sr);
  for(let i = 0; i < x.length; i++){ const t = i / sr; x[i] *= 0.08 + 0.92 * Math.pow(Math.sin(Math.PI * porSeg * t), 2); }
  return x;
}
const fundo = (dur) => silencio(dur, 0.002);
let ok = 0;
function caso(nome, fn){ fn(); ok++; console.log("  ok ", nome); }

console.log("Tom");
for(const sr of [48000, 44100, 16000]){
  for(const hz of [80, 150, 220, 380]){
    caso(`seno de ${hz} Hz a ${sr / 1000} kHz → ${hz} Hz`, () => {
      const r = V.reduzir(seno(0.2, hz, 0.3, sr), sr);
      const f = V.tom(r.y, 200, r.sr);
      assert.ok(Math.abs(f - hz) / hz < 0.02, `deu ${f.toFixed(1)} Hz`);
    });
  }
}
caso("ruído sem tom → 0", () => {
  const r = V.reduzir(silencio(0.2, 0.3), SR);
  assert.equal(V.tom(r.y, 200, r.sr), 0);
});
caso("voz com harmónicos a 120 Hz → 120 Hz (não o dobro nem metade)", () => {
  const r = V.reduzir(voz(0.2, 120), SR);
  const f = V.tom(r.y, 200, r.sr);
  assert.ok(Math.abs(f - 120) < 2.5, `deu ${f.toFixed(1)} Hz`);
});

console.log("Silêncio");
caso("silêncio absoluto → não ouviu nada", () => {
  assert.equal(V.analisar(new Float32Array(SR * 3), SR, { calib: 1 }).ouviu, false);
});
caso("só ruído da sala → não ouviu nada", () => {
  assert.equal(V.analisar(silencio(4, 0.01), SR, { calib: 1 }).ouviu, false);
});
caso("um estalido curto → não conta como fala", () => {
  assert.equal(V.analisar(juntar(fundo(1.5), voz(0.04, 200, 0.5), fundo(1.5)), SR, { calib: 1 }).ouviu, false);
});

console.log("Ritmo (sílabas por segundo)");
for(const r of [3, 4, 5, 6]){
  caso(`${r} sílabas por segundo → ${r} picos por segundo`, () => {
    const m = V.analisar(juntar(fundo(1), silabas(r, 3), fundo(0.6)), SR, { calib: 1 });
    assert.ok(m.ouviu && !m.curto);
    assert.ok(Math.abs(m.ritmoPicos - r) <= 0.5, `deu ${m.ritmoPicos.toFixed(2)} (${m.nucleos.length} núcleos em ${m.tempoFala.toFixed(2)} s)`);
    assert.ok(Math.abs(m.ritmo - m.ritmoPicos / 0.6) < 1e-9, "o ritmo mostrado está em sílabas do dicionário");
  });
}
caso("um som contínuo sem sílabas → 1 núcleo, não dezenas", () => {
  const m = V.analisar(juntar(fundo(1), voz(2, 150), fundo(0.5)), SR, { calib: 1 });
  assert.ok(m.nucleos.length <= 2, `deu ${m.nucleos.length}`);
});

console.log("Pausas");
caso("duas frases com 600 ms entre elas → 1 pausa de ~600 ms", () => {
  const m = V.analisar(juntar(fundo(1), silabas(4, 1.5), fundo(0.6), silabas(4, 1.5), fundo(0.5)), SR, { calib: 1 });
  assert.equal(m.pausas.length, 1);
  assert.ok(Math.abs(m.pausas[0].dur - 0.6) < 0.12, `deu ${m.pausas[0].dur.toFixed(2)} s`);
});
caso("um buraco de 150 ms (uma consoante) → não é pausa", () => {
  const m = V.analisar(juntar(fundo(1), silabas(4, 1.5), fundo(0.15), silabas(4, 1.5), fundo(0.5)), SR, { calib: 1 });
  assert.equal(m.pausas.length, 0);
});

console.log("Melodia e fim da frase");
caso("tom fixo → melodia plana (< 0,5 semitons)", () => {
  const m = V.analisar(juntar(fundo(1), silabas(4, 3, 150), fundo(0.5)), SR, { calib: 1 });
  assert.ok(m.tom.dp < 0.5, `deu ${m.tom.dp}`);
  assert.ok(Math.abs(m.tom.mediana - 150) < 3);
});
caso("fim a descer (180 → 130 Hz no último meio segundo) → «desce»", () => {
  const f = (t) => t < 2.4 ? 180 : 180 - (t - 2.4) / 0.6 * 50;
  const m = V.analisar(juntar(fundo(1), silabas(4, 3, f), fundo(0.5)), SR, { calib: 1 });
  assert.equal(m.tom.fim, "desce", `delta ${m.tom.delta}`);
});
caso("fim a subir (150 → 220 Hz) → «sobe»", () => {
  const f = (t) => t < 2.4 ? 150 : 150 + (t - 2.4) / 0.6 * 70;
  const m = V.analisar(juntar(fundo(1), silabas(4, 3, f), fundo(0.5)), SR, { calib: 1 });
  assert.equal(m.tom.fim, "sobe", `delta ${m.tom.delta}`);
});
caso("melodia viva (±4 semitons) → desvio entre 2 e 4", () => {
  const f = (t) => 160 * Math.pow(2, 4 * Math.sin(2 * Math.PI * 0.7 * t) / 12);
  const m = V.analisar(juntar(fundo(1), silabas(4, 3, f), fundo(0.5)), SR, { calib: 1 });
  assert.ok(m.tom.dp > 2 && m.tom.dp < 4, `deu ${m.tom.dp}`);
});

console.log("Volume");
caso("voz a cair 12 dB no fim → queda > 6 dB", () => {
  const x = juntar(fundo(1), silabas(4, 3), fundo(0.5));
  for(let i = SR * 3; i < SR * 4; i++) x[i] *= 0.25;
  const m = V.analisar(x, SR, { calib: 1 });
  assert.ok(m.volume.queda > 6, `deu ${m.volume.queda}`);
});
caso("voz saturada → satura > 0,2 %", () => {
  const x = juntar(fundo(1), silabas(4, 2), fundo(0.5));
  for(let i = SR; i < SR * 3; i++) x[i] = Math.max(-1, Math.min(1, x[i] * 8));
  assert.ok(V.analisar(x, SR, { calib: 1 }).volume.satura > 0.002);
});
caso("alguém que fala antes do fim do segundo de silêncio → ainda se ouve", () => {
  const m = V.analisar(juntar(fundo(0.5), silabas(4, 3), fundo(0.5)), SR, { calib: 1 });
  assert.ok(m.ouviu && m.nucleos.length >= 8, `núcleos ${m.nucleos && m.nucleos.length}`);
});

console.log("Intenções");
caso("regra por técnica, com o baralho por omissão", () => {
  assert.equal(V.intencaoDe("familia", ["disco", "pedido"]), "limite");
  assert.equal(V.intencaoDe("conflitos", ["desc"]), "limite");
  assert.equal(V.intencaoDe("formacao", ["agradecer"]), "animar");
  assert.equal(V.intencaoDe("lideranca", ["reforco", "prazo"]), "animar");
  assert.equal(V.intencaoDe("atendimento", ["emocao", "pergunta"]), "acalmar");
  assert.equal(V.intencaoDe("familia", ["emocao"]), "empatia");
  assert.equal(V.intencaoDe("conflitos", ["eu"]), "empatia");
  assert.equal(V.intencaoDe("atendimento", ["prazo"]), "acalmar");
  assert.equal(V.intencaoDe("lideranca", ["porque"]), "limite");
  for(const k of Object.keys(V.PERFIS)) assert.ok(V.CONTRARIO[k] && V.CONTRARIO[k] !== k);
});

console.log("Avaliação e estrelas");
const base = () => ({ ouviu: true, curto: false, ritmo: 4.5, ritmoPicos: 2.7, pausas: [{ ini: 1, dur: 0.5 }],
  tom: { mediana: 180, dp: 2.2, fim: "desce", delta: -2 }, volume: { snr: 28, dp: 3, queda: 1, satura: 0 } });
caso("tudo dentro do perfil → 5 estrelas, sem dica", () => {
  const a = V.avaliar(base(), "acalmar", "Vejo que está aborrecido. Conte-me o que aconteceu.");
  assert.equal(a.estrelas, 5); assert.equal(a.dica, "");
});
caso("fim a subir numa frase firme → perde no tom e a dica é sobre o fim", () => {
  const m = base(); m.tom.fim = "sobe";
  const a = V.avaliar(m, "limite", "Isto não depende só de mim. Falo com a minha responsável.");
  assert.ok(a.linhas.tom.nota < 1 && a.estrelas < 5);
  assert.match(a.dica, /pergunta/);
});
caso("pergunta no fim → o fim pode subir sem perder", () => {
  const m = base(); m.tom.fim = "sobe";
  assert.equal(V.avaliar(m, "limite", "Qual lhe dá mais jeito?").linhas.tom.nota, 1);
});
caso("depressa demais para acalmar → ritmo a 0 e mensagem de abrandar", () => {
  const m = base(); m.ritmo = 7.5;
  const a = V.avaliar(m, "acalmar", "");
  assert.equal(a.linhas.ritmo.nota, 0); assert.match(a.linhas.ritmo.msg, /abranda/);
});
caso("o mesmo ritmo rápido serve para animar", () => {
  const m = base(); m.ritmo = 6.5; m.tom.dp = 4.2;
  assert.equal(V.avaliar(m, "animar", "").linhas.ritmo.nota, 1);
});
caso("sem pausas numa frase com um ponto a meio → pausas a 0", () => {
  const m = base(); m.pausas = [];
  assert.equal(V.avaliar(m, "empatia", "Percebo. Vamos ver isso juntos.").linhas.pausas.nota, 0);
});
caso("voz a sumir → volume a 0", () => {
  const m = base(); m.volume.snr = 8;
  assert.match(V.avaliar(m, "empatia", "").linhas.volume.msg, /sumir/);
});
caso("tudo fora → 1 estrela, nunca 0", () => {
  const m = base(); m.ritmo = 9; m.tom.dp = 0.2; m.tom.fim = "sobe"; m.pausas = []; m.volume.snr = 5;
  assert.equal(V.avaliar(m, "acalmar", "Vamos ver. Conte-me.").estrelas, 1);
});
caso("sem som ou curto demais → sem estrelas e com uma explicação", () => {
  assert.equal(V.avaliar({ ouviu: false }, "acalmar").ouviu, false);
  assert.match(V.avaliar({ ouviu: true, curto: true }, "acalmar").titulo, /curto/);
});
caso("desafio: de acalmar para animar, mais rápido e mais variado → diferença ouvida", () => {
  const a = base(), b = base(); b.ritmo = 6.4; b.tom.dp = 4;
  const c = V.comparar(a, b, "acalmar", "animar");
  assert.equal(c.certas, 2); assert.equal(c.contam, 2); assert.match(c.veredicto, /diferença/);
});
caso("desafio: as duas iguais → pede para exagerar", () => {
  const c = V.comparar(base(), base(), "empatia", "limite");
  assert.equal(c.certas, 0); assert.match(c.veredicto, /Exagera/);
});

console.log("Voz de base e pormenores");
caso("seno de 200 Hz com base de 180 Hz → +1,8 meios-tons", () => {
  const r = V.reduzir(seno(0.2, 200), SR), f = V.tom(r.y, 200, r.sr);
  const st = V.semitons(f, 180);
  assert.ok(Math.abs(st - 1.82) < 0.1, `deu ${st.toFixed(2)}`);
});
caso("200 Hz com base de 180 Hz, para acalmar → o tom médio pede mais grave", () => {
  const m = base(); m.tom.mediana = 200;
  const it = V.detalhar(m, "acalmar", "Percebo. Vamos ver isso juntos.", 180).find((x) => x.nome === "O tom médio");
  assert.equal(it.ok, false); assert.match(it.valor, /1,8 meios-tons acima/); assert.match(it.conselho, /grave/);
});
caso("sem base → o tom médio só sugere afinar, e vai para o fim da lista", () => {
  const it = V.detalhar(base(), "acalmar", "", null);
  assert.ok(it.length <= 4);
  assert.ok(!it.some((x) => x.nome === "O tom médio" && x.ok === false));
});
caso("fim a subir numa frase firme → o primeiro pormenor é o final, com um exercício", () => {
  const m = base(); m.tom.fim = "sobe"; m.tom.delta = 3;
  const it = V.detalhar(m, "limite", "Isto não depende só de mim.", 180);
  assert.equal(it[0].nome, "O final"); assert.equal(it[0].ok, false); assert.match(it[0].conselho, /ponto final/);
});
caso("o sítio da pausa sai do texto", () => {
  assert.match(V.sitioPausa("Em saldos não fazemos devoluções; o que posso fazer é trocar.").frase, /o que posso/);
  assert.match(V.sitioPausa("Percebo a desilusão. Esse desconto já não consigo.").frase, /a desilusão/);
  assert.equal(V.sitioPausa(""), null);
});
caso("sem pausa numa frase de empatia → exercício com o sítio concreto", () => {
  const m = base(); m.pausas = [];
  const it = V.detalhar(m, "empatia", "Percebo a desilusão. Esse desconto já não consigo.", 180).find((x) => x.nome === "As pausas");
  assert.equal(it.ok, false); assert.match(it.conselho, /depois de «a desilusão»/);
});
caso("faixa: duas frases com uma pausa → 2 trechos e a pausa a meio", () => {
  const m = V.analisar(juntar(fundo(1), silabas(4, 1.5), fundo(0.6), silabas(4, 1.5), fundo(0.5)), SR, { calib: 1 });
  assert.equal(m.trechos.length, 2);
  assert.ok(m.pausas[0].pos > 0.4 && m.pausas[0].pos < 0.6, `pos ${m.pausas[0].pos}`);
});
caso("tom fixo → um trecho plano marcado; melodia viva → nenhum", () => {
  const plana = V.analisar(juntar(fundo(1), silabas(4, 3, 150), fundo(0.5)), SR, { calib: 1 });
  assert.ok(plana.planos.length >= 1 && plana.planos[0][1] - plana.planos[0][0] > 1.5, JSON.stringify(plana.planos));
  const viva = V.analisar(juntar(fundo(1), silabas(4, 3, (t) => 160 * Math.pow(2, 4 * Math.sin(2 * Math.PI * 1.2 * t) / 12)), fundo(0.5)), SR, { calib: 1 });
  assert.equal(viva.planos.length, 0, JSON.stringify(viva.planos));
});
caso("primeira sílaba 12 dB abaixo → arranque hesitante", () => {
  const x = juntar(fundo(1), silabas(4, 3), fundo(0.5));
  for(let i = SR; i < SR * 1.25; i++) x[i] *= 0.25;
  const m = V.analisar(x, SR, { calib: 1 });
  assert.ok(m.arranque < -6, `deu ${m.arranque}`);
});
caso("progresso: o final passou a descer → «o final agora desce»", () => {
  const a = base(); a.tom.fim = "sobe"; a.tom.delta = 3;
  const ra = V.avaliar(a, "limite", "Não."), rb = V.avaliar(base(), "limite", "Não.");
  assert.match(V.progresso(ra, rb)[0], /o final agora desce/);
  assert.equal(V.progresso(null, rb).length, 0);
});

console.log("Baralhos");
caso("seis baralhos de 40 frases completas, com técnicas e cenas que existem", () => {
  const B = Function(`return (${pagina.match(/const BARALHO = (\{[\s\S]*?\n\});/)[1]})`)();
  const T = Function(`return (${pagina.match(/const TECNICAS = (\{[\s\S]*?\n\});/)[1]})`)();
  const cenas = new Set([...pagina.match(/const CENAS = \{([\s\S]*?)\n\};/)[1].matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]));
  assert.equal(cenas.size, 16);
  assert.deepEqual(Object.keys(B), ["atendimento", "formacao", "lideranca", "familia", "conflitos", "reclamacoes"]);
  const vistas = new Set();
  for(const [a, linhas] of Object.entries(B)){
    assert.equal(linhas.length, 40, a);
    for(const l of linhas){
      const p = l.split("|");
      assert.equal(p.length, 8, l);
      assert.ok(p[0] && p[1] && p[2] && p[3] && p[4] && p[6], l);
      p[6].split(",").forEach((t) => assert.ok(T[t], `técnica ${t} em ${p[0]}`));
      assert.ok(cenas.has(p[7]), `cena ${p[7]} em ${p[0]}`);
      const chave = p[0].toLowerCase().replace(/[^a-zà-ú]/g, "");
      assert.ok(!vistas.has(chave), `frase repetida: ${p[0]}`); vistas.add(chave);
    }
  }
  // nas cobranças a técnica «cobrar» põe a voz em «pôr um limite»
  const cobr = B.reclamacoes.filter((l) => l.split("|")[6].includes("cobrar"));
  assert.equal(cobr.length, 15);
  cobr.forEach((l) => assert.equal(V.intencaoDe("reclamacoes", l.split("|")[6].split(",")), "limite"));
  assert.equal(V.intencaoDe("reclamacoes", ["posso"]), "acalmar");
  assert.equal(V.intencaoDe("reclamacoes", ["emocao", "posso"]), "empatia");
});

console.log("Rapidez");
caso("10 s de gravação analisados em menos de 1,5 s", () => {
  const x = juntar(fundo(1), silabas(5, 9, (t) => 150 + 30 * Math.sin(t)), fundo(0.5));
  const t0 = performance.now(); V.analisar(x, SR, { calib: 1 }); const ms = performance.now() - t0;
  assert.ok(ms < 1500, `levou ${ms.toFixed(0)} ms`);
  console.log(`       (${ms.toFixed(0)} ms)`);
});

console.log(`\n${ok} verificações certas.`);
