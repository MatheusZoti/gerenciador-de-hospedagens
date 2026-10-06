# 0001 · Stack

- **Status:** aceita (outubro/2026)

## Contexto

Uma pessoa desenvolvendo, começando como ferramenta interna e com intenção de
vender como SaaS. Precisamos de produtividade alta agora, de custo de operação
baixo e de nada que obrigue a reescrever o app quando houver clientes.

## Decisão

| Camada | Escolha |
|---|---|
| Linguagem | TypeScript (strict) em tudo |
| Monorepo | pnpm workspaces + Turborepo |
| App | Next.js (App Router, Server Components, Server Actions) |
| UI | Tailwind CSS v4 + componentes no padrão shadcn/ui (Radix), lucide-react |
| Validação | Zod (compartilhado entre formulário, serviço e API) |
| Banco | PostgreSQL: Neon em produção (região São Paulo), Postgres local no desenvolvimento |
| ORM | Drizzle ORM + drizzle-kit (migrations SQL versionadas) |
| Auth | Better Auth + plugin `organization` |
| Jobs | Inngest (a partir da fase 2) |
| Arquivos | Cloudflare R2 (S3 compatível) |
| Qualidade | Biome (lint + format), Vitest (+ PGlite para testes com banco), Playwright (E2E) |
| Deploy | Vercel (`gru1`) + Neon |

## Alternativas consideradas

- **Supabase (Auth + DB + Storage + Realtime):** acelera o início, mas o
  modelo de organizações e papéis teria de ser feito à mão, e o app fica
  acoplado ao provedor. Continua sendo uma opção apenas como host do Postgres.
- **Prisma:** maduro, mas mais pesado em runtime e menos próximo do SQL. O
  Drizzle facilita queries de relatório e RLS.
- **Clerk / Auth0:** organizações prontas, mas com custo por usuário ativo
  (ruim para SaaS de ticket baixo) e dados de usuário fora do nosso banco.
- **Backend separado (NestJS, Fastify):** mais peças para operar sem ganho
  agora. O `core` independente de framework mantém essa porta aberta.

## Consequências

- Um único deploy (Vercel) e um único banco para operar.
- Os pacotes internos são TypeScript fonte (sem build), transpilados pelo Next
  (`transpilePackages`) e pelo `tsx` nos scripts.
- O `.env` fica na raiz e é lido pelo Next (`next.config.ts`), pelo
  drizzle-kit e pelos scripts.
- Next.js e Better Auth evoluem rápido: as versões ficam fixadas no
  `package.json` e são atualizadas de propósito, com a CI verde.
