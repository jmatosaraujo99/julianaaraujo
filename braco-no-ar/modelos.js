/* ==========================================================================
   BRAÇO NO AR · modelos de atividades (pontos de partida)
   ========================================================================== */
(function () {
  "use strict";
  var B = window.BNA;

  var cinco = ["Dares a volta quando o plano muda", "Explicares de forma que toda a gente perceba", "Discordares e continuares na mesma equipa", "Fazeres a pergunta certa antes de começar", "Apareceres"];
  var DZM = ["Só diz", "Quase", "Mostra!"];

  B.modelos = [
    {
      id: "branco", nome: "Em branco", desc: "Começa com uma pergunta de escolha múltipla.",
      atividade: function () { return { titulo: "Nova atividade", tema: "tenda", pedirAlcunha: false, slides: [B.novoSlide("escolha")] }; }
    },
    {
      id: "raiox", nome: "Raio-X da tenda", desc: "Competências transversais: raio-X inicial, o jogo «Contratado!» e perguntas da sala no fim (13 diapositivos).",
      atividade: function () {
        return {
          titulo: "Raio-X da tenda", tema: "tenda", pedirAlcunha: false, slides: [
            { id: "forte", tipo: "escolha", etiqueta: "Raio-X · 1 de 3", pergunta: "Em qual destas cinco és mais forte?", opcoes: cinco.slice(), multipla: false, esconder: false },
            { id: "custa", tipo: "escolha", etiqueta: "Raio-X · 2 de 3", pergunta: "E qual é a que te custa mais?", opcoes: cinco.slice(), multipla: false, esconder: false },
            { id: "tenho", tipo: "escala", etiqueta: "Raio-X · 3 de 3", pergunta: "Quantas destas cinco achas que já tens?", afirmacoes: [""], min: 0, max: 5, rotMin: "Nenhuma", rotMax: "Todas", esconder: false, comparar: "", rotuloA: "Antes", rotuloB: "Agora", frase: "" },
            { id: "pausa", tipo: "texto", etiqueta: "Até já", titulo: "Telemóvel no bolso.", texto: "Não feches a página. No fim voltamos a jogar e vai contar.", tamanho: "gigante", telemovel: true, fundo: "escuro" },
            { id: "jogo", tipo: "texto", etiqueta: "Últimos 15 minutos", titulo: "Contratado!", tamanho: "gigante", telemovel: true, fundo: "escuro",
              texto: "- Diz ou mostra? | Quatro frases de candidatos. Prova ou só conversa?\n- Roleta da entrevista | A roleta escolhe a pergunta. Tens 30 segundos.\n- O raio-X outra vez | A mesma lista do início. Uma pergunta diferente." },
            { id: "dm1", tipo: "quiz", etiqueta: "Ronda 1 · Diz ou mostra?", pergunta: "«Sou uma pessoa muito comunicativa.»", opcoes: DZM.slice(), certa: 0, tempo: 0, pontos: false,
              explicacao: "É um rótulo. Qualquer pessoa o pode escrever, e quase toda a gente escreve." },
            { id: "dm2", tipo: "quiz", etiqueta: "Ronda 1 · Diz ou mostra?", pergunta: "«Expliquei frações ao meu irmão de três maneiras diferentes até ele perceber. Passou no teste.»", opcoes: DZM.slice(), certa: 2, tempo: 0, pontos: false,
              explicacao: "Quando, eu, e: situação, ação e resultado. Isto é prova." },
            { id: "dm3", tipo: "quiz", etiqueta: "Ronda 1 · Diz ou mostra?", pergunta: "«Quando faltava dinheiro para a viagem de finalistas, nós organizámos um torneio de futsal e juntámos 600 euros.»", opcoes: DZM.slice(), certa: 1, tempo: 0, pontos: false,
              explicacao: "Falta o EU. Quem fez o quê? Na entrevista estás tu, não o grupo." },
            { id: "dm4", tipo: "quiz", etiqueta: "Ronda 1 · Diz ou mostra?", pergunta: "«Quando o treinador faltou, eu orientei o aquecimento da equipa.»", opcoes: DZM.slice(), certa: 1, tempo: 0, pontos: false,
              explicacao: "Falta o E: o resultado. E depois? O que mudou graças a ti?" },
            { id: "roleta", tipo: "roleta", etiqueta: "Ronda 2 · Roleta da entrevista", titulo: "Conta-me uma vez em que…", tempo: 30, naoRepetir: true,
              texto: "Em pares: um pergunta, o outro responde em 30 segundos. Começa por «Quando…». Depois trocam e roda-se outra vez.",
              segmentos: [
                { t: "…tiveste de mudar de plano à última hora.", d: "Adaptabilidade" },
                { t: "…tiveste de explicar uma coisa difícil a alguém.", d: "Comunicação" },
                { t: "…discordaste de alguém da tua equipa.", d: "Trabalho em equipa" },
                { t: "…reparaste num problema antes dos outros.", d: "Pensamento crítico" },
                { t: "…começaste alguma coisa por tua iniciativa.", d: "Responsabilidade" }] },
            { id: "provo", tipo: "escala", etiqueta: "Ronda 3 · O raio-X outra vez", pergunta: "De quantas destas cinco consegues contar hoje uma história de 30 segundos?", afirmacoes: [""], min: 0, max: 5, rotMin: "Nenhuma", rotMax: "Todas", esconder: false,
              comparar: "tenho", rotuloA: "Achavam que tinham", rotuloB: "Conseguem provar hoje", frase: "A diferença são histórias por escrever. É o trabalho desta semana." },
            { id: "fim", tipo: "texto", etiqueta: "Para levar", titulo: "Sê aquele que mostra.", tamanho: "normal", telemovel: true, fundo: "escuro",
              texto: "- Abre uma nota chamada «histórias» | Três linhas sempre que algo acontecer: um desafio, uma solução.\n- Escreve cinco histórias | Uma para cada número. Ficas preparado para quase todas as entrevistas.\n- Escolhe o número 1 | Cumpre-o duas semanas. Uma coisa pequena, todos os dias." },
            { id: "qa", tipo: "perguntas", etiqueta: "Perguntas da sala", titulo: "O que queres saber?", texto: "Entrevistas, currículo, competências: pergunta o que quiseres. Ninguém sabe quem perguntou. Apoia com ♥ as perguntas dos colegas.", apoiar: true, maxPorPessoa: 3 }
          ]
        };
      }
    },
    {
      id: "todos", nome: "Um de cada tipo", desc: "Uma atividade curta sobre trabalho em equipa para experimentares todos os tipos (11 diapositivos).",
      atividade: function () {
        return {
          titulo: "Trabalho em equipa · aquecimento", tema: "ardosia", pedirAlcunha: true, slides: [
            { id: "a1", tipo: "nuvem", pergunta: "Numa palavra: o que é para ti uma boa equipa?", maxPalavras: 1 },
            { id: "a2", tipo: "escolha", pergunta: "Num trabalho de grupo, que papel costumas ter?", opcoes: ["Organizo e distribuo tarefas", "Tenho as ideias", "Faço a parte prática", "Revejo e corrijo", "Fico à espera que me digam"], multipla: false, esconder: false },
            { id: "a3", tipo: "escala", pergunta: "Até que ponto concordas?", afirmacoes: ["Peço ajuda quando não sei", "Digo quando discordo", "Cumpro os prazos do grupo"], min: 1, max: 5, rotMin: "Nada", rotMax: "Totalmente", esconder: false, comparar: "", rotuloA: "Antes", rotuloB: "Agora", frase: "" },
            { id: "a4", tipo: "quiz", etiqueta: "Quiz · 1 de 2", pergunta: "Numa reunião, um colega critica a tua ideia. O que fazes primeiro?", opcoes: ["Defendo logo a minha ideia", "Pergunto o que o preocupa", "Fico calado", "Mudo de assunto"], certa: 1, tempo: 20, pontos: true,
              explicacao: "Perceber a crítica antes de responder mostra escuta ativa e evita discussões inúteis." },
            { id: "a5", tipo: "quiz", etiqueta: "Quiz · 2 de 2", pergunta: "Qual destas frases mostra responsabilidade?", opcoes: ["«Eu trato disso até sexta.»", "«Alguém devia tratar disso.»", "«Não era a minha parte.»"], certa: 0, tempo: 15, pontos: true, explicacao: "Assumir uma tarefa com um prazo concreto." },
            { id: "a6", tipo: "classificacao", titulo: "Classificação", quantos: 5 },
            { id: "a7", tipo: "ordenar", pergunta: "O que é mais importante numa equipa?", itens: ["Confiança", "Comunicação", "Objetivos claros", "Divisão justa do trabalho"] },
            { id: "a8", tipo: "aberta", pergunta: "Uma coisa que vais fazer diferente no próximo trabalho de grupo:", limite: 140, porPessoa: 1 },
            { id: "a11", tipo: "perguntas", titulo: "Ficou alguma dúvida?", texto: "Escreve a tua pergunta. Ninguém sabe quem perguntou. Apoia com ♥ as dos colegas.", apoiar: true, maxPorPessoa: 3 },
            { id: "a9", tipo: "roleta", titulo: "Quem apresenta?", texto: "A roleta escolhe o grupo que apresenta primeiro.", segmentos: [{ t: "Grupo A", d: "" }, { t: "Grupo B", d: "" }, { t: "Grupo C", d: "" }, { t: "Grupo D", d: "" }], tempo: 60, naoRepetir: true },
            { id: "a10", tipo: "texto", titulo: "Obrigado!", texto: "- Escuta | Ouve até ao fim antes de responder.\n- Combina | Quem faz o quê, até quando.\n- Cumpre | Faz o que disseste que ias fazer.", tamanho: "normal", telemovel: true }
          ]
        };
      }
    },
    {
      id: "avaliacao", nome: "Avaliação da formação", desc: "Questionário anónimo que cada um responde ao seu ritmo: satisfação, utilidade e sugestões (7 páginas).",
      atividade: function () {
        return {
          titulo: "Avaliação da formação", tema: "papel", ritmo: "livre", pedirAlcunha: false, slides: [
            { id: "v0", tipo: "texto", titulo: "A tua opinião conta.", texto: "São dois minutos. As respostas são anónimas: ninguém sabe quem respondeu o quê.", tamanho: "normal", telemovel: true },
            { id: "v1", tipo: "escala", pergunta: "Até que ponto concordas?", afirmacoes: ["Os objetivos ficaram claros", "Os conteúdos foram úteis para mim", "O formador explicou bem", "As atividades ajudaram a aprender", "A duração foi adequada", "Vou aplicar o que aprendi"],
              min: 1, max: 5, rotMin: "Discordo totalmente", rotMax: "Concordo totalmente", esconder: false, comparar: "", rotuloA: "Antes", rotuloB: "Agora", frase: "" },
            { id: "v2", tipo: "escala", pergunta: "No geral, como avalias esta formação?", afirmacoes: [""], min: 1, max: 5, rotMin: "Muito fraca", rotMax: "Excelente", esconder: false, comparar: "", rotuloA: "Antes", rotuloB: "Agora", frase: "" },
            { id: "v3", tipo: "escolha", pergunta: "Recomendarias esta formação a um colega?", opcoes: ["Sim", "Talvez", "Não"], multipla: false, esconder: false },
            { id: "v4", tipo: "aberta", pergunta: "O que foi mais útil para ti?", limite: 250, porPessoa: 1 },
            { id: "v5", tipo: "aberta", pergunta: "O que podemos melhorar?", limite: 250, porPessoa: 1 },
            { id: "v6", tipo: "texto", titulo: "Obrigado!", texto: "Carrega em «Concluir» para terminar. Se quiseres mudar alguma resposta, volta atrás com ‹.", tamanho: "normal", telemovel: true }
          ]
        };
      }
    }
  ];

  /* cria uma atividade a partir de um modelo, com identificadores novos */
  B.deModelo = function (id) {
    var m = B.modelos.filter(function (x) { return x.id === id; })[0] || B.modelos[0];
    var at = m.atividade(), mapa = {};
    at.slides.forEach(function (s) { var n = B.novoId(); mapa[s.id] = n; s.id = n; });
    at.slides.forEach(function (s) { if (s.comparar) s.comparar = mapa[s.comparar] || ""; });
    return at;
  };
})();
