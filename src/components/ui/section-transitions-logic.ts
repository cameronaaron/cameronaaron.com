export function getSectionGlowTone(index: number): string {
  return index % 2 === 0
    ? 'from-cyan-400/10 via-primary/12 to-transparent'
    : 'from-emerald-400/10 via-secondary/12 to-transparent';
}
