// ============================================================
// DADOS DO FLUXO — Pesquisa institucional + Quiz da Amazônia
// Embutido como objeto local (sem fetch) = mais leve para rede móvel.
// Perguntas curtas de propósito (leitura em < 3s). Conteúdo é EDITÁVEL.
// ============================================================

// Pesquisa institucional (percepção da educação). Sem resposta "certa".
const PESQUISA = [
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

// Quiz da Amazônia. "correta" = índice da opção certa (para contar acertos).
// Fatos checados; ajuste livremente o conteúdo com a organização.
const QUIZ_AMAZONIA = [
  {
    id: "q_paises",
    pergunta: "Por quantos países a floresta amazônica se estende?",
    opcoes: ["3", "9", "15"],
    correta: 1,
  },
  {
    id: "q_rio",
    pergunta: "Qual é o principal rio da Amazônia?",
    opcoes: ["Rio São Francisco", "Rio Tietê", "Rio Amazonas"],
    correta: 2,
  },
  {
    id: "q_biodiv",
    pergunta: "A Amazônia abriga cerca de 1 em cada 10 espécies conhecidas do planeta.",
    opcoes: ["Verdadeiro", "Falso"],
    correta: 0,
  },
];

// Regra de canal: quem completa o Quiz vira AM (caneta); só pesquisa vira UNI.
const CANAL = { COM_QUIZ: "AM", SO_PESQUISA: "UNI" };
