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
