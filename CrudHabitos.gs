// ============================================================
// CRUD HÁBITOS - GESTÃO DE HÁBITOS VIA TELEGRAM
// Comando: /habitos
// ============================================================

// Etapas do fluxo de criação
const ETAPAS_CRIAR = {
  NOME: 1,
  METRICA: 2,
  TIPO_RESPOSTA: 3,
  META_DIARIA: 4,
  META_SEMANAL: 5,
  META_MENSAL: 6,
  META_ANUAL: 7,
  LEMBRETES: 8,
  PORQUE: 9,
  CONFIRMAR: 10
};

// Campos editáveis
const CAMPOS_EDITAVEIS = [
  { key: 'nome', label: 'Nome' },
  { key: 'metrica', label: 'Métrica' },
  { key: 'tipoResposta', label: 'Tipo Resposta' },
  { key: 'metaDiaria', label: 'Meta Diária' },
  { key: 'metaSemanal', label: 'Meta Semanal' },
  { key: 'metaMensal', label: 'Meta Mensal' },
  { key: 'metaAnual', label: 'Meta Anual' },
  { key: 'lembretes', label: 'Lembretes' },
  { key: 'porque', label: 'Porque' }
];

// ========== MENU PRINCIPAL ==========

function iniciarCrudHabitos() {
  log("INFO", "[CRUD] Menu principal");

  const texto = `*Gestão de Hábitos*

Escolha uma opção:`;

  const botoes = [
    [
      { text: '📋 Listar', callback_data: 'crud_listar' },
      { text: '➕ Novo', callback_data: 'crud_novo' }
    ],
    [
      { text: '✏️ Editar', callback_data: 'crud_editar' },
      { text: '🗑️ Excluir', callback_data: 'crud_excluir' }
    ]
  ];

  sendMessageWithGrid(CHAT_ID, texto, botoes);
}

// ========== LISTAR HÁBITOS ==========

function listarHabitos(chatId, messageId) {
  const habitos = getHabitos();

  if (habitos.length === 0) {
    const texto = `*Nenhum hábito cadastrado*

Use o botão "Novo" para criar seu primeiro hábito.`;

    const botoes = [[{ text: '➕ Criar Hábito', callback_data: 'crud_novo' }]];

    if (messageId) {
      editMessageText(chatId, messageId, texto, { inline_keyboard: botoes });
    } else {
      sendMessageWithGrid(chatId, texto, botoes);
    }
    return;
  }

  let texto = `*Seus Hábitos Cadastrados*\n\n`;

  habitos.forEach((h, i) => {
    texto += `*${i + 1}. ${h.nome}*\n`;
    texto += `   Métrica: ${h.metrica || '-'}\n`;
    texto += `   Tipo: ${h.tipoResposta || '-'}\n`;

    const metas = [];
    if (h.metaDiaria) metas.push(`D:${h.metaDiaria}`);
    if (h.metaSemanal) metas.push(`S:${h.metaSemanal}`);
    if (h.metaMensal) metas.push(`M:${h.metaMensal}`);
    if (h.metaAnual) metas.push(`A:${h.metaAnual}`);

    if (metas.length > 0) {
      texto += `   Metas: ${metas.join(' | ')}\n`;
    }
    texto += `\n`;
  });

  const botoes = [[{ text: '↩️ Voltar', callback_data: 'crud_menu' }]];

  if (messageId) {
    editMessageText(chatId, messageId, texto, { inline_keyboard: botoes });
  } else {
    sendMessageWithGrid(chatId, texto, botoes);
  }
}

// ========== CRIAR HÁBITO ==========

function iniciarCriacaoHabito(chatId, messageId) {
  const estado = criarEstado('CRUD_HABITOS', 'CRIAR');
  estado.etapa = ETAPAS_CRIAR.NOME;
  estado.dados = {};
  setEstado(estado);

  const texto = `*Criar Novo Hábito*

Etapa 1/9: Qual o *NOME* do hábito?

_(Ex: Ler, Meditar, Correr)_`;

  const botoes = [[{ text: '❌ Cancelar', callback_data: 'crud_cancelar' }]];

  if (messageId) {
    editMessageText(chatId, messageId, texto, { inline_keyboard: botoes });
  } else {
    sendMessageWithGrid(chatId, texto, botoes);
  }
}

