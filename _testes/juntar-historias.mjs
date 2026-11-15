// Junta as histórias da pasta da equipa à página, cada uma num <script data-historia="id">.
// Uso (de dentro da pasta do site): node _testes/juntar-historias.mjs <pasta-das-historias> id1 id2 …
// Se a história já estiver na página, substitui o bloco; senão, acrescenta-o depois do último.
// Tira o comentário /* IMAGENS … */ (são notas para gerar as fotografias, não vão para o site).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const PAGINA = fileURLToPath(new URL("../conversas-que-contam.html", import.meta.url));
const [pasta, ...ids] = process.argv.slice(2);
if (!pasta || !ids.length) { console.error("uso: node _testes/juntar-historias.mjs <pasta> id1 id2 …"); process.exit(1); }

let html = readFileSync(PAGINA, "utf8");
for (const id of ids) {
  let js = readFileSync(join(pasta, `historia-${id}.js`), "utf8")
    .replace(/\/\*\s*IMAGENS[\s\S]*?\*\/\s*/g, "")
    .trim();
  if (!js.startsWith("HISTORIAS.push(")) throw new Error(`${id}: o ficheiro não começa por HISTORIAS.push(`);
  if (js.includes("</script")) throw new Error(`${id}: o texto tem </script`);
  const bloco = `<script data-historia="${id}">\n${js}\n</script>`;
  const existente = new RegExp(`<script data-historia="${id}">[\\s\\S]*?</script>`);
  if (existente.test(html)) {
    html = html.replace(existente, () => bloco);
    console.log("substituída:", id);
  } else {
    const blocos = [...html.matchAll(/<script data-historia="[^"]*">[\s\S]*?<\/script>/g)];
    if (!blocos.length) throw new Error("não encontrei nenhum <script data-historia> na página");
    const ultimo = blocos[blocos.length - 1];
    const fim = ultimo.index + ultimo[0].length;
    html = html.slice(0, fim) + "\n" + bloco + html.slice(fim);
    console.log("acrescentada:", id);
  }
}
writeFileSync(PAGINA, html);
