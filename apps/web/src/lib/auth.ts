import {
  bootstrapOrganization,
  createDefaultPipelineStages,
  defaultOrganizationName,
} from "@hospedagens/core";
import { getDb, member, session } from "@hospedagens/db";
import * as schema from "@hospedagens/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { asc, eq } from "drizzle-orm";

const db = getDb();

export const auth = betterAuth({
  appName: "Hospedagens CRM",
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      jobTitle: { type: "string", required: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Roda depois do commit do cadastro: cria o tenant do novo usuário e
        // o define como organização ativa da sessão aberta no cadastro.
        after: async (createdUser) => {
          const { organizationId } = await bootstrapOrganization(db, {
            userId: createdUser.id,
            name: defaultOrganizationName(createdUser.name),
          });
          await db
            .update(session)
            .set({ activeOrganizationId: organizationId })
            .where(eq(session.userId, createdUser.id));
        },
      },
    },
    session: {
      create: {
        // A cada login, abre a sessão já na primeira organização do usuário.
        before: async (newSession) => {
          const [membership] = await db
            .select({ organizationId: member.organizationId })
            .from(member)
            .where(eq(member.userId, newSession.userId))
            .orderBy(asc(member.createdAt))
            .limit(1);
          return {
            data: { ...newSession, activeOrganizationId: membership?.organizationId ?? null },
          };
        },
      },
    },
  },
  plugins: [
    organization({
      organizationHooks: {
        // Organizações criadas pela API do plugin (ex.: convite futuro de
        // "nova organização") também nascem com o funil padrão.
        afterCreateOrganization: async ({ organization: created }) => {
          await createDefaultPipelineStages(db, created.id);
        },
      },
    }),
    // Precisa ser o último plugin: grava cookies a partir de Server Actions.
    nextCookies(),
  ],
});

export type Auth = typeof auth;
