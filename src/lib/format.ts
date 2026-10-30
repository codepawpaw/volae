const idr = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export function formatPrice(value: number): string {
  return `Rp${idr.format(value)}`;
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
