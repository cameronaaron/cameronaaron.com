import React from 'react';
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Cameron E. Aaron - Software Engineer &amp; Neuroscientist
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
        Cameron has worked for leading companies such as Dutchie, GitHub, SpaceX, and Microsoft, delivering high-quality products and services in various domains and sectors. He is passionate about advancing education and research, especially at the intersection of AI and cognitive neuroscience. He holds multiple certifications andawards in these fields, as well as a double major in Computer Science and Psychology, a minor in Cognitive Science, and a Certificate of Arts and Technology from Connecticut College. </p>
      </div>

      <div className="mb-32 w-full max-w-5xl" id="experience">
  <h2 className="mb-4 text-3xl font-bold">Professional Experience</h2>
  <div className="grid grid-cols-1 gap-8">
    <div>
      <div className="flex items-center">
        <img src="/ba.png" alt="Bridges Academy Logo" className="h-10 mr-4"/>
        <h3 className="text-2xl font-semibold">Bridges Academy</h3>
      </div>
      <p className="text-gray-500">Biopsychology Teacher | Jun 2023 - Present</p>
      <ul className="list-disc pl-8">
        <li>Teaching biopsychology, focusing on developing comprehensive curriculum.</li>
      </ul>
      <p className="text-gray-500">Director of Information Technology Engineering | Mar 2023 - Present</p>
      <ul className="list-disc pl-8">
        <li>Established and managed the comprehensive IT infrastructure.</li>
      </ul>
      <p className="text-gray-500">Engineering Teacher | Nov 2022 - Present</p>
      <ul className="list-disc pl-8">
        <li>Develop and implement a comprehensive software engineering curriculum.</li>
      </ul>
      <p className="text-gray-500">Safety Team | Aug 2023 - Present</p>
      <ul className="list-disc pl-8">
        <li>Lead and manage safety protocols and measures at Bridges Academy.</li>
      </ul>
    </div>
    <div>
      <div className="flex items-center">
        <img src="/Dutchie.svg" alt="Dutchie Logo" className="h-10 mr-4"/>
        <h3 className="text-2xl font-semibold">Dutchie</h3>
      </div>
      <p className="text-gray-500">Lead Systems Admin | Aug 2022 - Nov 2022</p>
      <ul className="list-disc pl-8">
        <li>Identified, diagnosed, and reported technical problems.</li>
      </ul>
      <p className="text-gray-500">Lead Support Systems Analyst | Feb 2022 - Aug 2022</p>
      <ul className="list-disc pl-8">
        <li>Develop data-driven systems-related projects.</li>
      </ul>
      <p className="text-gray-500">Project Manager | Aug 2021 - Feb 2022</p>
      <ul className="list-disc pl-8">
        <li>Managed and lead projects across the organization.</li>
      </ul>
      <p className="text-gray-500">Product Support Specialist (Tier ll) | Jul 2021 - Aug 2021</p>
      <ul className="list-disc pl-8">
        <li>Explained workflows and product configurations to customers.</li>
      </ul>
    </div>
    <div>
      <div className="flex items-center">
        <img src="/spacex.svg" alt="SpaceX Logo" className="h-10 mr-4"/>
        <h3 className="text-2xl font-semibold">SpaceX</h3>
      </div>
      <p className="text-gray-500">Aerospace Medicine, Space Operations | Aug 2020 - Dec 2020</p>
      <ul className="list-disc pl-8">
        <li>Assisted with SpaceX’s COVID response to keep operations running.</li>
      </ul>
    </div>
    
    <div>
      <div className="flex items-center">
        <img src="/github.png" alt="GitHub Logo" className="h-10 mr-4"/>
        <h3 className="text-2xl font-semibold">GitHub</h3>
      </div>
      <p className="text-gray-500">Software Engineer | Aug 2019 - Jan 2020</p>
      <ul className="list-disc pl-8">
        <li>Worked on internal tools to enhance product functionality and user experience.</li>
      </ul>
<div>
  <div className="flex items-center">
    <h3 className="text-2xl font-semibold">C19 BayShield</h3>
  </div>
  <p className="text-gray-500">Backend Team Lead Engineer | Apr 2020 - Sep 2020</p>
  <ul className="list-disc pl-8">
    <li>Led a team of UC Berkeley engineers.</li>
    <li>Led the backend engineering team that won the Jacobs prize at UC Berkeley.</li>
  </ul>
