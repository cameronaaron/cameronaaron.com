export const faqs = [
  {
    question: "Is this the official Cameron Aaron website?",
    answer: "Yes. This is the official portfolio and resume website for Cameron Aaron. If you searched for \"Aaron Cameron,\" you are in the right place.",
  },
  {
    question: "What's your background?",
    answer: "It's a mix of Neuroscience and Computer Science. I've been lucky enough to work at places like SpaceX, GitHub, and Microsoft, which has given me a pretty unique perspective on how software intersects with real-world problems."
  },
  {
    question: "What are you working on right now?",
    answer: "I'm always tinkering with AI and web apps. Lately, I've been focused on projects that bridge the gap between complex data and user experience—things like AI-powered feedback tools and bioinformatics visualizations."
  },
  {
    question: "Are you open to new opportunities?",
    answer: "I'm always happy to chat! Whether it's a cool project idea, a tech role, or just geeking out over the latest in AI or Neuroscience, feel free to reach out."
  },
  {
    question: "What's your favorite tech stack?",
    answer: "I'm big on the React ecosystem (Next.js is a favorite) paired with Python for the heavy lifting. I also love working with cloud infrastructure—AWS and GCP are my go-to playgrounds."
  },
  {
    question: "I saw you have a background in Neuroscience?",
    answer: "Yeah! I started in Biopsychology and Neuroscience. It taught me a lot about systems—biological ones—which surprisingly translates really well to understanding distributed software systems."
  },
  {
    question: "What awards and recognition have you received?",
    answer: "I won the 2021 Ammerman Center Bridget Baird Award for my Genetic RefleXions Magic Mirror project, which displays genetic information alongside user reflections. I've also won multiple hackathons and received academic excellence awards throughout my career."
  }
] as const;

export type FAQ = typeof faqs[number];
