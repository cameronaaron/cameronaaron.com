export interface ProfileStat {
  label: string;
  value: string;
}

export interface SocialLinks {
  github: string;
  linkedin: string;
}

export interface Profile {
  name: string;
  title: string;
  tagline: string;
  bio: string;
  email: string;
  location: string;
  image: string;
  social: SocialLinks;
  stats: ProfileStat[];
}

export const profile: Profile = {
  name: "Cameron Aaron",
  title: "EMT, CNA, Software Engineer, Security Researcher & Future Nurse Practitioner",
  tagline: "Interdisciplinary professional bridging emergency care, neuroscience research, software engineering, and cybersecurity while preparing for Nurse Practitioner school.",
  bio: "Dedicated healthcare and technology professional with experience in aerospace medicine, clinical research, public health operations, software engineering, and security research. My next stage is Nurse Practitioner training, while continuing to build secure, high-impact technology for health and science.",
  email: "cameronthescientist@pm.me",
  location: "Los Angeles, CA",
  image: "/profile.webp",
  
  social: {
    github: "https://github.com/cameronaaron",
    linkedin: "https://www.linkedin.com/in/kamisama",
  },
  
  stats: [
    { label: "Clinical Certifications", value: "10+" },
    { label: "Years Interdisciplinary", value: "8+" },
    { label: "Research Projects", value: "15+" },
    { label: "Software & Security Projects", value: "50+" },
    { label: "Awards & Honors", value: "12+" },
  ],
};