function enviarProximaEtapaCriacao(chatId) {
  const estado = getEstado();
  if (!estado || estado.acao !== 'CRIAR') return;

  const etapa = estado.etapa;
  let texto = '';
  let botoes = [[{ text: '❌ Cancelar', callback_data: 'crud_cancelar' }]];

  switch (etapa) {
    case ETAPAS_CRIAR.METRICA:
      texto = `*Criar Novo Hábito*

Etapa 2/9: Qual a *MÉTRICA* deste hábito?

Selecione uma opção ou digite outra:`;
      botoes = [
        [
          { text: 'Minutos', callback_data: 'crud_metrica_Minutos' },
          { text: 'Contagem', callback_data: 'crud_metrica_Contagem' },
          { text: 'Páginas', callback_data: 'crud_metrica_Páginas' }
        ],
        [
          { text: 'Km', callback_data: 'crud_metrica_Km' },
          { text: 'Litros', callback_data: 'crud_metrica_Litros' },
          { text: 'Calorias', callback_data: 'crud_metrica_Calorias' }
        ],
        [{ text: '❌ Cancelar', callback_data: 'crud_cancelar' }]
      ];
      break;

    case ETAPAS_CRIAR.TIPO_RESPOSTA:
      texto = `*Criar Novo Hábito*

Etapa 3/9: Qual o *TIPO DE RESPOSTA*?`;
      botoes = [
        [
          { text: 'NÚMERO', callback_data: 'crud_tipo_NUMERO' },
          { text: 'SIM/NÃO', callback_data: 'crud_tipo_SIMNAO' }
        ],
        [{ text: '❌ Cancelar', callback_data: 'crud_cancelar' }]
      ];
      break;

    case ETAPAS_CRIAR.META_DIARIA:
      texto = `*Criar Novo Hábito*

Etapa 4/9: Qual a *META DIÁRIA*?

_(Digite 0 se não tiver meta diária)_`;
      break;

    case ETAPAS_CRIAR.META_SEMANAL:
      texto = `*Criar Novo Hábito*

Etapa 5/9: Qual a *META SEMANAL*?

_(Digite 0 se não tiver meta semanal)_`;
      break;

    case ETAPAS_CRIAR.META_MENSAL:
      texto = `*Criar Novo Hábito*

Etapa 6/9: Qual a *META MENSAL*?

_(Digite 0 se não tiver meta mensal)_`;
      break;

    case ETAPAS_CRIAR.META_ANUAL:
      texto = `*Criar Novo Hábito*

Etapa 7/9: Qual a *META ANUAL*?

_(Digite 0 se não tiver meta anual)_`;
      break;

    case ETAPAS_CRIAR.LEMBRETES:
      texto = `*Criar Novo Hábito*

Etapa 8/9: Configurar *LEMBRETES*?

_(Digite o texto do lembrete ou 0 para pular)_`;
      break;

    case ETAPAS_CRIAR.PORQUE:
      texto = `*Criar Novo Hábito*

Etapa 9/9: *POR QUE* você quer cultivar este hábito?

_(Isso ajuda na análise da IA)_`;
      break;

    case ETAPAS_CRIAR.CONFIRMAR:
      const d = estado.dados;
      texto = `*Confirmar Novo Hábito*

*Nome:* ${d.nome}
*Métrica:* ${d.metrica}
*Tipo:* ${d.tipoResposta}
*Meta Diária:* ${d.metaDiaria || 0}
*Meta Semanal:* ${d.metaSemanal || 0}
*Meta Mensal:* ${d.metaMensal || 0}
*Meta Anual:* ${d.metaAnual || 0}
*Lembretes:* ${d.lembretes || '-'}
*Porque:* ${d.porque || '-'}`;

      botoes = [
        [
          { text: '✅ Confirmar', callback_data: 'crud_confirmar_criar' },
          { text: '❌ Cancelar', callback_data: 'crud_cancelar' }
        ]
      ];
      break;
  }

  sendMessageWithGrid(chatId, texto, botoes);
}

