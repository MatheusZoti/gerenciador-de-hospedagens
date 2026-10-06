import { describe, expect, it } from "vitest";
import {
  composeLeadMessage,
  DEFAULT_TEMPLATE_BODY,
  pickTemplate,
  renderTemplate,
  unknownTemplateVariables,
} from "./templates";

describe("renderTemplate", () => {
  it("preenche as variáveis", () => {
    expect(
      renderTemplate("Olá, {primeiro_nome}! Imóvel: {imovel}.", {
        primeiro_nome: "Ana",
        imovel: "Casa Azul",
      }),
    ).toBe("Olá, Ana! Imóvel: Casa Azul.");
  });

  it("remove variáveis vazias e limpa espaços antes da pontuação", () => {
    expect(
      renderTemplate("Sobre a hospedagem {imovel}. Para {hospedes} pessoas!", { hospedes: 4 }),
    ).toBe("Sobre a hospedagem. Para 4 pessoas!");
  });

  it("mantém quebras de linha e variáveis desconhecidas", () => {
    expect(renderTemplate("Oi {nome}\n\nCódigo {pix}", { nome: "Bia" })).toBe(
      "Oi Bia\n\nCódigo {pix}",
    );
  });
});

describe("unknownTemplateVariables", () => {
  it("lista variáveis que não existem, sem repetir", () => {
    expect(unknownTemplateVariables("{nome} {nomee} {pix} {nomee}")).toEqual(["nomee", "pix"]);
    expect(unknownTemplateVariables(DEFAULT_TEMPLATE_BODY)).toEqual([]);
  });
});

describe("composeLeadMessage", () => {
  it("monta a mensagem com primeiro nome, datas curtas e organização", () => {
    const body =
      "Oi {primeiro_nome}! Reserva de {checkin} a {checkout} para {hospedes} na {imovel}. {organizacao}";
    expect(
      composeLeadMessage(
        body,
        {
          name: " Ana Beatriz Souza ",
          propertyName: "Casa Pé na Areia",
          desiredCheckIn: "2026-11-15",
          desiredCheckOut: "2026-11-20",
          guests: 4,
        },
        { organizationName: "Hospedagens da Ana" },
      ),
    ).toBe("Oi Ana! Reserva de 15/11 a 20/11 para 4 na Casa Pé na Areia. Hospedagens da Ana");
  });
});

describe("pickTemplate", () => {
  it("usa o modelo da etapa ou o padrão", () => {
    const templates = { defaultBody: "padrão", byStage: { s1: "da etapa" } };
    expect(pickTemplate(templates, "s1")).toBe("da etapa");
    expect(pickTemplate(templates, "s2")).toBe("padrão");
  });
});
