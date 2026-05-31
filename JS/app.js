// ============================================================
// APP — Máquina de estados + fluxo de dados (F2)
// Uma única página (index.html) com várias <section data-tela>.
// Só uma fica visível por vez. Sem rotas, sem novas URLs (QR intacto).
//
// Fluxo: home -> captura -> perfil -> MENU ⇄ { pesquisa | amazonia | doacao }
//        -> [Concluir] -> sucesso
//
// PERFIL (qualificação) é coletado de todos na Captura e vai p/ a aba Leads.
// PESQUISA (Laboratório Vivo) é opcional no menu e vai p/ a aba "Pesquisa".
// Canal: quiz -> AM | só pesquisa -> UNI | perfil/doação sozinhos -> sem código.
//
// Depende de: dados.js (PERFIL, PESQUISA, QUIZ, CANAL, DOACAO) e api.js.
// ============================================================

const TELAS = document.querySelectorAll("[data-tela]");

/** Mostra apenas a tela com o nome dado; esconde as outras. */
function irPara(nome) {
  TELAS.forEach((sec) => {
    const ativa = sec.dataset.tela === nome;
    // Alterna o par hidden/flex: uma tela nunca tem os dois ao mesmo tempo,
    // evitando o conflito de display do Tailwind (hidden vs flex).
    sec.classList.toggle("hidden", !ativa);
    sec.classList.toggle("flex", ativa);
  });
  window.scrollTo({ top: 0 });
}

// Navegação declarativa: [data-ir="X"] -> tela X (CTA da home e botões do menu).
document.querySelectorAll("[data-ir]").forEach((el) => {
  el.addEventListener("click", () => irPara(el.dataset.ir));
});

// ------------------------------------------------------------
// Estado do lead — grupos separados + flags de progresso.
// ------------------------------------------------------------
const lead = {
  pessoal: { nome: "", telefone: "" },     // Captura
  perfil: {},                              // Perfil (PERFIL: graduacao, area)
  pesquisa: [],                            // Pesquisa ([{ id, resposta }])
  amazonia: { respostas: [], acertos: 0 }, // quiz (QUIZ)
  pesquisaFeita: false,
  quizFeito: false,
};

// ------------------------------------------------------------
// Helpers de UI.
// ------------------------------------------------------------
function mostrarErro(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
}

function mostrarStatus(el, msg, cor) {
  el.textContent = msg;
  el.className = `text-center font-semibold mt-4 ${cor}`;
  el.classList.remove("hidden");
}

/** Revela o selo "✓ feito" do botão do menu correspondente. */
function marcarSelo(chave) {
  const selo = document.querySelector(`[data-menu="${chave}"] [data-selo]`);
  if (selo) selo.classList.remove("hidden");
}

