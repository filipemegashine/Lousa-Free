'use strict';
/* =====================================================================
   Questões oficiais de Inglês do ENEM 2014–2025 (caderno Azul)
   As imagens das questões NÃO estão no app: são lidas do PDF do usuário
   (Enem_Ingles_2014-2025.pdf) e guardadas só no aparelho (IndexedDB).
   Aqui ficam apenas: ordem, ano, número, gabarito oficial do INEP,
   dificuldade, habilidade e uma explicação curta escrita para o app.
   ===================================================================== */
const ENEM_META = [
  // ---- 2014 (2º dia, Q91–95) ----
  [2014, 91, 'A', 'medio', 'Expressões idiomáticas', '“A tall order” é uma tarefa difícil, e o subtítulo brinca com “o céu é o limite”. A matéria trata da torre que “some” ao projetar na fachada o que está atrás dela: uma inovação tecnológica em Seul.'],
  [2014, 92, 'C', 'dificil', 'Canção de protesto', 'A canção se dirige a quem fabrica armas e lucra com a guerra sem lutar nela, mandando outros para o front. A crítica é ao sistema que recruta soldados para guerras movidas por interesses econômicos.'],
  [2014, 93, 'A', 'medio', 'Metáfora', 'Escolher a estrada “menos percorrida” é a metáfora de uma decisão ousada. O eu lírico diz que isso fez toda a diferença: ele celebra a escolha que fez.'],
  [2014, 94, 'C', 'facil', 'Gênero digital', 'Kate informa o que quer compartilhar e quanto costuma pagar, e o site calcula quantas crianças serão alimentadas: é uma doação para caridade.'],
  [2014, 95, 'D', 'dificil', 'Compreensão global', 'O criador diz que o Globish não é uma língua, mas uma ferramenta: um inglês simplificado e com regras para todos se entenderem. Cuidado com B: no texto, o falante nativo justamente não entende a conversa.'],
  // ---- 2015 (2º dia, Q91–95) ----
  [2015, 91, 'D', 'facil', 'Poema e cultura', 'O poema chama a estrela, a terra, o sol e a lua de irmão, mãe, pai e irmã: a natureza aparece como família, o que mostra a sua importância.'],
  [2015, 92, 'E', 'medio', 'Humor e ambiguidade', 'Uma amiga fala de “season” pensando no outono; a outra, na temporada de futebol. O mal-entendido vem dos dois sentidos da mesma palavra.'],
  [2015, 93, 'A', 'medio', 'Finalidade do texto', 'O trecho começa perguntando por que ela escreve e responde com uma sequência de “because”: a autora apresenta os motivos que a levam a escrever.'],
  [2015, 94, 'A', 'facil', 'Informação principal', 'O texto mostra que imagens manipuladas em programas de edição criam lembranças falsas: a memória é influenciada pela alteração de imagens.'],
  [2015, 95, 'C', 'medio', 'Gênero aviso', 'O aviso comunica ao passageiro que a mala dele foi selecionada e revistada pela TSA. O pedido de desculpas pelo cadeado é só uma parte do texto, não o objetivo.'],
  // ---- 2016 (2º dia, Q91–95) ----
  [2016, 91, 'C', 'medio', 'Informação específica', 'A bio-tinta ainda não reproduz órgãos complexos como rim e fígado. Por enquanto, o mais promissor é imprimir pele e outros tecidos finos.'],
  [2016, 92, 'E', 'facil', 'Cartaz', 'O cartaz pergunta se você saberia o que fazer se um desastre acontecesse ali e indica o site de um guia de preparação para emergências.'],
  [2016, 93, 'D', 'facil', 'Notícia', 'A universidade vai dar a maioria dos cursos em inglês para não ficar isolada e competir internacionalmente: troca o italiano pelo inglês por causa da globalização.'],
  [2016, 94, 'E', 'medio', 'Canção e metáfora', 'As teclas pretas (ébano) e brancas (marfim) convivem em harmonia no piano. A canção usa essa imagem para defender a convivência entre pessoas de etnias diferentes.'],
  [2016, 95, 'A', 'medio', 'Vocabulário em contexto', 'BOGOF é a sigla de uma promoção de supermercado (compre um, leve outro). O som parecido com “Bog off!” é só uma curiosidade do texto: a alternativa B é uma armadilha.'],
  // ---- 2017 (1º dia, Q01–05) ----
  [2017, 1, 'D', 'facil', 'Opinião', 'A autora se impressiona com o fato de Frida não tentar se encaixar em padrões e assumir a própria beleza, que era única.'],
  [2017, 2, 'D', 'medio', 'Notícia', 'O governo vai criar um programa de formação para jovens de 18 anos trabalharem nos serviços secretos. Cuidado com C: “geração Xbox” só descreve a geração, não é critério de recrutamento.'],
  [2017, 3, 'C', 'medio', 'Anúncio', 'Trocar o óleo em “qualquer lugar” pode fazer você se arrepender mais adiante, como mostra a imagem do vazamento: o anúncio defende a escolha da empresa certa.'],
  [2017, 4, 'D', 'medio', 'Carta do leitor', 'A autora considera abominável deixar armas carregadas ao alcance de crianças e cobra mudanças: ela expõe indignação com a negligência de quem tem armas.'],
  [2017, 5, 'E', 'dificil', 'Finalidade do texto', 'O guia comenta religião, história, população e política para apresentar o país de forma geral e atraente. Ele não lista pontos turísticos nem dá recomendações de segurança.'],
  // ---- 2018 ----
  [2018, 1, 'B', 'facil', 'Vocabulário', 'Shower (banho), bus (ônibus) e homeless (sem-teto): o projeto transforma ônibus desativados em chuveiros para moradores de rua.'],
  [2018, 2, 'B', 'facil', 'Cartum', 'Desde pequeno o garoto ouve que precisa agir como alguém mais velho; ele exagera dizendo que vai se aposentar antes de terminar a escola. A crítica é à cobrança por amadurecimento precoce.'],
  [2018, 3, 'D', 'dificil', 'Poema e identidade', 'A poeta afirma que o inglês que fala, metade inglês e metade indiano, é dela e expressa suas emoções: ela demonstra consciência da própria identidade linguística.'],
  [2018, 4, 'E', 'dificil', 'Dois textos', 'O segundo autor critica a ideia de educação como “sentar e receber” em que o site se baseia. Ele defende fazer coisas melhores, não fazer melhor a mesma coisa.'],
  [2018, 5, 'C', 'facil', 'Texto literário', 'O Partido diz controlar os registros e as memórias e, assim, o passado: o controle do Estado se dá pelo poder sobre memórias e registros.'],
  // ---- 2019 ----
  [2019, 1, 'B', 'medio', 'Argumentação', 'Citar pesquisas e estudos dá autoridade ao texto para convencer o leitor de que ter um animal de estimação faz bem à saúde.'],
  [2019, 2, 'D', 'dificil', 'Carta do leitor', 'O autor rebate a ideia do açúcar como grande vilão e conclui que é preciso continuar estudando a obesidade. Ele não defende consumo liberado de açúcar nem diz que a obesidade é irrelevante.'],
  [2019, 3, 'A', 'facil', 'Canção', 'A letra fala de um amigo de 23 anos que partiu cedo demais, sem chance de despedida: o sofrimento vem da morte precoce.'],
  [2019, 4, 'B', 'facil', 'Poema', 'Todos os versos seguem o mesmo padrão: se a criança vive com algo, aprende algo. A ideia é que as crianças aprendem com o que vivem.'],
  [2019, 5, 'E', 'medio', 'Cartum', 'O aluno está diante de um livro impresso e pergunta como “ligar” aquilo, como se fosse um aparelho: ele não sabe usar um livro de papel.'],
  // ---- 2020 ----
  [2020, 1, 'A', 'facil', 'Campanha', 'As sugestões automáticas de busca mostram frases preconceituosas sobre mulheres, e a frase final rejeita essa discriminação: a campanha critica o tratamento dado à mulher.'],
  [2020, 2, 'A', 'medio', 'Campanha', 'As pessoas seguram fotos de fantasias que imitam suas culturas e dizem que aquilo não as representa: a campanha critica a estereotipação de povos.'],
  [2020, 3, 'E', 'dificil', 'Poema', 'O poema descreve cheiros, imagens e gestos do campo de refugiados, como o ar pesado e o pente quebrado: a reflexão é construída por impressões sensoriais.'],
  [2020, 4, 'D', 'dificil', 'Poema', 'O eu lírico admite que a culpa era em parte dele e que o pássaro não tinha culpa por cantar: ele passa a respeitar a natureza do pássaro. A irritação (E) é o ponto de partida, não a conclusão.'],
  [2020, 5, 'C', 'dificil', 'Texto literário', 'Ifemelu recusa alisar o cabelo e defende usá-lo natural, até tentando convencer outras mulheres: uma atitude de resistência a um padrão.'],
  // ---- 2021 ----
  [2021, 1, 'C', 'dificil', 'Argumentação', 'O autor diz que as celebridades não são as únicas culpadas: a sociedade perdeu a capacidade de pensar por si. O objetivo é levar o público a refletir.'],
  [2021, 2, 'A', 'medio', 'Gênero textual', 'O poema imita uma receita (ingredientes, mexer, deixar cozinhar) para mostrar que a Inglaterra nasceu da mistura de muitos povos e que essa mistura é rica.'],
  [2021, 3, 'A', 'medio', 'Vocabulário em contexto', 'Mulheres negras nem eram chamadas de “Miss”; imaginar uma delas como primeira-dama seria impensável. A palavra mostra como a ascensão social era improvável.'],
  [2021, 4, 'B', 'medio', 'Expressão idiomática', '“At odds with” indica conflito: o desejo de estar bem informado se choca com o de manter a sanidade. É difícil conciliar os dois.'],
  [2021, 5, 'B', 'medio', 'Roteiro de filme', 'Celine acha a beleza da Europa opressiva e Los Angeles “neutra”, enquanto outra pessoa poderia pensar o contrário: a avaliação depende do olhar de quem visita.'],
  // ---- 2022 ----
  [2022, 1, 'D', 'medio', 'Relato pessoal', 'O autor conta que, em Miami, quase todos eram cubanos e ele não se sentia minoria: ele descreve como a comunidade cubana se integrou nos EUA.'],
  [2022, 2, 'C', 'dificil', 'Finalidade do texto', 'O texto parte da época de Jane Austen e chega aos aplicativos de namoro para comparar o que se espera de um parceiro em épocas diferentes.'],
  [2022, 3, 'B', 'facil', 'Tirinha', 'Diante de ameaças cada vez mais assustadoras, a mulher só se importa com a biblioteca e fica lendo: o humor está no gosto dela pela leitura.'],
  [2022, 4, 'D', 'facil', 'Vocabulário', '“Downsides” significa desvantagens: a partir daí o texto fala de insegurança, ansiedade e depressão entre adolescentes.'],
  [2022, 5, 'E', 'dificil', 'Poema', 'O eu lírico relê mensagens, procura sinais e sente que nada do que digita será ouvido: há insatisfação com essa forma de comunicação, não mágoa com uma pessoa.'],
  // ---- 2023 ----
  [2023, 1, 'B', 'facil', 'Campanha', 'O cartaz mostra que os americanos jogam fora muita comida e que ela é a maior fonte dos aterros: o desperdício prejudica o ambiente.'],
  [2023, 2, 'B', 'medio', 'Poema', 'Ninguém é uma ilha: cada pessoa faz parte do todo, e a morte de alguém afeta o eu lírico. A ideia central é a de conexão entre as pessoas.'],
  [2023, 3, 'D', 'dificil', 'Poema', 'A lista do que os refugiados carregam (lágrimas, diplomas, línguas, memórias de guerras e desastres) mostra a diversidade de experiências de cada um.'],
  [2023, 4, 'A', 'medio', 'Poema bilíngue', 'O poema mistura inglês e espanhol e celebra o Spanglish: o eu lírico destaca o encontro entre línguas e culturas.'],
  [2023, 5, 'B', 'medio', 'Ironia em cartum', 'Todos no escritório são homens brancos de terno, então a fala sobre não haver discriminação é irônica: o cartum aponta a falta de diversidade.'],
  // ---- 2024 ----
  [2024, 1, 'C', 'medio', 'Citações', 'As duas frases dizem que dá para tirar algo bom das dificuldades, seja encontrar oportunidade, seja viver a chuva: é preciso aproveitar situações adversas.'],
  [2024, 2, 'A', 'facil', 'Conectivo', '“Instead of” significa “em vez de”: a letra propõe amar e cuidar mais em vez de alimentar a guerra, ou seja, uma mudança de comportamento.'],
  [2024, 3, 'A', 'facil', 'Linguagem visual', 'A janela de “70% deletado” mostra árvores sumindo da Terra como arquivos sendo apagados: um alerta sobre a destruição rápida da natureza.'],
  [2024, 4, 'A', 'medio', 'Relato', 'A autora era punida e obrigada a fazer aulas para perder o sotaque: o problema é a rejeição ao sotaque espanhol no uso do inglês.'],
  [2024, 5, 'E', 'medio', 'Carta', 'A editora elogia a história, mas diz que vai “pass on” (dispensar) o manuscrito por causa dos pontos de exclamação: é uma carta de recusa, em tom satírico.'],
  // ---- 2025 ----
  [2025, 1, 'D', 'medio', 'Notícia', 'A entrevistada critica fantasias que usam elementos da cultura indígena de forma ofensiva, ignorando quem vive essa cultura.'],
  [2025, 2, 'D', 'medio', 'Argumentação', 'Para a autora, a filosofia que não ajuda a resolver problemas humanos, como pobreza e opressão, não merece esse nome: ela aproxima a filosofia dos problemas sociais.'],
  [2025, 3, 'D', 'medio', 'Poema', 'O poema pede que se lembre do céu, da terra, das plantas e dos animais e afirma que somos terra: destaca a relação entre seres humanos e natureza.'],
  [2025, 4, 'E', 'dificil', 'Expressão', '“Snowflake generation” (geração floco de neve) descreve jovens frágeis, que não lidam bem com ideias contrárias e frustrações.'],
  [2025, 5, 'A', 'facil', 'Imagem e texto', 'O copo maior é para quem nem sabe o que é dormir: a brincadeira relaciona o tamanho do café à falta de horas de sono.']
];

