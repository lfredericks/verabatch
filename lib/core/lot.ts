/**
 * Lot numbers. Spec: product initials, then YYMMDD, then that day's batch count.
 *   "Midnight Garden" on 2026-10-16 -> MG-261016-1, then MG-261016-2
 */

export function productInitials(productName: string): string {
  const letters = productName
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return letters.slice(0, 2) || "XX";
}

/** date as YYYY-MM-DD */
export function lotNumber(productName: string, date: string, existingLots: string[]): string {
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`date must be YYYY-MM-DD, got "${date}"`);
  const prefix = `${productInitials(productName)}-${m[1]!.slice(2)}${m[2]}${m[3]}`;
  const sameDay = existingLots.filter((l) => l.startsWith(prefix + "-"));
  const highest = sameDay.reduce((max, l) => Math.max(max, Number(l.slice(prefix.length + 1)) || 0), 0);
  return `${prefix}-${highest + 1}`;
}
