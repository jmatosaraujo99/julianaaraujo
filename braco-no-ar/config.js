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

  // Mostrar o botão "Criar conta" na página de entrada do formador?
  // Recomendado: false (crias as contas na Firebase, em Authentication → Users).
  permitirRegisto: false
};
