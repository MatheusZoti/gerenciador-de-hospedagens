import { z } from "zod";

// Mensagens de validação padrão em português (ex.: "Pequeno demais: ...").
// Importado por todo módulo que define schemas, antes de usá-los.
z.config(z.locales.ptBR());

export { z };
