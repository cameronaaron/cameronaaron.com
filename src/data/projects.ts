export interface Project {
  title: string;
  description: string;
  link: string;
  tags: string[];
  period: string;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    title: "Resume Feedback Assistant",
    description: "Advanced web application using FastAPI that provides actionable advice to improve resumes based on specific job listings using AI.",
    link: "https://resumechecker.cameronaaron.com/",
    tags: ["FastAPI", "AI", "NLP", "Python"],
    period: "Apr 2024 - Present",
  },
  {
    title: "Resume to Personal Web Site Converter",
    description: "Sophisticated FastAPI web app that generates custom Bootstrap websites from user-uploaded resumes automatically.",
    link: "https://resumetosite.cameronaaron.com/",
    tags: ["FastAPI", "Bootstrap", "AI", "Python"],
    period: "Apr 2024 - Present",
  },
  {
    title: "Slang Translator",
    description: "FastAPI-based web app that translates internet slang and colloquialisms into standard English using advanced AI models.",
    link: "https://slangtranslator.cameronaaron.com",
    tags: ["FastAPI", "AI", "NLP", "Python"],
    period: "Apr 2024 - Present",
  },
  {
    title: "Academic Paper Reviewer",
    description: "Flask-based web application offering detailed proofreading and feedback for academic papers using advanced AI.",
    link: "https://proofread.cameronaaron.com/",
    tags: ["Flask", "AI", "NLP", "Python"],
    period: "Aug 2023 - Present",
  },
  {
    title: "Advanced Translation Tool",
    description: "Innovative translation application using FastAPI, providing highly accurate and culturally nuanced translations.",
    link: "https://translate.cameronaaron.com/",
    tags: ["FastAPI", "AI", "Translation", "Python"],
    period: "Apr 2023 - Present",
  },
  {
    title: "Genetic RefleXions Magic Mirror",
    description: "Futuristic mirror that displays genetic info alongside the user's reflection. Winner of 2021 Ammerman Center Bridget Baird Award.",
    link: "https://www.conncoll.edu/academics/internships-student-research/student-research-projects/genetic-reflexions-a-magic-mirror-that-displays-genetic-info-about-the-person-with-their-reflection.html",
    tags: ["Bioinformatics", "IoT", "Python", "Hardware"],
    period: "May 2021",
    featured: true,
  },
];
