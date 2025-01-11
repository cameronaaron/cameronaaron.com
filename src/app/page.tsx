'use client';  // If you’re on Next 13's `/app` directory, otherwise remove for Next 12 /pages

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

/**
 * FULL CODE for your personal website. 
 * Looks like a Google-quality site with top-notch SEO, structured data, 
 * optimized performance, and professional styling.
 */
export default function Home() {
  return (
    <>
      {/******************************************************************
       *  HEAD SECTION - SEO and Structured Data
       ******************************************************************/}
      <Head>
        <title>Cameron E. Aaron - Software Engineer & Neuroscientist</title>
        <meta
          name="description"
          content="Explore the portfolio and achievements of Cameron E. Aaron, a seasoned Product Manager, Software Engineer, and Neuroscientist with a rich background in AI, neuroscience, and aerospace medicine."
        />
        <meta
          name="keywords"
          content="Cameron E. Aaron, Software Engineer, Neuroscientist, DevOps, AI, Neuroscience, Aerospace Medicine, GitHub, SpaceX, Dutchie, Microsoft"
        />
        <meta name="author" content="Cameron E. Aaron" />

        {/* Open Graph */}
        <meta property="og:title" content="Cameron E. Aaron - Software Engineer & Neuroscientist" />
        <meta
          property="og:description"
          content="Cameron E. Aaron is a seasoned Product Manager and Software Engineer with a diverse background in AI, neuroscience, software engineering, and aerospace medicine."
        />
        <meta property="og:image" content="/profile.webp" />
        <meta property="og:url" content="https://cameronaaron.com" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="cameronaaron.com" />
        <meta property="twitter:url" content="https://cameronaaron.com" />
        <meta
          name="twitter:title"
          content="Cameron E. Aaron - Software Engineer & Neuroscientist"
        />
        <meta
          name="twitter:description"
          content="Seasoned Product Manager and Software Engineer with a diverse background in AI, neuroscience, software engineering, and aerospace medicine."
        />
        <meta name="twitter:image" content="/profile.webp" />

        {/* Canonical */}
        <link rel="canonical" href="https://cameronaaron.com" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Cameron E. Aaron",
              "url": "https://cameronaaron.com/",
              "image": "https://cameronaaron.com/profile.webp",
              "jobTitle": "Software Engineer & Neuroscientist",
              "sameAs": [
                "https://twitter.com/cameronaaron4",
                "https://www.linkedin.com/in/kamisama",
                "https://github.com/cameronaaron",
                "https://linktr.ee/cameronaaron",
                "https://www.facebook.com/cameron.kami.aaron/",
                "https://instagram.com/cameronaaronofficial",
                "https://www.youtube.com/channel/UCVaw-r9lsNYEEi4-mKVKCKA",
                "https://soundcloud.com/cameron-aaron",
                "https://medium.com/@cameronaaron",
                "https://www.reddit.com/u/cameronaaron1"
              ],
              "alumniOf": [
                {
                  "@type": "CollegeOrUniversity",
                  "name": "Connecticut College",
                  "sameAs": "https://www.conncoll.edu/"
                },
                {
                  "@type": "CollegeOrUniversity",
                  "name": "Bridges Graduate School of Cognitive Diversity in Education",
                  "sameAs": "https://www.bridges.edu/"
                },
                {
                  "@type": "CollegeOrUniversity",
                  "name": "Illinois Institute of Technology",
                  "sameAs": "https://www.iit.edu/"
                }
              ],
              "hasCredential": [
                {
                  "@type": "EducationalOccupationalCredential",
                  "credentialCategory": "Bachelor's degree",
                  "description": "Bachelor of Science in Computer Science from Connecticut College",
                  "educationalLevel": "Bachelor's"
                },
                {
                  "@type": "EducationalOccupationalCredential",
                  "credentialCategory": "Bachelor's degree",
                  "description": "Bachelor of Arts in Psychology from Connecticut College",
                  "educationalLevel": "Bachelor's"
                },
                {
                  "@type": "EducationalOccupationalCredential",
                  "credentialCategory": "Master's degree",
                  "description": "Master of Education in Cognitive Diversity from Bridges Graduate School of Cognitive Diversity in Education",
                  "educationalLevel": "Master's"
                },
                {
                  "@type": "EducationalOccupationalCredential",
                  "credentialCategory": "Certificate",
                  "description": "Certificate in Twice Exceptional Education from Bridges Graduate School of Cognitive Diversity in Education"
                },
                {
                  "@type": "EducationalOccupationalCredential",
                  "credentialCategory": "Master's degree",
                  "description": "Master of Business Administration (MBA) in Computer/Information Technology Administration and Management from Illinois Institute of Technology",
                  "educationalLevel": "Master's"
                }
              ],
              "knowsLanguage": [
                { "@type": "Language", "name": "Chinese" },
                { "@type": "Language", "name": "Spanish" },
                { "@type": "Language", "name": "Vietnamese" },
                { "@type": "Language", "name": "English" },
                { "@type": "Language", "name": "Korean" },
                { "@type": "Language", "name": "Japanese" }
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "Customer Support",
                "telephone": "[redacted-phone]",
                "email": "cameronaaron1@gmail.com",
                "url": "https://cameronaaron.com/"
              },
              "affiliation": [
                {
                  "@type": "Organization",
                  "name": "Google",
                  "description": "Product Expert - Project Fi and Pixel"
                },
                {
                  "@type": "Organization",
                  "name": "TED Conferences",
                  "description": "Lead Organizer TEDxYouth@NewLondon"
                }
              ],
              "worksFor": [
                {
                  "@type": "Organization",
                  "name": "Dutchie",
                  "sameAs": "https://dutchie.com/"
                },
                {
                  "@type": "Organization",
                  "name": "GitHub",
                  "sameAs": "https://github.com/"
                },
                {
                  "@type": "Organization",
                  "name": "SpaceX",
                  "sameAs": "https://spacex.com/"
                },
                {
                  "@type": "Organization",
                  "name": "Microsoft",
                  "sameAs": "https://microsoft.com/"
                }
              ],
              "honor": [
                {
                  "@type": "CreativeWork",
                  "name": "Ammerman Center Bridget Baird Award for excellence in research in arts and technology"
                },
                {
                  "@type": "CreativeWork",
                  "name": "Bridges Diamond Award for exemplary commitment and service to the school community"
                }
              ]
            }),
          }}
        />
      </Head>

      {/******************************************************************
       *  MAIN CONTENT
       ******************************************************************/}
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-100 flex flex-col items-center p-4 sm:p-8 md:p-12">
        {/******************************************************************
         *  STICKY NAVBAR
         ******************************************************************/}
        <motion.header
          className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md shadow-sm"
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          <nav className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4">
            <Link
              href="#"
              className="text-lg md:text-xl font-extrabold text-gray-800 hover:text-blue-700 transition-colors"
            >
              C.E.A.
            </Link>

            <ul className="flex space-x-4 md:space-x-6">
              {["About", "Experience", "Education", "Projects", "Testimonials", "Contact"].map(
                (section) => (
                  <motion.li
                    key={section}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-gray-700 hover:text-blue-700 transition-colors text-sm md:text-base font-semibold"
                  >
                    <Link href={`#${section.toLowerCase()}`}>{section}</Link>
                  </motion.li>
                )
              )}
            </ul>
          </nav>
        </motion.header>

        {/******************************************************************
         *  HERO SECTION
         ******************************************************************/}
        <motion.section
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="flex flex-col items-center text-center mt-12 mb-8 max-w-3xl w-full"
        >
          <motion.h1
            className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600">
              Cameron E. Aaron
            </span>
          </motion.h1>
          <p className="text-lg md:text-xl text-gray-700 font-mono">
            Software Engineer & Neuroscientist
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2 }}
            className="my-8"
          >
            <Image
              className="rounded-full ring-4 ring-blue-200"
              src="/profile.webp"
              alt="Cameron E. Aaron"
              width={180}
              height={180}
              loading="eager"
              priority
            />
          </motion.div>
        </motion.section>

        {/******************************************************************
         *  QUICK LINKS SECTION
         ******************************************************************/}
        <section className="w-full max-w-6xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12 text-center">
          {[
            { name: "About", desc: "Learn more about me" },
            { name: "Experience", desc: "View my work history" },
            { name: "Education", desc: "My academic credentials" },
            { name: "Testimonials", desc: "See what others say" },
            { name: "Contact", desc: "Get in touch with me" },
            { name: "Projects", desc: "Explore my portfolio" }
          ].map((item, i) => (
            <motion.a
              key={item.name}
              href={`#${item.name.toLowerCase()}`}
              className="group bg-white rounded-xl shadow-lg p-4 border border-gray-100 hover:shadow-xl transition"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
            >
              <h2 className="text-xl font-bold mb-2 text-gray-800 group-hover:text-blue-600">
                {item.name}
              </h2>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </motion.a>
          ))}
        </section>

        {/******************************************************************
         *  ABOUT
         ******************************************************************/}
        <ContentSection
          id="about"
          title="About Me"
          text={`
I'm Cameron Aaron, a seasoned Product Manager and Software Engineer with a diverse background in artificial intelligence, neuroscience, software engineering, and aerospace medicine. Over the past six years, I have collaborated with industry leaders like Dutchie, GitHub, SpaceX, and Microsoft, driving innovation and delivering high-quality solutions.

As a DevOps Engineer, I've applied my extensive knowledge and skills to create innovative solutions for complex problems across various domains. I am also a recognized Google Product Expert, known for my contributions to the Google community and products.

With over six years of experience in the tech industry, I have consistently delivered high-quality products and services. My passion lies in advancing education and research, particularly at the intersection of AI and cognitive neuroscience. I hold multiple certifications and awards in these fields, along with a double major in Computer Science and Psychology, a minor in Cognitive Science, and a Certificate of Arts and Technology from Connecticut College.
          `}
        />

        {/******************************************************************
         *  EXPERIENCE
         ******************************************************************/}
        <ExperienceSection />

        {/******************************************************************
         *  EDUCATION
         ******************************************************************/}
        <EducationSection />

        {/******************************************************************
         *  HONORS & AWARDS
         ******************************************************************/}
        <HonorsSection />

        {/******************************************************************
         *  PROJECTS
         ******************************************************************/}
        <ProjectsSection />

        {/******************************************************************
         *  TESTIMONIALS
         ******************************************************************/}
        <TestimonialsSection />

        {/******************************************************************
         *  CONTACT
         ******************************************************************/}
        <ContactSection />
      </main>

      {/******************************************************************
       *  FOOTER
       ******************************************************************/}
      <footer className="w-full bg-gray-50 py-6 mt-12 text-center border-t border-gray-200">
        <p className="text-sm text-gray-600">
          © {new Date().getFullYear()} - Crafted with{' '}
          <span className="text-red-500">&hearts;</span> by Cameron E. Aaron
        </p>
      </footer>
    </>
  );
}

