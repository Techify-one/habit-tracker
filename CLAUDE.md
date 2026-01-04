# Bot Telegram - Tracking de Hábitos

## Projeto
Bot de Telegram integrado ao Google Sheets para rastreamento de hábitos com análise via Gemini AI.

## Estrutura
```
├── Core.gs           # Código compartilhado (Config, Telegram, Sheets, Estado)
├── Registro.gs       # Fluxo /registro (registrar dia)
├── CrudHabitos.gs    # Fluxo /habitos (CRUD)
├── HABITOS/          # Réplica das sheets em HTML (referência de leitura)
└── old/              # Backup do código original
```

## Sheets
- **CONFIG** - Configurações (tokens, prompts)
- **HABITOS** - Cadastro de hábitos e metas
- **HISTORICO** - Registros diários
- **LOGS** - Auditoria

## Comandos Telegram
- `/habitos` - Gerenciar hábitos (CRUD)
- `/registro` - Registrar hábitos do dia
- `/cancelar` - Cancelar operação atual

## Padrões
- Validar CHAT_ID em todos os handlers
- Estado expira após 30 minutos
- Confirmar antes de excluir
- Logs em todas as operações

## Referência
A pasta `HABITOS/` contém réplicas das sheets em HTML para facilitar leitura e entendimento da estrutura de dados.

## Ao Finalizar Alterações
Sempre listar os arquivos modificados no formato:
```
Arquivos alterados:
- Core.gs
- CrudHabitos.gs
```
Isso facilita a atualização manual no Google Apps Script.

## IMPORTANTE

1 - Sempre que precisar busque na internet por referencias e boas práticas para o projeto e tarefa em questão.

2 - Sempre que tiver alguma dúvida com relação a pontos divergentes sobre o projeto e/ou tarefa, pergunte ao usuário para esclarecer os pontos antes de executar.
