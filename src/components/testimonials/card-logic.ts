export function getTestimonialCardClass(featured?: boolean): string {
  return `h-full p-6 ${featured ? 'border-purple-500/30' : ''}`;
}

export function getProfileAriaLabel(name: string): string {
  return `Open ${name}'s LinkedIn profile`;
}

export function getCompanyAriaLabel(company: string): string {
  return `Open ${company} website`;
}

export function getOriginalPostAriaLabel(name: string): string {
  return `Open the original post for ${name}`;
}

export function getRelationshipMeta(relationship: string, date: string): string {
  return `${relationship} • ${date}`;
}