// ============================================================
// Renderização genérica de um bloco de perguntas em um container.
// Guarda a escolha em data-escolha / data-escolhaTexto de cada cartão.
// ============================================================
function renderPerguntas(lista, container, opts) {
  opts = opts || {};
  const feedback = opts.feedback === true; // modo quiz: revela a correta na hora
  container.innerHTML = "";

  const classeBase =
    "text-left border rounded-xl px-4 py-3 transition-all " +
    "hover:border-green-500 active:scale-[0.98]";
  const classeAtiva =
    "text-left rounded-xl px-4 py-3 transition-all " +
    "bg-green-700 text-white border border-green-700";
  const classeCorreta =
    "text-left rounded-xl px-4 py-3 bg-green-700 text-white border border-green-700";
  const classeErrada =
    "text-left rounded-xl px-4 py-3 bg-red-600 text-white border border-red-600";
  const classeApagada =
    "text-left rounded-xl px-4 py-3 border border-gray-200 text-gray-400";

  lista.forEach((q) => {
    // Múltipla escolha (q.multi/q.max) só fora do modo feedback.
    const multi = !feedback && (q.multi === true || (typeof q.max === "number" && q.max > 1));
    const max = typeof q.max === "number" ? q.max : Infinity;

    const card = document.createElement("div");
    card.className = "border rounded-2xl p-4 md:p-5";
    card.dataset.qid = q.id;
    if (q.correta !== undefined) card.dataset.correta = q.correta;

    const titulo = document.createElement("p");
    titulo.className = multi ? "font-semibold mb-1" : "font-semibold mb-3";
    titulo.textContent = q.pergunta;
    card.appendChild(titulo);

    if (multi) {
      const dica = document.createElement("p");
      dica.className = "text-xs text-gray-500 mb-3";
      dica.textContent = max === Infinity ? "Marque quantas quiser" : "Marque até " + max;
      card.appendChild(dica);
    }

    const grupo = document.createElement("div");
    grupo.className = "flex flex-col gap-2";
    const selecionados = new Set();

    q.opcoes.forEach((op, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = op;
      btn.dataset.op = idx;
      btn.className = classeBase;

      btn.addEventListener("click", () => {
        if (feedback) {
          // Quiz: ao responder, revela a correta, trava e dá o retorno na hora.
          if (card.dataset.respondida) return;
          card.dataset.respondida = "1";
          card.dataset.escolha = idx;
          card.dataset.escolhaTexto = op;
          const correta = Number(q.correta);
          grupo.querySelectorAll("[data-op]").forEach((b) => {
            const i = Number(b.dataset.op);
            b.disabled = true;
            if (i === correta) b.className = classeCorreta;
            else if (i === idx) b.className = classeErrada;
            else b.className = classeApagada;
          });
          const acertou = idx === correta;
          const fb = document.createElement("p");
          fb.className = (acertou ? "text-green-700" : "text-red-700") + " font-semibold text-sm mt-3";
          fb.textContent = acertou ? "✓ Você acertou!" : "✗ A resposta correta está destacada.";
          card.appendChild(fb);
          if (q.explicacao) {
            const exp = document.createElement("p");
            exp.className = "text-gray-600 text-sm mt-1 leading-relaxed";
            exp.textContent = q.explicacao;
            card.appendChild(exp);
          }
        } else if (multi) {
          if (selecionados.has(idx)) {
            selecionados.delete(idx);
            btn.className = classeBase;
          } else {
            if (selecionados.size >= max) return; // respeita o limite "até N"
            selecionados.add(idx);
            btn.className = classeAtiva;
          }
          const textos = [...selecionados].sort((a, b) => a - b).map((i) => q.opcoes[i]);
          if (textos.length) {
            card.dataset.escolha = "1"; // marca "respondida" (multi não usa índice)
            card.dataset.escolhaTexto = textos.join("; ");
          } else {
            delete card.dataset.escolha;
            delete card.dataset.escolhaTexto;
          }
        } else {
          grupo.querySelectorAll("[data-op]").forEach((b) => (b.className = classeBase));
          btn.className = classeAtiva;
          card.dataset.escolha = idx; // índice preservado (usado no scoring do quiz)
          card.dataset.escolhaTexto = op;
        }
      });

      grupo.appendChild(btn);
    });

    card.appendChild(grupo);
    container.appendChild(card);
  });
}

/** Retorna o 1º cartão sem resposta (ou null se todos respondidos). */
function primeiroSemResposta(container) {
  return [...container.querySelectorAll("[data-qid]")].find(
    (c) => c.dataset.escolha === undefined
  ) || null;
}

// ============================================================
// TELA CAPTURA — valida nome, telefone e consentimento LGPD -> PERFIL.
// ============================================================
const elNome = document.getElementById("nome");
const elTelefone = document.getElementById("telefone");
const elConsent = document.getElementById("consentimento");
const erroCaptura = document.getElementById("erroCaptura");

document.getElementById("btnContinuar").addEventListener("click", () => {
  const nome = elNome.value.trim();
  const telefone = elTelefone.value.trim();

  if (!nome) return mostrarErro(erroCaptura, "Por favor, digite seu nome.");
  if (telefone.replace(/\D/g, "").length < 8)
    return mostrarErro(erroCaptura, "Digite um telefone válido.");
  if (!elConsent.checked)
    return mostrarErro(erroCaptura, "É preciso autorizar o uso dos dados para continuar.");

  erroCaptura.classList.add("hidden");
  lead.pessoal = { nome, telefone };
  irPara("perfil");
});

// ============================================================
// TELA PERFIL — 2ª etapa da Captura (obrigatória) -> MENU.
// Roteia para lead.perfil (graduacao, area).
// ============================================================
const elPerfil = document.getElementById("perguntasPerfil");
const erroPerfil = document.getElementById("erroPerfil");

document.getElementById("btnPerfil").addEventListener("click", () => {
  const faltando = primeiroSemResposta(elPerfil);
  if (faltando) {
    faltando.scrollIntoView({ behavior: "smooth", block: "center" });
    return mostrarErro(erroPerfil, "Responda as duas perguntas para continuar.");
  }

  erroPerfil.classList.add("hidden");
  lead.perfil = {};
  elPerfil.querySelectorAll("[data-qid]").forEach((c) => {
    lead.perfil[c.dataset.qid] = c.dataset.escolhaTexto;
  });
  irPara("menu");
});

