# FarmaViva — Gestão Proativa de Validade de Medicamentos

Projeto Integrador II — Tecnologia em Sistemas para Internet. Aplicação React com API REST autenticada para gestão de medicamentos, lotes, alertas de validade, dashboard e dispensação FEFO.

## Tecnologias

### Front-end
- React 19, Vite 8 e React Router 7;
- CSS próprio com tokens visuais e componentes reutilizáveis;
- cliente HTTP central em `src/services/api.js`, autenticação bearer e estados de carregamento/erro/vazio;
- Vitest, jsdom e React Testing Library para testes de componentes.

### Back-end
- Python 3.11+, FastAPI e Uvicorn;
- SQLAlchemy 2 e SQLite (configurável por `DATABASE_URL`);
- Pydantic para validação de payloads;
- JWT com expiração e hash de senhas Argon2;
- pytest e HTTPX para testes automatizados.

SQLite foi escolhido para permitir executar o MVP localmente sem serviço adicional de banco. A camada ORM permite configurar outro banco suportado pelo SQLAlchemy para ambientes futuros.

## Repositório e versão

O repositório remoto já existente do grupo foi reaproveitado: [github.com/josielsilva10/FarmaViva](https://github.com/josielsilva10/FarmaViva). O trabalho foi versionado localmente na branch `feat/api-ui-sprint-2` (commit `9979609` e commit de documentação subsequente); a integração front/back ocorre dentro do mesmo projeto, sem duplicar o repositório. A tentativa de publicar a branch foi recusada pelo GitHub com HTTP 403 (permissão de escrita indisponível na credencial desta sessão); nenhuma alteração foi mesclada em `main`. Para publicar, a conta/credencial precisa de acesso de escrita a esse repositório.

## Executar localmente

1. API, em um terminal:

```bash
cd api
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env             # altere JWT_SECRET_KEY e senhas antes de uso externo
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2. UI, em outro terminal, na raiz do repositório:

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`. O Vite encaminha `/api` para `http://localhost:8000`. A documentação interativa está em `http://localhost:8000/docs`; a verificação de saúde em `/health`.

Contas de demonstração criadas no primeiro start (senha padrão `FarmaViva123!`):
- farmacêutica: `ana.farmaceutica@farmaviva.com.br`;
- gestor: `gestor@farmaviva.local`;
- auxiliar: `auxiliar@farmaviva.local`.

**Essas credenciais e o segredo de desenvolvimento não são para produção.** Configure valores próprios no arquivo local `api/.env`, que não deve ser versionado. O banco demo `api/farmaviva.db` também fica fora do Git.

## Testes e qualidade

```bash
# Front-end (na raiz)
npm test
npm run lint
npm run build

# Back-end
cd api
.venv/bin/pytest -q
```

## Organização principal

```text
api/
  app/             FastAPI, SQLAlchemy, schemas, autenticação e regras de domínio
  tests/           testes de integração da API
src/
  components/      componentes compartilhados e teste de StatusBadge
  context/         sessão do usuário e autenticação
  pages/           login, dashboard, estoque, cadastro e dispensação
  services/api.js  única camada HTTP consumida pelas telas
  utils/           regras e apresentação de validade
```

## Escopo implementado — Sprint 2

A API fornece autenticação, CRUD de medicamentos e lotes, busca/filtros por validade, configuração de thresholds, dashboard, relatório, auditoria e dispensação com validação server-side e FEFO. A interface consome a API real nas telas de login, estoque, cadastro, dashboard e dispensação; mantém feedback de carregamento, erro, vazio e sucesso.

Veja a matriz de tarefas/evidências em [`docs/artefatos-entrega-2.md`](docs/artefatos-entrega-2.md) e os detalhes de endpoints em [`api/README.md`](api/README.md).

## Equipe — Grupo 2 FarmaViva

Dinária · Eloides · Jesuana · Josiel Alexandre · Maria Luiza
