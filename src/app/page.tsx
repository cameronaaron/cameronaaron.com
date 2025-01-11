'use client'; 
// ^ Use this only if you're on Next 13's /app directory. 
// For Next 12 or Next 13 with /pages, you can remove this line.

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// TypeScript fix: define the shape of your section props
interface ContentSectionProps {
  id: string;
  title: string;
  text: string;
}

interface MotionDivProps {
  children: React.ReactNode;
}

// For your Experience/Education/Testimonials data, you can define an interface or just keep them in arrays.

export default function Home() {
  // Confetti trigger once on page load
  const [isConfettiActive, setConfettiActive] = useState(true);

  // We'll measure the window size for react-confetti
  const { width, height } = useWindowSize();

  // Turn off confetti after a few seconds (purely optional)
  useEffect(() => {
    const timer = setTimeout(() => {
      setConfettiActive(false);
    }, 5000); // 5 seconds
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <title>Cameron E. Aaron - Software Engineer & Neuroscientist</title>
        <meta
          name="description"
          content="Explore the achievements of Cameron E. Aaron, a seasoned Product Manager, Software Engineer, and Neuroscientist. Combining AI, neuroscience, software engineering, and aerospace medicine to deliver innovation and results."
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
          content="A seasoned Product Manager and Software Engineer with a diverse background in AI, neuroscience, and aerospace medicine."
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
          content="A seasoned Product Manager and Software Engineer with a diverse background in AI, neuroscience, software engineering, and aerospace medicine."
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
                  "description": "Master of Business Administration in Computer/Information Technology Administration and Management from Illinois Institute of Technology",
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
            })
          }}
        />
      </Head>

      {/* === Confetti (fun factor) === */}
      {isConfettiActive && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          gravity={0.3}
          numberOfPieces={300}
        />
      )}

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
              {['About', 'Experience', 'Education', 'Projects', 'Testimonials', 'Contact'].map(
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
            { name: 'About', desc: 'Learn more about me' },
            { name: 'Experience', desc: 'View my work history' },
            { name: 'Education', desc: 'My academic credentials' },
            { name: 'Testimonials', desc: 'See what others say' },
            { name: 'Contact', desc: 'Get in touch with me' },
            { name: 'Projects', desc: 'Explore my portfolio' }
          ].map((item, i) => (
            <motion.a
              key={item.name}
              href={`#${item.name.toLowerCase()}`}
              className="group bg-white rounded-xl shadow-lg p-4 border border-gray-100 hover:shadow-xl transition"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
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
          text={`I'm Cameron Aaron, a seasoned Product Manager and Software Engineer with a diverse background in artificial intelligence, neuroscience, software engineering, and aerospace medicine. Over the past six years, I have collaborated with industry leaders like Dutchie, GitHub, SpaceX, and Microsoft, driving innovation and delivering high-quality solutions.

As a DevOps Engineer, I've applied my extensive knowledge and skills to create innovative solutions for complex problems across various domains. I am also a recognized Google Product Expert, known for my contributions to the Google community and products.

With over six years of experience in the tech industry, I have consistently delivered high-quality products and services. My passion lies in advancing education and research, particularly at the intersection of AI and cognitive neuroscience. I hold multiple certifications and awards in these fields, along with a double major in Computer Science and Psychology, a minor in Cognitive Science, and a Certificate of Arts and Technology from Connecticut College.`}
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

/* ------------------------------------------------------------------
   HELPER COMPONENTS
   ------------------------------------------------------------------*/

function ContentSection({ id, title, text }: ContentSectionProps) {
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

function MotionDiv({ children }: MotionDivProps) {
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

/* 
   EXPERIENCE SECTION 
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

function ExperienceContent() {
  return (
    <div className="space-y-8">
      {/* Insert your entire experience list here (Bridges Academy, Dutchie, etc.) */}
      {/* Example: */}
      <MotionDiv>
        <div className="flex items-center mb-2">
          <Image src="/ba.webp" alt="Bridges Academy Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold ml-4 text-gray-900">Bridges Academy</h3>
        </div>
        <p className="text-gray-500">Biopsychology Teacher | Jun 2023 - Present</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Teaching biopsychology, focusing on project-based curriculum.</li>
        </ul>

        {/* ...Add the rest of your Bridges Academy bullets here... */}
      </MotionDiv>

      {/* Dutchie, SpaceX, GitHub, etc. */}
      {/* Copy the same pattern for each employer. */}
    </div>
  );
}

/* 
   EDUCATION SECTION 
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

function EducationContent() {
  return (
    <div className="space-y-8">
      <MotionDiv>
        <Image src="/bgrad.webp" alt="Bridges Graduate School" width={40} height={40} />
        <h3 className="text-2xl font-semibold text-gray-900 mt-2">
          Bridges Graduate School of Cognitive Diversity in Education
        </h3>
        <p className="text-gray-500">M.Ed. Program in Cognitive Diversity | May 2023 - May 2025</p>
        <ul className="list-disc pl-8 text-gray-700 mt-2">
          <li>Focus on advanced abilities, self-regulation, and social skills.</li>
          <li>Dean's List</li>
        </ul>
      </MotionDiv>

      {/* ...Add more Education items here... */}
    </div>
  );
}