</div>

<div>
  <div className="flex items-center">
    <img src="/conn.png" alt="Connecticut College Logo" className="h-10 mr-4"/>
    <h3 className="text-2xl font-semibold">Connecticut College</h3>
  </div>
  <p className="text-gray-500">Computational Biology and Informatics Researcher | Jan 2020 - May 2021</p>
  <ul className="list-disc pl-8">
    <li>Developed algorithms to analyze medical imaging and genetic data.</li>
  </ul>
  <p className="text-gray-500">CameLAB Neuroscience Lab Research Assistant | Aug 2017 - May 2021</p>
  <ul className="list-disc pl-8">
    <li>Supported research using EEG and eye-tracking technology.</li>
  </ul>
</div>

<div>
  <div className="flex items-center">
    <img src="/upkey.svg" alt="Upkey Logo" className="h-10 mr-4"/>
    <h3 className="text-2xl font-semibold">Upkey</h3>
  </div>
  <p className="text-gray-500">Program Mentor | Jun 2020 - Feb 2021</p>
  <ul className="list-disc pl-8">
    <li>Mentored new grads on careers and coding skills.</li>
  </ul>
  <p className="text-gray-500">Product Management Intern | Jun 2020 - Jul 2020</p>
  <ul className="list-disc pl-8">
    <li>Partnered with teams to define and solve customer problems.</li>
  </ul>
</div>

<div>
  <div className="flex items-center">
    <img src="/hhc.png" alt="Helping Hands Community Logo" className="h-10 mr-4"/>
    <h3 className="text-2xl font-semibold">Helping Hands Community</h3>
  </div>
  <p className="text-gray-500">Field Operations Engineering Specialist | Jun 2020 - Sep 2020</p>
  <ul className="list-disc pl-8">
    <li>Developed and managed the website and supported community partnerships.</li>
  </ul>
</div>

<div>
  <div className="flex items-center">
    <img src="/google.png" alt="Google Logo" className="h-10 mr-4"/>
    <h3 className="text-2xl font-semibold">Google</h3>
  </div>
  <p className="text-gray-500">CSSI Section Leader & Student Mentor | Jun 2020 - Sep 2020</p>
  <ul className="list-disc pl-8">
    <li>Mentored and supported a large group of students in their learning journey.</li>
  </ul>
</div>

<div>
  <div className="flex items-center">
    <img src="/logos/nu-school.png" alt="Nu School Logo" className="h-10 mr-4"/>
    <h3 className="text-2xl font-semibold">Nu School</h3>
  </div>
  <p className="text-gray-500">Technology Fellow | Jul 2020 - Jul 2020</p>
  <ul className="list-disc pl-8">
    <li>Participated in training and led a team to build an MVP to reduce food waste.</li>
  </ul>
</div>

<div>
  <div className="flex items-center">
    <img src="/wurrly.jpg" alt="Wurrly Logo" className="h-10 mr-4"/>
    <h3 className="text-2xl font-semibold">Wurrly</h3>
  </div>
  <p className="text-gray-500">QA Engineer | May 2015 - Aug 2015</p>
  <ul className="list-disc pl-8">
    <li>Conducted regression testing and developed automation scripts for the Wurrly application.</li>
  </ul>
</div>

<div>
  <div className="flex items-center">
    <img src="/ted.ai" alt="TED Conferences Logo" className="h-10 mr-4"/>
    <h3 className="text-2xl font-semibold">TED Conferences</h3>
  </div>
  <p className="text-gray-500">Lead Organizer TEDxYouth@NewLondon | Jul 2018 - Dec 2019</p>
  <ul className="list-disc pl-8">
    <li>Organized and managed TEDx events focusing on youth engagement and innovative ideas.</li>
  </ul>
</div>

<div>
  <div className="flex items-center">
    <img src="/2e.png" alt="2eNews Logo" className="h-10 mr-4"/>
    <h3 className="text-2xl font-semibold">2eNews</h3>
  </div>
  <p className="text-gray-500">Variations 2e Article Writer | Dec 2018 - Jun 2019</p>
  <ul className="list-disc pl-8">
    <li>Wrote an article on 2E in the workplace, featured in the Spring 2019 issue of Variations 2E magazine.</li>
  </ul>
