/* ==========================================================================
   ZUNZUM · quizzes prontos por tema (soft skills)
   Cada modelo: abertura, 8 perguntas com pontos, pódio a meio e no fim,
   e três ideias para levar. Em cada pergunta a resposta certa vem escrita
   primeiro e muda de lugar quando o quiz é criado.
   ========================================================================== */
(function () {
  "use strict";
  var B = window.BNA;
  var LUGAR = [2, 0, 3, 1, 1, 3, 0, 2];   /* onde fica a resposta certa (muda de quiz para quiz) */

  function quiz(id, nome, tema, desc, perguntas, levar) {
    return {
      id: id, nome: nome, desc: desc, grupo: "quiz",
      atividade: function () {
        var n = perguntas.length, desvio = id.length + nome.length, slides = [
          { id: "abre", tipo: "texto", etiqueta: "Quiz", titulo: nome, tamanho: "normal", telemovel: true, fundo: "escuro",
            texto: n + " perguntas. Responde no telemóvel: quem acerta mais depressa ganha mais pontos." }
        ];
        perguntas.forEach(function (p, i) {
          var ops = p[1].slice(1), pos = Math.min(LUGAR[(i + desvio) % LUGAR.length], ops.length);
          ops.splice(pos, 0, p[1][0]);
          slides.push({ id: "q" + (i + 1), tipo: "quiz", etiqueta: nome + " · " + (i + 1) + " de " + n, pergunta: p[0], opcoes: ops, certa: pos,
            tempo: p[0].length > 80 ? 30 : 20, pontos: true, explicacao: p[2] });
          if (i + 1 === Math.ceil(n / 2)) slides.push({ id: "meio", tipo: "classificacao", titulo: "A meio do jogo", quantos: 5 });
        });
        slides.push({ id: "podio", tipo: "classificacao", titulo: "Pódio final", quantos: 5 });
        slides.push({ id: "levar", tipo: "texto", etiqueta: "Para levar", titulo: "Três ideias", texto: levar, tamanho: "normal", telemovel: true, fundo: "escuro" });
        return { titulo: "Quiz · " + nome, tema: tema, pedirAlcunha: true, slides: slides };
      }
    };
  }

  /* [pergunta, [certa, errada, errada, …], explicação] */
  B.modelos.push(
    quiz("q-assertiva", "Comunicação assertiva", "ardosia", "Passivo, agressivo ou assertivo? Dizer não, criticar e pedir sem atacar nem fugir.", [
      ["Qual destas frases é assertiva?", ["«Quando me interrompes, perco o fio. Deixas-me acabar?»", "«Tu nunca me ouves!»", "«Pronto, faz como quiseres.»", "«Toda a gente sabe que tenho razão.»"],
        "Descreve o facto, diz o efeito e faz um pedido claro. Sem atacar nem fugir."],
      ["Um colega pede-te, pela terceira vez, que fiques com uma tarefa dele. Estás sem tempo. O que fazes?", ["Digo que não posso e explico porquê", "Aceito para não criar mau ambiente", "Aceito e depois não faço", "Queixo-me à chefia sem lhe dizer nada"],
        "Um «não» com uma razão breve protege o teu trabalho e a relação. Aceitar sempre é passivo; aceitar e não cumprir é passivo-agressivo."],
      ["«Está bem, está bem… fazes sempre o que queres, como de costume.» Que estilo é este?", ["Passivo-agressivo", "Assertivo", "Passivo", "Agressivo"],
        "Concorda por fora e ataca com ironia. A mensagem verdadeira fica escondida no tom."],
      ["Qual é a melhor forma de começar uma crítica?", ["«No relatório de ontem faltavam os números de março.»", "«Tu és sempre desorganizado.»", "«Não leves a mal, mas…»", "«Já toda a gente reparou que…»"],
        "Fala do comportamento concreto, não da pessoa. Um facto é difícil de contestar; um rótulo põe o outro na defensiva."],
      ["Mensagens na primeira pessoa («eu sinto», «eu preciso»)…", ["Evitam acusar o outro", "Mostram fraqueza", "Só servem com a família", "Devem ser evitadas no trabalho"],
        "«Fiquei preocupado» abre uma conversa. «Tu deixaste tudo atrasado» abre uma defesa."],
      ["A chefia dá-te um prazo que sabes que é impossível. O que fazes?", ["Explico o que é possível até lá e proponho alternativas", "Aceito e faço horas extra em silêncio", "Recuso sem mais conversa", "Aceito e, se falhar, a culpa é dos outros"],
        "Assertividade não é recusar: é dizer a verdade e negociar. Mostras o que dá para fazer e a decisão fica informada."],
      ["Na comunicação assertiva, a linguagem corporal deve ser…", ["Coerente com o que dizes", "Contida, para não parecer agressiva", "Sempre sorridente", "Indiferente: contam as palavras"],
        "Olhar direto, voz calma, postura aberta. Se o corpo diz uma coisa e as palavras outra, acredita-se no corpo."],
      ["Elogiam o teu trabalho à frente de todos. Qual é a resposta assertiva?", ["«Obrigado! Deu trabalho e fico contente que tenha resultado.»", "«Não foi nada, qualquer um fazia.»", "«Finalmente alguém reparou.»", "Fico calado e mudo de assunto"],
        "Aceitar um elogio também é assertividade: reconheces o teu valor sem te diminuíres nem atacares."]
    ], "- Facto | Descreve o que aconteceu, sem rótulos.\n- Efeito | Diz o que isso provoca em ti ou no trabalho.\n- Pedido | Termina com o que precisas, de forma concreta."),

    quiz("q-conflitos", "Gestão de conflitos", "laranjal", "Estilos de conflito, posições e interesses, acalmar a conversa e fechar acordos que duram.", [
      ["Num conflito, qual é o primeiro passo mais útil?", ["Perceber o que cada parte quer e porquê", "Decidir quem tem razão", "Esperar que passe", "Chamar a chefia"],
        "Separar a posição (o que a pessoa diz querer) do interesse (porque o quer) abre soluções que ninguém tinha visto."],
      ["Dois colegas querem férias na mesma semana. Qual é a abordagem colaborativa?", ["Conversam até encontrar uma solução que sirva os dois", "Fica quem pediu primeiro", "A chefia sorteia", "Nenhum vai de férias nessa semana"],
        "Colaborar dá mais trabalho, mas procura uma solução em que os dois ganham: dividir a semana, trocar por outra que também sirva…"],
      ["Ceder sempre, para evitar discussões, é o estilo…", ["Acomodativo", "Colaborativo", "Competitivo", "De compromisso"],
        "Acomodar resolve depressa, mas se for sempre acumula frustração. Faz sentido quando a relação importa mais do que o assunto."],
      ["Um colega levanta a voz contigo numa reunião. O que fazes primeiro?", ["Mantenho a calma e proponho falarmos a sós depois", "Levanto a voz também", "Saio da sala", "Respondo com ironia"],
        "Primeiro baixar a temperatura. Uma conversa difícil corre melhor a dois e com calma do que à frente de todos."],
      ["O que quer dizer «separar a pessoa do problema»?", ["Atacar o problema, não quem está do outro lado", "Evitar falar com quem nos irrita", "Pedir a outra pessoa que resolva", "Esquecer o que aconteceu"],
        "Ficas do mesmo lado da mesa que o outro, contra o problema. É uma das bases da negociação de Harvard (Fisher e Ury)."],
      ["Num conflito, que pergunta ajuda mais?", ["«O que precisas para isto funcionar para ti?»", "«Porque é que fizeste isto?»", "«Quem começou?»", "«Achas isso normal?»"],
        "Perguntas abertas e viradas para o futuro procuram soluções. «Porquê» e «quem» procuram culpados."],
      ["Quando faz sentido impor a tua posição (estilo competitivo)?", ["Numa emergência ou numa questão de segurança", "Sempre que tens razão", "Quando o outro é mais novo", "Nunca"],
        "Há momentos sem tempo para negociar: segurança, ética, urgência. Fora disso, impor costuma sair caro na relação."],
      ["Chegaram a acordo. O que falta?", ["Combinar quem faz o quê e quando voltam a falar", "Nada, está resolvido", "Contar à equipa quem ganhou", "Não voltar ao assunto"],
        "Um acordo sem passos concretos desfaz-se. Define tarefas, prazos e um momento para ver se está a resultar."]
    ], "- Acalma | Primeiro baixa a temperatura, depois fala.\n- Pergunta | Procura o interesse por trás da posição.\n- Combina | Fecha com quem faz o quê, até quando."),

    quiz("q-equipa", "Trabalho em equipa", "tenda", "Confiança, discordar a tempo, dividir tarefas e aprender com o que corre mal.", [
      ["Numa equipa, a confiança constrói-se sobretudo…", ["Cumprindo o que se promete", "Com atividades fora do trabalho", "Sendo simpático com todos", "Concordando com a maioria"],
        "Confiança é previsibilidade: faço o que disse que ia fazer. Pequenos compromissos cumpridos valem mais do que um jantar de equipa."],
      ["O prazo é amanhã e um colega ainda não entregou a parte dele. O que fazes?", ["Falo com ele, pergunto o que se passa e como posso ajudar", "Faço eu a parte dele em silêncio", "Aviso o formador de que ele não fez nada", "Entrego sem a parte dele"],
        "Perguntar antes de julgar. Pode haver um problema que não conheces, e a equipa resolve-o melhor junta."],
      ["Numa reunião, a ideia do chefe parece-te errada. Ninguém diz nada. Tu…", ["Dizes, com respeito, o que te preocupa e porquê", "Também ficas calado", "Comentas depois no café", "Dizes que é uma péssima ideia"],
        "Equipas fortes têm espaço para discordar. Calar agora é concordar com um erro que depois é de todos."],
      ["O que é «segurança psicológica» numa equipa?", ["Poder errar, perguntar ou discordar sem medo de ser humilhado", "Ter um contrato estável", "Nunca haver conflitos", "Ter um chefe protetor"],
        "No Projeto Aristóteles, da Google, foi o fator que mais distinguiu as equipas eficazes."],
      ["Qual é a melhor forma de dividir tarefas?", ["Combinar tarefas, responsáveis e prazos, por escrito", "Cada um escolhe e no fim junta-se", "Quem manda decide tudo", "Todos fazem tudo juntos"],
        "Quem faz o quê, até quando, e onde fica escrito. Evita trabalho duplicado e o clássico «pensei que eras tu»."],
      ["Entra uma pessoa nova na equipa. O que ajuda mais?", ["Apresentá-la, explicar como a equipa funciona e ficar disponível", "Deixá-la descobrir sozinha", "Dar-lhe o manual e esperar", "Dar-lhe logo a tarefa mais difícil"],
        "Os primeiros dias marcam a integração. Uma pessoa de referência e regras claras poupam semanas."],
      ["A equipa falhou um objetivo. Qual é a reação mais útil?", ["Analisar juntos o que correu mal e o que mudar", "Encontrar o culpado", "Fingir que não aconteceu", "Cada um defende a sua parte"],
        "Olhar para o processo, não para culpados. A pergunta é: o que fazemos diferente da próxima vez?"],
      ["Qual destas frases mostra espírito de equipa?", ["«Acabei a minha parte. Posso ajudar em alguma coisa?»", "«Essa parte não é minha.»", "«A minha parte está feita.»", "«Se correr mal, não fui eu.»"],
        "Cumprir a tua parte é o mínimo. Olhar para o resultado do grupo é o que faz a diferença."]
    ], "- Cumpre | Faz o que disseste que ias fazer.\n- Fala | Discorda com respeito, e a tempo.\n- Combina | Quem faz o quê, até quando, por escrito."),

    quiz("q-feedback", "Dar e receber feedback", "papel", "Feedback específico e a tempo, o modelo SCI e como ouvir uma crítica sem te defenderes.", [
      ["Qual destes é um bom feedback?", ["«Na apresentação de hoje, o exemplo do cliente tornou tudo claro.»", "«Estiveste bem.»", "«Podias ser mais profissional.»", "«Não está mau.»"],
        "Bom feedback é específico: o quê, quando e que efeito teve. «Estiveste bem» é simpático, mas não ensina nada."],
      ["Quando é o melhor momento para dar feedback de melhoria?", ["Pouco depois do momento, a sós", "Na avaliação anual", "Só quando o pedem", "À frente da equipa, para todos aprenderem"],
        "Perto do acontecimento a memória está fresca. Melhoria, sempre a sós; elogio em público, se a pessoa gostar."],
      ["Recebes uma crítica que te parece injusta. Primeiro passo:", ["Ouvir até ao fim e pedir um exemplo", "Defender-te logo", "Agradecer e ignorar", "Devolver uma crítica"],
        "Um exemplo concreto ajuda a perceber o que a pessoa viu. Podes discordar depois, com mais informação."],
      ["O modelo SCI (Situação, Comportamento, Impacto) serve para…", ["Dar feedback concreto e sem julgamentos", "Avaliar o desempenho anual", "Resolver problemas técnicos", "Escrever relatórios"],
        "Situação: quando e onde. Comportamento: o que a pessoa fez. Impacto: o efeito. Sem adjetivos sobre a pessoa."],
      ["A «sanduíche» (elogio, crítica, elogio)…", ["Pode diluir a mensagem e soar falsa", "É a técnica mais eficaz", "Só serve para chefias", "É obrigatória nas avaliações"],
        "Muitas vezes só se ouvem os elogios, ou deixa de se acreditar neles. Melhor ser claro e respeitoso, e elogiar quando é verdade."],
      ["Um feedback de melhoria deve terminar com…", ["Um pedido concreto para a próxima vez", "Um aviso", "Uma comparação com um colega", "Nada: a pessoa que pense"],
        "O feedback olha para a frente. «Da próxima vez, envias o resumo antes da reunião?» dá um caminho."],
      ["Qual é a melhor forma de receber feedback?", ["«Obrigado. Podes dar-me um exemplo?»", "«Sim, mas…»", "«Toda a gente faz isso.»", "«Não tive tempo.»"],
        "Agradecer não é concordar. É reconhecer o esforço de quem falou e manter a porta aberta."],
      ["Com que frequência deve haver feedback numa equipa?", ["Regularmente, no dia a dia", "Uma vez por ano", "Só quando algo corre mal", "Nunca, cria mau ambiente"],
        "Pequeno e frequente é melhor do que grande e raro. Quando o feedback é habitual, deixa de assustar."]
    ], "- Específico | O quê, quando, que efeito.\n- A tempo | Perto do momento; melhoria, a sós.\n- Para a frente | Termina com o que fazer da próxima vez."),

    quiz("q-tempo", "Gestão do tempo", "laranjal", "Urgente e importante, multitarefa, Pomodoro, procrastinação e notificações.", [
      ["Na matriz de Eisenhower, o que fazes ao que é importante mas não urgente?", ["Agendas", "Fazes já", "Delegas", "Eliminas"],
        "É o quadrante mais esquecido e o que mais conta: planear, aprender, prevenir. Se não tiver hora marcada, nunca acontece."],
      ["E ao que é urgente mas não importante (interrupções, pedidos de última hora)?", ["Delegas ou resolves depressa", "Fazes primeiro e com calma", "Agendas para o fim do mês", "Ignoras sempre"],
        "Pede atenção agora, mas não te aproxima dos teus objetivos. Se outra pessoa pode tratar, delega."],
      ["Fazer várias coisas ao mesmo tempo…", ["Faz perder tempo a cada troca de tarefa", "Aumenta a produtividade", "É essencial no trabalho de hoje", "Só resulta com pessoas organizadas"],
        "O cérebro não faz duas tarefas exigentes ao mesmo tempo: alterna, e cada troca custa concentração. Blocos de foco rendem mais."],
      ["Em que consiste a técnica Pomodoro?", ["Blocos de 25 minutos de foco com pausas curtas", "Trabalhar até acabar, sem pausas", "Fazer primeiro as tarefas fáceis", "Planear a semana ao domingo"],
        "25 minutos sem interrupções, 5 de pausa; a cada quatro blocos, uma pausa maior. Ajuda a começar e a não dispersar."],
      ["Há uma tarefa grande que andas a adiar. O que ajuda mais?", ["Dividi-la em passos pequenos e fazer o primeiro hoje", "Esperar pela motivação", "Fazê-la toda na última noite", "Pedir mais prazo logo à partida"],
        "Adiar alimenta-se de tarefas vagas e enormes. Um primeiro passo de 10 minutos quebra o bloqueio."],
      ["Quando é melhor planear o dia?", ["No fim do dia anterior ou logo de manhã", "Ao longo do dia, conforme aparece", "Só quando há prazos", "Não vale a pena planear"],
        "Cinco minutos de plano poupam horas. Escolhe as duas ou três tarefas que, feitas, tornam o dia bom."],
      ["O e-mail e as notificações…", ["Rendem mais vistos a horas marcadas", "Pedem resposta imediata", "Devem ser ignorados", "São a tarefa mais importante"],
        "Ver o e-mail a cada minuto parte o dia aos bocados. Dois ou três momentos por dia chegam para a maioria das funções."],
      ["O que diz a lei de Parkinson?", ["O trabalho estica até ocupar o tempo disponível", "Quanto mais horas, melhor o resultado", "20% das tarefas dão 80% dos resultados", "As tarefas difíceis fazem-se à tarde"],
        "Com uma semana, a tarefa leva uma semana. Prazos curtos e realistas ajudam a fazer o mesmo em menos tempo."]
    ], "- Importante primeiro | Marca hora para o que conta, antes do urgente.\n- Uma coisa de cada vez | Blocos de foco, notificações fora.\n- Passo pequeno | Começa hoje, nem que sejam 10 minutos."),

    quiz("q-emocional", "Inteligência emocional", "ardosia", "Autoconsciência, autorregulação e empatia em situações do dia a dia.", [
      ["Segundo Daniel Goleman, qual é a base da inteligência emocional?", ["Autoconsciência", "Carisma", "Um QI elevado", "Controlar os outros"],
        "Reconhecer o que sentes, quando sentes. Sem isso, é difícil gerir as emoções ou perceber as dos outros."],
      ["Recebes um e-mail que te irrita muito. O que fazes?", ["Espero, acalmo e respondo depois", "Respondo logo, enquanto está fresco", "Reencaminho para a equipa a comentar", "Nunca respondo"],
        "Uma emoção forte encurta o raciocínio. Uma pausa, mesmo de minutos, deixa responder ao assunto e não à irritação."],
      ["Empatia é…", ["Perceber o que o outro sente e porquê", "Concordar com o outro", "Ter pena", "Resolver os problemas dos outros"],
        "Podes perceber a perspetiva de alguém sem concordar com ela. É isso que torna a conversa possível."],
      ["Um colega anda mais calado e irritado do que o costume. Tu…", ["Perguntas, a sós, se está tudo bem", "Ignoras, não é contigo", "Dizes-lhe para mudar de atitude", "Comentas com outros colegas"],
        "Reparar e perguntar, sem pressionar. Às vezes basta saber que alguém reparou."],
      ["Dar nome à emoção («estou frustrado») ajuda a…", ["Baixar a intensidade da emoção", "Parecer fraco", "Culpar os outros", "Nada, é só conversa"],
        "Pôr a emoção em palavras ajuda a acalmá-la. Os investigadores chamam-lhe «rotular o afeto»."],
      ["Qual destas é uma resposta empática?", ["«Parece que isso te deixou mesmo preocupado.»", "«Não é nada, isso passa.»", "«No teu lugar, eu já tinha resolvido.»", "«Há quem esteja pior.»"],
        "Reconhecer o que o outro sente antes de dar conselhos. Minimizar ou comparar fecha a conversa."],
      ["Autorregulação significa…", ["Escolher como agir, apesar do que sentes", "Não sentir emoções negativas", "Esconder sempre o que sentes", "Fazer só o que apetece"],
        "Todas as emoções são legítimas; nem todos os comportamentos são. Sentes a raiva, mas escolhes o que fazes com ela."],
      ["A inteligência emocional…", ["Desenvolve-se com prática", "É inata e não muda", "Só importa em cargos de chefia", "É o mesmo que ser simpático"],
        "É um conjunto de competências e treina-se como as outras: reparar, dar nome, fazer uma pausa, perguntar."]
    ], "- Repara | O que estou a sentir agora?\n- Pausa | Entre o que sentes e o que fazes, respira.\n- Pergunta | Antes de supor, pergunta como o outro está."),

    quiz("q-cliente", "Atendimento ao cliente", "tenda", "Clientes irritados, reclamações, dizer «não» com alternativa e escuta ativa ao balcão e ao telefone.", [
      ["Um cliente chega muito irritado. O que fazes primeiro?", ["Ouves sem interromper", "Explicas logo as regras", "Chamas o responsável", "Pedes-lhe que se acalme"],
        "Quem está irritado precisa primeiro de ser ouvido. «Acalme-se» quase sempre tem o efeito contrário."],
      ["Qual destas frases é a melhor?", ["«Vou confirmar e dou-lhe resposta até às 15h.»", "«Isso não é comigo.»", "«Não sei.»", "«O sistema não deixa.»"],
        "Mesmo sem a resposta, assumes o caso e dás um prazo. O cliente fica a saber o que vai acontecer."],
      ["O cliente tem razão na reclamação. O que fazes?", ["Pedes desculpa, resolves e agradeces o aviso", "Explicas que a culpa foi de outro serviço", "Dás-lhe razão mas não mudas nada", "Ofereces um desconto sem pedir desculpa"],
        "Uma reclamação bem resolvida pode deixar o cliente mais fiel do que antes do problema."],
      ["Não podes dar ao cliente o que ele pede. Como dizes?", ["«Isso não consigo, mas posso fazer…»", "«Não dá.»", "«Isso é impossível.»", "Dizes que vais ver e não voltas a falar"],
        "Dizer o que podes fazer, não só o que não podes. O cliente sai com uma alternativa."],
      ["Ao telefone, o cliente não te vê. O que conta mais?", ["O tom de voz", "A rapidez", "O vocabulário técnico", "Falar alto"],
        "O tom mostra atenção ou desinteresse. Um sorriso ouve-se ao telefone: muda a voz."],
      ["Escuta ativa no atendimento é…", ["Resumir o que o cliente disse, para confirmar", "Preparar a resposta enquanto ele fala", "Interromper para poupar tempo", "Ouvir a olhar para o ecrã"],
        "«Se percebi bem, a encomenda chegou incompleta, certo?» Mostra que ouviste e evita mal-entendidos."],
      ["No fim do atendimento deves…", ["Confirmar se ficou tudo resolvido", "Despachar para o seguinte", "Pedir uma avaliação de 5 estrelas", "Lembrar as regras da empresa"],
        "«Posso ajudar em mais alguma coisa?» fecha o atendimento e apanha o que ficou por dizer."],
      ["Um cliente insulta-te. Qual é o limite?", ["Pedir respeito com calma e, se continuar, chamar o responsável", "Aguentar tudo: o cliente tem sempre razão", "Responder no mesmo tom", "Desligar sem dizer nada"],
        "O respeito vale para os dois lados. Podes pôr um limite com calma e pedir apoio sem perder o profissionalismo."]
    ], "- Ouve | Primeiro ouve, depois resolve.\n- Assume | Dá um prazo e cumpre-o.\n- Alternativa | Quando não podes, diz o que podes."),

    quiz("q-lideranca", "Liderança", "papel", "Dar o exemplo, delegar, corrigir erros, motivar e comunicar decisões difíceis.", [
      ["Um bom líder…", ["Dá o exemplo", "Sabe a resposta a tudo", "Decide sempre sozinho", "Evita dar más notícias"],
        "As pessoas fazem o que o líder faz, não o que diz. Pontualidade, respeito, compromisso: começa por ti."],
      ["Delegar bem é…", ["Dar a tarefa, o objetivo e autonomia, e acompanhar", "Passar as tarefas de que não gostas", "Dar a tarefa e não perguntar mais nada", "Dizer passo a passo como fazer"],
        "Explica o resultado esperado, combina pontos de controlo e confia. Nem abandono, nem controlo de cada pormenor."],
      ["Alguém da equipa cometeu um erro importante. Tu…", ["Falas a sós, procuras a causa e combinas como evitar", "Chamas-lhe a atenção à frente de todos", "Corriges tu e não dizes nada", "Tiras-lhe responsabilidades"],
        "Errar faz parte. Corrigir em privado e olhar para a solução mantém a confiança e a vontade de arriscar."],
      ["Liderança situacional significa…", ["Adaptar o estilo à pessoa e à tarefa", "Liderar só em crises", "Mudar de opinião conforme o dia", "Liderar sem ter um cargo"],
        "Quem está a começar precisa de orientação; quem domina a tarefa precisa de espaço. O mesmo estilo para todos falha com alguém."],
      ["Como se motiva uma equipa a longo prazo?", ["Com sentido, autonomia e reconhecimento", "Só com prémios em dinheiro", "Com pressão e prazos curtos", "Com competição entre colegas"],
        "Saber para que serve o trabalho, ter margem para decidir e ver o esforço reconhecido. O dinheiro conta, mas não chega."],
      ["Numa reunião de equipa, o líder deve…", ["Ouvir primeiro e falar no fim", "Falar a maior parte do tempo", "Só dar instruções", "Evitar perguntas difíceis"],
        "Se o líder fala primeiro, os outros tendem a concordar. Ouvir primeiro traz ideias que de outra forma ficavam caladas."],
      ["Tens de comunicar uma decisão impopular. O que fazes?", ["Explicas o porquê, ouves as reações e és honesto sobre o que não muda", "Mandas um e-mail curto", "Dizes que a decisão não foi tua", "Adias até não haver remédio"],
        "Aceita-se melhor o que não se gosta quando se percebe o porquê e se sente que se foi ouvido."],
      ["A equipa teve um grande resultado. O papel do líder é…", ["Reconhecer o trabalho da equipa", "Apresentar os resultados como seus", "Subir logo a fasquia, sem comentar", "Nenhum: era a obrigação"],
        "Quando corre bem, o mérito é da equipa; quando corre mal, o líder dá a cara. É assim que se ganha confiança."]
    ], "- Exemplo | Faz primeiro o que pedes aos outros.\n- Ouve | Fala no fim, não no princípio.\n- Reconhece | O mérito é da equipa.")
  );
})();
