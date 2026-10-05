/* ==========================================================================
   BRAÇO NO AR · tipos de diapositivo
   Cada tipo sabe: criar-se, editar-se, aparecer no telemóvel, aparecer no ecrã,
   inventar dados de exemplo e exportar respostas.
   ========================================================================== */
(function () {
  "use strict";
  var B = window.BNA, el = B.el;
  var T = (B.tipos = {});
  var LETRAS = "ABCDEFGHIJKL";
  /* «1.º» com o º em letra normal (na letra Anton parece um zero) */
  function ord(n) { return [String(n), el("span", { class: "ord" }, "º")]; }
  B.ordHtml = function (n) { return n + '<span class="ord">º</span>'; };

  /* ======================================================================
     DADOS
     ====================================================================== */

  function valorDe(v) { return v && typeof v === "object" && "v" in v ? v.v : v; }
  B.valorDe = valorDe;

  function lerEscolha(v) {
    v = valorDe(v);
    if (typeof v === "number") return [v];
    if (typeof v === "string" && v !== "") return v.split(",").map(Number).filter(function (x) { return isFinite(x); });
    return [];
  }
  function contarEscolha(r, n) {
    var c = []; for (var i = 0; i < n; i++) c.push(0);
    var t = 0;
    for (var k in r || {}) {
      var l = lerEscolha(r[k]), conta = false;
      l.forEach(function (x) { if (x >= 0 && x < n) { c[x]++; conta = true; } });
      if (conta) t++;
    }
    return { c: c, t: t };
  }
  function lerEscala(v, n) {
    v = valorDe(v);
    if (typeof v === "number") return [v];
    if (typeof v !== "string") return [];
    return v.split(",").slice(0, n).map(function (x) { return x === "" ? null : Number(x); });
  }
  function estatEscala(r, s) {
    var n = Math.max(1, (s.afirmacoes || []).length), min = Number(s.min), max = Number(s.max);
    var out = [];
    for (var i = 0; i < n; i++) {
      var dist = []; for (var v = min; v <= max; v++) dist.push(0);
      out.push({ soma: 0, t: 0, dist: dist });
    }
    for (var k in r || {}) {
      lerEscala(r[k], n).forEach(function (x, i) {
        if (x === null || !isFinite(x) || x < min || x > max) return;
        out[i].soma += x; out[i].t++; out[i].dist[x - min]++;
      });
    }
    out.forEach(function (o) { o.m = o.t ? o.soma / o.t : null; });
    return out;
  }
  B.estatEscala = estatEscala;
  B.contarEscolha = function (r, n) { return contarEscolha(r, n); };
  function lerOrdem(v, n) {
    v = valorDe(v);
    if (typeof v !== "string" || !v) return [];
    var l = v.split(",").map(Number).filter(function (x) { return isFinite(x) && x >= 0 && x < n; });
    return l.length === n ? l : [];
  }
  function estatOrdem(r, n) {
    var it = []; for (var i = 0; i < n; i++) it.push({ i: i, pts: 0, somaPos: 0, t: 0 });
    var votos = 0;
    for (var k in r || {}) {
      var o = lerOrdem(r[k], n);
      if (!o.length) continue;
      votos++;
      o.forEach(function (idx, pos) { it[idx].pts += n - 1 - pos; it[idx].somaPos += pos + 1; it[idx].t++; });
    }
    it.forEach(function (x) { x.mediaPos = x.t ? x.somaPos / x.t : null; });
    return { itens: it, t: votos };
  }
  B.estatOrdem = function (r, n) { return estatOrdem(r, n); };
  B.palavrasDe = function (r, o) { return palavrasDe(r, o); };
  B.abertasDe = function (r, o) { return abertasDe(r, o); };
  function palavrasDe(r, ocultos) {
    var cont = {}, ordem = {}, n = 0, total = 0;
    for (var k in r || {}) {
      var v = valorDe(r[k]);
      if (typeof v !== "string") continue;
      total++;
      v.split("|").forEach(function (w) {
        w = B.normalizarPalavra(w);
        if (!w || B.improprio(w)) return;
        if (ocultos && ocultos[B.chave(w)]) return;
        if (!(w in cont)) { cont[w] = 0; ordem[w] = n++; }
        cont[w]++;
      });
    }
    var l = Object.keys(cont).map(function (w) { return { w: w, n: cont[w], o: ordem[w] }; });
    l.sort(function (a, b) { return b.n - a.n || a.o - b.o; });
    return { lista: l, pessoas: total };
  }
  function abertasDe(r, ocultos) {
    var l = [];
    for (var k in r || {}) {
      var a = r[k], txt = valorDe(a);
      if (typeof txt !== "string" || !txt.trim()) continue;
      var chave = B.chave(k);
      if (ocultos && ocultos[chave]) continue;
      if (B.improprio(txt)) continue;
      l.push({ k: k, txt: txt.trim(), t: (a && a.t) || 0 });
    }
    l.sort(function (a, b) { return b.t - a.t; });
    return l;
  }

  /* pontos do quiz: 500 a 1000 por resposta certa, mais para quem responde mais depressa */
  B.pontosQuiz = function (s, r, inicio) {
    var res = {}, lim = (Number(s.tempo) || 0) * 1000, escala = lim || 30000;
    for (var pid in r || {}) {
      var a = r[pid];
      if (!a || typeof a !== "object") continue;
      var ok = a.v === s.certa, dt = inicio && a.t ? Math.max(0, a.t - inicio) : escala / 2;
      if (lim && dt > lim + 2000) ok = false;
      res[pid] = ok && s.pontos !== false ? Math.round(500 + 500 * Math.max(0, 1 - dt / escala)) : 0;
    }
    return res;
  };
  /* classificação geral: soma dos quizzes já revelados */
  B.placar = function (at, respostas, inicios, revelados, participantes) {
    var tot = {};
    (at.slides || []).forEach(function (s) {
      if (s.tipo !== "quiz" || s.pontos === false || !(revelados && revelados[s.id])) return;
      var p = B.pontosQuiz(s, (respostas || {})[s.id], inicios && inicios[s.id]);
      for (var pid in p) tot[pid] = (tot[pid] || 0) + p[pid];
    });
    var l = Object.keys(tot).map(function (pid) {
      var n = participantes && participantes[pid] && participantes[pid].n;
      return { pid: pid, total: tot[pid], nome: n || "Anónimo " + pid.slice(0, 3).toUpperCase() };
    });
    l.sort(function (a, b) { return b.total - a.total || (a.nome < b.nome ? -1 : 1); });
    var pos = 0, ult = null;
    l.forEach(function (x, i) { if (x.total !== ult) { pos = i + 1; ult = x.total; } x.pos = pos; });
    return l;
  };

  /* dados de exemplo (pré-visualização no editor) */
  function semente(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var s = seed || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; }; }
  function sortear(pesos, rnd) {
    var t = pesos.reduce(function (a, b) { return a + b; }, 0), x = rnd() * t;
    for (var i = 0; i < pesos.length; i++) { x -= pesos[i]; if (x <= 0) return i; }
    return pesos.length - 1;
  }
  function pesosPara(n, rnd) { var p = []; for (var i = 0; i < n; i++) p.push(0.3 + rnd() * (i === 1 ? 2.2 : 1)); return p; }
  B.exemplo = function (s, nPessoas) {
    var rnd = rng(semente(s.id || "x")), r = {}, n = nPessoas || 24;
    var def = T[s.tipo];
    if (!def || !def.interativo) return r;
    for (var i = 0; i < n; i++) {
      var pid = "ex" + i, v = def.exemplo ? def.exemplo(s, rnd, i) : undefined;
      if (v !== undefined && v !== null) r[pid] = v;
    }
    return r;
  };
  B.exemploParticipantes = function (n) {
    var nomes = ["Rita", "Tiago", "Inês", "Duarte", "Beatriz", "Gonçalo", "Leonor", "Rodrigo", "Matilde", "Afonso", "Carolina", "Martim", "Sofia", "Diogo", "Mariana", "Tomás", "Lara", "Rafael", "Joana", "Pedro", "Clara", "Miguel", "Alice", "Vasco"];
    var p = {};
    for (var i = 0; i < (n || 24); i++) p["ex" + i] = { t: 0, n: nomes[i % nomes.length] };
    return p;
  };

  /* ======================================================================
     ECRÃ (palco)
     ====================================================================== */

  var P = (B.palco = {});
  P.tamanho = function (t) { t = String(t || ""); return t.length > 110 ? " muito-longa" : t.length > 60 ? " longa" : ""; };
  P.secao = function (sup, s, ctx, filhos, interativo) {
    var f = s.fundo && s.fundo !== "auto" ? s.fundo : sup;
    var sec = el("section", { class: "sl sup-" + f });
    if (interativo && ctx.canto) sec.appendChild(ctx.canto());
    filhos.forEach(function (x) { if (x) sec.appendChild(x); });
    if (ctx.rodape) sec.appendChild(ctx.rodape());
    return sec;
  };
  P.cabeca = function (s, texto, ctx, interativo) {
    return el("div", { class: "cabeca" + P.tamanho(texto) + (interativo && ctx.canto ? " com-canto" : "") },
      s.etiqueta ? el("p", { class: "kicker" }, s.etiqueta) : null,
      el("h1", { class: "tit" }, texto || "Escreve a pergunta…"));
  };
  function aviso() { return el("div", { class: "aviso-oculto" }, "Resultados escondidos"); }

  /* colunas verticais */
  function colunas(rotulos, cores, opts) {
    opts = opts || {};
    var g = el("div", { class: "grafico" + (rotulos.length > 6 ? " estreito" : ""), style: { gridTemplateColumns: "repeat(" + rotulos.length + ",minmax(0,1fr))" } });
    var cols = rotulos.map(function (rot, i) {
      var barra = el("div", { class: "barra" }), p = el("div", { class: "pct" }, "0%", el("small", null, ""));
      g.appendChild(el("div", { class: "col", style: { "--c": cores[i] } },
        el("div", { class: "trilho" }, barra, p),
        el("div", { class: "rot" + (opts.numeros ? " num" : "") }, rot)));
      return { barra: barra, p: p };
    });
    var av = aviso(); g.appendChild(av);
    return {
      el: g,
      upd: function (c, t, oculto, contaTexto) {
        var max = Math.max.apply(null, c.concat([1]));
        c.forEach(function (n, i) {
          var h = (n / max) * 78;
          cols[i].barra.style.height = h + "%";
          cols[i].p.style.bottom = "calc(" + h + "% + 12px)";
          cols[i].p.firstChild.nodeValue = B.pct(n, t) + "%";
          cols[i].p.lastChild.textContent = contaTexto ? contaTexto(n) : n === 1 ? "1 voto" : n + " votos";
        });
        g.classList.toggle("oculto", !!oculto);
        av.textContent = "Resultados escondidos · " + t + (t === 1 ? " resposta" : " respostas");
      }
    };
  }
  /* barras horizontais */
  function barrasH(rotulos, cores, tema) {
    var w = el("div", { class: "hbarras" });
    var linhas = rotulos.map(function (rot, i) {
      var fill = el("i", { class: "hb-fill" }), v = el("span", { class: "hb-pct" }, "0%", el("small", null, ""));
      w.appendChild(el("div", { class: "hb", style: { "--c": cores[i], "--ct": B.tintaSobre(cores[i], tema) } },
        el("div", { class: "hb-txt" }, el("b", { class: "hb-chip" }, LETRAS[i] || i + 1), el("span", null, rot)),
        el("div", { class: "hb-tr" }, fill), v));
      return { fill: fill, v: v };
    });
    var av = aviso(); w.appendChild(av);
    return {
      el: w,
      upd: function (c, t, oculto) {
        var max = Math.max.apply(null, c.concat([1]));
        c.forEach(function (n, i) {
          linhas[i].fill.style.width = (n / max) * 100 + "%";
          linhas[i].v.firstChild.nodeValue = B.pct(n, t) + "%";
          linhas[i].v.lastChild.textContent = String(n);
        });
        w.classList.toggle("oculto", !!oculto);
        av.textContent = "Resultados escondidos · " + t + (t === 1 ? " resposta" : " respostas");
      }
    };
  }
  P.colunas = colunas;

  /* ======================================================================
     TELEMÓVEL
     ====================================================================== */

  var M = (B.tel = {});
  M.cab = function (s, texto) {
    return [s.etiqueta ? el("p", { class: "ph-kicker" }, s.etiqueta) : null, el("h1", { class: "ph-q" }, texto || "")];
  };
  M.estado = function (msg, ok) { return el("p", { class: "ph-estado" + (ok ? " ok" : "") }, msg); };
  M.grande = function (h1, p, extra) {
    return el("div", { class: "ph-grande" }, extra || null, el("h1", { html: h1 }), p ? el("p", null, p) : null);
  };
  M.olha = function (texto) { return M.grande("Olha para <em>o ecrã.</em>", texto || ""); };

  /* ======================================================================
     EDITOR (campos)
     ====================================================================== */

  var E = (B.ed = {});
  var nCampo = 0;
  E.campo = function (rotulo, controlo, ajuda) {
    var id = "cp" + (++nCampo);
    if (controlo && controlo.tagName && /INPUT|TEXTAREA|SELECT/.test(controlo.tagName)) controlo.id = id;
    return el("div", { class: "campo" },
      rotulo ? el("label", { class: "rotulo", for: id }, rotulo) : null, controlo,
      ajuda ? el("p", { class: "ajuda" }, ajuda) : null);
  };
  E.texto = function (rotulo, obj, prop, mudar, o) {
    o = o || {};
    var inp = el(o.linhas ? "textarea" : "input", {
      class: "inp", type: o.linhas ? null : "text", rows: o.linhas || null, maxlength: o.max || 300,
      placeholder: o.placeholder || "", value: obj[prop] || "",
      oninput: function () { obj[prop] = inp.value; mudar(); }
    });
    return E.campo(rotulo, inp, o.ajuda);
  };
  E.inter = function (rotulo, obj, prop, mudar, ajuda, depois) {
    var id = "cp" + (++nCampo);
    var cb = el("input", { type: "checkbox", id: id, checked: !!obj[prop], onchange: function () { obj[prop] = cb.checked; mudar(); if (depois) depois(); } });
    return el("div", { class: "campo inter" }, el("label", { for: id }, cb, el("span", null, rotulo)), ajuda ? el("p", { class: "ajuda" }, ajuda) : null);
  };
  E.select = function (rotulo, obj, prop, opcoes, mudar, o) {
    o = o || {};
    var sel = el("select", { class: "inp", onchange: function () {
      var v = sel.value; obj[prop] = o.numero ? Number(v) : v; mudar(); if (o.depois) o.depois();
    } }, opcoes.map(function (op) {
      return el("option", { value: String(op[0]), selected: String(obj[prop]) === String(op[0]) ? "selected" : null }, op[1]);
    }));
    return E.campo(rotulo, sel, o.ajuda);
  };
  /* lista editável: itens de texto (ou objetos), com adicionar, apagar e mover */
  E.lista = function (rotulo, arr, mudar, redesenhar, o) {
    o = o || {};
    var min = o.min || 1, max = o.max || 10;
    var box = el("div", { class: "lista" });
    arr.forEach(function (item, i) {
      var linha = el("div", { class: "li" });
      if (o.marca) linha.appendChild(o.marca(i));
      else linha.appendChild(el("span", { class: "li-n", style: o.cor ? { background: o.cor(i) } : null }, o.letras ? LETRAS[i] : String(i + 1)));
      var campos = el("div", { class: "li-campos" });
      if (o.campos) o.campos(item, i).forEach(function (c) { campos.appendChild(c); });
      else {
        var inp = el("input", { class: "inp", type: "text", maxlength: o.maxTexto || 120, value: item || "", placeholder: (o.placeholder || "Opção") + " " + (o.letras ? LETRAS[i] : i + 1),
          oninput: function () { arr[i] = inp.value; mudar(); } });
        campos.appendChild(inp);
      }
      linha.appendChild(campos);
      linha.appendChild(el("div", { class: "li-acoes" },
        el("button", { type: "button", class: "bt-ic", title: "Subir", disabled: i === 0 ? "disabled" : null, onclick: function () {
          var x = arr[i]; arr[i] = arr[i - 1]; arr[i - 1] = x; if (o.aoMover) o.aoMover(i, i - 1); mudar(); redesenhar();
        } }, "↑"),
        el("button", { type: "button", class: "bt-ic", title: "Descer", disabled: i === arr.length - 1 ? "disabled" : null, onclick: function () {
          var x = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = x; if (o.aoMover) o.aoMover(i, i + 1); mudar(); redesenhar();
        } }, "↓"),
        el("button", { type: "button", class: "bt-ic", title: "Apagar", disabled: arr.length <= min ? "disabled" : null, onclick: function () {
          arr.splice(i, 1); if (o.aoApagar) o.aoApagar(i); mudar(); redesenhar();
        } }, "×")));
      box.appendChild(linha);
    });
    if (arr.length < max) box.appendChild(el("button", { type: "button", class: "bt-mais", onclick: function () {
      arr.push(o.novo ? o.novo() : ""); mudar(); redesenhar();
      setTimeout(function () { var ins = box.parentNode && box.parentNode.querySelectorAll(".li .inp"); if (ins && ins.length) ins[ins.length - (o.campos ? 2 : 1)].focus(); }, 0);
    } }, "+ " + (o.textoMais || "Adicionar")));
    return E.campo(rotulo, box, o.ajuda);
  };
  E.pergunta = function (s, mudar, rotulo, placeholder) {
    return E.texto(rotulo || "Pergunta", s, "pergunta", mudar, { linhas: 2, max: 220, placeholder: placeholder || "Escreve aqui a pergunta" });
  };

  /* ======================================================================
     TIPOS
     ====================================================================== */

  /* ---------- Escolha múltipla ---------- */
  T.escolha = {
    nome: "Escolha múltipla", icone: "▮▯▮", desc: "Votam numa ou mais opções. Barras ao vivo.", interativo: true, sup: "claro",
    novo: function () { return { tipo: "escolha", pergunta: "", opcoes: ["", "", ""], multipla: false, esconder: false }; },
    texto: function (s) { return s.pergunta; },
    editor: function (s, mudar, redesenhar, ctx) {
      return [
        E.pergunta(s, mudar),
        E.lista("Opções", s.opcoes, mudar, redesenhar, { min: 2, max: 10, letras: true, cor: function (i) { return B.cor(ctx.tema, i); }, textoMais: "Adicionar opção" }),
        E.inter("Permitir escolher várias opções", s, "multipla", mudar),
        E.inter("Esconder os resultados até eu os mostrar", s, "esconder", mudar, "No ecrã, carrega em H (ou no botão) para mostrar.")
      ];
    },
    exemplo: function (s, rnd) {
      var n = s.opcoes.length, p = pesosPara(n, rnd);
      if (s.multipla) { var a = sortear(p, rnd), b = sortear(p, rnd); return a === b ? a : [a, b].sort().join(","); }
      return sortear(p, rnd);
    },
    ecra: function (s, ctx) {
      var t = ctx.tema, cores = s.opcoes.map(function (_, i) { return B.cor(t, i); });
      var rot = s.opcoes.map(function (o, i) { return o || "Opção " + LETRAS[i]; });
      var longo = rot.length > 6 || rot.some(function (x) { return x.length > 26; });
      var g = longo ? barrasH(rot, cores, t) : colunas(rot, cores);
      var sec = P.secao("claro", s, ctx, [P.cabeca(s, s.pergunta, ctx, true), g.el], true);
      return { el: sec, upd: function (d) { var r = contarEscolha(d.r, rot.length); g.upd(r.c, r.t, d.oculto); return r.t; } };
    },
    telemovel: function (s, ctx) {
      var sel = lerEscolha(ctx.meu());
      var lista = el("div", { class: "ph-opcoes" + (sel.length ? " tem" : "") });
      s.opcoes.forEach(function (o, i) {
        var c = B.cor(ctx.tema, i);
        lista.appendChild(el("button", {
          class: "ph-op", type: "button", style: { "--c": c }, "aria-pressed": sel.indexOf(i) >= 0 ? "true" : "false",
          onclick: function () {
            if (s.multipla) {
              var k = sel.indexOf(i); if (k >= 0) sel.splice(k, 1); else sel.push(i);
              sel.sort(function (a, b) { return a - b; });
              ctx.enviar(sel.length ? sel.join(",") : null);
            } else ctx.enviar(i);
          }
        }, el("span", { class: "ph-letra", style: { color: B.tintaSobre(c, ctx.tema) } }, LETRAS[i]), el("span", { class: "ph-op-t" }, o || "Opção " + LETRAS[i]), el("span", { class: "ph-visto" }, "✓")));
      });
      return [M.cab(s, s.pergunta), s.multipla ? el("p", { class: "ph-sub" }, "Podes escolher várias.") : null, lista,
        sel.length ? M.estado(ctx.livre ? "✓ Resposta registada. Podes mudar até concluíres." : "✓ Resposta registada. Podes mudar enquanto a pergunta estiver no ecrã.", true) : M.estado(s.multipla ? "Toca nas opções que quiseres." : "Toca numa opção.")];
    },
    csv: function (s, v) { return lerEscolha(v).map(function (i) { return s.opcoes[i] || LETRAS[i]; }).join(" | "); }
  };

  /* ---------- Quiz ---------- */
  T.quiz = {
    nome: "Quiz", icone: "✓?", desc: "Uma resposta certa, tempo e pontos para a classificação.", interativo: true, sup: "escuro",
    novo: function () { return { tipo: "quiz", pergunta: "", opcoes: ["", "", "", ""], certa: 0, tempo: 20, pontos: true, explicacao: "" }; },
    texto: function (s) { return s.pergunta; },
    editor: function (s, mudar, redesenhar, ctx) {
      var nome = "certa-" + s.id;
      return [
        E.pergunta(s, mudar),
        E.lista("Respostas (marca a certa)", s.opcoes, mudar, redesenhar, {
          min: 2, max: 6, letras: true, textoMais: "Adicionar resposta",
          marca: function (i) {
            return el("label", { class: "li-certa", title: "Resposta certa" },
              el("input", { type: "radio", name: nome, checked: s.certa === i, onchange: function () { s.certa = i; mudar(); redesenhar(); } }),
              el("span", { style: { background: B.cor(ctx.tema, i) } }, LETRAS[i]));
          },
          aoMover: function (a, b) { if (s.certa === a) s.certa = b; else if (s.certa === b) s.certa = a; },
          aoApagar: function (i) { if (s.certa === i) s.certa = 0; else if (s.certa > i) s.certa--; }
        }),
        E.select("Tempo para responder", s, "tempo", [[0, "Sem limite"], [10, "10 segundos"], [15, "15 segundos"], [20, "20 segundos"], [30, "30 segundos"], [45, "45 segundos"], [60, "1 minuto"], [90, "1 minuto e meio"]], mudar, { numero: true }),
        E.inter("Dar pontos (conta para a classificação)", s, "pontos", mudar, "Quem acerta ganha 500 a 1000 pontos: mais depressa, mais pontos."),
        E.texto("Explicação", s, "explicacao", mudar, { linhas: 2, max: 240, placeholder: "Aparece quando revelas a resposta (opcional)" })
      ];
    },
    exemplo: function (s, rnd) {
      var n = s.opcoes.length, p = []; for (var i = 0; i < n; i++) p.push(i === s.certa ? 3 : 1);
      return { v: sortear(p, rnd), t: Math.floor(rnd() * 15000) };
    },
    ecra: function (s, ctx) {
      var t = ctx.tema, n = s.opcoes.length;
      var nResp = el("b", null, "0");
      var cols = n === 4 || n === 2 ? 2 : 3;
      var tiles = s.opcoes.map(function (o, i) {
        var c = B.cor(t, i), vv = el("div", { class: "vv" }, "0%", el("small", null, ""));
        var tile = el("div", { class: "tile" + (i === s.certa ? " certa" : ""), style: { "--c": c, "--ct": B.tintaSobre(c, t) } },
          el("span", { class: "letra" }, LETRAS[i]), el("div", { class: "tt" }, o || "Resposta " + LETRAS[i]), vv, el("span", { class: "ok" }, "✓"));
        return { tile: tile, vv: vv };
      });
      var grelha = el("div", { class: "tiles", style: { gridTemplateColumns: "repeat(" + cols + ",minmax(0,1fr))" } }, tiles.map(function (x) { return x.tile; }));
      var explica = el("div", { class: "explica" }, s.explicacao || "");
      var deQuantos = el("span", null, "respostas"), barra = el("i");
      var contador = el("div", { class: "qz-cont" }, nResp, deQuantos, el("div", { class: "qz-barra" }, barra));
      var corpo = el("div", { style: { display: "flex", flexDirection: "column", flex: "1", minHeight: "0" } },
        contador, s.explicacao ? explica : null, grelha);
      var cab = P.cabeca(s, s.pergunta, ctx, false);
      cab.style.paddingRight = "190px";
      var relogio = null, timer = null;
      var kids = [cab, corpo];
      var limite = Number(s.tempo) || 0;
      if (limite && ctx.modo === "vivo") {
        var R = 56, C = 2 * Math.PI * R;
        var arco = el("span");
        arco.innerHTML = '<svg viewBox="0 0 132 132"><circle class="fundo-r" cx="66" cy="66" r="' + R + '"/><circle class="arco" cx="66" cy="66" r="' + R + '" stroke-dasharray="' + C + '" stroke-dashoffset="0"/></svg>';
        var num = el("b", null, String(limite));
        relogio = el("div", { class: "relogio" }, arco.firstChild, num);
        kids.unshift(relogio);
        var circ = relogio.querySelector(".arco");
        var tick = function () {
          if (!document.body.contains(relogio)) { clearInterval(timer); return; }
          var ini = ctx.inicio && ctx.inicio();
          var resta = limite;
          if (ini) resta = Math.max(0, limite - (B.agora() - ini) / 1000);
          if (ctx.revelado && ctx.revelado()) resta = 0;
          num.textContent = String(Math.ceil(resta));
          circ.setAttribute("stroke-dashoffset", String(C * (1 - resta / limite)));
          relogio.classList.toggle("acabou", resta <= 0);
          if (resta <= 0 && ctx.aoAcabar) ctx.aoAcabar();
        };
        timer = setInterval(tick, 200);
        setTimeout(tick, 0);
      }
      var sec = P.secao("escuro", s, ctx, kids, true);
      if (relogio && ctx.canto) { var cn = sec.querySelector(".canto"); if (cn) cn.style.display = "none"; }
      return {
        el: sec, upd: function (d) {
          var r = contarEscolha(d.r, n);
          nResp.textContent = String(r.t);
          var np = d.n || 0;
          deQuantos.textContent = np ? "de " + np + (np === 1 ? " respondeu" : " responderam") : (r.t === 1 ? "resposta" : "respostas");
          barra.parentNode.style.visibility = np ? "visible" : "hidden";
          barra.style.width = (np ? Math.min(100, (r.t / np) * 100) : 0) + "%";
          tiles.forEach(function (x, i) {
            x.vv.firstChild.nodeValue = B.pct(r.c[i], r.t) + "%";
            x.vv.lastChild.textContent = r.c[i] === 1 ? "1 resposta" : r.c[i] + " respostas";
          });
          corpo.classList.toggle("revelado", !!d.revelado);
          return r.t;
        }
      };
    },
    telemovel: function (s, ctx) {
      var meu = ctx.meu(), est = ctx.estado || {};
      var rev = !!est.rev, limite = Number(s.tempo) || 0;
      var kids = [M.cab(s, s.pergunta)];
      if (rev) {
        var certa = est.qc, acertou = meu && meu.v === certa, pts = ctx.pontos || null;
        var opc = el("div", { class: "ph-tiles revelado" });
        s.opcoes.forEach(function (o, i) {
          var c = B.cor(ctx.tema, i);
          opc.appendChild(el("div", { class: "ph-tile" + (i === certa ? " certa" : "") + (meu && meu.v === i ? " minha" : ""), style: { "--c": c, color: B.tintaSobre(c, ctx.tema) } },
            el("b", null, LETRAS[i]), el("span", null, o || "")));
        });
        kids.push(el("div", { class: "ph-feedback" + (acertou ? "" : " falhou") },
          el("strong", null, !meu ? "Não respondeste." : acertou ? "Acertaste!" : "Não foi desta."),
          pts && s.pontos !== false ? el("p", { class: "ph-pts" }, (pts[0] ? "+" + B.milhares(pts[0]) + " pontos · " : "") + "Total: " + B.milhares(pts[1]) + (pts[2] && pts[1] ? " · " + pts[2] + ".º lugar" : "")) : null,
          est.qe ? el("p", null, est.qe) : null));
        kids.push(opc);
        return kids;
      }
      if (meu) {
        kids.push(M.grande("Resposta <em>enviada.</em>", ctx.livre ? "Fica registada. Podes avançar." : "Espera pela revelação no ecrã."));
        return kids;
      }
      var esgotado = limite && !ctx.livre && ctx.tempoRestante && ctx.tempoRestante(limite) <= 0;
      if (esgotado) { kids.push(M.grande("Tempo <em>esgotado.</em>", "Espera pela revelação no ecrã.")); return kids; }
      var g = el("div", { class: "ph-tiles" });
      s.opcoes.forEach(function (o, i) {
        var c = B.cor(ctx.tema, i);
        g.appendChild(el("button", { type: "button", class: "ph-tile", style: { "--c": c, color: B.tintaSobre(c, ctx.tema) },
          onclick: function () { ctx.enviar({ v: i, t: { ".sv": "timestamp" } }); } }, el("b", null, LETRAS[i]), el("span", null, o || "")));
      });
      kids.push(g);
      if (limite && !ctx.livre) kids.push(ctx.relogio(limite));
      return kids;
    },
    csv: function (s, v) {
      var x = valorDe(v);
      if (typeof x !== "number") return "";
      return LETRAS[x] + ") " + (s.opcoes[x] || "") + (x === s.certa ? " ✓" : " ✗");
    }
  };

  /* ---------- Nuvem de palavras ---------- */
  var cv = null;
  function medir(texto, px) {
    if (!cv) cv = document.createElement("canvas").getContext("2d");
    cv.font = px + "px Anton, Impact, sans-serif";
    return cv.measureText(texto).width;
  }
  function layoutNuvem(lista, W, H) {
    lista = lista.slice(0, 70);
    if (!lista.length) return [];
    var max = lista[0].n, min = lista[lista.length - 1].n;
    var base = lista.length < 6 ? 120 : lista.length < 15 ? 96 : 80;
    var placed = [], out = [];
    lista.forEach(function (it, idx) {
      var f = max === min ? 0.6 : Math.sqrt((it.n - min) / (max - min));
      var size = Math.round(26 + (base + 30 - 26) * f);
      for (var tentativa = 0; tentativa < 4; tentativa++) {
        var w = medir(it.w, size) + 22, h = size * 1.06 + 8, ok = false, x = 0, y = 0;
        for (var k = 0; k < 900; k++) {
          var a = k * 0.32, r = 3.2 * Math.sqrt(k) * Math.sqrt(k) * 0.55;
          x = W / 2 + r * Math.cos(a) * 1.55 + (idx % 2 ? 1 : -1) * 2;
          y = H / 2 + r * Math.sin(a) * 0.82;
          if (x - w / 2 < 0 || x + w / 2 > W || y - h / 2 < 0 || y + h / 2 > H) continue;
          var bate = false;
          for (var j = 0; j < placed.length; j++) {
            var p = placed[j];
            if (Math.abs(p.x - x) * 2 < p.w + w && Math.abs(p.y - y) * 2 < p.h + h) { bate = true; break; }
          }
          if (!bate) { ok = true; break; }
        }
        if (ok) { placed.push({ x: x, y: y, w: w, h: h }); out.push({ w: it.w, n: it.n, x: x, y: y, size: size }); return; }
        size = Math.round(size * 0.78);
      }
    });
    return out;
  }
  T.nuvem = {
    nome: "Nuvem de palavras", icone: "☁", desc: "Escrevem palavras curtas. As mais repetidas crescem.", interativo: true, sup: "escuro",
    novo: function () { return { tipo: "nuvem", pergunta: "", maxPalavras: 3 }; },
    texto: function (s) { return s.pergunta; },
    editor: function (s, mudar) {
      return [E.pergunta(s, mudar, "Pergunta", "Ex.: Numa palavra, o que é para ti trabalhar em equipa?"),
        E.select("Palavras por pessoa", s, "maxPalavras", [[1, "1 palavra"], [2, "Até 2 palavras"], [3, "Até 3 palavras"]], mudar, { numero: true }),
        el("p", { class: "ajuda" }, "As palavras impróprias ficam escondidas automaticamente. No ecrã, clica numa palavra para a esconder.")];
    },
    exemplo: function (s, rnd) {
      var b = ["comunicação", "confiança", "respeito", "ajuda", "partilha", "objetivo", "escutar", "união", "paciência", "diálogo", "apoio", "liderança", "humor", "compromisso", "empatia"];
      var p = b.map(function (_, i) { return 1 / (1 + i * 0.45); });
      var n = 1 + Math.floor(rnd() * (Number(s.maxPalavras) || 1)), l = [];
      for (var i = 0; i < n; i++) { var w = b[sortear(p, rnd)]; if (l.indexOf(w) < 0) l.push(w); }
      return l.join("|");
    },
    ecra: function (s, ctx) {
      var t = ctx.tema, area = el("div", { class: "nuvem" + (ctx.ocultar ? " mod" : "") }), vazio = el("div", { class: "vazio" }, "As palavras aparecem aqui");
      area.appendChild(vazio);
      var nos = {}, ultimo = "";
      var info = el("span", null, "");
      var sec = P.secao("escuro", s, ctx, [P.cabeca(s, s.pergunta, ctx, true), area,
        ctx.ocultar ? el("p", { class: "dica-mod", style: { position: "absolute", left: "80px", bottom: "62px" } }, "Clica numa palavra para a esconder.") : null], true);
      var dadosAtuais = null;
      function desenhar() {
        if (!dadosAtuais) return;
        var W = 1440, H = area.clientHeight || 560;
        var pd = palavrasDe(dadosAtuais.r, dadosAtuais.ocultos);
        var assin = JSON.stringify(pd.lista.map(function (x) { return x.w + x.n; })) + H;
        if (assin === ultimo) return pd.pessoas;
        ultimo = assin;
        var pos = layoutNuvem(pd.lista, W, H), vivos = {};
        vazio.style.display = pos.length ? "none" : "";
        pos.forEach(function (p, i) {
          var no = nos[p.w];
          if (!no) {
            no = el("span", { class: "w", title: ctx.ocultar ? "Clicar para esconder" : null, style: { left: (W / 2) + "px", top: (H / 2) + "px", fontSize: "10px", opacity: "0" } }, p.w);
            if (ctx.ocultar) no.onclick = function () { ctx.ocultar(B.chave(p.w)); };
            area.appendChild(no); nos[p.w] = no;
            no.getBoundingClientRect();
          }
          no.style.color = i === 0 ? t.acento : B.cor(t, i);
          no.style.left = p.x + "px"; no.style.top = p.y + "px"; no.style.fontSize = p.size + "px"; no.style.opacity = "1";
          vivos[p.w] = true;
        });
        for (var w in nos) if (!vivos[w]) { nos[w].remove(); delete nos[w]; }
        return pd.pessoas;
      }
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ultimo = ""; desenhar(); });
      return { el: sec, upd: function (d) { dadosAtuais = d; var n = desenhar(); requestAnimationFrame(function () { if (!area.clientHeight) return; desenhar(); }); return n || palavrasDe(d.r).pessoas; }, info: info };
    },
    telemovel: function (s, ctx) {
      var n = Number(s.maxPalavras) || 1, meu = valorDe(ctx.meu());
      var kids = [M.cab(s, s.pergunta)];
      if (typeof meu === "string" && !ctx.aEditar) {
        kids.push(el("div", { class: "ph-chips" }, meu.split("|").map(function (w) { return el("span", null, w); })));
        kids.push(M.estado(ctx.livre ? "✓ Enviado." : "✓ Enviado. Olha para o ecrã.", true));
        kids.push(el("button", { class: "ph-bt sec", type: "button", onclick: function () { ctx.editar(true); } }, "Mudar as minhas palavras"));
        return kids;
      }
      var atuais = typeof meu === "string" ? meu.split("|") : [];
      var inps = [];
      for (var i = 0; i < n; i++) {
        var inp = el("input", { class: "ph-inp", type: "text", maxlength: 30, autocomplete: "off", autocapitalize: "none", enterkeyhint: i === n - 1 ? "send" : "next",
          placeholder: n === 1 ? "A tua palavra" : "Palavra " + (i + 1), value: atuais[i] || "" });
        inps.push(inp);
      }
      var erro = el("p", { class: "ph-erro" });
      var form = el("form", { class: "ph-form", onsubmit: function (ev) {
        ev.preventDefault();
        var l = [];
        inps.forEach(function (x) { var w = B.normalizarPalavra(x.value); if (w && l.indexOf(w) < 0) l.push(w); });
        if (!l.length) { erro.textContent = "Escreve pelo menos uma palavra."; return; }
        ctx.editar(false);
        ctx.enviar(l.join("|"));
      } }, inps, erro, el("button", { class: "ph-bt", type: "submit" }, "Enviar"));
      kids.push(form);
      kids.push(M.estado(n === 1 ? "Uma palavra (ou duas, curtas)." : "Até " + n + " palavras, uma em cada caixa."));
      return kids;
    },
    csv: function (s, v) { var x = valorDe(v); return typeof x === "string" ? x.split("|").join(", ") : ""; }
  };

  /* ---------- Resposta aberta ---------- */
  T.aberta = {
    nome: "Resposta aberta", icone: "¶", desc: "Escrevem frases. Aparecem como notas no ecrã.", interativo: true, sup: "claro",
    novo: function () { return { tipo: "aberta", pergunta: "", limite: 140, porPessoa: 1 }; },
    texto: function (s) { return s.pergunta; },
    editor: function (s, mudar) {
      return [E.pergunta(s, mudar),
        E.select("Tamanho máximo", s, "limite", [[60, "Curta (60 caracteres)"], [140, "Média (140 caracteres)"], [250, "Longa (250 caracteres)"]], mudar, { numero: true }),
        E.select("Respostas por pessoa", s, "porPessoa", [[1, "1"], [2, "Até 2"], [3, "Até 3"]], mudar, { numero: true }),
        el("p", { class: "ajuda" }, "Respostas com palavrões ficam escondidas automaticamente. No ecrã, clica numa nota para a esconder.")];
    },
    exemplo: function (s, rnd, i) {
      var f = ["Ouvir antes de responder.", "Pedir ajuda quando não sei.", "Chegar a horas, sempre.", "Explicar com exemplos do dia a dia.", "Aceitar que o plano muda.",
        "Perguntar «para que serve?» antes de começar.", "Dar feedback com respeito.", "Partilhar o que aprendi com a equipa.", "Manter a calma quando corre mal.", "Assumir os meus erros."];
      return i < 10 ? { v: f[i % f.length], t: 1000 + i } : null;
    },
    ecra: function (s, ctx) {
      var t = ctx.tema, mural = el("div", { class: "mural" + (ctx.ocultar ? " mod" : "") }), vazio = el("div", { class: "vazio" }, "As respostas aparecem aqui");
      var mais = el("span", { class: "mais" });
      var sec = P.secao("claro", s, ctx, [P.cabeca(s, s.pergunta, ctx, true), mural, vazio, mais], true);
      var nos = {};
      return {
        el: sec, upd: function (d) {
          var l = abertasDe(d.r, d.ocultos), limite = 24;
          vazio.style.display = l.length ? "none" : "";
          var vis = l.slice(0, limite), vivos = {};
          var frag = [];
          vis.forEach(function (x, i) {
            var no = nos[x.k];
            if (!no) {
              no = el("div", { class: "nota", style: { "--c": B.cor(t, Object.keys(nos).length) } }, x.txt);
              if (ctx.ocultar) no.onclick = function () { ctx.ocultar(B.chave(x.k)); };
              nos[x.k] = no;
            } else if (no.textContent !== x.txt) no.textContent = x.txt;
            vivos[x.k] = true; frag.push(no);
          });
          for (var k in nos) if (!vivos[k]) { nos[k].remove(); delete nos[k]; }
          frag.forEach(function (no) { mural.appendChild(no); });
          mais.textContent = l.length > limite ? "+ " + (l.length - limite) + " respostas" : "";
          return l.length;
        }
      };
    },
    telemovel: function (s, ctx) {
      var por = Number(s.porPessoa) || 1, lim = Number(s.limite) || 140;
      var enviadas = [];
      for (var i = 1; i <= por; i++) { var v = valorDe(ctx.meu(i === 1 ? "" : String(i))); if (typeof v === "string" && v) enviadas.push(v); }
      var kids = [M.cab(s, s.pergunta)];
      if (enviadas.length) kids.push(el("div", { class: "ph-enviadas" }, enviadas.map(function (x) { return el("p", null, x); })));
      if (enviadas.length >= por && !ctx.aEditar) {
        kids.push(M.estado(ctx.livre ? "✓ Enviado." : "✓ Enviado. Olha para o ecrã.", true));
        return kids;
      }
      if (enviadas.length && !ctx.aEditar) {
        kids.push(M.estado("✓ Enviado.", true));
        kids.push(el("button", { class: "ph-bt sec", type: "button", onclick: function () { ctx.editar(true); } }, "Enviar outra resposta"));
        return kids;
      }
      var cont = el("span", { class: "ph-cont" }, "0 / " + lim);
      var ta = el("textarea", { class: "ph-inp", rows: 4, maxlength: lim, placeholder: "Escreve aqui…", oninput: function () { cont.textContent = ta.value.length + " / " + lim; } });
      var erro = el("p", { class: "ph-erro" });
      kids.push(el("form", { class: "ph-form", onsubmit: function (ev) {
        ev.preventDefault();
        var txt = ta.value.trim();
        if (!txt) { erro.textContent = "Escreve alguma coisa primeiro."; return; }
        var suf = enviadas.length === 0 ? "" : String(enviadas.length + 1);
        ta.value = "";
        ctx.editar(false);
        ctx.enviar({ v: txt.slice(0, lim), t: { ".sv": "timestamp" } }, suf);
      } }, ta, el("div", { class: "ph-linha" }, cont, erro), el("button", { class: "ph-bt", type: "submit" }, "Enviar")));
      return kids;
    },
    csv: function (s, v) { var x = valorDe(v); return typeof x === "string" ? x : ""; }
  };

  /* ---------- Escala ---------- */
  T.escala = {
    nome: "Escala", icone: "1·5", desc: "Dão uma nota (ex.: 1 a 5) a uma ou mais afirmações.", interativo: true, sup: "claro",
    novo: function () { return { tipo: "escala", pergunta: "", afirmacoes: [""], min: 1, max: 5, rotMin: "Discordo totalmente", rotMax: "Concordo totalmente", esconder: false, comparar: "", rotuloA: "Antes", rotuloB: "Agora", frase: "" }; },
    texto: function (s) { return s.pergunta; },
    editor: function (s, mudar, redesenhar, ctx) {
      var outras = [["", "Não comparar"]];
      (ctx.atividade.slides || []).some(function (x, i) {
        if (x.id === s.id) return true;
        if (x.tipo === "escala") outras.push([x.id, (i + 1) + ". " + (x.pergunta || "Escala sem pergunta").slice(0, 50)]);
        return false;
      });
      var kids = [E.pergunta(s, mudar),
        E.lista("Afirmações", s.afirmacoes, mudar, redesenhar, { min: 1, max: 8, placeholder: "Afirmação", textoMais: "Adicionar afirmação",
          ajuda: "Com uma só afirmação, podes deixá-la vazia e usar só a pergunta." }),
        el("div", { class: "campo-par" },
          E.select("De", s, "min", [[0, "0"], [1, "1"]], mudar, { numero: true }),
          E.select("Até", s, "max", [[3, "3"], [4, "4"], [5, "5"], [6, "6"], [7, "7"], [10, "10"]], mudar, { numero: true })),
        el("div", { class: "campo-par" },
          E.texto("Rótulo do mínimo", s, "rotMin", mudar, { max: 40 }),
          E.texto("Rótulo do máximo", s, "rotMax", mudar, { max: 40 })),
        E.inter("Esconder os resultados até eu os mostrar", s, "esconder", mudar),
        E.select("Comparar com uma escala anterior", s, "comparar", outras, mudar, { depois: redesenhar, ajuda: "Mostra as duas médias lado a lado (ex.: início vs. fim da sessão)." })];
      if (s.comparar) kids.push(
        el("div", { class: "campo-par" }, E.texto("Rótulo da anterior", s, "rotuloA", mudar, { max: 40 }), E.texto("Rótulo desta", s, "rotuloB", mudar, { max: 40 })),
        E.texto("Frase final", s, "frase", mudar, { linhas: 2, max: 160, placeholder: "Ex.: A diferença é o trabalho desta semana." }));
      return kids;
    },
    exemplo: function (s, rnd) {
      var n = s.afirmacoes.length, min = Number(s.min), max = Number(s.max), l = [];
      for (var i = 0; i < n; i++) {
        var p = []; for (var v = min; v <= max; v++) p.push(0.4 + (v - min) * (i % 2 ? 0.3 : 0.9) + rnd());
        l.push(min + sortear(p, rnd));
      }
      return l.join(",");
    },
    ecra: function (s, ctx) {
      var t = ctx.tema, min = Number(s.min), max = Number(s.max), af = s.afirmacoes;
      if (s.comparar) {
        var na = el("div", { class: "num" }, "–"), nb = el("div", { class: "num" }, "–"), da = el("p", { class: "de" }), dbb = el("p", { class: "de" });
        var seta = el("div", { class: "seta", html: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M8 50h72M52 20l30 30-30 30" fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/></svg>' });
        seta.style.color = "var(--kicker)";
        var sec0 = P.secao("destaque", s, ctx, [
          s.etiqueta ? el("p", { class: "kicker" }, s.etiqueta) : null,
          el("div", { class: "comp" },
            el("div", { class: "a" }, el("p", { class: "kicker" }, s.rotuloA || "Antes"), na, da), seta,
            el("div", { class: "b" }, el("p", { class: "kicker" }, s.rotuloB || "Agora"), nb, dbb)),
          el("p", { class: "comp-frase" }, s.frase || "")], false);
        return {
          el: sec0, upd: function (d) {
            var outra = (ctx.atividade.slides || []).filter(function (x) { return x.id === s.comparar; })[0];
            var ea = outra ? estatEscala((d.todas || {})[s.comparar], outra)[0] : { m: null, t: 0 };
            var eb = estatEscala(d.r, s)[0];
            na.textContent = ea.m === null ? "–" : B.virgula(ea.m);
            nb.textContent = eb.m === null ? "–" : B.virgula(eb.m);
            da.textContent = (outra ? "de " + outra.max + " · " : "") + ea.t + " respostas";
            dbb.textContent = "de " + max + " · " + eb.t + " respostas";
            return eb.t;
          }
        };
      }
      if (af.length <= 1) {
        var rot = []; for (var v = min; v <= max; v++) rot.push(String(v));
        var corEscala = B.claro(t.destaque) ? t.acento : t.destaque;
        var cores = rot.map(function () { return corEscala; });
        var g = colunas(rot, cores, { numeros: true });
        var mb = el("b", null, "–"), ms = el("small", null, "");
        var media = el("div", { class: "media" }, el("p", { class: "kicker" }, "Média"), mb, el("span", null, "de " + max), ms);
        var wrap = el("div", { class: "escala-wrap" }, el("div", { style: { display: "flex", flexDirection: "column", minHeight: "0" } }, g.el,
          el("div", { class: "extremos" }, el("span", null, s.rotMin || ""), el("span", null, s.rotMax || ""))), media);
        var titulo = af[0] && af[0].trim() ? (s.pergunta ? s.pergunta + " " : "") + "«" + af[0] + "»" : s.pergunta;
        var sec1 = P.secao("claro", s, ctx, [P.cabeca(s, titulo, ctx, true), wrap], true);
        return {
          el: sec1, upd: function (d) {
            var e = estatEscala(d.r, s)[0];
            g.upd(e.dist, e.t, d.oculto, function (n) { return String(n); });
            mb.textContent = e.m === null ? "–" : B.virgula(e.m);
            ms.textContent = e.t + (e.t === 1 ? " resposta" : " respostas");
            wrap.classList.toggle("oculto", !!d.oculto);
            return e.t;
          }
        };
      }
      var box = el("div", { class: "afirmacoes" + (af.length >= 5 ? " muitas" : "") });
      var linhas = af.map(function (a, i) {
        var tr = el("div", { class: "af-tr" }, el("span", { class: "linha-base" }));
        for (var v = min; v <= max; v++) tr.appendChild(el("span", { class: "tick", style: { left: ((v - min) / (max - min)) * 100 + "%" } }, el("span", null, String(v))));
        var marca = el("span", { class: "marca", style: { left: "50%", "--c": B.cor(t, i) } });
        tr.appendChild(marca);
        var vv = el("span", { class: "af-v" }, "–");
        box.appendChild(el("div", { class: "af" }, el("div", { class: "af-txt" }, a || "Afirmação " + (i + 1)), tr, vv));
        return { marca: marca, vv: vv };
      });
      box.appendChild(aviso());
      var sec2 = P.secao("claro", s, ctx, [P.cabeca(s, s.pergunta, ctx, true), el("div", { class: "af-wrap" }, box,
        el("div", { class: "extremos", style: { paddingLeft: "550px", paddingRight: "140px" } }, el("span", null, min + " · " + (s.rotMin || "")), el("span", null, (s.rotMax || "") + " · " + max)))], true);
      return {
        el: sec2, upd: function (d) {
          var e = estatEscala(d.r, s), tot = 0;
          e.forEach(function (x, i) {
            tot = Math.max(tot, x.t);
            linhas[i].marca.style.left = (x.m === null ? 50 : ((x.m - min) / (max - min)) * 100) + "%";
            linhas[i].marca.style.opacity = x.m === null ? "0.25" : "1";
            linhas[i].vv.textContent = x.m === null ? "–" : B.virgula(x.m);
          });
          box.classList.toggle("oculto", !!d.oculto);
          return tot;
        }
      };
    },
    telemovel: function (s, ctx) {
      var min = Number(s.min), max = Number(s.max), af = s.afirmacoes, n = Math.max(1, af.length);
      var atual = lerEscala(ctx.meu(), n);
      while (atual.length < n) atual.push(null);
      var kids = [M.cab(s, s.pergunta)];
      af.forEach(function (a, i) {
        var linha = el("div", { class: "ph-escala" });
        if (a && a.trim()) linha.appendChild(el("p", { class: "ph-af" }, a));
        var nums = el("div", { class: "ph-nums", style: { gridTemplateColumns: "repeat(" + Math.min(max - min + 1, 6) + ",1fr)" } });
        for (var v = min; v <= max; v++) (function (v) {
          nums.appendChild(el("button", { type: "button", class: "ph-num", "aria-pressed": atual[i] === v ? "true" : "false", onclick: function () {
            atual[i] = v;
            ctx.enviar(atual.map(function (x) { return x === null || x === undefined ? "" : String(x); }).join(","));
          } }, String(v)));
        })(v);
        linha.appendChild(nums);
        if (i === 0 || n > 1) linha.appendChild(el("div", { class: "ph-extremos" }, el("span", null, s.rotMin || ""), el("span", null, s.rotMax || "")));
        kids.push(linha);
      });
      var feitas = atual.filter(function (x) { return x !== null && x !== undefined; }).length;
      kids.push(feitas === n ? M.estado(ctx.livre ? "✓ Registado. Podes mudar até concluíres." : "✓ Registado. Podes mudar enquanto estiver no ecrã.", true) : feitas ? M.estado("Faltam " + (n - feitas) + ".") : M.estado("Toca num número."));
      return kids;
    },
    csv: function (s, v) { return lerEscala(v, Math.max(1, s.afirmacoes.length)).map(function (x) { return x === null ? "–" : x; }).join(" | "); }
  };

  /* ---------- Ordenar ---------- */
  T.ordenar = {
    nome: "Ordenar", icone: "1·2·3", desc: "Põem os itens por ordem de preferência.", interativo: true, sup: "claro",
    novo: function () { return { tipo: "ordenar", pergunta: "", itens: ["", "", "", ""] }; },
    texto: function (s) { return s.pergunta; },
    editor: function (s, mudar, redesenhar) {
      return [E.pergunta(s, mudar, "Pergunta", "Ex.: O que é mais importante numa entrevista?"),
        E.lista("Itens", s.itens, mudar, redesenhar, { min: 2, max: 8, placeholder: "Item", textoMais: "Adicionar item" })];
    },
    exemplo: function (s, rnd) {
      var n = s.itens.length, l = []; for (var i = 0; i < n; i++) l.push(i);
      l.sort(function (a, b) { return (a * 0.6 + rnd() * n) - (b * 0.6 + rnd() * n); });
      return l.join(",");
    },
    ecra: function (s, ctx) {
      var t = ctx.tema, n = s.itens.length, h = Math.min(92, Math.floor(600 / n));
      var box = el("div", { class: "rank", style: { "--h": h + "px" } });
      var linhas = s.itens.map(function (it, i) {
        var fill = el("i"), pos = el("span", { class: "pos" }, ""), v = el("span", { class: "v" }, "");
        var row = el("div", { class: "rk", style: { "--c": B.cor(t, i), transform: "translateY(" + i * h + "px)" } }, pos, el("span", { class: "txt" }, it || "Item " + (i + 1)), el("span", { class: "tr" }, fill), v);
        box.appendChild(row);
        return { row: row, fill: fill, pos: pos, v: v };
      });
      var sec = P.secao("claro", s, ctx, [P.cabeca(s, s.pergunta, ctx, true), box], true);
      return {
        el: sec, upd: function (d) {
          var e = estatOrdem(d.r, n), max = Math.max.apply(null, e.itens.map(function (x) { return x.pts; }).concat([1]));
          var ordenados = e.itens.slice().sort(function (a, b) { return b.pts - a.pts || a.i - b.i; });
          ordenados.forEach(function (x, p) {
            var L = linhas[x.i];
            L.row.style.transform = "translateY(" + p * h + "px)";
            B.por(L.pos, ord(p + 1));
            L.fill.style.width = (x.pts / max) * 100 + "%";
            B.por(L.v, x.mediaPos === null ? "" : ["média ", ord(B.virgula(x.mediaPos))]);
          });
          return e.t;
        }
      };
    },
    telemovel: function (s, ctx) {
      var n = s.itens.length, ordem = lerOrdem(ctx.meu(), n);
      var escolha = ctx.rascunho || (ordem.length ? ordem.slice() : []);
      var kids = [M.cab(s, s.pergunta), el("p", { class: "ph-sub" }, "Toca nos itens pela ordem: primeiro o mais importante.")];
      var lista = el("div", { class: "ph-opcoes" });
      s.itens.forEach(function (it, i) {
        var p = escolha.indexOf(i);
        lista.appendChild(el("button", { type: "button", class: "ph-op ordem", "aria-pressed": p >= 0 ? "true" : "false", style: { "--c": B.cor(ctx.tema, i) }, onclick: function () {
          if (p >= 0) escolha = escolha.slice(0, p); else escolha = escolha.concat([i]);
          if (escolha.length === n) { ctx.rascunhar(null); ctx.enviar(escolha.join(",")); }
          else ctx.rascunhar(escolha);
        } }, el("span", { class: "ph-letra" + (p >= 0 ? " tem" : "") }, p >= 0 ? String(p + 1) : ""), el("span", { class: "ph-op-t" }, it || "Item " + (i + 1))));
      });
      kids.push(lista);
      if (escolha.length === n && ordem.length) kids.push(M.estado("✓ Ordem registada. Toca num item para refazer a partir dele.", true));
      else kids.push(M.estado(escolha.length ? "Faltam " + (n - escolha.length) + ". Toca num número para voltar atrás." : "Começa pelo mais importante."));
      return kids;
    },
    csv: function (s, v) { return lerOrdem(v, s.itens.length).map(function (i) { return s.itens[i]; }).join(" > "); }
  };

  /* ---------- Texto ---------- */
  function linhasTexto(txt) {
    var l = String(txt || "").split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean);
    var lista = l.length && l.every(function (x) { return /^[-•]\s*/.test(x); });
    return { lista: lista, l: l.map(function (x) { return x.replace(/^[-•]\s*/, ""); }) };
  }
  /* campo de imagem no editor (a imagem fica guardada à parte, na conta do formador) */
  function campoImagem(s, mudar, redesenhar, ctx) {
    if (!ctx.imagens) return null;
    var prev = el("div", { class: "img-prev" + (s.imagem ? "" : " vazia") }, s.imagem ? null : "Sem imagem");
    if (s.imagem) {
      var im = el("img", { alt: "" });
      prev.appendChild(im);
      ctx.imagens.url(s.imagem).then(function (u) { if (u) im.src = u; else BNA.por(prev, "Imagem indisponível"); });
    }
    var erro = el("p", { class: "erro" }), aCarregar = el("span", { class: "ajuda" });
    var bts = el("div", { class: "img-bts" },
      el("button", { type: "button", class: "bt peq", onclick: function () {
        erro.textContent = ""; aCarregar.textContent = "";
        ctx.imagens.escolher(function (id, falha) {
          if (falha) { erro.textContent = falha; aCarregar.textContent = ""; return; }
          if (id === null) { aCarregar.textContent = "A preparar a imagem…"; return; }
          s.imagem = id; mudar(); redesenhar();
        });
      } }, s.imagem ? "Trocar imagem" : "Escolher imagem…"),
      s.imagem ? el("button", { type: "button", class: "bt peq perigo", onclick: function () { delete s.imagem; mudar(); redesenhar(); } }, "Remover") : null,
      aCarregar);
    return [E.campo("Imagem (opcional)", el("div", { class: "campo-img" }, prev, bts, erro), "Aparece à direita no ecrã. As fotografias são reduzidas automaticamente. Os telemóveis mostram só o texto."),
      s.imagem ? E.select("Enquadramento", s, "imagemModo", [["cobrir", "Preencher o espaço (corta as margens)"], ["conter", "Mostrar a imagem inteira"]], mudar) : null];
  }
  T.texto = {
    nome: "Texto", icone: "Aa", desc: "Título, texto e imagem, para instruções e transições.", interativo: false, sup: "destaque",
    novo: function () { return { tipo: "texto", titulo: "", texto: "", tamanho: "normal", telemovel: true }; },
    texto: function (s) { return s.titulo; },
    editor: function (s, mudar, redesenhar, ctx) {
      return [E.texto("Título", s, "titulo", mudar, { linhas: 2, max: 140, placeholder: "Ex.: Telemóvel no bolso." }),
        E.texto("Texto", s, "texto", mudar, { linhas: 5, max: 600, ajuda: "Para fazer uma lista, começa cada linha com - . Para pôr um título em cada item, separa com | (ex.: - Escuta | Ouve antes de responder)." }),
        campoImagem(s, mudar, redesenhar, ctx || {}),
        E.select("Tamanho do título", s, "tamanho", [["normal", "Normal"], ["gigante", "Gigante"]], mudar),
        E.inter("Mostrar também no telemóvel", s, "telemovel", mudar, "Útil para instruções ou tarefas que os alunos devem guardar.")];
    },
    ecra: function (s, ctx) {
      var lt = linhasTexto(s.texto), corpo = null, comImagem = !!(s.imagem && ctx.imagem);
      if (lt.lista) {
        corpo = el("ul", { style: { "--cols": String(comImagem ? 1 : lt.l.length <= 3 ? lt.l.length : 2) } }, lt.l.map(function (x, i) {
          var p = x.split("|");
          return el("li", null, p.length > 1 ? el("b", null, p[0].trim()) : el("b", null, String(i + 1).padStart(2, "0")), p.length > 1 ? p.slice(1).join("|").trim() : x);
        }));
      } else if (lt.l.length) corpo = el("p", { class: "corpo" }, lt.l.join("\n"));
      var bloco = el("div", { class: "conteudo" + (s.tamanho === "gigante" ? " gigante" : "") },
        s.etiqueta ? el("p", { class: "kicker" }, s.etiqueta) : null,
        el("h1", { class: "tit" }, s.titulo || "Título"), corpo);
      if (comImagem) {
        var im = el("img", { alt: "" }), caixa = el("div", { class: "img-box" + (s.imagemModo === "conter" ? " conter" : "") }, im);
        ctx.imagem(s.imagem).then(function (u) { if (u) im.src = u; else caixa.classList.add("falhou"); });
        bloco = el("div", { class: "conteudo-img" }, bloco, caixa);
      }
      var sec = P.secao("destaque", s, ctx, [bloco], false);
      return { el: sec, upd: function () { return 0; } };
    },
    telemovel: function (s) {
      if (s.telemovel === false) return [M.olha()];
      var lt = linhasTexto(s.texto);
      var kids = [M.cab(s, s.titulo)];
      if (lt.lista) kids.push(el("ol", { class: "ph-lista" }, lt.l.map(function (x, i) {
        var p = x.split("|");
        return el("li", null, el("span", { class: "num" }, String(i + 1).padStart(2, "0")), el("div", null,
          p.length > 1 ? [el("b", null, p[0].trim()), el("span", null, p.slice(1).join("|").trim())] : el("b", null, x)));
      })));
      else if (lt.l.length) kids.push(el("p", { class: "ph-sub", style: { whiteSpace: "pre-line" } }, lt.l.join("\n")));
      return kids;
    }
  };

  /* ---------- Roleta ---------- */
  T.roleta = {
    nome: "Roleta", icone: "↻", desc: "Sorteia um tema, uma pergunta ou uma pessoa.", interativo: false, sup: "escuro",
    novo: function () { return { tipo: "roleta", titulo: "", texto: "", segmentos: [{ t: "", d: "" }, { t: "", d: "" }, { t: "", d: "" }, { t: "", d: "" }], tempo: 30, naoRepetir: true }; },
    texto: function (s) { return s.titulo || "Roleta"; },
    editor: function (s, mudar, redesenhar, ctx) {
      return [E.texto("Título", s, "titulo", mudar, { max: 120, placeholder: "Ex.: Conta-me uma vez em que…" }),
        E.texto("Instruções", s, "texto", mudar, { linhas: 2, max: 240, placeholder: "Ex.: Em pares. Um pergunta, o outro responde em 30 segundos." }),
        E.lista("Segmentos da roleta", s.segmentos, mudar, redesenhar, {
          min: 2, max: 12, textoMais: "Adicionar segmento", novo: function () { return { t: "", d: "" }; },
          cor: function (i) { return B.cor(ctx.tema, i); },
          campos: function (seg) {
            var a = el("input", { class: "inp", type: "text", maxlength: 90, value: seg.t || "", placeholder: "Texto (ex.: …tiveste de mudar de plano)", oninput: function () { seg.t = a.value; mudar(); } });
            var b = el("input", { class: "inp fino", type: "text", maxlength: 60, value: seg.d || "", placeholder: "Etiqueta opcional (ex.: Adaptabilidade)", oninput: function () { seg.d = b.value; mudar(); } });
            return [a, b];
          }
        }),
        E.select("Temporizador depois de sortear", s, "tempo", [[0, "Sem temporizador"], [15, "15 segundos"], [30, "30 segundos"], [45, "45 segundos"], [60, "1 minuto"], [90, "1 minuto e meio"], [120, "2 minutos"]], mudar, { numero: true }),
        E.inter("Não repetir até saírem todos", s, "naoRepetir", mudar)];
    },
    ecra: function (s, ctx) {
      var t = ctx.tema, segs = s.segmentos, n = segs.length;
      var curtos = segs.every(function (x) { return (x.t || "").length <= 12; });
      var cx = 320, r = 308, g = "";
      segs.forEach(function (sg, i) {
        var c = B.cor(t, i);
        var a0 = (i * 360 / n) * Math.PI / 180, a1 = ((i + 1) * 360 / n) * Math.PI / 180;
        var x0 = cx + r * Math.sin(a0), y0 = cx - r * Math.cos(a0), x1 = cx + r * Math.sin(a1), y1 = cx - r * Math.cos(a1);
        g += '<path d="M' + cx + "," + cx + " L" + x0.toFixed(2) + "," + y0.toFixed(2) + " A" + r + "," + r + " 0 " + (n === 1 ? 1 : 0) + " 1 " + x1.toFixed(2) + "," + y1.toFixed(2) + ' Z" fill="' + c + '" stroke="' + t.escuro + '" stroke-width="5"/>';
        var am = (i + 0.5) * 360 / n, ar = am * Math.PI / 180, tr = r * (curtos ? 0.62 : 0.7);
        var tx = cx + tr * Math.sin(ar), ty = cx - tr * Math.cos(ar);
        var rotulo = curtos && sg.t ? B.esc(sg.t) : String(i + 1);
        var fs = curtos && sg.t ? Math.max(22, Math.min(46, 300 / Math.max(4, rotulo.length) * (n <= 6 ? 1 : 0.8))) : (n <= 6 ? 110 : n <= 9 ? 80 : 60);
        g += '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" transform="rotate(' + (curtos && sg.t ? (am > 180 ? am + 90 : am - 90) : am) + " " + tx.toFixed(1) + " " + ty.toFixed(1) + ')" text-anchor="middle" dominant-baseline="central" font-family="Anton, Impact, sans-serif" font-size="' + fs + '" fill="' + B.tintaSobre(c, t) + '">' + rotulo + "</text>";
      });
      var roda = el("div", { class: "roda" }, el("div", { class: "ponteiro" }));
      roda.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 640 640" aria-hidden="true"><circle cx="320" cy="320" r="316" fill="' + t.escuro + '"/><g class="giro">' + g + "</g></svg>");
      var botao = el("button", { type: "button", onclick: function () { api.acao("rodar"); } }, "Rodar");
      if (!ctx.aoRodar) botao.disabled = true;
      roda.appendChild(botao);
      var res = el("div");
      var sec = P.secao("escuro", s, ctx, [el("div", { class: "roleta" }, roda, el("div", { class: "lado" },
        s.etiqueta ? el("p", { class: "kicker" }, s.etiqueta) : null, el("h1", { class: "tit" }, s.titulo || "Roleta"), res))], false);
      var giro = roda.querySelector(".giro");
      var rot = 0, girando = false, ultimoR = null;
      function mostrar(ri) {
        BNA.por(res);
        botao.textContent = girando ? "…" : ri !== null && ri >= 0 ? "De novo" : "Rodar";
        botao.disabled = girando || !ctx.aoRodar;
        if (girando) return;
        if (ri !== null && ri >= 0 && segs[ri]) {
          var c = B.cor(t, ri);
          res.appendChild(el("div", { class: "cartao", style: { "--c": c, "--ct": B.tintaSobre(c, t) } },
            el("div", { class: "n" }, "#" + (ri + 1) + (segs[ri].d ? " · " + segs[ri].d : "")), el("div", { class: "p" }, segs[ri].t || "Segmento " + (ri + 1))));
          if (Number(s.tempo) && ctx.aoRodar) res.appendChild(el("p", { class: "dica-t" }, el("kbd", null, "T"), " começa o temporizador de " + B.duracao(Number(s.tempo)) + "."));
        } else if (s.texto) res.appendChild(el("p", { class: "txt" }, s.texto));
      }
      function angulo(ri) { var f = 360 / n; return -(ri * f + f / 2); }
      var api = {
        el: sec,
        upd: function (d) {
          var ro = d.estado && d.estado.rol, ri = ro && typeof ro.r === "number" ? ro.r : null;
          if (girando) return 0;
          if (ri !== ultimoR) {
            ultimoR = ri;
            if (ri !== null && ri >= 0) {
              giro.classList.add("sem-trans");
              rot = angulo(ri);
              giro.style.transform = "rotate(" + rot + "deg)";
              giro.getBoundingClientRect();
              giro.classList.remove("sem-trans");
            }
            mostrar(ri);
          }
          return 0;
        },
        acao: function (nome, d) {
          if (nome !== "rodar" || girando || !ctx.aoRodar) return;
          var ro = (d && d.estado && d.estado.rol) || (ctx.estadoRoleta && ctx.estadoRoleta()) || {};
          var usados = (ro.u || []).slice(), disp = [];
          for (var i = 0; i < n; i++) if (!s.naoRepetir || usados.indexOf(i) < 0) disp.push(i);
          if (!disp.length) { usados = []; for (var j = 0; j < n; j++) disp.push(j); }
          if (disp.length > 1 && typeof ro.r === "number" && ro.r >= 0) {
            var semUltimo = disp.filter(function (x) { return x !== ro.r; });
            if (semUltimo.length) disp = semUltimo;
          }
          var esc = disp[Math.floor(Math.random() * disp.length)];
          var f = 360 / n, jit = (Math.random() - 0.5) * f * 0.6;
          var alvo = (((angulo(esc) - jit) - (rot % 360)) % 360 + 360) % 360;
          rot += 360 * 5 + alvo;
          girando = true;
          mostrar(null);
          ctx.aoRodar({ g: (ro.g || 0) + 1, r: -1, u: usados });
          giro.style.transform = "rotate(" + rot + "deg)";
          setTimeout(function () {
            girando = false;
            ultimoR = esc;
            usados.push(esc);
            ctx.aoRodar({ g: (ro.g || 0) + 1, r: esc, u: usados });
            mostrar(esc);
          }, 4750);
        },
        temResultado: function () { return ultimoR !== null && ultimoR >= 0 && !girando; },
        aGirar: function () { return girando; }
      };
      return api;
    },
    telemovel: function (s, ctx) {
      var ro = ctx.estado && ctx.estado.rol;
      var kids = [];
      if (ro && typeof ro.r === "number" && ro.r >= 0 && s.segmentos[ro.r]) {
        var sg = s.segmentos[ro.r], c = B.cor(ctx.tema, ro.r);
        kids.push(M.cab(s, s.titulo));
        kids.push(el("div", { class: "ph-cartao", style: { "--c": c, color: B.tintaSobre(c, ctx.tema) } },
          el("div", { class: "n" }, "#" + (ro.r + 1) + (sg.d ? " · " + sg.d : "")), el("div", { class: "p" }, sg.t)));
        if (s.texto) kids.push(el("p", { class: "ph-sub" }, s.texto));
      } else if (ro && ro.r === -1) kids.push(M.grande("A roleta está a <em>girar…</em>", "Olha para o ecrã."));
      else kids.push(M.grande(B.esc(s.titulo || "Roleta"), s.texto || "Olha para o ecrã."));
      return kids;
    }
  };

  /* ---------- Classificação ---------- */
  T.classificacao = {
    nome: "Classificação", icone: "🏆", desc: "Pódio com os pontos dos quizzes até aqui.", interativo: false, sup: "destaque",
    novo: function () { return { tipo: "classificacao", titulo: "Classificação", quantos: 10 }; },
    texto: function (s) { return s.titulo || "Classificação"; },
    editor: function (s, mudar) {
      return [E.texto("Título", s, "titulo", mudar, { max: 80 }),
        E.select("Quantos lugares mostrar", s, "quantos", [[3, "3"], [5, "5"], [8, "8"], [10, "10"]], mudar, { numero: true }),
        el("p", { class: "ajuda" }, "Para aparecerem nomes, ativa «Pedir alcunha» nas definições da atividade. Só contam os quizzes com pontos já revelados.")];
    },
    ecra: function (s, ctx) {
      var q = Number(s.quantos) || 10, h = Math.min(86, Math.floor(620 / q));
      var box = el("div", { class: "podio", style: { "--h": h + "px" } }), vazio = el("div", { class: "vazio" }, "Ainda não há pontos. Faz um quiz primeiro.");
      box.appendChild(vazio);
      var nos = {};
      var sec = P.secao("destaque", s, ctx, [el("div", { class: "cabeca" }, s.etiqueta ? el("p", { class: "kicker" }, s.etiqueta) : null, el("h1", { class: "tit", style: { fontSize: "96px" } }, s.titulo || "Classificação")), box], false);
      return {
        el: sec, upd: function (d) {
          var pl = (d.placar || []).slice(0, q), max = pl.length ? pl[0].total || 1 : 1, vivos = {};
          vazio.style.display = pl.length ? "none" : "";
          pl.forEach(function (x, i) {
            var no = nos[x.pid];
            if (!no) {
              no = { fill: el("i"), pos: el("span", { class: "pos" }), nm: el("span", { class: "nm" }), v: el("span", { class: "v" }) };
              no.row = el("div", { class: "pd", style: { transform: "translateY(" + q * h + "px)" } }, no.pos, no.nm, el("span", { class: "tr" }, no.fill), no.v);
              box.appendChild(no.row); nos[x.pid] = no;
              no.row.getBoundingClientRect();
            }
            no.row.style.transform = "translateY(" + i * h + "px)";
            no.row.classList.toggle("top", x.pos <= 3);
            B.por(no.pos, ord(x.pos));
            no.nm.textContent = x.nome;
            no.fill.style.width = (x.total / max) * 100 + "%";
            no.v.textContent = B.milhares(x.total);
            vivos[x.pid] = true;
          });
          for (var k in nos) if (!vivos[k]) { nos[k].row.remove(); delete nos[k]; }
          return 0;
        }
      };
    },
    telemovel: function (s, ctx) {
      var p = ctx.pontos;
      if (!p || !p[2] || !p[1]) return [M.grande(B.esc(s.titulo || "Classificação"), p ? "Ainda não tens pontos. Olha para o ecrã." : "Olha para o ecrã.")];
      return [el("div", { class: "ph-grande" },
        el("p", { class: "ph-kicker" }, s.titulo || "Classificação"),
        el("h1", { html: "Estás em <em>" + B.ordHtml(p[2]) + "</em> lugar" }),
        el("p", null, B.milhares(p[1]) + " pontos" + (ctx.estado.np ? " · " + ctx.estado.np + " em jogo" : "")))];
    }
  };

  /* ---------- Perguntas da sala ---------- */
  function perguntasDe(r, gostos, ocultos, respondidas) {
    var cont = {};
    for (var p in gostos || {}) {
      var v = valorDe(gostos[p]);
      if (typeof v !== "string") continue;
      v.split(",").forEach(function (k) { if (k && k.indexOf(p + "-") !== 0) cont[k] = (cont[k] || 0) + 1; });
    }
    var l = [];
    for (var k in r || {}) {
      var a = r[k], txt = valorDe(a);
      if (typeof txt !== "string" || !txt.trim()) continue;
      if (ocultos && ocultos[B.chave(k)]) continue;
      if (B.improprio(txt)) continue;
      l.push({ k: k, txt: txt.trim(), t: (a && a.t) || 0, n: cont[k] || 0, r: !!(respondidas && respondidas[B.chave(k)]) });
    }
    l.sort(function (a, b) { return (a.r - b.r) || (b.n - a.n) || (a.t - b.t); });
    return l;
  }
  B.perguntasDe = perguntasDe;
  T.perguntas = {
    nome: "Perguntas da sala", icone: "?", desc: "Enviam perguntas anónimas e apoiam as dos colegas com ♥.", interativo: true, sup: "escuro",
    novo: function () { return { tipo: "perguntas", titulo: "Perguntas?", texto: "Escreve a tua pergunta. Ninguém sabe quem perguntou.", apoiar: true, maxPorPessoa: 3 }; },
    texto: function (s) { return s.titulo || "Perguntas da sala"; },
    editor: function (s, mudar) {
      return [E.texto("Título", s, "titulo", mudar, { max: 120, placeholder: "Ex.: O que querem saber?" }),
        E.texto("Instruções no telemóvel", s, "texto", mudar, { linhas: 2, max: 200 }),
        E.select("Perguntas por pessoa", s, "maxPorPessoa", [[1, "1"], [3, "Até 3"], [5, "Até 5"]], mudar, { numero: true }),
        E.inter("Os participantes veem as perguntas dos colegas e apoiam-nas com ♥", s, "apoiar", mudar, "As mais apoiadas sobem. No ecrã, clica numa pergunta para a marcar como respondida.")];
    },
    exemplo: function (s, rnd, i) {
      var f = ["Como mostro competências se nunca trabalhei?", "Vale a pena pôr o voluntariado no currículo?", "O que digo quando me perguntam um defeito?",
        "Que roupa devo levar a uma entrevista?", "As notas contam muito para as empresas?", "Posso falar de jogos online numa entrevista?",
        "Como peço uma carta de recomendação?", "E se ficar nervoso a meio da resposta?"];
      return i < f.length ? { v: f[i], t: 1000 + i * 37 } : null;
    },
    ecra: function (s, ctx) {
      var grelha = el("div", { class: "qa" + (ctx.responder ? " mod" : "") }), vazio = el("div", { class: "vazio" }, "As perguntas aparecem aqui. Ninguém sabe quem perguntou."), mais = el("span", { class: "mais" });
      var sec = P.secao("escuro", s, ctx, [P.cabeca(s, s.titulo || "Perguntas?", ctx, true), grelha, vazio, mais,
        ctx.responder ? el("p", { class: "dica-mod", style: { position: "absolute", left: "80px", bottom: "62px" } }, "Clica numa pergunta para a marcar como respondida.") : null], true);
      var nos = {};
      return {
        el: sec, upd: function (d) {
          var l = perguntasDe(d.r, (d.todas || {})[s.id + "g"], d.ocultos, d.respondidas), lim = 5;
          if (ctx.modo === "previsao") { l.forEach(function (x, i) { x.n = Math.max(0, 11 - i * 2 + (i % 3)); }); l.sort(function (a, b) { return b.n - a.n; }); }
          vazio.style.display = l.length ? "none" : "";
          var vivos = {};
          l.slice(0, lim).forEach(function (x, i) {
            var no = nos[x.k];
            if (!no) {
              no = { n: el("b", { class: "qa-n" }), txt: el("p", { class: "qa-t" }) };
              no.card = el("div", { class: "qa-c" }, no.txt, el("div", { class: "qa-rod" }, no.n,
                ctx.ocultar ? el("button", { type: "button", class: "qa-x", title: "Esconder esta pergunta", onclick: function (ev) { ev.stopPropagation(); ctx.ocultar(B.chave(x.k)); } }, "Esconder") : null));
              if (ctx.responder) no.card.onclick = function () { ctx.responder(B.chave(x.k)); };
              nos[x.k] = no;
            }
            no.txt.textContent = x.txt;
            no.n.textContent = "♥ " + x.n + (x.r ? "  ·  respondida" : "");
            no.card.classList.toggle("feita", x.r);
            no.card.classList.toggle("top", i === 0 && !x.r);
            vivos[x.k] = true;
            grelha.appendChild(no.card);
          });
          for (var k in nos) if (!vivos[k]) { nos[k].card.remove(); delete nos[k]; }
          mais.textContent = l.length > lim ? "+ " + (l.length - lim) + " perguntas" : "";
          return l.length;
        }
      };
    },
    telemovel: function (s, ctx) {
      var max = Number(s.maxPorPessoa) || 3, minhas = [];
      for (var i = 1; i <= max; i++) { var v = valorDe(ctx.meu(String(i))); if (typeof v === "string" && v) minhas.push(v); }
      var kids = [M.cab(s, s.titulo || "Perguntas?")];
      if (s.texto) kids.push(el("p", { class: "ph-sub" }, s.texto));
      if (minhas.length < max) {
        var cont = el("span", { class: "ph-cont" }, "0 / 200");
        var ta = el("textarea", { class: "ph-inp", rows: 3, maxlength: 200, placeholder: "A tua pergunta…", oninput: function () { cont.textContent = ta.value.length + " / 200"; } });
        var erro = el("p", { class: "ph-erro" });
        kids.push(el("form", { class: "ph-form", onsubmit: function (ev) {
          ev.preventDefault();
          var txt = ta.value.replace(/\s+/g, " ").trim();
          if (txt.length < 3) { erro.textContent = "Escreve a pergunta primeiro."; return; }
          ta.value = "";
          ctx.enviar({ v: txt.slice(0, 200), t: { ".sv": "timestamp" } }, String(minhas.length + 1));
        } }, ta, el("div", { class: "ph-linha" }, cont, erro), el("button", { class: "ph-bt", type: "submit" }, minhas.length ? "Enviar outra pergunta" : "Enviar pergunta")));
      } else kids.push(M.estado("✓ Já enviaste " + (max === 1 ? "a tua pergunta" : "as tuas " + max + " perguntas") + ". Obrigado!", true));
      if (minhas.length) kids.push(el("p", { class: "ph-kicker", style: { marginTop: "18px" } }, minhas.length === 1 ? "A tua pergunta" : "As tuas perguntas"),
        el("div", { class: "ph-enviadas" }, minhas.map(function (x) { return el("p", null, x); })));
      var lista = s.apoiar !== false && ctx.qa ? ctx.qa : [];
      var outras = lista.filter(function (q) { return q.k.indexOf(ctx.pid + "-") !== 0; });
      if (outras.length) {
        kids.push(el("p", { class: "ph-kicker", style: { marginTop: "20px" } }, "Perguntas da sala · apoia as que também queres ver respondidas"));
        kids.push(el("div", { class: "ph-qa" }, outras.map(function (q) {
          var gosto = (ctx.gostos || []).indexOf(q.k) >= 0;
          return el("div", { class: "ph-qa-c" + (q.r ? " feita" : "") }, el("p", null, q.v),
            q.r ? el("span", { class: "ph-qa-tag" }, "✓ respondida") :
              el("button", { type: "button", class: "ph-qa-gosto", "aria-pressed": gosto ? "true" : "false", "aria-label": gosto ? "Retirar apoio" : "Apoiar esta pergunta",
                onclick: function () { ctx.gostar(q.k); } }, "♥ " + Math.max(q.n, gosto ? 1 : 0)));
        })));
      }
      return kids;
    },
    csv: function (s, v) { var x = valorDe(v); return typeof x === "string" ? x : ""; }
  };

  B.ordemTipos = ["escolha", "quiz", "nuvem", "aberta", "escala", "ordenar", "perguntas", "texto", "roleta", "classificacao"];

  /* avisos de diapositivos por completar */
  B.verificar = function (at) {
    var avisos = [], temQuizPontos = false;
    function vazio(x) { return !x || !String(x).trim(); }
    (at.slides || []).forEach(function (s, i) {
      var l = [];
      if (s.tipo === "escolha" || s.tipo === "quiz") {
        if (vazio(s.pergunta)) l.push("Falta a pergunta.");
        if ((s.opcoes || []).some(vazio)) l.push(s.tipo === "quiz" ? "Há respostas por preencher." : "Há opções por preencher.");
        if (s.tipo === "quiz" && s.pontos !== false) temQuizPontos = true;
      } else if (s.tipo === "nuvem" || s.tipo === "aberta") {
        if (vazio(s.pergunta)) l.push("Falta a pergunta.");
      } else if (s.tipo === "ordenar") {
        if (vazio(s.pergunta)) l.push("Falta a pergunta.");
        if ((s.itens || []).some(vazio)) l.push("Há itens por preencher.");
      } else if (s.tipo === "escala") {
        var af = s.afirmacoes || [];
        if (vazio(s.pergunta) && af.every(vazio)) l.push("Falta a pergunta.");
        if (af.length > 1 && af.some(vazio)) l.push("Há afirmações por preencher.");
      } else if (s.tipo === "texto") {
        if (vazio(s.titulo)) l.push("Falta o título.");
      } else if (s.tipo === "roleta") {
        if ((s.segmentos || []).some(function (x) { return vazio(x.t); })) l.push("Há segmentos da roleta por preencher.");
      } else if (s.tipo === "classificacao") {
        if (!temQuizPontos) l.push("Não há nenhum quiz com pontos antes deste diapositivo.");
        else if (!at.pedirAlcunha) l.push("Sem «Pedir alcunha» (Definições), a classificação mostra «Anónimo».");
      }
      if (at.ritmo === "livre" && (s.tipo === "roleta" || s.tipo === "classificacao")) l.push("No questionário ao ritmo de cada um, este diapositivo não aparece.");
      if (l.length) avisos.push({ i: i, l: l });
    });
    return avisos;
  };

  /* ---------- miniaturas (palco escalado) ---------- */
  var observadores = [];
  B.exemploPlacar = function () {
    var p = B.exemploParticipantes(10), l = [];
    Object.keys(p).forEach(function (pid, i) { l.push({ pid: pid, nome: p[pid].n, total: 4200 - i * 370 - (i % 3) * 40, pos: i + 1 }); });
    return l;
  };
  B.dadosExemplo = function (at, s) {
    var d = { r: B.exemplo(s), todas: {}, estado: {}, revelado: s.tipo === "quiz", ocultos: {}, placar: B.exemploPlacar(), n: 24 };
    if (s.tipo === "escala" && s.comparar) d.todas[s.comparar] = B.exemplo(Object.assign({}, s, { id: s.comparar }));
    return d;
  };
  B.miniatura = function (at, s, d, opcoes) {
    opcoes = opcoes || {};
    var caixa = el("div", { class: "mini" }), palco = el("div", { class: "palco" });
    var tema = B.aplicarTema(palco, at.tema);
    caixa.appendChild(palco);
    if (s && T[s.tipo]) {
      var v = T[s.tipo].ecra(s, { tema: tema, modo: opcoes.modo || "previsao", atividade: at, canto: opcoes.canto || null, rodape: opcoes.rodape || null, imagem: opcoes.imagem || null });
      palco.appendChild(v.el);
      var dados = d || B.dadosExemplo(at, s);
      var upd = function () { try { v.upd(dados); } catch (e) {} };
      requestAnimationFrame(upd);
      setTimeout(upd, 80);
      caixa.vista = v;
    } else {
      palco.appendChild(el("section", { class: "sl sup-destaque" }, el("div", { class: "conteudo" }, el("h1", { class: "tit" }, at.titulo || "Atividade"))));
    }
    if (opcoes.largura) {
      palco.style.transform = "scale(" + opcoes.largura / 1600 + ")";
      caixa.style.width = opcoes.largura + "px";
    } else {
      var escalar = function () { var w = caixa.clientWidth; if (w) palco.style.transform = "scale(" + w / 1600 + ")"; };
      try { var ro = new ResizeObserver(escalar); ro.observe(caixa); observadores.push({ ro: ro, caixa: caixa }); }
      catch (e) { window.addEventListener("resize", escalar); }
      setTimeout(escalar, 0);
    }
    return caixa;
  };
  /* desliga as miniaturas que já não estão na página (evita acumular memória) */
  B.limparMinis = function () {
    observadores = observadores.filter(function (o) { if (!o.caixa.isConnected) { o.ro.disconnect(); return false; } return true; });
  };

  /* novo diapositivo de um tipo, mantendo a pergunta se mudar de tipo */
  B.novoSlide = function (tipo, antigo) {
    var s = T[tipo].novo();
    s.id = antigo && antigo.id ? antigo.id : B.novoId();
    if (antigo) {
      var txt = antigo.pergunta || antigo.titulo || "";
      if ("pergunta" in s) s.pergunta = txt; else if ("titulo" in s) s.titulo = txt;
      if (antigo.etiqueta) s.etiqueta = antigo.etiqueta;
      var ops = antigo.opcoes || antigo.itens || (antigo.segmentos && antigo.segmentos.map(function (x) { return x.t; }));
      if (ops && ops.length) {
        if (s.opcoes) s.opcoes = ops.slice(0, tipo === "quiz" ? 6 : 10);
        if (s.itens) s.itens = ops.slice(0, 8);
        if (s.segmentos) s.segmentos = ops.slice(0, 12).map(function (t) { return { t: t, d: "" }; });
        if (s.afirmacoes && antigo.tipo !== "escolha") s.afirmacoes = ops.slice(0, 8);
      }
      if (tipo === "quiz") {
        while (s.opcoes.length < 2) s.opcoes.push("");
        if (typeof antigo.certa === "number" && antigo.certa < s.opcoes.length) s.certa = antigo.certa;
      }
    }
    return s;
  };
  B.textoSlide = function (s) { var d = T[s.tipo]; return (d && d.texto ? d.texto(s) : "") || ""; };
})();