</div>

<div>
  <div className="flex items-center">
    <h3 className="text-2xl font-semibold">Clues Inc.</h3>
  </div>
  <p className="text-gray-500">Creator | Feb 2017 - 2019</p>
  <ul className="list-disc pl-8">
    <li>Created and published a comic book to promote awareness about the benefits of neurodiversity.</li>
  </ul>
</div>

<div>
  <div className="flex items-center">
    <img src="/ba.png" alt="The Bridges 2e Center Logo" className="h-10 mr-4"/>
    <h3 className="text-2xl font-semibold">The Bridges 2e Center for Research and Professional Development</h3>
  </div>
  <p className="text-gray-500">Panelist at VISION & LEADERSHIP 2e SYMPOSIUM 2019 | Oct 2018 - Oct 2018</p>
  <ul className="list-disc pl-8">
    <li>Participated as a panelist, discussing topics related to twice-exceptional education and leadership.</li>
  </ul>
</div>

    </div>
  </div>
</div>



<div className="mb-32 w-full max-w-5xl" id="education">
  <h2 className="mb-4 text-3xl font-bold">Education</h2>
  <div className="grid grid-cols-1 gap-8">
    <div>
      <h3 className="text-2xl font-semibold">Bridges Graduate School of Cognitive Diversity in Education</h3>
      <p className="text-gray-500">M.Ed. Program in Cognitive Diversity | May 2023 - May 2025</p>
      <ul className="list-disc pl-8">
        <li>Focus on development of advanced abilities and areas of challenge in learning, self-regulation, and social skills.</li>
        <li>Term Honor: Dean's List</li>
      </ul>
      <p className="text-gray-500">Certificate in Twice Exceptional Education | Aug 2023 - Jun 2024</p>
      <ul className="list-disc pl-8">
        <li>Specialized education methods for students who are both gifted and challenged.</li>
        <li>Term Honor: Dean's List</li>
      </ul>
    </div>
    <div>
      <h3 className="text-2xl font-semibold">Connecticut College</h3>
      <p className="text-gray-500">BA, Computer Science and Psychology, Minor in Cognitive Science | Aug 2017 - May 2021</p>
      <ul className="list-disc pl-8">
        <li>Research: Mechanisms of attentional processing, Bioinformatics and Computational Biology, Cyber Security and Network Infrastructure, Robotics and Artificial Intelligence </li>
        <li>Advisory Committee: Gary Parker, Joseph A. Schroeder, Jefferson A Singer</li>
      </ul>
    </div>
    <div>
      <h3 className="text-2xl font-semibold">Coursera</h3>
      <p className="text-gray-500">Certificates</p>
      <ul className="list-disc pl-8">
        <li>Cloud Engineering with GCP by Google Cloud</li>
        <li>Google IT Automation with Python</li>
        <li>Google IT Support by Google</li>
        <li>G Suite Administration Specialization</li>
        <li>Architecting with Google Compute Engine</li>
      </ul>
    </div>
  </div>
</div>
<div className="mb-32 w-full max-w-5xl" id="honors-awards">
  <h2 className="mb-4 text-3xl font-bold">Honors & Awards</h2>
  <div className="grid grid-cols-1 gap-8">
    <div>
      <h3 className="text-xl font-semibold">Bridges Diamond Awards - Doug Lenzini</h3>
      <p className="text-gray-500">Apr 2010, Apr 2012, Apr 2013</p>
      <p>A distinction reserved for students who model exemplary year-long commitment and service to the school community.</p>
    </div>
    <div>
      <h3 className="text-xl font-semibold">2020 Impact Labs Fellow</h3>
      <p className="text-gray-500">Jan 2020</p>
      <p>Award recognizing innovative contributions in technology.</p>
    </div>
    <div>
      <h3 className="text-xl font-semibold">Computer Science Leader - Connecticut College</h3>
      <p className="text-gray-500">Aug 2017</p>
      <p>Leadership role acknowledged at the beginning of academic tenure.</p>
    </div>
    <div>
      <h3 className="text-xl font-semibold">Jacobs Design Award (C19 Bayshield)</h3>
      <p className="text-gray-500">Jun 2020</p>
      <p>Awarded for leading a team to develop an emergency resource management app, producing over 6300 pieces of PPE.</p>
    </div>
    <div>
      <h3 className="text-xl font-semibold">Ammerman Center Bridget Baird Award - Connecticut College</h3>
      <p className="text-gray-500">Apr 2021</p>
      <p>Awarded for excellence in research in arts and technology.</p>
    </div>
    <div>
      <h3 className="text-xl font-semibold">Top Emerging Talent Summer '21 - Pangea.app</h3>
      <p className="text-gray-500">Jun 2021</p>
      <p>Recognized as one of the most promising recent grads across the globe.</p>
    </div>
  </div>
