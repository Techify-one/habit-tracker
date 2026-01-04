<p align="center">
  <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Spiral%20Calendar.png" alt="Habits Bot Logo" width="100"/>
</p>

<h1 align="center">Habits Bot</h1>

<p align="center">
  <strong>Bot de Telegram para rastreamento de hábitos com Google Sheets e análise por IA</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Apps Script"/>
  <img src="https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram"/>
  <img src="https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI"/>
</p>

---

## Sobre o Projeto

Bot de Telegram integrado ao Google Sheets para rastreamento diário de hábitos, com análise inteligente via Gemini AI.

### Funcionalidades

- **Registro diário** de hábitos via Telegram
- **Gerenciamento** completo de hábitos (criar, editar, excluir)
- **Análise por IA** dos seus padrões e progresso
- **Histórico** completo armazenado no Google Sheets
- **100% gratuito** usando infraestrutura Google

### Comandos do Bot

| Comando | Descrição |
|---------|-----------|
| `/registro` | Registrar hábitos do dia |
| `/habitos` | Gerenciar hábitos (CRUD) |
| `/cancelar` | Cancelar operação atual |

---

## Como Usar

### Passo 1: Copiar a Planilha

1. Acesse a planilha modelo:

   **[Clique aqui para acessar a planilha](https://docs.google.com/spreadsheets/d/1yVHWHT6dwf3IoIlXB9q8wRu4A7tSFXM9w74QNp6bMIU/edit?usp=sharing)**

2. Vá em **Arquivo → Fazer uma cópia**
3. Salve na sua conta Google

### Passo 2: Implantar o Projeto

1. Na sua cópia da planilha, vá em **Extensões → Apps Script**
2. Clique em **Implantar → Nova implantação**
3. Selecione tipo: **App da Web**
4. Configure:
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
5. Clique em **Implantar** e **copie o link** gerado

### Passo 3: Criar Bot no Telegram

1. Abra o Telegram e procure por **@BotFather**
2. Envie `/newbot`
3. Siga as instruções para criar seu bot
4. **Copie o Token** fornecido

### Passo 4: Configurar Webhook

1. Acesse **[https://techify.one/ferramentas](https://techify.one/ferramentas)**
2. Use o **Telegram Manager**
3. Configure o webhook com:
   - Token do bot (Passo 3)
   - URL da implantação (Passo 2)

### Passo 5: Obter seu ID do Telegram

1. Abra seu bot recém-criado no Telegram
2. Clique em **Start**
3. O bot responderá com seu **User ID** - copie este número

### Passo 6: Configurar a Planilha

1. Na sua planilha, acesse a aba **CONFIG**
2. Preencha:
   - `TELEGRAM_TOKEN` → Token do bot (Passo 3)
   - `CHAT_ID` → Seu ID do Telegram (Passo 5)

### Passo 7: Testar

Envie `/registro` para o seu bot no Telegram!

---

## Análise por IA (Opcional)

Para habilitar análises inteligentes dos seus hábitos com Gemini AI:

### 1. Obter Chave de API

1. Acesse o **[Google AI Studio](https://aistudio.google.com/apikey)**
2. Clique em **Criar chave de API**
3. Copie a chave gerada

### 2. Configurar na Planilha

1. Na aba **CONFIG** da sua planilha
2. Preencha `GEMINI_API_KEY` com a chave copiada

### 3. Testar

Envie `/registro` e veja a análise da IA sobre seus hábitos!

---

## Estrutura do Projeto

```
├── Core.gs           # Código compartilhado (Config, Telegram, Sheets, Estado)
├── Registro.gs       # Fluxo /registro (registrar dia)
├── CrudHabitos.gs    # Fluxo /habitos (CRUD)
├── HABITOS/          # Réplica das sheets em HTML (referência)
└── old/              # Backup do código original
```

### Abas da Planilha

| Aba | Descrição |
|-----|-----------|
| **CONFIG** | Configurações (tokens, prompts) |
| **HABITOS** | Cadastro de hábitos e metas |
| **HISTORICO** | Registros diários |
| **LOGS** | Auditoria de operações |

---

## Suporte

Encontrou um problema ou tem sugestões? Abra uma [issue](https://github.com/Techify-one/habits/issues)!

---

<p align="center">
  Feito com dedicação por <a href="https://techify.one">Techify</a>
</p>
