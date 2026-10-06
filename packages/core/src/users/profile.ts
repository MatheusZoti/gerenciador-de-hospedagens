import { z } from "../shared/zod";

/**
 * Dados editáveis do perfil (o usuário é global, não pertence a um tenant).
 * A gravação é feita pelo Better Auth no app web.
 */
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  jobTitle: z
    .string()
    .trim()
    .max(80)
    .nullish()
    .transform((value) => value || null),
});

export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
