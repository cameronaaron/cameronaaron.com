export interface EducationItem {
  institution: string;
  credential: string;
  period: string;
  details: string[];
  verificationLinks?: EducationVerificationLink[];
}

export interface EducationVerificationLink {
  label: string;
  url: string;
}

export interface HonorItem {
  label: string;
  url?: string;
}

export interface PrerequisiteCourse {
  requirement: string;
  course: string;
  units: string;
  grade: string;
  gpa?: string;
  qualityPoints?: string;
  status: string;
  url?: string;
}

export const educationItems: EducationItem[] = [
  {
    institution: "Los Angeles Community College District",
    credential: "Nursing Prerequisite Coursework",
    period: "Sep 2025 - Aug 2026",
    details: [
      "Cumulative GPA: 3.69 | Units Earned: 36.00 (LACCD credit record)",
      "Spring 2026: 4.0 GPA — Full Time Dean's Honor List (Anatomy, Child Dev, Microbiology, Physiology, Sociology — all A's)",
      "Certificates of Completion: Certified Nursing Assistant (CNA) & Community Health Worker (CHW) — Dec 2025",
      "Current enrollment: CHEM 051 – Fundamentals of Chemistry I (Summer 2026)",
      "Non-credit completions: EKG Technician, Behavioral Tech Prep, Hardware & OS Networking, Digital Video Production",
    ],
    verificationLinks: [
      {
        label: "LACCD District Website",
        url: "https://www.laccd.edu/",
      },
      {
        label: "CA Dept. of Public Health — CNA",
        url: "https://cvl.cdph.ca.gov/DetailPage.aspx?cert_holder_id=797902",
      },
      {
        label: "Parchment — Community Health Worker",
        url: "https://www.parchment.com/lp/award/5ed28264-10a0-4798-b16b-f94393e0b7da",
      },
    ],
  },
  {
    institution: "Elmbridge University (formerly Bridges Graduate School)",
    credential: "Master of Education (M.Ed.) - Cognitive Diversity",
    period: "May 2023 - Jun 2026",
    details: [
      "Degree Completed: Jun 25, 2026 | Conferred: Aug 1, 2026",
      "Cumulative GPA: 3.85 | Credits Earned: 30.00",
      "Term Honors: Dean's List (2023 FALL), Provost's List (2024 SPRING, 2024 SUMMER, 2026 SUMMER)",
      "Capstone Action Research Project (Spring 2026, Pass)",
      "Capstone: Bridging Transitions video-based educational series on thrice-exceptional Black male students",
    ],
    verificationLinks: [
      {
        label: "Elmbridge University Website",
        url: "https://elmbridge.edu/",
      },
      {
        label: "Capstone Playlist",
        url: "https://www.youtube.com/playlist?list=PLPKJAUpRXbupAzN7UaPLEewRw2up_Nyz-",
      },
      {
        label: "Accreditation - Distance Education Accrediting Commission",
        url: "https://www.deac.org/",
      },
    ],
  },
  {
    institution: "Elmbridge University (formerly Bridges Graduate School)",
    credential: "Certificate in Twice Exceptional Education",
    period: "Aug 2023 - Jun 2024",
    details: [
      "Cumulative GPA: 3.83 | Honors: Dean's List",
      "Advanced coursework in twice-exceptionality and strength-based educational practice",
    ],
    verificationLinks: [
      {
        label: "Elmbridge University Website",
        url: "https://elmbridge.edu/",
      },
      {
        label: "Accreditation - Distance Education Accrediting Commission",
        url: "https://www.deac.org/",
      },
    ],
  },
  {
    institution: "Connecticut College",
    credential: "Bachelor of Arts - Psychology & Computer Science",
    period: "Aug 2017 - May 2021",
    details: [
      "Institutional GPA: 3.278 | Overall GPA: 3.322 (includes transfer coursework)",
      "Minor: Cognitive Science",
      "Certificate: Ammerman Center for Arts and Technology",
      "Award: 2021 Bridget Baird Award for Excellence in Research",
      "Credential ID: 227H-DXTM-CXND",
    ],
    verificationLinks: [
      {
        label: "Connecticut College Website",
        url: "https://www.conncoll.edu/",
      },
      {
        label: "Digital Diploma Verification",
        url: "https://www.conncoll.edu/academics/registrar/digital-diplomas/cediploma-validation/",
      },
      {
        label: "Ammerman Center for Arts and Technology",
        url: "https://www.conncoll.edu/academics/ammerman-center/",
      },
      {
        label: "Accreditation - New England Commission of Higher Education",
        url: "https://www.neche.org/",
      },
    ],
  },
];