/* 
   HONORS & AWARDS SECTION 
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

function HonorsContent() {
  return (
    <div className="space-y-8">
      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">Bridges Diamond Awards</h3>
        <p className="text-gray-500">Apr 2010, Apr 2012, Apr 2013</p>
        <p className="text-gray-700 mt-2">A distinction for exemplary service to the school community.</p>
      </MotionDiv>
      {/* ...Add the rest of your honors/awards... */}
    </div>
  );
}

/* 
   PROJECTS SECTION 
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
        transition={{ duration: 0.9 }}
        className="text-3xl font-extrabold mb-4 text-gray-900"
      >
        Projects
      </motion.h2>
      <ProjectsContent />
    </section>
  );
}

function ProjectsContent() {
  return (
    <div className="space-y-8">
      <MotionDiv>
        <h3 className="text-xl font-semibold text-gray-900">
          <a
            href="https://resumechecker.cameronaaron.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline"
          >
            Resume Feedback Assistant
          </a>
        </h3>
        <p className="text-gray-600">Apr 2024 - Present</p>
        <p className="text-gray-800 mt-2">
          Advanced FastAPI app providing actionable resume advice...
        </p>
      </MotionDiv>

      {/* ...Add other projects from your snippet... */}
    </div>
  );
}

/* 
   TESTIMONIALS SECTION 
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

function TestimonialsContent() {
  const data = [
    {
      name: 'JoeAnna McDonald',
      title: 'MA Mathematics',
      date: 'March 21, 2024',
      connection: 'JoeAnna worked with Cameron on the same team',
      recommendation:
        'Cameron is a wonderful collaborator. He has been an incredible resource for our school...'
    },
    // ...Add all your testimonials here...
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
      {/* You can add the rest from your snippet */}
    </div>
  );
}

/* 
   CONTACT SECTION 
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
          <a href="mailto:cameronaaron1@gmail.com" className="text-blue-700 hover:underline">
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
        <a href="https://twitter.com/cameronaaron4" target="_blank" rel="noopener noreferrer">
          <img
            alt="Twitter Badge"
            src="https://img.shields.io/badge/-@cameronaaron4-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white"
          />
        </a>

        <a href="https://github.com/cameronaaron" target="_blank" rel="noopener noreferrer">
          <img
            alt="GitHub Badge"
            src="https://img.shields.io/badge/-cameronaaron-181717?style=for-the-badge&logo=github&logoColor=white"
          />
        </a>
        <a href="https://linktr.ee/cameronaaron" target="_blank" rel="noopener noreferrer">
          <img
            alt="Linktree Badge"
            src="https://img.shields.io/badge/-linktree-39E09B?style=for-the-badge&logo=linktree&logoColor=white"
          />
        </a>
      </div>
    </section>
  );
}
