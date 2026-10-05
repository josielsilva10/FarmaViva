# FarmaViva — Artefatos da Entrega 2

**Projeto Integrador II — Tecnologia em Sistemas para Internet**  
**Grupo 2 — FarmaViva**  
**Data:** 5 de outubro de 2026  
**Sprint:** Sprint 2 — API e integração de UI

## 1. Definição das tecnologias back-end

| Tecnologia | Uso e justificativa |
|---|---|
| Python 3.11+ | Linguagem do serviço, adequada ao ecossistema FastAPI e rápida de desenvolver/testar. |
| FastAPI | Endpoints REST, injeção de dependências, validação Pydantic e documentação OpenAPI/Swagger automática. |
| Uvicorn | Servidor ASGI para execução local da API. |
| SQLAlchemy 2 | ORM e relacionamentos entre usuários, medicamentos, lotes, thresholds, movimentações e auditoria. |
| SQLite | Persistência local sem infraestrutura adicional, adequada à demonstração acadêmica do MVP; pode ser trocada via `DATABASE_URL`. |
| Pydantic | Validação e serialização de datas, quantidades, login, lote, thresholds e dispensação. |
| JWT (`python-jose`) | Token bearer com expiração para proteger rotas de dados. |
| Argon2 (`pwdlib`) | Hash de senha armazenado no banco, sem senha em texto puro. |
| pytest + HTTPX | Testes automatizados de endpoints e regras de negócio. |

A API define CORS configurável por ambiente, autenticação obrigatória nas rotas de dados, autorização por perfil para alterações administrativas e log de auditoria para operações relevantes. As credenciais seed e o segredo de desenvolvimento são apenas locais; devem ser substituídos antes de uso externo.

## 2. Repositório remoto, versionamento e integração

O GitHub já continha o repositório do grupo **FarmaViva**; foi reaproveitado para evitar um repositório duplicado. O código da API fica em `api/`, ao lado da UI React já existente. Isso preserva o histórico e permite evoluir UI e API no mesmo projeto.