/* ---------- leitor mínimo de PDF: extrai as imagens JPEG na ordem das páginas ---------- */
const PdfImages = {
  latin1(buf) { let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000)); return s; },
  a85(bytes) {
    let s = ''; for (let i = 0; i < bytes.length; i++) { const c = bytes[i]; if (c > 32) s += String.fromCharCode(c); }
    if (s.startsWith('<~')) s = s.slice(2); const e = s.indexOf('~>'); if (e >= 0) s = s.slice(0, e);
    const out = []; let g = [];
    for (const ch of s) {
      if (ch === 'z' && !g.length) { out.push(0, 0, 0, 0); continue; }
      g.push(ch.charCodeAt(0) - 33);
      if (g.length === 5) { let n = 0; for (const d of g) n = n * 85 + d; out.push((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255); g = []; }
    }
    if (g.length) { const k = g.length; while (g.length < 5) g.push(84); let n = 0; for (const d of g) n = n * 85 + d; out.push(...[(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].slice(0, k - 1)); }
    return new Uint8Array(out);
  },
  async inflate(bytes) {
    if (!('DecompressionStream' in window)) return null;
    const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
    return new Uint8Array(await new Response(ds).arrayBuffer());
  },
  async extract(buf) {
    const s = this.latin1(buf), objs = new Map();
    const re = /(?:^|[\r\n])(\d+) 0 obj\b/g; let m;
    while ((m = re.exec(s))) { const start = m.index + m[0].length, end = s.indexOf('endobj', start); objs.set(+m[1], { start, end, body: s.slice(start, Math.min(end, start + 4000)) }); }
    const body = n => objs.get(n)?.body || '';
    const stream = async n => {
      const o = objs.get(n); if (!o) return null;
      const si = s.indexOf('stream', o.start); if (si < 0 || si > o.end) return null;
      let p = si + 6; if (s[p] === '\r') p++; if (s[p] === '\n') p++;
      const len = +((o.body.match(/\/Length (\d+)/) || [])[1] || 0);
      let b = buf.subarray(p, p + len);
      if (/\/ASCII85Decode/.test(o.body)) b = this.a85(b);
      if (/\/FlateDecode/.test(o.body)) b = await this.inflate(b);
      return b;
    };
    const root = +((s.match(/\/Pages (\d+) 0 R/) || [])[1] || 0);
    const pages = [];
    const walk = n => { const b = body(n); if (/\/Type \/Pages/.test(b)) { const kids = (b.match(/\/Kids \[([^\]]*)\]/) || [])[1] || ''; for (const k of kids.matchAll(/(\d+) 0 R/g)) walk(+k[1]); } else pages.push(n); };
    walk(root);
    const images = [];
    for (const pg of pages) {
      const b = body(pg);
      let xtxt = (b.match(/\/XObject <<([\s\S]*?)>>/) || [])[1];
      if (!xtxt) { const r = b.match(/\/XObject (\d+) 0 R/); if (r) xtxt = body(+r[1]); }
      if (!xtxt) continue;
      const names = new Map(); for (const x of xtxt.matchAll(/\/([^\s/<>\[\]]+) (\d+) 0 R/g)) names.set(x[1], +x[2]);
      let order = [...names.keys()];
      const c = b.match(/\/Contents (\d+) 0 R/);
      if (c) { const cs = await stream(+c[1]); if (cs) { const txt = this.latin1(cs); const seq = [...txt.matchAll(/\/([^\s/<>\[\]]+)\s+Do\b/g)].map(x => x[1]).filter(x => names.has(x)); if (seq.length) order = seq; } }
      for (const name of order) {
        const on = names.get(name), ob = body(on);
        if (!/\/Subtype \/Image/.test(ob) || !/\/DCTDecode/.test(ob)) continue;
        const bytes = await stream(on);
        if (bytes && bytes[0] === 0xFF && bytes[1] === 0xD8) images.push(bytes.slice());
      }
    }
    return images;
  }
};