{/******************************************************************
 *  HELPER COMPONENTS
 ******************************************************************/}

/**
 * A general-purpose content section that uses Framer Motion for reveal animations.
 */
function ContentSection({ id, title, text }) {
  return (
    <section id={id} className="w-full max-w-6xl mx-auto mb-12 bg-white p-8 rounded-xl shadow">
      <motion.h2
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9 }}
        className="text-3xl font-extrabold mb-4 text-gray-900"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9 }}
        className="text-lg leading-relaxed text-gray-700 whitespace-pre-line"
      >
        {text}
      </motion.p>
    </section>
  );
}

/**
 * Experience Section
 */
function ExperienceSection() {
  return (
    <section
      id="experience"
      className="w-full max-w-6xl mx-auto mb-12 bg-white p-8 rounded-xl shadow"
    >
      <motion.h2
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9 }}
        className="text-3xl font-extrabold mb-4 text-gray-900"
      >
        Professional Experience
      </motion.h2>
      <ExperienceContent />
    </section>
  );
}

/**
 * Education Section
 */
function EducationSection() {
  return (
    <section
      id="education"
      className="w-full max-w-6xl mx-auto mb-12 bg-white p-8 rounded-xl shadow"
    >
      <motion.h2
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9 }}
        className="text-3xl font-extrabold mb-4 text-gray-900"
      >
        Education
      </motion.h2>
      <EducationContent />
    </section>
  );
}

