# 0002 · Multi-tenancy

- **Status:** aceita (outubro/2026)

## Contexto

Hoje há um único anfitrião, mas o objetivo é vender o app para outros. Separar
dados por cliente depois que o app existe costuma exigir reescrever todas as
queries.

## Decisão

- **Banco compartilhado, schema compartilhado**, com coluna `organization_id`
  em toda tabela de negócio e índices começando por ela.
- A entidade tenant é a `organization` do Better Auth. Usuários se ligam a
  ela por `member`, com papel.
- Todo serviço do `@hospedagens/core` recebe um `TenantContext`
  (`organizationId`, `userId`, `role`) montado **no servidor** a partir da
  sessão (`requireAppSession`), nunca a partir de dados do cliente.
- Referências entre entidades (etapa do lead, imóvel de interesse) são
  validadas contra o tenant antes de gravar.
- **Antes de abrir para clientes externos (fase 7):** ativar Row Level
  Security no Postgres (`SET app.organization_id` por transação) como segunda
  barreira.

## Alternativas consideradas

- **Um banco ou schema por cliente:** isolamento forte, mas migrations,
  conexões e custos multiplicam por cliente. Faz sentido só para clientes
  enterprise com exigência contratual.
- **Adiar a multi-tenancy:** mais rápido hoje, porém exigiria tocar em todas
  as queries e tabelas depois.

## Consequências

- O cadastro sempre cria uma organização (`bootstrapOrganization`), mesmo para
  uso individual.
- Toda nova tabela de negócio precisa de `organization_id` e todo novo serviço
  precisa de `ctx`. Isso está documentado no `CLAUDE.md` e coberto pelos
  testes de isolamento (`packages/core/src/tenancy.test.ts`).
- Dá para ter a mesma pessoa em várias organizações (ex.: uma gestora que
  atende vários proprietários) sem mudança de modelo.
