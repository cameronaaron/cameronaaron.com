export interface EducationItem {
  institution: string;
  credential: string;
  period: string;
  details: string[];
}

export interface PrerequisiteCourse {
  requirement: string;
  course: string;
  units: string;
  grade: string;
  status: string;
}

export const educationItems: EducationItem[] = [
  {
    institution: "Elmbridge University (formerly Bridges Graduate School)",
    credential: "Master of Education (M.Ed.) - Cognitive Diversity",
    period: "May 2023 - Jun 2026",
    details: [
      "GPA: A | Honors: Dean's List",
      "Capstone Defense Passed (Spring 2026)",
      "Capstone: Bridging Transitions video-based educational series on thrice-exceptional Black male students",
    ],
  },
  {
    institution: "Elmbridge University (formerly Bridges Graduate School)",
    credential: "Certificate in Twice Exceptional Education",
    period: "Aug 2023 - Jun 2024",
    details: [
      "GPA: A | Honors: Dean's List",
      "Advanced coursework in twice-exceptionality and strength-based educational practice",
    ],
  },
  {
    institution: "Connecticut College",
    credential: "Bachelor of Arts - Psychology & Computer Science",
    period: "Aug 2017 - May 2021",
    details: [
      "Minor: Cognitive Science",
      "Certificate: Ammerman Center for Arts and Technology",
      "Award: 2021 Bridget Baird Award for Excellence in Research",
    ],
  },
];

export const prerequisiteCourses: PrerequisiteCourse[] = [
  {
    requirement: "Microbiology and lab",
    course: "MICRO 020 - General Microbiology (LACC)",
    units: "4.00",
    grade: "A",
    status: "Completed",
  },
  {
    requirement: "Verbal Communication Skills",
    course: "COMM C1000 - Intro to Public Speaking (LAVC)",
    units: "3.00",
    grade: "B",
    status: "Completed",
  },
  {
    requirement: "General Psychology",
    course: "PSY 100 - Introduction to Psychology (Connecticut College)",
    units: "4.00",
    grade: "A-",
    status: "Completed",
  },
  {
    requirement: "Human Growth and Development",
    course: "PSYCH 041 - Life-Span Psych (LACC)",
    units: "3.00",
    grade: "A",
    status: "Completed",
  },
  {
    requirement: "Statistics",
    course: "PSY 201 - Psychological Statistics (Connecticut College)",
    units: "4.00",
    grade: "C",
    status: "Completed",
  },
  {
    requirement: "Research Methods",
    course: "PSY 202 - Research Methods in Psychology (Connecticut College)",
    units: "4.00",
    grade: "B-",
    status: "Completed",
  },
  {
    requirement: "Written Communication Skills",
    course: "EAS 106 - CC: Superheroes & Underdogs (Connecticut College)",
    units: "4.00",
    grade: "B+",
    status: "Completed",
  },
  {
    requirement: "Human Anatomy and lab",
    course: "ANATOMY 001 - Intro to Human Anatomy (LACC)",
    units: "4.00",
    grade: "In Progress",
    status: "In Progress",
  },
  {
    requirement: "Human Physiology and lab",
    course: "PHYSIOL 001 - Intro to Human Physiology (Los Angeles Harbor College)",
    units: "4.00",
    grade: "Planned",
    status: "Planned",
  },
  {
    requirement: "Organic Chemistry and lab",
    course: "CHEM 051 - Fundamentals of Chemistry I",
    units: "5.00",
    grade: "Planned",
    status: "Planned",
  },
  {
    requirement: "Biochemistry",
    course: "CHEM 051 - Fundamentals of Chemistry I (includes biochemistry topics)",
    units: "5.00",
    grade: "Planned",
    status: "Planned",
  },
];

export const honorsAndAffiliations: string[] = [
  "Delta Epsilon Tau International Honor Society (Jun 2025)",
  "2eASD Grant Scholarship, UCONN (May 2024)",
  "Ammerman Center Bridget Baird Award (2021)",
  "Top Emerging Talent, Pangea.app Accelerator (Jun 2021)",
  "Jacobs Design Prize First Place - C19 BayShield (Jun 2020)",
  "GitHub Arctic Code Vault Contributor (Jun 2020)",
  "Impact Labs Fellow (Jan 2020)",
];
