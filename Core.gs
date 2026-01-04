// ============================================================
// CORE - BOT TELEGRAM - TRACKING DE HÁBITOS
// Código compartilhado: Config, Telegram, Sheets, Estado, Utils
// ============================================================

// ========== NOMES DAS SHEETS ==========
const SHEETS = {
  CONFIG: "CONFIG",
  HABITOS: "HABITOS",
  HISTORICO: "HISTORICO",
  LOGS: "LOGS"
};

// ========== CARREGA CONFIGURAÇÃO DA SHEET CONFIG ==========
const CONFIG = (function() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CONFIG");
  if (!sheet) return {};
  const dados = sheet.getDataRange().getValues();
  const config = {};
  for (let i = 0; i < dados.length; i++) {
    if (dados[i][0]) config[dados[i][0]] = dados[i][1];
  }
  return config;
})();

// Telegram
const TELEGRAM_TOKEN = CONFIG.TELEGRAM_TOKEN;
const CHAT_ID = String(CONFIG.CHAT_ID);
const TELEGRAM_API_URL = 'https://api.telegram.org/bot' + TELEGRAM_TOKEN;

// Gemini
const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY;
const GEMINI_MODEL = CONFIG.GEMINI_MODEL;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Outras configs
const QT_DIAS_LER_HISTORICO = CONFIG.QT_DIAS_LER_HISTORICO || 7;
const GEMINI_PROMPT = CONFIG.GEMINI_PROMPT;

// Timeout de estado (30 minutos)
const ESTADO_TIMEOUT_MS = 30 * 60 * 1000;

// ========== FUNÇÕES DE LOG ==========

function log(tipo, mensagem) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.LOGS);
    if (!sheet) return;
    const timestamp = Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([timestamp, tipo, mensagem]);
  } catch (e) {
    console.error('Erro ao logar:', e);
  }
}

// ========== FUNÇÕES TELEGRAM ==========