// ============================================================
// TELA PESQUISA — Laboratório Vivo. Roteia p/ lead.pesquisa e volta ao menu.
// ============================================================
const elPesquisa = document.getElementById("perguntasPesquisa");
const erroPesquisa = document.getElementById("erroPesquisa");

document.getElementById("btnPesquisa").addEventListener("click", () => {
  const faltando = primeiroSemResposta(elPesquisa);
  if (faltando) {
    faltando.scrollIntoView({ behavior: "smooth", block: "center" });
    return mostrarErro(erroPesquisa, "Responda todas as perguntas para continuar.");
  }

  erroPesquisa.classList.add("hidden");
  lead.pesquisa = [];
  elPesquisa.querySelectorAll("[data-qid]").forEach((c) => {
    lead.pesquisa.push({ id: c.dataset.qid, resposta: c.dataset.escolhaTexto });
  });

  // Q8 — opt-in de entrevista + contato próprio da pesquisa (sempre gravados,
  // para manter as colunas estáveis na aba "Pesquisa").
  const optin = document.getElementById("pesquisaOptin").checked;
  const contatoPesquisa = document.getElementById("pesquisaContato").value.trim();
  lead.pesquisa.push({ id: "entrevista_optin", resposta: optin ? "Sim" : "Não" });
  lead.pesquisa.push({ id: "contato_pesquisa", resposta: contatoPesquisa });

  lead.pesquisaFeita = true;
  marcarSelo("pesquisa");
  irPara("menu");
});

// ============================================================
// TELA AMAZÔNIA — quiz (conta acertos). Roteia e volta ao menu (não envia).
// ============================================================
const elAmazonia = document.getElementById("perguntasAmazonia");
const erroAmazonia = document.getElementById("erroAmazonia");

document.getElementById("btnFinalizar").addEventListener("click", () => {
  const faltando = primeiroSemResposta(elAmazonia);
  if (faltando) {
    faltando.scrollIntoView({ behavior: "smooth", block: "center" });
    return mostrarErro(erroAmazonia, "Responda todas as perguntas para continuar.");
  }

  erroAmazonia.classList.add("hidden");
  lead.amazonia = { respostas: [], acertos: 0 };
  elAmazonia.querySelectorAll("[data-qid]").forEach((c) => {
    lead.amazonia.respostas.push(c.dataset.escolhaTexto);
    if (Number(c.dataset.escolha) === Number(c.dataset.correta)) lead.amazonia.acertos++;
  });
  lead.quizFeito = true;
  marcarSelo("quiz");
  irPara("menu");
});

// ============================================================
// TELA DOAÇÃO — renderiza DOACAO com botão "Copiar" em cada campo.
// ============================================================
const elDadosIban = document.getElementById("dadosIban");
const elDadosPix = document.getElementById("dadosPix");
const elPixQr = document.getElementById("pixQr");

/** Copia texto para a área de transferência (com fallback p/ file://). */
function copiar(texto, btn) {
  const original = btn.textContent;
  const feedback = () => {
    btn.textContent = "Copiado!";
    setTimeout(() => (btn.textContent = original), 1500);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(feedback).catch(() => copiarFallback(texto, feedback));
  } else {
    copiarFallback(texto, feedback);
  }
}

function copiarFallback(texto, feedback) {
  const ta = document.createElement("textarea");
  ta.value = texto;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
    feedback();
  } catch (e) {
    /* silencioso: navegador sem suporte */
  }
  ta.remove();
}

/** Cria uma linha "rótulo + valor + botão Copiar". */
function linhaCopiavel(rotulo, valor) {
  const linha = document.createElement("div");
  linha.className = "flex items-center justify-between gap-3 border rounded-xl p-4";

  const txt = document.createElement("div");
  txt.className = "min-w-0";
  const rot = document.createElement("p");
  rot.className = "text-xs uppercase tracking-wide text-gray-500";
  rot.textContent = rotulo;
  const val = document.createElement("p");
  val.className = "font-semibold break-all";
  val.textContent = valor;
  txt.appendChild(rot);
  txt.appendChild(val);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Copiar";
  btn.className =
    "shrink-0 bg-green-700 hover:bg-green-800 text-white text-sm font-bold " +
    "px-4 py-2 rounded-lg active:scale-95 transition-all";
  btn.addEventListener("click", () => copiar(valor, btn));

  linha.appendChild(txt);
  linha.appendChild(btn);
  return linha;
}

