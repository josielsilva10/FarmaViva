# FarmaViva API — Sprint 2

API REST para a aplicação FarmaViva, alinhada às tarefas API 01–08 do quadro Trello.

## Tecnologias de back-end

- **Python 3.11+** — linguagem do serviço;
- **FastAPI** — API REST, validação de payloads, documentação OpenAPI automática;
- **Uvicorn** — servidor ASGI de desenvolvimento;
- **SQLite** — persistência local simples para a entrega acadêmica;
- **SQLAlchemy 2** — mapeamento objeto-relacional e relacionamento entre entidades;
- **Pydantic** — validação e serialização;
- **JWT (python-jose)** — autenticação bearer com expiração;
- **Argon2 (pwdlib)** — armazenamento de senhas com hash, nunca em texto puro;
- **pytest + HTTPX** — testes automatizados da API.

SQLite facilita executar e demonstrar o MVP sem infraestrutura extra; `DATABASE_URL` pode ser substituída por uma URL PostgreSQL compatível com SQLAlchemy.

## Executar

```bash
cd api
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env             # revise principalmente JWT_SECRET_KEY e senhas
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Saúde: `http://localhost:8000/health`
- Swagger/OpenAPI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- A UI Vite roda em `http://localhost:5173` e encaminha `/api` para a API.

Sem `.env`, são criadas contas demonstrativas para desenvolvimento. E-mail de farmacêutica: `ana.farmaceutica@farmaviva.com.br`; gestor: `gestor@farmaviva.local`; auxiliar: `auxiliar@farmaviva.local`. Senha padrão de demonstração: `FarmaViva123!`. Substitua antes de qualquer uso além de demonstração local; os dados/segredos de demonstração não são credenciais de produção.

## Rotas principais

| Método | Rota | Acesso |
|---|---|---|
| `POST` | `/api/auth/login` | Público; retorna JWT |
| `GET` | `/api/auth/me` | Bearer |
| `GET, POST` | `/api/medicamentos` | Bearer |
| `GET, PATCH, DELETE` | `/api/medicamentos/{id}` | Bearer |
| `POST, GET` | `/api/medicamentos/{id}/lotes` | Bearer |
| `GET` | `/api/lotes?busca=&status=` | Bearer |
| `GET, PUT` | `/api/config/thresholds` | Bearer; alteração: gestor/farmacêutico |
| `GET` | `/api/dashboard/alertas` | Bearer |
| `POST` | `/api/dispensacoes` | Bearer; validade/estoque verificados no servidor |
| `GET` | `/api/relatorios/proximos-vencimento` | Bearer |
| `GET` | `/api/auditoria` | Bearer; gestor/farmacêutico |

Toda escrita exige autenticação. A dispensação rejeita lote inexistente/vencido, estoque insuficiente e exige confirmação explícita para lotes no limiar vermelho. Thresholds e operações relevantes geram trilha de auditoria.

## Testes

```bash
cd api
pytest -q
```

Os testes usam banco SQLite em memória e não alteram `farmaviva.db`.