function sendMessage(chatId, text, replyMarkup) {
  const payload = {
    'chat_id': String(chatId),
    'text': text,
    'parse_mode': 'Markdown'
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  UrlFetchApp.fetch(`${TELEGRAM_API_URL}/sendMessage`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function sendMessageWithButtons(chatId, text, botoes) {
  const inlineKeyboard = {
    inline_keyboard: [botoes]
  };
  sendMessage(chatId, text, inlineKeyboard);
}

// Envia mensagem com grid de botões (múltiplas linhas)
function sendMessageWithGrid(chatId, text, botoesGrid) {
  const inlineKeyboard = {
    inline_keyboard: botoesGrid
  };
  sendMessage(chatId, text, inlineKeyboard);
}

function answerCallbackQuery(callbackQueryId) {
  const payload = { 'callback_query_id': callbackQueryId };
  UrlFetchApp.fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function editMessageReplyMarkup(chatId, messageId) {
  const payload = {
    'chat_id': String(chatId),
    'message_id': messageId,
    'reply_markup': { 'inline_keyboard': [] }
  };
  UrlFetchApp.fetch(`${TELEGRAM_API_URL}/editMessageReplyMarkup`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function editMessageText(chatId, messageId, text, replyMarkup) {
  const payload = {
    'chat_id': String(chatId),
    'message_id': messageId,
    'text': text,
    'parse_mode': 'Markdown'
  };
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }
  UrlFetchApp.fetch(`${TELEGRAM_API_URL}/editMessageText`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

// ========== GESTÃO DE ESTADO ==========

function getEstado() {
  const props = PropertiesService.getScriptProperties();
  const estadoStr = props.getProperty("estado_conversa");
  if (!estadoStr) return null;
  try {
    const estado = JSON.parse(estadoStr);
    // Verifica timeout (30 min)
    if (estado.timestamp && Date.now() - estado.timestamp > ESTADO_TIMEOUT_MS) {
      limparEstado();
      return null;
    }
    return estado;
  } catch (e) {
    return null;
  }
}

function setEstado(estado) {
  estado.timestamp = Date.now();
  const props = PropertiesService.getScriptProperties();
  props.setProperty("estado_conversa", JSON.stringify(estado));
}

function limparEstado() {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty("estado_conversa");
}

// Cria um novo estado para um fluxo específico
function criarEstado(fluxo, acao) {
  return {
    fluxo: fluxo,
    acao: acao,
    etapa: 1,
    dados: {},
    timestamp: Date.now()
  };
}

// ========== FUNÇÕES SHEETS - LEITURA ==========

function getHabitos() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.HABITOS);
  if (!sheet) return [];

  const dados = sheet.getDataRange().getValues();
  const habitos = [];

  for (let i = 1; i < dados.length; i++) {
    const row = dados[i];
    if (row[0]) {
      habitos.push({
        nome: row[0],
        metrica: row[1],
        tipoResposta: row[2],
        metaAnual: row[3],
        metaMensal: row[4],
        metaSemanal: row[5],
        metaDiaria: row[6],
        lembretes: row[7],
        porque: row[8],
        indice: i // índice da linha na sheet (1-based no header)
      });
    }
  }
  return habitos;
}

function getHabitoByNome(nome) {
  const habitos = getHabitos();
  return habitos.find(h => h.nome === nome) || null;
}

function getHabitoByIndice(indice) {
  const habitos = getHabitos();
  return habitos.find(h => h.indice === indice) || null;
}

function getUltimaDataHabito(nomeHabito) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.HISTORICO);
  if (!sheet) return null;

  const dados = sheet.getDataRange().getValues();
  let ultimaData = null;

  for (let i = 1; i < dados.length; i++) {
    const row = dados[i];
    if (row[1] === nomeHabito && row[0]) {
      let data;
      if (typeof row[0] === "number") {
        const baseDate = new Date(1899, 11, 30);
        data = new Date(baseDate.getTime() + row[0] * 24 * 60 * 60 * 1000);
      } else if (row[0] instanceof Date) {
        data = row[0];
      } else {
        continue;
      }
      if (!ultimaData || data > ultimaData) {
        ultimaData = data;
      }
    }
  }
  return ultimaData;
}

function getUltimaDataHistorico() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.HISTORICO);
  if (!sheet) return null;

  const dados = sheet.getDataRange().getValues();
  let ultimaData = null;

  for (let i = 1; i < dados.length; i++) {
    const row = dados[i];
    if (row[0]) {
      let data;
      if (typeof row[0] === "number") {
        const baseDate = new Date(1899, 11, 30);
        data = new Date(baseDate.getTime() + row[0] * 24 * 60 * 60 * 1000);
      } else if (row[0] instanceof Date) {
        data = row[0];
      } else {
        continue;
      }
      if (!ultimaData || data > ultimaData) {
        ultimaData = data;
      }
    }
  }
  return ultimaData;
}

function getHistoricoRecente() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.HISTORICO);
  if (!sheet) return [];

  const dados = sheet.getDataRange().getValues();
  const historico = [];

  for (let i = 1; i < dados.length; i++) {
    const row = dados[i];
    if (!row[0] || !row[1]) continue;

    let data;
    if (typeof row[0] === "number") {
      const baseDate = new Date(1899, 11, 30);
      data = new Date(baseDate.getTime() + row[0] * 24 * 60 * 60 * 1000);
    } else if (row[0] instanceof Date) {
      data = row[0];
    } else {
      continue;
    }

    historico.push({
      data: formatarData(data),
      dataObj: data,
      habito: row[1],
      resposta: row[2]
    });
  }

  historico.sort((a, b) => b.dataObj - a.dataObj);

  const diasUnicos = [...new Set(historico.map(h => h.data))];
  const ultimosDias = diasUnicos.slice(0, QT_DIAS_LER_HISTORICO);

  const historicoFiltrado = historico
    .filter(h => ultimosDias.includes(h.data))
    .map(h => ({ data: h.data, habito: h.habito, resposta: h.resposta }));

  return historicoFiltrado;
}

function getHabitosComMetas() {
  const habitos = getHabitos();
  return habitos.map(h => ({
    nome: h.nome,
    metrica: h.metrica,
    metaDiaria: h.metaDiaria,
    metaSemanal: h.metaSemanal,
    metaMensal: h.metaMensal,
    porque: h.porque
  }));
}

// ========== FUNÇÕES SHEETS - ESCRITA ==========

function salvarHistorico(data, nome, resposta) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.HISTORICO);
  if (!sheet) return;

  if (typeof data === "string") {
    data = new Date(data);
  }

  sheet.appendRow([data, nome, resposta]);
  log("INFO", `Salvo: ${nome} = ${resposta} em ${formatarData(data)}`);
}

