/**
 * Backend de coleta — Festa da Primavera (v2: Quiz + códigos de brinde)
 *
 * Roda no Google Apps Script (NÃO no site). Recebe os leads do formulário,
 * gera um código de brinde SEQUENCIAL e ATÔMICO por canal e grava na planilha.
 *
 * Canais:
 *   - AM   -> completou o Quiz da Amazônia (dá direito a uma caneta) -> AM001, AM002...
 *   - UNI  -> respondeu a pesquisa (Laboratório Vivo)               -> UNI001, UNI002...
 *   - PERF -> só Captura + Perfil (registra o lead, sem brinde)     -> PERF001, PERF002...
 *
 * A pesquisa (Laboratório Vivo) é gravada numa aba separada "Pesquisa",
 * ligada ao lead pelo Código (1 coluna por pergunta, cabeçalho dinâmico).
 *
 * Por que GET + JSONP? O site é estático e precisa LER o código gerado para
 * exibir na Tela de Sucesso. O Apps Script não devolve cabeçalhos CORS de forma
 * confiável, então usamos JSONP (GET com ?callback=...), que contorna o CORS.
 *
 * IMPORTANTE: o número do brinde nasce AQUI (no servidor), com LockService,
 * para nunca duplicar quando vários celulares enviam ao mesmo tempo na barraca.
 *
 * Após editar este arquivo: Implantar > Gerenciar implantações > Nova versão.
 */

const ABA_LEADS = "Leads";
const ABA_CONTADORES = "Contadores";
const ABA_PESQUISA = "Pesquisa";

// Blindagem simples: token compartilhado exigido para GRAVAR (não é segredo forte —
// fica visível no cliente; serve de barreira contra varredura automática da URL).
// Para "rotacionar a chave": troque aqui E em JS/api.js, salve e implante Nova versão.
const TOKEN = "thlrxemi9sbu2q6n84daofkpcvw705y3";

const CABECALHO_LEADS = [
  "Data/Hora", "Nome", "Contato", "Canal", "Código",
  "Pretende graduação", "Curso", "Respostas Quiz", "Acertos Quiz",
];

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const callback = params.callback;

  // Ping de status (abrir a URL no navegador) — sem canal, não grava nada.
  if (!params.canal) {
    return _saida({ status: "ativo" }, callback);
  }

  // Blindagem: só grava com o token correto.
  if (params.token !== TOKEN) {
    return _saida({ resultado: "erro", mensagem: "Não autorizado." }, callback);
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const leads = _aba(ss, ABA_LEADS, CABECALHO_LEADS);

    // Canais válidos: AM (quiz), UNI (pesquisa), PERF (só perfil, sem brinde).
    const CANAIS_VALIDOS = ["AM", "UNI", "PERF"];
    const canal = (CANAIS_VALIDOS.indexOf(params.canal) !== -1) ? params.canal : "PERF";
    const codigo = _proximoCodigo(ss, canal);

    leads.appendRow([
      new Date(),
      params.nome || "",
      params.contato || "",
      canal,
      codigo,
      params.graduacao || "",
      params.curso || "",
      params.quiz || "",
      params.acertos || "",
    ]);

    // Pesquisa (Laboratório Vivo) em aba separada, ligada pelo código do lead.
    // Cabeçalho dinâmico (uma coluna por pergunta) criado na 1ª gravação.
    if (params.pesquisa) {
      try {
        const respostas = JSON.parse(params.pesquisa); // [{ id, resposta }, ...]
        if (respostas && respostas.length) {
          let pesq = ss.getSheetByName(ABA_PESQUISA);
          const cabecalho = ["Código", "Data/Hora"].concat(respostas.map(function (r) { return r.id; }));
          if (!pesq) {
            pesq = ss.insertSheet(ABA_PESQUISA);
            pesq.appendRow(cabecalho);
          } else if (pesq.getLastRow() === 0) {
            pesq.appendRow(cabecalho);
          }
          pesq.appendRow([codigo, new Date()].concat(respostas.map(function (r) { return r.resposta; })));
        }
      } catch (e) {
        // Falha ao gravar a pesquisa não invalida o lead já registrado.
      }
    }

    return _saida({ resultado: "ok", codigo: codigo }, callback);
  } catch (erro) {
    return _saida({ resultado: "erro", mensagem: String(erro) }, callback);
  } finally {
    lock.releaseLock();
  }
}

// Incrementa o contador do canal de forma atômica e formata: AM + 3 dígitos.
function _proximoCodigo(ss, canal) {
  const cont = _aba(ss, ABA_CONTADORES, ["Canal", "Último"]);
  const dados = cont.getDataRange().getValues();

  let linha = -1;
  for (let i = 1; i < dados.length; i++) {
    if (dados[i][0] === canal) { linha = i + 1; break; }
  }

  let n;
  if (linha === -1) {
    n = 1;
    cont.appendRow([canal, n]);
  } else {
    n = Number(cont.getRange(linha, 2).getValue()) + 1;
    cont.getRange(linha, 2).setValue(n);
  }

  return canal + String(n).padStart(3, "0");
}

// Garante a aba e o cabeçalho.
function _aba(ss, nome, cabecalho) {
  let aba = ss.getSheetByName(nome);
  if (!aba) {
    aba = ss.insertSheet(nome);
    aba.appendRow(cabecalho);
  } else if (aba.getLastRow() === 0) {
    aba.appendRow(cabecalho);
  }
  return aba;
}

// Devolve JSONP (se houver callback) ou JSON puro.
function _saida(obj, callback) {
  const json = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