function processarRespostaCriacao(texto) {
  const estado = getEstado();
  if (!estado || estado.acao !== 'CRIAR') return;

  const etapa = estado.etapa;

  switch (etapa) {
    case ETAPAS_CRIAR.NOME:
      estado.dados.nome = texto;
      estado.etapa = ETAPAS_CRIAR.METRICA;
      break;

    case ETAPAS_CRIAR.METRICA:
      estado.dados.metrica = texto;
      estado.etapa = ETAPAS_CRIAR.TIPO_RESPOSTA;
      break;

    case ETAPAS_CRIAR.META_DIARIA:
      estado.dados.metaDiaria = parseFloat(texto) || 0;
      estado.etapa = ETAPAS_CRIAR.META_SEMANAL;
      break;

    case ETAPAS_CRIAR.META_SEMANAL:
      estado.dados.metaSemanal = parseFloat(texto) || 0;
      estado.etapa = ETAPAS_CRIAR.META_MENSAL;
      break;

    case ETAPAS_CRIAR.META_MENSAL:
      estado.dados.metaMensal = parseFloat(texto) || 0;
      estado.etapa = ETAPAS_CRIAR.META_ANUAL;
      break;

    case ETAPAS_CRIAR.META_ANUAL:
      estado.dados.metaAnual = parseFloat(texto) || 0;
      estado.etapa = ETAPAS_CRIAR.LEMBRETES;
      break;

    case ETAPAS_CRIAR.LEMBRETES:
      estado.dados.lembretes = texto === '0' ? '' : texto;
      estado.etapa = ETAPAS_CRIAR.PORQUE;
      break;

    case ETAPAS_CRIAR.PORQUE:
      estado.dados.porque = texto;
      estado.etapa = ETAPAS_CRIAR.CONFIRMAR;
      break;
  }

  setEstado(estado);
  enviarProximaEtapaCriacao(CHAT_ID);
}

function confirmarCriacaoHabito(chatId, messageId) {
  const estado = getEstado();
  if (!estado || estado.acao !== 'CRIAR') return;

  const sucesso = criarHabito(estado.dados);
  limparEstado();

  if (sucesso) {
    const texto = `✅ *Hábito criado com sucesso!*

*${estado.dados.nome}* foi adicionado à sua lista.

Use /registro para começar a rastrear.`;

    const botoes = [
      [
        { text: '➕ Criar outro', callback_data: 'crud_novo' },
        { text: '📋 Ver lista', callback_data: 'crud_listar' }
      ]
    ];

    editMessageText(chatId, messageId, texto, { inline_keyboard: botoes });
  } else {
    editMessageText(chatId, messageId, "❌ Erro ao criar hábito. Tente novamente.");
  }
}

// ========== EDITAR HÁBITO ==========

function iniciarEdicaoHabito(chatId, messageId) {
  const habitos = getHabitos();

  if (habitos.length === 0) {
    const texto = `*Nenhum hábito para editar*

Crie um hábito primeiro.`;
    const botoes = [[{ text: '↩️ Voltar', callback_data: 'crud_menu' }]];
    editMessageText(chatId, messageId, texto, { inline_keyboard: botoes });
    return;
  }

  const texto = `*Editar Hábito*

Selecione qual hábito deseja editar:`;

  const botoes = habitos.map(h => [{
    text: h.nome,
    callback_data: `crud_sel_edit_${h.indice}`
  }]);
  botoes.push([{ text: '↩️ Voltar', callback_data: 'crud_menu' }]);

  editMessageText(chatId, messageId, texto, { inline_keyboard: botoes });
}

function selecionarHabitoEditar(indice, chatId, messageId) {
  const habito = getHabitoByIndice(indice);
  if (!habito) {
    sendMessage(chatId, "Hábito não encontrado.");
    return;
  }

  const estado = criarEstado('CRUD_HABITOS', 'EDITAR');
  estado.habitoIndice = indice;
  estado.habitoNome = habito.nome;
  setEstado(estado);

  mostrarMenuCamposEditar(chatId, messageId, habito);
}