function criarHabito(dados) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.HABITOS);
  if (!sheet) return false;

  sheet.appendRow([
    dados.nome || '',
    dados.metrica || '',
    dados.tipoResposta || 'NÚMERO',
    dados.metaAnual || 0,
    dados.metaMensal || 0,
    dados.metaSemanal || 0,
    dados.metaDiaria || 0,
    dados.lembretes || '',
    dados.porque || ''
  ]);

  log("INFO", `Hábito criado: ${dados.nome}`);
  return true;
}

function atualizarHabito(indice, dados) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.HABITOS);
  if (!sheet) return false;

  const row = indice + 1; // +1 porque indice é 0-based no array, mas sheet é 1-based

  if (dados.nome !== undefined) sheet.getRange(row, 1).setValue(dados.nome);
  if (dados.metrica !== undefined) sheet.getRange(row, 2).setValue(dados.metrica);
  if (dados.tipoResposta !== undefined) sheet.getRange(row, 3).setValue(dados.tipoResposta);
  if (dados.metaAnual !== undefined) sheet.getRange(row, 4).setValue(dados.metaAnual);
  if (dados.metaMensal !== undefined) sheet.getRange(row, 5).setValue(dados.metaMensal);
  if (dados.metaSemanal !== undefined) sheet.getRange(row, 6).setValue(dados.metaSemanal);
  if (dados.metaDiaria !== undefined) sheet.getRange(row, 7).setValue(dados.metaDiaria);
  if (dados.lembretes !== undefined) sheet.getRange(row, 8).setValue(dados.lembretes);
  if (dados.porque !== undefined) sheet.getRange(row, 9).setValue(dados.porque);

  log("INFO", `Hábito atualizado: índice ${indice}`);
  return true;
}

function excluirHabito(indice) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.HABITOS);
  if (!sheet) return false;

  const row = indice + 1;
  sheet.deleteRow(row);

  log("INFO", `Hábito excluído: índice ${indice}`);
  return true;
}

// ========== UTILITÁRIOS ==========

function formatarData(date) {
  if (!date) return "";
  if (typeof date === "string") {
    date = new Date(date);
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }
  return Utilities.formatDate(date, "America/Sao_Paulo", "dd/MM/yyyy");
}

function adicionarDia(date) {
  const novaData = new Date(date);
  novaData.setDate(novaData.getDate() + 1);
  return novaData;
}

function getHoje() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return hoje;
}

function parseBotoes(tipoResposta) {
  if (!tipoResposta || typeof tipoResposta !== "string") return null;
  const match = tipoResposta.match(/^\[(.*)\]$/);
  if (!match) return null;
  return match[1].split(",").map(b => b.trim());
}

// ========== GEMINI - ANÁLISE DE DESEMPENHO ==========

function analisarDesempenhoComGemini() {
  const historico = getHistoricoRecente();
  const habitos = getHabitosComMetas();

  if (historico.length === 0) {
    sendMessage(CHAT_ID, "Sem histórico para análise.");
    return;
  }

  const diasUnicos = [...new Set(historico.map(h => h.data))];
  const qtdDias = diasUnicos.length;

  const promptCompleto = `${GEMINI_PROMPT}

DADOS DOS HÁBITOS E METAS:
${JSON.stringify(habitos, null, 2)}

HISTÓRICO DISPONÍVEL (${qtdDias} dia${qtdDias > 1 ? 's' : ''}):
${JSON.stringify(historico, null, 2)}

IMPORTANTE: O usuário tem apenas ${qtdDias} dia${qtdDias > 1 ? 's' : ''} de histórico. ${qtdDias === 1 ? 'Analise o desempenho DE HOJE e já dê o papo reto sobre o que ele fez.' : `Analise esses ${qtdDias} dias disponíveis.`}`;

  const payload = {
    contents: [{
      parts: [{ text: promptCompleto }]
    }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 20000
    }
  };

  try {
    const response = UrlFetchApp.fetch(GEMINI_API_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      log("ERROR", "Erro Gemini: " + responseText);
      sendMessage(CHAT_ID, "Erro ao gerar análise.");
      return;
    }

    const result = JSON.parse(responseText);

    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
      const analise = result.candidates[0].content.parts[0].text;
      const finishReason = result.candidates[0].finishReason || "N/A";
      log("GEMINI", `Resposta (${analise.length} chars, finish: ${finishReason}): ${analise}`);
      sendMessage(CHAT_ID, analise);
      log("INFO", "Análise Gemini enviada");
    } else {
      log("ERROR", "Resposta Gemini inválida: " + responseText);
      sendMessage(CHAT_ID, "Erro ao processar análise.");
    }

  } catch (error) {
    log("ERROR", "Exceção Gemini: " + error.toString());
    sendMessage(CHAT_ID, "Erro ao conectar com IA.");
  }
}

