# 0003 · Integrações por adaptadores

- **Status:** aceita (outubro/2026)

## Contexto

O app depende de serviços externos que vão mudar ao longo do tempo:

- **WhatsApp:** começa só com link `wa.me`. A integração bidirecional vem
  depois.
- **Calendários:** hoje só o Airbnb. Depois o site próprio e, talvez, o
  Booking.
- **Pagamentos:** gateway ainda não escolhido.

## Decisão

O `core` define **portas** (interfaces) e cada provedor é um **adaptador**:

| Porta | Arquivo | Adaptadores |
|---|---|---|
| `MessagingProvider` | `packages/core/src/messaging/ports.ts` | `WaMeLinkProvider` (agora) → WhatsApp Cloud API (fase 4) |
| `CalendarChannel` | `packages/core/src/calendar/ports.ts` | `AirbnbIcalChannel` (fase 2), site próprio (fase 5) |
| `PaymentProvider` | `packages/core/src/payments/ports.ts` | registro manual (fase 3) → Asaas ou Mercado Pago |

**WhatsApp:** quando a integração vier, usar a **API oficial (Cloud API da
Meta)**, direto ou via um provedor oficial (BSP). APIs não oficiais (QR code)
arriscam o banimento do número e não podem ser vendidas a terceiros. A Cloud
API permite coexistência com o app WhatsApp Business no mesmo número.

**Airbnb:** não há API aberta para anfitriões individuais. A sincronização é
por **iCal** nos dois sentidos: importamos o calendário do anúncio e
exportamos um iCal do CRM para o Airbnb bloquear as datas das reservas
diretas. O iCal tem atraso (de minutos a horas), então o CRM sinaliza
conflitos.

**Site de reservas:** consome a API pública do CRM. O CRM é a fonte da verdade
da disponibilidade.

## Consequências

- Trocar ou adicionar um provedor não muda telas nem serviços que usam a
  porta.
- Cada adaptador é testável isoladamente, como o `WaMeLinkProvider` em
  `messaging/wa-me.test.ts`.
- Credenciais de provedores serão por organização (cada cliente do SaaS
  conecta o próprio WhatsApp, Airbnb e gateway), guardadas criptografadas.
