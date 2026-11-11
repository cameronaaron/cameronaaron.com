export interface HeroDiscipline {
  name: string;
  title: string;
  description: string;
  href: string;
  action: string;
}

/** The four entry points use existing portfolio sections, not a second content tree. */
export const HERO_DISCIPLINES: readonly HeroDiscipline[] = [
  { name: 'Engineering', title: 'Ideas into interfaces.', description: 'Software engineering shaped by curiosity, clarity, and the people using it.', href: '#experience', action: 'Explore my experience' },
  { name: 'Security', title: 'Curiosity with a purpose.', description: 'Security research and a habit of asking how things work — and how they could work better.', href: '#projects', action: 'Explore the research' },
  { name: 'Clinical care', title: 'People at the center.', description: 'Emergency care, aerospace medicine, and clinical experience grounded in human connection.', href: '#certifications', action: 'View clinical credentials' },
  { name: 'NP path', title: 'Always becoming.', description: 'Building on a foundation in healthcare and education while preparing for Nurse Practitioner training.', href: '#education', action: 'Follow the learning journey' },
];

export interface HeroNameParts {
  givenName: string;
  familyName: string;
  credentials: string;
}

/**
 * Split a display name such as "Cameron Aaron, M.Ed." into the two lines the
 * hero sets large and the post-nominals it sets small beside the surname. The
 * comma belongs to neither: it only separates the name from the credentials.
 */
export function splitHeroName(fullName: string): HeroNameParts {
  // split() always yields at least one element, so only the surname can be absent.
  const [givenName, familyName = '', ...credentials] = fullName.split(' ');
  return {
    givenName,
    familyName: familyName.replace(',', ''),
    credentials: credentials.join(' '),
  };
}
