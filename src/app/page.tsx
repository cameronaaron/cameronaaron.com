import React from 'react';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100">
      <header className="w-full max-w-5xl mx-auto text-center py-8">
        <h1 className="text-4xl font-bold mb-2">Cameron E. Aaron</h1>
        <p className="text-lg font-mono text-gray-700">Software Engineer &amp; Neuroscientist</p>
      </header>

      <section className="w-full max-w-5xl mx-auto mb-12">
        <div className="flex items-center justify-center mb-8">
          <Image
            className="rounded-full"
            src="/profile.jpg"
            alt="Cameron E. Aaron"
            width={180}
            height={180}
            priority
          />
        </div>
        <div className="flex flex-col lg:flex-row items-center justify-between mb-12">
          <a
            className="transition-transform transform hover:scale-105 mx-2"
            href="https://www.linkedin.com/in/kamisama"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/l.png"
              alt="LinkedIn Logo"
              width={100}
              height={24}
              priority
            />
          </a>
        </div>
      </section>

      <nav className="w-full max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 text-center">
        <a href="#about" className="group p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">About</h2>
          <p className="text-sm text-gray-600">Learn about my background and expertise.</p>
        </a>
        <a href="#experience" className="group p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">Experience</h2>
          <p className="text-sm text-gray-600">Explore my professional experience and projects.</p>
        </a>
        <a href="#education" className="group p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">Education</h2>
          <p className="text-sm text-gray-600">See my educational background and qualifications.</p>
        </a>
        <a href="#contact" className="group p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">Contact</h2>
          <p className="text-sm text-gray-600">Get in touch with me for collaborations or inquiries.</p>
        </a>
      </nav>

      <section id="about" className="w-full max-w-5xl mx-auto mb-12 bg-white p-8 rounded-lg shadow">
        <h2 className="text-3xl font-bold mb-4">About Me</h2>
        <p className="text-lg leading-relaxed text-gray-700">
          I’m Cameron Aaron, a seasoned DevOps Engineer with a diverse background in artificial intelligence, neuroscience, software engineering, and aerospace medicine. Over the past six years, I have collaborated with industry leaders like Dutchie, GitHub, SpaceX, and Microsoft, driving innovation and delivering high-quality solutions.
        </p>
      </section>

      <section id="experience" className="w-full max-w-5xl mx-auto mb-12 bg-white p-8 rounded-lg shadow">
        <h2 className="text-3xl font-bold mb-4">Professional Experience</h2>
        <div className="space-y-8">
          <div>
            <div className="flex items-center mb-2">
              <Image src="/ba.svg" alt="Bridges Academy Logo" width={40} height={40} />
              <h3 className="text-2xl font-semibold ml-4">Bridges Academy</h3>
            </div>
            <p className="text-gray-500">Biopsychology Teacher | Jun 2023 - Present</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Teaching biopsychology, focusing on developing comprehensive project-based curriculum.</li>
            </ul>
            <p className="text-gray-500 mt-4">Director of Information Technology Engineering | Mar 2023 - Present</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Established and managed the comprehensive IT infrastructure.</li>
              <li>Provided responsive technical support, ensuring seamless operations and resolving IT-related issues promptly.</li>
              <li>Fostered digital literacy and cybersecurity awareness through regular training sessions for staff and students.</li>
              <li>Developed and enforced IT policies and procedures, establishing a strong foundation for IT governance and cybersecurity best practices.</li>
            </ul>
            <p className="text-gray-500 mt-4">Engineering Teacher | Nov 2022 - Present</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Develop and implement a comprehensive software engineering curriculum.</li>
              <li>Design project-based learning experiences that cater to students' high aptitude, challenging them to apply advanced programming concepts and create software solutions.</li>
            </ul>
            <p className="text-gray-500 mt-4">Safety Team | Aug 2023 - Present</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Lead and manage safety protocols and measures at Bridges Academy.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Image src="/Dutchie.svg" alt="Dutchie Logo" width={40} height={40} />
              <h3 className="text-2xl font-semibold ml-4">Dutchie</h3>
            </div>
            <p className="text-gray-500">Lead Systems Admin | Aug 2022 - Nov 2022</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Identified, diagnosed, and reported technical problems.</li>
              <li>Translated functional requirements into technical requirements.</li>
              <li>Established, implemented, and administered best practices, including systems configuration and light development as necessary.</li>
              <li>Delivered solutions based on business requirements, clearly setting expectations and delivering work on agreed timelines.</li>
              <li>Acted as the primary admin of one or many SaaS systems.</li>
              <li>Cared about customer and employee experience and managed stakeholder expectations.</li>
              <li>Was curious about measuring impact and assisted with analytics requests, building reports and dashboards.</li>
              <li>Acted as a steward for key systems and created technical content to enable users with the platform.</li>
            </ul>
            <p className="text-gray-500 mt-4">Lead Support Systems Analyst | Feb 2022 - Aug 2022</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Developed data-driven systems-related projects.</li>
              <li>Developed thorough, professionally documented, data-driven systems-related projects including migrations and large overhauls or changes.</li>
              <li>Identified data trends displaying systems needs to determine and develop prioritized goals for the Support team.</li>
              <li>Prepared and presented systems status to all leadership and operations stakeholders and ensured the project aligned with organizational goals and operating principles.</li>
              <li>Ensured projects remained on schedule, tested within the ticketing sandboxes when applicable, and documented to gauge impact and adoption.</li>
              <li>Determined and kept system projects within the determined scope, whether budgetary or regarding deliverables.</li>
              <li>Monitored and maintained the end results of all systems changes including rolling out change management with Support Leadership.</li>
            </ul>
            <p className="text-gray-500 mt-4">Project Manager | Aug 2021 - Feb 2022</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Managed and lead projects across the organization.</li>
              <li>Developed thorough, professionally documented, data-driven projects.</li>
              <li>Analyzed team data to determine team necessities and develop prioritized goals.</li>
              <li>Translated raw data to create cohesive, structured, and relevant analysis.</li>
              <li>Prepared and presented project status to all project stakeholders and ensured the project aligned with organizational goals and operating principles.</li>
              <li>Ensured projects remained on schedule, tested, and documented to gauge impact and adoption.</li>
              <li>Designed project outlines including success markers, unique to project specifications.</li>
              <li>Determined and kept projects within the determined scope, whether budgetary or regarding deliverables.</li>
              <li>Monitored and maintained the end results of all assigned projects including rolling out change management with Support Leadership.</li>
              <li>Completed full-bodied project tasks and/or delegated them to help team members achieve goals and ensure successful completion.</li>
            </ul>
            <p className="text-gray-500 mt-4">Product Support Specialist (Tier ll) | Jul 2021 - Aug 2021</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Explained workflows and product configurations to customers.</li>
              <li>Troubleshooted and wrote bugs for unexpected behavior for Engineering.</li>
              <li>Investigated discrepancies and explained findings and paths to resolution with customers.</li>
              <li>Used SQL and Excel skills to create custom reports for customers.</li>
              <li>Assisted in running incidents in cases of an outage.</li>
              <li>Facilitated communication between engineering and the customer.</li>
              <li>Troubleshooted issues with the platform, state traceability systems, 3rd party integrators, and various other external parties.</li>
              <li>Provided basic and targeted training as needed for customers and Tier 1 Support Specialists.</li>
              <li>Assisted teammates in solving new or unique problems and documenting these solutions for future accessibility.</li>
              <li>Identified tools for new and existing products that assisted the teams in providing efficient support.</li>
              <li>Assisted in providing feedback to Product and Engineering with issues, trends, platform workflow optimizations, etc.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Image src="/spacex.svg" alt="SpaceX Logo" width={40} height={40} />
              <h3 className="text-2xl font-semibold ml-4">SpaceX</h3>
            </div>
            <p className="text-gray-500">Aerospace Medicine, Space Operations | Aug 2020 - Dec 2020</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Assisted with SpaceX's COVID response to keep operations running.</li>
              <li>Assisted with SpaceX's COVID response to keep employees and crewmembers safe while keeping operations running.</li>
              <li>Collaborated with academic institutions and/or private organizations on medical research.</li>
              <li>Assisted flight surgeons and medical fellows in research projects, data synthesis, and implementation of deliverables for Starship and Crew Dragon.</li>
              <li>Worked with multidisciplinary teams to accomplish goals involving human spaceflight, public health, and occupational medicine involving SpaceX employees.</li>
              <li>Collected data in occupational health surveillance and public health improvement projects for SpaceX sites.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Image src="/github.png" alt="GitHub Logo" width={40} height={40} />
              <h3 className="text-2xl font-semibold ml-4">GitHub</h3>
            </div>
            <p className="text-gray-500">Software Engineer | Aug 2019 - Jan 2020</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Worked on internal tools to enhance product functionality and user experience.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <h3 className="text-2xl font-semibold">C19 BayShield</h3>
            </div>
            <p className="text-gray-500">Backend Team Lead Engineer | Apr 2020 - Sep 2020</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Led a team of UC Berkeley engineers.</li>
              <li>Led the backend engineering team that won the Jacobs prize at UC Berkeley.</li>
              <li>Took ownership of the backend team.</li>
              <li>Was in charge of hiring new devs.</li>
              <li>Successfully lead a team that won the Jacobs prize at UC Berkeley.</li>
              <li>Helped engineer an app that helped supply much of central California with PPE.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Image src="/upkey.svg" alt="Upkey Logo" width={40} height={40} />
              <h3 className="text-2xl font-semibold ml-4">Upkey</h3>
            </div>
            <p className="text-gray-500">Program Mentor | Jun 2020 - Feb 2021</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Mentored a group of new grads and taught them about careers and coding skills.</li>
              <li>Hosted twice a week office hours where I answered student questions.</li>
              <li>Assisted students in developing their networking skills.</li>
              <li>Helped students explore opportunities in career development.</li>
            </ul>
            <p className="text-gray-500 mt-4">Product Management Intern | Jun 2020 - Jul 2020</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Owned solving customer problems end-to-end, from strategy to execution by working directly with full-time product managers and a team of designers and engineers.</li>
              <li>Partnered with Product Analysts and UX Research to conduct and examine direct user feedback, qualitative research, and quantitative data to define customer pain points in the website styling space.</li>
              <li>Developed hypotheses and drove creative, cross-functional ideation and solution discovery.</li>
              <li>Defined a set of metrics to measure customer satisfaction and business impact with the ability to analyze them and utilize them in decision-making processes.</li>
              <li>Maintained communication with the entire team to ensure effective collaboration and transparency.</li>
              <li>Presented findings broadly to interested product teams throughout the company.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <h3 className="text-2xl font-semibold">PassionNet</h3>
            </div>
            <p className="text-gray-500">Co Director: New Technologies, Data, and Ethics | Jan 2021 - Aug 2021</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Taught a 4-week long course on AI ethics and Neuroscience to a group of Middle Schoolers.</li>
              <li>Designed a curriculum.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <h3 className="text-2xl font-semibold">Connecticut College</h3>
            </div>
            <p className="text-gray-500">Computational Biology and Informatics Researcher | Jan 2020 - May 2021</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Created Apache spark pipeline to analyze single nucleotide polymorphisms.</li>
              <li>Used Google Cloud Life Sciences to process, analyze, and annotate genomics.</li>
              <li>Created algorithms to analyze medical imaging from DICOM files in order to better identify abnormalities.</li>
              <li>Engineered a web app to pull in digital medical records, biometric data from wearables, and genetic info into one place.</li>
              <li>Developed a Python application to collect and analyze EEG data.</li>
            </ul>
            <p className="text-gray-500 mt-4">Summer Science Research Institute Bioinformatics and Computational Biology Researcher | May 2020 - Jun 2020</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Created Apache spark pipeline to analyze single nucleotide polymorphisms.</li>
              <li>Used Google Cloud Life Sciences to process, analyze, and annotate genomics.</li>
              <li>Created algorithms to analyze medical imaging from DICOM files in order to better identify abnormalities.</li>
              <li>Engineered a web app to pull in digital medical records, biometric data from wearables, and genetic info into one place.</li>
            </ul>
            <p className="text-gray-500 mt-4">CameLAB Neuroscience Lab Research Assistant | Aug 2017 - May 2021</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Set up experiments using 3D Reach Tracker, EEG, and eye-tracking technology.</li>
              <li>Used Matlab to analyze data.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Image src="/google.svg" alt="Google Logo" width={40} height={40} />
              <h3 className="text-2xl font-semibold ml-4">Google</h3>
            </div>
            <p className="text-gray-500">CSSI Section Leader &amp; Student Mentor | Jun 2020 - Sep 2020</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Was selected by Google to work as an algorithms TA and Student mentor for the Google education team.</li>
              <li>In charge of mentoring and teaching a group of 50 students.</li>
              <li>Made sure group had at least a 95% pass rate in their class.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <h3 className="text-2xl font-semibold">Helping Hands Community</h3>
            </div>
            <p className="text-gray-500">Field Operations Engineering Specialist | Jun 2020 - Sep 2020</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Developed the HHC website.</li>
              <li>Created partnerships with the community.</li>
              <li>Supported volunteers.</li>
              <li>Worked closely with the COO and Engineering team to address issues.</li>
              <li>Worked at a company co-founded by Pedram Keyani, Former Director of Engineering at Facebook and Uber, and started by talented tech folks with big hearts from Uber, Lyft, Google, WhatsApp, and Facebook who joined forces to create a platform for those able to help, to connect with those struggling most with current events: the elderly, immunocompromised, and at-risk in communities.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <h3 className="text-2xl font-semibold">Nu School</h3>
            </div>
            <p className="text-gray-500">Technology Fellow | Jul 2020</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Participated in a week of training and webinars, improving soft skills and important processes, such as building an MVP.</li>
              <li>Used learnings to lead a global team to build an MVP and design a prototype for an idea that helped reduce food waste.</li>
              <li>Pitched idea to the CEO of PersistIQ and answered questions.</li>
              <li>Continued working on the idea as a team after the program.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Image src="/wurrly.jpg" alt="Wurrly Logo" width={40} height={40} />
              <h3 className="text-2xl font-semibold ml-4">Wurrly</h3>
            </div>
            <p className="text-gray-500">QA Engineer | May 2015 - Aug 2015</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Conducted regression testing and developed automation scripts for the Wurrly application.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Image src="/ted.png" alt="TED Conferences Logo" width={40} height={40} />
              <h3 className="text-2xl font-semibold ml-4">TED Conferences</h3>
            </div>
            <p className="text-gray-500">Lead Organizer TEDxYouth@NewLondon | Jul 2018 - Dec 2019</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Organized and managed TEDx events focusing on youth engagement and innovative ideas.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Image src="/2e.png" alt="2eNews Logo" width={40} height={40} />
              <h3 className="text-2xl font-semibold ml-4">2eNews</h3>
            </div>
            <p className="text-gray-500">Variations 2e Article Writer | Dec 2018 - Jun 2019</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Wrote an article on 2E in the workplace, featured in the Spring 2019 issue of Variations 2E magazine.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <h3 className="text-2xl font-semibold">Clues Inc.</h3>
            </div>
            <p className="text-gray-500">Creator | Feb 2017 - 2019</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Created and published a comic book to promote awareness about the benefits of neurodiversity.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <Image src="/ba.svg" alt="The Bridges 2e Center Logo" width={40} height={40} />
              <h3 className="text-2xl font-semibold ml-4">The Bridges 2e Center for Research and Professional Development</h3>
            </div>
            <p className="text-gray-500">Panelist at VISION & LEADERSHIP 2e SYMPOSIUM 2019 | Oct 2018 - Oct 2018</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Participated as a panelist, discussing topics related to twice-exceptional education and leadership.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="education" className="w-full max-w-5xl mx-auto mb-12 bg-white p-8 rounded-lg shadow">
        <h2 className="text-3xl font-bold mb-4">Education</h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-semibold">Bridges Graduate School of Cognitive Diversity in Education</h3>
            <p className="text-gray-500">M.Ed. Program in Cognitive Diversity | May 2023 - May 2025</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Focus on development of advanced abilities and areas of challenge in learning, self-regulation, and social skills.</li>
              <li>Term Honor: Dean's List</li>
            </ul>
            <p className="text-gray-500 mt-4">Certificate in Twice Exceptional Education | Aug 2023 - Jun 2024</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Specialized education methods for students who are both gifted and challenged.</li>
              <li>Term Honor: Dean's List</li>
            </ul>
          </div>

          <div>
            <h3 className="text-2xl font-semibold">Connecticut College</h3>
            <p className="text-gray-500">BA, Computer Science and Psychology, Minor in Cognitive Science | Aug 2017 - May 2021</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Research: Mechanisms of attentional processing, Bioinformatics and Computational Biology, Cyber Security and Network Infrastructure, Robotics and Artificial Intelligence </li>
              <li>Advisory Committee: Gary Parker, Joseph A. Schroeder, Jefferson A Singer</li>
            </ul>
          </div>

          <div>
            <h3 className="text-2xl font-semibold">Coursera</h3>
            <p className="text-gray-500">Certificates</p>
            <ul className="list-disc pl-8 text-gray-700">
              <li>Cloud Engineering with GCP by Google Cloud</li>
              <li>Google IT Automation with Python</li>
              <li>Google IT Support by Google</li>
              <li>G Suite Administration Specialization</li>
              <li>Architecting with Google Compute Engine</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="honors-awards" className="w-full max-w-5xl mx-auto mb-12 bg-white p-8 rounded-lg shadow">
        <h2 className="text-3xl font-bold mb-4">Honors & Awards</h2>
        <div className="space-y-8">
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
      </section>

      <section id="testimonials" className="w-full max-w-5xl mx-auto mb-12 bg-white p-8 rounded-lg shadow">
        <h2 className="text-3xl font-bold mb-4">Testimonials</h2>
        <div className="space-y-8">
          <div>
            <p className="text-xl italic">"Cameron is a smart, well-spoken, inquisitive worker who always digs deeper to understand the whys, hows and outcome of any task. During his time at Dutchie, I saw him work on a handful of extremely difficult projects with the utmost professionalism and dedication. Any company would be lucky to have Cameron as an employee."</p>
            <p className="text-gray-500 mt-2">- Vinicius SantAnna, Former HubSpot and Dutchie</p>
          </div>

          <div>
            <p className="text-xl italic">"Cameron is a highly empathetic and talented Engineer. Cameron is customer-obsessed, an amazing team player and was a wonderful addition to our digital support team. I’d love an opportunity to work with Cameron again."</p>
            <p className="text-gray-500 mt-2">- Andrea Griffiths PMP CCSK, Senior Product Manager at GitHub</p>
          </div>

          <div>
            <p className="text-xl italic">"Cameron engaged with the career office in his early days as a student at Connecticut College. His intellectual curiosity launched his academic career in computer classes as well as film and literature courses. Cameron has encompassed all aspects of the liberal arts and has been open to learning everything. His ability to think creatively and to be somewhat fearless, has allowed him to draw connections that I don't think the average student would see. As a result, Cameron has been able to secure coveted internship opportunities during his time as a student. I totally expect Cameron to invent or be a part of a team who invents the next best thing! When that happens, I'll be on the sidelines saying, 'I told you!!' I'm so proud of you, Cameron!"</p>
            <p className="text-gray-500 mt-2">- Persephone L. Hall, Dedicated leader in career development</p>
          </div>

          <div>
            <p className="text-xl italic">"Cameron is a wonderful collaborator. He has been an incredible resource for our school. His multi-faceted expertise (pedagogy, tech, and project development) has supported our students and staff immensely."</p>
            <p className="text-gray-500 mt-2">- JoeAnna McDonald, MA Mathematics</p>
          </div>

          <div>
            <p className="text-xl italic">"Cameron is a passionate and dedicated professional that is a welcomed addition to any team. It's evident he cares about his work, works hard, and gives his all in whatever role he finds himself in."</p>
            <p className="text-gray-500 mt-2">- Nate Ledbury, Certified Salesforce Administrator</p>
          </div>

          <div>
            <p className="text-xl italic">"Cameron performed cybersecurity research for Connecticut College during his time as an undergrad. His interest in white hat hacking and his ability to find vulnerabilities was an asset to his research. He found several vulnerabilities in our systems by utilizing different tools to detect them while having zero impact on the college's network. His research provided the college with proof of concept of how threat actors could take advantage of some of our vulnerabilities. We were able to make mitigations based on his findings. Cameron is a thorough investigator who likes to understand problems and get to the bottom of a solution. He is easygoing and a joy to work with. I'd recommend him for any position."</p>
            <p className="text-gray-500 mt-2">- H. John Schaeffer, CISO and Director of Networks, Servers & Security at Connecticut College</p>
          </div>
        </div>
      </section>

      <section id="contact" className="w-full max-w-5xl mx-auto mb-12 bg-white p-8 rounded-lg shadow">
        <h2 className="text-3xl font-bold mb-4">Contact</h2>
        <p className="text-xl mb-4">
          Feel free to reach out to me for any inquiries or collaborations:
        </p>
        <ul className="text-lg text-gray-700">
          <li>Email: <a href="mailto:cameronaaron1@gmail.com" className="text-blue-500 hover:underline">cameronaaron1@gmail.com</a></li>
          <li>LinkedIn: <a href="https://www.linkedin.com/in/kamisama" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">linkedin.com/in/kamisama</a></li>
        </ul>
      </section>
    </main>
  );
}
