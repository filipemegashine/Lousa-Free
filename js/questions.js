'use strict';
/* Banco de questões de Inglês no formato do ENEM.
   Textos, tirinhas, cartazes e gráficos são ORIGINAIS (não copiados de provas),
   seguindo a estrutura do exame: enunciado em português, texto em inglês, 5 alternativas.
   Critérios de dificuldade:
   - fácil:   texto curto, informação explícita, vocabulário frequente/cognatos;
   - médio:   ideia principal, finalidade do gênero, inferência simples;
   - difícil: ironia, crítica implícita, linguagem figurada, leitura de dados sem extrapolar. */
const SKIN = { a: '#f2c9a0', b: '#c68e63', c: '#8d5a3b', d: '#ffdcb8' };
const QUESTIONS = [
  /* ======================= FÁCIL ======================= */
  {
    id: 'f01', level: 'facil', skill: 'Finalidade do texto',
    visual: { type: 'poster', bg: '#e3f2fd', fg: '#0d3c61', accent: '#1e88e5', icon: 'drop', title: 'SAVE WATER', body: 'Turn off the tap while you brush your teeth.', footer: 'Every drop counts.', alt: 'Cartaz azul com uma gota: Save water. Turn off the tap while you brush your teeth. Every drop counts.' },
    stem: 'O cartaz tem como principal objetivo',
    options: ['divulgar uma nova marca de creme dental.', 'incentivar a economia de água em uma atividade do dia a dia.', 'alertar sobre a falta de água potável nas escolas.', 'ensinar a técnica correta de escovação dos dentes.', 'informar o horário de corte no fornecimento de água.'],
    answer: 1,
    explain: '“Save water” (economize água) e “Turn off the tap” (feche a torneira) pedem uma atitude simples durante a escovação. “Every drop counts” reforça: cada gota importa.'
  },
  {
    id: 'f02', level: 'facil', skill: 'Informação explícita',
    text: 'LIBRARY NOTICE\nFrom Monday to Friday, the library will close at 6 p.m. instead of 9 p.m. due to maintenance work. Online services remain available 24 hours a day. We apologize for any inconvenience.',
    stem: 'De acordo com o aviso, durante o período de manutenção,',
    options: ['a biblioteca ficará fechada durante toda a semana.', 'o horário de abertura será adiado para as 9 horas.', 'os serviços on-line continuarão disponíveis o dia todo.', 'os usuários deverão devolver os livros até as 18 horas.', 'a biblioteca funcionará apenas aos fins de semana.'],
    answer: 2,
    explain: '“Online services remain available 24 hours a day” = os serviços on-line continuam disponíveis 24 horas. A mudança é só no fechamento: 18h (6 p.m.) em vez de 21h (9 p.m.).'
  },
  {
    id: 'f03', level: 'facil', skill: 'Sentimento expresso',
    visual: { type: 'post', name: 'Marina', handle: '@marina_trips', color: '#00acc1', text: 'First time seeing snow! I was born in a tropical city, so this feels like magic. #winter #firsttime', likes: '1.2k', replies: '87', alt: 'Postagem de Marina: First time seeing snow! I was born in a tropical city, so this feels like magic.' },
    stem: 'Na postagem, a autora expressa',
    options: ['medo de enfrentar o frio intenso.', 'saudade da cidade tropical onde nasceu.', 'encantamento ao viver uma experiência inédita.', 'insatisfação com o clima do lugar que visita.', 'vontade de se mudar definitivamente para lá.'],
    answer: 2,
    explain: '“First time” (primeira vez) e “feels like magic” (parece mágica) indicam encantamento com uma experiência nova.'
  },
  {
    id: 'f04', level: 'facil', skill: 'Humor em tirinha',
    visual: {
      type: 'comic', alt: 'Tirinha em dois quadros. Uma criança pergunta à mãe se pode ter um pet; a mãe diz que só se ela cuidar dele. No segundo quadro, a criança apresenta um cacto chamado Spike, que precisa de água uma vez por mês.', panels: [
        { chars: [{ x: .3, shirt: '#fb8c00', skin: SKIN.d, hair: '#3e2723', mood: 'happy' }, { x: .72, shirt: '#7e57c2', skin: SKIN.d, hair: '#3e2723', hairStyle: 'long', mood: 'neutral' }], bubbles: [{ who: 0, text: 'Mom, can I have a pet?' }, { who: 1, text: 'Only if you promise to take care of it.' }] },
        { chars: [{ x: .36, shirt: '#fb8c00', skin: SKIN.d, hair: '#3e2723', mood: 'smug', prop: 'cactus' }], bubbles: [{ who: 0, text: 'Meet Spike! He needs water once a month.' }] }
      ]
    },
    stem: 'O humor da tirinha decorre do fato de a criança',
    options: ['desobedecer à mãe e comprar um cachorro.', 'esquecer de cuidar do animal que ganhou.', 'escolher como “pet” uma planta que exige pouquíssimos cuidados.', 'pedir à mãe que regue o cacto todos os dias.', 'dar ao cacto um nome que a mãe não aprova.'],
    answer: 2,
    explain: 'A mãe exige que a criança cuide do pet. Ela “resolve” isso escolhendo um cacto, que só precisa de água “once a month” (uma vez por mês).'
  },
  {
    id: 'f05', level: 'facil', skill: 'Gênero textual',
    text: 'BANANA PANCAKES\nYou need: 1 ripe banana, 2 eggs, a pinch of cinnamon.\nMash the banana with a fork, mix it with the eggs and the cinnamon, and cook small portions on a hot pan for two minutes on each side.',
    stem: 'Pela organização e pela finalidade, esse texto é',
    options: ['uma receita, pois lista ingredientes e explica o modo de preparo.', 'um anúncio, pois tenta vender um produto alimentício.', 'uma notícia, pois relata um fato recente sobre alimentação.', 'um cardápio, pois apresenta os pratos de um restaurante.', 'um rótulo, pois informa os valores nutricionais de um alimento.'],
    answer: 0,
    explain: '“You need” introduz os ingredientes, e os verbos no imperativo (mash, mix, cook) indicam o passo a passo: características de uma receita.'
  },
  {
    id: 'f06', level: 'facil', skill: 'Vocabulário em contexto',
    text: 'WANTED: SUMMER CAMP ASSISTANTS\nRequirements: 18 or older, good communication skills and basic first aid training.\nExperience with children is a plus, but not required.\nApply at the camp office before May 15.',
    stem: 'Segundo o anúncio, ter experiência com crianças é',
    options: ['obrigatório para todos os candidatos.', 'desejável, mas não obrigatório.', 'exigido apenas de maiores de 18 anos.', 'substituído por um curso de primeiros socorros.', 'um critério de desempate após 15 de maio.'],
    answer: 1,
    explain: '“A plus” significa um diferencial, algo positivo; “but not required” = mas não é exigido.'
  },
  {
    id: 'f07', level: 'facil', skill: 'Leitura de gráfico',
    visual: { type: 'chart', title: 'How teenagers get to school', unit: '%', color: '#43a047', data: [['Walk', 40], ['Bus', 35], ['Car', 15], ['Bike', 10]], alt: 'Gráfico: How teenagers get to school. Walk 40%, Bus 35%, Car 15%, Bike 10%.' },
    stem: 'De acordo com o gráfico, o meio de transporte menos utilizado pelos adolescentes para ir à escola é',
    options: ['a caminhada.', 'o ônibus.', 'o carro.', 'a bicicleta.', 'o metrô.'],
    answer: 3,
    explain: '“Bike” (bicicleta) tem o menor percentual: 10%. O metrô nem aparece no gráfico.'
  },
  {
    id: 'f08', level: 'facil', skill: 'Finalidade do texto',
    text: 'Hi Leo,\nI can\'t make it to the cinema tonight. My little sister is sick and I need to stay home with her. Can we go on Saturday instead?\nAna',
    stem: 'Ana escreve a mensagem para',
    options: ['convidar Leo para cuidar da irmã dela.', 'cancelar o encontro e sugerir outro dia.', 'perguntar a Leo qual filme ele quer ver.', 'avisar que vai chegar atrasada ao cinema.', 'pedir desculpas por ter faltado no sábado.'],
    answer: 1,
    explain: '“I can\'t make it” = não vou conseguir ir; “Can we go on Saturday instead?” = podemos ir no sábado em vez disso?'
  },
  {
    id: 'f09', level: 'facil', skill: 'Informação explícita',
    text: 'GALLERY RULES\nPlease do not touch the paintings.\nPhotography without flash is allowed.\nFood and drinks must stay in the lobby.',
    stem: 'De acordo com as regras, os visitantes da galeria podem',
    options: ['tocar nas molduras dos quadros.', 'lanchar dentro das salas de exposição.', 'fotografar as obras, desde que sem flash.', 'usar flash apenas no saguão de entrada.', 'levar bebidas para perto das pinturas.'],
    answer: 2,
    explain: '“Photography without flash is allowed” = fotografar sem flash é permitido. Comida e bebida devem ficar no saguão (lobby).'
  },
  {
    id: 'f10', level: 'facil', skill: 'Campanha',
    visual: { type: 'poster', bg: '#e0f2f1', fg: '#004d40', accent: '#00897b', icon: 'book', title: 'Read to your kids', body: 'Just 15 minutes a day. It\'s the best gift you can give them.', footer: 'National Reading Week', alt: 'Cartaz verde-água com um livro: Read to your kids. Just 15 minutes a day. It is the best gift you can give them.' },
    stem: 'A campanha incentiva',
    options: ['a compra de livros como presente de aniversário.', 'a leitura diária dos pais para os filhos.', 'a redução do tempo que as crianças passam lendo.', 'a participação em concursos nacionais de redação.', 'a doação de livros infantis para bibliotecas.'],
    answer: 1,
    explain: '“Read to your kids” = leia para seus filhos; “Just 15 minutes a day” = só 15 minutos por dia. O “gift” (presente) é o tempo de leitura, não um livro comprado.'
  },
  {
    id: 'f11', level: 'facil', skill: 'Informação explícita',
    text: 'TOMORROW\'S WEATHER\nSunny in the morning, with heavy rain expected in the afternoon. Temperatures between 18 °C and 25 °C. Don\'t forget your umbrella!',
    stem: 'A previsão do tempo recomenda que as pessoas',
    options: ['evitem sair de casa pela manhã.', 'usem protetor solar durante a tarde.', 'levem guarda-chuva, pois deve chover à tarde.', 'se agasalhem por causa do frio intenso.', 'aproveitem o dia ensolarado na praia.'],
    answer: 2,
    explain: '“Heavy rain expected in the afternoon” = chuva forte prevista para a tarde; “Don\'t forget your umbrella” = não esqueça o guarda-chuva.'
  },
  {
    id: 'f12', level: 'facil', skill: 'Humor em tirinha',
    visual: {
      type: 'comic', alt: 'Tirinha em dois quadros. Um amigo pergunta se o estudante está pronto para a prova de matemática; ele diz que estudou a noite toda. No segundo quadro, o amigo aponta que ele segura um livro de história, e o estudante fica chocado.', panels: [
        { chars: [{ x: .28, shirt: '#1e88e5', skin: SKIN.b, hair: '#212121', mood: 'neutral' }, { x: .72, shirt: '#e53935', skin: SKIN.a, hair: '#795548', mood: 'happy', prop: 'book', propText: 'HISTORY', propColor: '#6d4c41', flip: true }], bubbles: [{ who: 0, text: 'Ready for the math test?' }, { who: 1, text: 'Sure! I studied all night!' }] },
        { chars: [{ x: .28, shirt: '#1e88e5', skin: SKIN.b, hair: '#212121', mood: 'smug' }, { x: .72, shirt: '#e53935', skin: SKIN.a, hair: '#795548', mood: 'shock', prop: 'book', propText: 'HISTORY', propColor: '#6d4c41', flip: true }], bubbles: [{ who: 0, text: 'Great. But that\'s a history book.' }, { who: 1, text: '...Oh no.' }] }
      ]
    },
    stem: 'O humor da tirinha está no fato de o estudante',
    options: ['ter dormido durante a prova de matemática.', 'ter estudado a matéria errada para a prova.', 'não saber que haveria prova naquele dia.', 'ter emprestado o livro de história ao amigo.', 'preferir história a matemática.'],
    answer: 1,
    explain: 'O amigo fala de “math test” (prova de matemática), mas o estudante segura um “history book” (livro de história): ele estudou a noite toda a matéria errada.'
  },

  /* ======================= MÉDIO ======================= */
  {
    id: 'm01', level: 'medio', skill: 'Ideia principal',
    text: 'A growing number of young people are deleting social media apps from their phones for a few weeks every year. They say this “digital detox” helps them sleep better and pay more attention to face-to-face relationships. However, many admit that it is hard to stay away for long: birthday parties, study groups and even job opportunities are organized online.',
    stem: 'Segundo o texto, uma dificuldade enfrentada por quem faz o “digital detox” é',
    options: ['a piora na qualidade do sono.', 'o custo elevado dos aplicativos.', 'a dependência das redes para a vida social e profissional.', 'a perda definitiva das contas nas redes sociais.', 'a falta de interesse em relações presenciais.'],
    answer: 2,
    explain: '“However” introduz o problema: é difícil ficar longe porque festas, grupos de estudo e oportunidades de emprego são organizados on-line. Dormir melhor é um benefício, não uma dificuldade.'
  },
  {
    id: 'm02', level: 'medio', skill: 'Linguagem poética',
    text: 'MY GRANDMOTHER\'S HANDS\nMy grandmother\'s hands\nare maps of every place she worked:\nrivers of blue under paper skin,\nroads that always lead me home.',
    stem: 'No poema, as mãos da avó são associadas',
    options: ['à vontade de viajar por lugares desconhecidos.', 'às marcas de uma vida de trabalho e ao sentimento de pertencimento.', 'à fragilidade de quem nunca precisou trabalhar.', 'à dificuldade de encontrar o caminho de casa.', 'a um mapa real que a avó desenhou para o neto.'],
    answer: 1,
    explain: 'As mãos são “maps of every place she worked” (mapas dos lugares onde trabalhou), e as veias e marcas são “roads that always lead me home”: trajetória de trabalho e afeto.'
  },
  {
    id: 'm03', level: 'medio', skill: 'Ironia em tirinha',
    visual: {
      type: 'comic', alt: 'Tirinha em dois quadros. Um robô diz que em breve vai substituir todos os trabalhadores de escritório. No segundo quadro, triste, completa: assim que alguém consertar meu Wi-Fi. A mulher pergunta se ele já tentou se desligar e ligar de novo.', panels: [
        { chars: [{ x: .3, kind: 'robot', mood: 'neutral', prop: 'desk' }, { x: .76, shirt: '#26a69a', skin: SKIN.c, hair: '#212121', hairStyle: 'long', mood: 'neutral' }], bubbles: [{ who: 0, text: 'Soon I will replace every office worker!' }] },
        { chars: [{ x: .3, kind: 'robot', mood: 'sad', prop: 'desk' }, { x: .76, shirt: '#26a69a', skin: SKIN.c, hair: '#212121', hairStyle: 'long', mood: 'smug' }], bubbles: [{ who: 0, text: '...as soon as someone fixes my Wi-Fi.' }, { who: 1, text: 'Have you tried turning yourself off and on again?' }] }
      ]
    },
    stem: 'A tirinha ironiza',
    options: ['a resistência dos trabalhadores às novas tecnologias.', 'a eficiência das máquinas em substituir pessoas.', 'a dependência que a própria máquina tem de ajuda humana.', 'a falta de internet nos escritórios modernos.', 'o medo que os robôs sentem dos humanos.'],
    answer: 2,
    explain: 'O robô promete substituir os humanos, mas precisa que “someone” conserte seu Wi-Fi. A resposta da mulher repete o conselho clássico de suporte técnico, invertendo os papéis.'
  },
  {
    id: 'm04', level: 'medio', skill: 'Argumentação',
    text: '★★☆☆☆ Beautiful, but not worth it\nThe headphones look amazing and the sound is clear. However, after two weeks the left side stopped working, and customer service took a month to answer my email. For this price, I expected much more.',
    stem: 'A avaliação do consumidor é negativa principalmente por causa',
    options: ['da aparência e da qualidade do som do produto.', 'do preço baixo em relação à concorrência.', 'da durabilidade do produto e da demora no atendimento.', 'da dificuldade de usar o fone com o celular.', 'do atraso na entrega feita pela loja.'],
    answer: 2,
    explain: 'Aparência e som são elogiados. O problema vem depois de “However”: o lado esquerdo parou de funcionar em duas semanas e o atendimento levou um mês para responder.'
  },
  {
    id: 'm05', level: 'medio', skill: 'Efeito de sentido',
    visual: { type: 'poster', bg: '#1b5e20', fg: '#ffffff', accent: '#ffd54f', icon: 'phone', title: 'Your old phone has gold in it.', body: 'Literally. Don\'t throw electronics in the trash: take them to a recycling point.', footer: 'Recycle your e-waste', alt: 'Cartaz verde-escuro com um celular: Your old phone has gold in it. Literally. Do not throw electronics in the trash: take them to a recycling point.' },
    stem: 'No cartaz, a palavra “Literally” é usada para',
    options: ['indicar que o celular antigo pode ser vendido por um bom preço.', 'enfatizar que a afirmação sobre o ouro deve ser entendida em sentido real.', 'sugerir que a frase anterior é apenas uma metáfora.', 'convencer o leitor a guardar o aparelho como lembrança.', 'explicar o funcionamento de um ponto de reciclagem.'],
    answer: 1,
    explain: '“Has gold in it” poderia ser lido como metáfora (tem valor). “Literally” (literalmente) esclarece que há ouro de verdade nos componentes, reforçando o argumento para reciclar.'
  },
  {
    id: 'm06', level: 'medio', skill: 'Notícia',
    text: 'CITY PLANTS 10,000 TREES IN LOW-INCOME NEIGHBORHOODS\nOfficials say the project will lower temperatures in areas with few parks, where summer heat waves have become a serious health risk, especially for children and the elderly.',
    stem: 'A notícia relaciona o plantio de árvores',
    options: ['à valorização imobiliária de bairros nobres.', 'ao aumento do número de parques de diversão.', 'à redução de riscos à saúde em áreas mais vulneráveis ao calor.', 'à proibição de construções em bairros de baixa renda.', 'à geração de empregos para jovens e idosos.'],
    answer: 2,
    explain: 'As árvores vão “lower temperatures” em bairros de baixa renda (“low-income”) com poucos parques, onde o calor é “a serious health risk”.'
  },
  {
    id: 'm07', level: 'medio', skill: 'Leitura de gráfico',
    visual: { type: 'chart', title: 'Most studied languages on a learning app (millions of learners)', color: '#5b5fc7', data: [['English', 120], ['Spanish', 40], ['French', 25], ['Japanese', 18], ['Korean', 15]], alt: 'Gráfico: línguas mais estudadas em um aplicativo, em milhões: English 120, Spanish 40, French 25, Japanese 18, Korean 15.' },
    stem: 'A partir dos dados do gráfico, conclui-se que',
    options: ['o espanhol tem mais estudantes que o francês e o japonês juntos.', 'o coreano é a língua com maior crescimento no aplicativo.', 'o número de estudantes de inglês supera a soma das outras quatro línguas.', 'metade dos usuários estuda línguas asiáticas.', 'o francês é a segunda língua mais estudada.'],
    answer: 2,
    explain: 'Espanhol + francês + japonês + coreano = 40 + 25 + 18 + 15 = 98 milhões, menos que os 120 milhões do inglês. Francês e japonês juntos (43) superam o espanhol (40), e o gráfico não mostra crescimento ao longo do tempo.'
  },
  {
    id: 'm08', level: 'medio', skill: 'Inferência',
    text: 'Q: Why did you write your first novel in English and not in Portuguese?\nA: I grew up between two languages. Some of my memories only exist in English; others only exist in Portuguese. This story happened to me in English, so I had to tell it that way.',
    stem: 'Na entrevista, a pessoa entrevistada justifica a escolha do idioma do romance pela',
    options: ['maior facilidade de publicar livros em inglês.', 'relação entre a língua e as memórias que deram origem à história.', 'falta de domínio da língua portuguesa.', 'exigência de uma editora estrangeira.', 'intenção de alcançar leitores de vários países.'],
    answer: 1,
    explain: 'Algumas memórias “only exist in English”, e a história aconteceu em inglês, “so I had to tell it that way”: a língua está ligada à vivência.'
  },
  {
    id: 'm09', level: 'medio', skill: 'Expressão idiomática',
    visual: { type: 'post', name: 'Chef Tom', handle: '@chef_tom', color: '#e53935', text: 'Unpopular opinion: pineapple on pizza is actually good. Let people enjoy things.', likes: '2.3k', replies: '4.1k', alt: 'Postagem de Chef Tom: Unpopular opinion: pineapple on pizza is actually good. Let people enjoy things. 2,3 mil curtidas e 4,1 mil respostas.' },
    stem: 'A expressão “Unpopular opinion”, no início da postagem, indica que o autor',
    options: ['acredita que a maioria das pessoas concorda com ele.', 'reconhece que sua opinião vai contra o que muitos pensam.', 'pretende vender um novo sabor de pizza.', 'critica quem gosta de pizza com abacaxi.', 'está respondendo a uma pesquisa de opinião.'],
    answer: 1,
    explain: '“Unpopular” = impopular: o autor admite que poucos concordam. O número de respostas (4.1k), maior que o de curtidas, reforça a polêmica.'
  },
  {
    id: 'm10', level: 'medio', skill: 'Argumentação',
    text: 'Of the roughly 7,000 languages spoken in the world today, about 40% are endangered. When a language disappears, a community loses much more than words: it loses its own ways of naming plants, telling stories and understanding the world.',
    stem: 'O texto argumenta que o desaparecimento de uma língua',
    options: ['afeta apenas o vocabulário de uma comunidade.', 'é compensado pelo aprendizado de línguas globais.', 'representa a perda de saberes e de formas de ver o mundo.', 'atinge principalmente as línguas mais faladas.', 'ocorre porque as comunidades deixam de contar histórias.'],
    answer: 2,
    explain: '“Much more than words” = muito mais que palavras: perdem-se modos de nomear plantas, de contar histórias e de entender o mundo.'
  },
  {
    id: 'm11', level: 'medio', skill: 'Humor em tirinha',
    visual: {
      type: 'comic', alt: 'Tirinha em dois quadros. O pai diz que no tempo dele não havia celulares à mesa; o filho pergunta como eles se ignoravam então. No segundo quadro, o pai se esconde atrás de um jornal.', panels: [
        { chars: [{ x: .3, shirt: '#546e7a', skin: SKIN.b, hair: '#424242', mood: 'smug' }, { x: .74, shirt: '#ffb300', skin: SKIN.b, hair: '#212121', mood: 'neutral', prop: 'phone', flip: true }], bubbles: [{ who: 0, text: 'In my time, we didn\'t have phones at the dinner table.' }, { who: 1, text: 'So how did you ignore each other?' }] },
        { chars: [{ x: .3, shirt: '#546e7a', skin: SKIN.b, hair: '#424242', mood: 'neutral', prop: 'newspaper' }, { x: .74, shirt: '#ffb300', skin: SKIN.b, hair: '#212121', mood: 'smug', prop: 'phone', flip: true }], bubbles: [{ who: 0, text: '...' }] }
      ]
    },
    stem: 'O humor da tirinha sugere que',
    options: ['o pai nunca leu jornal durante as refeições.', 'o hábito de se isolar à mesa já existia, com outros meios.', 'as pessoas de antigamente conversavam mais que as de hoje.', 'o filho prefere ler jornal a usar o celular.', 'os celulares foram proibidos nas refeições da família.'],
    answer: 1,
    explain: 'O pai critica os celulares, mas no último quadro se esconde atrás do jornal: o filho mostra que o isolamento já acontecia, só mudou o meio.'
  },
  {
    id: 'm12', level: 'medio', skill: 'Gênero e-mail',
    text: 'Dear Ms. Carter,\nThank you for your interest in the Marketing Assistant position. Although your profile is impressive, we have decided to move forward with other candidates at this time. We will keep your CV on file and contact you if a suitable opportunity comes up.\nKind regards,\nHR Team',
    stem: 'O e-mail tem como finalidade',
    options: ['convidar a candidata para uma entrevista.', 'comunicar, de forma cordial, que a candidata não foi selecionada.', 'solicitar o envio de um novo currículo.', 'oferecer uma vaga em outro departamento.', 'informar que o processo seletivo foi cancelado.'],
    answer: 1,
    explain: '“Although your profile is impressive” suaviza a notícia; “we have decided to move forward with other candidates” = decidimos seguir com outros candidatos, ou seja, uma recusa.'
  },

  /* ======================= DIFÍCIL ======================= */
  {
    id: 'd01', level: 'dificil', skill: 'Sátira',
    text: 'BREAKING NEWS: Local man finally reads the Terms and Conditions of an app — and discovers he has owned a goat farm since 2014.\n“I just wanted to use a photo filter,” said the confused new farmer.',
    stem: 'Esse texto satírico critica',
    options: ['a falta de opções de filtros nos aplicativos de foto.', 'o costume de aceitar termos de uso sem lê-los.', 'o crescimento do número de fazendas digitais.', 'a dificuldade de criar animais nas cidades.', 'a demora das empresas em atualizar seus contratos.'],
    answer: 1,
    explain: 'O absurdo (ele descobre ser dono de uma fazenda desde 2014) exagera as consequências de aceitar contratos sem ler. “Finally reads” indica que ele, como muita gente, nunca lia.'
  },
  {
    id: 'd02', level: 'dificil', skill: 'Linguagem poética',
    text: 'SAFE\nWe built taller walls\nto feel safe,\nand when no one could reach us\nwe called the silence peace.',
    stem: 'No poema, o eu lírico sugere que',
    options: ['muros altos são a melhor forma de garantir a paz.', 'a paz só é possível quando há diálogo entre vizinhos.', 'o isolamento produziu uma falsa sensação de paz.', 'o silêncio das cidades é resultado da violência urbana.', 'a construção de muros foi exigida pelos moradores.'],
    answer: 2,
    explain: 'Os muros afastaram todos (“no one could reach us”), e o silêncio resultante foi apenas “chamado” de paz: o verbo “called” revela que é um nome dado ao isolamento, não paz verdadeira.'
  },
  {
    id: 'd03', level: 'dificil', skill: 'Crítica em tirinha',
    visual: {
      type: 'comic', alt: 'Tirinha em dois quadros. Num púlpito com a placa Climate Summit, um líder diz que é preciso agir contra a mudança climática imediatamente. No segundo quadro, ao lado da placa Private Jet, completa: logo depois que meu jatinho particular me levar para casa.', panels: [
        { sign: { text: 'CLIMATE SUMMIT', x: 236, color: '#e8f5e9' }, chars: [{ x: .36, shirt: '#263238', skin: SKIN.a, hair: '#9e9e9e', mood: 'neutral', prop: 'podium' }], bubbles: [{ who: 0, text: 'We must act on climate change immediately!' }] },
        { sign: { text: 'PRIVATE JET', x: 236, color: '#eceff1' }, chars: [{ x: .36, shirt: '#263238', skin: SKIN.a, hair: '#9e9e9e', mood: 'smug' }], bubbles: [{ who: 0, text: '...right after my private jet takes me home.' }] }
      ]
    },
    stem: 'A tirinha critica',
    options: ['a ausência de líderes em encontros sobre o clima.', 'a incoerência entre o discurso ambiental e a prática de quem o faz.', 'o alto custo das viagens para cúpulas internacionais.', 'a lentidão dos governos em aprovar leis ambientais.', 'a preferência dos cidadãos por transportes particulares.'],
    answer: 1,
    explain: 'O líder pede ação imediata contra a mudança climática, mas viaja de jatinho particular, meio de transporte muito poluente: a crítica está na contradição.'
  },
  {
    id: 'd04', level: 'dificil', skill: 'Linguagem figurada',
    text: 'We are often told that hard work always leads to success. Yet this story conveniently forgets the student who works two jobs and still cannot afford books, or the talented girl whose town has no secondary school. Effort matters, of course. But even the best seed does not grow in empty soil.',
    stem: 'Com a frase “even the best seed does not grow in empty soil”, o autor defende que',
    options: ['o talento individual é suficiente para alcançar o sucesso.', 'o esforço pessoal depende de condições sociais para dar resultado.', 'estudantes que trabalham não devem continuar estudando.', 'a agricultura é uma alternativa para jovens sem escola.', 'o sucesso independe de oportunidades educacionais.'],
    answer: 1,
    explain: 'A semente (talento, esforço) precisa de solo fértil (oportunidades, escola, recursos). “Yet” e “conveniently forgets” mostram que o autor contesta a ideia de que basta trabalhar duro.'
  },
  {
    id: 'd05', level: 'dificil', skill: 'Estratégia persuasiva',
    visual: { type: 'poster', bg: '#4e342e', fg: '#fff3e0', accent: '#ffb74d', icon: 'cup', title: 'Strong Coffee Co.', body: 'Because Monday doesn\'t care about your feelings.', footer: 'Open every day from 6 a.m.', alt: 'Anúncio marrom com uma xícara: Strong Coffee Co. Because Monday does not care about your feelings.' },
    stem: 'Para persuadir o consumidor, o anúncio recorre',
    options: ['a informações técnicas sobre a origem do café.', 'ao humor, apresentando o produto como aliado diante de uma rotina difícil.', 'a uma crítica direta às empresas que funcionam às segundas.', 'à promessa de que o café melhora as emoções de forma duradoura.', 'a um apelo à saúde, destacando os benefícios da cafeína.'],
    answer: 1,
    explain: 'A segunda-feira é personificada (“doesn\'t care about your feelings”): ela não se importa com o seu cansaço, então o café forte seria a ajuda para enfrentá-la. Não há dado técnico nem promessa de saúde.'
  },
  {
    id: 'd06', level: 'dificil', skill: 'Crítica implícita',
    text: 'A T-shirt that costs less than a sandwich is not a bargain. Someone, somewhere, is paying the difference: the worker who earns too little to buy what she sews, or the river that turns the color of this season\'s trend.',
    stem: 'Para o autor, o preço muito baixo de uma camiseta',
    options: ['é uma vantagem que deve ser aproveitada pelo consumidor.', 'resulta da evolução tecnológica da indústria têxtil.', 'esconde custos sociais e ambientais pagos por outros.', 'é justificado pela baixa qualidade do tecido.', 'depende do preço dos alimentos nas grandes cidades.'],
    answer: 2,
    explain: '“Is not a bargain” (não é uma pechincha) e “someone is paying the difference” apontam quem paga: a trabalhadora mal remunerada e o rio poluído pelas tintas da moda.'
  },
  {
    id: 'd07', level: 'dificil', skill: 'Texto literário',
    text: 'Maya kept her father\'s watch long after it stopped. She never had it repaired. “It shows the exact time he left,” she would say, “and some clocks deserve to rest.”',
    stem: 'A atitude de Maya em relação ao relógio revela',
    options: ['descuido com os objetos deixados pelo pai.', 'falta de dinheiro para levar o relógio ao conserto.', 'o desejo de manter viva a memória do pai, ligada ao momento da perda.', 'a intenção de vender o relógio como antiguidade.', 'a crença de que o relógio voltaria a funcionar sozinho.'],
    answer: 2,
    explain: 'O relógio parado marca “the exact time he left” (a hora exata em que ele partiu). Não consertá-lo é uma forma de preservar esse momento e a memória do pai.'
  },
  {
    id: 'd08', level: 'dificil', skill: 'Leitura crítica de dados',
    visual: { type: 'chart', title: 'Teens: daily screen time and average hours of sleep per night', color: '#8e24aa', decimalComma: false, unit: ' h', data: [['< 2 h', 8.5], ['2–4 h', 7.6], ['4–6 h', 6.9], ['> 6 h', 6.1]], note: 'Survey with 3,000 teenagers. Left: screen time per day.', alt: 'Gráfico: tempo de tela diário e média de horas de sono. Menos de 2 h: 8,5 h de sono; 2 a 4 h: 7,6; 4 a 6 h: 6,9; mais de 6 h: 6,1. Pesquisa com 3.000 adolescentes.' },
    stem: 'Os dados apresentados permitem afirmar que',
    options: ['o uso de telas é a única causa da falta de sono entre adolescentes.', 'adolescentes que usam menos telas dormem, em média, mais horas.', 'todos os adolescentes pesquisados dormem menos de oito horas.', 'quem dorme mais passa a usar mais telas no dia seguinte.', 'mais de seis horas de tela garantem um sono de qualidade.'],
    answer: 1,
    explain: 'O gráfico mostra uma associação: quanto mais tempo de tela, menos horas de sono (de 8,5 h para 6,1 h). Ele não prova que a tela seja a única causa: uma pesquisa desse tipo indica relação, não causalidade.'
  },
  {
    id: 'd09', level: 'dificil', skill: 'Ironia',
    visual: { type: 'post', name: 'Ana', handle: '@ana_reads', color: '#8e24aa', text: 'Me: I\'ll read just one chapter before bed.\nAlso me, at 3 a.m.: Well, I can\'t stop now, there are only 200 pages left.', likes: '15k', replies: '312', alt: 'Postagem de Ana: Me: I will read just one chapter before bed. Also me, at 3 a.m.: Well, I cannot stop now, there are only 200 pages left.' },
    stem: 'O efeito de humor da postagem é construído principalmente',
    options: ['pela crítica à baixa qualidade dos livros atuais.', 'pelo contraste entre a intenção inicial e o comportamento real da autora.', 'pela reclamação da autora sobre a insônia.', 'pela informação de que o livro tinha poucos capítulos.', 'pela recomendação de ler apenas antes de dormir.'],
    answer: 1,
    explain: 'Ela planeja ler “just one chapter”, mas às 3h da manhã ainda está lendo. O “only 200 pages left” é irônico: 200 páginas não é pouco, o que mostra o quanto ela estava envolvida.'
  },
  {
    id: 'd10', level: 'dificil', skill: 'Discurso',
    text: 'They told us we were too young to understand. But we understand perfectly that we will live in the world you leave behind. Do not ask us to be patient with a future that is not waiting for anyone.',
    stem: 'No trecho de discurso, quem fala',
    options: ['concorda que os jovens ainda não compreendem os problemas atuais.', 'pede paciência aos jovens até que se tornem adultos.', 'inverte o argumento da inexperiência para cobrar ação urgente.', 'agradece aos adultos pelo mundo que vão deixar.', 'defende que o futuro deve ser planejado com calma.'],
    answer: 2,
    explain: 'A fala retoma “too young to understand” e responde que entende perfeitamente: serão os jovens que viverão no mundo deixado pelos adultos. “A future that is not waiting” justifica a urgência.'
  },
  {
    id: 'd11', level: 'dificil', skill: 'Crítica em tirinha',
    visual: {
      type: 'comic', alt: 'Tirinha em dois quadros. Numa entrevista de emprego, o entrevistador diz que procura alguém jovem, por volta de 22 anos, com pelo menos 10 anos de experiência. No segundo quadro, o candidato pergunta se deveria ter começado a trabalhar aos doze.', panels: [
        { chars: [{ x: .28, shirt: '#37474f', skin: SKIN.a, hair: '#bdbdbd', mood: 'neutral', prop: 'desk' }, { x: .76, shirt: '#00897b', skin: SKIN.c, hair: '#212121', mood: 'shock' }], bubbles: [{ who: 0, text: 'We want someone young, around 22, with at least 10 years of experience.' }] },
        { chars: [{ x: .28, shirt: '#37474f', skin: SKIN.a, hair: '#bdbdbd', mood: 'neutral', prop: 'desk' }, { x: .76, shirt: '#00897b', skin: SKIN.c, hair: '#212121', mood: 'smug' }], bubbles: [{ who: 1, text: 'So... I should have started working at twelve?' }] }
      ]
    },
    stem: 'A tirinha critica',
    options: ['a falta de jovens interessados no mercado de trabalho.', 'a contratação de crianças por grandes empresas.', 'a exigência contraditória feita a candidatos jovens.', 'a preferência das empresas por profissionais mais velhos.', 'a pouca experiência dos entrevistadores.'],
    answer: 2,
    explain: 'Ter 22 anos e 10 anos de experiência implicaria trabalhar desde os 12. A pergunta do candidato evidencia o absurdo da exigência.'
  },
  {
    id: 'd12', level: 'dificil', skill: 'Linguagem figurada',
    text: 'Some words refuse to travel. The Portuguese “saudade” arrives in English as “longing”, “nostalgia” or “missing someone” — and yet something always stays behind at the border.',
    stem: 'A afirmação “something always stays behind at the border” indica que',
    options: ['a palavra “saudade” é proibida em países de língua inglesa.', 'nenhuma tradução consegue transmitir integralmente o sentido de “saudade”.', '“longing” é a tradução exata de “saudade”.', 'os viajantes sentem saudade ao cruzar fronteiras.', 'o inglês possui mais palavras para sentimentos que o português.'],
    answer: 1,
    explain: 'É uma metáfora de viagem: a palavra “chega” ao inglês por várias traduções, mas algo do sentido “fica na fronteira”, isto é, se perde.'
  }
];
const LEVELS = {
  facil: { name: 'Fácil', color: '#43a047', soft: '#e8f5e9', desc: 'Textos curtos e informação explícita' },
  medio: { name: 'Médio', color: '#f9a825', soft: '#fff8e1', desc: 'Finalidade do texto e inferências' },
  dificil: { name: 'Difícil', color: '#e53935', soft: '#ffebee', desc: 'Ironia, crítica e linguagem figurada' }
};
