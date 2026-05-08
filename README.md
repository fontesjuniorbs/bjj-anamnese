# BJJ Performance — Sistema de Anamnese Online

Sistema de anamnese online para alunos de Jiu-Jitsu, com geração de links únicos por aluno, formulário de resposta público e painel administrativo do professor. Backend serverless rodando em Cloudflare Workers + KV, frontend hospedado em Cloudflare Pages.

**Autor:** BODYSIZE — Prof. Esp. Fontes Júnior · CREF 005654-G/AM
**Versão:** 1.1.0 (bundled)

---

## Arquitetura

```
┌────────────────────────┐         ┌────────────────────────────┐
│  Cloudflare Pages      │ ──────► │  Cloudflare Worker (API)   │
│  bjj-anamnese.pages.dev│  fetch  │  bjj-anamnese-api          │
│  (HTML/CSS/JS público) │         │  + KV namespace ANAMNESES  │
└────────────────────────┘         └────────────┬───────────────┘
                                                │
                              ┌─────────────────┼──────────────────┐
                              ▼                 ▼                  ▼
                        E-mail (MailChannels)  Telegram        Google Sheets
                              (opcional)      (opcional)        (opcional)
```

- **Frontend** (`pages/index.html`): página pública servida pelo Cloudflare Pages.
- - **Backend** (`pages/worker_index-bundled.js`): Worker bundlado com 3 módulos consolidados — `notifications.js` + `mapper.js` + `index.js`. Pronto para deploy via dashboard do Cloudflare (basta colar o conteúdo).
  - - **Storage**: KV Namespace `ANAMNESES` (chave = token UUID v4 sem hífens; valor = JSON com status, datas, dados do aluno e respostas).
   
    - ---

    ## Endpoints da API

    | Método | Rota | Acesso | Descrição |
    |--------|----------------------------------------|----------|-----------|
    | GET    | `/api/health`                          | público  | Health check |
    | POST   | `/api/anamnese/criar`                  | auth     | Gera link único para um aluno |
    | GET    | `/api/anamnese/buscar/:token`          | público  | Busca dados pelo token (aluno preenche) |
    | POST   | `/api/anamnese/responder/:token`       | público  | Recebe respostas do aluno + dispara notificações |
    | GET    | `/api/anamnese/listar`                 | auth     | Lista todas as anamneses |
    | GET    | `/api/anamnese/detalhe/:token`         | auth     | Detalhes completos de uma anamnese |
    | DELETE | `/api/anamnese/:token`                 | auth     | Remove anamnese |

    Rotas marcadas como **auth** exigem header `Authorization: Bearer <AUTH_TOKEN>`.

    ---

    ## Pré-requisitos

    - Conta no [Cloudflare](https://dash.cloudflare.com/) (plano Free é suficiente).
    - - Domínio `*.pages.dev` (gratuito) ou domínio próprio.
      - - (Opcional) Bot do Telegram via [@BotFather](https://t.me/BotFather).
        - - (Opcional) Google Apps Script publicado como Web App (para registrar respostas em planilha).
         
          - ---

          ## Deploy passo a passo

          ### 1. Criar o KV Namespace `ANAMNESES`

          No dashboard Cloudflare → **Workers & Pages** → **KV** → **Create namespace** → nome `ANAMNESES`. Copie o **ID** gerado.

          Em `pages/worker_wrangler.toml`, substitua o placeholder:

          ```toml
          [[kv_namespaces]]
          binding = "ANAMNESES"
          id = "SUBSTITUIR_PELO_KV_ID_REAL"   # ← cole aqui o ID real
          ```

          ### 2. Criar o Worker

          **Opção A — via Dashboard (recomendado para esta versão bundled):**
          1. Workers & Pages → **Create** → **Create Worker** → nome `bjj-anamnese-api`.
          2. 2. Em **Edit code**, apague o boilerplate e cole o conteúdo de `pages/worker_index-bundled.js`.
             3. 3. Salve e faça deploy.
                4. 4. Em **Settings → Variables → KV Namespace Bindings**, adicione binding `ANAMNESES` apontando para o namespace criado no passo 1.
                  
                   5. **Opção B — via Wrangler CLI:**
                   6. ```bash
                      npm install -g wrangler
                      wrangler login
                      wrangler deploy --config pages/worker_wrangler.toml
                      ```
                      (Requer reorganizar o bundled em `worker/src/index.js` conforme o `main` do toml.)

                      ### 3. Configurar variáveis e secrets

                      No dashboard do Worker → **Settings → Variables**:

                      **Plain text vars** (já vêm no `wrangler.toml`, ajuste se mudar de domínio):
                      - `ALLOWED_ORIGINS` — origens permitidas (CORS), separadas por vírgula.
                      - - `PAGES_HOST` — host do front (`bjj-anamnese.pages.dev`).
                        - - `PUBLIC_BASE_URL` — URL pública para gerar links de anamnese.
                          - - `NOTIFY_PROFESSIONAL_NAME` — nome exibido nas notificações.
                           
                            - **Secrets (obrigatório):**
                            - - `AUTH_TOKEN` — UUID hex 64 chars usado pelo painel admin. Gere com:
                              -   ```bash
                                    openssl rand -hex 32
                                    ```

                                  **Secrets (opcionais — qualquer canal não configurado é silenciosamente ignorado):**
                                  - `NOTIFY_EMAIL_TO` / `NOTIFY_EMAIL_FROM` — e-mail via MailChannels.
                                  - - `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` — Telegram Bot API.
                                    - - `SHEETS_WEBHOOK_URL` — URL do Apps Script Web App.
                                     
                                      - ### 4. Publicar o frontend (Cloudflare Pages)
                                     
                                      - 1. Workers & Pages → **Create** → **Pages** → **Connect to Git** → selecione este repositório.
                                        2. 2. Build command: *(deixe vazio — site estático)*.
                                           3. 3. Build output directory: `pages`.
                                              4. 4. Deploy. O site ficará em `https://bjj-anamnese.pages.dev`.
                                                
                                                 5. ### 5. Conectar frontend ao Worker
                                                
                                                 6. No `index.html` (ou no JS do painel), defina a base da API como o domínio do Worker (ex.: `https://bjj-anamnese-api.<sua-conta>.workers.dev`). Use o `AUTH_TOKEN` para chamadas autenticadas.
                                                
                                                 7. ---
                                                
                                                 8. ## Estrutura do repositório
                                                
                                                 9. ```
                                                    bjj-anamnese/
                                                    ├── README.md                       ← este arquivo
                                                    └── pages/
                                                        ├── index.html                  ← landing page pública
                                                        ├── worker_index-bundled.js     ← Worker (1 arquivo, pronto p/ colar)
                                                        └── worker_wrangler.toml        ← config do Worker
                                                    ```

                                                    ---

                                                    ## Modelo de dados (KV)

                                                    Chave: token (UUID v4, 32 chars hex sem hífens).
                                                    Valor (JSON):
                                                    ```json
                                                    {
                                                      "status": "pendente | respondida",
                                                      "criadoEm": "ISO-8601",
                                                      "respondidoEm": "ISO-8601 | null",
                                                      "dadosAluno": { "nome": "...", "email": "..." },
                                                      "respostas": { "bloco01": {...}, "...": {...}, "bloco17": {...} },
                                                      "ip": "x.x.x.x"
                                                    }
                                                    ```

                                                    O `mapper.js` (já consolidado no bundle) converte os 17 blocos de respostas em um registro compatível com o schema de atletas do HUB.

                                                    ---

                                                    ## Troubleshooting

                                                    - **CORS bloqueado**: confira se `ALLOWED_ORIGINS` inclui a origem que está chamando a API.
                                                    - - **401 Unauthorized**: verifique se o header `Authorization: Bearer <AUTH_TOKEN>` está correto.
                                                      - - **KV not found**: o binding `ANAMNESES` não foi associado ao Worker (Settings → Variables → KV bindings).
                                                        - - **Notificações não chegam**: cada canal exige seus secrets; se faltar algum, o canal é silenciosamente ignorado (não quebra a resposta do aluno).
                                                         
                                                          - ---

                                                          ## Licença

                                                          Uso interno BJJ Performance / BODYSIZE.
                                                          
