export interface ProfileStat {
  label: string;
  value: string;
}

export interface SocialLinks {
  github: string;
  linkedin: string;
  spotify: string;
  appleMusic: string;
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
  /** Rendered small/subdued next to citizenshipLabel — see Hero's connect pill. */
  citizenshipFlag: string;
  citizenshipLabel: string;
}

export const profile: Profile = {
  name: "Cameron Aaron, M.Ed.",
  title: "EMT, CNA, Software Engineer, Security Researcher & Future Nurse Practitioner",
  tagline: "Interdisciplinary professional bridging emergency care, neuroscience research, software engineering, and cybersecurity while preparing for Nurse Practitioner school.",
  bio: "Dedicated healthcare and technology professional with experience in aerospace medicine, clinical research, public health operations, software engineering, and security research. My next stage is Nurse Practitioner training, while continuing to build secure, high-impact technology for health and science.",
  email: "cameronthescientist@pm.me",
  location: "Los Angeles, CA",
  image: "/images/profile.webp",
  
  social: {
    github: "https://github.com/cameronaaron",
    linkedin: "https://www.linkedin.com/in/kamisama",
    spotify: "https://open.spotify.com/artist/0CpLZvas7C2hpxSKkqQL7M",
    appleMusic: "https://music.apple.com/us/artist/cameron-aaron/1680083789",
  },
  
  stats: [
    { label: "Clinical Certifications", value: "10+" },
    { label: "Years Interdisciplinary", value: "8+" },
    { label: "Research Projects", value: "6+" },
    { label: "Software & Security Projects", value: "50+" },
    { label: "Awards & Honors", value: "7+" },
  ],

  citizenshipFlag: "🇺🇸",
  citizenshipLabel: "U.S. Citizen",
};