</div>


      <div className="mb-32 w-full max-w-5xl" id="recommendations">
  <h2 className="mb-4 text-3xl font-bold">Recommendations</h2>
  <div className="grid grid-cols-1 gap-8">
    <div>
      <p className="text-xl italic">"Cameron is a smart, well spoken, inquisitive worker who always digs deeper to understand the whys, hows and outcome of any task. During his time at Dutchie, I saw him work on a handful of extremely difficult projects with the utmost professionalism and dedication. Any company would be lucky to have Cameron as an employee."</p>
      <p className="text-gray-500">- Vinicius SantAnna, Former HubSpot and Dutchie</p>
    </div>
    <div>
      <p className="text-xl italic">"Cameron is a highly empathetic and talented Engineer. Cameron is customer obsessed, an amazing team player and was a wonderful addition to our digital support team. I’d love an opportunity to work with Cameron again."</p>
      <p className="text-gray-500">- Andrea Griffiths PMP CCSK, Senior Product Manager at GitHub</p>
    </div>
    <div>
      <p className="text-xl italic">"Cameron engaged with the career office in his early days as a student at Connecticut College. His intellectual curiosity launched his academic career in computer classes as well as film and literature courses. Cameron has encompassed all aspects of the liberal arts and has been open to learning everything. His ability to think creatively and to be somewhat fearless, has allowed him to draw connections that I don't think the average student would see. As a result, Cameron has been able to secure coveted internship opportunities during his time as a student. I totally expect Cameron to invent or be a part of a team who invents the next best thing! When that happens, I'll be on the sidelines saying, 'I told you!!' I'm so proud of you, Cameron!"</p>
      <p className="text-gray-500">- Persephone L. Hall, Dedicated leader in career development</p>
    </div>
    <div>
      <p className="text-xl italic">"Cameron is a wonderful collaborator. He has been an incredible resource for our school. His multi-faceted expertise (pedagogy, tech, and project development) has supported our students and staff immensely."</p>
      <p className="text-gray-500">- JoeAnna McDonald, MA Mathematics</p>
    </div>
    <div>
      <p className="text-xl italic">"Cameron is a passionate and dedicated professional that is a welcomed addition to any team. It's evident he cares about his work, works hard, and gives his all in whatever role he finds himself in."</p>
      <p className="text-gray-500">- Nate Ledbury, Certified Salesforce Administrator</p>
    </div>
    <div>
      <p className="text-xl italic">"Cameron performed cybersecurity research for Connecticut College during his time as an undergrad. His interest in white hat hacking and his ability to find vulnerabilities was an asset to his research. He found several vulnerabilities in our systems by utilizing different tools to detect them while having zero impact on the college's network. His research provided the college with proof of concept of how threat actors could take advantage of some of our vulnerabilities. We were able to make mitigations based on his findings. Cameron is a thorough investigator who likes to understand problems and get to the bottom of a solution. He is easygoing and a joy to work with. I'd recommend him for any position."</p>
      <p className="text-gray-500">- H. John Schaeffer, CISO and Director of Networks, Servers & Security at Connecticut College</p>
    </div>
    <div>
      <p className="text-xl italic">"Cameron is enthusiastic and persistent. He has a lot of energy and curiosity and the drive to follow it up."</p>
      <p className="text-gray-500">- Rose East, Customer support professional focused on building supportive and collaborative communities</p>
    </div>
    <div>
      <p className="text-xl italic">"Cameron did a phenomenal job with sourcing information across several teams in preparation for onboarding new members of the community forum team at GitHub. He consistently offered novel solutions to issues arising during policy changes and new feature roll out. He has a knack for smoothly connecting objective and introspective observations in collaborative environments."</p>
      <p className="text-gray-500">- Krystle Scott, Voice Actor | Narrator | Analyst | Salesforce Administrator | Support Engineer</p>
    </div>
    <div>
      <p className="text-xl italic">"Cameron is an exceptional security-minded business applications expert. I consistently leaned on Cameron not only for his subject matter expertise and technical skills, but also his vision for securing the organization's most critical systems and applications. Cameron is a professional who is always looking forward to determine how solutions can be made more secure and more efficient, and he was an immensely helpful ally of the security team. I hope to be granted the privilege of working with Cameron again in the future!"</p>
      <p className="text-gray-500">- Sean Hastings, Information Security @ Dutchie</p>
    </div>
    <div>
      <p className="text-xl italic">"I could always count on Cameron to address issues that happened with our systems quickly and make sure they never happen again. Cameron's passion for technology is evident in his work and was demonstrated on a daily basis. He would research new ways for us to use the systems we had and discovered new ways to utilize the data we had to the fullest. I'll greatly miss working with him, but he would be an excellent asset to have on a team where creative problem-solving is revered."</p>
      <p className="text-gray-500">- Ashley Pinales, Latina in Tech | WFM People Leader | ex Grubhub, Wayfair</p>
    </div>
    <div>
      <p className="text-xl italic">"Cameron is a highly motivated, passionate, and a hard working human. In my experience working with him he slayed any challenge he was given. He helped bring together three support organizations and set the foundation for our success. I consider myself lucky to have worked with and learned from Cameron. I know he will be beyond successful at anything he does."</p>
      <p className="text-gray-500">- Darin Mellor BA MSM, Project Manager armed with decades of experience in tech</p>
    </div>
    <div>
      <p className="text-xl italic">"Cameron is an exceptionally security minded employee at Dutchie. He has been a security champion for the support team. His proactive recommendations have helped security for the company as a whole."</p>
      <p className="text-gray-500">- Michael Gombos, Infrastructure Guy</p>
    </div>
    <div>
      <p className="text-xl italic">"Cameron is a passionate, intelligent, and overall great person to add to any team."</p>
      <p className="text-gray-500">- Justin Hurst, Dutchie Hardware and Product Support III</p>
    </div>
    <div>
      <p className="text-xl italic">"I've only been working with Cameron for a couple months, but his passion for his work was evident on day one! When he attacks a problem, he comes at it from every angle possible, often in new and unique ways than the rest of the team. He shares ways for the company to improve even when they aren't in his natural swim lane. He's smart, dedicated, and really great guy to boot!"</p>
      <p className="text-gray-500">- KT Ellis, #OpenToWork | OIT #over-40 Leadership | BRMP®</p>
    </div>
    <div>
  <p className="text-xl italic">"Cameron is a force of good in this world. As a senior-level Product Expert for Google Fi, he volunteers his empathy and expertise to assist users on a variety of platforms. His deep product knowledge, creative solutioning, and user-driven insights make him a valued part of the Fi family. He's also a stand-up guy who's just plain fun to interact with."</p>
  <p className="text-gray-500">- Diane Walter, Global Marketer | Storyteller | Fractional Human</p>
