export interface Position {
  title: string;
  period: string;
  description: string;
}

export interface Experience {
  company: string;
  logo: string;
  positions: Position[];
}

export const experiences: Experience[] = [
  {
    company: "Bridges Academy",
    logo: "/ba.webp",
    positions: [
      {
        title: "Biopsychology Teacher",
        period: "Jun 2023 - Present",
        description: "Teaching biopsychology with comprehensive project-based curriculum.",
      },
      {
        title: "Director of Information Technology Engineering",
        period: "Mar 2023 - Present",
        description: "Established and managed comprehensive IT infrastructure, providing responsive technical support and fostering digital literacy.",
      },
      {
        title: "Engineering Teacher",
        period: "Nov 2022 - Present",
        description: "Developed comprehensive software engineering curriculum with project-based learning experiences.",
      },
    ],
  },
  {
    company: "Dutchie",
    logo: "/Dutchie.svg",
    positions: [
      {
        title: "Lead Systems Admin",
        period: "Aug 2022 - Nov 2022",
        description: "Led systems administration, translating functional to technical requirements, managing SaaS platforms, and building analytics solutions.",
      },
      {
        title: "Lead Support Systems Analyst",
        period: "Feb 2022 - Aug 2022",
        description: "Developed data-driven systems projects including migrations and major overhauls.",
      },
      {
        title: "Project Manager",
        period: "Aug 2021 - Feb 2022",
        description: "Managed cross-organizational projects, analyzing team data to develop prioritized goals.",
      },
    ],
  },
  {
    company: "SpaceX",
    logo: "/spacex.webp",
    positions: [
      {
        title: "Aerospace Medicine, Space Operations",
        period: "Aug 2020 - Dec 2020",
        description: "Assisted with COVID response, collaborated on medical research for Starship/Crew Dragon programs.",
      },
    ],
  },
  {
    company: "GitHub",
    logo: "/github.webp",
    positions: [
      {
        title: "Software Engineer",
        period: "Aug 2019 - Jan 2020",
        description: "Developed internal tools to enhance product functionality and user experience.",
      },
    ],
  },
  {
    company: "Google",
    logo: "/google.webp",
    positions: [
      {
        title: "CSSI Section Leader & Student Mentor",
        period: "Jun 2020 - Sep 2020",
        description: "Selected as Algorithms TA/mentor for ~50 students, ensuring 95% pass rate.",
      },
    ],
  },
];