/**
 * Honors & Awards Section
 */
function HonorsSection() {
  return (
    <section
      id="honors & awards"
      className="w-full max-w-6xl mx-auto mb-12 bg-white p-8 rounded-xl shadow"
    >
      <motion.h2
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9 }}
        className="text-3xl font-extrabold mb-4 text-gray-900"
      >
        Honors & Awards
      </motion.h2>
      <HonorsContent />
    </section>
  );
}

/**
 * Projects Section
 */
function ProjectsSection() {
  return (
    <section
      id="projects"
      className="w-full max-w-6xl mx-auto mb-12 bg-white p-8 rounded-xl shadow"
    >
      <motion.h2
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="text-3xl font-extrabold mb-4 text-gray-900"
      >
        Projects
      </motion.h2>
      <ProjectsContent />
    </section>
  );
}

/**
 * Testimonials Section
 */
function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="w-full max-w-6xl mx-auto mb-12 bg-white p-8 rounded-xl shadow"
    >
      <motion.h2
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="text-3xl font-extrabold mb-4 text-gray-900"
      >
        Testimonials
      </motion.h2>
      <TestimonialsContent />
    </section>
  );
}

/**
 * Contact Section
 */
function ContactSection() {
  return (
    <section
      id="contact"
      className="w-full max-w-6xl mx-auto mb-12 bg-white p-8 rounded-xl shadow"
    >
      <motion.h2
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="text-3xl font-extrabold mb-4 text-gray-900"
      >
        Contact
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="text-xl mb-4 text-gray-800"
      >
        Feel free to reach out to me for any inquiries or collaborations:
      </motion.p>
      <ul className="text-lg text-gray-800">
        <motion.li
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          Email:{' '}
          <a
            href="mailto:cameronaaron1@gmail.com"
            className="text-blue-700 hover:underline"
          >
            cameronaaron1@gmail.com
          </a>
        </motion.li>
        <motion.li
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          LinkedIn:{' '}
          <a
            href="https://www.linkedin.com/in/kamisama"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline"
          >
            linkedin.com/in/kamisama
          </a>
        </motion.li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href="https://twitter.com/cameronaaron4"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            alt="Twitter Badge"
            src="https://img.shields.io/badge/-@cameronaaron4-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white"
          />
        </a>

        <a
          href="https://github.com/cameronaaron"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            alt="GitHub Badge"
            src="https://img.shields.io/badge/-cameronaaron-181717?style=for-the-badge&logo=github&logoColor=white"
          />
        </a>
        <a
          href="https://linktr.ee/cameronaaron"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            alt="Linktree Badge"
            src="https://img.shields.io/badge/-linktree-39E09B?style=for-the-badge&logo=linktree&logoColor=white"
          />
        </a>
      </div>
    </section>
  );
}

{/******************************************************************
 *  CONTENT BLOCKS (ExperienceContent, EducationContent, etc.)
 *  Extracted into separate components for clarity.
 ******************************************************************/}

/**
 * Simple reusable Motion Div helper for fade-up animations.
 */
function MotionDiv({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="mb-8"
    >
      {children}
    </motion.div>
  );
}

/**
 * EXPERIENCE CONTENT
 */
