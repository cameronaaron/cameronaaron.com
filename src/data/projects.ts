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
    title: "Lapses in Sustained Attention Predicted by Changes in Visually-Guided Movements",
    description: "Vision Sciences Society Annual Meeting research linking motor behavior and cognitive attention patterns with translational clinical implications.",
    link: "https://www.visionsciences.org/",
    tags: ["Neuroscience", "EEG", "Attention", "Research"],
    period: "May 2021",
    cta: "View Conference",
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
    link: "https://med.stanford.edu/neurodiversity.html",
    tags: ["Neurodiversity", "Public Speaking", "Advocacy"],
    period: "Aug 2021",
    cta: "View Program",
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
    link: "https://www.bridges.edu/",
    tags: ["Leadership", "Education", "Panel"],
    period: "Aug 2018",
    cta: "View Organization",
  },
];
