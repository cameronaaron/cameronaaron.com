import { getPageUrl } from './site';

export interface Project {
  title: string;
  description: string;
  link: string;
  tags: string[];
  period: string;
  cta?: string;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    title: "Bridging Transitions: Video-Based Educational Content on Thrice-exceptional Black Male Students' Higher Education Journey",
    description: "Graduate capstone project producing a five-part educational video series on identification challenges, transition barriers, strength-based practices, social-emotional experiences, and institutional recommendations.",
    link: getPageUrl('/capstone'),
    tags: [
      "Thrice-Exceptional",
      "Gifted Education",
      "Higher Education",
      "Arts-Based Research",
      "Culturally Responsive Education",
      "Community Cultural Wealth",
    ],
    period: "Spring 2026",
    cta: "Capstone Project",
    featured: true,
  },
  {
    title: "Lapses in Sustained Attention Predicted by Changes in Visually-Guided Movements",
    description: "Vision Sciences Society Annual Meeting research linking motor behavior and cognitive attention patterns with translational clinical implications.",
    link: "https://doi.org/10.1167/jov.21.9.2719",
    tags: ["Neuroscience", "EEG", "Attention", "Research"],
    period: "May 2021",
    cta: "View Abstract",
    featured: true,
  },
  {
    title: "Genetic RefleXions Magic Mirror",
    description: "Award-winning interdisciplinary capstone integrating genomics, psychology, and computer science for interactive genomic data visualization.",
    link: "https://www.conncoll.edu/academics/internships-student-research/student-research-projects/genetic-reflexions-a-magic-mirror-that-displays-genetic-info-about-the-person-with-their-reflection.html",
    tags: ["Bioinformatics", "Genomics", "Python", "Capstone"],
    period: "May 2021",
    cta: "Read Project",
    featured: true,
  },
  {
    title: "Stanford Neurodiversity Summit Panel",
    description: "Panelist contribution focused on neurodiversity, systems change, and inclusive pathways in education and work.",
    link: "https://www.stanfordnnea.com/2023-speakers",
    tags: ["Neurodiversity", "Public Speaking", "Advocacy"],
    period: "2023",
    cta: "View Speakers",
  },
  {
    title: "Finding the Perfect Fit: The 2e-Friendly Workplace",
    description: "Published article in 2E News exploring workplace conditions, supports, and strengths-based outcomes for twice-exceptional professionals.",
    link: "https://www.2enews.com/",
    tags: ["Publication", "Twice-Exceptional", "Workplace"],
    period: "Spring 2019",
    cta: "Visit Publication",
  },
  {
    title: "Bridges 2e Center Vision & Leadership Symposium",
    description: "Panelist presentation on cognitive diversity, educational pathways, and leadership development.",
    link: "https://2esymposium.com/speaker-attendee-biographies-a-f/",
    tags: ["Leadership", "Education", "Panel"],
    period: "2023",
    cta: "View Speaker Profile",
  },
  {
    title: "thehellisthis.com",
    description: "Anonymous chat experiment on Cloudflare Workers with markdown support, disappearing custom rooms, and a main room that fades after ten quiet minutes unless people keep the conversation going.",
    link: "https://thehellisthis.com",
    tags: ["Cloudflare Workers", "Ephemeral Chat", "Social Art", "Anonymous"],
    period: "2025 - Present",
    cta: "Visit Site",
  },
  {
    title: "4me Welcomes Cameron Aaron",
    description: "Public profile feature discussing background across software, operations, and interdisciplinary career development.",
    link: "https://www.xurrent.com/blog/4me-welcomes-cameron-aaron",
    tags: ["Profile", "Technology", "Career"],
    period: "2023",
    cta: "Read Feature",
  },
  {
    title: "Top Emerging Talent - Pangea Summer 2021",
    description: "Recognized in Pangea's Top Emerging Talent cohort for early career technical and leadership potential.",
    link: "https://www.about.pangea.app/top-emerging-talent/summer-21",
    tags: ["Recognition", "Talent Program", "Technology"],
    period: "Summer 2021",
    cta: "View Cohort",
  },
  {
    title: "Internships: By the Dozen",
    description: "Connecticut College news feature covering internship contributions and applied interdisciplinary work.",
    link: "https://www.conncoll.edu/news/news-archive/2020/a-dozen-internships/",
    tags: ["Media", "Internships", "Interdisciplinary"],
    period: "2020",
    cta: "Read Article",
  },
  {
    title: "Toxoplasma Gondii Modifies Personality",
    description: "ResearchGate-listed publication exploring personality implications connected to Toxoplasma gondii.",
    link: "https://www.researchgate.net/publication/341276789_Toxoplasma_Gondii_Modifies_Personality",
    tags: ["Research", "Psychology", "Publication"],
    period: "Oct 2020",
    cta: "View on ResearchGate",
  },
  {
    title: "The Real Magical Girls",
    description: "ResearchGate-listed paper analyzing genre deconstruction and narrative structure in media studies.",
    link: "https://www.researchgate.net/publication/341276786_The_Real_Magical_Girls?_tp=eyJjb250ZXh0Ijp7ImZpcnN0UGFnZSI6InByb2ZpbGUiLCJwYWdlIjoicHJvZmlsZSJ9fQ",
    tags: ["Publication", "Media Studies", "Research"],
    period: "May 2020",
    cta: "View on ResearchGate",
  },
  {
    title: "EAS 101 Final Paper",
    description: "ResearchGate-listed paper discussing historical dynamics in East Asian regional conflict and policy impact.",
    link: "https://www.researchgate.net/publication/341276824_EAS_101_Final_paper",
    tags: ["Publication", "History", "Research"],
    period: "May 2020",
    cta: "View on ResearchGate",
  },
];
