// Teste no navegador do «Diz em voz alta», sem microfone: troca o microfone por
// uma voz sintética (sílabas a ritmo conhecido, uma pausa de 0,55 s, fim a descer)
// com ruído de fundo. Uso, na consola da página servida em 127.0.0.1, depois de
// um clique real na página (o navegador só deixa tocar som depois disso):
//   await import("/_testes/voz-falso.js"); await __take({ sil: 3, melodia: 1.8 }); __medir()
navigator.mediaDevices.getUserMedia = function(){
  const ctx = new AudioContext(), dest = ctx.createMediaStreamDestination();
  const osc = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
  osc.type = "sawtooth"; lp.type = "lowpass"; lp.frequency.value = 1400; g.gain.value = 0;
  osc.connect(lp); lp.connect(g); g.connect(dest);
  const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = nb.getChannelData(0);
  for(let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.003;
  const ns = ctx.createBufferSource(); ns.buffer = nb; ns.loop = true; ns.connect(dest); ns.start(); osc.start(); ctx.resume();
  // sil: sílabas por segundo; melodia: semitons de ondulação; sobe: fim a subir
  window.__falar = function(op = {}){
    const ini = ctx.currentTime + 1.4, sil = op.sil || 4.5, f0 = op.f0 || 190;
    function trecho(a, dur, fim){
      const n = Math.floor(dur * sil);
      for(let i = 0; i < n; i++){
        const s = a + i / sil;
        g.gain.setValueAtTime(0.02, s); g.gain.linearRampToValueAtTime(op.forte || 0.5, s + 0.06); g.gain.linearRampToValueAtTime(0.03, s + 0.9 / sil);
        osc.frequency.setValueAtTime(f0 * Math.pow(2, (op.melodia || 2.5) * Math.sin(i * 1.3) / 12), s);
      }
      if(fim){ osc.frequency.setValueAtTime(f0, a + n / sil - 0.5); osc.frequency.linearRampToValueAtTime(f0 * (op.sobe ? 1.5 : 0.68), a + n / sil); }
      g.gain.cancelScheduledValues(a + n / sil); g.gain.setValueAtTime(0, a + n / sil);
    }
    trecho(ini, 2, false);
    trecho(ini + 2 + (op.pausa ?? 0.55), 1.5, true);
  };
  return Promise.resolve(dest.stream);
};
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
// uma gravação completa: carrega em Gravar, a voz fala, espera pelo resultado
window.__take = async function(op){
  const t = performance.now();
  document.getElementById("vozGravar").click();
  while(!window.__falar && performance.now() - t < 2000) await esperar(20);
  await esperar(50); window.__falar(op);
  await esperar(500);
  while(!/Carrega|curto|^$/.test(document.getElementById("vozEstado").textContent) && performance.now() - t < 20000) await esperar(100);
  return document.getElementById("vozRes").innerText.replace(/\n+/g, " / ");
};
// o cartão cabe? o Gravar está à vista? algo sai do ecrã ou fica cortado?
window.__medir = function(){
  const vw = innerWidth, vh = innerHeight, c = document.querySelector(".voz-cartao"), g = document.getElementById("vozGravar").getBoundingClientRect();
  const fora = [...document.querySelectorAll("#voz *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > vw + 1 || r.left < -1); }).map((e) => e.className || e.tagName).slice(0, 5);
  const cortados = [...document.querySelectorAll("#voz .acao, #voz .vl-valor, #voz button")].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => (e.id || e.className) + ":" + e.textContent.trim().slice(0, 20));
  const dica = document.querySelector(".voz-dica, .voz-comp:last-child");
  const ultimo = document.querySelector("#vozRes > :last-child");
  const ur = ultimo && ultimo.getBoundingClientRect();
  return { vw, vh, cartao: Math.round(c.getBoundingClientRect().height), conteudo: c.scrollHeight, sobra: c.clientHeight - c.scrollHeight,
    gravarVisivel: g.top >= 0 && g.bottom <= vh, resultadoVisivel: !ur || ur.bottom <= g.top + 1, horizontal: document.documentElement.scrollWidth > vw, fora, cortados };
};
