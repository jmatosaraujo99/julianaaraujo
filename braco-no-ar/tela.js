/* ==========================================================================
   BRAÇO NO AR · tela livre e layouts
   Um diapositivo sem forma fixa: caixas de texto, imagens e formas postas
   onde se quiser, num palco de 1600 × 900. Os layouts são telas já
   arrumadas — depois de escolhidos, mexe-se em tudo.
   ========================================================================== */
(function () {
  "use strict";
  var B = window.BNA, el = B.el, T = B.tipos, M = B.tel, E = B.ed;
  var W = 1600, H = 900, RODAPE = 812;

  /* ---------------- cores ----------------
     Guardam-se como fichas e não como cores fixas, para seguirem o tema:
     "auto" é a cor do texto do fundo escolhido, "kicker" a de destaque,
     "t:<nome>" uma cor do tema, "c<n>" uma das cores das opções. */
  function corCss(c, tema) {
    if (!c) return "";
    if (c === "auto") return "var(--tinta)";
    if (c === "kicker") return "var(--kicker)";
    if (c === "suave") return "var(--suave)";
    if (c === "cartao") return "var(--cartao)";
    if (c.indexOf("t:") === 0) return tema[c.slice(2)] || "";
    if (/^c\d$/.test(c)) return B.cor(tema, Number(c.slice(1)));
    if (/^#[0-9a-f]{3,8}$/i.test(c)) return c;
    return "";
  }
  /* a mesma cor em hexadecimal, para as amostras do painel */
  function corAmostra(c, tema, fundo) {
    var f = fundo || "claro";
    if (c === "auto") return f === "claro" ? tema.tinta : f === "escuro" ? "#ffffff" : B.tintaSobre(tema.destaque, tema);
    if (c === "kicker") return f === "claro" ? tema.destaque : tema.acento;
    if (c === "suave") return f === "claro" ? "#8a8a8a" : tema.salvia;
    if (c === "cartao") return f === "claro" ? "#ffffff" : "rgba(255,255,255,.18)";
    return corCss(c, tema);
  }
  function paleta(tema) {
    var l = ["auto", "kicker", "suave", "cartao", "t:escuro", "t:claro", "#ffffff", "t:destaque", "t:acento"];
    tema.cores.forEach(function (_, i) { l.push("c" + i); });
    return l;
  }
  B.corTela = corCss;

  /* ---------------- elementos ---------------- */
  var BASE = {
    texto: { x: 200, y: 360, w: 1200, h: 120, texto: "", letra: "texto", tam: 44, negrito: false, alinh: "esq", valinh: "topo", cor: "auto", fundo: "", ph: "Escreve aqui" },
    titulo: { k: "texto", x: 120, y: 300, w: 1360, h: 220, texto: "", letra: "titulo", tam: 110, negrito: false, alinh: "esq", valinh: "topo", cor: "auto", fundo: "", ph: "Título" },
    forma: { x: 600, y: 300, w: 400, h: 300, forma: "ret", cor: "c0", raio: 28, opac: 100 },
    imagem: { x: 500, y: 200, w: 600, h: 420, imagem: "", modo: "cobrir", raio: 18 }
  };
  function novoEl(tipo, extra) {
    var b = BASE[tipo], e = { id: B.novoId(), k: b.k || tipo };
    for (var p in b) if (p !== "k") e[p] = b[p];
    for (var q in extra || {}) e[q] = extra[q];
    return e;
  }
  B.novoElTela = novoEl;

  function desenharEl(e, ctx, editavel) {
    var tema = ctx.tema;
    var no = el("div", { class: "tl-el tl-" + e.k, "data-id": e.id,
      style: { left: e.x + "px", top: e.y + "px", width: e.w + "px", height: e.h + "px" } });
    if (e.k === "texto") {
      var vazio = !String(e.texto || "").trim();
      var tx = el("div", { class: "tl-tx" + (vazio ? " tl-ph" : "") }, vazio ? (editavel || ctx.mostrarPh ? e.ph || "Escreve aqui" : "") : e.texto);
      var st = no.style;
      st.fontFamily = e.letra === "titulo" ? "var(--display)" : "var(--texto)";
      st.fontSize = (Number(e.tam) || 40) + "px";
      st.fontWeight = e.letra === "titulo" ? "400" : e.negrito ? "800" : "400";
      st.textTransform = e.letra === "titulo" ? "uppercase" : "none";
      st.lineHeight = e.letra === "titulo" ? "1.05" : "1.35";
      st.textAlign = e.alinh === "centro" ? "center" : e.alinh === "dir" ? "right" : "left";
      st.justifyContent = e.valinh === "meio" ? "center" : e.valinh === "baixo" ? "flex-end" : "flex-start";
      st.color = corCss(e.cor, tema) || "var(--tinta)";
      if (e.fundo) { st.background = corCss(e.fundo, tema); st.padding = "0.35em 0.5em"; st.borderRadius = "18px"; }
      no.appendChild(tx);
    } else if (e.k === "forma") {
      var s2 = no.style;
      s2.background = corCss(e.cor, tema) || B.cor(tema, 0);
      s2.borderRadius = e.forma === "circulo" ? "50%" : e.forma === "pilula" ? "999px" : (Number(e.raio) || 0) + "px";
      s2.opacity = String((e.opac == null ? 100 : Number(e.opac)) / 100);
    } else if (e.k === "imagem") {
      no.style.borderRadius = (Number(e.raio) || 0) + "px";
      if (e.imagem && ctx.imagem) {
        var im = el("img", { alt: "", draggable: "false", style: { objectFit: e.modo === "conter" ? "contain" : "cover" } });
        ctx.imagem(e.imagem).then(function (u) { if (u) im.src = u; else no.classList.add("tl-falhou"); });
        no.appendChild(im);
      } else if (editavel || ctx.mostrarPh) {
        no.classList.add("tl-semimg");
        no.appendChild(el("span", null, editavel ? "Imagem · escolhe no painel à direita" : "Imagem"));
      }
    }
    return no;
  }

  /* ---------------- o tipo ---------------- */
  T.tela = {
    nome: "Tela livre", icone: "▢", desc: "Uma tela em branco: escreves, pões imagens e formas onde quiseres.", interativo: false, sup: "claro",
    novo: function () { return { tipo: "tela", elementos: [], telemovel: false }; },
    texto: function (s) {
      var t = (s.elementos || []).filter(function (e) { return e.k === "texto" && String(e.texto || "").trim(); })
        .sort(function (a, b) { return a.y - b.y || a.x - b.x; })[0];
      return t ? String(t.texto).split("\n")[0] : "";
    },
    editor: function (s, mudar, redesenhar, ctx) { return painel(s, mudar, redesenhar, ctx); },
    ecra: function (s, ctx) {
      var f = s.fundo && s.fundo !== "auto" ? s.fundo : "claro";
      var sec = el("section", { class: "sl tela sup-" + f });
      var camada = el("div", { class: "tl-camada" });
      var c2 = s._exemplo ? Object.assign({}, ctx, { mostrarPh: true }) : ctx;
      (s.elementos || []).forEach(function (e) { camada.appendChild(desenharEl(e, c2, !!ctx.editavel)); });
      if (!(s.elementos || []).length && !ctx.editavel && ctx.modo === "previsao") camada.appendChild(el("div", { class: "vazio" }, "Tela em branco"));
      sec.appendChild(camada);
      if (ctx.rodape) sec.appendChild(ctx.rodape());
      return { el: sec, upd: function () { return 0; } };
    },
    telemovel: function (s) {
      if (!s.telemovel) return [M.olha()];
      var tx = (s.elementos || []).filter(function (e) { return e.k === "texto" && String(e.texto || "").trim(); })
        .sort(function (a, b) { return a.y - b.y || a.x - b.x; });
      if (!tx.length) return [M.olha()];
      var kids = [el("h1", { class: "ph-q" }, tx[0].texto)];
      tx.slice(1).forEach(function (e) { kids.push(el("p", { class: "ph-sub", style: { whiteSpace: "pre-line" } }, e.texto)); });
      return kids;
    }
  };
  var ord = B.ordemTipos, iTexto = ord.indexOf("texto");
  ord.splice(iTexto < 0 ? ord.length : iTexto, 0, "tela");

  /* mudar de tipo leva o texto principal: de uma pergunta para a tela vira
     título, e da tela para uma pergunta o primeiro texto vira a pergunta */
  var novoSlideAntes = B.novoSlide;
  B.novoSlide = function (tipo, antigo) {
    var a = antigo;
    if (antigo && antigo.tipo === "tela") a = Object.assign({}, antigo, { titulo: T.tela.texto(antigo) });
    var s = novoSlideAntes(tipo, a);
    if (tipo === "tela" && antigo && antigo.tipo !== "tela") {
      var t = antigo.pergunta || antigo.titulo || "";
      s.elementos = t ? [novoEl("titulo", { texto: t, y: 300 })] : [];
    }
    return s;
  };

  /* avisos de "por completar" também para a tela */
  var verificarAntes = B.verificar;
  B.verificar = function (at) {
    var l = verificarAntes(at), porI = {};
    l.forEach(function (a) { porI[a.i] = a; });
    (at.slides || []).forEach(function (s, i) {
      if (s.tipo !== "tela") return;
      var els = s.elementos || [], m = [];
      if (!els.length) m.push("A tela está vazia.");
      if (els.some(function (e) { return e.k === "imagem" && !e.imagem; })) m.push("Há uma imagem por escolher.");
      if (els.some(function (e) { return e.k === "texto" && !String(e.texto || "").trim(); })) m.push("Há caixas de texto por escrever (no ecrã ficam vazias).");
      if (!m.length) return;
      if (porI[i]) porI[i].l = porI[i].l.concat(m); else l.push({ i: i, l: m });
    });
    return l.sort(function (a, b) { return a.i - b.i; });
  };

  /* imagens usadas por um diapositivo (para exportar e importar) */
  B.imagensDe = function (s) {
    var l = [];
    if (s.imagem) l.push(s.imagem);
    (s.elementos || []).forEach(function (e) { if (e.imagem) l.push(e.imagem); });
    return l;
  };
  B.trocarImagens = function (s, mapa) {
    if (s.imagem && s.imagem in mapa) { if (mapa[s.imagem]) s.imagem = mapa[s.imagem]; else delete s.imagem; }
    (s.elementos || []).forEach(function (e) { if (e.imagem && e.imagem in mapa) e.imagem = mapa[e.imagem] || ""; });
  };

  /* ---------------- layouts ----------------
     Cada layout devolve os elementos (e, se quiser, o fundo). Os textos vêm
     vazios, com um exemplo ("ph") que só se vê enquanto se edita. */
  function tx(x, y, w, h, o) { return novoEl("texto", Object.assign({ x: x, y: y, w: w, h: h }, o)); }
  function tt(x, y, w, h, o) { return novoEl("titulo", Object.assign({ x: x, y: y, w: w, h: h }, o)); }
  function fm(x, y, w, h, o) { return novoEl("forma", Object.assign({ x: x, y: y, w: w, h: h }, o)); }
  function im(x, y, w, h, o) { return novoEl("imagem", Object.assign({ x: x, y: y, w: w, h: h }, o)); }
  B.layoutsTela = [
    { id: "branco", nome: "Tela em branco", desc: "Começa do zero.", fazer: function () { return { elementos: [] }; } },
    { id: "titulo", nome: "Título", desc: "Abertura ou mudança de tema.", fazer: function () {
      return { elementos: [
        tx(120, 250, 1360, 50, { letra: "titulo", tam: 30, cor: "kicker", alinh: "centro", ph: "Etiqueta" }),
        tt(120, 310, 1360, 260, { tam: 130, alinh: "centro", valinh: "meio", ph: "O título da sessão" }),
        tx(220, 600, 1160, 90, { tam: 36, cor: "suave", alinh: "centro", ph: "Uma frase curta a explicar" })] };
    } },
    { id: "seccao", nome: "Separador", desc: "Fundo de cor e um número grande.", fazer: function () {
      return { fundo: "destaque", elementos: [
        tt(120, 160, 600, 300, { tam: 300, cor: "kicker", ph: "02" }),
        tt(120, 470, 1360, 220, { tam: 110, ph: "Nome da parte" })] };
    } },
    { id: "tituloTexto", nome: "Título e texto", desc: "Explicar uma ideia.", fazer: function () {
      return { elementos: [
        tt(100, 90, 1400, 170, { tam: 96, ph: "Título" }),
        tx(100, 300, 1100, 460, { tam: 38, cor: "suave", ph: "O texto. Podes escrever vários parágrafos." })] };
    } },
    { id: "textoImagem", nome: "Texto e imagem", desc: "A ideia à esquerda, a imagem à direita.", fazer: function () {
      return { elementos: [
        tt(100, 130, 700, 260, { tam: 84, valinh: "baixo", ph: "Título" }),
        tx(100, 420, 700, 330, { tam: 34, cor: "suave", ph: "O texto que acompanha a imagem." }),
        im(880, 90, 620, 680)] };
    } },
    { id: "imagemInteira", nome: "Imagem inteira", desc: "Uma fotografia a ocupar o ecrã.", fazer: function () {
      return { fundo: "escuro", elementos: [
        im(0, 0, 1600, 900, { raio: 0 }),
        fm(0, 560, 1600, 340, { cor: "t:escuro", raio: 0, opac: 70 }),
        tt(100, 600, 1400, 190, { tam: 92, cor: "#ffffff", valinh: "meio", ph: "Legenda da imagem" })] };
    } },
    { id: "duasColunas", nome: "Duas colunas", desc: "Comparar duas coisas.", fazer: function () {
      return { elementos: [
        tt(100, 80, 1400, 140, { tam: 84, ph: "Título" }),
        fm(100, 260, 680, 500, { cor: "cartao", raio: 24 }),
        fm(820, 260, 680, 500, { cor: "cartao", raio: 24 }),
        tx(140, 295, 600, 70, { letra: "titulo", tam: 46, cor: "kicker", ph: "Antes" }),
        tx(140, 380, 600, 350, { tam: 32, ph: "O que acontecia…" }),
        tx(860, 295, 600, 70, { letra: "titulo", tam: 46, cor: "kicker", ph: "Depois" }),
        tx(860, 380, 600, 350, { tam: 32, ph: "O que muda…" })] };
    } },
    { id: "tresIdeias", nome: "Três ideias", desc: "Três pontos lado a lado.", fazer: function () {
      var l = [tt(100, 70, 1400, 130, { tam: 80, ph: "Três coisas a levar" })];
      [100, 580, 1060].forEach(function (x, i) {
        l.push(fm(x, 240, 440, 520, { cor: "cartao", raio: 24 }));
        l.push(tx(x + 40, 280, 360, 90, { letra: "titulo", tam: 72, cor: "c" + i, ph: "0" + (i + 1) }));
        l.push(tx(x + 40, 390, 360, 340, { tam: 30, ph: "Uma ideia curta." }));
      });
      return { elementos: l };
    } },
    { id: "citacao", nome: "Citação", desc: "Uma frase que fica.", fazer: function () {
      return { fundo: "escuro", elementos: [
        tt(100, 40, 240, 260, { tam: 280, cor: "kicker", ph: "“", texto: "“" }),
        tx(160, 250, 1280, 360, { tam: 60, negrito: true, ph: "A frase que queres que fique na cabeça." }),
        tx(160, 640, 1280, 70, { tam: 30, cor: "suave", ph: "— Quem disse" })] };
    } },
    { id: "numero", nome: "Número grande", desc: "Um dado que impressiona.", fazer: function () {
      return { elementos: [
        tt(100, 110, 1400, 420, { tam: 380, cor: "kicker", ph: "87%" }),
        tx(100, 560, 1100, 180, { tam: 46, negrito: true, ph: "das pessoas lembram-se melhor de uma história do que de um número." })] };
    } }
  ];
  /* um diapositivo pronto, a partir de um layout */
  B.slideDeLayout = function (id, comExemplos) {
    var L = B.layoutsTela.filter(function (x) { return x.id === id; })[0] || B.layoutsTela[0];
    var r = L.fazer(), s = T.tela.novo();
    s.id = B.novoId();
    s.elementos = r.elementos;
    s.fundo = r.fundo || "auto";
    if (comExemplos) { s._exemplo = true; s.elementos.forEach(function (e) { if (e.k === "texto" && !e.texto) e.texto = e.ph; }); }
    return s;
  };

  /* ======================================================================
     EDITOR DA TELA (no centro do editor de atividades)
     ====================================================================== */
  var sel = {};            /* elemento selecionado, por diapositivo */
  B.telaSel = function (s, id) { if (id !== undefined) sel[s.id] = id; return sel[s.id] || null; };
  function achar(s, id) { return (s.elementos || []).filter(function (e) { return e.id === id; })[0] || null; }

  /* o: { at, tema, imagem(id), escolherImagem(cb), mudar(), aoSelecionar() } */
  B.editorTela = function (s, o) {
    var raiz = el("div", { class: "tl-editor" });
    var caixa = el("div", { class: "tl-caixa" }), palco = el("div", { class: "palco" });
    B.aplicarTema(palco, o.at.tema);
    caixa.appendChild(palco);
    var escala = 1, aEditar = null;

    function k() { return escala || 1; }
    function escalar() {
      var w = caixa.clientWidth;
      if (!w) return;
      escala = w / W;
      palco.style.transform = "scale(" + escala + ")";
      palco.style.setProperty("--esc", String(escala));   /* pegas e contornos com o mesmo tamanho a qualquer zoom */
    }
    try { new ResizeObserver(escalar).observe(caixa); } catch (e) { window.addEventListener("resize", escalar); }

    var guiaV = el("div", { class: "tl-guia v", hidden: "hidden" }), guiaH = el("div", { class: "tl-guia h", hidden: "hidden" });

    function desenhar() {
      if (aEditar) return;
      var v = T.tela.ecra(s, { tema: o.tema, editavel: true, imagem: o.imagem, modo: "editor" });
      BNA.por(palco, v.el, el("div", { class: "tl-rodape", title: "Daqui para baixo fica o rodapé da apresentação" }), guiaV, guiaH);
      var id = B.telaSel(s);
      if (id && !achar(s, id)) B.telaSel(s, null);
      Array.prototype.forEach.call(palco.querySelectorAll(".tl-el"), ligar);
      marcar();
      requestAnimationFrame(escalar);
    }
    function marcar() {
      var id = B.telaSel(s);
      Array.prototype.forEach.call(palco.querySelectorAll(".tl-el"), function (n) {
        var on = n.getAttribute("data-id") === id;
        n.classList.toggle("tl-sel", on);
        var pegas = n.querySelectorAll(".tl-pega");
        if (on && !pegas.length) ["nw", "ne", "sw", "se"].forEach(function (c) { n.appendChild(el("i", { class: "tl-pega " + c, "data-c": c })); });
        if (!on) Array.prototype.forEach.call(pegas, function (p) { p.remove(); });
      });
      var e = achar(s, B.telaSel(s));
      barraSel.hidden = !e;
    }
    function selecionar(id) {
      if (B.telaSel(s) === id) return;
      B.telaSel(s, id); marcar();
      if (o.aoSelecionar) o.aoSelecionar();
    }

    /* encaixe: centro e margens do palco, e as arestas dos outros elementos */
    function encaixar(e, ignorar) {
      var linhasX = [0, 100, W / 2, W - 100, W], linhasY = [0, 80, H / 2, RODAPE, H];
      (s.elementos || []).forEach(function (x) {
        if (x.id === ignorar) return;
        linhasX.push(x.x, x.x + x.w / 2, x.x + x.w); linhasY.push(x.y, x.y + x.h / 2, x.y + x.h);
      });
      var lim = 10 / Math.max(k(), 0.3) * 0.6, gx = null, gy = null;
      [[0, e.x], [0.5, e.x + e.w / 2], [1, e.x + e.w]].some(function (p) {
        for (var i = 0; i < linhasX.length; i++) if (Math.abs(p[1] - linhasX[i]) < lim) { e.x = Math.round(linhasX[i] - p[0] * e.w); gx = linhasX[i]; return true; }
        return false;
      });
      [[0, e.y], [0.5, e.y + e.h / 2], [1, e.y + e.h]].some(function (p) {
        for (var i = 0; i < linhasY.length; i++) if (Math.abs(p[1] - linhasY[i]) < lim) { e.y = Math.round(linhasY[i] - p[0] * e.h); gy = linhasY[i]; return true; }
        return false;
      });
      guiaV.hidden = gx === null; if (gx !== null) guiaV.style.left = gx + "px";
      guiaH.hidden = gy === null; if (gy !== null) guiaH.style.top = gy + "px";
    }
    function pos(n, e) { n.style.left = e.x + "px"; n.style.top = e.y + "px"; n.style.width = e.w + "px"; n.style.height = e.h + "px"; }

    function ligar(n) {
      var id = n.getAttribute("data-id");
      n.addEventListener("pointerdown", function (ev) {
        if (aEditar) { if (aEditar === n) return; terminarEdicao(); }
        if (ev.button !== 0) return;
        var e = achar(s, id); if (!e) return;
        selecionar(id);
        ev.preventDefault();
        var canto = ev.target.getAttribute && ev.target.getAttribute("data-c");
        var x0 = ev.clientX, y0 = ev.clientY, ini = { x: e.x, y: e.y, w: e.w, h: e.h }, mexeu = false;
        try { n.setPointerCapture(ev.pointerId); } catch (er) {}
        function mover(m) {
          var dx = (m.clientX - x0) / k(), dy = (m.clientY - y0) / k();
          if (!mexeu && Math.abs(dx) + Math.abs(dy) < 3) return;
          mexeu = true;
          if (!canto) { e.x = Math.round(ini.x + dx); e.y = Math.round(ini.y + dy); if (!m.altKey) encaixar(e, id); }
          else {
            var x1 = ini.x, y1 = ini.y, x2 = ini.x + ini.w, y2 = ini.y + ini.h;
            if (canto.indexOf("w") >= 0) x1 = Math.min(x2 - 40, ini.x + dx); else x2 = Math.max(x1 + 40, x2 + dx);
            if (canto.indexOf("n") >= 0) y1 = Math.min(y2 - 30, ini.y + dy); else y2 = Math.max(y1 + 30, y2 + dy);
            if (m.shiftKey && e.k !== "texto") {           /* Shift mantém a proporção */
              var r = ini.w / ini.h, nw = x2 - x1, nh = nw / r;
              if (canto.indexOf("n") >= 0) y1 = y2 - nh; else y2 = y1 + nh;
            }
            e.x = Math.round(x1); e.y = Math.round(y1); e.w = Math.round(x2 - x1); e.h = Math.round(y2 - y1);
          }
          pos(n, e);
        }
        function largar() {
          n.removeEventListener("pointermove", mover); n.removeEventListener("pointerup", largar); n.removeEventListener("pointercancel", largar);
          guiaV.hidden = guiaH.hidden = true;
          if (mexeu) o.mudar();
        }
        n.addEventListener("pointermove", mover); n.addEventListener("pointerup", largar); n.addEventListener("pointercancel", largar);
      });
      n.addEventListener("dblclick", function () {
        var e = achar(s, id);
        if (!e) return;
        if (e.k === "texto") editarTexto(n, e);
        else if (e.k === "imagem") escolherImagem(e);
      });
    }

    /* escrever diretamente na tela */
    function editarTexto(n, e) {
      if (aEditar && aEditar !== n) terminarEdicao(n.getAttribute("data-id"));
      n = palco.querySelector('.tl-el[data-id="' + e.id + '"]') || n;
      var t = n.querySelector(".tl-tx");
      aEditar = n;
      n.classList.add("tl-a-editar");
      t.classList.remove("tl-ph");
      t.textContent = e.texto || "";
      t.contentEditable = "true";
      t.focus();
      var r = document.createRange(); r.selectNodeContents(t);
      var sl = window.getSelection(); sl.removeAllRanges(); sl.addRange(r);
      t.oninput = function () { e.texto = t.innerText.replace(/\n$/, ""); o.mudar(); };
      t.onkeydown = function (ev) { if (ev.key === "Escape") { ev.preventDefault(); t.blur(); } };
      t.onblur = function () { terminarEdicao(); };
    }
    /* Termina a escrita direta. Chama-se também antes de qualquer ação da barra:
       sem foco na janela o navegador não avisa que se saiu da caixa (blur), e a
       tela ficava presa a não se redesenhar. */
    function terminarEdicao() {
      if (!aEditar) return;
      var n = aEditar; aEditar = null;
      var t = n.querySelector(".tl-tx"); if (t) { t.contentEditable = "false"; t.oninput = t.onblur = t.onkeydown = null; }
      desenhar();
      if (o.aoSelecionar) o.aoSelecionar();
    }

    /* acrescentar elementos */
    function centrar(e) { e.x = Math.round((W - e.w) / 2); e.y = Math.round((RODAPE - e.h) / 2); }
    function por(e) {
      terminarEdicao();
      s.elementos = s.elementos || [];
      s.elementos.push(e);
      B.telaSel(s, e.id);
      o.mudar(); desenhar();
      if (o.aoSelecionar) o.aoSelecionar();
      return e;
    }
    function escolherImagem(e) {
      o.escolherImagem(function (id, erro) {
        if (id === null) { estado.textContent = "A carregar a imagem…"; return; }
        estado.textContent = erro || "";
        if (!id) return;
        terminarEdicao();
        var alvo = e || novoEl("imagem");
        alvo.imagem = id;
        o.imagem(id).then(function (u) {
          var img = new Image();
          img.onload = function () {
            if (!e && img.naturalWidth) { var r = img.naturalHeight / img.naturalWidth; alvo.w = 620; alvo.h = Math.round(Math.min(700, 620 * r)); alvo.w = Math.round(alvo.h / r); centrar(alvo); }
            terminarEdicao();
            if (e) { o.mudar(); desenhar(); } else por(alvo);
          };
          img.onerror = function () { terminarEdicao(); if (e) { o.mudar(); desenhar(); } else por(alvo); };
          img.src = u;
        });
      });
    }
    B.telaEscolherImagem = escolherImagem;
    var estado = el("span", { class: "tl-estado" });
    var menuForma = el("div", { class: "tl-menu", hidden: "hidden" },
      [["ret", "Retângulo"], ["circulo", "Círculo"], ["pilula", "Pílula"]].map(function (f) {
        return el("button", { type: "button", onclick: function () {
          menuForma.hidden = true;
          var e = novoEl("forma", { forma: f[0], cor: "c" + ((s.elementos || []).length % 6) });
          if (f[0] === "circulo") { e.w = e.h = 300; }
          if (f[0] === "pilula") { e.w = 520; e.h = 140; }
          centrar(e); por(e);
        } }, f[1]);
      }));
    var menuLayout = el("div", { class: "tl-menu tl-menu-lay", hidden: "hidden" }, B.layoutsTela.map(function (L) {
      return el("button", { type: "button", onclick: function () {
        menuLayout.hidden = true;
        terminarEdicao();
        if ((s.elementos || []).length && !confirm("Trocar o que está nesta tela pelo layout «" + L.nome + "»? (Ctrl+Z desfaz)")) return;
        var r = L.fazer();
        s.elementos = r.elementos; if (r.fundo) s.fundo = r.fundo;
        B.telaSel(s, null); o.mudar(); desenhar(); if (o.aoSelecionar) o.aoSelecionar();
      } }, L.nome);
    }));
    function alternar(m) { var era = m.hidden; menuForma.hidden = menuLayout.hidden = true; m.hidden = !era; }

    var barraSel = el("span", { class: "tl-barra-sel", hidden: "hidden" },
      el("button", { type: "button", class: "bt peq", title: "Duplicar (Ctrl+D)", onclick: function () { duplicar(); } }, "Duplicar"),
      el("button", { type: "button", class: "bt peq perigo", title: "Apagar (Delete)", onclick: function () { apagar(); } }, "Apagar"));
    var barra = el("div", { class: "tl-barra" },
      el("button", { type: "button", class: "bt peq", onclick: function () { var e = novoEl("titulo"); e.y = 120; e.h = 200; por(e); } }, "+ Título"),
      el("button", { type: "button", class: "bt peq", onclick: function () { var e = novoEl("texto"); centrar(e); por(e); } }, "+ Texto"),
      el("button", { type: "button", class: "bt peq", onclick: function () { escolherImagem(null); } }, "+ Imagem"),
      el("span", { class: "tl-rel" }, el("button", { type: "button", class: "bt peq", onclick: function () { alternar(menuForma); } }, "+ Forma ▾"), menuForma),
      el("span", { class: "tl-sep" }),
      el("span", { class: "tl-rel" }, el("button", { type: "button", class: "bt peq", onclick: function () { alternar(menuLayout); } }, "Layout ▾"), menuLayout),
      barraSel, estado);

    function duplicar() {
      terminarEdicao();
      var e = achar(s, B.telaSel(s)); if (!e) return;
      var c = B.clone(e); c.id = B.novoId(); c.x = Math.min(W - c.w, c.x + 30); c.y = Math.min(H - c.h, c.y + 30);
      por(c);
    }
    function apagar() {
      terminarEdicao();
      var id = B.telaSel(s); if (!id) return;
      s.elementos = (s.elementos || []).filter(function (e) { return e.id !== id; });
      B.telaSel(s, null); o.mudar(); desenhar(); if (o.aoSelecionar) o.aoSelecionar();
    }
    B.telaApagar = apagar; B.telaDuplicar = duplicar;

    /* teclado: apagar, mover com as setas, duplicar */
    function teclas(ev) {
      if (!raiz.isConnected) { document.removeEventListener("keydown", teclas); return; }
      if (aEditar) return;
      var t = ev.target;
      if (t && (t.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(t.tagName))) return;
      if (document.querySelector(".janela-fundo, dialog[open]")) return;
      var e = achar(s, B.telaSel(s)); if (!e) return;
      var passo = ev.shiftKey ? 10 : 1;
      if (ev.key === "Delete" || ev.key === "Backspace") { ev.preventDefault(); apagar(); }
      else if (ev.key === "Escape") { selecionar(null); }
      else if ((ev.ctrlKey || ev.metaKey) && (ev.key || "").toLowerCase() === "d") { ev.preventDefault(); duplicar(); }
      else if (/^Arrow/.test(ev.key)) {
        ev.preventDefault();
        if (ev.key === "ArrowLeft") e.x -= passo; else if (ev.key === "ArrowRight") e.x += passo;
        else if (ev.key === "ArrowUp") e.y -= passo; else e.y += passo;
        var n = palco.querySelector('.tl-el[data-id="' + e.id + '"]'); if (n) pos(n, e);
        o.mudar();
      }
      else if (ev.key === "Enter" && e.k === "texto") { ev.preventDefault(); var n2 = palco.querySelector('.tl-el[data-id="' + e.id + '"]'); if (n2) editarTexto(n2, e); }
    }
    document.addEventListener("keydown", teclas);

    /* clicar no fundo tira a seleção */
    caixa.addEventListener("pointerdown", function (ev) {
      if (!ev.target.closest(".tl-el")) { if (aEditar) terminarEdicao(); selecionar(null); }
      if (!ev.target.closest(".tl-menu")) { menuForma.hidden = menuLayout.hidden = true; }
    });
    barra.addEventListener("pointerdown", function (ev) { if (!ev.target.closest(".tl-rel")) menuForma.hidden = menuLayout.hidden = true; });

    raiz.appendChild(barra);
    raiz.appendChild(caixa);
    raiz.appendChild(el("p", { class: "nota-previa" }, "Arrasta para mover, puxa os cantos para mudar o tamanho (Shift mantém a proporção). Duplo clique num texto para escrever."));
    desenhar();
    setTimeout(escalar, 0);
    return { el: raiz, atualizar: desenhar, s: s, aEditar: function () { return !!aEditar; } };
  };

  /* ---------------- painel da direita ---------------- */
  function amostras(rotulo, e, prop, ctx, mudar, redesenhar, comNenhuma) {
    var tema = ctx.tema, fundo = (ctx.slide && ctx.slide.fundo && ctx.slide.fundo !== "auto") ? ctx.slide.fundo : "claro";
    var box = el("div", { class: "tl-cores" });
    var l = paleta(tema);
    if (comNenhuma) l.unshift("");
    l.forEach(function (c) {
      var hex = c ? corAmostra(c, tema, fundo) : "transparent";
      box.appendChild(el("button", { type: "button", class: "tl-cor" + (e[prop] === c ? " on" : "") + (c ? "" : " nenhuma"),
        title: c === "auto" ? "Cor do texto (segue o fundo)" : c === "kicker" ? "Cor de destaque" : c === "" ? "Sem fundo" : c,
        style: { background: hex }, onclick: function () { e[prop] = c; mudar(); redesenhar(); } }));
    });
    return E.campo(rotulo, box);
  }
  function seg(rotulo, e, prop, ops, mudar, redesenhar) {
    return E.campo(rotulo, el("div", { class: "seg tl-seg" }, ops.map(function (op) {
      return el("button", { type: "button", class: e[prop] === op[0] ? "on" : null, title: op[2] || null, onclick: function () { e[prop] = op[0]; mudar(); redesenhar(); } }, op[1]);
    })));
  }
  function numero(rotulo, e, prop, min, max, passo, mudar, sufixo) {
    var saida = el("output", null, e[prop] + (sufixo || ""));
    var r = el("input", { type: "range", min: min, max: max, step: passo, value: e[prop], oninput: function () { e[prop] = Number(r.value); saida.textContent = r.value + (sufixo || ""); mudar(); } });
    return E.campo(rotulo, el("div", { class: "tl-num" }, r, saida));
  }
  function painel(s, mudar, redesenhar, ctx) {
    var e = achar(s, B.telaSel(s));
    var c2 = Object.assign({}, ctx, { slide: s });
    var fim = [E.inter("Mostrar os textos também no telemóvel", s, "telemovel", mudar, "Sem isto, os telemóveis dizem «Olha para o ecrã.»")];
    if (!e) {
      return [el("div", { class: "tl-ajuda" },
        el("p", null, el("b", null, "Clica num elemento"), " para o editar aqui."),
        el("p", null, "Usa a barra por cima da tela para acrescentar títulos, textos, imagens e formas, ou para aplicar um layout pronto."),
        el("p", null, "Teclas: ", el("b", null, "Delete"), " apaga · ", el("b", null, "setas"), " mexem · ", el("b", null, "Ctrl+D"), " duplica · ", el("b", null, "Enter"), " escreve no texto."))].concat(fim);
    }
    var campos = [];
    var nomes = { texto: "Caixa de texto", forma: "Forma", imagem: "Imagem" };
    campos.push(el("div", { class: "tl-cab-el" }, el("b", null, nomes[e.k]),
      el("span", { class: "tl-ordem" },
        el("button", { type: "button", class: "bt-ic", title: "Trazer para a frente", onclick: function () { s.elementos = s.elementos.filter(function (x) { return x !== e; }).concat([e]); mudar(); redesenhar(); } }, "⤒"),
        el("button", { type: "button", class: "bt-ic", title: "Enviar para trás", onclick: function () { s.elementos = [e].concat(s.elementos.filter(function (x) { return x !== e; })); mudar(); redesenhar(); } }, "⤓"),
        el("button", { type: "button", class: "bt-ic", title: "Duplicar", onclick: function () { if (B.telaDuplicar) B.telaDuplicar(); } }, "⧉"),
        el("button", { type: "button", class: "bt-ic", title: "Apagar", onclick: function () { if (B.telaApagar) B.telaApagar(); } }, "×"))));
    if (e.k === "texto") {
      campos.push(E.texto("Texto", e, "texto", mudar, { linhas: 3, max: 600, placeholder: e.ph || "Escreve aqui" }));
      campos.push(seg("Letra", e, "letra", [["titulo", "TÍTULO", "Anton, em maiúsculas"], ["texto", "Texto", "Archivo"]], mudar, redesenhar));
      campos.push(numero("Tamanho", e, "tam", 14, 400, 2, mudar, " px"));
      if (e.letra !== "titulo") campos.push(E.inter("Negrito", e, "negrito", mudar, null, redesenhar));
      campos.push(seg("Alinhamento", e, "alinh", [["esq", "⇤ Esq."], ["centro", "Centro"], ["dir", "Dir. ⇥"]], mudar, redesenhar));
      campos.push(seg("Na vertical", e, "valinh", [["topo", "Cima"], ["meio", "Meio"], ["baixo", "Baixo"]], mudar, redesenhar));
      campos.push(amostras("Cor do texto", e, "cor", c2, mudar, redesenhar));
      campos.push(amostras("Fundo da caixa", e, "fundo", c2, mudar, redesenhar, true));
    } else if (e.k === "forma") {
      campos.push(seg("Forma", e, "forma", [["ret", "Retângulo"], ["circulo", "Círculo"], ["pilula", "Pílula"]], mudar, redesenhar));
      campos.push(amostras("Cor", e, "cor", c2, mudar, redesenhar));
      if (e.forma === "ret") campos.push(numero("Cantos arredondados", e, "raio", 0, 120, 2, mudar, " px"));
      campos.push(numero("Opacidade", e, "opac", 10, 100, 5, mudar, "%"));
    } else if (e.k === "imagem") {
      campos.push(E.campo("Imagem", el("div", { class: "bts" },
        el("button", { type: "button", class: "bt peq", onclick: function () { if (B.telaEscolherImagem) B.telaEscolherImagem(e); } }, e.imagem ? "Trocar imagem" : "Escolher imagem…")),
        "As fotografias são reduzidas automaticamente. Os telemóveis não mostram imagens."));
      campos.push(seg("Enquadramento", e, "modo", [["cobrir", "Preencher"], ["conter", "Inteira"]], mudar, redesenhar));
      campos.push(numero("Cantos arredondados", e, "raio", 0, 120, 2, mudar, " px"));
    }
    campos.push(el("p", { class: "ajuda" }, "Posição " + e.x + ", " + e.y + " · tamanho " + e.w + " × " + e.h + " (o ecrã tem 1600 × 900)."));
    return campos.concat(fim);
  }
})();
