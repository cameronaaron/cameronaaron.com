export const faqs = [
  {
    question: "What programming languages and technologies do you specialize in?",
    answer: "I specialize in Python, TypeScript/JavaScript, React/Next.js, FastAPI/Flask, SQL databases, AWS/GCP cloud platforms, Docker/Kubernetes, and Machine Learning/AI frameworks. I have 6+ years of professional experience building scalable web applications and AI-powered solutions."
  },
  {
    question: "What industries have you worked in?",
    answer: "I've worked across diverse industries including education technology (Bridges Academy), cannabis technology (Dutchie), aerospace (SpaceX), software development (GitHub), and cloud computing (Microsoft). My experience spans from biopsychology teaching to systems administration and software engineering."
  },
  {
    question: "What types of projects do you work on?",
    answer: "I build AI-powered web applications, including resume feedback assistants, translation tools, academic paper reviewers, and bioinformatics solutions. I'm particularly passionate about projects at the intersection of AI, neuroscience, and technology that solve real-world problems."
  },
  {
    question: "What is your educational background?",
    answer: "I'm currently studying at UC Berkeley and previously attended Connecticut College where I studied Computer Science and Neuroscience. I've earned multiple Google Cloud certifications including Cloud Engineering, IT Automation with Python, IT Support, G Suite Administration, and Architecting with Google Compute Engine."
  },
  {
    question: "Do you offer consulting or freelance services?",
    answer: "Yes! I'm available for software engineering, AI/ML consulting, DevOps infrastructure projects, and product management roles. I specialize in building scalable web applications, implementing AI solutions, and establishing IT infrastructure. Contact me at cameronthescientist@pm.me to discuss your project."
  },
  {
    question: "What makes your approach to software engineering unique?",
    answer: "My interdisciplinary background combining software engineering, neuroscience, and product management allows me to approach problems from multiple perspectives. I focus on building user-centric, scientifically-informed solutions that leverage cutting-edge AI and cloud technologies."
  },
  {
    question: "What awards and recognition have you received?",
    answer: "I won the 2021 Ammerman Center Bridget Baird Award for my Genetic RefleXions Magic Mirror project, which displays genetic information alongside user reflections. I've also won multiple hackathons and received academic excellence awards throughout my career."
  },
  {
    question: "What is your experience with AI and Machine Learning?",
    answer: "I have extensive experience building AI-powered applications using modern ML frameworks. My projects include natural language processing tools (resume feedback, translation, proofreading), and I've worked on AI research in aerospace medicine and bioinformatics. I stay current with the latest developments in generative AI and large language models."
  }
] as const;

export type FAQ = typeof faqs[number];
