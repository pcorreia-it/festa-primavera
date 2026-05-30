/**
 * Backend de coleta — Festa da Primavera (v2: Quiz + códigos de brinde)
 *
 * Roda no Google Apps Script (NÃO no site). Recebe os leads do formulário,
 * gera um código de brinde SEQUENCIAL e ATÔMICO por canal e grava na planilha.
 *
 * Canais:
 *   - AM  -> completou o Quiz da Amazônia (dá direito a uma caneta) -> AM001, AM002...
 *   - UNI -> respondeu só a pesquisa institucional                 -> UNI001, UNI002...
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

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const leads = _aba(ss, ABA_LEADS, CABECALHO_LEADS);

    const canal = (params.canal === "AM") ? "AM" : "UNI";
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