function mostrarMenuCamposEditar(chatId, messageId, habito) {
  const texto = `*Editando: ${habito.nome}*

Selecione o campo que deseja alterar:

*Nome:* ${habito.nome}
*Métrica:* ${habito.metrica || '-'}
*Tipo:* ${habito.tipoResposta || '-'}
*Meta Diária:* ${habito.metaDiaria || 0}
*Meta Semanal:* ${habito.metaSemanal || 0}
*Meta Mensal:* ${habito.metaMensal || 0}
*Meta Anual:* ${habito.metaAnual || 0}
*Lembretes:* ${habito.lembretes || '-'}
*Porque:* ${habito.porque || '-'}`;

  const botoes = [
    [
      { text: 'Nome', callback_data: 'crud_edit_nome' },
      { text: 'Métrica', callback_data: 'crud_edit_metrica' },
      { text: 'Tipo', callback_data: 'crud_edit_tipoResposta' }
    ],
    [
      { text: 'Meta D', callback_data: 'crud_edit_metaDiaria' },
      { text: 'Meta S', callback_data: 'crud_edit_metaSemanal' },
      { text: 'Meta M', callback_data: 'crud_edit_metaMensal' }
    ],
    [
      { text: 'Meta A', callback_data: 'crud_edit_metaAnual' },
      { text: 'Lembretes', callback_data: 'crud_edit_lembretes' },
      { text: 'Porque', callback_data: 'crud_edit_porque' }
    ],
    [{ text: '↩️ Voltar', callback_data: 'crud_editar' }]
  ];

  editMessageText(chatId, messageId, texto, { inline_keyboard: botoes });
}

function iniciarEdicaoCampo(campo, chatId, messageId) {
  const estado = getEstado();
  if (!estado || estado.acao !== 'EDITAR') return;

  estado.campoEditando = campo;
  setEstado(estado);

  const campoInfo = CAMPOS_EDITAVEIS.find(c => c.key === campo);
  const label = campoInfo ? campoInfo.label : campo;

  let texto = `*Editando ${label}*

Digite o novo valor:`;
  let botoes = [[{ text: '❌ Cancelar', callback_data: 'crud_cancelar_edicao' }]];

  // Se for tipo resposta, mostra botões
  if (campo === 'tipoResposta') {
    texto = `*Editando Tipo de Resposta*

Selecione o novo tipo:`;
    botoes = [
      [
        { text: 'NÚMERO', callback_data: 'crud_edval_tipo_NUMERO' },
        { text: 'SIM/NÃO', callback_data: 'crud_edval_tipo_SIMNAO' }
      ],
      [{ text: '❌ Cancelar', callback_data: 'crud_cancelar_edicao' }]
    ];
  }

  // Se for métrica, mostra botões
  if (campo === 'metrica') {
    texto = `*Editando Métrica*

Selecione uma opção ou digite outra:`;
    botoes = [
      [
        { text: 'Minutos', callback_data: 'crud_edval_metrica_Minutos' },
        { text: 'Contagem', callback_data: 'crud_edval_metrica_Contagem' },
        { text: 'Páginas', callback_data: 'crud_edval_metrica_Páginas' }
      ],
      [
        { text: 'Km', callback_data: 'crud_edval_metrica_Km' },
        { text: 'Litros', callback_data: 'crud_edval_metrica_Litros' },
        { text: 'Calorias', callback_data: 'crud_edval_metrica_Calorias' }
      ],
      [{ text: '❌ Cancelar', callback_data: 'crud_cancelar_edicao' }]
    ];
  }

  editMessageText(chatId, messageId, texto, { inline_keyboard: botoes });
}

function processarRespostaEdicao(texto) {
  const estado = getEstado();
  if (!estado || estado.acao !== 'EDITAR' || !estado.campoEditando) return;

  const campo = estado.campoEditando;
  let valor = texto;

  // Converte para número se for meta
  if (campo.startsWith('meta')) {
    valor = parseFloat(texto) || 0;
  }

  // Salva na sheet
  const dados = {};
  dados[campo] = valor;

  const sucesso = atualizarHabito(estado.habitoIndice, dados);

  if (sucesso) {
    sendMessage(CHAT_ID, `✅ Campo *${campo}* atualizado para: *${valor}*`);
  } else {
    sendMessage(CHAT_ID, "❌ Erro ao atualizar. Tente novamente.");
  }

  // Volta ao menu de edição
  estado.campoEditando = null;
  setEstado(estado);

  const habito = getHabitoByIndice(estado.habitoIndice);
  if (habito) {
    const botoes = [[{ text: '📝 Continuar editando', callback_data: `crud_sel_edit_${estado.habitoIndice}` }]];
    sendMessageWithGrid(CHAT_ID, "Deseja editar outro campo?", botoes);
  }
}

