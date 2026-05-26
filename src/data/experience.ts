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
    company: "SpaceX",
    logo: "/spacex.webp",
    positions: [
      {
        title: "Aerospace Medicine, Space Operations",
        period: "Aug 2020 - Jan 2021",
        description: "Collaborated with flight surgeons and medical fellows on Starship and Crew Dragon medical deliverables, occupational health surveillance, and COVID-19 response protocols.",
      },
    ],
  },
  {
    company: "Bridges Academy",
    logo: "/ba.webp",
    positions: [
      {
        title: "Biopsychology Instructor",
        period: "Nov 2022 - Jul 2024",
        description: "Developed and delivered advanced biopsychology curriculum, mentored student research, and applied evidence-based strategies for complex neurological learning outcomes.",
      },
    ],
  },
  {
    company: "Connecticut College",
    logo: "/conn.svg.webp",
    positions: [
      {
        title: "CameLAB Neuroscience Lab Research Assistant",
        period: "Aug 2017 - May 2021",
        description: "Conducted EEG, 3D Reach Tracker, and eye-tracking research with MATLAB analysis; co-authored sustained attention and motor behavior findings.",
      },
      {
        title: "Computational Biology & Bioinformatics Researcher",
        period: "Jan 2020 - May 2021",
        description: "Built Apache Spark SNP analysis pipelines, DICOM imaging analysis tools, and applications integrating digital medical records with biometric and genomic data.",
      },
      {
        title: "Cybersecurity Researcher",
        period: "Aug 2019 - May 2021",
        description: "Performed ethical penetration testing and vulnerability assessments to support proactive institutional risk mitigation.",
      },
    ],
  },
  {
    company: "Dutchie",
    logo: "/Dutchie.svg",
    positions: [
      {
        title: "Systems Administrator",
        period: "Jul 2021 - Nov 2022",
        description: "Progressed across support and systems roles, led SaaS operations, documentation, and security-focused systems improvements.",
      },
    ],
  },
  {
    company: "4me (Xurrent)",
    logo: "/icon-192x192.png",
    positions: [
      {
        title: "DevOps Engineer",
        period: "Feb 2023 - Apr 2023",
        description: "Improved service availability, supported on-premise installations, and strengthened disaster recovery operations.",
      },
    ],
  },
  {
    company: "GitHub",
    logo: "/github.webp",
    positions: [
      {
        title: "Software Engineer, Support Operations",
        period: "May 2019 - Jan 2020",
        description: "Developed support tooling and collaborated across operations, product, engineering, and legal on customer-facing launches.",
      },
    ],
  },
  {
    company: "C19 BayShield",
    logo: "/icon-192x192.png",
    positions: [
      {
        title: "Backend Team Lead Engineer - COVID-19 Response",
        period: "Mar 2020 - Sep 2020",
        description: "Led 50+ Berkeley engineers and makers, delivering a resource platform that helped distribute over 6,300 PPE items to health facilities.",
      },
    ],
  },
  {
    company: "Helping Hands Community",
    logo: "/icon-192x192.png",
    positions: [
      {
        title: "Field Operations Engineering Specialist",
        period: "Jun 2020 - Sep 2020",
        description: "Supported community COVID-19 response logistics for vulnerable populations through healthcare access partnerships and operations support.",
      },
    ],
  },
  {
    company: "BardoVR",
    logo: "/icon-192x192.png",
    positions: [
      {
        title: "Virtual Reality Health & Wellness Developer",
        period: "Apr 2020 - Aug 2020",
        description: "Built immersive VR experiences designed to improve psychological wellbeing, focus, and compassion outcomes.",
      },
    ],
  },
  {
    company: "Google Fi",
    logo: "/google.webp",
    positions: [
      {
        title: "Senior Product Expert (Volunteer)",
        period: "2019 - 2022",
        description: "Provided advanced multi-platform technical support and contributed expert guidance to community user support channels.",
      },
    ],
  },
];
