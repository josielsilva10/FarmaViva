# FarmaViva — Front-end (Sprint 1)

Gestão proativa de validade de medicamentos.
Projeto Integrador II — Tecnologia em Sistemas para Internet.

> **Sprint Goal (Sprint 1 / Entrega 2):** Disponibilizar as telas de Cadastro,
> Consulta de Estoque e Alertas Visuais funcionando com dados simulados,
> validando a experiência de uso antes da integração com o back-end.

## Stack

- **React 19** + **Vite** (dev server e build)
- **React Router v7** (roteamento e proteção de rotas)
- CSS puro com tokens (custom properties) — sem framework de UI
- Tipografia: Space Grotesk (display), Inter (texto), JetBrains Mono (dados/lotes)
- Camada de API mockada em `src/services/api.js`, com persistência em
  `localStorage` para simular respostas assíncronas de um back-end real

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`. A tela de login aceita qualquer e-mail/senha
preenchidos (protótipo navegável — RF10/autenticação real fica para a Sprint 2).

```bash
npm run build     # gera a build de produção em /dist
npm run preview   # serve a build de produção localmente
```

## Estrutura de pastas

```
src/
  components/     Sidebar, AppLayout, Modal, Toast, StatusBadge, Icon, etc.
  context/        AuthContext (sessão do usuário)
  data/           mockData.js — dados iniciais (medicamentos, lotes, thresholds)
  pages/          Login, Dashboard, Estoque, Cadastro, Dispensacao
  services/       api.js — única porta de entrada para dados (ver abaixo)
  utils/          validade.js — cálculo de status (VERDE/AMARELO/VERMELHO/EXPIRADO)
```

## Requisitos funcionais cobertos nesta entrega

| RF    | Descrição                                            | Tela                    |
|-------|-------------------------------------------------------|--------------------------|
| RF01  | Cadastrar, alterar e excluir medicamentos             | Cadastro                 |
| RF02  | Consultar estoque com lotes e validades                | Estoque                  |
| RF03  | Alertas visuais por cor (Verde/Amarelo/Vermelho)       | Estoque, Dashboard       |
| RF04  | Dashboard com percentual por faixa de risco            | Dashboard                |
| RF05  | Lógica FEFO na sugestão de lote de saída                | Dispensação               |
| RF06  | Registrar saída de medicamentos                        | Dispensação               |
| RF07  | Validar lote/validade no momento da dispensação         | Dispensação               |
| RF08  | Alerta de bloqueio para lote vencido/próximo do vencimento | Dispensação (modal)   |
| RF12  | Configurar thresholds dos alertas visuais               | Dashboard (modal)        |

RF09 (relatórios), RF10 (API real) e RF11 (refinamento de UI) estão
planejados para as próximas Sprints, conforme o Product Backlog.

## De mock para back-end real

Toda a aplicação conversa com os dados **exclusivamente** através de
`src/services/api.js`. Quando a API REST (RF10) estiver disponível, basta
substituir o corpo de cada função por uma chamada `fetch`, mantendo a mesma
assinatura — nenhuma página ou componente precisa ser alterado. Exemplo:

```js
// antes (mock)
export async function getMedicamentos() {
  return delay(structuredClone(db.medicamentos));
}

// depois (API real)
export async function getMedicamentos() {
  const res = await fetch("/api/medicamentos");
  if (!res.ok) throw new Error("Falha ao carregar medicamentos");
  return res.json();
}
```

## Equipe — Grupo 2 FarmaViva

Dinária · Eloides · Jesuana · Josiel Alexandre · Maria Luiza
