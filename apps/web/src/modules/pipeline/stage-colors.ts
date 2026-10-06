/**
 * Cor de identidade de cada etapa (marcador ao lado do nome — o texto nunca
 * usa a cor da etapa). Strings completas para o Tailwind detectar as classes.
 */
const STAGE_DOT: Record<string, string> = {
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  pink: "bg-pink-500",
  emerald: "bg-emerald-600",
  slate: "bg-slate-400",
};

export function stageDotClass(color: string) {
  return STAGE_DOT[color] ?? STAGE_DOT.slate;
}