// ========== WEBHOOK ==========

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    log("TELEGRAM", JSON.stringify(contents).substring(0, 400));

    if (contents.callback_query) {
      handleCallbackQuery(contents.callback_query);
    } else if (contents.message) {
      handleMessage(contents.message);
    }
  } catch (error) {
    log("ERROR", "Erro no webhook: " + error.toString());
  }
}

function handleCallbackQuery(callbackQuery) {
  const callbackQueryId = callbackQuery.id;
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;

  // SEMPRE responder primeiro
  answerCallbackQuery(callbackQueryId);

  // Valida chat
  if (String(chatId) !== CHAT_ID) return;

  // Roteia callbacks do CRUD
  if (data.startsWith('crud_')) {
    handleCrudCallback(data, chatId, messageId);
    return;
  }

  // Iniciar registro via botão
  if (data === 'iniciar_registro') {
    editMessageReplyMarkup(chatId, messageId);
    iniciarPerguntasHabitos();
    return;
  }

  // Callbacks do registro (resp_)
  if (data.startsWith('resp_')) {
    // Remove botões
    editMessageReplyMarkup(chatId, messageId);

    const resposta = data.replace('resp_', '');

    // Atualiza mensagem com a resposta escolhida
    const estado = getEstado();
    if (estado && estado.fluxo === 'REGISTRO') {
      const habito = estado.habitos[estado.habitoAtual];
      const dataFormatada = formatarData(habito.dataReferencia);
      editMessageText(chatId, messageId, `Hábito *${habito.nome}*\nData: ${dataFormatada}\nResposta: *${resposta}*`);
    }

    processarRespostaRegistro(resposta);
  }
}

function handleMessage(message) {
  const chatId = message.chat.id;

  // Valida chat
  if (String(chatId) !== CHAT_ID) return;

  // Ignora mensagens antigas (mais de 2 min)
  const age = Math.floor(Date.now() / 1000) - message.date;
  if (age > 120) {
    log("DEBUG", `Msg antiga ignorada (${age}s)`);
    return;
  }

  if (!message.text) return;

  const texto = message.text.trim();

  // Comando /habitos -> CRUD
  if (texto === "/habitos") {
    iniciarCrudHabitos();
    return;
  }

  // Comando /start - Boas-vindas
  if (texto === "/start") {
    const mensagemBoasVindas = `👋 *Olá! Seja bem-vindo ao Bot de Monitoramento de Hábitos!*

✅ Se eu te respondi, significa que estou funcionando e você já setou o Webhook corretamente.

📋 *Seu Chat ID no Telegram é:*
\`${chatId}\`

👆 _Toque no código acima para copiar_`;
    sendMessage(chatId, mensagemBoasVindas);
    return;
  }

  // Comando /registro
  if (texto === "/registro") {
    iniciarPerguntasHabitos();
    return;
  }

  // Cancelar
  if (texto === "/cancelar") {
    limparEstado();
    const botoes = [
      [
        { text: '📋 Gerenciar Hábitos', callback_data: 'crud_menu' },
        { text: '📝 Registrar Dia', callback_data: 'iniciar_registro' }
      ]
    ];
    sendMessageWithGrid(chatId, "✅ Operação cancelada.\n\nO que deseja fazer agora?", botoes);
    return;
  }

  // Processa resposta baseado no fluxo ativo
  const estado = getEstado();
  if (estado) {
    if (estado.fluxo === 'CRUD_HABITOS') {
      processarRespostaCrud(texto);
    } else if (estado.fluxo === 'REGISTRO') {
      processarRespostaRegistro(texto);
    }
  }
}

// ========== FUNÇÕES AUXILIARES / TESTES ==========

function testarEnvioMensagem() {
  sendMessage(CHAT_ID, "Teste de mensagem do Bot de Hábitos!");
}

