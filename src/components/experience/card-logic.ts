export function buildCompanyMonogram(company: string): string {
  // Stryker disable next-line Regex: whitespace only ever separates words,
  // never appears inside one, so narrowing '+' to a single character just
  // makes a run of N whitespace chars produce (N-1) extra empty-string
  // "words" between the same two real words. word[0] on '' is undefined,
  // and Array.prototype.join('') stringifies undefined as '' — those extra
  // empty slots vanish on join regardless of how many there are. The
  // resulting letter sequence (and thus the sliced/uppercased monogram) is
  // identical either way. Hand-verified: narrowing '+' away here leaves the
  // full experience-card suite passing bit-for-bit.
  const words = company.split(/\s+/);
  return words
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}