function aplicarEdicaoTipo(tipo, chatId, messageId) {
  const estado = getEstado();
  if (!estado || estado.acao !== 'EDITAR') return;

  const tipoResposta = tipo === 'SIMNAO' ? '[SIM,NÃO]' : 'NÚMERO';

  const sucesso = atualizarHabito(estado.habitoIndice, { tipoResposta: tipoResposta });

  if (sucesso) {
    const texto = `✅ Tipo de resposta atualizado para: *${tipoResposta}*`;
    const botoes = [[{ text: '📝 Continuar editando', callback_data: `crud_sel_edit_${estado.habitoIndice}` }]];
    editMessageText(chatId, messageId, texto, { inline_keyboard: botoes });
  } else {
    editMessageText(chatId, messageId, "❌ Erro ao atualizar. Tente novamente.");
  }

  estado.campoEditando = null;
  setEstado(estado);
}

function aplicarEdicaoMetrica(metrica, chatId, messageId) {
  const estado = getEstado();
  if (!estado || estado.acao !== 'EDITAR') return;

  const sucesso = atualizarHabito(estado.habitoIndice, { metrica: metrica });

  if (sucesso) {
    const texto = `✅ Métrica atualizada para: *${metrica}*`;
    const botoes = [[{ text: '📝 Continuar editando', callback_data: `crud_sel_edit_${estado.habitoIndice}` }]];
    editMessageText(chatId, messageId, texto, { inline_keyboard: botoes });
  } else {
    editMessageText(chatId, messageId, "❌ Erro ao atualizar. Tente novamente.");
  }

  estado.campoEditando = null;
  setEstado(estado);
}

// ========== EXCLUIR HÁBITO ==========

function iniciarExclusaoHabito(chatId, messageId) {
  const habitos = getHabitos();

  if (habitos.length === 0) {
    const texto = `*Nenhum hábito para excluir*`;
    const botoes = [[{ text: '↩️ Voltar', callback_data: 'crud_menu' }]];
    editMessageText(chatId, messageId, texto, { inline_keyboard: botoes });
    return;
  }

  const texto = `*Excluir Hábito*

⚠️ Esta ação não pode ser desfeita!

Selecione qual hábito deseja excluir:`;

  const botoes = habitos.map(h => [{
    text: `🗑️ ${h.nome}`,
    callback_data: `crud_sel_del_${h.indice}`
  }]);
  botoes.push([{ text: '↩️ Voltar', callback_data: 'crud_menu' }]);

  editMessageText(chatId, messageId, texto, { inline_keyboard: botoes });
}

function confirmarExclusaoHabito(indice, chatId, messageId) {
  const habito = getHabitoByIndice(indice);
  if (!habito) {
    sendMessage(chatId, "Hábito não encontrado.");
    return;
  }

  const estado = criarEstado('CRUD_HABITOS', 'EXCLUIR');
  estado.habitoIndice = indice;
  estado.habitoNome = habito.nome;
  setEstado(estado);

  const texto = `*Confirmar Exclusão*

Tem certeza que deseja excluir o hábito *"${habito.nome}"*?

⚠️ Esta ação não pode ser desfeita!
⚠️ O histórico de registros será mantido.`;

  const botoes = [
    [
      { text: '✅ Sim, Excluir', callback_data: 'crud_confirmar_excluir' },
      { text: '❌ Cancelar', callback_data: 'crud_excluir' }
    ]
  ];

  editMessageText(chatId, messageId, texto, { inline_keyboard: botoes });
}

function executarExclusaoHabito(chatId, messageId) {
  const estado = getEstado();
  if (!estado || estado.acao !== 'EXCLUIR') return;

  const nomeHabito = estado.habitoNome;
  const sucesso = excluirHabito(estado.habitoIndice);
  limparEstado();

  if (sucesso) {
    const texto = `✅ *Hábito excluído!*

*${nomeHabito}* foi removido da sua lista.`;

    const botoes = [[{ text: '↩️ Menu', callback_data: 'crud_menu' }]];
    editMessageText(chatId, messageId, texto, { inline_keyboard: botoes });
  } else {
    editMessageText(chatId, messageId, "❌ Erro ao excluir hábito. Tente novamente.");
  }
}

// ========== HANDLER DE CALLBACKS ==========

