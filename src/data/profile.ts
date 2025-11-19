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
  title: "Software Engineer & Neuroscientist",
  tagline: "Building the future at the intersection of AI, neuroscience, and technology",
  bio: "Seasoned Product Manager and Software Engineer with a diverse background in artificial intelligence, neuroscience, and aerospace medicine. Over six years of experience collaborating with industry leaders like Dutchie, GitHub, SpaceX, and Microsoft, driving innovation and delivering high-quality solutions.",
  email: "cameronthescientist@pm.me",
  location: "Los Angeles, CA",
  image: "/profile.webp",
  
  social: {
    github: "https://github.com/cameronaaron",
    linkedin: "https://www.linkedin.com/in/kamisama",
  },
  
  stats: [
    { label: "Years of Experience", value: "6+" },
    { label: "Companies", value: "10+" },
    { label: "Projects Delivered", value: "50+" },
    { label: "Awards Won", value: "7+" },
  ],
};
