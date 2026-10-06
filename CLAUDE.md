# CLAUDE.md

Guia rápido para quem (pessoa ou agente) for mexer neste repositório. O
contexto completo está em `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` e
`docs/DATA-MODEL.md`.

## Comandos

```bash
pnpm install
pnpm lint            # Biome (lint + formato); pnpm format corrige
pnpm typecheck       # tsc em todos os pacotes (web roda next typegen antes)
pnpm test            # Vitest + PGlite (não precisa de Postgres)
pnpm build           # build do Next (precisa de DATABASE_URL definida)
pnpm db:generate     # gera migration a partir do schema; revise o SQL
pnpm db:migrate      # aplica migrations no DATABASE_URL do .env da raiz
pnpm db:seed         # conta demo: demo@hospedagens.dev / demo12345 (--reset recria)
pnpm dev             # http://localhost:3000
```

Antes de commitar: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Regras de arquitetura (não negociáveis)

1. **Tenant sempre.** Toda tabela de negócio tem `organization_id` com índice.
   Todo serviço do `core` recebe `(db, ctx: TenantContext, ...)` e filtra por
   `ctx.organizationId`. IDs vindos do cliente (etapa, imóvel, lead) são
   validados contra o tenant antes de usar.
2. **O `ctx` vem do servidor.** Em páginas e Server Actions use
   `requireAppSession()` (`apps/web/src/lib/session.ts`). Nunca aceite
   `organizationId` do cliente.
3. **Dependências em uma direção:** `apps/web` → `@hospedagens/core` →
   `@hospedagens/db`. O `core` não importa `next`, `react` nem `better-auth`.
4. **Regra de negócio no `core`**, validada com Zod. A UI só orquestra.
5. **Integrações por portas** (`MessagingProvider`, `CalendarChannel`,
   `PaymentProvider`). Não chame APIs externas direto de páginas.
6. **Schema mudou → migration nova** (`pnpm db:generate`). A CI falha se o
   schema e as migrations divergirem. Nunca edite migrations já aplicadas.
7. **Novo serviço com dados → teste de isolamento** no estilo de
   `packages/core/src/tenancy.test.ts`.

## Padrões do app web

- **Fronteira cliente/servidor:** componentes `"use client"` nunca importam
  valores de `@hospedagens/core` ou `@hospedagens/db` (só `import type`), pois
  isso levaria o driver do Postgres para o navegador. Dados prontos para
  exibir são montados no servidor (ex.: `modules/pipeline/kanban-data.ts`).
- **Server Actions** ficam em `apps/web/src/modules/<modulo>/actions.ts`:
  `requireAppSession()` → serviço do `core` → `revalidatePath`. Erros
  esperados viram `ActionState` com `toActionError` (`lib/actions.ts`); o
  tipo `ActionState` vem de `lib/action-state.ts` (seguro para o cliente).
- **Formulários:** `useActionState` + `onSubmit` com `startTransition` (não
  `action={...}`), para não perder o que foi digitado quando a validação
  falha. Campos via `FormField` + `fieldProps` (`components/form-field.tsx`).
  Leitura do FormData com `lib/form.ts` ("" vira `null` = limpar).
- **Filtros de lista** são formulários GET (estado na URL, funciona sem JS).

## Convenções

- **Idioma:** código (identificadores) em inglês. Textos de interface,
  rotas (`/financeiro`, `/configuracoes`), comentários e docs em português.
- **Dinheiro** em centavos (`integer`), BRL. Formate com `formatCurrency`.
- **Datas:** estadia em `date` (`YYYY-MM-DD`), momentos em `timestamptz`.
  Exiba no fuso da organização (padrão `America/Sao_Paulo`, ver
  `apps/web/src/lib/format.ts`). Nunca dependa do fuso do servidor.
- **Telefones** normalizados com `normalizePhone` (E.164 sem `+`).
- **UI:** componentes em `apps/web/src/components/ui` no padrão shadcn/ui
  (Radix + Tailwind + `cn`). A CLI do shadcn pode ser usada quando houver
  rede. Componentes de módulo ficam em `apps/web/src/modules/<modulo>/components`.
- **Cores de etapa:** paleta categórica validada para daltonismo
  (`DEFAULT_PIPELINE_STAGES`). A cor sempre acompanha o nome da etapa; o texto
  nunca usa a cor da etapa.
- **Env:** `.env` único na raiz; o `next.config.ts` e os scripts o carregam.
- **Commits:** mensagens em português, no imperativo, descrevendo o porquê.

## Onde fica cada coisa

| Preciso de... | Arquivo |
|---|---|
| Config do Better Auth / hooks de cadastro | `apps/web/src/lib/auth.ts` |
| Sessão + tenant em páginas | `apps/web/src/lib/session.ts` |
| Itens do menu lateral | `apps/web/src/components/layout/nav-items.ts` |
| Tabelas | `packages/db/src/schema/*.ts` |
| Banco de teste em memória | `packages/db/src/testing.ts` (`createTestDb`) |
| Funil padrão | `packages/core/src/pipeline/defaults.ts` |
| Link do WhatsApp | `packages/core/src/messaging/wa-me.ts` |
| Dados de demonstração | `apps/web/scripts/seed.ts` |
