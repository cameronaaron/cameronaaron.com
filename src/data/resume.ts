export interface ResumeDownload {
  key: string;
  label: string;
  description: string;
  href: string;
  downloadName: string;
}

export const resumeDownloads: ResumeDownload[] = [
  {
    key: "one-page",
    label: "One-Page Resume",
    description: "Quick-scan medical resume — certifications, experience & education",
    href: "/cameron-aaron-medical-resume-one-page.pdf",
    downloadName: "Cameron_Aaron_Medical_Resume_OnePage.pdf",
  },
  {
    key: "full",
    label: "Full Resume (2 pages)",
    description: "Complete medical resume with credential IDs, research & publications",
    href: "/cameron-aaron-medical-resume.pdf",
    downloadName: "Cameron_Aaron_Medical_Resume.pdf",
  },
];