function renderDoacao() {
  // IBAN (Itália) — dados bancários, um botão Copiar por linha.
  elDadosIban.innerHTML = "";
  DOACAO.iban.forEach((item) => elDadosIban.appendChild(linhaCopiavel(item.rotulo, item.valor)));

  // PIX (Brasil) — mostra só o que for real; placeholders ("[...]") são ignorados.
  elDadosPix.innerHTML = "";
  const ehReal = (v) => typeof v === "string" && v && v[0] !== "[";
  const temCopiaECola = ehReal(DOACAO.pix.copiaECola);
  if (temCopiaECola) elDadosPix.appendChild(linhaCopiavel("PIX copia e cola", DOACAO.pix.copiaECola));
  if (ehReal(DOACAO.pix.chave)) elDadosPix.appendChild(linhaCopiavel("Chave PIX", DOACAO.pix.chave));

  // Instrução honesta conforme o que existe (copia e cola só quando disponível).
  document.getElementById("pixInstrucao").textContent = temCopiaECola
    ? "Copie o código e cole no app do seu banco, ou escaneie o QR de outro aparelho."
    : "Escaneie este QR com o app do seu banco. No próprio celular, use o QR impresso na barraca.";

  // Se a imagem do QR ainda não existir, esconde o bloco em vez de mostrar quebrada.
  elPixQr.onerror = () => {
    const wrap = document.getElementById("pixQrWrap");
    if (wrap) wrap.classList.add("hidden");
  };
  elPixQr.src = DOACAO.pix.qr;
}

document.getElementById("btnVoltarDoacao").addEventListener("click", () => {
  marcarSelo("doacao");
  irPara("menu");
});

// ============================================================
// CONCLUIR — define o canal, envia o lead e mostra o ticket.
// quiz -> AM | só pesquisa -> UNI | nem um nem outro -> sem ticket.
// As respostas da pesquisa seguem em 'pesquisa' (JSON) -> aba "Pesquisa".
// ============================================================
const btnConcluir = document.getElementById("btnConcluir");
const statusConcluir = document.getElementById("statusConcluir");
const blocoCodigo = document.getElementById("blocoCodigo");
const agradecimentoSimples = document.getElementById("agradecimentoSimples");

btnConcluir.addEventListener("click", async () => {
  // Perfil é obrigatório -> SEMPRE há um lead a registrar.
  // Brinde só para quiz (AM) ou pesquisa (UNI); só-perfil = PERF (registra, sem brinde).
  const temBrinde = lead.quizFeito || lead.pesquisaFeita;
  const canal = lead.quizFeito
    ? CANAL.COM_QUIZ
    : lead.pesquisaFeita
    ? CANAL.SO_PESQUISA
    : CANAL.SO_PERFIL;

  const dados = {
    canal,
    nome: lead.pessoal.nome,
    contato: lead.pessoal.telefone,
    graduacao: lead.perfil.graduacao || "",
    curso: lead.perfil.area || "", // 'area' do perfil vai na coluna Curso
    quiz: lead.amazonia.respostas.join(" | "),
    acertos: lead.amazonia.acertos,
  };
  // Respostas da pesquisa (Laboratório Vivo) -> backend grava na aba "Pesquisa".
  if (lead.pesquisaFeita) dados.pesquisa = JSON.stringify(lead.pesquisa);

  btnConcluir.disabled = true;
  mostrarStatus(statusConcluir, "Enviando...", "text-gray-600");

  try {
    const codigo = await enviarLead(dados);
    statusConcluir.classList.add("hidden");
    if (temBrinde) {
      agradecimentoSimples.classList.add("hidden");
      blocoCodigo.classList.remove("hidden");
      document.getElementById("codigo").textContent = codigo;

      // Comunica a regra do brinde (sem calcular ordem — estoque na barraca decide).
      const brindes = [];
      if (lead.quizFeito) {
        const total = lead.amazonia.respostas.length;
        brindes.push("🖊️ Caneta Unigran (quiz) — você acertou " + lead.amazonia.acertos + " de " + total + ".");
      }
      if (lead.pesquisaFeita)
        brindes.push("👜 Pela pesquisa: ecobag para os primeiros (enquanto durar); depois, bolsa + bloquinho.");
      document.getElementById("brindeInfo").innerHTML = brindes.join("<br>");
    } else {
      blocoCodigo.classList.add("hidden");
      agradecimentoSimples.classList.remove("hidden");
    }
    irPara("sucesso");
  } catch (erro) {
    mostrarStatus(statusConcluir, erro.message || "Erro ao enviar. Tente novamente.", "text-red-700");
    btnConcluir.disabled = false;
  }
});

// ------------------------------------------------------------
// Inicialização — renderiza cada grupo no seu container e abre a home.
// ------------------------------------------------------------
renderPerguntas(PERFIL, elPerfil);
renderPerguntas(PESQUISA, elPesquisa);
renderPerguntas(QUIZ, elAmazonia, { feedback: true });
renderDoacao();
irPara("home");
