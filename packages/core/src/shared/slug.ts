/** "Chalé Vista da Serra" → "chale-vista-da-serra" */
export function slugify(value: string, maxLength = 48): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

export function randomSuffix(length = 6): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, length);
}
