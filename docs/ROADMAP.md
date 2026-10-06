# Roadmap

Entregas em fases curtas. Cada fase deixa o app utilizável no dia a dia. A
ordem prioriza o que gera venda (funil) antes do que organiza a operação
(reservas, financeiro) e, por último, o que transforma o app em produto (SaaS).

Legenda: ✅ feito · 🔜 próxima · ⬜ planejada

---

## ✅ Fase 0 · Fundação

- [x] Monorepo pnpm + Turborepo, TypeScript strict, Biome
- [x] `packages/db`: schema Drizzle (identidade e tenancy, imóveis, funil,
      leads, atividades) e a migration inicial
- [x] `packages/core`: `TenantContext`, serviços de funil, leads e imóveis,
      portas de mensageria, calendário e pagamentos, `WaMeLinkProvider`
- [x] Better Auth (e-mail e senha) + plugin `organization`; o cadastro cria a
      organização e o funil padrão
- [x] Layout com menu lateral (10 itens, recolhível, responsivo)
- [x] Dashboard: resumo do funil, prévia do Kanban com botão de WhatsApp e
      cards do financeiro (estado "em breve")
- [x] Kanban completo (somente leitura) e páginas dos próximos módulos
- [x] Seed de demonstração, testes de isolamento entre tenants, CI

## 🔜 Fase 1 · MVP do funil

Objetivo: usar o CRM de verdade para acompanhar todos os leads. Entregue em
3 blocos (um PR cada).

**Bloco 1 ✅: imóveis, leads e Kanban**

- [x] Cadastro, edição e ativação/desativação de **imóveis**
      (`/configuracoes/imoveis`)
- [x] **Leads**: lista com busca (nome, e-mail, telefone) e filtros por URL,
      criar/editar, ficha completa com aniversário, excluir, linha do tempo
      de atividades com notas
- [x] **Kanban** com arrastar e soltar (dnd-kit: mouse, toque e teclado):
      mover etapa e reordenar, registrando `stage_changed` na linha do tempo
- [x] "Registrar conversa agora" atualiza a última mensagem (até a fase 4)

**Bloco 2: configurações, modelos de mensagem e perfil**

- [ ] **Modelos de mensagem** do WhatsApp por etapa (com variáveis: nome,
      imóvel, datas)
- [ ] **Configurações**: nome e fuso da organização, etapas do funil
- [ ] **Perfil**: foto (Cloudflare R2), nome, cargo

**Bloco 3: API pública e testes E2E**

- [ ] Ganho rápido: `POST /api/public/v1/leads` com chave de API, para o botão
      de WhatsApp do site WordPress registrar o lead antes de abrir o `wa.me`
- [ ] Testes E2E (Playwright) dos fluxos principais na CI
- [ ] Sentry (quando houver conta e DSN)

## ⬜ Fase 2 · Reservas e calendário

- [ ] Tabelas `reservation` e `calendar_feed`
- [ ] Calendário por imóvel (mês e linha do tempo)
- [ ] `AirbnbIcalChannel`: importação do iCal a cada 15 min (Inngest), com
      deduplicação por UID
- [ ] **Exportação de iCal** por imóvel (`/ical/<token>.ics`), para o Airbnb
      bloquear as datas das reservas diretas
- [ ] Converter lead em reserva (`hold` → `confirmed`) e detectar conflitos
- [ ] Indicadores de ocupação no dashboard

## ⬜ Fase 3 · Financeiro

- [ ] Tabela `transaction` (receitas e despesas, competência, vencimento,
      pagamento)
- [ ] Sinal e saldo gerados a partir da reserva; registro manual de Pix
- [ ] Faturamento do mês, recebidos e a receber **reais** no dashboard
- [ ] Despesas por imóvel e repasses do Airbnb
- [ ] Escolher o gateway (Asaas ou Mercado Pago) e implementar o
      `PaymentProvider`: link de Pix e baixa automática via webhook

## ⬜ Fase 4 · Conversas (WhatsApp oficial)

- [ ] Conta na WhatsApp Cloud API (Meta), com coexistência com o app
      WhatsApp Business no mesmo número
- [ ] Webhook de mensagens recebidas: cria ou atualiza o lead pelo telefone e
      atualiza `last_message_at`
- [ ] Caixa de entrada em `/conversas`: responder pelo app, enviar modelos
      aprovados
- [ ] Tempo real na UI (SSE ou serviço de pub/sub)

## ⬜ Fase 5 · Site novo com motor de reservas

- [ ] `apps/site` (Next.js) no monorepo, com componentes compartilhados em
      `packages/ui`
- [ ] API pública: disponibilidade, cotação e pedido de reserva (vira lead +
      reserva `hold`)
- [ ] Pagamento online do sinal pelo `PaymentProvider`
- [ ] SEO, páginas por imóvel, multi-idioma se fizer sentido

## ⬜ Fase 6 · Campanhas e relatórios

- [ ] Segmentos (etapa, origem, imóvel, período, histórico de estadias)
- [ ] Disparo por modelos aprovados, com limite e opt-out
- [ ] Relatórios: conversão por etapa e origem, ocupação, ADR, RevPAR,
      receita por imóvel e canal

## ⬜ Fase 7 · SaaS

- [ ] Onboarding self-service (assistente: imóveis, funil, WhatsApp, Airbnb)
- [ ] Planos, limites e cobrança da assinatura (Stripe ou Asaas)
- [ ] Convites de membros e papéis (plugin `organization` já instalado)
- [ ] Row Level Security no Postgres como segunda camada de isolamento
- [ ] Painel de administração interno, `audit_log`, LGPD (exportar e excluir)
- [ ] Domínio próprio / white-label do site de reservas por cliente