- Remoto existente: [https://github.com/josielsilva10/FarmaViva](https://github.com/josielsilva10/FarmaViva)
- Branch de trabalho: `feat/api-ui-sprint-2`
- Branch principal original: `main`
- A integração local da UI com a API usa `src/services/api.js` e o proxy `/api` do Vite para `http://localhost:8000`.
- O `.gitignore` da API exclui `.env`, banco SQLite, ambiente virtual e caches; não se versionam segredos nem dados locais.

## 3. Implementação das tarefas do projeto API — Sprint 2

As oito tarefas da lista **Sprint 2 — API** do Trello foram desenvolvidas no projeto `api/`.

| ID / tarefa do Trello | Evidência implementada | Critério demonstrável |
|---|---|---|
| API 01 — Configurar FastAPI, Uvicorn, CORS e ambiente | `api/app/main.py`, `api/app/database.py`, `api/requirements.txt`, `api/.env.example` | API em `localhost:8000`, CORS configurável, `/health` e ambiente documentado. |
| API 02 — Modelar tabelas medicamentos, lotes, thresholds, auditoria e movimentações | `api/app/models.py` | Entidades SQLAlchemy relacionais, chaves estrangeiras e restrição de lote repetido por medicamento. |
| API 03 — Implementar persistência SQLite e seed inicial | `api/app/database.py`, `api/app/main.py` | Banco criado automaticamente; catálogo demonstrativo e thresholds iniciais persistidos. |
| API 04 — Implementar autenticação, autorização e validação de usuários | `api/app/security.py`, `api/app/schemas.py`, rotas `/api/auth/*` | Login JWT, expiração, hash Argon2 e dependência bearer para rotas protegidas. |
| API 05 — Criar CRUD REST de medicamentos e lotes | rotas `/api/medicamentos` e `/api/medicamentos/{id}/lotes` | Cadastro, consulta, atualização e inativação; adição/consulta de lotes com validação. |
| API 06 — Criar estoque, filtros, status e cálculo de validade | rota `/api/lotes` e função `_status` | Busca por medicamento/princípio ativo, filtro Verde/Amarelo/Vermelho/Expirado e ordem por vencimento. |
| API 07 — Implementar dashboard, alertas e regra FEFO de dispensação | rotas `/api/dashboard/alertas`, `/api/config/thresholds`, `/api/dispensacoes` | Percentuais/indicadores, thresholds editáveis e lote mais próximo sugerido; lote expirado e saldo insuficiente são bloqueados pelo servidor. |
| API 08 — Criar testes automatizados, OpenAPI e README de execução | `api/tests/`, `/docs`, `api/README.md` | Testes de autenticação, persistência, datas, thresholds, estoque, FEFO, dispensação e documentação interativa. |

Rotas adicionais para relatório de próximos vencimentos e trilha de auditoria também foram incluídas para cobrir RF09 e os registros previstos no diagrama de classes.

## 4. Implementação das tarefas do projeto UI — Sprint 2

O quadro original tinha sete cartões de UI. Foi completado com a tarefa [**UI 08 — Integrar configuração de thresholds de validade com a API**](https://trello.com/c/hiepVibh/18-ui-08-integrar-configura%C3%A7%C3%A3o-de-thresholds-de-validade-com-a-api), ligada a RF12/US12, para cumprir o mínimo de oito e refletir o escopo da Sprint 2. O cartão inclui objetivo, endpoints, critérios de aceite e validação.

| ID / tarefa do Trello | Evidência implementada | Critério demonstrável |
|---|---|---|
| UI 01 — Integrar cliente HTTP com a API FastAPI | `src/services/api.js`, `src/context/AuthContext.jsx`, `src/pages/Login.jsx`, `vite.config.js` | Requisições HTTP centralizadas, bearer token de sessão, validação de sessão e login real. |
| UI 02 — Adaptar telas de estoque, validade e filtros para dados reais | `src/pages/Estoque.jsx`, `src/pages/Cadastro.jsx` | Consulta filtrável ao endpoint de lotes e cadastro persistido via API. |
| UI 03 — Implementar alertas visuais amarelo, vermelho e vencido | `src/components/StatusBadge.jsx`, `src/pages/Estoque.jsx` | Estados calculados no servidor e exibidos como rótulos visuais na listagem. |
| UI 04 — Integrar dashboard de indicadores e resumos | `src/pages/Dashboard.jsx` | KPIs, linha do tempo e lista de lotes em atenção alimentados por `/dashboard/alertas`. |
| UI 05 — Implementar fluxo de dispensação com validações | `src/pages/Dispensacao.jsx` | FEFO, validação de quantidade, confirmação explícita de lote crítico e bloqueio server-side de lote vencido. |
| UI 06 — Tratar carregamento, erros, vazio e indisponibilidade da API | Estoque, Cadastro, Dashboard e Dispensação | Mensagens de estado, erros acessíveis com `role="alert"`, tentativas novamente e feedback de sucesso. |
| UI 07 — Revisar responsividade, acessibilidade e testes de componentes | páginas/componentes existentes, atributos `aria-*`, `src/components/StatusBadge.test.jsx` | Controles com rótulos, estado selecionado acessível e teste Vitest dos quatro rótulos de status. |
| UI 08 — Integrar configuração de thresholds de validade com a API | formulário do Dashboard e `src/services/api.js` | Leitura e salvamento via `GET/PUT /api/config/thresholds`; validação amarelo > vermelho e aplicação imediata. |

## 5. Execução e validação

Na raiz do repositório:

```bash
npm install
npm test
npm run lint
npm run build
```

Para a API:

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -q
uvicorn app.main:app --reload --port 8000
```

A validação desta entrega registrou **7 testes de API aprovados**, **2 testes de componente aprovados** e build Vite concluído. O Oxlint concluiu com **0 erros**; seus avisos se referem a hooks existentes/efeitos de atualização de estado, sem bloquear build. API: `http://localhost:8000/docs`; UI: `http://localhost:5173`.

## 6. Requisitos de execução demonstráveis

1. Subir a API e acessar `/docs` para explorar endpoints e esquemas.
2. Entrar na UI com uma credencial demo descrita em `api/README.md`.
3. Conferir cadastro e consulta de medicamentos/lotes persistidos no SQLite.
4. Alterar thresholds no dashboard e confirmar atualização dos status.
5. Selecionar um lote na dispensação e verificar ordenação FEFO, bloqueio do vencido e limite de saldo.
6. Executar os testes de API/UI para conferir validações e rótulos de status.
