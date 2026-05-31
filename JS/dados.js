// ============================================================
// DADOS DO FLUXO — Pesquisa institucional + Quiz da Amazônia
// Embutido como objeto local (sem fetch) = mais leve para rede móvel.
// Perguntas curtas de propósito (leitura em < 3s). Conteúdo é EDITÁVEL.
// ============================================================

// PERFIL — qualificação coletada de TODOS na Captura (2ª tela). Sem resposta certa.
// Vai para as colunas "Pretende graduação" e "Curso" da aba Leads.
const PERFIL = [
  {
    id: "graduacao",
    pergunta: "Você pretende iniciar uma graduação?",
    opcoes: ["Sim", "Talvez", "Não"],
  },
  {
    id: "area",
    pergunta: "Qual área mais te atrai?",
    opcoes: ["Saúde", "Tecnologia", "Gestão", "Educação"],
  },
];

// PESQUISA — "Laboratório Vivo": aprendizagem permanente entre brasileiros em Milão.
// Fonte: Pesquisa_Festa_Primavera_2026.md. As respostas vão para a aba "Pesquisa"
// (1 coluna por pergunta, ligada pelo código). A ORDEM/IDS definem as colunas.
// 'max' = múltipla escolha com limite; 'multi: true' = quantas quiser; sem nenhum = escolha única.
const PESQUISA = [
  {
    id: "trajetoria",
    pergunta: "Sua principal atividade hoje na Itália, comparada com o Brasil:",
    opcoes: [
      "Mesma área e mesmo nível",
      "Mesma área, nível menor",
      "Mesma área, nível maior",
      "Área diferente",
      "Não trabalho atualmente",
      "Nunca trabalhei no Brasil",
    ],
  },
  {
    id: "ultimo_curso",
    pergunta: "Quando concluiu seu último curso ou formação?",
    opcoes: [
      "Nos últimos 12 meses",
      "Entre 1 e 3 anos",
      "Entre 3 e 5 anos",
      "Entre 5 e 10 anos",
      "Há mais de 10 anos",
      "Nunca concluí curso formal",
    ],
  },
  {
    id: "fonte_aprendizagem",
    pergunta: "Principal fonte de aprendizagem hoje:",
    max: 2,
    opcoes: [
      "Curso em instituição brasileira",
      "Curso em instituição italiana",
      "Vídeos curtos (Reels, TikTok, Shorts)",
      "Vídeos longos (YouTube, aulas)",
      "ChatGPT ou outra IA",
      "Podcasts",
      "Livros",
      "Aprendo no trabalho",
      "Não estou aprendendo nada formalmente agora",
    ],
  },
  {
    id: "barreira",
    pergunta: "Principal barreira para estudar ou se requalificar na Itália:",
    max: 2,
    opcoes: [
      "Tempo",
      "Dinheiro",
      "Idioma italiano",
      "Reconhecimento de títulos",
      "Não sei por onde começar",
      "Falta de oferta em português",
      "Família / filhos",
      "Outro",
    ],
  },
  {
    id: "confianca",
    pergunta: "Em quem você mais confiaria para indicar um curso?",
    opcoes: [
      "Família",
      "Amigos brasileiros aqui",
      "Comunidade brasileira (igreja, associações)",
      "Empregador",
      "Instituição de ensino",
      "Redes sociais / influenciadores",
      "Ninguém, decido sozinho(a)",
    ],
  },
  {
    id: "valor_diploma",
    pergunta: "Quanto um diploma brasileiro reconhecido te ajudaria hoje?",
    opcoes: ["1 — Nada", "2 — Pouco", "3 — Talvez", "4 — Bastante", "5 — Mudaria minha vida"],
  },
  {
    id: "formato",
    pergunta: "Qual formato de estudo você consideraria fazer?",
    multi: true,
    opcoes: [
      "100% presencial",
      "Semipresencial (parte online, parte presencial)",
      "100% online ao vivo",
      "100% online gravado",
      "Nenhum — não consigo estudar agora",
    ],
  },
];

