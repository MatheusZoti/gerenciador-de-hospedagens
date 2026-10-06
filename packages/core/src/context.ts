import { ForbiddenError } from "./shared/errors";

/** Papéis de um membro dentro da organização (plugin `organization` do Better Auth). */
export type MemberRole = "owner" | "admin" | "member";

/**
 * Contexto obrigatório de todo serviço de domínio. É montado no servidor a
 * partir da sessão (nunca a partir de dados enviados pelo cliente) e garante
 * que toda leitura e escrita fique restrita à organização do usuário.
 */
export interface TenantContext {
  organizationId: string;
  userId: string;
  role: MemberRole;
}

/** Donos e administradores alteram configurações, funil e modelos de mensagem. */
export function canManageOrganization(ctx: TenantContext): boolean {
  return ctx.role === "owner" || ctx.role === "admin";
}

export function assertCanManageOrganization(ctx: TenantContext): void {
  if (!canManageOrganization(ctx)) {
    throw new ForbiddenError("Só administradores podem alterar as configurações da organização");
  }
}
