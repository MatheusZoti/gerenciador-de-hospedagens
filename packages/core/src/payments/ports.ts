export type ChargeStatus = "pending" | "paid" | "cancelled" | "expired";

export interface Charge {
  id: string;
  status: ChargeStatus;
  amountCents: number;
  /** Link de pagamento (Pix/cartão), quando o provedor gera um. */
  checkoutUrl?: string;
  /** Código "Pix copia e cola", quando disponível. */
  pixCopyPaste?: string;
}

/**
 * Porta de pagamentos. Fase 3 começa com registro manual; depois um gateway
 * (Asaas ou Mercado Pago) implementa esta interface e confirma pagamentos
 * via webhook.
 */
export interface PaymentProvider {
  readonly id: string;
  createCharge(input: {
    amountCents: number;
    description: string;
    dueDate: string;
    externalReference: string;
    customer: { name: string; email?: string; phone?: string };
  }): Promise<Charge>;
  getCharge(id: string): Promise<Charge>;
}
