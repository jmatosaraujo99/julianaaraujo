// Calibração da análise de voz com fala portuguesa a sério (voz Piper pt-PT, local).
// Uso: node _testes/calibrar-piper.mjs <pasta com frases.json e os .wav>
// Compara os núcleos que a análise conta com as sílabas do texto, por velocidade.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const pagina = readFileSync(fileURLToPath(new URL("../positive-switch.html", import.meta.url)), "utf8");
const caixa = {};
vm.runInNewContext(pagina.match(/<script id="voz-analise">([\s\S]*?)<\/script>/)[1], { globalThis: caixa });
const V = caixa.VOZ;
const pasta = process.argv[2];
const frases = JSON.parse(readFileSync(join(pasta, "frases.json"), "utf8"));

function lerWav(caminho){
  const b = readFileSync(caminho);
  let o = 12, sr = 0, canais = 1, bits = 16;
  while(o < b.length){
    const id = b.toString("ascii", o, o + 4), tam = b.readUInt32LE(o + 4);
    if(id === "fmt "){ canais = b.readUInt16LE(o + 10); sr = b.readUInt32LE(o + 12); bits = b.readUInt16LE(o + 22); }
    if(id === "data"){
      if(bits !== 16) throw new Error("só 16 bits");
      const n = tam / 2 / canais, x = new Float32Array(n);
      for(let i = 0; i < n; i++) x[i] = b.readInt16LE(o + 8 + i * 2 * canais) / 32768;
      return { x, sr };
    }
    o += 8 + tam + (tam % 2);
  }
  throw new Error("WAV sem dados");
}
// sílabas do texto, à moda da escola: grupos de vogais (os ditongos contam um)
const silabas = (t) => (t.toLowerCase().match(/[aeiouáéíóúâêôãõàü]+/g) || []).length;
function comRuido(x, sr){
  const pre = Math.round(1.2 * sr), pos = Math.round(0.5 * sr), y = new Float32Array(pre + x.length + pos);
  let s = 11;
  for(let i = 0; i < y.length; i++){ s = (s * 16807) % 2147483647; y[i] = 0.002 * (s / 2147483647 * 2 - 1); }
  for(let i = 0; i < x.length; i++) y[pre + i] += x[i];
  return y;
}

const linhas = [];
for(const escala of ["0.8", "1.0", "1.3"]){
  const r = [];
  for(const f of frases){
    const c = join(pasta, `${f.id}_${escala}.wav`);
    if(!existsSync(c)) continue;
    const { x, sr } = lerWav(c);
    const m = V.analisar(comRuido(x, sr), sr, { calib: 1 });
    if(!m.ouviu) { console.log("não ouviu", f.id, escala); continue; }
    const s = silabas(f.texto);
    const pontos = (f.texto.replace(/[.!?…»"\s]+$/, "").match(/[,.;:!?…—]/g) || []).length;
    const pergunta = /\?\s*$/.test(f.texto);
    r.push({ id: f.id, s, nuc: m.nucleos.length, razao: m.nucleos.length / s, canon: s / m.tempoFala, medido: m.ritmo,
      dp: m.tom.dp, fim: m.tom.fim, delta: m.tom.delta, pergunta, pausas: m.pausas.length, pontos, snr: m.volume.snr, queda: m.volume.queda, dpv: m.volume.dp });
  }
  if(!r.length) continue;
  const med = (k) => r.reduce((a, v) => a + (v[k] ?? 0), 0) / r.length;
  const fins = {}; r.filter((v) => !v.pergunta).forEach((v) => { fins[v.fim] = (fins[v.fim] || 0) + 1; });
  const erroRitmo = r.reduce((a, v) => a + Math.abs(v.medido - v.canon) / v.canon, 0) / r.length;
  linhas.push({ escala, frases: r.length, "picos/sílabas": med("razao").toFixed(2), "sílabas/s (texto)": med("canon").toFixed(2),
    "sílabas/s (medido)": med("medido").toFixed(2), "erro médio": (100 * erroRitmo).toFixed(0) + "%",
    "melodia (st)": med("dp").toFixed(2), "fins (afirmações)": JSON.stringify(fins),
    "pausas": med("pausas").toFixed(2), "pontos a meio": med("pontos").toFixed(2), "snr": med("snr").toFixed(0), "queda": med("queda").toFixed(1), "saltos": med("dpv").toFixed(1) });
  if(process.argv[3] === "-v") console.table(r.map((v) => ({ id: v.id, s: v.s, nuc: v.nuc, canon: v.canon.toFixed(2), medido: v.medido.toFixed(2), dp: v.dp?.toFixed(2), fim: v.fim, delta: v.delta?.toFixed(2), texto: frases.find((f) => f.id === v.id).texto.slice(-28), pausas: v.pausas, pontos: v.pontos })));
}
console.table(linhas);
