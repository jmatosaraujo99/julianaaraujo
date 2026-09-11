# -*- coding: utf-8 -*-
"""Auditoria ao site publicado: o que o Google vê em cada página."""
import sys, re, json, urllib.request, urllib.error
sys.stdout.reconfigure(encoding='utf-8')

BASE = 'https://julianaaraujo.pt/'
PAGS = ['', 'recursos.html', 'roleta.html', 'dados-storytelling.html',
        'formacao-comunicacao.html', 'formacao-desenvolvimento-pessoal.html',
        'formacao-lideranca-equipas.html', 'formacao-inteligencia-artificial.html',
        'privacidade.html', 'dados-da-historia.html']


def buscar(u):
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (compatible; auditoria)'})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return e.code, ''
    except Exception as e:
        return 0, str(e)


def um(t, pat):
    m = re.search(pat, t, re.S | re.I)
    return m.group(1).strip() if m else None


def palavras(t):
    c = re.sub(r'<(script|style)[\s\S]*?</\1>', ' ', t)
    c = re.sub(r'<[^>]+>', ' ', c)
    return len([p for p in re.split(r'\s+', c) if len(p) > 1])


problemas = []
print('%-38s %4s %5s %-5s %-5s %s' % ('página', 'HTTP', 'palav', 'canon', 'idx', 'JSON-LD'))
print('-' * 92)

for p in PAGS:
    u = BASE + p
    st, t = buscar(u)
    if st != 200:
        print('%-38s %4s' % (p or '/', st)); problemas.append('%s devolve %s' % (p or '/', st)); continue

    tit = um(t, r'<title>(.*?)</title>')
    desc = um(t, r'name="description"\s+content="(.*?)"')
    can = um(t, r'rel="canonical"\s+href="(.*?)"')
    rob = um(t, r'name="robots"\s+content="(.*?)"')
    tipos = re.findall(r'"@type":"(\w+)"', t)
    tipos = [x for x in tipos if x in ('WebApplication', 'FAQPage', 'BreadcrumbList',
                                       'ProfessionalService', 'Person', 'Service')]
    h1 = len(re.findall(r'<h1[\s>]', t))
    w = palavras(t)

    canOk = 'ok' if can == u else ('FALTA' if not can else 'ERRO')
    idx = 'noidx' if rob and 'noindex' in rob else 'sim'
    print('%-38s %4d %5d %-5s %-5s %s' % (p or '/', st, w, canOk, idx, ','.join(sorted(set(tipos)))))

    esperaIndexar = p not in ('privacidade.html', 'dados-da-historia.html')
    if esperaIndexar:
        if canOk != 'ok': problemas.append('%s: canonical %s (%s)' % (p or '/', canOk, can))
        if idx != 'sim': problemas.append('%s: está com noindex' % (p or '/'))
        if not tit: problemas.append('%s: sem <title>' % (p or '/'))
        elif len(tit) > 62: problemas.append('%s: título com %d caracteres (o Google corta ~60)' % (p or '/', len(tit)))
        if not desc: problemas.append('%s: sem description' % (p or '/'))
        elif not (110 <= len(desc) <= 165): problemas.append('%s: description com %d caracteres' % (p or '/', len(desc)))
        if h1 != 1: problemas.append('%s: %d <h1>' % (p or '/', h1))
        if w < 300: problemas.append('%s: só %d palavras' % (p or '/', w))

print()
# --------------------------------------------------------------- sitemap
st, sm = buscar(BASE + 'sitemap.xml')
locs = re.findall(r'<loc>(.*?)</loc>', sm)
print('sitemap.xml: HTTP %s, %d URLs' % (st, len(locs)))
for l in locs:
    s2, _ = buscar(l)
    if s2 != 200:
        problemas.append('sitemap aponta para %s que devolve %s' % (l, s2))
if len(locs) != len(set(locs)):
    problemas.append('sitemap tem URLs repetidos')
indexaveis = set(BASE + x for x in PAGS if x not in ('privacidade.html', 'dados-da-historia.html'))
faltam = indexaveis - set(locs)
if faltam:
    problemas.append('fora do sitemap: ' + ', '.join(sorted(faltam)))

# --------------------------------------------------------------- robots
st, rb = buscar(BASE + 'robots.txt')
print('robots.txt: HTTP %s' % st)
if 'Disallow: /' in rb.replace('Disallow: /\n', '').replace('Disallow: /\r\n', ''):
    problemas.append('robots.txt bloqueia alguma coisa')
if 'sitemap.xml' not in rb.lower():
    problemas.append('robots.txt não indica o sitemap')

# --------------------------------------------------------------- cartão
st, _ = buscar(BASE + 'media/og-cartao.jpg')
print('cartão de partilha: HTTP %s' % st)
if st != 200: problemas.append('o cartão de partilha não responde')

print()
if problemas:
    print('PROBLEMAS (%d):' % len(problemas))
    for x in problemas: print('  ·', x)
else:
    print('Sem problemas.')
