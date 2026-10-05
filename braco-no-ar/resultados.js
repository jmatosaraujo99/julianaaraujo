/* ==========================================================================
   BRAÇO NO AR · resultados nos telemóveis
   O ecrã publica um resumo pequeno da pergunta que está a mostrar
   (sessoes/<código>/res) e os telemóveis vão buscá-lo de 3 em 3 segundos.
   Assim cada telemóvel continua a usar uma só ligação em tempo real.
   ========================================================================== */
(function () {
  "use strict";
  var B = window.BNA, el = B.el, T = B.tipos;
  var LETRAS = "ABCDEFGHIJKL";

  /* resumo de um diapositivo, a partir das respostas (lado do ecrã) */
  B.resumoTel = function (s, d, estado) {
    if (!s || !T[s.tipo] || !T[s.tipo].interativo) return null;
    var r = d.r || {}, x = null;
    if (s.tipo === "escolha") {
      var c = B.contarEscolha(r, (s.opcoes || []).length);
      x = { k: "b", c: c.c, t: c.t };
    } else if (s.tipo === "quiz") {
      if (!estado || !estado.rev) return null;          /* antes de revelar não se mostra nada */
      var q = B.contarEscolha(r, (s.opcoes || []).length);
      x = { k: "b", c: q.c, t: q.t, certa: s.certa };
    } else if (s.tipo === "escala") {
      var st = B.estatEscala(r, s), t = 0;
      st.forEach(function (o) { t = Math.max(t, o.t); });
      x = { k: "e", m: st.map(function (o) { return o.m === null ? null : Math.round(o.m * 10) / 10; }), t: t, min: Number(s.min), max: Number(s.max) };
    } else if (s.tipo === "ordenar") {
      var o = B.estatOrdem(r, (s.itens || []).length);
      var ord = o.itens.slice().sort(function (a, b) { return b.pts - a.pts || a.i - b.i; }).map(function (y) { return y.i; });
      x = { k: "o", ord: ord, t: o.t };
    } else if (s.tipo === "nuvem") {
      var p = B.palavrasDe(r, d.ocultos);
      x = { k: "n", l: p.lista.slice(0, 14).map(function (y) { return [y.w, y.n]; }), t: p.pessoas };
    } else if (s.tipo === "aberta") {
      var l = B.abertasDe(r, d.ocultos);
      x = { k: "a", t: l.length, l: l.slice(0, 4).map(function (y) { return y.txt.slice(0, 140); }) };
    }
    if (x) x.id = s.id;
    return x;
  };

  function contagem(t, palavra) { return t + " " + (t === 1 ? palavra : palavra + "s"); }

  /* desenho do resumo no telemóvel */
  B.resultadosTel = function (s, res, tema) {
    var caixa = el("section", { class: "ph-res", "aria-label": "Resultados até agora" });
    var t = res.t || 0;
    caixa.appendChild(el("p", { class: "ph-res-tit" }, el("b", null, "Resultados até agora"), el("span", null, contagem(t, "resposta"))));
    if (res.k === "b") {
      var max = Math.max.apply(null, (res.c || []).concat([1]));
      (s.opcoes || []).forEach(function (op, i) {
        var n = (res.c || [])[i] || 0, pct = t ? Math.round((n / t) * 100) : 0, cor = B.cor(tema, i);
        var certa = typeof res.certa === "number" && res.certa === i;
        caixa.appendChild(el("div", { class: "ph-res-b" + (certa ? " certa" : "") },
          el("div", { class: "ph-res-rot" }, el("span", { class: "ph-res-l", style: { background: cor } }, LETRAS[i] || String(i + 1)),
            el("span", { class: "ph-res-t" }, (certa ? "✓ " : "") + (op || "Opção " + (LETRAS[i] || i + 1))), el("b", null, pct + "%")),
          el("div", { class: "ph-res-tr" }, el("i", { style: { width: (n / max) * 100 + "%", background: cor } }))));
      });
    } else if (res.k === "e") {
      var min = res.min, mx = res.max, afs = (s.afirmacoes && s.afirmacoes.length ? s.afirmacoes : [s.pergunta]);
      afs.forEach(function (a, i) {
        var m = (res.m || [])[i];
        var pos = m === null || m === undefined ? 0 : (m - min) / Math.max(1, mx - min);
        caixa.appendChild(el("div", { class: "ph-res-b" },
          el("div", { class: "ph-res-rot" }, el("span", { class: "ph-res-t" }, a || (afs.length === 1 ? (s.pergunta || "Média") : "Afirmação " + (i + 1))), el("b", null, m === null || m === undefined ? "—" : String(m).replace(".", ","))),
          el("div", { class: "ph-res-tr" }, el("i", { style: { width: pos * 100 + "%", background: B.cor(tema, i) } }))));
      });
      caixa.appendChild(el("p", { class: "ph-res-nota" }, "Média de " + min + " a " + mx + "."));
    } else if (res.k === "o") {
      caixa.appendChild(el("ol", { class: "ph-res-o" }, (res.ord || []).map(function (i, k) {
        return el("li", null, el("b", null, String(k + 1)), el("span", null, (s.itens || [])[i] || "Item " + (i + 1)));
      })));
    } else if (res.k === "n") {
      var top = (res.l[0] && res.l[0][1]) || 1;
      caixa.appendChild(el("div", { class: "ph-res-n" }, (res.l || []).map(function (w, i) {
        return el("span", { style: { fontSize: (15 + 15 * (w[1] / top)) + "px", color: B.cor(tema, i) } }, w[0]);
      })));
      if (!(res.l || []).length) caixa.appendChild(el("p", { class: "ph-res-nota" }, "Ainda sem palavras."));
    } else if (res.k === "a") {
      caixa.appendChild(el("div", { class: "ph-res-a" }, (res.l || []).map(function (txt, i) {
        return el("p", { style: { borderLeftColor: B.cor(tema, i) } }, txt);
      })));
      if (t > (res.l || []).length) caixa.appendChild(el("p", { class: "ph-res-nota" }, "As outras estão no ecrã."));
    }
    return caixa;
  };

  /* «à espera»: três pontos a saltar e uma frase */
  B.esperaTel = function (texto) {
    return el("div", { class: "ph-espera", role: "status" },
      el("span", { class: "ph-espera-p", "aria-hidden": "true" }, el("i"), el("i"), el("i")),
      el("span", null, texto || "À espera da próxima pergunta"));
  };
})();
