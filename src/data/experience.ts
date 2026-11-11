export interface Position {
  title: string;
  period: string;
  description: string;
}

export interface Experience {
  company: string;
  /** Omitted when no single logo exists: the card shows the company monogram. */
  logo?: string;
  websiteUrl?: string;
  positions: Position[];
}

export const experiences: Experience[] = [
  {
    company: "California DDS Internship, North Los Angeles County",
    logo: "/logos/dds.avif",
    websiteUrl: "https://www.dds.ca.gov/initiatives/workforce-initiatives-4/dsp-internship-program/",
    positions: [
      {
        title: "Mental Health Assistance - Care Support",
        period: "Oct 2026 - Present",
        description: "Paid placement at Creative Minds ADP in Van Nuys, supporting adults with developmental disabilities in an adult day program.",
      },
    ],
  },
  {
    company: "Sun Brewed Homestead",
    logo: "/logos/sun-brewed.avif",
    websiteUrl: "https://www.sunbrewedhomestead.org/",
    positions: [
      {
        title: "Chief Operating Officer & Board Member",
        period: "Jul 2025 - Present",
        description: "Runs operations for a 501(c)(3) community farm in Van Nuys that grows food, hosts workshops and rehomes rescue cats, and wrote the operations software it runs on.",
      },
    ],
  },
  {
    company: "National Registry of Emergency Medical Technicians",
    logo: "/logos/nremt.avif",
    websiteUrl: "https://www.nremt.org/",
    positions: [
      {
        title: "EMT Item Review Panelist",
        period: "Jul 2026 - Oct 2026",
        description: "Selected for two panels (Jul 2026; Sep - Oct 2026) to review and validate questions for the national EMT certification exam.",
      },
    ],
  },
  {
    company: "Los Angeles City College",
    logo: "/logos/lacc.avif",
    websiteUrl: "https://www.lacc.edu/",
    positions: [
      {
        title: "Founder, Human Anatomy Study Community",
        period: "Feb 2026 - Jun 2026",
        description: "Organized a 43-member ANATOMY 001 study group with review sessions and a deadline bot during a 4.00 term on the Full-Time Dean's Honor List.",
      },
    ],
  },
  {
    company: "Los Angeles Valley College & Los Angeles Mission College",
    // Two colleges share this card, and each publishes its own mark.
    // A single logo would name only one of them.
    positions: [
      {
        title: "Clinical Training: EMT, Nursing Assistant, EKG",
        period: "Sep 2025 - Feb 2026",
        description: "Clinical rotations in direct patient care (vital signs, ADLs, mobility and safety), EMT training in assessment, airway, trauma and medical emergencies, and EKG acquisition.",
      },
    ],
  },
  {
    company: "Parker-Anderson Enrichment",
    logo: "/logos/parker-anderson.avif",
    websiteUrl: "https://parker-anderson.org/",
    positions: [
      {
        title: "STEM & Robotics Instructor",
        period: "Aug 2024 - Aug 2025",
        description: "Taught hands-on robotics, engineering, coding and science enrichment classes at Los Angeles schools, adapting each after-school session to mixed ages and skill levels.",
      },
    ],
  },
  {
    company: "Bridges Academy",
    logo: "/logos/ba-logo.avif",
    websiteUrl: "https://bridges.edu/",
    positions: [
      {
        title: "Director of Information Technology Engineering",
        period: "Nov 2022 - Jul 2024",
        description: "Solely established and managed school IT infrastructure and security protocols, and designed the web platforms supporting community communication and accessibility.",
      },
      {
        title: "Engineering Instructor",
        period: "Nov 2022 - Jul 2024",
        description: "Created a software engineering curriculum and ran interactive coding workshops, preparing students for advanced study and engineering careers.",
      },
      {
        title: "Biopsychology Instructor",
        period: "Nov 2022 - Jul 2024",
        description: "Developed and delivered advanced biopsychology curriculum, mentored student research, and applied evidence-based strategies for complex neurological learning outcomes.",
      },
    ],
  },
  {
    company: "4me (Xurrent)",
    logo: "/logos/xurrent.avif",
    websiteUrl: "https://www.xurrent.com/",
    positions: [
      {
        title: "DevOps Engineer",
        period: "Feb 2023 - Apr 2023",
        description: "Improved service availability, supported on-premise installations, and strengthened disaster recovery operations.",
      },
    ],
  },
  {
    company: "Dutchie",
    logo: "/logos/dutchie.svg",
    websiteUrl: "https://dutchie.com/",
    positions: [
      {
        title: "Systems Administrator",
        period: "Aug 2022 - Nov 2022",
        description: "Diagnosed and resolved technical issues through root-cause analysis, translated requirements into technical specifications, and administered SaaS systems as primary admin.",
      },
      {
        title: "Support Systems Analyst",
        period: "Feb 2022 - Aug 2022",
        description: "Delivered data-driven systems projects and migrations, tracked support-team trends to set prioritized goals, and reported systems status to leadership.",
      },
      {
        title: "Project Manager",
        period: "Aug 2021 - Feb 2022",
        description: "Analyzed team data to set prioritized goals, managed project schedules and stakeholder communication, and kept deliverables on scope and budget.",
      },
      {
        title: "Product Support Specialist (Tier II), Customer Success",
        period: "Jul 2021 - Aug 2021",
        description: "Guided customers through workflows and product configuration, triaged and documented bugs with engineering, and coordinated incident communication during outages.",
      },
    ],
  },
  {
    company: "Connecticut College",
    logo: "/logos/conn.avif",
    websiteUrl: "https://www.conncoll.edu/",
    positions: [
      {
        title: "Computational Biology & Bioinformatics Researcher",
        period: "Jan 2020 - May 2021",
        description: "Built Apache Spark SNP analysis pipelines, DICOM imaging analysis tools, and applications integrating digital medical records with biometric and genomic data.",
      },
      {
        title: "Head of Special Events, TED Club",
        period: "2018 - May 2021",
        description: "Ran TEDxYouth@NewLondon and gave a TED-Ed talk on artificial creativity.",
      },
      {
        title: "CameLAB Neuroscience Lab Research Assistant",
        period: "Aug 2017 - May 2021",
        description: "Conducted EEG, 3D Reach Tracker, and eye-tracking research with MATLAB analysis; co-authored sustained attention and motor behavior findings.",
      },
      {
        title: "BIO 298 and Software Engineering TA",
        period: "Aug 2020 - Dec 2020",
        description: "Served as teaching assistant for BIO 298 and software engineering coursework, supporting student learning across interdisciplinary biology and CS topics.",
      },
      {
        title: "Summer Science Research Institute Bioinformatics and Computational Biology Researcher",
        period: "May 2020 - Jun 2020",
        description: "Built Apache Spark SNP analysis pipelines and DICOM imaging tools, and engineered an application unifying digital medical records, wearable biometrics, and genomic data.",
      },
      {
        title: "Cybersecurity Researcher",
        period: "Aug 2019 - Dec 2019",
        description: "Performed ethical penetration testing and vulnerability assessments to support proactive institutional risk mitigation.",
      },
      {
        title: "Robotics and Artificial Intelligence Lab Manager",
        period: "Aug 2018 - May 2019",
        description: "Managed day-to-day operations of the robotics and AI lab, maintained and repaired lab robots, and supported students and faculty using lab resources.",
      },
      {
        title: "Artificial Intelligence Research Associate",
        period: "Jul 2018 - May 2019",
        description: "Contributed to Double Robot telepresence, hardware neural network, and autonomous MIP research projects in the Computer Science department's AI lab.",
      },
    ],
  },
  {
    company: "SpaceX",
    logo: "/logos/spacex.avif",
    websiteUrl: "https://www.spacex.com/",
    positions: [
      {
        title: "Aerospace Medicine, Space Operations",
        period: "Aug 2020 - Jan 2021",
        description: "Collaborated with flight surgeons and medical fellows on Starship and Crew Dragon medical deliverables, occupational health surveillance, and COVID-19 response protocols.",
      },
    ],
  },
  {
    company: "Helping Hands Community",
    logo: "/logos/helping-hands.avif",
    websiteUrl: "https://www.helpinghands.community/",
    positions: [
      {
        title: "Field Operations Engineering Specialist",
        period: "Jun 2020 - Sep 2020",
        description: "Supported community COVID-19 response logistics for vulnerable populations through healthcare access partnerships and operations support.",
      },
    ],
  },
  {
    company: "C19 BayShield",
    logo: "/logos/c19-bayshield.svg",
    // Project site is defunct (2020 COVID response project) — the Wayback
    // Machine capture is the only remaining live reference. Not our own
    // domain, so the dead-link contract can't verify it directly; see the
    // ARCHIVED_LINK_EXEMPT entry it carries instead.
    websiteUrl: "https://web.archive.org/web/20201115080207/https://c19bayshield.org/",
    positions: [
      {
        title: "Backend Team Lead Engineer - COVID-19 Response",
        period: "Mar 2020 - Sep 2020",
        description: "Led 50+ Berkeley engineers and makers, delivering a resource platform that helped distribute over 6,300 PPE items to health facilities.",
      },
    ],
  },
  {
    company: "BardoVR",
    logo: "/logos/bardovr.avif",
    websiteUrl: "https://www.bardovr.com/",
    positions: [
      {
        title: "Virtual Reality Health & Wellness Developer",
        period: "Apr 2020 - Aug 2020",
        description: "Built immersive VR experiences designed to improve psychological wellbeing, focus, and compassion outcomes.",
      },
    ],
  },
  {
    company: "GitHub",
    logo: "/logos/github.avif",
    websiteUrl: "https://github.com/",
    positions: [
      {
        title: "Software Engineer, Support Operations",
        period: "Aug 2019 - Jan 2020",
        description: "Developed and managed support tooling, advised support leadership on aligning strategy with product goals, and streamlined complex support workflows.",
      },
      {
        title: "Community Support and Customer Success Engineering",
        period: "May 2019 - Aug 2019",
        description: "Supported cross-functional product launches across operations, product, engineering, and legal in an interdisciplinary role touching machine learning workflows.",
      },
    ],
  },
];
