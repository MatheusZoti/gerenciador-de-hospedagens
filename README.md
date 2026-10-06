# Gerenciador de Hospedagens

CRM para gestão de hospedagens por temporada. Concentra o funil de vendas do
WhatsApp, as reservas (Airbnb e diretas), o financeiro, as campanhas e os
relatórios. Começa como ferramenta interna e foi arquitetado para virar SaaS
(multi-tenant desde o primeiro dia).

> **Status:** fase 0 (fundação) concluída. Veja o [roadmap](./docs/ROADMAP.md).

## Stack

TypeScript · Next.js (App Router) · Tailwind + shadcn/ui · PostgreSQL + Drizzle ·
Better Auth (organizações) · pnpm + Turborepo · Biome · Vitest

Os detalhes e o porquê de cada escolha estão em
[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) e
[docs/adr](./docs/adr).

## Rodando localmente

Requisitos: **Node 22+**, **pnpm 10+** e **Docker** (ou um Postgres 16 local).

```bash
pnpm install
cp .env.example .env                 # gere BETTER_AUTH_SECRET: openssl rand -base64 32
docker compose up -d db              # Postgres em localhost:5432
pnpm db:migrate                      # cria as tabelas
pnpm db:seed                         # conta demo + imóveis + leads de exemplo
pnpm dev                             # http://localhost:3000
```

Login de demonstração: `demo@hospedagens.dev` / `demo12345`. Também dá para
criar uma conta nova em `/cadastro`: a organização e o funil padrão são
criados automaticamente.

## Scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` | App em modo desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm lint` / `pnpm format` | Biome: checa / corrige lint e formatação |
| `pnpm typecheck` | TypeScript em todos os pacotes |
| `pnpm test` | Testes (Vitest + PGlite, sem precisar de Postgres) |
| `pnpm db:generate` | Gera migration SQL a partir do schema |
| `pnpm db:migrate` | Aplica as migrations no `DATABASE_URL` |
| `pnpm db:seed` | Dados de demonstração (`pnpm db:seed --reset` para recriar) |
| `pnpm db:studio` | Drizzle Studio para inspecionar o banco |

## Estrutura

```
apps/web            CRM (Next.js): páginas, layout, Server Actions
packages/core       regras de negócio, independentes de framework
packages/db         schema Drizzle, migrations, client
packages/config     tsconfig compartilhado
docs/               arquitetura, roadmap, modelo de dados, ADRs
```

## Documentação

- [Arquitetura](./docs/ARCHITECTURE.md): princípios, camadas, multi-tenancy,
  integrações
- [Roadmap](./docs/ROADMAP.md): fases e próximos passos
- [Modelo de dados](./docs/DATA-MODEL.md): tabelas atuais e planejadas,
  definições das métricas
- [Decisões (ADRs)](./docs/adr)
