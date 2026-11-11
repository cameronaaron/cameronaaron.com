export const faqs = [
  {
    question: "Is this the official Cameron Aaron website?",
    answer: "Yes. This is the official portfolio and resume website for Cameron Aaron. If you searched for \"Aaron Cameron,\" you are in the right place.",
  },
  {
    question: "What's your background?",
    answer: "It's a mix of Psychology (with a cognitive science minor and four years in a neuroscience lab) and Computer Science. I've been lucky enough to work at places like SpaceX and GitHub (now part of Microsoft), which has given me a pretty unique perspective on how software intersects with real-world problems."
  },
  {
    question: "What are you working on right now?",
    answer: "Finishing my nursing prerequisite coursework at LACCD (Fundamentals of Chemistry I this fall) while applying to entry-level MSN programs for 2027, on the way to becoming a psychiatric-mental health nurse practitioner. I also work as a Direct Support Professional intern with adults with developmental disabilities and run operations for Sun Brewed Homestead, a community farm. On the tech side I keep a few projects going, but healthcare is the main focus right now."
  },
  {
    question: "Are you open to new opportunities?",
    answer: "I'm always happy to chat, especially about healthcare, clinical research, or interdisciplinary work at the intersection of medicine and technology. Feel free to reach out."
  },
  {
    question: "What's your favorite tech stack?",
    answer: "React and Next.js on the frontend, Python for data and scripting, and Cloudflare for deployment. This site is a Next.js static export on Cloudflare Pages."
  },
  {
    question: "I saw you have a background in Neuroscience?",
    answer: "Yeah! I started in Biopsychology and Neuroscience. It taught me a lot about systems—biological ones—which surprisingly translates really well to understanding distributed software systems."
  },
  {
    question: "What was your graduate capstone defense project?",
    answer: "My M.Ed. capstone was \"Bridging Transitions,\" an arts-based research project on thrice-exceptional Black male students in higher education. I produced a five-part educational video series focused on identification, transition barriers, strengths-based practice, social-emotional experience, and institutional recommendations."
  },
  {
    question: "What awards and recognition have you received?",
    answer: "I won the 2021 Ammerman Center Bridget Baird Award for my Genetic RefleXions Magic Mirror project, which displays genetic information alongside user reflections. I also took first place at the 2020 Jacobs Design Prize for the C19 BayShield pandemic-response project and have received academic excellence awards throughout my career."
  }
] as const;

export type FAQ = typeof faqs[number];