/* ---------- armazenamento e montagem das questões ---------- */
const Enem = {
  count: 0, urls: new Map(), loading: null,
  async init() {
    try { this.count = await DB.req(DB.st('enem', 'readonly').count()); } catch { this.count = 0; }
    if (!this.count) await this.tryLocal();
    return this.count;
  },
  // no servidor local, a pasta provas-local/ (que não vai para o GitHub) já tem o PDF
  async tryLocal() {
    try {
      const r = await fetch('provas-local/enem.pdf', { cache: 'no-store' });
      if (r.ok && /pdf/.test(r.headers.get('content-type') || '')) await this.importPdf(await r.blob());
    } catch { }
  },
  async importPdf(file) {
    const imgs = await PdfImages.extract(new Uint8Array(await file.arrayBuffer()));
    if (imgs.length !== ENEM_META.length) throw new Error(`Este PDF tem ${imgs.length} imagem(ns) de questão; o esperado são ${ENEM_META.length} (Enem_Ingles_2014-2025.pdf).`);
    await new Promise((res, rej) => {
      const tx = DB.db.transaction('enem', 'readwrite'), st = tx.objectStore('enem');
      st.clear(); imgs.forEach((b, i) => st.put({ id: i + 1, data: b.buffer }));
      tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
    });
    this.urls.forEach(u => URL.revokeObjectURL(u)); this.urls.clear();
    this.count = imgs.length;
  },
  async remove() { await new Promise(res => { const tx = DB.db.transaction('enem', 'readwrite'); tx.objectStore('enem').clear(); tx.oncomplete = res; tx.onerror = res; }); this.count = 0; this.urls.clear(); },
  async url(k) {
    if (this.urls.has(k)) return this.urls.get(k);
    const rec = await DB.get('enem', k); if (!rec) return '';
    const u = URL.createObjectURL(new Blob([rec.data], { type: 'image/jpeg' })); this.urls.set(k, u); return u;
  },
  questions() {
    if (!this.count) return [];
    return ENEM_META.map(([year, n, ans, level, skill, explain], i) => ({
      id: 'enem' + (i + 1), official: true, pdfImg: i + 1, year, level, skill, explain,
      source: `ENEM ${year} · Q${String(n).padStart(2, '0')}`,
      options: ['', '', '', '', ''], answer: 'ABCDE'.indexOf(ans)
    }));
  }
};
