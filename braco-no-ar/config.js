/* ==========================================================================
   BRAÇO NO AR · configuração
   Este é o único ficheiro que precisas de editar (podes usar o Bloco de Notas).
   ========================================================================== */

window.BNA_CONFIG = {

  // Dados da tua app Web na Firebase.
  // Firebase → ⚙ Definições do projeto → Geral → As tuas apps → Configuração do SDK.
  // Copia só estes dois valores, entre aspas:
  firebase: {
    apiKey: "AIzaSyArQL1U98gLGL3_35GTczN1p-4fep9Z-js",
    databaseURL: "https://mentimeter-bacf7-default-rtdb.europe-west1.firebasedatabase.app"
  },

  // Nome que aparece nas páginas.
  nome: "Braço no Ar",

  // (Opcional) Endereço público do site, por exemplo "https://braco-no-ar.netlify.app".
  // Se ficar vazio, é calculado automaticamente.
  site: "",

  // Mostrar o separador "Criar conta" na página de entrada do formador?
  // true: qualquer formador cria a sua conta. false: só tu crias contas na Firebase.
  permitirRegisto: true,

  // Autoria: aparece na entrada, na biblioteca, no ecrã e nos telemóveis.
  autora: {
    nome: "Juliana Araújo",
    instagram: "julianaaraujo.pt",
    site: "https://julianaaraujo.pt",
    privacidade: "https://julianaaraujo.pt/privacidade.html"
  }
};