function verificarWebhook() {
  const response = UrlFetchApp.fetch(`${TELEGRAM_API_URL}/getWebhookInfo`);
  const result = JSON.parse(response.getContentText());
  log("INFO", "Webhook: " + JSON.stringify(result));
  console.log(result);
}

function limparEstadoManual() {
  limparEstado();
  log("INFO", "Estado limpo");
}

function configurarWebhook(webAppUrl) {
  const response = UrlFetchApp.fetch(`${TELEGRAM_API_URL}/setWebhook?url=${encodeURIComponent(webAppUrl)}`);
  const result = JSON.parse(response.getContentText());
  log("INFO", "Config webhook: " + JSON.stringify(result));
  console.log(result);
}

function testarFluxoCompleto() {
  limparEstado();
  iniciarPerguntasHabitos();
}

function testarAnaliseGemini() {
  analisarDesempenhoComGemini();
}

function testarCrud() {
  limparEstado();
  iniciarCrudHabitos();
}

// ========== REENVIO AUTOMÁTICO DE MENSAGENS ==========

// Deletar mensagem do Telegram
function deleteMessage(chatId, messageId) {
  const payload = {
    'chat_id': String(chatId),
    'message_id': messageId
  };
  try {
    UrlFetchApp.fetch(`${TELEGRAM_API_URL}/deleteMessage`, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) {
    log("ERROR", "Erro ao deletar mensagem: " + e.toString());
  }
}

// Enviar mensagem e retornar resultado com message_id
function sendMessageComRetorno(chatId, text, replyMarkup) {
  const payload = {
    'chat_id': String(chatId),
    'text': text,
    'parse_mode': 'Markdown'
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  try {
    const response = UrlFetchApp.fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const result = JSON.parse(response.getContentText());
    if (result.ok && result.result) {
      return {
        ok: true,
        messageId: result.result.message_id
      };
    }
    return { ok: false, messageId: null };
  } catch (e) {
    log("ERROR", "Erro ao enviar mensagem: " + e.toString());
    return { ok: false, messageId: null };
  }
}

// Enviar mensagem com botões e retornar message_id
function sendMessageWithButtonsComRetorno(chatId, text, botoes) {
  const inlineKeyboard = {
    inline_keyboard: [botoes]
  };
  return sendMessageComRetorno(chatId, text, inlineKeyboard);
}

// Verificar se está no horário permitido de reenvio
function dentroDoHorarioReenvio() {
  const intervalo = lerConfigSheet('INTERVALO_REENVIO') || CONFIG.INTERVALO_REENVIO;
  if (!intervalo) return true; // Se não configurado, sempre permite

  const match = intervalo.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
  if (!match) {
    log("WARN", "INTERVALO_REENVIO formato inválido: " + intervalo);
    return true;
  }

  const horaInicio = parseInt(match[1]);
  const minInicio = parseInt(match[2]);
  const horaFim = parseInt(match[3]);
  const minFim = parseInt(match[4]);

  const agora = new Date();
  const horaAtual = agora.getHours();
  const minAtual = agora.getMinutes();

  const minutosAtual = horaAtual * 60 + minAtual;
  const minutosInicio = horaInicio * 60 + minInicio;
  const minutosFim = horaFim * 60 + minFim;

  return minutosAtual >= minutosInicio && minutosAtual <= minutosFim;
}

// Criar trigger para reenvio após X minutos
function criarTriggerReenvio() {
  // Primeiro deleta triggers existentes
  deletarTriggersReenvio();

  const minutos = parseInt(lerConfigSheet('MINUTOS_ENVIAR_MSG_NOVAMENTE') || CONFIG.MINUTOS_ENVIAR_MSG_NOVAMENTE) || 30;

  ScriptApp.newTrigger('verificarEReenviarPergunta')
    .timeBased()
    .after(minutos * 60 * 1000)
    .create();

  log("INFO", `Trigger de reenvio criado para ${minutos} minutos`);
}

// Deletar todos os triggers de reenvio
function deletarTriggersReenvio() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'verificarEReenviarPergunta') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
}

