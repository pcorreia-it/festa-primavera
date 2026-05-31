// ============================================================
// CAMADA DE ACESSO A DADOS
// Envia o lead ao Apps Script e RECEBE o código do brinde de volta via JSONP.
// JSONP (GET com ?callback=) contorna o CORS do Apps Script de forma confiável,
// permitindo exibir o código (ex: AM001) na Tela de Sucesso.
// ============================================================

// URL do Web App do Apps Script (mesma conta/planilha do usuário).
const URL_PLANILHA =
  "https://script.google.com/macros/s/AKfycbzXnB9L9gTs8oWC8aeqHlgJCy8KVoAfkti5c8JCGjuRYxUnbjJsrf5otuuHlf0T3uwP/exec";

// Token compartilhado exigido pelo backend (deve ser IGUAL ao TOKEN do Codigo.gs).
// Para rotacionar: troque aqui e no Codigo.gs, salve e implante Nova versão.
const TOKEN = "thlrxemi9sbu2q6n84daofkpcvw705y3";

/**
 * Envia o lead e resolve com o código do brinde gerado pelo servidor.
 * @param {Object} dados - { canal, nome, contato, graduacao, curso, quiz, acertos }
 * @returns {Promise<string>} código (ex: "AM001")
 */
function enviarLead(dados) {
  return new Promise((resolve, reject) => {
    const cb = "jsonp_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);

    const params = new URLSearchParams(
      Object.assign({}, dados, { token: TOKEN, callback: cb })
    ).toString();

    const script = document.createElement("script");
    let timer;

    const limpar = () => {
      clearTimeout(timer);
      delete window[cb];
      script.remove();
    };

    window[cb] = (resp) => {
      limpar();
      if (resp && resp.resultado === "ok") resolve(resp.codigo);
      else reject(new Error(resp && resp.mensagem ? resp.mensagem : "Falha no envio"));
    };

    script.onerror = () => {
      limpar();
      reject(new Error("Erro de rede"));
    };

    timer = setTimeout(() => {
      limpar();
      reject(new Error("Tempo esgotado. Tente novamente."));
    }, 15000);

    script.src = URL_PLANILHA + "?" + params;
    document.body.appendChild(script);
  });
}