</div>
<div>
  <p className="text-xl italic">"Cameron is a great collaborator and team player. He's someone who goes out of his way to ensure and confirm understanding with others when asked for assistance leaving no stone unturned. Cameron has been vital to my onboarding at Dutchie helping me understand some of our more complex CS systems. He constantly displays his professionalism when working with others to ensure the best and most informed outcome for our team."</p>
  <p className="text-gray-500">- Raymond Martinez, Customer Experience Leader | Project Manager</p>
</div>
<div>
  <p className="text-xl italic">"Cameron is one of the most talented and dedicated mentors I've had the privilege of working with in my career. His positive attitude and passion for all things STEM is infectious. I'm forever grateful knowing that I can count on Cameron to provide support to one of our talented Scholars in both personal and professional development during their college careers and beyond."</p>
  <p className="text-gray-500">- Kate Berezo, Community Engagement Director at Thrive Scholars | Driving Social Impact with Top Industry Leaders</p>
</div>
<div>
  <p className="text-xl italic">"Cameron is ridiculously efficient and has always been willing and able to take the lead in a team setting. After working with him, it was clear that he is forward-thinking and open to learning and putting research into new ideas and approaches. After working with him through an internship, I was particularly impressed by his ability to apply his past experience to new technologies and approaches at the moment."</p>
  <p className="text-gray-500">- Patricia Cebotari, Honors Senior in CS, Business, Spanish</p>