function handleCrudCallback(data, chatId, messageId) {
  log("DEBUG", `CRUD callback: ${data}`);

  // Menu principal
  if (data === 'crud_menu') {
    limparEstado();
    iniciarCrudHabitos();
    return;
  }

  // Listar
  if (data === 'crud_listar') {
    listarHabitos(chatId, messageId);
    return;
  }

  // Novo hábito
  if (data === 'crud_novo') {
    iniciarCriacaoHabito(chatId, messageId);
    return;
  }

  // Métrica na criação
  if (data.startsWith('crud_metrica_')) {
    const metrica = data.replace('crud_metrica_', '');
    const estado = getEstado();
    if (estado && estado.acao === 'CRIAR') {
      estado.dados.metrica = metrica;
      estado.etapa = ETAPAS_CRIAR.TIPO_RESPOSTA;
      setEstado(estado);
      enviarProximaEtapaCriacao(chatId);
    }
    return;
  }

  // Tipo de resposta na criação
  if (data === 'crud_tipo_NUMERO') {
    const estado = getEstado();
    if (estado && estado.acao === 'CRIAR') {
      estado.dados.tipoResposta = 'NÚMERO';
      estado.etapa = ETAPAS_CRIAR.META_DIARIA;
      setEstado(estado);
      enviarProximaEtapaCriacao(chatId);
    }
    return;
  }

  if (data === 'crud_tipo_SIMNAO') {
    const estado = getEstado();
    if (estado && estado.acao === 'CRIAR') {
      estado.dados.tipoResposta = '[SIM,NÃO]';
      estado.etapa = ETAPAS_CRIAR.META_DIARIA;
      setEstado(estado);
      enviarProximaEtapaCriacao(chatId);
    }
    return;
  }

  // Confirmar criação
  if (data === 'crud_confirmar_criar') {
    confirmarCriacaoHabito(chatId, messageId);
    return;
  }

  // Editar - menu
  if (data === 'crud_editar') {
    iniciarEdicaoHabito(chatId, messageId);
    return;
  }

  // Selecionar hábito para editar
  if (data.startsWith('crud_sel_edit_')) {
    const indice = parseInt(data.replace('crud_sel_edit_', ''));
    selecionarHabitoEditar(indice, chatId, messageId);
    return;
  }

  // Editar campo específico
  if (data.startsWith('crud_edit_')) {
    const campo = data.replace('crud_edit_', '');
    iniciarEdicaoCampo(campo, chatId, messageId);
    return;
  }

  // Valor de edição (tipo)
  if (data.startsWith('crud_edval_tipo_')) {
    const tipo = data.replace('crud_edval_tipo_', '');
    aplicarEdicaoTipo(tipo, chatId, messageId);
    return;
  }

  // Valor de edição (métrica)
  if (data.startsWith('crud_edval_metrica_')) {
    const metrica = data.replace('crud_edval_metrica_', '');
    aplicarEdicaoMetrica(metrica, chatId, messageId);
    return;
  }

  // Cancelar edição de campo
  if (data === 'crud_cancelar_edicao') {
    const estado = getEstado();
    if (estado && estado.acao === 'EDITAR') {
      estado.campoEditando = null;
      setEstado(estado);
      const habito = getHabitoByIndice(estado.habitoIndice);
      if (habito) {
        mostrarMenuCamposEditar(chatId, messageId, habito);
      }
    }
    return;
  }

  // Excluir - menu
  if (data === 'crud_excluir') {
    iniciarExclusaoHabito(chatId, messageId);
    return;
  }

  // Selecionar hábito para excluir
  if (data.startsWith('crud_sel_del_')) {
    const indice = parseInt(data.replace('crud_sel_del_', ''));
    confirmarExclusaoHabito(indice, chatId, messageId);
    return;
  }

  // Confirmar exclusão
  if (data === 'crud_confirmar_excluir') {
    executarExclusaoHabito(chatId, messageId);
    return;
  }

  // Cancelar qualquer operação
  if (data === 'crud_cancelar') {
    limparEstado();
    const texto = "❌ Operação cancelada.";
    const botoes = [[{ text: '↩️ Menu', callback_data: 'crud_menu' }]];
    editMessageText(chatId, messageId, texto, { inline_keyboard: botoes });
    return;
  }
}

// ========== PROCESSAR RESPOSTA TEXTO ==========

function processarRespostaCrud(texto) {
  const estado = getEstado();
  if (!estado || estado.fluxo !== 'CRUD_HABITOS') return;

  if (estado.acao === 'CRIAR') {
    processarRespostaCriacao(texto);
  } else if (estado.acao === 'EDITAR' && estado.campoEditando) {
    processarRespostaEdicao(texto);
  }
}
