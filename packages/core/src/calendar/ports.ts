/** Reserva/bloqueio lido de um canal externo (ex.: evento do iCal do Airbnb). */
export interface ExternalBooking {
  /** UID estável do evento no canal — usado para deduplicar na sincronização. */
  externalUid: string;
  /** Datas no formato `YYYY-MM-DD`; `checkOut` é exclusivo (dia da saída). */
  checkIn: string;
  checkOut: string;
  summary?: string;
}

/**
 * Porta de calendário por canal. Fase 2: `AirbnbIcalChannel` (importa o iCal
 * do anúncio). Depois: Booking.com e o site próprio.
 */
export interface CalendarChannel {
  readonly channel: "airbnb" | "booking" | "site";
  fetchBookings(feedUrl: string): Promise<ExternalBooking[]>;
}
