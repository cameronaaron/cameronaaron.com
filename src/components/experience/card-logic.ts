export function buildCompanyMonogram(company: string): string {
  return company
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}
