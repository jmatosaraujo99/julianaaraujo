// Copia o bloco :root de tokens.css para dentro do <style> do bundle e confirma
// que os dois ficam iguais.
//
//   node _sincronizar_tokens.js            aplica
//   node _sincronizar_tokens.js --verificar   só verifica, não escreve
//
// Porquê duplicar: o index.html é um bundle autónomo que substitui o documento
// inteiro quando o JS corre. Se fosse buscar tokens.css por <link>, as cores
// só chegariam depois de a folha carregar — piscadela em cada visita. A cópia
// evita isso; este script garante que não diverge.

const fs = require('fs');

const BS = String.fromCharCode(92);
const NL = String.fromCharCode(10);
const TAG = '<script type="__bundler/template">';
const FECHO = '<' + '/script>';
const ANCORA = '*{box-sizing:border-box}';
const INICIO = '/* TOKENS-INICIO — gerado a partir de tokens.css por _sincronizar_tokens.js. NÃO EDITAR À MÃO. */';
const FIM = '/* TOKENS-FIM */';

const soVerificar = process.argv.includes('--verificar');

function morrer(msg) { console.error('ABORTADO: ' + msg); process.exit(1); }

// Procura valores da marca escritos à mão onde já deviam ser var(--token).
// Não aborta: há exceções legítimas, e uma verificação que grita por tudo
// acaba ignorada. Serve para as regressões ficarem à vista.
function relatorioDeriva() {
  const PAGINAS = ['privacidade.html', 'recursos.html', 'formacao-comunicacao.html',
    'formacao-desenvolvimento-pessoal.html', 'formacao-lideranca-equipas.html',
    'formacao-inteligencia-artificial.html', 'roleta.html'];
  const RE = /(#(?:1F2ED6|F2EFEA|0A0A0A|D9D2C5|6B665D|57524B|8C877F|1DB954|7B2FF7|FF6B35|00B4D8|FFC400|00BFA6|FF4D8D|FF5747)\b)|(letter-spacing:\s*-?\.?[0-9][^;}"']*)|(font-family:\s*(?:Anton|Archivo)[^;}"']*)/gi;

  const achados = [];
  for (const p of PAGINAS) {
    if (!fs.existsSync(p)) continue;
    // fora os <script>: lá dentro as cores são dados (paletas da roda,
    // cálculo de contraste), não estilo, e o canvas não lê var(--token)
    const t = fs.readFileSync(p, 'utf8').replace(/<script[\s\S]*?<\/script>/gi, ' ');
    let m;
    const re = new RegExp(RE.source, 'gi');
    while ((m = re.exec(t))) {
      if (m[0].indexOf('var(') >= 0) continue;
      achados.push(p + '  ' + m[0].trim().slice(0, 46));
    }
  }

  console.log('');
  if (achados.length === 0) {
    console.log('deriva nas páginas estáticas: nenhuma');
  } else {
    console.log('valores à mão nas páginas estáticas (' + achados.length + '):');
    achados.forEach(a => console.log('  ' + a));
    console.log('  — se for novo, troca por var(--token); se for exceção, deixa e regista aqui');
  }
  console.log('exceções conhecidas: privacidade.html 0.12em (valor único);');
  console.log('  roleta.html — letter-spacing .06/.08/.1em e 0 são da micro-tipografia da');
  console.log('  própria ferramenta, não da marca;');
  console.log('  index.html — @font-face, o <style> de recurso pré-JS e o código do Component');
}

// ---------- ler tokens.css ----------
const css = fs.readFileSync('tokens.css', 'utf8');
const rIni = css.indexOf(':root');
const rFim = css.indexOf('}', rIni);
if (rIni < 0 || rFim < 0) morrer('não encontrei o bloco :root em tokens.css');
const corpo = css.slice(css.indexOf('{', rIni) + 1, rFim);

// declarações, sem comentários nem espaços supérfluos.
// Apanha os pares --nome:valor diretamente, para não depender de o bloco vir
// com ou sem o ":root{" à frente.
function declaracoes(texto) {
  const limpo = texto.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const mapa = new Map();
  const re = /(--[A-Za-z0-9_-]+)\s*:\s*([^;}]+)/g;
  let m;
  while ((m = re.exec(limpo))) {
    mapa.set(m[1], m[2].trim().replace(/\s+/g, ' '));
  }
  return mapa;
}

const tokens = declaracoes(corpo);
if (tokens.size === 0) morrer('tokens.css não tem declarações');

const compacto = ':root{' + [...tokens].map(([n, v]) => n + ':' + v).join(';') + '}';
const bloco = INICIO + NL + compacto + NL + FIM;

// ---------- abrir o bundle ----------
const html = fs.readFileSync('index.html', 'utf8');
const tS = html.indexOf(TAG) + TAG.length;
const tE = html.indexOf(FECHO, tS);
if (tS < TAG.length || tE < 0) morrer('template do bundler não encontrado');
const tpl = JSON.parse(html.slice(tS, tE));

// ---------- estado atual ----------
const jaIni = tpl.indexOf(INICIO);
const jaFim = tpl.indexOf(FIM);

if (jaIni >= 0 && jaFim > jaIni) {
  const atual = declaracoes(tpl.slice(jaIni + INICIO.length, jaFim));
  const iguais = atual.size === tokens.size &&
    [...tokens].every(([n, v]) => atual.get(n) === v);
  console.log('tokens no bundle: ' + atual.size + ' | em tokens.css: ' + tokens.size);
  console.log('iguais: ' + iguais);
  if (iguais) { console.log('nada a fazer'); relatorioDeriva(); process.exit(0); }
  if (soVerificar) morrer('o bundle está dessincronizado de tokens.css');
} else {
  console.log('bundle ainda sem bloco de tokens — vai ser inserido');
  if (soVerificar) morrer('o bundle não tem o bloco de tokens');
}

// ---------- substituir ou inserir ----------
let novoTpl;
if (jaIni >= 0 && jaFim > jaIni) {
  novoTpl = tpl.slice(0, jaIni) + bloco + tpl.slice(jaFim + FIM.length);
} else {
  const a = tpl.indexOf(ANCORA);
  if (a < 0) morrer('âncora "' + ANCORA + '" não encontrada no <style> do bundle');
  novoTpl = tpl.slice(0, a) + bloco + NL + tpl.slice(a);
}

// ---------- validar o Component ----------
const marca = '<script type="text/x-dc"';
const ini = novoTpl.indexOf(marca);
if (ini < 0) morrer('bloco text/x-dc não encontrado');
const abre = novoTpl.indexOf('>', ini) + 1;
const codigo = novoTpl.slice(abre, novoTpl.indexOf(FECHO, abre));
try {
  new Function('DCLogic', 'React', codigo + NL + 'return Component;');
} catch (e) {
  morrer('o Component deixou de compilar — ' + e.message);
}

// ---------- serializar, escapar, reinserir ----------
const serial = JSON.stringify(novoTpl).split('<' + '/').join('<' + BS + 'u002F');
const novoHtml = html.slice(0, tS) + serial + html.slice(tE);

const rS = novoHtml.indexOf(TAG) + TAG.length;
const rE = novoHtml.indexOf(FECHO, rS);
const volta = JSON.parse(novoHtml.slice(rS, rE));
if (volta !== novoTpl) morrer('o round-trip falhou');
if (novoHtml.slice(tS, rE).indexOf(FECHO) >= 0) morrer('sobrou um ' + FECHO + ' literal');

fs.writeFileSync('index.html', novoHtml, 'utf8');
console.log('index.html sincronizado — ' + tokens.size + ' tokens');
relatorioDeriva();