export const prerequisiteCourses: PrerequisiteCourse[] = [
  {
    requirement: "Microbiology and lab",
    course: "MICRO 020 - General Microbiology (LACC)",
    units: "4.00",
    grade: "A",
    gpa: "4.00",
    status: "Completed",
    url: "https://www.lacc.edu/sites/lacc.edu/files/2025-08/Complete%20LACC%202025-26%20College%20Catalog_0.pdf#page=298",
  },
  {
    requirement: "Verbal Communication Skills",
    course: "COMM C1000 - Intro to Public Speaking (LAVC)",
    units: "3.00",
    grade: "B",
    gpa: "3.00",
    status: "Completed",
    url: "https://www.lavc.edu/sites/lavc.edu/files/2025-08/LAVC%20Catalog%202025-2026.pdf#page=181",
  },
  {
    requirement: "Nutrition",
    course: "FAM & CS 021 - Nutrition (LACC)",
    units: "3.00",
    grade: "A",
    gpa: "4.00",
    status: "Completed",
    url: "https://www.lacc.edu/sites/lacc.edu/files/2025-08/Complete%20LACC%202025-26%20College%20Catalog_0.pdf#page=271",
  },
  {
    requirement: "Emergency & Prehospital Care (nursing-relevant elective)",
    course: "FIRETEK 096 - Emerg Medical Tech (LAVC)",
    units: "8.00",
    grade: "B",
    gpa: "3.00",
    status: "Completed",
    url: "https://www.lavc.edu/sites/lavc.edu/files/2025-08/LAVC%20Catalog%202025-2026.pdf#page=200",
  },
  {
    requirement: "General Psychology",
    course: "PSY 100 - Introduction to Psychology (Connecticut College)",
    units: "4.00",
    grade: "A-",
    gpa: "3.70",
    status: "Completed",
    url: "https://conncoll.smartcatalogiq.com/en/2022-2023/catalog/courses/psy-psychology/100/psy-100",
  },
  {
    requirement: "Human Growth and Development",
    course: "PSYCH 041 - Life-Span Psych (LACC)",
    units: "3.00",
    grade: "A",
    gpa: "4.00",
    status: "Completed",
    url: "https://www.lacc.edu/sites/lacc.edu/files/2025-08/Complete%20LACC%202025-26%20College%20Catalog_0.pdf#page=313",
  },
  {
    requirement: "Human Growth and Development (additional coursework)",
    course: "HMD 111 - Intro to Human Development (Connecticut College)",
    units: "4.00",
    grade: "B+",
    gpa: "3.30",
    qualityPoints: "13.20",
    status: "Completed",
    url: "https://conncoll.smartcatalogiq.com/en/2022-2023/catalog/courses/hmd-human-development/100/hmd-111",
  },
  {
    requirement: "Human Growth and Development (additional coursework)",
    course: "CH DEV 001 - Child Growth & Develop (LAMC)",
    units: "3.00",
    grade: "A",
    gpa: "4.00",
    status: "Completed",
    url: "https://www.lamission.edu/sites/lamc.edu/files/2024-06/LAMC-Catalog-2024-2025.pdf#page=98",
  },
  {
    requirement: "Statistics",
    course: "PSY 201 - Psychological Statistics (Connecticut College)",
    units: "4.00",
    grade: "C",
    gpa: "2.00",
    status: "Completed",
    url: "https://conncoll.smartcatalogiq.com/en/2022-2023/catalog/courses/psy-psychology/200/psy-201",
  },
  {
    requirement: "Research Methods",
    course: "PSY 202 - Research Methods in Psychology (Connecticut College)",
    units: "4.00",
    grade: "B-",
    gpa: "2.70",
    status: "Completed",
    url: "https://conncoll.smartcatalogiq.com/en/2022-2023/catalog/courses/psy-psychology/200/psy-202",
  },
  {
    requirement: "Written Communication Skills",
    course: "EAS 106 - CC: Superheroes & Underdogs (Connecticut College)",
    units: "4.00",
    grade: "B+",
    gpa: "3.30",
    status: "Completed",
    url: "https://conncoll.smartcatalogiq.com/en/2020-2021/catalog/courses/eas-east-asian-studies/100/eas-106",
  },
  {
    requirement: "Advanced Biology (nursing-relevant elective)",
    course: "BIO 298 - Genomics, Epigenomics, and Transcriptomics (Connecticut College)",
    units: "4.00",
    grade: "A",
    gpa: "4.00",
    status: "Completed",
    url: "https://conncoll.smartcatalogiq.com/en/2022-2023/catalog/courses/bio-biology/200/bio-298",
  },
  {
    requirement: "Behavioral/Neuroscience Biology (nursing-relevant elective)",
    course: "PSY 214 - Biopsychology (Connecticut College)",
    units: "4.00",
    grade: "B",
    gpa: "3.00",
    status: "Completed",
    url: "https://conncoll.smartcatalogiq.com/en/2022-2023/catalog/courses/psy-psychology/200/psy-214",
  },
  {
    requirement: "Cognitive/Neuroscience Biology (nursing-relevant elective)",
    course: "PSY 312 - Cognitive Neuroscience (Connecticut College)",
    units: "4.00",
    grade: "B",
    gpa: "3.00",
    status: "Completed",
    url: "https://conncoll.smartcatalogiq.com/en/2022-2023/catalog/courses/psy-psychology/300/psy-312",
  },
  {
    requirement: "Behavioral Medicine (nursing-relevant elective)",
    course: "PSY 309 - Behavioral Medicine (Connecticut College)",
    units: "4.00",
    grade: "B",
    gpa: "3.00",
    status: "Completed",
    url: "https://conncoll.smartcatalogiq.com/en/2022-2023/catalog/courses/psy-psychology/300/psy-309",
  },
  {
    requirement: "Abnormal Psychology/Psychopathology (nursing-relevant elective)",
    course: "PSY 210 - Psycholog Disorders/Dysfunct (Connecticut College)",
    units: "4.00",
    grade: "A-",
    gpa: "3.70",
    qualityPoints: "14.80",
    status: "Completed",
    url: "https://conncoll.smartcatalogiq.com/en/2022-2023/catalog/courses/psy-psychology/200/psy-210",
  },
  {
    requirement: "Developmental Psychology (nursing-relevant elective)",
    course: "PSYC 350 - Developmental Psychology (UMass Amherst)",
    units: "3.00",
    grade: "A-",
    gpa: "3.70",
    status: "Completed",
    url: "https://www.umass.edu/psychological-brain-sciences/undergraduate/undergraduate-course-offerings",
  },
  {
    requirement: "Social/Behavioral Science (nursing-relevant elective)",
    course: "PS 345 - Social Psychology (Calif St Univ Northridg)",
    units: "3.00",
    grade: "A",
    gpa: "4.00",
    status: "Completed",
    url: "https://catalog.csun.edu/academics/psy/courses/psy-345/",
  },
  {
    requirement: "Social/Behavioral Science (nursing-relevant elective)",
    course: "SOC 001 - Intro to Sociology (WLAC)",
    units: "3.00",
    grade: "A",
    gpa: "4.00",
    status: "Completed",
    url: "https://www.wlac.edu/sites/wlac.edu/files/2024-08/catalog.pdf#page=223",
  },
  {
    requirement: "Behavioral Health Promotion (nursing-relevant elective)",
    course: "PSY 321 - Sport & Exercise Psychology (Connecticut College)",
    units: "4.00",
    grade: "B+",
    gpa: "3.30",
    qualityPoints: "13.20",
    status: "Completed",
    url: "https://conncoll.smartcatalogiq.com/en/2022-2023/catalog/courses/psy-psychology/300/psy-321",
  },
  {
    requirement: "Human Anatomy and lab",
    course: "ANATOMY 001 - Intro to Human Anatomy (LACC)",
    units: "4.00",
    grade: "A",
    gpa: "4.00",
    status: "Completed",
    url: "https://www.lacc.edu/sites/lacc.edu/files/2025-08/Complete%20LACC%202025-26%20College%20Catalog_0.pdf#page=234",
  },
  {
    requirement: "Human Physiology and lab",
    course: "PHYSIOL 001 - Intro to Human Physiology (Los Angeles Harbor College)",
    units: "4.00",
    grade: "A",
    gpa: "4.00",
    status: "Completed",
    url: "https://www.lahc.edu/sites/lahc.edu/files/2025-12/LAHC%20Master%20Catalog%20File%202025%20Final%20Draft%C2%A0(1)%20-%20Updated%2012.17.25.pdf#page=194",
  },
  {
    requirement: "Nursing Clinical Skills (nursing-relevant elective)",
    course: "NRS-HCA 056 - Essent Prac Skil Nrs (WLAC)",
    units: "1.00",
    grade: "P",
    status: "Completed",
    url: "https://www.wlac.edu/sites/wlac.edu/files/2024-08/catalog.pdf#page=212",
  },
  {
    requirement: "Organic Chemistry and lab",
    course: "CHEM 051 – Fundamentals of Chemistry I (LAVC)",
    units: "5.00",
    grade: "In Progress",
    status: "In Progress",
    url: "https://www.lavc.edu/sites/lavc.edu/files/2025-08/LAVC%20Catalog%202025-2026.pdf#page=175",
  },
  {
    requirement: "Biochemistry",
    course: "CHEM 051 – Fundamentals of Chemistry I (LAVC, includes biochemistry topics)",
    units: "5.00",
    grade: "In Progress",
    status: "In Progress",
    url: "https://www.lavc.edu/sites/lavc.edu/files/2025-08/LAVC%20Catalog%202025-2026.pdf#page=175",
  },
];

