/** Fuso padrão das organizações (configurável por organização na fase 1). */
export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

const dayKey = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone, dateStyle: "short" }).format(date);

/**
 * Horário da última mensagem no estilo do WhatsApp:
 * "Hoje, 14:32" · "Ontem, 09:10" · "12 set, 18:00".
 */
export function formatMessageTime(
  date: Date,
  { now = new Date(), timeZone = DEFAULT_TIME_ZONE } = {},
): string {
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (dayKey(date, timeZone) === dayKey(now, timeZone)) return `Hoje, ${time}`;
  if (dayKey(date, timeZone) === dayKey(yesterday, timeZone)) return `Ontem, ${time}`;

  const day = new Intl.DateTimeFormat("pt-BR", { timeZone, day: "numeric", month: "short" })
    .format(date)
    .replace(" de ", " ")
    .replace(".", "");
  return `${day}, ${time}`;
}

/** "2026-12-20" → "20/12" (datas sem fuso, como check-in/check-out). */
export function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function greeting({ now = new Date(), timeZone = DEFAULT_TIME_ZONE } = {}): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(now),
  );
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function monthLabel({ now = new Date(), timeZone = DEFAULT_TIME_ZONE } = {}): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone, month: "long", year: "numeric" }).format(now);
}
