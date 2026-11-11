export interface ResumeDownload {
  key: string;
  label: string;
  description: string;
  href: string;
  downloadName: string;
}

export const resumeDownloads: ResumeDownload[] = [
  {
    key: "cv",
    label: "Curriculum Vitae (3 pages)",
    description: "Current CV — education, licenses, health care experience, research, teaching, presentations & honors",
    href: "/resume/cameron-aaron-cv.pdf",
    downloadName: "Cameron_Aaron_CV.pdf",
  },
  {
    key: "one-page",
    label: "One-Page Resume",
    description: "Quick-scan resume — education, licenses, health care experience & research",
    href: "/resume/cameron-aaron-medical-resume-one-page.pdf",
    downloadName: "Cameron_Aaron_Resume_OnePage.pdf",
  },
];
