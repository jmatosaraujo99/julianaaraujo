// Regenera o espelho de meta tags no <head> estático a partir do <helmet>.
// Correr sempre que se alterar qualquer meta tag, canonical, og:, twitter: ou
// JSON-LD — senão os crawlers sem JavaScript ficam a ver a versão antiga.
const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const tTag = '<script type="__bundler/template">';
const tS = html.indexOf(tTag) + tTag.length;
const tE = html.indexOf('</script>', tS);
const tpl = JSON.parse(html.slice(tS, tE));

const helmet = tpl.slice(tpl.indexOf('<helmet>'), tpl.indexOf('</helmet>'));
const pega = re => { const m = helmet.match(re); return m ? m[0] : null; };

const tags = [
  pega(/<title>[\s\S]*?<\/title>/),
  pega(/<meta name="description"[^>]*>/),
  pega(/<link rel="canonical"[^>]*>/),
  ...(helmet.match(/<meta property="og:[^>]*>/g) || []),
  ...(helmet.match(/<meta name="twitter:[^>]*>/g) || []),
  pega(/<script type="application\/ld\+json">[\s\S]*?<\/script>/),
].filter(Boolean).map(t => t.replace(/\r?\n/g, ' '));

const COMENTARIO = '  <!-- Espelho das meta tags do <helmet>';
const iIni = html.indexOf(COMENTARIO);
if (iIni < 0) { console.error('marcador do espelho não encontrado'); process.exit(1); }
const iFim = html.indexOf('  <style>', iIni);
if (iFim < 0) { console.error('fim do espelho não encontrado'); process.exit(1); }

const bloco = [
  '  <!-- Espelho das meta tags do <helmet>. O bundler substitui o documento',
  '       inteiro quando o JS corre, por isso estas não ficam duplicadas — servem',
  '       os crawlers que não executam JavaScript (WhatsApp, LinkedIn, Facebook,',
  '       Slack) e a primeira passagem de indexação.',
  '       NÃO EDITAR À MÃO: correr _sincronizar_head.js depois de alterar o helmet. -->',
  ...tags.map(t => '  ' + t),
  '',
].join('\n');

html = html.slice(0, iIni) + bloco + html.slice(iFim);
fs.writeFileSync('index.html', html, 'utf8');
console.log('espelho regenerado —', tags.length, 'tags');

// confirmar que os dois blocos ficam iguais
const RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
const check = fs.readFileSync('index.html', 'utf8');
const noHead = check.slice(0, check.indexOf('</head>')).match(RE)[1];
const cS = check.indexOf(tTag) + tTag.length, cE = check.indexOf('</script>', cS);
const noTpl = JSON.parse(check.slice(cS, cE)).match(RE)[1];
console.log('JSON-LD idêntico nos dois sítios:', noHead === noTpl);
