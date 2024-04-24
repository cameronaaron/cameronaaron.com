import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Cameron E. Aaron - Software Engineer &amp; Brain Science Enthusiast
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://www.linkedin.com/in/kamisama"
            target="_blank"
            rel="noopener noreferrer"
          >
            Connect on{" "}
            <Image
              src="/linkedin.svg"
              alt="LinkedIn Logo"
              className="dark:invert"
              width={100}
              height={24}
              priority
            />
          </a>
        </div>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px]">
        <Image
          className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
          src="/profile.jpg"
          alt="Cameron E. Aaron"
          width={180}
          height={180}
          priority
        />
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:grid-cols-4 lg:text-left">
        <a
          href="#about"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          rel="noopener noreferrer"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            About{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Learn about my background and expertise.
          </p>
        </a>

        <a
          href="#experience"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          rel="noopener noreferrer"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Experience{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Explore my professional experience and projects.
          </p>
        </a>

        <a
          href="#education"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          rel="noopener noreferrer"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Education{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            See my educational background and qualifications.
          </p>
        </a>

        <a
          href="#contact"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          rel="noopener noreferrer"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Contact{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              →
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Get in touch with me for collaborations or inquiries.
          </p>
        </a>
      </div>

      <div className="mb-32 w-full max-w-5xl" id="about">
        <h2 className="mb-4 text-3xl font-bold">About Me</h2>
        <p className="text-xl leading-relaxed">
          Cameron Aaron is a native of Studio City, CA and graduated from Bridges Academy with a young expert designation after doing Neuroscience and Artificial Intelligence research. He is a double major in Computer Science and Psychology with a minor in Cognitive Science and a Scholar in the Ammerman Center of Arts and Technology at Connecticut College. He conducts both Artificial Intelligence and Cognitive Neuroscience research.
        </p>
      </div>

      <div className="mb-32 w-full max-w-5xl" id="experience">
        <h2 className="mb-4 text-3xl font-bold">Professional Appointments</h2>
        <div className="grid grid-cols-1 gap-8">
          <div>
            <h3 className="text-2xl font-semibold">SpaceX</h3>
            <p className="text-gray-500">Aerospace Medicine Intern | 2020 - present</p>
            <ul className="list-disc pl-8">
              <li>Assist with SpaceX's COVID response to keep employees and crewmembers safe while keeping operations running</li>
              <li>Collaborate with academic institutions and/or private organizations on medical research</li>
              <li>Assist flight surgeons and medical fellows in research projects, data synthesis, and implementation of deliverables for Starship and Crew Dragon</li>
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-semibold">GitHub</h3>
            <p className="text-gray-500">Software Engineer | 2019 - 2020</p>
            <ul className="list-disc pl-8">
              <li>An interdisciplinary role that involves machine learning</li>
              <li>Work with cross-functional stakeholders in Operations, Product, Engineering, and Legal to support product launches</li>
              <li>Develop and execute support strategies that align with product goals</li>
              <li>Streamline complex processes and implement workflows designed to increase efficiency</li>
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-semibold">C19 BayShield</h3>
            <p className="text-gray-500">Backend Team Lead Engineer | 2016 - 2018</p>
            <ul className="list-disc pl-8">
              <li>Lead a team of UC Berkeley engineers</li>
              <li>Took ownership of the backend team</li>
              <li>Successfully lead a team that won the Jacobs prize at UC Berkeley</li>
              <li>Helped made an app that helped supply much of central California with PPE</li>
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Connecticut College</h3>
            <p className="text-gray-500">Researcher | 2009 - 2016</p>
            <ul className="list-disc pl-8">
              <li>Created Apache Spark pipeline to analyze single nucleotide polymorphisms</li>
              <li>Used Google Cloud Life Sciences to process, analyze, and annotate genomics</li>
              <li>Created algorithms to analyze medical imaging from DICOM files to better identify abnormalities</li>
              <li>Engineered a web app to pull in digital medical records, biometric data from wearables, and genetic info into one place</li>
              <li>Developed a Python application to collect and analyze EEG data</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-32 w-full max-w-5xl" id="education">
        <h2 className="mb-4 text-3xl font-bold">Education</h2>
        <div className="grid grid-cols-1 gap-8">
          <div>
            <h3 className="text-2xl font-semibold">Connecticut College</h3>
            <p className="text-gray-500">BA, Computer Science and Psychology, Minor in Cognitive Science | 2017 - 2021</p>
            <p>Advisory Committee: Gary Parker, Joseph A. Schroeder, Jefferson A Singer</p>
            <ul className="list-disc pl-8">
              <li>Research: Mechanisms of attentional processing, Bioinformatics and Computational Biology, Cyber Security and Network Infrastructure, Robotics and Artificial Intelligence</li>
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Coursera</h3>
            <p className="text-gray-500">Certificates | 2009 - 2012</p>
            <ul className="list-disc pl-8">
              <li>Cloud Engineering with GCP by Google Cloud</li>
              <li>Google IT Automation with Python</li>
              <li>Google IT Support by Google</li>
              <li>G Suite Administration Specialization</li>
              <li>Google Cloud Architecting with Google Compute Engine</li>
              <li>Architecting with Google Compute Engine</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-32 w-full max-w-5xl" id="contact">
        <h2 className="mb-4 text-3xl font-bold">Contact</h2>
        <p className="text-xl">
          Feel free to reach out to me for any inquiries or collaborations:
        </p>
        <ul className="mt-4">
          <li>Email: cameronaaron1@gmail.com</li>
          <li>LinkedIn: <a href="https://www.linkedin.com/in/kamisama" target="_blank" rel="noopener noreferrer">linkedin.com/in/kamisama</a></li>
        </ul>
      </div>
    </main>
  );
}