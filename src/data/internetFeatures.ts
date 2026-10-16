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
    title: 'Stanford Neurodiversity Summit 2021 — K-12 Panel 1: "Neurodivergent Student Panel"',
    organization: 'Stanford Neurodiversity Project',
    period: '2021',
    summary: 'Panelist alongside Ryan Neale, Cynthia Wen, and Martika Theis on the K-12 neurodivergent student panel.',
    category: 'Speaking',
    url: 'https://med.stanford.edu/neurodiversity/SNS2021/program.html',
  },
  {
    title: '2e Symposium Speaker Biography',
    organization: 'Bridges 2e Center — Vision & Leadership 2e Symposium',
    period: 'Oct 2019',
    summary: 'Speaker biography for the 2019 Vision & Leadership 2e Symposium in Los Angeles, hosted by the Bridges 2e Center for Research and Professional Development.',
    category: 'Speaking',
    url: 'https://2esymposium.com/speaker-attendee-biographies-a-f/',
  },
  {
    title: 'Panel on Special Education for Neurodiverse Students',
    organization: 'Stanford NNEA Monthly Speaker Series',
    period: 'Apr 14, 2022',
    summary: 'Panelist alongside John Honerkamp, Jen Wilger, Yvonne Curic, and Martika Theis.',
    category: 'Speaking',
    url: 'https://sites.google.com/stanford.edu/nnea/home/monthly-speaker-meetings',
  },
  {
    title: 'Neurodiversity Advocacy Session with Kristin Rourke and Cameron Aaron',
    organization: 'Stanford NNEA Monthly Speaker Series',
    period: 'Jun 8, 2023',
    summary: 'Featured speakers for "Hearing from experienced advocates in neurodiversity," a recorded session of Stanford NNEA\'s monthly speaker series.',
    category: 'Speaking',
    url: 'https://www.stanfordnnea.com/2023-speakers',
  },
  {
    title: '4me Welcomes Cameron Aaron',
    organization: 'Xurrent',
    period: '2023',
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
    title: 'Medium Profile & Writing Archive',
    organization: 'Medium',
    period: 'Ongoing (writing since 2020)',
    summary: 'Personal essay and coursework-writing archive, including "Creating the Perfect Fit: Turning ADD Into an Asset" and "My Journey in Integrating Art and Technology to Enhance the Human Experience."',
    category: 'Profiles',
    url: 'https://cameronaaron.medium.com/',
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