// Função chamada pelo trigger para verificar e reenviar pergunta
function verificarEReenviarPergunta() {
  log("INFO", "[TRIGGER] verificarEReenviarPergunta executado");

  // Verifica se reenvio está ativo (lê direto da sheet para pegar valor atualizado)
  const reenvioAtivo = String(lerConfigSheet('REENVIO_ATIVO') || CONFIG.REENVIO_ATIVO || '').toUpperCase();
  if (reenvioAtivo !== 'SIM' && reenvioAtivo !== 'S' && reenvioAtivo !== 'TRUE') {
    log("INFO", "Reenvio desativado (REENVIO_ATIVO = " + reenvioAtivo + ")");
    return;
  }

  // Verifica se há estado ativo
  const estado = getEstado();
  if (!estado || estado.fluxo !== 'REGISTRO') {
    log("INFO", "Sem estado de registro ativo, não há o que reenviar");
    return;
  }

  // Renova o timestamp para evitar expiração durante reenvios
  setEstado(estado);

  // Verifica se está no horário permitido
  if (!dentroDoHorarioReenvio()) {
    log("INFO", "Fora do horário de reenvio, criando novo trigger para verificar depois");
    criarTriggerReenvio();
    return;
  }

  // Deleta mensagem antiga se existir
  if (estado.ultimoMessageId) {
    deleteMessage(CHAT_ID, estado.ultimoMessageId);
    log("INFO", `Mensagem ${estado.ultimoMessageId} deletada`);
  }

  // Reenvia a pergunta atual
  log("INFO", "Reenviando pergunta de hábito");
  enviarProximaPerguntaRegistro();
}

// ========== ENVIO AUTOMÁTICO DIÁRIO ==========

// Lê uma configuração diretamente da sheet (para configs adicionadas após carregamento)
function lerConfigSheet(chave) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CONFIG");
  if (!sheet) return null;
  const dados = sheet.getDataRange().getValues();
  for (let i = 0; i < dados.length; i++) {
    if (dados[i][0] === chave) return dados[i][1];
  }
  return null;
}

// Configura trigger diário baseado no HORARIO_ENVIO
function configurarTriggerDiario() {
  // Deleta triggers diários existentes
  deletarTriggersDiarios();

  // Lê direto da sheet para pegar configs recentes
  const horario = lerConfigSheet('HORARIO_ENVIO');

  log("INFO", "HORARIO_ENVIO lido: " + horario);

  if (!horario) {
    log("WARN", "HORARIO_ENVIO não configurado na sheet CONFIG");
    throw new Error("HORARIO_ENVIO não configurado na sheet CONFIG. Adicione uma linha com 'HORARIO_ENVIO' na coluna A e o horário (ex: 06:40) na coluna B.");
  }

  const horarioStr = String(horario).trim();
  const match = horarioStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    log("ERROR", "HORARIO_ENVIO formato inválido: " + horario);
    throw new Error("HORARIO_ENVIO formato inválido: " + horario + ". Use formato HH:MM (ex: 06:40)");
  }

  const hora = parseInt(match[1]);
  const minuto = parseInt(match[2]);

  log("INFO", `Criando trigger para hora=${hora}, minuto=${minuto}`);

  try {
    ScriptApp.newTrigger('envioAutomaticoDiario')
      .timeBased()
      .atHour(hora)
      .nearMinute(minuto)
      .everyDays(1)
      .create();

    log("INFO", `Trigger diário configurado para ${hora}:${minuto < 10 ? '0' : ''}${minuto}`);
  } catch (e) {
    log("ERROR", "Erro ao criar trigger: " + e.toString());
    throw new Error("Erro ao criar trigger diário: " + e.message + ". Verifique se você autorizou o script e se não excedeu o limite de triggers.");
  }
}

// Deletar triggers diários
function deletarTriggersDiarios() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'envioAutomaticoDiario') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
}

// Função chamada pelo trigger diário
function envioAutomaticoDiario() {
  log("INFO", "[TRIGGER DIÁRIO] envioAutomaticoDiario executado");

  // Verifica se está ativo (lê direto da sheet para pegar valor atualizado)
  const reenvioAtivo = String(lerConfigSheet('REENVIO_ATIVO') || CONFIG.REENVIO_ATIVO || '').toUpperCase();
  if (reenvioAtivo !== 'SIM' && reenvioAtivo !== 'S' && reenvioAtivo !== 'TRUE') {
    log("INFO", "Envio automático desativado (REENVIO_ATIVO = " + reenvioAtivo + ")");
    return;
  }

  // Inicia o fluxo de perguntas
  iniciarPerguntasHabitos();
}
