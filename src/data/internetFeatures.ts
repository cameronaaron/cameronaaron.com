export interface InternetFeature {
  title: string;
  organization: string;
  period: string;
  summary: string;
  category: 'Speaking' | 'Media' | 'Research' | 'Profiles';
  url?: string;
}

export const internetFeatures: InternetFeature[] = [
  {
    title: '2e Symposium Speaker Biography',
    organization: '2e Symposium',
    period: '2023',
    summary: 'Speaker and attendee bio page featuring work in neurodiversity and education pathways.',
    category: 'Speaking',
    url: 'https://2esymposium.com/speaker-attendee-biographies-a-f/',
  },
  {
    title: 'Stanford Neurodiversity in Entrepreneurship Summit Speaker Listing',
    organization: 'Stanford NNEA',
    period: '2023',
    summary: 'Speaker listing for the 2023 summit focused on neurodiversity and innovation.',
    category: 'Speaking',
    url: 'https://www.stanfordnnea.com/2023-speakers',
  },
  {
    title: 'Neurodiversity Advocacy Session with Kristin Rourke and Cameron Aaron',
    organization: 'Community Health Worker Program Event',
    period: 'Jun 8, 2023',
    summary: 'Session listed as "Hearing from experienced advocates in neurodiversity"; recording mentioned in source notes.',
    category: 'Speaking',
  },
  {
    title: '4me Welcomes Cameron Aaron',
    organization: 'Xurrent',
    period: '2020',
    summary: 'Featured profile post highlighting professional trajectory and technical leadership.',
    category: 'Media',
    url: 'https://www.xurrent.com/blog/4me-welcomes-cameron-aaron',
  },
  {
    title: 'Internships: By the Dozen',
    organization: 'Connecticut College News',
    period: '2020',
    summary: 'Institutional feature spotlighting internships and project work.',
    category: 'Media',
    url: 'https://www.conncoll.edu/news/news-archive/2020/a-dozen-internships/',
  },
  {
    title: 'Top Emerging Talent Summer 2021',
    organization: 'Pangea',
    period: '2021',
    summary: 'Featured in Pangea Top Emerging Talent cohort listing.',
    category: 'Media',
    url: 'https://www.about.pangea.app/top-emerging-talent/summer-21',
  },
  {
    title: 'Genetic RefleXions: A Magic Mirror That Displays Genetic Info',
    organization: 'Connecticut College',
    period: '2021',
    summary: 'Student research project page for interdisciplinary genomics and human-centered computing work.',
    category: 'Research',
    url: 'https://www.conncoll.edu/academics/internships-student-research/student-research-projects/genetic-reflexions-a-magic-mirror-that-displays-genetic-info-about-the-person-with-their-reflection.html',
  },
  {
    title: 'Journal of Vision Abstract (VSS 2021)',
    organization: 'Journal of Vision',
    period: '2021',
    summary: 'Published abstract on sustained attention and visually-guided movement patterns.',
    category: 'Research',
    url: 'https://doi.org/10.1167/jov.21.9.2719',
  },
  {
    title: 'ResearchGate Profile & Publications Archive',
    organization: 'ResearchGate',
    period: 'Ongoing (publications since 2020)',
    summary: 'Research profile and publications archive: Toxoplasma Gondii Modifies Personality, The Real Magical Girls, and EAS 101 Final Paper.',
    category: 'Research',
    url: 'https://www.researchgate.net/profile/Cameron-Aaron-2',
  },
  {
    title: 'CHW Credential Verification Record',
    organization: 'Parchment',
    period: '2025',
    summary: 'Credential verification page for Community Health Worker (CHW) record.',
    category: 'Profiles',
    url: 'https://www.parchment.com/lp/award/5ed28264-10a0-4798-b16b-f94393e0b7da',
  },
  {
    title: 'LinkedIn Activity Highlight',
    organization: 'LinkedIn',
    period: '2020',
    summary: 'Public LinkedIn activity post connected to early-career work history.',
    category: 'Profiles',
    url: 'https://www.linkedin.com/posts/cameron-aaron-21-is-currently-working-as-share-6657585783760920576-dLcj/',
  },
];
