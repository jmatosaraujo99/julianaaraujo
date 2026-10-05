/* ==========================================================================
   BRAÇO NO AR · lado do participante (telemóvel)
   ========================================================================== */
(function () {
  "use strict";
  var B = window.BNA, el = B.el, T = B.tipos, M = B.tel;

  function pontinhos(t) {
    return el("span", { class: "ph-pontos", "aria-hidden": "true" }, t.cores.slice(0, 5).map(function (c) { return el("i", { style: { background: c } }); }));
  }

  /* moldura do telemóvel (cabeçalho, conteúdo, rodapé) */
  B.molduraTel = function (raiz, temaId, marca) {
    var root = el("div", { class: "ph", "data-sup": "destaque" });
    var t = B.aplicarTema(root, temaId);
    var net = el("span", { class: "ph-net", "data-ok": "1" }, "ligado");
    var main = el("main", { class: "ph-main", "aria-live": "polite" });
    var rodape = el("footer", { class: "ph-rodape" }, "As respostas são anónimas.");
    var marcaEl = el("span", { class: "ph-marca" }, marca || B.nome);
    var pts = pontinhos(t);
    root.append(el("header", { class: "ph-top" }, marcaEl, pts, net), main, rodape);
    raiz.appendChild(root);
    return {
      root: root, main: main, rodape: rodape, net: net,
      tema: function (id) { t = B.aplicarTema(root, id); pts.replaceWith(pts = pontinhos(t)); return t; },
      sup: function (s) { root.setAttribute("data-sup", s); },
      marca: function (m) { marcaEl.textContent = m; },
      ligado: function (ok) { net.setAttribute("data-ok", ok ? "1" : "0"); net.textContent = ok ? "ligado" : "sem rede"; }
    };
  };

  /* Desenha um diapositivo no telemóvel. Se for o mesmo diapositivo, guarda o que a
     pessoa estava a escrever (e onde estava o cursor) para não se perder nada. */
  B.desenharTel = function (moldura, s, ctx, antes) {
    var def = T[s.tipo];
    moldura.sup(s.fundo && s.fundo !== "auto" ? s.fundo : def.sup);
    var guardados = null, foco = -1, sel = null;
    if (moldura._slide === s.id) {
      var velhos = moldura.main.querySelectorAll(".ph-inp");
      guardados = [];
      for (var i = 0; i < velhos.length; i++) {
        guardados.push(velhos[i].value);
        if (velhos[i] === document.activeElement) { foco = i; try { sel = [velhos[i].selectionStart, velhos[i].selectionEnd]; } catch (e) {} }
      }
    }
    moldura._slide = s.id;
    var kids = def.telemovel(s, ctx);
    BNA.por(moldura.main, antes || null);
    (function junta(k) { if (Array.isArray(k)) k.forEach(junta); else if (k) moldura.main.appendChild(k); })(kids);
    if (guardados && guardados.length) {
      var novos = moldura.main.querySelectorAll(".ph-inp");
      if (novos.length === guardados.length) {
        for (var j = 0; j < novos.length; j++) {
          if (novos[j].value !== guardados[j]) { novos[j].value = guardados[j]; try { novos[j].dispatchEvent(new Event("input")); } catch (e) {} }
        }
        if (foco >= 0 && novos[foco]) { try { novos[foco].focus({ preventScroll: true }); if (sel) novos[foco].setSelectionRange(sel[0], sel[1]); } catch (e) {} }
      }
    }
  };

  /* contexto de pré-visualização (sem rede) */
  B.ctxPrevia = function (s, tema, extra) {
    var meus = {};
    var ctx = {
      tema: tema, pid: "previa", estado: Object.assign({ i: 0, id: s.id }, extra || {}),
      meu: function (suf) { return meus[suf || ""]; },
      enviar: function (v, suf) { meus[suf || ""] = v && v.t && v.t[".sv"] ? { v: v.v, t: Date.now() } : v; if (ctx.redesenhar) ctx.redesenhar(); },
      aEditar: false, editar: function (f) { ctx.aEditar = f; if (ctx.redesenhar) ctx.redesenhar(); },
      rascunho: null, rascunhar: function (x) { ctx.rascunho = x; if (ctx.redesenhar) ctx.redesenhar(); },
      tempoRestante: function (lim) { return lim; },
      relogio: function () { return el("div", { class: "ph-relogio" }, el("i")); },
      qa: s.tipo === "perguntas" ? [{ k: "x-1", v: "Vale a pena pôr o voluntariado no currículo?", n: 7 }, { k: "y-1", v: "O que digo quando me perguntam um defeito?", n: 4 }] : null,
      gostos: [], gostar: function (k) { var i = ctx.gostos.indexOf(k); if (i >= 0) ctx.gostos.splice(i, 1); else ctx.gostos.push(k); if (ctx.redesenhar) ctx.redesenhar(); }
    };
    return ctx;
  };

  /* páginas do questionário ao ritmo de cada um */
  B.paginasLivres = function (at) {
    return (at.slides || []).filter(function (s) {
      var d = T[s.tipo];
      if (!d || s.tipo === "roleta" || s.tipo === "classificacao") return false;
      return d.interativo || (s.tipo === "texto" && s.telemovel !== false);
    });
  };

  /* ======================================================================
     Participante a sério: entrar com código, responder, acompanhar o ecrã
     ====================================================================== */
  B.montarParticipante = function (raiz, opts) {
    opts = opts || {};
    var pid = opts.pid || B.idAluno();
    var mold = B.molduraTel(raiz, "tenda");
    var codigo = null, at = null, estado = null, cv = null, pararEstado = null, pararQa = null, ativa = true;
    var meus = {}, edicao = {}, rascunhos = {}, vistos = {}, pendentes = {}, gostos = {};
    var ligado = true, ultimoJson = "", relogioTimer = null, tempoTimer = null;
    var pontos = { v: null, d: null }, qa = { id: null, lista: null };
    var res = { id: null, d: null, j: "" }, pararRes = null;
    var fixo = null, fixoTimer = null;   /* código fixo da atividade (o do QR impresso) */
    var livre = { pos: 0, fim: false };

    function chaveLocal() { return "bna-r-" + codigo + "-" + pid; }
    function carregarMeus() {
      meus = B.store.getJSON(chaveLocal()) || {};
      gostos = B.store.getJSON(chaveLocal() + "-g") || {};
      livre = B.store.getJSON(chaveLocal() + "-livre") || { pos: 0, fim: false };
    }
    function guardarMeus() { B.store.setJSON(chaveLocal(), meus); }
    function guardarLivre() { B.store.setJSON(chaveLocal() + "-livre", livre); }
    function setLigado(ok) { if (ok !== ligado) { ligado = ok; mold.ligado(ok); } }
    function corTopo(c) {
      if (opts.embutido) return;
      var m = document.querySelector('meta[name="theme-color"]');
      if (m && c) m.setAttribute("content", c);
    }

    function ecraEntrar(msg) {
      if (pararEstado) { pararEstado(); pararEstado = null; }
      pararPerguntas();
      mold.sup("destaque");
      mold.rodape.textContent = "As respostas são anónimas.";
      var inp = el("input", { class: "ph-inp ph-codigo", inputmode: "numeric", autocomplete: "off", maxlength: 7, placeholder: "000 000", "aria-label": "Código da sessão",
        oninput: function () { var v = inp.value.replace(/[^\d ]/g, ""); if (v !== inp.value) inp.value = v; } });
      var erro = el("p", { class: "ph-erro" }, msg || "");
      BNA.por(mold.main, el("form", { class: "ph-entrar", onsubmit: function (ev) {
        ev.preventDefault();
        var c = inp.value.replace(/\D/g, "");
        if (c.length !== 6) { erro.textContent = "O código tem 6 algarismos."; return; }
        entrar(c);
      } }, el("h1", { html: "Entra e <em>responde.</em>" }), el("p", null, "Escreve o código que está no ecrã."), inp, erro,
        el("button", { class: "ph-bt", type: "submit" }, "Entrar")));
      if (!opts.embutido) setTimeout(function () { try { inp.focus(); } catch (e) {} }, 50);
    }

    function aCarregar(txt) { BNA.por(mold.main, M.grande(txt || "A entrar…", "")); }

    function entrar(c, viaFixo) {
      if (viaFixo) fixo = viaFixo;
      codigo = c;
      aCarregar();
      B.db.get(B.caminho.sessao(c) + "/conteudo").then(function (conteudo) {
        if (!conteudo && !viaFixo) {
          /* não é uma sessão: talvez seja o código fixo de uma atividade */
          return B.db.get(B.caminho.fixo(c)).then(function (fx) {
            if (!fx || !fx.dono) { codigo = null; ecraEntrar("Não encontrámos a sessão " + B.fmtCodigo(c) + ". Confirma o código."); return; }
            fixo = c;
            if (fx.s) entrar(String(fx.s), c); else esperarFixo(c, fx);
          });
        }
        if (!conteudo) { codigo = null; esperarFixo(viaFixo, {}); return null; }
        try { at = JSON.parse(conteudo); } catch (e) { ecraEntrar("Esta sessão tem um problema. Pede ao formador para a recomeçar."); return null; }
        return B.db.get(B.caminho.sessao(c) + "/estado").then(function (e) {
          estado = e || {};
          if (estado.fim) { ativa = false; mold.tema(at.tema); BNA.por(mold.main, M.grande("Esta sessão <em>terminou.</em>", "Obrigado por participares!")); return; }
          cv = estado.cv;
          var t = mold.tema(at.tema);
          corTopo(t.destaque);
          mold.marca(at.titulo || B.nome);
          mold.rodape.textContent = "Sessão " + B.fmtCodigo(c) + " · respostas anónimas";
          if (!opts.embutido) try { history.replaceState(null, "", location.pathname + "?c=" + (fixo || c) + (B.demo ? "&demo" : "")); } catch (e2) {}
          vigiarFixo();
          carregarMeus();
          var guardada = B.store.get("bna-alcunha-" + c + "-" + pid) || (fixo ? B.store.get("bna-alcunha-f-" + fixo + "-" + pid) : null);
          if (guardada) B.store.set("bna-alcunha-" + c + "-" + pid, guardada);
          if (at.pedirAlcunha && !guardada && !opts.alcunha) pedirAlcunha();
          else registar(opts.alcunha || guardada);
        });
      }).catch(function (e) {
        setLigado(false);
        codigo = null;
        ecraEntrar(e && e.status === 401 ? "A sessão não está disponível." : "Sem ligação. Confirma a internet e tenta outra vez.");
      });
    }

    /* código fixo sem sessão aberta: espera aqui e entra sozinho quando começar */
    function esperarFixo(f, fx) {
      clearTimeout(fixoTimer);
      codigo = null;
      mold.sup("destaque");
      if (fx && fx.t) mold.marca(fx.t);
      BNA.por(mold.main, M.grande("Ainda não <em>começou.</em>", "Fica nesta página: entras sozinho quando a sessão começar."), B.esperaTel("À espera da formadora"));
      fixoTimer = setTimeout(function () {
        B.db.get(B.caminho.fixo(f)).then(function (x) {
          if (x && x.s) entrar(String(x.s), f); else esperarFixo(f, x || fx);
        }).catch(function () { esperarFixo(f, fx); });
      }, 3000);
    }
    /* quem entrou pelo código fixo segue a formadora se ela abrir uma sessão nova */
    function vigiarFixo() {
      clearTimeout(fixoTimer);
      if (!fixo) return;
      fixoTimer = setTimeout(function () {
        B.db.get(B.caminho.fixo(fixo) + "/s").then(function (s) {
          if (s && String(s) !== codigo) { mudarDeSessao(String(s)); return; }
          vigiarFixo();
        }).catch(function () { vigiarFixo(); });
      }, 10000);
    }
    function mudarDeSessao(s) {
      if (pararEstado) { pararEstado(); pararEstado = null; }
      pararPerguntas(); pararResultados();
      at = null; estado = null; cv = null; ativa = true; ultimoJson = "";
      meus = {}; edicao = {}; rascunhos = {}; pendentes = {}; gostos = {};
      entrar(s, fixo);
    }

    function pedirAlcunha() {
      mold.sup("destaque");
      var inp = el("input", { class: "ph-inp", maxlength: 18, autocomplete: "nickname", placeholder: "Ex.: Rita M." });
      var erro = el("p", { class: "ph-erro" });
      BNA.por(mold.main, el("form", { class: "ph-entrar", onsubmit: function (ev) {
        ev.preventDefault();
        var n = inp.value.replace(/\s+/g, " ").trim();
        if (n.length < 2) { erro.textContent = "Escreve pelo menos 2 letras."; return; }
        if (B.improprio(n)) { erro.textContent = "Escolhe outra alcunha."; return; }
        B.store.set("bna-alcunha-" + codigo + "-" + pid, n);
        if (fixo) B.store.set("bna-alcunha-f-" + fixo + "-" + pid, n);   /* a próxima sessão desta atividade já não pergunta */
        registar(n);
      } }, el("h1", { html: "Como te <em>chamas?</em>" }), el("p", null, "Esta alcunha aparece na classificação do quiz."), inp, erro,
        el("button", { class: "ph-bt", type: "submit" }, "Continuar")));
      if (!opts.embutido) setTimeout(function () { try { inp.focus(); } catch (e) {} }, 50);
    }

    /* regista a presença e aproveita para acertar o relógio com o servidor */
    function registar(nome) {
      var v = { t: { ".sv": "timestamp" } };
      if (nome) v.n = String(nome).slice(0, 18);
      var t0 = Date.now();
      /* PATCH (e não PUT) para não apagar o «concluído» de quem volta a abrir a página */
      B.db.patch(B.caminho.participante(codigo, pid), v).then(function () {
        var t1 = Date.now();
        return B.db.get(B.caminho.participante(codigo, pid) + "/t").then(function (srv) { B.acertarRelogio(t0, t1, srv); render(); });
      }).catch(function () {});
      ouvirEstado();
    }

    function ouvirEstado() {
      render();
      pararEstado = B.db.ouvir(B.caminho.sessao(codigo) + "/estado", function (e, ok) {
        setLigado(ok);
        if (!ok) return;
        var j = JSON.stringify(e || null);
        if (j === ultimoJson) return;
        ultimoJson = j;
        estado = e || {};
        if (estado.fim) { ativa = false; render(); return; }
        ativa = true;
        if (estado.cv && cv && estado.cv !== cv) {
          cv = estado.cv;
          B.db.get(B.caminho.sessao(codigo) + "/conteudo").then(function (c) {
            try { at = JSON.parse(c); mold.tema(at.tema); mold.marca(at.titulo || B.nome); } catch (er) {}
            depoisDoEstado();
          });
          return;
        }
        cv = estado.cv || cv;
        depoisDoEstado();
      }, { intervalo: 2000 });
    }

    function depoisDoEstado() {
      /* pontos do quiz: só os meus, e só quando o formador os atualiza */
      if (estado.pv && estado.pv !== pontos.v) {
        var pv = estado.pv;
        B.db.get(B.caminho.pontos(codigo) + "/" + pid).then(function (p) {
          pontos = { v: pv, d: Array.isArray(p) ? p : (p && typeof p === "object" ? [p[0] || 0, p[1] || 0, p[2] || 0] : [0, 0, 0]) };
          render();
        }).catch(function () {});
      }
      /* perguntas da sala: lista publicada pelo formador (só enquanto o diapositivo está no ecrã) */
      var s = slideAtual();
      if (s && s.tipo === "perguntas" && s.apoiar !== false && !estado.modo) ouvirPerguntas(s.id);
      else pararPerguntas();
      if (s && T[s.tipo] && T[s.tipo].interativo && s.tipo !== "perguntas" && !estado.modo) ouvirResultados(s.id);
      else pararResultados();
      render();
    }
    /* resultados da pergunta no ecrã: o formador publica um resumo, aqui só se lê */
    function ouvirResultados(id) {
      if (res.id === id && pararRes) return;
      pararResultados();
      res = { id: id, d: null, j: "" };
      pararRes = B.db.ouvir(B.caminho.resumo(codigo), function (d, ok) {
        if (!ok) return;
        var x = d && d.id === id ? d : null, j = JSON.stringify(x);
        if (res.j === j) return;
        res.d = x; res.j = j;
        var s = slideAtual();
        if (s && s.id === id && (respondeu(s) || (s.tipo === "quiz" && estado.rev))) render();
      }, { semSse: true, intervalo: 3000 });
    }
    function pararResultados() { if (pararRes) { pararRes(); pararRes = null; } res = { id: null, d: null, j: "" }; }
    function respondeu(s) { return Object.keys(meus).some(function (k) { return k === s.id || k.indexOf(s.id + "-") === 0; }); }
    function ouvirPerguntas(id) {
      if (qa.id === id && pararQa) return;
      pararPerguntas();
      qa = { id: id, lista: null };
      pararQa = B.db.ouvir(B.caminho.perguntas(codigo), function (d, ok) {
        if (!ok) return;
        var l = d && d.s === id && Array.isArray(d.l) ? d.l : [];
        var j = JSON.stringify(l);
        if (qa.j === j) return;
        qa.lista = l; qa.j = j;
        render();
      }, { semSse: true, intervalo: 3500 });
    }
    function pararPerguntas() { if (pararQa) { pararQa(); pararQa = null; } qa = { id: null, lista: null }; }

    function chaveR(id, suf) { return id + (suf ? "-" + suf : ""); }
    function enviar(s, v, suf) {
      var k = chaveR(s.id, suf), local = B.clone(v);
      if (local && typeof local === "object" && local.t && local.t[".sv"]) local.t = Date.now();
      if (v === null) delete meus[k]; else meus[k] = local;
      guardarMeus();
      try { navigator.vibrate && navigator.vibrate(12); } catch (e) {}
      render();
      mandar(s.id, pid + (suf ? "-" + suf : ""), v, k, 0);
    }
    function mandar(slideId, chave, v, k, tent) {
      pendentes[k] = v;
      B.db.put(B.caminho.resposta(codigo, slideId, chave), v).then(function () {
        if (pendentes[k] === v) delete pendentes[k];
        setLigado(true);
        render();
      }).catch(function (e) {
        if (e && (e.status === 401 || e.status === 403)) { delete pendentes[k]; render(); return; }
        setLigado(false);
        render();
        setTimeout(function () { if (pendentes[k] === v) mandar(slideId, chave, v, k, tent + 1); }, Math.min(1500 * Math.pow(1.6, tent), 9000));
      });
    }
    function gostar(s, k) {
      var l = (gostos[s.id] || []).slice(), i = l.indexOf(k);
      if (i >= 0) l.splice(i, 1); else l.push(k);
      while (l.join(",").length > 390) l.shift();
      gostos[s.id] = l;
      B.store.setJSON(chaveLocal() + "-g", gostos);
      try { navigator.vibrate && navigator.vibrate(10); } catch (e) {}
      render();
      mandar(s.id + "g", pid, l.length ? l.join(",") : null, s.id + "g", 0);
    }

    function slideAtual() {
      if (!at || !estado || typeof estado.i !== "number" || estado.i < 0) return null;
      var s = (at.slides || [])[estado.i];
      if (estado.id && (!s || s.id !== estado.id)) {
        var x = (at.slides || []).filter(function (y) { return y.id === estado.id; })[0];
        if (x) s = x;
      }
      return s || null;
    }

    /* barra do temporizador do formador */
    function barraTempo() {
      clearInterval(tempoTimer);
      var tm = estado && estado.tmp;
      if (!tm || !tm.fim) return null;
      var agora = B.relogio.medido ? B.agora() : Date.now();
      if (agora > tm.fim + 8000) return null;
      var b = el("b"), i = el("i"), box = el("div", { class: "ph-tempo", role: "timer" }, el("em", { "aria-hidden": "true" }, "⏱"), b, el("span", null, i), tm.rot ? el("small", null, tm.rot) : null);
      var tick = function () {
        var resta = tm.fim - (B.relogio.medido ? B.agora() : Date.now());
        if (resta <= 0) {
          box.classList.add("fim"); b.textContent = "Tempo!";
          if (resta < -8000) { clearInterval(tempoTimer); box.remove(); }
          return;
        }
        b.textContent = B.mmss(resta);
        i.style.transform = "scaleX(" + Math.max(0, Math.min(1, resta / (tm.dur || resta))) + ")";
      };
      tick();
      tempoTimer = setInterval(tick, 250);
      return box;
    }

    function ctxPara(s) {
      var chaveVisto = s.id + ":" + (estado.ini || "");
      if (!vistos[chaveVisto]) vistos[chaveVisto] = Date.now();
      function resta(lim) {
        if (estado.ini && B.relogio.medido) return lim - (B.agora() - estado.ini) / 1000;
        return lim - (Date.now() - vistos[chaveVisto]) / 1000;
      }
      return {
        tema: B.tema(at.tema), pid: pid, estado: estado, livre: !!livreAtivo(),
        meu: function (suf) { return meus[chaveR(s.id, suf)]; },
        enviar: function (v, suf) { if (livreAtivo() || (estado && estado.id === s.id)) enviar(s, v, suf); },
        aEditar: !!edicao[s.id], editar: function (f) { edicao[s.id] = f; render(); },
        rascunho: rascunhos[s.id] || null, rascunhar: function (x) { rascunhos[s.id] = x; render(); },
        tempoRestante: resta,
        relogio: function (lim) {
          var i = el("i"), box = el("div", { class: "ph-relogio" }, i);
          var tick = function () {
            var r = Math.max(0, resta(lim));
            i.style.transform = "scaleX(" + r / lim + ")";
            if (r <= 0) { clearInterval(relogioTimer); render(); }
          };
          relogioTimer = setInterval(tick, 250);
          setTimeout(tick, 0);
          return box;
        },
        pontos: pontos.v && pontos.v === estado.pv ? pontos.d : null,
        qa: qa.id === s.id ? qa.lista : null,
        gostos: gostos[s.id] || [],
        gostar: function (k) { gostar(s, k); }
      };
    }

    function livreAtivo() { return estado && estado.modo === "livre"; }

    function render() {
      clearInterval(relogioTimer);
      if (!codigo || !at) return;
      if (!ativa) {
        clearInterval(tempoTimer);
        mold.sup("destaque");
        BNA.por(mold.main, M.grande("Obrigado!", "A sessão terminou. Já podes fechar esta página."));
        return;
      }
      if (livreAtivo()) return renderLivre();
      var s = slideAtual();
      var aviso = !ligado && Object.keys(pendentes).length ? el("p", { class: "ph-aviso" }, "Sem rede. A tua resposta segue assim que a ligação voltar.") : null;
      var topo = [aviso, barraTempo()];
      if (!s || !T[s.tipo]) {
        mold.sup("destaque");
        mold._slide = null;
        var nome = B.store.get("bna-alcunha-" + codigo + "-" + pid);
        BNA.por(mold.main, topo, M.grande("Estás <em>dentro!</em>", (nome ? nome + ", olha" : "Olha") + " para o ecrã. As perguntas aparecem aqui sozinhas.",
          el("div", { class: "ph-visto-g", "aria-hidden": "true" }, "✓")), B.esperaTel("À espera que a sessão comece"));
        return;
      }
      B.desenharTel(mold, s, ctxPara(s), topo);
      var def = T[s.tipo];
      if (!def.interativo) { mold.main.appendChild(B.esperaTel("A próxima pergunta aparece aqui sozinha")); return; }
      var quizRevelado = s.tipo === "quiz" && estado.rev;
      if (s.tipo === "perguntas" || (!respondeu(s) && !quizRevelado)) return;
      if (s.tipo === "quiz" && !estado.rev) { mold.main.appendChild(B.esperaTel("À espera da resposta certa")); return; }
      if (estado.oc) mold.main.appendChild(el("p", { class: "ph-res-nota", style: { marginTop: "16px" } }, "Os resultados aparecem no ecrã quando a formadora os mostrar."));
      else if (res.d && res.d.id === s.id) mold.main.appendChild(B.resultadosTel(s, res.d, B.tema(at.tema)));
      mold.main.appendChild(B.esperaTel("À espera da próxima pergunta"));
    }

    /* questionário: cada participante avança ao seu ritmo */
    function renderLivre() {
      var pags = B.paginasLivres(at);
      if (!pags.length) { mold.sup("destaque"); BNA.por(mold.main, M.grande("Sem perguntas.", "Este questionário ainda não tem perguntas.")); return; }
      if (livre.fim) {
        mold.sup("destaque");
        mold._slide = null;
        BNA.por(mold.main, M.grande("Obrigado!", "As tuas respostas ficaram registadas.", el("div", { class: "ph-visto-g", "aria-hidden": "true" }, "✓")),
          el("button", { class: "ph-bt sec", type: "button", onclick: function () { livre.fim = false; livre.pos = 0; guardarLivre(); render(); } }, "Rever as minhas respostas"));
        return;
      }
      livre.pos = Math.max(0, Math.min(livre.pos, pags.length - 1));
      var s = pags[livre.pos], ultima = livre.pos === pags.length - 1;
      var respondida = !T[s.tipo].interativo || Object.keys(meus).some(function (k) { return k === s.id || k.indexOf(s.id + "-") === 0; });
      var prog = el("div", { class: "ph-prog" }, el("b", null, (livre.pos + 1) + " de " + pags.length), el("span", null, el("i", { style: { width: ((livre.pos + 1) / pags.length) * 100 + "%" } })));
      var nav = el("div", { class: "ph-nav" },
        livre.pos > 0 ? el("button", { class: "ph-bt sec", type: "button", "aria-label": "Anterior", onclick: function () { livre.pos--; guardarLivre(); render(); window.scrollTo(0, 0); } }, "‹") : null,
        el("button", { class: "ph-bt", type: "button", onclick: function () {
          if (ultima) {
            livre.fim = true; guardarLivre();
            B.db.put(B.caminho.participante(codigo, pid) + "/f", { ".sv": "timestamp" }).catch(function () {});
            render();
          } else { livre.pos++; guardarLivre(); render(); }
          window.scrollTo(0, 0);
        } }, ultima ? "Concluir" : respondida ? "Seguinte ›" : "Saltar ›"));
      var aviso = !ligado && Object.keys(pendentes).length ? el("p", { class: "ph-aviso" }, "Sem rede. As tuas respostas seguem assim que a ligação voltar.") : null;
      B.desenharTel(mold, s, ctxPara(s), [aviso, barraTempo(), prog]);
      mold.main.appendChild(nav);
    }

    if (opts.codigo) entrar(opts.codigo); else ecraEntrar();
    return { moldura: mold, entrar: entrar };
  };
})();