// Quiz fixo — comunidade beneficiária (Paróquia São Sebastião, Atalaia do Norte).
// Fonte: perguntas_fixas_comunidade_beneficiaria.md. "correta" = índice da opção certa.
// "explicacao" é mostrada ao participante depois que ele responde.
const QUIZ = [
  {
    id: "comunidade_territorio",
    pergunta:
      "A Paróquia São Sebastião, em Atalaia do Norte, acompanha comunidades que vivem em uma região marcada principalmente por qual realidade?",
    opcoes: [
      "Grandes centros urbanos com fácil acesso a metrô e hospitais",
      "Comunidades amazônicas, ribeirinhas e indígenas em áreas de difícil acesso",
      "Fazendas industriais de trigo e soja no sul do Brasil",
      "Bairros turísticos próximos ao litoral brasileiro",
    ],
    correta: 1,
    explicacao:
      "A missão acontece em um território amazônico extenso, com muitas comunidades distantes, deslocamentos por rios e presença de povos indígenas e famílias em situação de vulnerabilidade.",
  },
  {
    id: "comunidade_finalidade",
    pergunta: "Qual é uma das finalidades centrais do projeto de caridade ligado à Paróquia São Sebastião?",
    opcoes: [
      "Apoiar famílias, crianças, mulheres e comunidades vulneráveis da região",
      "Construir grandes centros comerciais na fronteira",
      "Substituir as culturas locais por costumes de outros países",
      "Transformar a floresta em área industrial",
    ],
    correta: 0,
    explicacao:
      "O projeto está ligado à presença pastoral e social da paróquia, com ações de acolhimento, proteção, educação, solidariedade e atenção às necessidades concretas da população local.",
  },
  {
    id: "comunidade_respeito",
    pergunta: "Por que o respeito às culturas locais é essencial em uma missão como a de Atalaia do Norte?",
    opcoes: [
      "Porque todas as comunidades vivem exatamente da mesma forma",
      "Porque a região reúne diferentes povos, línguas, histórias e modos de vida",
      "Porque a cultura local não influencia a vida das pessoas",
      "Porque só existe uma comunidade atendida pela paróquia",
    ],
    correta: 1,
    explicacao:
      "A região da tríplice fronteira e do Vale do Javari é profundamente diversa. A atuação comunitária precisa considerar os povos indígenas, as famílias ribeirinhas, os migrantes fronteiriços e as diferentes formas de vida presentes no território.",
  },
];

// Regra de canal: Quiz -> AM (caneta); pesquisa -> UNI; só perfil -> PERF (sem brinde).
// PERF registra o lead de quem fez só a Captura+Perfil, sem brinde nem código exibido.
const CANAL = { COM_QUIZ: "AM", SO_PESQUISA: "UNI", SO_PERFIL: "PERF" };

// Dados de doação, com dois métodos (escolhidos numa tela de seleção).
// IBAN (Itália/euros) e PIX (Brasil/reais). Cada linha vira um botão "Copiar".
const DOACAO = {
  iban: [
    { rotulo: "Intestatario", valor: "Polyana Rosada" },
    { rotulo: "IBAN", valor: "IT69Y0357601601010005128947" },
    { rotulo: "BIC/SWIFT", valor: "BBVAITMMXXX" },
    { rotulo: "Causale", valor: "Doação Festa da Primavera 2026" },
  ],
  // PLACEHOLDER — usuário fornece. 'copiaECola' é o essencial (cola no app do banco).
  // 'qr' é a imagem para quem escaneia de OUTRO aparelho; salve em ASSETS/pix-qr.png.
  pix: {
    copiaECola: "[código PIX copia e cola]",
    chave: "[chave PIX — opcional]",
    qr: "./ASSETS/pix-festa-da-primavera-croped.jpeg",
  },
};
