/* ==========================================================================
   BRAÇO NO AR · núcleo partilhado
   Ligação à Firebase (sem bibliotecas), login, temas, QR, utilitários.
   Não precisas de editar este ficheiro.
   ========================================================================== */
(function () {
  "use strict";

  var C = window.BNA_CONFIG || {};
  var F = C.firebase || {};
  var B = (window.BNA = { C: C });
  B.nome = C.nome || "Braço no Ar";

  /* ---------------- utilitários ---------------- */

  B.el = function (tag, attrs) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === "class") e.className = v;
        else if (k === "text") e.textContent = v;
        else if (k === "html") e.innerHTML = v;
        else if (k === "style" && typeof v === "object") {
          for (var p in v) {
            if (v[p] === null || v[p] === undefined) continue;
            if (p.slice(0, 2) === "--") e.style.setProperty(p, v[p]); else e.style[p] = v[p];
          }
        } else if (k.slice(0, 2) === "on" && typeof v === "function") e.addEventListener(k.slice(2), v);
        else if (k === "value") e.value = v;
        else if (k === "checked") e.checked = !!v;
        else e.setAttribute(k, v === true ? "" : v);
      }
    }
    for (var i = 2; i < arguments.length; i++) junta(e, arguments[i]);
    return e;
  };
  function junta(e, kid) {
    if (kid === null || kid === undefined || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { junta(e, k); }); return; }
    e.appendChild(typeof kid === "object" ? kid : document.createTextNode(String(kid)));
  }
  var el = B.el;

  /* substitui os filhos de um elemento, aceitando listas e ignorando vazios */
  B.por = function (no) {
    var kids = [];
    (function junta(k) { if (Array.isArray(k)) k.forEach(junta); else if (k !== null && k !== undefined && k !== false) kids.push(typeof k === "object" ? k : document.createTextNode(String(k))); })(Array.prototype.slice.call(arguments, 1));
    no.replaceChildren.apply(no, kids);
    return no;
  };

  B.css = function (id, css) {
    if (document.getElementById(id)) return;
    var s = document.createElement("style");
    s.id = id; s.textContent = css;
    document.head.appendChild(s);
  };

  B.esc = function (s) {
    return String(s === undefined || s === null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  var mem = {};
  B.store = {
    get: function (k) { try { var v = localStorage.getItem(k); return v === null ? (k in mem ? mem[k] : null) : v; } catch (e) { return k in mem ? mem[k] : null; } },
    set: function (k, v) { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { delete mem[k]; try { localStorage.removeItem(k); } catch (e) {} },
    getJSON: function (k) { try { return JSON.parse(B.store.get(k)); } catch (e) { return null; } },
    setJSON: function (k, v) { B.store.set(k, JSON.stringify(v)); }
  };

  B.aleatorio = function (n, abc) {
    abc = abc || "abcdefghijkmnpqrstuvwxyz23456789";
    var arr = new Uint32Array(n), s = "";
    try { crypto.getRandomValues(arr); } catch (e) { for (var j = 0; j < n; j++) arr[j] = Math.floor(Math.random() * 4294967295); }
    for (var i = 0; i < n; i++) s += abc[arr[i] % abc.length];
    return s;
  };
  B.novoId = function () { return "x" + B.aleatorio(8); };
  B.novoCodigo = function () { return B.aleatorio(1, "123456789") + B.aleatorio(5, "0123456789"); };
  B.fmtCodigo = function (c) { c = String(c || ""); return c.length === 6 ? c.slice(0, 3) + " " + c.slice(3) : c; };
  B.clone = function (o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); };
  B.virgula = function (x, casas) { return (isFinite(x) ? x : 0).toFixed(casas === undefined ? 1 : casas).replace(".", ","); };
  B.milhares = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); };
  B.pct = function (n, t) { return t ? Math.round((n / t) * 100) : 0; };
  B.duracao = function (seg) {
    seg = Math.round(Number(seg) || 0);
    if (seg < 60) return seg + " segundos";
    var m = Math.floor(seg / 60), r = seg % 60;
    return (m === 1 ? "1 minuto" : m + " minutos") + (r ? " e " + r + " segundos" : "");
  };
  B.mmss = function (ms) { var t = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(t / 60), s = t % 60; return m + ":" + String(s).padStart(2, "0"); };
  B.debounce = function (f, ms) {
    var t = null;
    var g = function () { var a = arguments, self = this; clearTimeout(t); t = setTimeout(function () { t = null; f.apply(self, a); }, ms); };
    g.agora = function () { if (t) { clearTimeout(t); t = null; f(); } };
    g.pendente = function () { return !!t; };
    return g;
  };
  B.data = function (ts) {
    if (!ts) return "";
    var d = new Date(ts);
    var m = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][d.getMonth()];
    return d.getDate() + " " + m + " " + d.getFullYear() + ", " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  };
  B.idAluno = function () {
    var id = B.store.get("bna-pid");
    if (!id || !/^[a-z0-9]{8,20}$/.test(id)) { id = B.aleatorio(12); B.store.set("bna-pid", id); }
    return id;
  };
  /* chave segura para a Firebase (sem . $ # [ ] /) */
  B.chave = function (s) {
    return encodeURIComponent(String(s)).replace(/\./g, "%2E").replace(/[\[\]#$]/g, "_").slice(0, 120);
  };

  /* ---------------- configuração ---------------- */

  function normalizarUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    return u.replace(/\/+$/, "");
  }
  B.dbUrl = normalizarUrl(F.databaseURL);
  B.apiKey = String(F.apiKey || "").trim();
  B.configurado = !!(B.dbUrl && B.apiKey);
  B.demo = !B.configurado || /[?&]demo\b/.test(location.search);

  B.urlSite = function () {
    if (C.site) return normalizarUrl(C.site) + "/";
    if (/^https?:$/.test(location.protocol)) return new URL("./", location.href).href;
    return new URL("index.html", location.href).href;
  };
  B.linkEntrar = function (codigo) {
    var u = B.urlSite();
    return u + (u.indexOf("?") >= 0 ? "&" : "?") + "c=" + codigo + (B.demo ? "&demo" : "");
  };
  B.siteCurto = function () {
    if (window.BNA_ARTEFACTO) return ""; /* demonstração publicada: não mostra o endereço da página */
    try {
      var u = new URL(B.urlSite());
      if (!/^https?:$/.test(u.protocol)) return "";
      return (u.host + u.pathname).replace(/index\.html$/, "").replace(/\/$/, "");
    } catch (e) { return ""; }
  };

  /* ---------------- login (Firebase Authentication, REST) ---------------- */

  var AUTH_URL = C.authUrl || "https://identitytoolkit.googleapis.com/v1";
  var TOKEN_URL = C.tokenUrl || "https://securetoken.googleapis.com/v1";

  function traduzirErro(m) {
    m = String(m || "");
    if (/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND/.test(m)) return "Email ou palavra-passe errados.";
    if (/USER_DISABLED/.test(m)) return "Esta conta foi desativada.";
    if (/TOO_MANY_ATTEMPTS/.test(m)) return "Demasiadas tentativas. Espera uns minutos e tenta outra vez.";
    if (/EMAIL_EXISTS/.test(m)) return "Já existe uma conta com este email.";
    if (/WEAK_PASSWORD/.test(m)) return "A palavra-passe tem de ter pelo menos 6 caracteres.";
    if (/INVALID_EMAIL|MISSING_EMAIL/.test(m)) return "Este email não é válido.";
    if (/MISSING_PASSWORD/.test(m)) return "Falta a palavra-passe.";
    if (/OPERATION_NOT_ALLOWED|PASSWORD_LOGIN_DISABLED/.test(m)) return "O login por email não está ativo na Firebase (Authentication → Sign-in method → Email/Password).";
    if (/API key not valid|API_KEY_INVALID/.test(m)) return "A chave apiKey em config.js não é válida.";
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "Sem ligação à internet.";
    return "Não foi possível entrar (" + m + ").";
  }
  function pedirJson(url, body, form) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": form ? "application/x-www-form-urlencoded" : "application/json" },
      body: form ? body : JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) {
          var e = new Error(traduzirErro(j && j.error && j.error.message));
          e.codigo = j && j.error && j.error.message;
          throw e;
        }
        return j;
      });
    }, function (err) { var e = new Error(traduzirErro(err && err.message)); e.rede = true; throw e; });
  }

  var Auth = (B.auth = {
    s: B.store.getJSON("bna-auth"),
    ouvintes: [],
    ativo: function () { return !!(this.s && this.s.refreshToken); },
    uid: function () { return this.s ? this.s.uid : null; },
    email: function () { return this.s ? this.s.email : ""; },
    _guardar: function (uid, email, id, ref, exp) {
      this.s = { uid: uid, email: email, idToken: id, refreshToken: ref, expira: Date.now() + (Number(exp) || 3600) * 1000 };
      B.store.setJSON("bna-auth", this.s);
    },
    entrar: function (email, senha) {
      var self = this;
      if (B.demo) { self._guardar("demo", email || "demo@exemplo.pt", "demo", "demo", 86400); return Promise.resolve(); }
      return pedirJson(AUTH_URL + "/accounts:signInWithPassword?key=" + B.apiKey, { email: email, password: senha, returnSecureToken: true })
        .then(function (j) { self._guardar(j.localId, j.email, j.idToken, j.refreshToken, j.expiresIn); });
    },
    registar: function (email, senha) {
      var self = this;
      return pedirJson(AUTH_URL + "/accounts:signUp?key=" + B.apiKey, { email: email, password: senha, returnSecureToken: true })
        .then(function (j) { self._guardar(j.localId, j.email, j.idToken, j.refreshToken, j.expiresIn); });
    },
    recuperar: function (email) {
      return pedirJson(AUTH_URL + "/accounts:sendOobCode?key=" + B.apiKey, { requestType: "PASSWORD_RESET", email: email });
    },
    token: function () {
      if (!this.s) return Promise.reject(new Error("Sessão terminada. Entra outra vez."));
      if (B.demo) return Promise.resolve("demo");
      if (Date.now() < this.s.expira - 120000) return Promise.resolve(this.s.idToken);
      return this._renovar().then(function () { return Auth.s.idToken; });
    },
    _renovar: function () {
      var self = this;
      if (this._p) return this._p;
      this._p = pedirJson(TOKEN_URL + "/token?key=" + B.apiKey,
        "grant_type=refresh_token&refresh_token=" + encodeURIComponent(this.s.refreshToken), true)
        .then(function (j) { self._guardar(j.user_id, self.s.email, j.id_token, j.refresh_token, j.expires_in); })
        .catch(function (e) {
          if (!e.rede) { self.sair(); }
          throw e;
        })
        .then(function (x) { self._p = null; return x; }, function (e) { self._p = null; throw e; });
      return this._p;
    },
    sair: function () { this.s = null; B.store.del("bna-auth"); }
  });
  /* uma sessão de demonstração não serve quando já há Firebase ligada (e vice-versa) */
  if (Auth.s && ((!B.demo && Auth.s.uid === "demo") || (B.demo && Auth.s.uid !== "demo"))) { Auth.s = null; if (!B.demo) B.store.del("bna-auth"); }

  /* ---------------- base de dados (Firebase Realtime Database, REST) ---------------- */

  function erroDb(status, detalhe) {
    var msg = "Erro na base de dados (" + status + ").";
    if (status === 401 || status === 403) msg = "A base de dados recusou o pedido. Confirma as regras de segurança (ver instruções).";
    else if (status === 404) msg = "Endereço da base de dados não encontrado. Confirma databaseURL em config.js.";
    else if (status === 0) msg = "Sem ligação à internet.";
    var e = new Error(msg); e.status = status; e.detalhe = detalhe; return e;
  }

  var Db = (B.db = {
    url: function (path, q, comAuth) {
      var partes = [];
      if (q) for (var k in q) partes.push(k + "=" + encodeURIComponent(q[k]));
      var base = B.dbUrl + "/" + String(path).split("/").map(encodeURIComponent).join("/") + ".json";
      if (!comAuth) return Promise.resolve(base + (partes.length ? "?" + partes.join("&") : ""));
      return Auth.token().then(function (t) {
        partes.push("auth=" + encodeURIComponent(t));
        return base + "?" + partes.join("&");
      });
    },
    req: function (method, path, body, o) {
      o = o || {};
      if (B.demo) return Local.req(method, path, body, o);
      var q = {};
      if (method !== "GET" && method !== "DELETE") q.print = "silent";
      if (o.shallow) q.shallow = "true";
      return Db.url(path, q, o.auth).then(function (u) {
        var opt = { method: method, cache: "no-store" };
        if (body !== undefined) opt.body = JSON.stringify(body);
        return fetch(u, opt).catch(function () { throw erroDb(0); });
      }).then(function (r) {
        if (r.status === 204) return null;
        if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { throw erroDb(r.status, j && j.error); });
        return r.json();
      });
    },
    get: function (p, o) { return Db.req("GET", p, undefined, o); },
    put: function (p, v, o) { return Db.req("PUT", p, v, o); },
    patch: function (p, v, o) { return Db.req("PATCH", p, v, o); },
    del: function (p, o) { return Db.req("DELETE", p, undefined, o); },

    /* Ouve um caminho: tempo real quando dá (EventSource), senão pergunta de x em x segundos.
       cb(dados, ok, erro) */
    ouvir: function (path, cb, o) {
      o = o || {};
      if (B.demo) return Local.ouvir(path, cb);
      var arvore = null, es = null, parado = false, timer = null, falhas = 0;
      var lento = o.intervalo || 2000, intervalo = lento;
      function aplicar(p, data) {
        var partes = String(p || "/").split("/").filter(Boolean);
        if (!partes.length) { arvore = data; return; }
        if (!arvore || typeof arvore !== "object") arvore = {};
        var x = arvore;
        for (var i = 0; i < partes.length - 1; i++) {
          if (!x[partes[i]] || typeof x[partes[i]] !== "object") x[partes[i]] = {};
          x = x[partes[i]];
        }
        var ult = partes[partes.length - 1];
        if (data === null) delete x[ult]; else x[ult] = data;
      }
      function avisar(ok, err) { if (!parado) cb(arvore, ok, err); }
      function abrirSse() {
        if (parado) return;
        Db.url(path, {}, o.auth).then(function (u) {
          if (parado) return;
          es = new EventSource(u);
          intervalo = 15000;
          es.addEventListener("put", function (ev) {
            falhas = 0;
            try { var m = JSON.parse(ev.data); aplicar(m.path, m.data); avisar(true); } catch (e) {}
          });
          es.addEventListener("patch", function (ev) {
            falhas = 0;
            try {
              var m = JSON.parse(ev.data), base = String(m.path || "/").replace(/\/$/, "");
              for (var k in m.data) aplicar(base + "/" + k, m.data[k]);
              avisar(true);
            } catch (e) {}
          });
          es.addEventListener("auth_revoked", function () { fecharSse(); abrirSse(); });
          es.addEventListener("cancel", function () { fecharSse(); intervalo = lento; agendar(0); });
          es.onerror = function () {
            falhas++;
            if (es && (falhas >= 3 || es.readyState === 2)) { fecharSse(); intervalo = lento; agendar(0); }
          };
        }).catch(function () { intervalo = lento; });
      }
      function fecharSse() { if (es) { es.close(); es = null; } }
      function ciclo() {
        if (parado) return;
        Db.get(path, { auth: o.auth }).then(function (t) { arvore = t; avisar(true); })
          .catch(function (e) { avisar(false, e); })
          .then(function () { agendar(document.hidden && o.semSse ? Math.max(intervalo, 5000) : intervalo); });
      }
      function agendar(ms) { clearTimeout(timer); if (!parado) timer = setTimeout(ciclo, ms); }
      if (!o.semSse && window.EventSource) abrirSse();
      ciclo();
      function acordar() { if (!document.hidden && !parado) { agendar(0); } }
      document.addEventListener("visibilitychange", acordar);
      return function () { parado = true; clearTimeout(timer); fecharSse(); document.removeEventListener("visibilitychange", acordar); };
    }
  });

  /* ---------------- modo de demonstração (tudo neste browser) ---------------- */

  var PAPEL = window.BNA_PAPEL || "formador", CHAVE_DEMO = "bna-demo-db";
  function carregarDemo() { return B.store.getJSON(CHAVE_DEMO) || {}; }
  function aplicar(raiz, partes, v) {
    if (!partes.length) return v || {};
    var o = raiz;
    for (var i = 0; i < partes.length - 1; i++) {
      if (!o[partes[i]] || typeof o[partes[i]] !== "object") o[partes[i]] = {};
      o = o[partes[i]];
    }
    if (v === null || v === undefined) delete o[partes[partes.length - 1]];
    else o[partes[partes.length - 1]] = B.clone(v);
    return raiz;
  }
  var Local = (B.local = {
    db: B.demo && PAPEL !== "aluno" ? carregarDemo() : {},
    ouvintes: [],
    canal: null,
    _get: function (partes) {
      var o = this.db;
      for (var i = 0; i < partes.length; i++) { if (!o || typeof o !== "object") return null; o = o[partes[i]]; }
      return o === undefined ? null : o;
    },
    /* origem: undefined = este separador; senão o papel do separador que mudou */
    _set: function (partes, v, origem) {
      this.db = aplicar(this.db, partes, v);
      var persistir = origem === undefined ? PAPEL !== "aluno" : (origem === "aluno" && PAPEL === "ecra");
      if (persistir) { try { B.store.setJSON(CHAVE_DEMO, aplicar(carregarDemo(), partes, v)); } catch (e) {} }
      if (origem === undefined && this.canal) { try { this.canal.postMessage({ p: partes, v: v, papel: PAPEL }); } catch (e) {} }
      this._avisar();
    },
    _avisar: function () {
      var self = this;
      if (this._pend) return;
      this._pend = true;
      setTimeout(function () { self._pend = false; self.ouvintes.slice().forEach(function (f) { f(); }); }, 0);
    },
    _resolverSv: function (v) {
      if (v && typeof v === "object") {
        if (v[".sv"] === "timestamp") return Date.now();
        var o = Array.isArray(v) ? [] : {};
        for (var k in v) o[k] = Local._resolverSv(v[k]);
        return o;
      }
      return v;
    },
    req: function (method, path, body, o) {
      var partes = path.split("/").filter(Boolean);
      var v = B.clone(this._resolverSv(body));
      if (method === "GET") {
        if (PAPEL === "aluno" && !this._recebeu) {
          var self = this;
          return new Promise(function (ok) { setTimeout(ok, 120); }).then(function () {
            self._espera = (self._espera || 0) + 1;
            if (self._espera > 12) self._recebeu = true;
            return self.req(method, path, body, o);
          });
        }
        if (PAPEL === "formador") this.db = carregarDemo();
        var r = B.clone(this._get(partes));
        if (o && o.shallow && r && typeof r === "object") { var s = {}; for (var k in r) s[k] = true; r = s; }
        return Promise.resolve(r === undefined ? null : r);
      }
      if (method === "PUT") this._set(partes, v);
      else if (method === "PATCH") { for (var k2 in v) this._set(partes.concat(k2.split("/").filter(Boolean)), v[k2]); }
      else if (method === "DELETE") this._set(partes, null);
      return Promise.resolve(null);
    },
    ouvir: function (path, cb) {
      var self = this, partes = path.split("/").filter(Boolean), ultimo = "";
      var f = function () {
        var d = self._get(partes), j = JSON.stringify(d);
        if (j === ultimo) return;
        ultimo = j;
        cb(B.clone(d), true);
      };
      this.ouvintes.push(f);
      setTimeout(f, 0);
      return function () { self.ouvintes = self.ouvintes.filter(function (g) { return g !== f; }); };
    }
  });
  if (B.demo) {
    try {
      Local.canal = new BroadcastChannel("bna-demo");
      Local.canal.onmessage = function (ev) {
        var m = ev.data || {};
        if (m.tudo) { if (PAPEL === "aluno") { Local.db = m.tudo; Local._recebeu = true; Local._avisar(); } }
        else if (m.ola) { if (PAPEL === "ecra") Local.canal.postMessage({ tudo: Local.db }); }
        else if (m.p) Local._set(m.p, m.v, m.papel || "?");
      };
      if (PAPEL === "aluno") Local.canal.postMessage({ ola: 1 });
    } catch (e) {}
  }

  /* ---------------- relógio do servidor ----------------
     Cada aparelho tem o seu relógio (às vezes com segundos de diferença). Medimos a
     diferença para o relógio da Firebase, para que o tempo do quiz seja igual em todos. */
  B.relogio = { offset: 0, medido: false };
  B.agora = function () { return Date.now() + B.relogio.offset; };
  B.acertarRelogio = function (t0, t1, servidor) {
    if (typeof servidor !== "number" || !isFinite(servidor) || B.demo) return;
    var off = servidor - (t0 + t1) / 2;
    if (Math.abs(off) < 12 * 3600 * 1000) { B.relogio.offset = off; B.relogio.medido = true; }
  };

  /* ---------------- caminhos e regras do jogo ---------------- */

  B.caminho = {
    atividades: function (uid) { return "u/" + uid + "/atividades"; },
    atividade: function (uid, aid) { return "u/" + uid + "/atividades/" + aid; },
    indiceSessoes: function (uid) { return "u/" + uid + "/sessoes"; },
    indiceSessao: function (uid, c) { return "u/" + uid + "/sessoes/" + c; },
    sessao: function (c) { return "sessoes/" + c; },
    respostas: function (c) { return "respostas/" + c; },
    resposta: function (c, s, p) { return "respostas/" + c + "/" + s + "/" + p; },
    participantes: function (c) { return "participantes/" + c; },
    participante: function (c, p) { return "participantes/" + c + "/" + p; },
    pontos: function (c) { return "sessoes/" + c + "/pts"; },
    perguntas: function (c) { return "sessoes/" + c + "/qa"; },
    imagem: function (uid, id) { return "u/" + uid + "/imagens/" + id; }
  };

  /* ---------------- imagens (guardadas à parte, só para o formador) ---------------- */
  B.imagens = {
    cache: {},
    url: function (uid, id) {
      var self = this;
      if (!id) return Promise.resolve(null);
      if (self.cache[id]) return Promise.resolve(self.cache[id]);
      if (self["_p" + id]) return self["_p" + id];
      var p = B.demo ? Promise.resolve(B.store.get("bna-img-" + id)) : Db.get(B.caminho.imagem(uid, id) + "/d", { auth: true });
      self["_p" + id] = p.then(function (d) { delete self["_p" + id]; if (d) self.cache[id] = d; return d || null; },
        function () { delete self["_p" + id]; return null; });
      return self["_p" + id];
    },
    guardar: function (uid, dataUrl) {
      var id = "i" + B.aleatorio(10);
      this.cache[id] = dataUrl;
      if (B.demo) {
        try { localStorage.setItem("bna-img-" + id, dataUrl); }
        catch (e) { return Promise.reject(new Error("Não há espaço neste browser para mais imagens (modo de demonstração).")); }
        return Promise.resolve(id);
      }
      return Db.put(B.caminho.imagem(uid, id), { d: dataUrl, t: { ".sv": "timestamp" } }, { auth: true }).then(function () { return id; });
    }
  };
  /* reduz uma fotografia para caber bem no ecrã sem pesar (JPEG até ~1600 px) */
  B.reduzirImagem = function (ficheiro, max) {
    max = max || 1600;
    return new Promise(function (ok, falha) {
      if (!ficheiro || !/^image\//.test(ficheiro.type)) return falha(new Error("Escolhe um ficheiro de imagem (JPG, PNG…)."));
      var leitor = new FileReader();
      leitor.onerror = function () { falha(new Error("Não deu para ler a imagem.")); };
      leitor.onload = function () {
        var img = new Image();
        img.onerror = function () { falha(new Error("Este formato de imagem não é suportado.")); };
        img.onload = function () {
          var tentar = function (lado, q) {
            var k = Math.min(1, lado / Math.max(img.width, img.height));
            var w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
            var cv = document.createElement("canvas"); cv.width = w; cv.height = h;
            var g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
            var d = cv.toDataURL("image/jpeg", q);
            if (d.length > 520000 && lado > 700) return tentar(Math.round(lado * 0.8), Math.max(0.6, q - 0.08));
            return d;
          };
          ok(tentar(max, 0.84));
        };
        img.src = leitor.result;
      };
      leitor.readAsDataURL(ficheiro);
    });
  };


  /* versão pública da atividade (sem respostas certas nem explicações) */
  B.conteudoPublico = function (at) {
    var c = B.clone(at);
    (c.slides || []).forEach(function (s) {
      if (s.tipo === "quiz") { delete s.certa; delete s.explicacao; }
    });
    return c;
  };

  /* ---------------- temas ---------------- */

  B.temas = {
    tenda: { nome: "Tenda", claro: "#f3eee5", escuro: "#132a27", destaque: "#1e7e75", acento: "#fdc200", tinta: "#132a27", salvia: "#8fb3a8",
      cores: ["#e3562d", "#3ea6d5", "#8d7cbd", "#fea500", "#fdc200", "#3cb38a", "#e26d9a", "#5f7f9a"] },
    ardosia: { nome: "Ardósia", claro: "#eef0f5", escuro: "#191c2b", destaque: "#2e3a8c", acento: "#ff8a5c", tinta: "#191c2b", salvia: "#a3acd6",
      cores: ["#ff8a5c", "#4cc3e8", "#b892f0", "#ffd25a", "#2fd19b", "#f25f8b", "#7f8cff", "#c9cfdf"] },
    papel: { nome: "Papel", claro: "#ffffff", escuro: "#141414", destaque: "#e9e4da", acento: "#2b5cff", tinta: "#141414", salvia: "#8a8a8a",
      cores: ["#2b5cff", "#ff5a36", "#141414", "#ffb800", "#00a86b", "#9a5cff", "#ff7ab6", "#7a8a99"] },
    laranjal: { nome: "Laranjal", claro: "#fff4e8", escuro: "#2a1408", destaque: "#e8560f", acento: "#ffd23f", tinta: "#2a1408", salvia: "#f2b38c",
      cores: ["#e8560f", "#2f7a5f", "#ffd23f", "#7a3b9a", "#3a86c8", "#d63a5a", "#9cbf3c", "#8a6a50"] }
  };
  B.tema = function (id) { return B.temas[id] || B.temas.tenda; };

  function lum(hex) {
    var h = String(hex).replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    var r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
    function c(x) { return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }
    return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
  }
  B.claro = function (hex) { try { return lum(hex) > 0.4; } catch (e) { return false; } };
  B.tintaSobre = function (hex, t) { return B.claro(hex) ? (t ? t.escuro : "#132a27") : "#ffffff"; };
  B.cor = function (t, i) { return t.cores[i % t.cores.length]; };

  /* define as variáveis de cor de um tema num elemento */
  B.aplicarTema = function (elem, id) {
    var t = B.tema(id);
    var s = elem.style;
    s.setProperty("--t-claro", t.claro);
    s.setProperty("--t-escuro", t.escuro);
    s.setProperty("--t-destaque", t.destaque);
    s.setProperty("--t-acento", t.acento);
    s.setProperty("--t-acento-tinta", B.tintaSobre(t.acento, t));
    s.setProperty("--t-tinta", t.tinta);
    s.setProperty("--t-salvia", t.salvia);
    s.setProperty("--t-destaque-tinta", B.tintaSobre(t.destaque, t));
    s.setProperty("--t-kicker-claro", B.claro(t.destaque) ? t.acento : t.destaque);
    t.cores.forEach(function (c, i) { s.setProperty("--c" + i, c); });
    return t;
  };

  /* ---------------- código QR ---------------- */

  B.qrSvg = function (texto, escuro, claro) {
    var qr = window.qrcode(0, "M");
    qr.addData(texto);
    qr.make();
    var n = qr.getModuleCount(), m = 2, tot = n + m * 2, d = "";
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (qr.isDark(y, x)) d += "M" + (x + m) + "," + (y + m) + "h1v1h-1z";
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + tot + " " + tot + '" shape-rendering="crispEdges" role="img" aria-label="Código QR">' +
      '<rect width="100%" height="100%" fill="' + (claro || "#fff") + '"/><path d="' + d + '" fill="' + (escuro || "#111") + '"/></svg>';
  };

  /* ---------------- filtro de palavras impróprias ---------------- */
  /* Esconde automaticamente do ecrã. O formador pode esconder outras com um clique. */

  /* Lista curta e conservadora: só insultos e palavrões claros. Palavras comuns em
     português de Portugal (ex.: «atrasado», «bicha» no sentido de fila) ficam de fora. */
  var IMPROPRIAS = ("caralho caralhos caralhinho crl krl kralho foda fodas fode foder fodase fodasse foda-se fode-te fodido fodida fodidos fodidas fodam fodeu fodeste " +
    "merda merdas merdoso puta putas putaria putedo cona conas piça picha pissa cabrao cabroes cabrona paneleiro paneleiros panasca " +
    "corno cornos cornudo mamada broche broches punheta punhetas porra porras bosta cagar cu cuzao rabeta otario otaria " +
    "imbecil idiota idiotas estupido estupida estupidos mongoloide retardado retardada badalhoca badalhoco vadia vadias prostituta " +
    "fdp pqp vsf tnc vtnc filhodaputa filhadaputa pila pilas tesao nazi nazis hitler").split(" ");
  B.semAcentos = function (s) { return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };
  var setImproprias = {};
  IMPROPRIAS.forEach(function (w) { setImproprias[B.semAcentos(w)] = true; });
  function normalizarParaFiltro(t) {
    return B.semAcentos(String(t).toLowerCase())
      .replace(/[0@4]/g, function (c) { return c === "0" ? "o" : "a"; })
      .replace(/[1!]/g, "i").replace(/3/g, "e").replace(/[$5]/g, "s").replace(/7/g, "t");
  }
  B.improprio = function (texto) {
    var t = normalizarParaFiltro(texto);
    if (/filh[oa]s?\s*d[ae]\s*puta|vai\s*(te|se)\s*f[ou]d|fo+d+a+-?\s*s+e+|p\s*[*.]\s*t\s*a\b|m\s*[*.]\s*r\s*d\s*a/.test(t)) return true;
    var palavras = t.split(/[^a-z0-9-]+/);
    for (var i = 0; i < palavras.length; i++) {
      var w = palavras[i].replace(/(.)\1{2,}/g, "$1$1"), w1 = w.replace(/(.)\1+/g, "$1");
      if (setImproprias[w] || setImproprias[w1] || setImproprias[w.replace(/s$/, "")]) return true;
    }
    return false;
  };
  B.normalizarPalavra = function (w) {
    return String(w || "").toLowerCase().replace(/\s+/g, " ").replace(/^[\s"'«»“”.,;:!?()-]+|[\s"'«»“”.,;:!?()-]+$/g, "").slice(0, 30);
  };

  /* ---------------- fontes ---------------- */

  if (!window.BNA_FONTES_EXTERNAS) B.css("bna-fontes",
    "@font-face{font-family:'Anton';src:url('fontes/anton.woff2') format('woff2');font-weight:400;font-display:swap}" +
    "@font-face{font-family:'Archivo';src:url('fontes/archivo-400.woff2') format('woff2');font-weight:400;font-display:swap}" +
    "@font-face{font-family:'Archivo';src:url('fontes/archivo-600.woff2') format('woff2');font-weight:600;font-display:swap}" +
    "@font-face{font-family:'Archivo';src:url('fontes/archivo-800.woff2') format('woff2');font-weight:800;font-display:swap}");
})();