</div>
<div>
  <p className="text-xl italic">"I have known Cameron Aaron since he was a first year at Conn when I was filling in for his Intro CS professor one day, and he made an immediate impression on me as a bright and inquisitive student. Cameron clearly has a special ability to make connections between and across various topics, concepts, and ways of thinking. He also has an infectious charisma that has made him naturally emerge as a leader among our students. Cameron is caring and passionate and always exudes a productive positivity. He would be an asset to any organization. Our department will sorely miss him after he graduates this spring!"</p>
  <p className="text-gray-500">- Christine Chung, PhD, Associate Professor of Computer Science at Connecticut College</p>
</div>
<div>
  <p className="text-xl italic">"I only worked with Cameron for a few months as part of a summer internship, but those few months told me everything I need to know about his work ethic and personality. He is a hardworking and intelligent computer scientist and researcher who would be an excellent addition to any team. When we worked together at a VR startup, I always found myself pleasantly surprised by his expansive knowledge, attention to detail, and willingness to wear as many hats as needed. Cameron always gives 110%, and with his wide skillset, he has a lot to offer! I highly recommend Cameron to any employer, you won’t regret it!"</p>
  <p className="text-gray-500">- Karina Sinha, Software Developer at Petricore, Inc</p>
</div>
<div>
  <p className="text-xl italic">"Cameron engaged with the Office of Advancement enthusiastically during his senior year, jumping in always to be of assistance in a variety of ways. With the utmost professionalism and creativity, Cameron has brought all of his academic and professional success into the realm of Advancement and fundraising with kindness and consideration -- truly encompassing what it means to put 'the liberal arts into action'! I'm so excited to see all of the amazing things that Cameron will do in his future, as I'm convinced he'll move mountains."</p>
  <p className="text-gray-500">- Gwendolyn D'Elia, CPTM, Trainer | Salesforce CRM | Agile | Training Specialist within Higher Ed Advancement</p>
</div>
<div>
  <p className="text-xl italic">"I had the pleasure of working with Cameron at C19 BayShield, where we were developing an app to help distribute 3D-printed PPE during the pandemic. I was inspired by both Cameron's technical knowledge in helping deploy the app to Google Play/iOS as well as his dedication and passion for the mission. Cameron was also a natural in project management, setting clear steps for himself as well as the rest of the engineering team all the while balancing his heavy college coursework. I cannot recommend him enough as I know he would be invaluable in any role and environment he is passionate about."</p>
  <p className="text-gray-500">- Shalandy Zhang, Software Engineer at Facebook</p>
</div>
<div>
  <p className="text-xl italic">"Cameron is a rock star!!"</p>
  <p className="text-gray-500">- Amy Peck, XR, Spatial Computing & Emerging Tech Strategist</p>
</div>
<div>
  <p className="text-xl italic">"Cameron is a critical thinker, always coming up with innovative solutions and a good teammate, always ready to help and support over any idea, has professionalism and punctuality."</p>
  <p className="text-gray-500">- Rethek Kumar, Junior Software Engineer at University of Windsor</p>
</div>
<div>
  <p className="text-xl italic">"Cameron has been a great teammate, always ready to take up new tasks, ready to help. Loved working together."</p>
  <p className="text-gray-500">- Anu Kaur, Account Manager and Marketing Manager</p>
</div>
<div>
  <p className="text-xl italic">"Cameron was great to work with on our summer project and really took the initiative. Aside from being friendly and organized, he also has broad technical knowledge which helped develop our project. He is an asset to any team."</p>
  <p className="text-gray-500">- Sara Helin, Product @ Pactio</p>