export const honorsAndAffiliations: HonorItem[] = [
  {
    label: "NREMT EMT Item Review Panel, National Registry of EMTs (Jul 2026)",
    url: "https://www.nremt.org/verify-credentials",
  },
  {
    label: "Full Time Dean's Honor List, LACCD (Jun 2026)",
  },
  {
    label: "Delta Epsilon Tau International Honor Society (Jun 2025)",
    url: "https://www.deac.org/discover-deac/delta-epsilon-tau-honor-society/",
  },
  {
    label: "2eASD Grant Scholarship, UCONN (May 2024)",
    url: "https://giftedasd.project.uconn.edu/",
  },
  {
    label: "Ammerman Center Bridget Baird Award (2021)",
    url: "https://www.conncoll.edu/academics/ammerman-center/",
  },
  {
    label: "Top Emerging Talent, Pangea.app Accelerator (Jun 2021)",
    url: "https://pangea.app/",
  },
  {
    label: "Jacobs Design Prize First Place - C19 BayShield (Jun 2020)",
    url: "https://jacobsinstitute.berkeley.edu/",
  },
  {
    label: "GitHub Arctic Code Vault Contributor (Jun 2020)",
    url: "https://archiveprogram.github.com/arctic-vault/",
  },
  {
    label: "Impact Labs Fellow (Jan 2020)",
    url: "https://www.impactlabs.io/",
  },
];