function ExperienceContent() {
  return (
    <div className="space-y-8">
      {/* === BRIDGES ACADEMY === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/ba.webp" alt="Bridges Academy Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold ml-4 text-gray-900">Bridges Academy</h3>
        </div>
        <p className="text-gray-500">Biopsychology Teacher | Jun 2023 - Present</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Teaching biopsychology, focusing on developing comprehensive project-based curriculum.</li>
        </ul>
        <p className="text-gray-500 mt-4">Director of Information Technology Engineering | Mar 2023 - Present</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Established and managed the comprehensive IT infrastructure.</li>
          <li>Provided responsive technical support, ensuring seamless operations and resolving IT-related issues promptly.</li>
          <li>Fostered digital literacy and cybersecurity awareness through regular training sessions for staff and students.</li>
          <li>Developed and enforced IT policies and procedures, establishing a strong foundation for IT governance and cybersecurity best practices.</li>
        </ul>
        <p className="text-gray-500 mt-4">Engineering Teacher | Nov 2022 - Present</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Develop and implement a comprehensive software engineering curriculum.</li>
          <li>Design project-based learning experiences that cater to students' high aptitude, challenging them to apply advanced programming concepts and create software solutions.</li>
        </ul>
        <p className="text-gray-500 mt-4">Safety Team | Aug 2023 - Present</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Lead and manage safety protocols and measures at Bridges Academy.</li>
        </ul>
      </MotionDiv>

      {/* === DUTCHIE === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/Dutchie.svg" alt="Dutchie Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold ml-4 text-gray-900">Dutchie</h3>
        </div>
        <p className="text-gray-500">Lead Systems Admin | Aug 2022 - Nov 2022</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Identified, diagnosed, and reported technical problems.</li>
          <li>Translated functional requirements into technical requirements.</li>
          <li>Established, implemented, and administered best practices, including systems configuration and light development as necessary.</li>
          <li>Delivered solutions based on business requirements, clearly setting expectations and delivering work on agreed timelines.</li>
          <li>Acted as the primary admin of one or many SaaS systems.</li>
          <li>Cared about customer and employee experience and managed stakeholder expectations.</li>
          <li>Curious about measuring impact and assisted with analytics requests, building reports and dashboards.</li>
          <li>Acted as a steward for key systems and created technical content to enable users with the platform.</li>
        </ul>
        <p className="text-gray-500 mt-4">Lead Support Systems Analyst | Feb 2022 - Aug 2022</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Developed data-driven systems-related projects including migrations and major overhauls.</li>
          <li>Identified data trends to determine and develop prioritized goals for Support.</li>
          <li>Presented systems status to leadership, aligning with org goals and operating principles.</li>
          <li>Ensured timeline adherence, tested changes, documented, and gauged adoption impact.</li>
          <li>Maintained system changes and led change management with Support Leadership.</li>
        </ul>
        <p className="text-gray-500 mt-4">Project Manager | Aug 2021 - Feb 2022</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Managed and led projects across the organization.</li>
          <li>Analyzed team data to develop prioritized goals.</li>
          <li>Prepared and presented project status to stakeholders, ensuring alignment with org goals.</li>
          <li>Designed project outlines with success markers and tested/documented results.</li>
          <li>Maintained final outcomes of assigned projects, facilitating effective change management.</li>
        </ul>
        <p className="text-gray-500 mt-4">Product Support Specialist (Tier ll) | Jul 2021 - Aug 2021</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Explained workflows and product configurations to customers.</li>
          <li>Investigated discrepancies, wrote bugs, and troubleshot unexpected behavior for Engineering.</li>
          <li>Used SQL/Excel for custom reports, assisted during outages, and served as a liaison with customers.</li>
          <li>Provided training for customers and Tier 1 Support Specialists, documented solutions.</li>
        </ul>
      </MotionDiv>

      {/* === SPACEX === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/spacex.webp" alt="SpaceX Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold ml-4 text-gray-900">SpaceX</h3>
        </div>
        <p className="text-gray-500">Aerospace Medicine, Space Operations | Aug 2020 - Dec 2020</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Assisted with SpaceX's COVID response to keep operations running safely.</li>
          <li>Collaborated with academic/private institutions on medical research.</li>
          <li>Supported flight surgeons/medical fellows with data analysis/deliverables for Starship/Crew Dragon.</li>
          <li>Worked on occupational/public health improvements for SpaceX employees.</li>
        </ul>
      </MotionDiv>

      {/* === GITHUB === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/github.webp" alt="GitHub Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold ml-4 text-gray-900">GitHub</h3>
        </div>
        <p className="text-gray-500">Software Engineer | Aug 2019 - Jan 2020</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Developed internal tools to enhance product functionality and user experience.</li>
        </ul>
      </MotionDiv>

      {/* === C19 BAYSHIELD === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/bay.webp" alt="C19 BayShield" width={40} height={40} />
          <h3 className="text-2xl font-semibold text-gray-900">C19 BayShield</h3>
        </div>
        <p className="text-gray-500">Backend Team Lead Engineer | Apr 2020 - Sep 2020</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Led a team of UC Berkeley engineers; won the Jacobs prize at UC Berkeley.</li>
          <li>Took ownership of the backend team, led hiring, and coordinated dev tasks.</li>
          <li>Engineered an app that provided central California with needed PPE.</li>
        </ul>
      </MotionDiv>

      {/* === UPKEY === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/upkey.webp" alt="Upkey Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold ml-4 text-gray-900">Upkey</h3>
        </div>
        <p className="text-gray-500">Program Mentor | Jun 2020 - Feb 2021</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Mentored new grads on careers and coding skills; hosted weekly office hours.</li>
          <li>Helped students build networking skills and explore career development.</li>
        </ul>
        <p className="text-gray-500 mt-4">Product Management Intern | Jun 2020 - Jul 2020</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Owned solving customer problems end-to-end with PMs, designers, and engineers.</li>
          <li>Leveraged user feedback/research to define pain points and drive solution discovery.</li>
          <li>Developed metrics, tested solutions, and presented findings to product teams.</li>
        </ul>
      </MotionDiv>

      {/* === PASSIONNET === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/pass.webp" alt="PassionNet" width={40} height={40} />
          <h3 className="text-2xl font-semibold text-gray-900">PassionNet</h3>
        </div>
        <p className="text-gray-500">Co Director: New Technologies, Data, and Ethics | Jan 2021 - Aug 2021</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Taught a 4-week AI ethics and Neuroscience course for middle schoolers.</li>
          <li>Designed the curriculum focusing on responsible AI usage.</li>
        </ul>
      </MotionDiv>

      {/* === CONNECTICUT COLLEGE === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/conn.svg.webp" alt="Connecticut College" width={40} height={40} />
          <h3 className="text-2xl font-semibold text-gray-900">Connecticut College</h3>
        </div>
        <p className="text-gray-500">Computational Biology and Informatics Researcher | Jan 2020 - May 2021</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Created Apache Spark pipelines to analyze single nucleotide polymorphisms.</li>
          <li>Used Google Cloud Life Sciences to process, analyze, and annotate genomics.</li>
          <li>Developed algorithms for medical imaging analysis in DICOM files to detect abnormalities.</li>
          <li>Engineered a web app for digital medical records, wearables data, and genetic info integration.</li>
          <li>Built a Python application for EEG data collection and analysis.</li>
        </ul>
        <p className="text-gray-500 mt-4">
          Summer Science Research Institute Bioinformatics & Computational Biology | May 2020 - Jun 2020
        </p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Expanded upon the Spark pipeline approach for genomics and imaging analysis.</li>
        </ul>
        <p className="text-gray-500 mt-4">CameLAB Neuroscience Lab Research Assistant | Aug 2017 - May 2021</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Set up experiments using 3D Reach Tracker, EEG, and eye-tracking tech.</li>
          <li>Analyzed data using MATLAB.</li>
        </ul>
      </MotionDiv>

      {/* === GOOGLE === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/google.webp" alt="Google Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold ml-4 text-gray-900">Google</h3>
        </div>
        <p className="text-gray-500">CSSI Section Leader & Student Mentor | Jun 2020 - Sep 2020</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Selected by Google as an Algorithms TA/mentor for ~50 students.</li>
          <li>Ensured a 95% pass rate in the class.</li>
        </ul>
      </MotionDiv>

      {/* === HELPING HANDS COMMUNITY === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/hhc.webp" alt="Helping Hands Community Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold text-gray-900">Helping Hands Community</h3>
        </div>
        <p className="text-gray-500">Field Operations Engineering Specialist | Jun 2020 - Sep 2020</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Developed the HHC website and created community partnerships.</li>
          <li>Worked with the COO/Engineering team to resolve issues and support volunteers.</li>
          <li>Collaborated with a team originally from Uber, Lyft, Google, WhatsApp, and Facebook.</li>
        </ul>
      </MotionDiv>

      {/* === NU SCHOOL === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/nu.webp" alt="Nu School Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold text-gray-900">Nu School</h3>
        </div>
        <p className="text-gray-500">Technology Fellow | Jul 2020</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Underwent training/webinars on building MVPs and product processes.</li>
          <li>Led a global team to prototype an idea aimed at reducing food waste.</li>
          <li>Presented to the CEO of PersistIQ, continued refining the project post-program.</li>
        </ul>
      </MotionDiv>

      {/* === WURRLY === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/wurrly.webp" alt="Wurrly Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold ml-4 text-gray-900">Wurrly</h3>
        </div>
        <p className="text-gray-500">QA Engineer | May 2015 - Aug 2015</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Performed regression testing and developed automation scripts for the Wurrly app.</li>
        </ul>
      </MotionDiv>

      {/* === TED CONFERENCES === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/ted.webp" alt="TED Conferences Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold ml-4 text-gray-900">TED Conferences</h3>
        </div>
        <p className="text-gray-500">Lead Organizer TEDxYouth@NewLondon | Jul 2018 - Dec 2019</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Organized and managed TEDx events focused on youth engagement and innovation.</li>
        </ul>
      </MotionDiv>

      {/* === 2ENEWS === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/2e.webp" alt="2eNews Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold ml-4 text-gray-900">2eNews</h3>
        </div>
        <p className="text-gray-500">Variations 2e Article Writer | Dec 2018 - Jun 2019</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Wrote an article on 2E in the workplace, featured in the Spring 2019 issue of Variations 2E magazine.</li>
        </ul>
      </MotionDiv>

      {/* === CLUES INC. === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/ba.webp" alt="Bridges Academy Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold text-gray-900">Clues Inc.</h3>
        </div>
        <p className="text-gray-500">Creator | Feb 2017 - 2019</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Authored and published a comic book promoting neurodiversity awareness.</li>
        </ul>
      </MotionDiv>

      {/* === THE BRIDGES 2E CENTER === */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/2ecen.webp" alt="The Bridges 2e Center Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold ml-4 text-gray-900">
            The Bridges 2e Center for Research and Professional Development
          </h3>
        </div>
        <p className="text-gray-500">
          Panelist at VISION & LEADERSHIP 2e SYMPOSIUM 2019 | Oct 2018 - Oct 2018
        </p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Discussed twice-exceptional education and leadership as a featured panelist.</li>
        </ul>
      </MotionDiv>
    </div>
  );
}

/**
 * EDUCATION CONTENT
 */
function EducationContent() {
  return (
    <div className="space-y-8">
      <MotionDiv>
        <Image src="/bgrad.webp" alt="Bridges Graduate School Logo" width={40} height={40} />
        <h3 className="text-2xl font-semibold text-gray-900 mt-2">
          Bridges Graduate School of Cognitive Diversity in Education
        </h3>
        <p className="text-gray-500">M.Ed. Program in Cognitive Diversity | May 2023 - May 2025</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Focus on developing advanced abilities and addressing learning challenges, self-regulation, and social skills.</li>
          <li>Term Honor: Dean's List</li>
        </ul>
        <p className="text-gray-500 mt-4">Certificate in Twice Exceptional Education | Aug 2023 - Jun 2024</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Specialized educational methods for students who are both gifted and challenged.</li>
          <li>Term Honor: Dean's List</li>
        </ul>
      </MotionDiv>

      <MotionDiv>
        <Image src="/conn.svg.webp" alt="Connecticut College Logo" width={40} height={40} />
        <h3 className="text-2xl font-semibold text-gray-900 mt-2">Connecticut College</h3>
        <p className="text-gray-500">
          BA, Computer Science and Psychology, Minor in Cognitive Science, 
          Certificate in Arts and Technology (Ammerman Center) | Aug 2017 - May 2021
        </p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Research: Attentional processing, Bioinformatics, Cyber Security, Robotics, AI.</li>
          <li>Advisory Committee: Gary Parker, Joseph A. Schroeder, Jefferson A Singer.</li>
        </ul>
      </MotionDiv>

      <MotionDiv>
        <Image src="/coursera.svg.webp" alt="Coursera Logo" width={40} height={40} />
        <h3 className="text-2xl font-semibold text-gray-900 mt-2">Coursera</h3>
        <p className="text-gray-500">Certificates</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Cloud Engineering with GCP by Google Cloud</li>
          <li>Google IT Automation with Python</li>
          <li>Google IT Support by Google</li>
          <li>G Suite Administration Specialization</li>
          <li>Architecting with Google Compute Engine</li>
        </ul>
      </MotionDiv>
    </div>
  );
}

/**
 * HONORS & AWARDS CONTENT
 */
function HonorsContent() {
  return (
    <div className="space-y-8">
      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          Bridges Diamond Awards - Doug Lenzini
        </h3>
        <p className="text-gray-500">Apr 2010, Apr 2012, Apr 2013</p>
        <p className="text-gray-700 mt-2">
          A distinction reserved for students who model exemplary year-long commitment 
          and service to the school community.
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">2eASD grant scholarship - UCONN</h3>
        <p className="text-gray-500">May 2024</p>
        <p className="text-gray-700 mt-2 whitespace-pre-line">
I’m thrilled to share that I have been selected as a recipient of the 2eASD grant scholarship for Confratute 2024! 
This incredible opportunity will allow me to attend the transformative event at the University of Connecticut 
from July 14th to July 18th, where I will gain invaluable knowledge, skills, and strategies to better support 
and engage twice-exceptional (2e) students. ...
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">2020 Impact Labs Fellow</h3>
        <p className="text-gray-500">Jan 2020</p>
        <p className="text-gray-700 mt-2">
          Award recognizing innovative contributions in technology.
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          Computer Science Leader - Connecticut College
        </h3>
        <p className="text-gray-500">Aug 2017</p>
        <p className="text-gray-700 mt-2">
          Leadership role acknowledged at the beginning of academic tenure.
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          Jacobs Design Award (C19 Bayshield)
        </h3>
        <p className="text-gray-500">Jun 2020</p>
        <p className="text-gray-700 mt-2">
          Awarded for leading a team to develop an emergency resource management app, 
          producing over 6300 pieces of PPE.
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          Ammerman Center Bridget Baird Award - Connecticut College
        </h3>
        <p className="text-gray-500">Apr 2021</p>
        <p className="text-gray-700 mt-2">
          Awarded for excellence in research in arts and technology.
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          Top Emerging Talent Summer '21 - Pangea.app
        </h3>
        <p className="text-gray-500">Jun 2021</p>
        <p className="text-gray-700 mt-2">
          Recognized as one of the most promising recent grads across the globe.
        </p>
      </MotionDiv>
    </div>
  );
}

/**
 * PROJECTS CONTENT
 */
function ProjectsContent() {
  return (
    <div className="space-y-8">
      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          <a
            href="https://resumechecker.cameronaaron.com/"
            target="_blank"
            className="text-blue-700 underline"
            rel="noopener noreferrer"
          >
            Resume Feedback Assistant
          </a>
        </h3>
        <p className="text-gray-600">Apr 2024 - Present</p>
        <p className="text-gray-800 mt-2">
          Developed an advanced web application using FastAPI that provides actionable advice 
          to improve resumes based on specific job listings...
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          <a
            href="https://resumetosite.cameronaaron.com/"
            target="_blank"
            className="text-blue-700 underline"
            rel="noopener noreferrer"
          >
            Resume to Personal Web Site Converter
          </a>
        </h3>
        <p className="text-gray-600">Apr 2024 - Present</p>
        <p className="text-gray-800 mt-2">
          Developed a sophisticated FastAPI web app that generates custom Bootstrap websites from user-uploaded resumes...
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          <a
            href="https://slangtranslator.cameronaaron.com"
            target="_blank"
            className="text-blue-700 underline"
            rel="noopener noreferrer"
          >
            Slangtranslator.com
          </a>
        </h3>
        <p className="text-gray-600">Apr 2024 - Present</p>
        <p className="text-gray-800 mt-2">
          Built a FastAPI-based web app that translates internet slang/colloquialisms into standard English using advanced AI models...
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          <a
            href="https://proofread.cameronaaron.com/"
            target="_blank"
            className="text-blue-700 underline"
            rel="noopener noreferrer"
          >
            Academic Paper Reviewer/Proof Reader
          </a>
        </h3>
        <p className="text-gray-600">Aug 2023 - Present</p>
        <p className="text-gray-800 mt-2">
          Created a Flask-based web application offering detailed proofreading and feedback for academic papers using advanced AI...
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          <a
            href="https://translate.cameronaaron.com/"
            target="_blank"
            className="text-blue-700 underline"
            rel="noopener noreferrer"
          >
            Advanced Translation Tool
          </a>
        </h3>
        <p className="text-gray-600">Apr 2023 - Present</p>
        <p className="text-gray-800 mt-2">
          Developed an innovative translation application using FastAPI, providing highly accurate 
          and culturally nuanced translations...
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          <a
            href="https://med.stanford.edu/neurodiversity/SNS2021/Day1.html"
            target="_blank"
            className="text-blue-700 underline"
            rel="noopener noreferrer"
          >
            Stanford Neurodiversity Summit 2021 Panelist
          </a>
        </h3>
        <p className="text-gray-600">Aug 2021 - Present</p>
        <p className="text-gray-800 mt-2">
          Associated with Bridges Academy. Spoke about neurodiversity topics at Stanford’s summit.
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          <a
            href="https://youtu.be/KQkgt8D0ULQ?si=m6wfwGoNzTrEM7z9"
            target="_blank"
            className="text-blue-700 underline"
            rel="noopener noreferrer"
          >
            TED ED Talk: Can Machines Be Creative? 
          </a>
        </h3>
        <p className="text-gray-600">Jan 2015 - Present</p>
        <p className="text-gray-800 mt-2">
          Explores the frontier of machine intelligence, creativity, and the future of AI. 
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          <a
            href="https://en.wikipedia.org/wiki/Rebound_Rumble"
            target="_blank"
            className="text-blue-700 underline"
            rel="noopener noreferrer"
          >
            Rebound Rumble
          </a>
        </h3>
        <p className="text-gray-600">Jan 2012 - Present</p>
        <p className="text-gray-800 mt-2">
          FIRST FRC Team 4019 project: build a robot that autonomously shoots basketball hoops.
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          <a
            href="https://www.conncoll.edu/academics/internships-student-research/student-research-projects/genetic-reflexions-a-magic-mirror-that-displays-genetic-info-about-the-person-with-their-reflection.html"
            target="_blank"
            className="text-blue-700 underline"
            rel="noopener noreferrer"
          >
            “Genetic RefleXions” Magic Mirror
          </a>
        </h3>
        <p className="text-gray-600">May 2021</p>
        <p className="text-gray-600">Recipient of the 2021 Ammerman Center Bridget Baird Award</p>
        <p className="text-gray-800 mt-2">
          A futuristic mirror that displays genetic info alongside the user’s reflection.
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          <a href="#" target="_blank" className="text-blue-700 underline" rel="noopener noreferrer">
            2019 Connecticut College Network Penetration Test
          </a>
        </h3>
        <p className="text-gray-600">Aug 2019 - Dec 2019</p>
        <p className="text-gray-800 mt-2">
          Assisted with a thorough network security assessment for Connecticut College.
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          <a
            href="https://conncoll.edu"
            target="_blank"
            className="text-blue-700 underline"
            rel="noopener noreferrer"
          >
            Altruism and Self-esteem
          </a>
        </h3>
        <p className="text-gray-600">Aug 2019 - Dec 2019</p>
        <p className="text-gray-800 mt-2">
          Conducted a survey-based study measuring correlation between self-esteem and altruistic tendencies.
        </p>
      </MotionDiv>

      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          <a
            href="https://2esymposium.com/speaker-attendee-biographies-a-f/"
            target="_blank"
            className="text-blue-700 underline"
            rel="noopener noreferrer"
          >
            Panelist @ VISION & LEADERSHIP 2e SYMPOSIUM 2019
          </a>
        </h3>
        <p className="text-gray-600">Oct 2018</p>
        <p className="text-gray-800 mt-2">
          Discussed personal experiences and advocacy for 2e learners at The Bridges 2e Center symposium.
        </p>
      </MotionDiv>
    </div>
  );
}

/**
 * TESTIMONIALS CONTENT
 */
function TestimonialsContent() {
  const data = [
    {
      name: "JoeAnna McDonald",
      title: "MA Mathematics",
      date: "March 21, 2024",
      connection: "JoeAnna worked with Cameron on the same team",
      recommendation:
        "Cameron is a wonderful collaborator. He has been an incredible resource for our school. His multi-faceted expertise (pedagogy, tech, and project development) has supported our students and staff immensely."
    },
    {
      name: "Nate Ledbury",
      title: "CRM Admin at Boston Museum of Science",
      date: "February 22, 2024",
      connection: "Nate worked with Cameron on the same team",
      recommendation:
        "Cameron is a passionate and dedicated professional that is a welcomed addition to any team. It's evident he cares about his work, works hard, and gives his all in whatever role he finds himself in."
    },
    {
      name: "H. John Schaeffer",
      title: "CISO and Director of Networks, Servers & Security at Connecticut College",
      date: "February 9, 2024",
      connection: "H. John managed Cameron directly",
      recommendation:
        "Cameron performed cybersecurity research for Connecticut College. His interest in white hat hacking and ability to find vulnerabilities was a real asset. Cameron is a thorough investigator who likes to understand problems and find solutions. I'd recommend him for any position."
    },
    {
      name: "Rose East",
      title: "Customer support professional, building supportive and collaborative communities",
      date: "January 29, 2024",
      connection: "Rose was senior to Cameron but didn't manage Cameron directly",
      recommendation:
        "Cameron is enthusiastic and persistent. He has a lot of energy and curiosity and the drive to follow it up."
    },
    {
      name: "Krystle Scott",
      title: "Voice Actor, Salesforce Admin, Support Engineer",
      date: "January 24, 2024",
      connection: "Krystle worked with Cameron on the same team",
      recommendation:
        "Cameron did a phenomenal job sourcing information across teams in preparation for new team members. He has a knack for connecting objective and introspective observations in collaborative environments."
    },
    {
      name: "Vinicius SantAnna",
      title: "Former HubSpot and Dutchie",
      date: "March 29, 2023",
      connection: "Vinicius was senior to Cameron but didn't manage Cameron directly",
      recommendation:
        "Cameron is smart, well-spoken, inquisitive, and always digs deeper to understand whys, hows, and outcomes. He tackled extremely difficult projects with dedication and professionalism."
    },
    {
      name: "Sean Hastings",
      title: "Information Security @ Dutchie",
      date: "November 7, 2022",
      connection: "Sean worked with Cameron on the same team",
      recommendation:
        "Cameron is an exceptional security-minded business applications expert. Always looks forward to more secure and more efficient solutions. An immense ally to the security team."
    },
    {
      name: "Ashley Pinales",
      title: "Latina in Tech, WFM People Leader, ex Grubhub, Wayfair",
      date: "November 6, 2022",
      connection: "Ashley was senior to Cameron but didn't manage Cameron directly",
      recommendation:
        "I could always count on Cameron to address issues quickly and ensure they never happen again. His passion for tech is evident. He researched new ways to utilize data. A big asset to any creative problem-solving team."
    },
    {
      name: "Darin Mellor",
      title: "Project Manager in tech",
      date: "November 4, 2022",
      connection: "Darin worked with Cameron but on different teams",
      recommendation:
        "Cameron is highly motivated, passionate, and hard-working. He slayed any challenge given. He brought together three support orgs and set the foundation for success."
    },
    {
      name: "Michael Gombos",
      title: "Infrastructure Guy",
      date: "July 11, 2022",
      connection: "Michael worked with Cameron but on different teams",
      recommendation:
        "Cameron is an exceptionally security-minded employee. He's been a champion for the support team. His proactive recommendations helped security across the company."
    },
    {
      name: "Justin Hurst",
      title: "Dutchie Hardware and Product Support III",
      date: "July 7, 2022",
      connection: "Justin worked with Cameron on the same team",
      recommendation:
        "Cameron is passionate, intelligent, and overall a great person to add to any team."
    },
    {
      name: "KT Ellis",
      title: "#OpenToWork | OIT #over-40 Leadership | BRMP®",
      date: "July 6, 2022",
      connection: "KT worked with Cameron on the same team",
      recommendation:
        "His passion was evident on day one. He tackles problems in new and unique ways, shares improvements, and is a very dedicated professional."
    },
    {
      name: "Diane Walter",
      title: "Director of Marketing and Communications at 412 Food Rescue",
      date: "May 28, 2022",
      connection: "Diane worked with Cameron but at different companies",
      recommendation:
        "Cameron is a force for good. As a senior-level Product Expert for Google Fi, he volunteers empathy and expertise to assist users. He's a valued part of the Fi family."
    },
    {
      name: "Raymond Martinez",
      title: "Customer Experience Leader, Project Manager",
      date: "April 25, 2022",
      connection: "Raymond was senior to Cameron but didn't manage him directly",
      recommendation:
        "Cameron is a great collaborator. He goes out of his way to confirm understanding, leaving no stone unturned. He was crucial to my onboarding at Dutchie."
    },
    {
      name: "Kate Berezo",
      title: "Community Engagement Director @ Thrive Scholars",
      date: "July 1, 2021",
      connection: "Kate managed Cameron directly",
      recommendation:
        "Cameron is one of the most talented and dedicated mentors I've worked with. His positivity and passion for STEM is infectious."
    },
    {
      name: "Patricia Cebotari",
      title: "Software Developer & Manager | Frontend, SQL, React",
      date: "June 3, 2021",
      connection: "Patricia managed Cameron directly",
      recommendation:
        "Cameron is extremely efficient and always willing to lead in a team setting. He's forward-thinking and open to new ideas and approaches."
    },
    {
      name: "Christine Chung, PhD",
      title: "Associate Professor of Computer Science, Connecticut College",
      date: "May 8, 2021",
      connection: "Christine was Cameron’s teacher",
      recommendation:
        "I've known Cameron since his first year at Conn. He has a special ability to connect concepts across domains and emerges as a leader. We'll miss him greatly!"
    },
    {
      name: "Karina Sinha",
      title: "Software Developer @ Petricore, Inc",
      date: "April 29, 2021",
      connection: "Karina worked with Cameron on the same team",
      recommendation:
        "Hardworking, intelligent, and always willing to wear many hats. I was impressed by his expansive knowledge and attention to detail."
    },
    {
      name: "Gwendolyn D'Elia, CPTM",
      title: "Trainer | Salesforce CRM | Agile | Training Specialist within Higher Ed",
      date: "April 29, 2021",
      connection: "Gwendolyn worked with Cameron on the same team",
      recommendation:
        "He has brought all his academic and professional success into the realm of Advancement with professionalism and creativity. He truly puts 'liberal arts into action'!"
    },
    {
      name: "Persephone L. Hall",
      title: "Leader in career development committed to student growth",
      date: "April 27, 2021",
      connection: "Persephone was Cameron’s mentor",
      recommendation:
        "Cameron's intellectual curiosity launched his academic career, connecting everything from computer classes to film. Fearless, creative, secures amazing internship opportunities."
    },
    {
      name: "Shalandy Zhang",
      title: "Software Engineer @ Facebook",
      date: "April 26, 2021",
      connection: "Shalandy worked with Cameron on the same team",
      recommendation:
        "We collaborated at C19 BayShield. Cameron's technical knowledge and dedication to the mission was inspiring. He also excelled at project management, balancing heavy coursework."
    },
    {
      name: "Andrea Griffiths PMP CCSK",
      title: "Senior Product Manager @ GitHub",
      date: "April 20, 2021",
      connection: "Andrea worked with Cameron on the same team",
      recommendation:
        "Cameron is a highly empathetic and talented Engineer, always customer obsessed, and a fantastic team player."
    },
    {
      name: "Amy Peck",
      title: "XR, Spatial Computing & Emerging Tech Strategist, CEO-EndeavorXR",
      date: "August 13, 2020",
      connection: "Amy worked with Cameron but at different companies",
      recommendation:
        "Cameron is a rock star!!"
    },
    {
      name: "Rethek Kumar",
      title: "Junior Software Engineer | MAC @ University Of Windsor",
      date: "July 30, 2020",
      connection: "Rethek worked with Cameron on the same team",
      recommendation:
        "A critical thinker, always innovative, and a supportive teammate. Professional and punctual."
    },
    {
      name: "Anu Kaur",
      title: "Account Manager | Results-Driven Marketing Manager",
      date: "July 27, 2020",
      connection: "Anu worked with Cameron on the same team",
      recommendation:
        "He was always ready to take up new tasks, help, and bring positive energy to the team."
    },
    {
      name: "Sara Helin",
      title: "Product @ Pactio",
      date: "July 27, 2020",
      connection: "Sara worked with Cameron on the same team",
      recommendation:
        "Cameron took initiative, was friendly, organized, and had broad technical knowledge that helped our project. An asset to any team!"
    },
    {
      name: "Danielle Fernandez",
      title: "Project Manager",
      date: "July 27, 2020",
      connection: "Danielle worked with Cameron on the same team",
      recommendation:
        "He led the team with fresh ideas and perspective. His leadership made collaborating remotely an invaluable experience."
    },
    {
      name: "Dylan Arceneaux",
      title: "Owner/operator at A9 Designs Prototyping & Fabrication",
      date: "July 27, 2020",
      connection: "Dylan worked with Cameron but on different teams",
      recommendation:
        "Having Cameron was like having a shining lighthouse. Highly talented, versatile, skilled developer who goes above and beyond."
    },
    {
      name: "Dana Castner",
      title: "Founder of Choice Tracker, Sr. Product Designer at Able",
      date: "July 26, 2020",
      connection: "Dana managed Cameron directly",
      recommendation:
        "He was given a broad engineering problem and quickly developed multiple solution options. Fantastic at communicating tradeoffs. Extremely organized and helpful."
    },
    {
      name: "Tina Taleb",
      title: "Software Engineer",
      date: "February 7, 2020",
      connection: "Tina worked with Cameron on the same team",
      recommendation:
        "Undoubtedly intelligent and hard-working. We interned at GitHub together, and he was a delight to work with."
    },
    {
      name: "Chris Wiebe",
      title: "Head of School -- Tree Academy",
      date: "December 11, 2015",
      connection: "Chris was Cameron’s mentor",
      recommendation:
        "Overseeing Cameron's independent study in AI. His mastery of languages, design thinking, and bug resolution is outstanding."
    },
    {
      name: "Max Goldberg",
      title: "Associate Director at Meredith Corporation",
      date: "September 21, 2015",
      connection: "Max worked with Cameron on the same team",
      recommendation:
        "Exceptionally talented, remarkable communication and technical skills, strong will, determined, and professional. He is truly an asset."
    },
    {
      name: "Amy Peck",
      title: "XR, Spatial Computing & Emerging Tech Strategist, CEO-EndeavorXR",
      date: "September 9, 2015",
      connection: "Amy worked with Cameron but at different companies",
      recommendation:
        "He reached out while I was at Leap Motion for a robotics project. I was impressed by his drive and curiosity."
    },
    {
      name: "Kathryn Owen",
      title: "Marketing | Events | Trade Shows",
      date: "September 4, 2015",
      connection: "Kathryn worked with Cameron but at different companies",
      recommendation:
        "He was always punctual with deadlines and tasks for the FIRST Robotics sponsorship. He has a positive, go-getter attitude."
    }
  ];

  return (
    <div className="space-y-8">
      {data.map(({ name, title, date, connection, recommendation }) => (
        <MotionDiv key={`${name}-${date}`}>
          <p className="text-xl italic text-gray-700">"{recommendation}"</p>
          <p className="text-gray-500 mt-2">
            - {name}, {title} | {date} | {connection}
          </p>
        </MotionDiv>
      ))}
    </div>
  );
}