</div>
<div>
  <p className="text-xl italic">"I’ve had the pleasure of collaborating with Cameron on a project during our fellowship at Nu School. His fresh ideas and perspective, as well as his leadership skills, made virtually working with a team of people who were strangers at first not only easier but also a meaningful learning experience. While our project was short-term, his innovative nature was evident. I have no doubts that Cameron will prove to be a valuable member to any company."</p>
  <p className="text-gray-500">- Danielle Fernandez, Project Manager</p>
</div>
<div>
  <p className="text-xl italic">"Having Cameron on our team was like having a shining lighthouse on the coast of a rocky shoreline, we would be absolutely lost without him. It’s been the utmost pleasure working with this highly talented, versatile, and skilled developer who has consistently gone above and beyond for the team. If you were making one right move for your company, it would be to have Cameron on your team."</p>
  <p className="text-gray-500">- Dylan Arceneaux, Owner and operator at A9 Designs Prototyping and Fabrication</p>
</div>
<div>
  <p className="text-xl italic">"During a 2 week capstone project for his internship, Cameron was given a very broad and vague engineering problem to solve. He and his team took the provided UX flows and were able to piece together multiple solution options. I was incredibly impressed when we needed to change direction as a team, he was able to suggest a new technical solution, on the spot, and clearly articulate the tradeoffs and benefits it would have on our product development going forward. Over the two weeks, he was wonderful to work with, taking the lead of his team and implementing organizational structure that made it even easier for me to manage. I would definitely recommend working with Cameron if you have the chance!"</p>
  <p className="text-gray-500">- Dana Castner, Founder of Choice Tracker, Sr. Product Designer at Able</p>
</div>
<div>
  <p className="text-xl italic">"I worked with Cameron at Github for a summer internship. He is undoubtedly intelligent and hard-working. His strong background in CS combined with his interest in other fields made working with him pleasurable and fun! I know he will have a bright future and I wish to work with him again in the future."</p>
  <p className="text-gray-500">- Tina Taleb, Software Engineer</p>
</div>
<div>
  <p className="text-xl italic">"I am currently overseeing Cameron's independent study in computer programming and artificial intelligence. His mastery of programming languages and tools, willingness to pursue outside-the-box design thinking, and ability to resolve inevitable bugs that arise are a testament to his work ethic and immense potential in this field."</p>
  <p className="text-gray-500">- Chris Wiebe, Head of School -- Tree Academy</p>
</div>
<div>
  <p className="text-xl italic">"Cameron is an exceptionally talented young man with remarkable communication skills and technical abilities. He is strong in his will and determined in everything he does. His professionalism is constant. As a young man he already has an impressive trajectory, having raised thousands of dollars for his school's robotics team and establishing relationships with big companies in the US and other countries. He has skill in HTML, Javascript, Python, CSS, and C++, and he loves learning new things. He is a valuable asset and worthy of strong professional consideration."</p>
  <p className="text-gray-500">- Max Goldberg, Associate Director at Meredith Corporation</p>
</div>
<div>
  <p className="text-xl italic">"Cameron reached out to me when I was at Leap Motion to explore our technology for a school robotics project. I was impressed by his interest in combining several new technologies into what became a very ambitious project. Because Leap Motion was such a small company, it was rare we were able to support such school projects, but we were impressed by Cameron's drive and curiosity - both of which I am sure will serve him well in his future endeavors."</p>
  <p className="text-gray-500">- Amy Peck, XR, Spatial Computing & Emerging Tech Strategist</p>
</div>
<div>
  <p className="text-xl italic">"I’ve had the privilege of working with Cameron for the 2013-2014 FIRST season as a sponsor for Mechanical Paradise, FRC Team 4019. Cameron was always punctual with deadlines and tasks given, making the sponsorship process easy to manage. His passion for the FIRST Robotics program and his positive, go-getter attitude are great assets to his team. I highly believe Cameron will take these attributes and succeed in any journey he pursues in his future."</p>
  <p className="text-gray-500">- Kathryn Owen, Marketing | Events | Trade Shows</p>
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