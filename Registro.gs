// ============================================================
// REGISTRO - FLUXO DE REGISTRO DIÁRIO DE HÁBITOS
// Comando: /registro ou /start
// ============================================================

function iniciarPerguntasHabitos() {
  log("INFO", "[INICIO] Perguntas de hábitos");

  const habitos = getHabitos();
  if (habitos.length === 0) {
    sendMessage(CHAT_ID, "Nenhum hábito cadastrado na planilha.\n\nUse /habitos para criar seu primeiro hábito.");
    return;
  }

  const hoje = getHoje();
  const ultimaDataGeral = getUltimaDataHistorico();

  // Data de referência: dia seguinte à última data registrada (ou hoje se não houver histórico)
  const dataReferencia = ultimaDataGeral ? adicionarDia(ultimaDataGeral) : hoje;

  // Se a data de referência é futura, não há nada a registrar
  if (dataReferencia > hoje) {
    sendMessage(CHAT_ID, "Todos os hábitos estão atualizados! Nada a registrar hoje.");
    return;
  }

  // Todos os hábitos para a mesma data
  const habitosParaPerguntar = habitos.map(habito => ({
    ...habito,
    dataReferencia: dataReferencia.toISOString()
  }));

  if (habitosParaPerguntar.length === 0) {
    sendMessage(CHAT_ID, "Todos os hábitos estão atualizados! Nada a registrar hoje.");
    return;
  }

  const estado = {
    fluxo: 'REGISTRO',
    ativo: true,
    habitoAtual: 0,
    habitos: habitosParaPerguntar,
    aguardandoResposta: true,
    timestamp: Date.now()
  };
  setEstado(estado);

  log("INFO", `${habitosParaPerguntar.length} hábitos para perguntar`);
  enviarProximaPerguntaRegistro();
}

function enviarProximaPerguntaRegistro() {
  const estado = getEstado();
  if (!estado || estado.fluxo !== 'REGISTRO') return;

  if (estado.habitoAtual >= estado.habitos.length) {
    // Limpa triggers de reenvio pois o fluxo terminou
    deletarTriggersReenvio();
    limparEstado();
    sendMessage(CHAT_ID, "Todos os hábitos foram registrados! Aguarde a análise...");
    log("INFO", "[FIM] Fluxo finalizado, iniciando análise");

    // Análise com Gemini
    analisarDesempenhoComGemini();
    return;
  }

  const habito = estado.habitos[estado.habitoAtual];
  const dataFormatada = formatarData(habito.dataReferencia);
  const tipoResposta = habito.tipoResposta;
  const botoes = parseBotoes(tipoResposta);

  let resultado;

  if (botoes) {
    const texto = `Escolha uma opção para o hábito *${habito.nome}*\nData: ${dataFormatada}`;
    const botoesInline = botoes.map(b => ({ text: b, callback_data: `resp_${b}` }));
    resultado = sendMessageWithButtonsComRetorno(CHAT_ID, texto, botoesInline);
  } else if (tipoResposta === "NÚMERO") {
    const texto = `Quantos(as) *${habito.metrica}* você investiu no hábito *${habito.nome}*?\nData: ${dataFormatada}`;
    resultado = sendMessageComRetorno(CHAT_ID, texto);
  } else if (tipoResposta === "TEXTO") {
    const texto = `Digite sua observação/registro para o hábito *${habito.nome}*:\nData: ${dataFormatada}\n\n_(Texto livre)_`;
    resultado = sendMessageComRetorno(CHAT_ID, texto);
  } else {
    const texto = `Registre sua resposta para o hábito *${habito.nome}*:\nData: ${dataFormatada}`;
    resultado = sendMessageComRetorno(CHAT_ID, texto);
  }

  // Salva message_id no estado para possível reenvio
  if (resultado && resultado.ok && resultado.messageId) {
    estado.ultimoMessageId = resultado.messageId;
    estado.ultimoEnvio = Date.now();
    setEstado(estado);
    log("INFO", `Mensagem enviada com ID: ${resultado.messageId}`);
  }

  // Cria trigger para reenvio se não responder
  const reenvioAtivo = String(CONFIG.REENVIO_ATIVO || '').toUpperCase();
  if (reenvioAtivo === 'SIM' || reenvioAtivo === 'S' || reenvioAtivo === 'TRUE') {
    criarTriggerReenvio();
  }
}

function processarRespostaRegistro(resposta) {
  const estado = getEstado();
  if (!estado || estado.fluxo !== 'REGISTRO') {
    log("DEBUG", "Resposta recebida mas não há estado de registro ativo");
    return;
  }

  // Deleta triggers de reenvio pendentes pois usuário respondeu
  deletarTriggersReenvio();

  // Limpa message_id do estado
  if (estado.ultimoMessageId) {
    delete estado.ultimoMessageId;
    delete estado.ultimoEnvio;
  }

  const habito = estado.habitos[estado.habitoAtual];

  // Valida número
  if (habito.tipoResposta === "NÚMERO") {
    const numero = parseFloat(resposta);
    if (isNaN(numero)) {
      sendMessage(CHAT_ID, "Por favor, envie apenas números.");
      return;
    }
  }

  // Salva
  salvarHistorico(habito.dataReferencia, habito.nome, resposta);

  // Próximo
  estado.habitoAtual++;
  setEstado(estado);
  enviarProximaPerguntaRegistro();
}
