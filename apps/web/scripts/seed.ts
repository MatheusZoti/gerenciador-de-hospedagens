/**
 * Dados de demonstração: uma conta, 2 imóveis e 10 leads espalhados pelo funil.
 * A conta é criada pelo mesmo fluxo de cadastro do app (Better Auth), então
 * a organização e as etapas padrão nascem pelos hooks reais.
 *
 *   pnpm db:seed            # cria (ou avisa se já existe)
 *   pnpm db:seed --reset    # apaga a conta demo e recria
 */
import {
  type CreateLeadInput,
  createLead,
  createProperty,
  listStages,
  type TenantContext,
} from "@hospedagens/core";
import { getDb, member, organization, user } from "@hospedagens/db";
import { eq, inArray } from "drizzle-orm";
import { auth } from "../src/lib/auth";

const DEMO = {
  name: "Matheus Zoti",
  email: "demo@hospedagens.dev",
  password: "demo12345",
  jobTitle: "Gestão de hospedagens",
};

const db = getDb();
const now = Date.now();
const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000);
const inDays = (days: number) => new Date(now + days * 86_400_000).toISOString().slice(0, 10);
/** Telefones fictícios (faixa 90000-00xx) para não abrir conversa com alguém real. */
const fakePhone = (ddd: number, n: number) => `(${ddd}) 90000-${String(n).padStart(4, "0")}`;

async function removeDemoAccount() {
  const [existing] = await db.select().from(user).where(eq(user.email, DEMO.email));
  if (!existing) return;
  const memberships = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, existing.id));
  const organizationIds = memberships.map((row) => row.organizationId);
  if (organizationIds.length) {
    await db.delete(organization).where(inArray(organization.id, organizationIds));
  }
  await db.delete(user).where(eq(user.id, existing.id));
}

async function main() {
  if (process.argv.includes("--reset")) await removeDemoAccount();

  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, DEMO.email));
  if (existing) {
    console.log(`Conta demo já existe (${DEMO.email}). Use --reset para recriar.`);
    return;
  }

  const { user: created } = await auth.api.signUpEmail({
    body: { name: DEMO.name, email: DEMO.email, password: DEMO.password },
  });
  await db.update(user).set({ jobTitle: DEMO.jobTitle }).where(eq(user.id, created.id));

  const [membership] = await db.select().from(member).where(eq(member.userId, created.id));
  if (!membership) throw new Error("Organização não foi criada no cadastro");
  const ctx: TenantContext = {
    organizationId: membership.organizationId,
    userId: created.id,
    role: "owner",
  };

  const casa = await createProperty(db, ctx, {
    name: "Casa Pé na Areia",
    city: "Ubatuba",
    maxGuests: 8,
    bedrooms: 3,
    basePriceCents: 65_000,
  });
  const chale = await createProperty(db, ctx, {
    name: "Chalé Vista da Serra",
    city: "Campos do Jordão",
    maxGuests: 4,
    bedrooms: 2,
    basePriceCents: 48_000,
  });

  const [novo, conversa, pronto, pagamento, fechado, perdido] = await listStages(db, ctx);
  const leads: Array<CreateLeadInput & { minutesAgo: number }> = [
    {
      name: "Ana Beatriz Souza",
      stageId: novo?.id,
      propertyOfInterestId: casa.id,
      minutesAgo: 25,
      desiredCheckIn: inDays(40),
      desiredCheckOut: inDays(45),
      guests: 6,
    },
    {
      name: "Rafael Lima",
      stageId: novo?.id,
      propertyOfInterestId: chale.id,
      source: "instagram",
      minutesAgo: 180,
    },
    { name: "Juliana Castro", stageId: novo?.id, source: "site", minutesAgo: 26 * 60 },
    {
      name: "Carlos Eduardo Pereira",
      stageId: conversa?.id,
      propertyOfInterestId: casa.id,
      minutesAgo: 50,
      desiredCheckIn: inDays(20),
      desiredCheckOut: inDays(24),
      guests: 8,
    },
    {
      name: "Fernanda Rocha",
      stageId: conversa?.id,
      propertyOfInterestId: chale.id,
      minutesAgo: 5 * 60,
      guests: 2,
    },
    {
      name: "Lucas Martins",
      stageId: pronto?.id,
      propertyOfInterestId: chale.id,
      minutesAgo: 120,
      desiredCheckIn: inDays(12),
      desiredCheckOut: inDays(15),
      guests: 3,
    },
    {
      name: "Patrícia Gomes",
      stageId: pagamento?.id,
      propertyOfInterestId: casa.id,
      minutesAgo: 22 * 60,
      desiredCheckIn: inDays(9),
      desiredCheckOut: inDays(13),
      guests: 5,
    },
    {
      name: "Bruno Carvalho",
      stageId: pagamento?.id,
      propertyOfInterestId: casa.id,
      source: "indicacao",
      minutesAgo: 3 * 24 * 60,
    },
    {
      name: "Mariana Alves",
      stageId: fechado?.id,
      propertyOfInterestId: chale.id,
      minutesAgo: 6 * 24 * 60,
    },
    {
      name: "Diego Fernandes",
      stageId: perdido?.id,
      propertyOfInterestId: casa.id,
      minutesAgo: 12 * 24 * 60,
    },
  ];

  // Do mais antigo para o mais recente: o lead mais recente fica no topo da coluna.
  leads.sort((a, b) => b.minutesAgo - a.minutesAgo);
  for (const [index, { minutesAgo: ago, ...lead }] of leads.entries()) {
    await createLead(db, ctx, {
      ...lead,
      phone: fakePhone(11, index + 1),
      lastMessageAt: minutesAgo(ago),
    });
  }

  console.log("✓ Seed aplicado");
  console.log(`  Login: ${DEMO.email}`);
  console.log(`  Senha: ${DEMO.password}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
