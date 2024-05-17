'use client';

import React, { createContext, useContext } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { motion } from 'framer-motion';



export default function Home() {
  return (
    <>
      <Head>
        <title>Cameron E. Aaron - Software Engineer & Neuroscientist</title>
        <meta
          name="description"
          content="Cameron E. Aaron is a seasoned DevOps Engineer with a diverse background in artificial intelligence, neuroscience, software engineering, and aerospace medicine. Explore his professional experience, educational background, and achievements."
        />
        <meta
          name="keywords"
          content="Cameron E. Aaron, Software Engineer, Neuroscientist, DevOps, AI, Neuroscience, Aerospace Medicine, GitHub, SpaceX, Dutchie, Microsoft"
        />
        <meta name="author" content="Cameron E. Aaron" />
        <meta property="og:title" content="Cameron E. Aaron - Software Engineer & Neuroscientist" />
        <meta
          property="og:description"
          content="Cameron E. Aaron is a seasoned DevOps Engineer with a diverse background in artificial intelligence, neuroscience, software engineering, and aerospace medicine. Explore his professional experience, educational background, and achievements."
        />
        <meta property="og:image" content="/profile.jpg" />
        <meta property="og:url" content="https://cameronaaron.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="cameronaaron.com" />
        <meta property="twitter:url" content="https://cameronaaron.com" />
        <meta name="twitter:title" content="Cameron E. Aaron - Software Engineer & Neuroscientist" />
        <meta
          name="twitter:description"
          content="Cameron E. Aaron is a seasoned DevOps Engineer with a diverse background in artificial intelligence, neuroscience, software engineering, and aerospace medicine. Explore his professional experience, educational background, and achievements."
        />
        <meta name="twitter:image" content="/profile.jpg" />
        <link rel="canonical" href="https://cameronaaron.com" />
        <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Cameron E. Aaron",
        url: "https://cameronaaron.com",
        image: "https://cameronaaron.com/profile.jpg",
        jobTitle: "Software Engineer & Neuroscientist",
        worksFor: {
          "@type": "Organization",
          name: "Dutchie, GitHub, SpaceX, Microsoft"
        },
        sameAs: [
          "https://twitter.com/cameronaaron4",
          "https://www.linkedin.com/in/kamisama",
          "mailto:cameronaaron1@gmail.com",
          "https://twitter.com/cameronaaron4",
          "https://www.linkedin.com/in/kamisama",
          "https://github.com/cameronaaron",
          "mailto:cameronaaron1@gmail.com",
          "https://linktr.ee/cameronaaron",
          "https://linktr.ee/cameronaaron",
          "https://www.facebook.com/cameron.kami.aaron/",
          "https://instagram.com/cameronaaronofficial",
          "https://www.youtube.com/channel/UCVaw-r9lsNYEEi4-mKVKCKA",
          "https://soundcloud.com/cameron-aaron",
          "https://www.linkedin.com/in/kamisama/",
          "https://x.com/CameronAaron4",
          "https://www.youtube.com/@CameronAaron/videos?sub_confirmation=1",
          "https://cameronaaron.com/resume.pdf",
          "https://github.com/cameronaaron",
          "https://cameronaaron.medium.com/",
          "https://twitter.com/cameronaaron4?lang=en",
          "https://www.reddit.com/u/cameronaaron1",
          "https://medium.com/@cameronaaron/creating-the-perfect-fit-turning-add-into-an-asset-3d9c556fc9d3",
          "https://medium.com/@cameronaaron/in-december-of-2019-i-was-inducted-as-a-scholar-of-the-ammerman-center-of-arts-and-technology-4349aec810fa",
          "https://medium.com/@cameronaaron"
        ],
        contact: {
          address: "1122 23rd Ave, Seattle, WA 98122",
          phone: "[redacted-phone]",
          email: "cameronaaron1@gmail.com",
          linkedin: "https://www.linkedin.com/in/kamisama",
          github: "https://github.com/cameronaaron",
          linktree: "https://linktr.ee/cameronaaron",
          blog: "https://cameronaaron.com"
        },
        skills: [
          "Linux",
          "PHP",
          "Engineering",
          "Robotics",
          "Science",
          "Penetration Testing",
          "Computer Science",
          "Public Relations",
          "Cloud Computing",
          "Nonprofits",
          "Business",
          "System Administration",
          "Server Administration",
          "Website Development",
          "Program Development",
          "Artificial Intelligence",
          "Flash Animation",
          "MySQL",
          "Photoshop",
          "JavaScript",
          "Computer Hardware",
          "Advanced CSS",
          "Adobe Fireworks",
          "Illustrator",
          "Solidworks",
          "Ubuntu",
          "Open Source",
          "Perl",
          "Java",
          "Ruby",
          "HTML 5",
          "XML",
          "XSLT",
          "Labview",
          "C++",
          "Data Security",
          "Cryptography",
          "Computer Security",
          "Robot Programming",
          "Swift 3D",
          "Cloud Security",
          "IPS",
          "cPanel",
          "FTPS",
          "Ethical Hacker",
          "Black Box Testing",
          "Internet Security",
          "Marketing Communications",
          "MEAN stack",
          "Algorithms"
        ],
        languages: {
          Chinese: "Elementary",
          Spanish: "Elementary",
          Vietnamese: "Elementary",
          English: "Native or Bilingual",
          Korean: "Elementary",
          Japanese: "Limited Working"
        },
        certifications: [
          "Nu School Summer Fellowship",
          "Operating Systems and You: Becoming a Power User",
          "Data Structures",
          "Google Cloud Platform Fundamentals: Core Infrastructure",
          "Machine Learning and Artificial Intelligence",
          "Suite of Tools™",
          "Bachelors of Arts Psychology and Computer Science",
          "Foundations of Project Management",
          "Sexual Harassment in the Workplace",
          "Algorithms by Stanford University on Coursera",
          "COVID-19, mRNA, LNP-S, PF, 100 Mcg/0.5 mL Dose (Moderna) 4 doses",
          "Greedy Algorithms, Minimum Spanning Trees, and Dynamic Programming",
          "Shortest Paths Revisited, NP-Complete Problems and What To Do About Them",
          "Graph Search, Shortest Paths, and Data Structures",
          "Ordained Minister (American Marriage Ministries)",
          "Ordained Minister (Universal Life Church)",
          "Google IT Automation Professional Certificate",
          "AT&T Summer Learning Academy Extern",
          "Algorithmic Toolbox",
          "Algorithms on Graphs",
          "Algorithms on Strings",
          "COVID-19 Contact Tracing",
          "Genome Assembly Programming Challenge",
          "Cyber@ANZ Program",
          "Software Engineering Virtual Experience (JPMorgan Chase & Co.)",
          "Automating Real-World Tasks with Python",
          "G Suite Administration Specialization",
          "G Suite Mail Management",
          "G Suite Security",
          "Google IT Automation with Python Specialization",
          "Introduction to G Suite",
          "Managing G Suite",
          "Configuration Management and the Cloud",
          "Crash Course on Python",
          "Introduction to Git and GitHub",
          "Troubleshooting and Debugging Techniques",
          "Using Python to Interact with the Operating System",
          "Cloud Engineering with GCP Specialization",
          "Divide and Conquer, Sorting and Searching, and Randomized Algorithms",
          "Google IT Support Specialization",
          "IT Security: Defense against the digital dark arts",
          "Operating Systems and You: Becoming a Power User",
          "Preparing for the Google Cloud Associate Cloud Engineer Exam",
          "System Administration and IT Infrastructure Services",
          "Technical Support Fundamentals",
          "The Bits and Bytes of Computer Networking",
          "Architecting with Google Compute Engine Specialization",
          "Elastic Cloud Infrastructure: Scaling and Automation",
          "Essential Cloud Infrastructure: Core Services",
          "Essential Cloud Infrastructure: Foundation",
          "Fundamentals of Digital Marketing",
          "Google Cloud Platform Fundamentals: Core Infrastructure",
          "Reliable Cloud Infrastructure: Design and Process",
          "Student Support Network- Advanced",
          "Social & Behavioral Research",
          "Crisis Counselor",
          "Student Support Network",
          "Green Dot",
          "Arts and Technology",
          "Protecting Human Research Participants",
          "Young Expert Certification in Artificial Intelligence and Neural Networks",
          "Badge Certification in Neural Networks",
          "Machine Learning and Artificial Intelligence",
          "GOLD Initiative Introduction to Machine Shop",
          "BLS for Healthcare Providers"
        ],
        honorsAwards: [
          "Bridges Diamond Awards",
          "Caught in the Act Award",
          "Science Leaders",
          "Term Honor: Dean's List (Bridges Graduate School of Cognitive Diversity in Education)",
          "Bridget Baird Award (Ammerman Center for Arts and Technology)"
        ],
        publications: [
          "Finding the perfect Fit: The 2e-Friendly Workplace",
          "Lapses in sustained attention predicted by changes in visually-guided movements",
          "Stanford Neurodiversity Summit 2021 Panelist",
          "Vision Sciences Society Annual Meeting Abstract"
        ],
        summary: "As a DevOps Engineer, Cameron Aaron applies his extensive knowledge and skills in artificial intelligence, neuroscience, software engineering, and aerospace medicine to create innovative solutions for complex problems. He is also a Google Product Expert, recognized for his contributions to the Google community and products. With over six years of experience in the tech industry, Cameron has worked for leading companies such as Dutchie, GitHub, SpaceX, and Microsoft, delivering high-quality products and services in various domains and sectors. He is passionate about advancing education and research, especially at the intersection of AI and cognitive neuroscience. He holds multiple certifications and awards in these fields, as well as a double major in Computer Science and Psychology, a minor in Cognitive Science, and a Certificate of Arts and Technology from Connecticut College.",
        education: [
          {
            institution: "Bridges Graduate School of Cognitive Diversity in Education",
            degree: "M.Ed. Program in Cognitive Diversity, Education",
            dates: "May 2023 - May 2025",
            activities: [
              "CDL 511 - Introduction to Cognitively Diverse Minds: A World of Learning Differences",
              "CDL 512 - Conceptions of Giftedness: From Theory to Practice",
              "CDL 513 - Complexities of Twice Exceptionality",
              "IEC 511 - Cognitive Diversity and Strength-Based, Talent-Focused Education",
              "EXA 511 - Practicum",
              "IEC 621 - Foundations of Creativity",
              "RES 621 - Methods and Techniques of Educational Research",
              "IEC 622 Innovative Uses for Technology",
              "CAP 622 Capstone Action Research Project",
              "CDL 623 Social and Emotional Diversity"
            ],
            honor: "Dean's List"
          },
          {
            institution: "Bridges Graduate School of Cognitive Diversity in Education",
            degree: "Certificate in Twice Exceptional Education",
            dates: "August 2023 - June 2024",
            activities: [
              "CDL 511 - Introduction to Cognitively Diverse Minds: A World of Learning Differences",
              "CDL 512 - Conceptions of Giftedness: From Theory to Practice",
              "CDL 513 - Complexities of Twice Exceptionality",
              "IEC 511 - Cognitive Diversity and Strength-Based, Talent-Focused Education",
              "EXA 511 - Practicum"
            ],
            honor: "Dean's List"
          },
          {
            institution: "Connecticut College",
            degree: "Bachelor's degree, Computer Science",
            dates: "August 2017 - May 2021",
            activities: [
              "Office for Sexual Violence Prevention and Victim Advocacy Safety Net",
              "Unity House Big Sib",
              "Honor Council",
              "Junior Class Student Activities Council Representative",
              "Science Leader",
              "Computer Science leader",
              "House Senator (Student Government Association)",
              "Science Leader Student advisory board member",
              "Human Development SAB",
              "Knowlton House senator"
            ],
            advisers: [
              "Professor Dr. Gary Parker",
              "Professor Dr. Stephen Douglass"
            ],
            projects: [
              {
                title: "Predatory and Prey Behavior Modifying MIP Robots",
                description: "MIP robots, sold by the company WowWee, are self-balancing toys equipped with multiple sensors. The objective of this project is to hack these robots so that we can develop our own controllers that take in the sensory data and make decisions as to what the robot is to do next. Our first program used the robot’s distance sensors to program a wall-following robot."
              }
            ]
          },
          {
            institution: "Connecticut College",
            degree: "Bachelor's degree, Psychology",
            dates: "August 2017 - May 2021",
            activities: [
              "Office for Sexual Violence Prevention and Victim Advocacy Safety Net",
              "Unity House Big Sib",
              "Honor Council",
              "Junior Class Student Activities Council Representative",
              "Science Leader",
              "Computer Science leader",
              "House Senator (Student Government Association)",
              "Science Leader Student advisory board member",
              "Human Development SAB",
              "Knowlton House senator"
            ],
            adviser: "Professor Dr. Joseph A. Schroeder",
            projects: [
              {
                title: "Lapses in sustained attention predicted by changes in visually-guided movements",
                description: "Studied complex behavior to uncover sensitive measures that indicate when a person is losing focus during a sustained attention task. Found significant differences in movement initiation latency preceding commission errors on no-go trials."
              }
            ]
          },
          {
            institution: "Connecticut College",
            degree: "Minor, Cognitive Science",
            dates: "August 2017 - May 2021",
            activities: [
              "Office for Sexual Violence Prevention and Victim Advocacy Safety Net",
              "Unity House Big Sib",
              "Honor Council",
              "Junior Class Student Activities Council Representative",
              "Science Leader",
              "Computer Science leader",
              "House Senator (Student Government Association)",
              "Science Leader Student advisory board member",
              "Human Development SAB",
              "Knowlton House senator"
            ],
            dean: "Dr. Jefferson A. Singer"
          },
          {
            institution: "Ammerman Center for Arts and Technology",
            program: "Certificate Program",
            dates: "August 2018 - May 2021",
            activities: [
              "Office for Sexual Violence Prevention and Victim Advocacy Safety Net",
              "Unity House Big Sib",
              "Honor Council",
              "Junior Class Student Activities Council Representative",
              "Science Leader",
              "Computer Science leader",
              "House Senator (Student Government Association)",
              "Science Leader Student advisory board member",
              "Human Development SAB",
              "Knowlton House senator"
            ],
            adviser: "Professor Dr. Stephen Douglass",
            projects: [
              {
                title: "Genetic RefleXions",
                description: "Created a magic mirror that displays genetic info about the person with their reflection. This project aimed to give the person insight into their genes, providing them with a new perspective on who they are and boosting their self-perception."
              }
            ],
            awards: [
              "Recipient of the 2021 Ammerman Center Bridget Baird Award for excellence in research in arts and technology."
            ]
          },
          {
            institution: "Trinity Christian College",
            program: "Business/Corporate Communications",
            dates: "May 2020 - July 2020",
            grade: "A",
            courses: [
              "BUS201, Business Leadership and Entrepreneurship"
            ]
          },
          {
            institution: "Bridges Academy",
            program: "High School, Mechatronics, Robotics, and Automation Engineering and Science",
            dates: "2009 - 2017",
            activities: [
              "Robotics Team",
              "Debate Team",
              "Key Club",
              "Student Council"
            ]
          },
          {
            institution: "California State University, Northridge",
            program: "Psychology",
            dates: "December 2020 - January 2021",
            grade: "A",
            courses: [
              "PSY 345. Social Psychology (3)"
            ]
          },
          {
            institution: "University of Massachusetts Amherst",
            program: "Psychology",
            dates: "December 2020 - January 2021",
            grade: "A",
            courses: [
              "PSYCH 350 - Developmental Psychology (3)"
            ]
          },
          {
            institution: "Shepherd of the Valley Lutheran School",
            program: "Elementary School, Grade 3-4",
            dates: "August 2006 - May 2008"
          }
        ],
        experience: [
          {
            company: "Bridges Academy",
            positions: [
              {
                title: "Biopsychology Teacher",
                dates: "June 2023 - Present",
                location: "Seattle, Washington, United States",
                description: "Develop and implement a comprehensive biopsychology curriculum for gifted students."
              },
              {
                title: "Director of Information Technology Engineering",
                dates: "March 2023 - Present",
                location: "Seattle, Washington, United States",
                description: "Spearheaded the establishment and management of the entire IT infrastructure at Bridges Academy School, demonstrating comprehensive knowledge of hardware, software, and network systems. Implemented an integrated IT sec program to protect the school's data and systems, utilizing state-of-the-art security protocols and standards."
              },
              {
                title: "Engineering Teacher",
                dates: "March 2023 - Present",
                location: "Seattle, Washington, United States",
                description: "Develop and implement a comprehensive software engineering curriculum, emphasizing both theory and practical application, for gifted students at Bridges Academy School in Seattle."
              },
              {
                title: "Gifted Education Teacher",
                dates: "November 2022 - April 2023",
                location: "United States",
                description: "Plan and execute a comprehensive and differentiated curriculum for gifted students based on individual strengths, interests, and abilities, aligning with the school's overall educational goals and standards."
              },
              {
                title: "Safety Team",
                dates: "August 2023 - Present",
                location: "Seattle, Washington, United States",
                description: "Part of the Safety Team ensuring the safety and security of the school environment."
              }
            ]
          },
          {
            company: "Dutchie",
            positions: [
              {
                title: "Lead Systems Admin",
                dates: "August 2022 - November 2022",
                location: "Los Angeles Metropolitan Area",
                description: "Identify, diagnose, and report technical problems. This includes escalating and tracking problems appropriately. Root cause analysis is essential."
              },
              {
                title: "Lead Support Systems Analyst",
                dates: "February 2022 - August 2022",
                location: "Bend, Oregon, United States",
                description: "Develop thorough, professionally documented, data-driven systems-related projects including migrations and large overhauls or changes. Identify data trends displaying systems needs to determine and develop prioritized goals for the Support team."
              },
              {
                title: "Project Manager",
                dates: "August 2021 - February 2022",
                location: "Bend, Oregon, United States",
                description: "Develop thorough, professionally documented, data-driven projects. Analyze team data to determine team necessities and develop prioritized goals."
              },
              {
                title: "Product Support Specialist (Tier ll), Customer Success",
                dates: "July 2021 - August 2021",
                location: "Los Angeles County, California, United States",
                description: "Explain workflows and product configuration with customers. Troubleshoot and write bugs for unexpected behavior for Engineering."
              }
            ]
          },
          {
            company: "GitHub",
            positions: [
              {
                title: "Software Engineer, Support Operations",
                dates: "August 2019 - January 2020",
                location: "San Francisco Bay Area",
                description: "Defining and streamlining processes and workflows. Building tools to help make delivering support easier. Providing education and training to customer support agents."
              },
              {
                title: "Community Support and Customer Success Engineering",
                dates: "June 2019 - August 2019",
                location: "San Francisco, California",
                description: "An interdisciplinary role that involves machine learning. Work with cross-functional stakeholders in Operations, Product, Engineering, and Legal to support product launches."
              }
            ]
          },
          {
            company: "SpaceX",
            positions: [
              {
                title: "Aerospace Medicine, Space Operations",
                dates: "August 2020 - December 2020",
                location: "Hawthorne, California, United States",
                description: "Assist with SpaceX’s COVID response to keep employees and crewmembers safe while keeping operations running. Collaborate with academic institutions and/or private organizations on medical research."
              }
            ]
          },
          {
            company: "Microsoft",
            positions: [
              {
                title: "Support Operations Engineer",
                dates: "August 2019 - January 2020",
                location: "San Francisco Bay Area",
                description: "Worked with cross-functional stakeholders in Operations, Product, Engineering, and Legal to support product launches. Developed and executed support strategies that align with product goals."
              }
            ]
          },
          {
            company: "TED Conferences",
            positions: [
              {
                title: "Lead Organizer TEDxYouth@NewLondon and Head of special events in the Connecticut College TEDx club",
                dates: "July 2018 - December 2019",
                location: "New London/Norwich, Connecticut Area",
                description: "Spearheads TEDxYouth@New London. Brainstormed new events for the club. Manages community service."
              },
              {
                title: "TED-Ed Clubs Regional Leader: New London",
                dates: "September 2017 - December 2019",
                location: "New London/Norwich, Connecticut Area",
                description: "Was the go-to person for local TED-Ed clubs appointed by the TED-Ed team. Taught public speaking techniques to students aged 12 to 14. Managed the communications with TED-Ed's central office."
              }
            ]
          },
          {
            company: "Sibyl Systems",
            positions: [
              {
                title: "Founder and CEO",
                dates: "August 2015 - December 2019",
                location: "Studio City",
                description: "Founded a startup because AI and Machine intelligence can help close the technological gap and allow us to overcome modern-day technical hurdles to make our daily lives more efficient. Wanted to create generalizable intelligence using reinforcement learning and neural networks to help people and create a better future."
              }
            ]
          },
          {
            company: "2eNews",
            positions: [
              {
                title: "Variations 2e Article Writer",
                dates: "December 2018 - June 2019",
                location: "Studio City",
                description: "Wrote an article for the Variations 2E magazine (Issue 2 (Spring 2019): The 2e-Friendly Workplace) about 2E in the workplace. This took up 4 pages in the magazine and was read by people around the world."
              }
            ]
          },
          {
            company: "Clues Inc. Comic Books",
            positions: [
              {
                title: "Creator",
                dates: "February 2017 - 2019",
                location: "Greater Los Angeles Area",
                description: "Created a comic book to spread awareness and promote the positive side of having learning disabilities."
              }
            ]
          },
          {
            company: "4me",
            positions: [
              {
                title: "DevOps Engineer",
                dates: "Present",
                description: "Endorsed by Paul Reiber and 3 others who are highly skilled at this."
              }
            ]
          },
          {
            company: "Upkey",
            positions: [
              {
                title: "DevOps Engineer",
                dates: "Present",
                description: "Endorsed by 4 colleagues."
              }
            ]
          }
        ],
        volunteering: [
          {
            organization: "New London Public Schools",
            position: "DIEI Program Mentor",
            dates: "March 2021 - May 2021",
            description: "Support New London High School Juniors to help them achieve academic, career, and self-developmental success. Serve as a tutor and mentor to provide guidance through facilitating community engagement with the students."
          },
          {
            organization: "Verily Life Sciences",
            position: "Project Baseline Volunteer",
            dates: "June 2017 - Present",
            description: "Health"
          },
          {
            organization: "TED Conferences",
            position: "TED-Ed Clubs Council Member",
            dates: "December 2016 - January 2022",
            description: "A member of an elite group of youth idea-advocates, leadership-champions and voice-amplifiers."
          },
          {
            organization: "Google",
            positions: [
              {
                title: "Product Expert - Project Fi and Pixel",
                dates: "August 2016 - Present",
                description: "Assist users on the Project Fi Google Product Forum."
              },
              {
                title: "Google Community Translator- Japanese",
                dates: "January 2015 - Present",
                description: "Science and Technology"
              },
              {
                title: "Crowdsourced Contributor",
                dates: "January 2013 - Present",
                description: "Science and Technology"
              },
              {
                title: "Made by Google insider",
                dates: "January 2010 - Present",
                description: "Science and Technology"
              }
            ]
          },
          {
            organization: "Various Non Profit organizations",
            position: "Promoting STEMS In Schools",
            dates: "January 2012 - May 2017",
            description: "Science and Technology"
          },
          {
            organization: "Bridges Academy",
            positions: [
              {
                title: "Japanese Culture Liaison",
                dates: "January 2010 - May 2017",
                description: "I run an Anime Club and act as an ambassador for Bridges Academy when Japanese foreign exchange students visit."
              },
              {
                title: "Key Club Member",
                dates: "August 2009 - May 2017",
                description: "I act as an ambassador for my school and community when appropriate I often act as the voice of the student and help address concerns about social issues."
              }
            ]
          },
          {
            organization: "Nextbit Systems",
            position: "Cyanogen/Nextbit Private Alpha Tester"
          },
          {
            organization: "Sunrise Senior Living",
            position: "Volunteer",
            dates: "July 2016 - May 2017",
            description: "Health"
          },
          {
            organization: "Programming 101",
            position: "Owner and Teacher",
            dates: "January 2011 - December 2014",
            description: "It has been my long held belief that coding is as important as math and science so I made it my mission to teach both basic and Advanced programming skills to people of any age."
          },
          {
            organization: "FIRST FRC Team 4019",
            position: "Captain",
            dates: "September 2010 - May 2017",
            description: "Children"
          },
          {
            organization: "In His Presence Church",
            position: "Volunteer",
            dates: "January 2011 - May 2017",
            description: "Disaster and Humanitarian Relief"
          },
          {
            organization: "Lia",
            position: "Researcher",
            dates: "July 2017 - July 2020",
            description: "Education"
          },
          {
            organization: "ZeeMee",
            position: "Marketing for a Silicon Valley startup- Campus Ambassador",
            dates: "March 2018 - June 2021",
            description: "Education",
            url: "https://www.zeemee.com/cameronaaron"
          },
          {
            organization: "Connecticut College",
            positions: [
              {
                title: "Safety Net",
                dates: "July 2018 - May 2021",
                description: "I advocate for sexual and power-based violence and prevention."
              },
              {
                title: "Student Support Network",
                dates: "April 2018",
                description: "Issued"
              },
              {
                title: "Green Dot",
                dates: "March 2018",
                description: "Issued"
              },
              {
                title: "Arts and Technology",
                dates: "January 2018",
                description: "Issued"
              }
            ]
          },
          {
            organization: "Crisis Text Line",
            position: "Crisis Counselor",
            dates: "May 2019 - Present",
            description: "Talk to people who text 741741 who are in mental distress."
          },
          {
            organization: "Reddit, Inc.",
            position: "Moderator of the Official /r/Android_Beta subreddit",
            dates: "April 2018 - Present",
            description: "I am one of the official moderators of the official Android beta community https://www.reddit.com/r/android_beta?utm_medium=android_app&utm_source=share"
          },
          {
            organization: "Helping Hands Community",
            position: "Field Operations Specialist",
            dates: "June 2020 - June 2021",
            description: "Health"
          },
          {
            organization: "NeuroTechX",
            position: "Neuroscience Writer",
            dates: "August 2020 - January 2021",
            description: "Health"
          },
          {
            organization: "TEALS Program",
            positions: [
              {
                title: "Teacher",
                dates: "June 2021 - Present",
                description: "Supporting the AP Computer Science A class at Los Angeles Center for Enriched Studies (LACES) as a TA. TEALS helps teachers learn to teach CS by pairing them with industry volunteers and proven curricula."
              },
              {
                title: "Teaching Assistant",
                dates: "June 2021 - Present",
                description: "Supporting the AP Computer Science A class at Los Angeles Center for Enriched Studies (LACES) as a TA."
              }
            ]
          },
          {
            organization: "Stanford University",
            position: "Panelist",
            dates: "August 2021 - Present",
            description: "Stanford Neurodiversity Summit 2021 panelist"
          },
          {
            organization: "The COVID Tracking Project at The Atlantic",
            position: "Volunteer",
            dates: "June 2020 - September 2021",
            description: "The COVID Tracking Project is a volunteer-driven initiative housed at The Atlantic. We collect and publish the most complete COVID-19 data available for US states and territories. Learn more: www.covidtracking.com"
          },
          {
            organization: "Thrive Scholars",
            position: "STEM Program Mentor",
            dates: "March 2021 - June 2021",
            description: "Mentor high-achieving, low-income students of color with opportunities to thrive at top colleges and in meaningful careers. Collaborate with Thrive's comprehensive and data-proven program that prepares scholars to pursue competitive STEM careers."
          },
          {
            organization: "NAGC",
            position: "Convention Submission Reviewer",
            dates: "January 2024 - Present",
            description: "Education"
          },
          {
            organization: "Beeper",
            position: "Open Source Contributor",
            dates: "May 2022 - Present"
          }
        ]
      })
    }}
  />
</Head>
      <main className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
        <header className="w-full max-w-5xl mx-auto text-center py-8">
          <motion.h1
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-4xl font-bold mb-2 text-gray-900"
          >
            Cameron E. Aaron
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-lg font-mono text-gray-700"
          >
            Software Engineer &amp; Neuroscientist
          </motion.p>
        </header>

        <section className="w-full max-w-5xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="flex items-center justify-center mb-8"
          >
            <Image
              className="rounded-full"
              src="/profile.jpg"
              alt="Cameron E. Aaron"
              width={180}
              height={180}
              priority
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex flex-col lg:flex-row items-center justify-between mb-12"
          >
            <a
              className="transition-transform transform hover:scale-105 mx-2"
              href="https://www.linkedin.com/in/kamisama"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image src="/l.png" alt="LinkedIn Logo" width={100} height={24} priority />
            </a>
          </motion.div>
        </section>

        <nav className="w-full max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-12 text-center">
  {['About', 'Experience', 'Education', 'Testimonials', 'Contact', 'Projects'].map((section, index) => (
    <motion.a
      key={section}
      href={`#${section.toLowerCase()}`}
      className="group p-4 bg-white rounded-lg shadow hover:shadow-lg transition"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.2 }}
    >
      <h2 className="text-xl font-semibold mb-2 text-gray-900">{section}</h2>
      <p className="text-sm text-gray-600">Learn about my {section.toLowerCase()}.</p>
    </motion.a>
  ))}
</nav>



        <section id="about" className="w-full max-w-5xl mx-auto mb-12 bg-white p-8 rounded-lg shadow">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-3xl font-bold mb-4 text-gray-900"
          >
            About Me
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-lg leading-relaxed text-gray-700"
          >
            I'm Cameron Aaron, a seasoned DevOps Engineer with a diverse background in artificial intelligence, neuroscience, software engineering, and aerospace medicine. Over the past six years, I have collaborated with industry leaders like Dutchie, GitHub, SpaceX, and Microsoft, driving innovation and delivering high-quality solutions.

As a DevOps Engineer, I've applied my extensive knowledge and skills to create innovative solutions for complex problems across various domains. I am also a recognized Google Product Expert, known for my contributions to the Google community and products.

With over six years of experience in the tech industry, I have consistently delivered high-quality products and services. My passion lies in advancing education and research, particularly at the intersection of AI and cognitive neuroscience. I hold multiple certifications and awards in these fields, along with a double major in Computer Science and Psychology, a minor in Cognitive Science, and a Certificate of Arts and Technology from Connecticut College.
          </motion.p>
        </section>

        <section id="experience" className="w-full max-w-5xl mx-auto mb-12 bg-white p-8 rounded-lg shadow">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-3xl font-bold mb-4 text-gray-900"
          >
            Professional Experience
          </motion.h2>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
                <Image src="/ba.png" alt="Bridges Academy Logo" width={40} height={40} />
                <h3 className="text-2xl font-semibold ml-4 text-gray-900">Bridges Academy</h3>
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
                <Image src="/Dutchie.svg" alt="Dutchie Logo" width={40} height={40} />
                <h3 className="text-2xl font-semibold ml-4 text-gray-900">Dutchie</h3>
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
                <Image src="/spacex.png" alt="SpaceX Logo" width={40} height={40} />
                <h3 className="text-2xl font-semibold ml-4 text-gray-900">SpaceX</h3>
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
                <Image src="/github.png" alt="GitHub Logo" width={40} height={40} />
                <h3 className="text-2xl font-semibold ml-4 text-gray-900">GitHub</h3>
              </div>
              <p className="text-gray-500">Software Engineer | Aug 2019 - Jan 2020</p>
              <ul className="list-disc pl-8 text-gray-700">
                <li>Worked on internal tools to enhance product functionality and user experience.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
              <Image src="/bay.jpg" alt="C19 BayShield" width={40} height={40} />
                <h3 className="text-2xl font-semibold text-gray-900">C19 BayShield</h3>
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
                <Image src="/upkey.jpg" alt="Upkey Logo" width={40} height={40} />
                <h3 className="text-2xl font-semibold ml-4 text-gray-900">Upkey</h3>
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
              <Image src="/pass.png" alt="PassionNet" width={40} height={40} />
                <h3 className="text-2xl font-semibold text-gray-900">PassionNet</h3>
              </div>
              <p className="text-gray-500">Co Director: New Technologies, Data, and Ethics | Jan 2021 - Aug 2021</p>
              <ul className="list-disc pl-8 text-gray-700">
                <li>Taught a 4-week long course on AI ethics and Neuroscience to a group of Middle Schoolers.</li>
                <li>Designed a curriculum.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
              <Image src="/conn.svg.png" alt="Connecticut College" width={40} height={40} />

                <h3 className="text-2xl font-semibold text-gray-900">Connecticut College</h3>
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
                <Image src="/google.png" alt="Google Logo" width={40} height={40} />
                <h3 className="text-2xl font-semibold ml-4 text-gray-900">Google</h3>
              </div>
              <p className="text-gray-500">CSSI Section Leader &amp; Student Mentor | Jun 2020 - Sep 2020</p>
              <ul className="list-disc pl-8 text-gray-700">
                <li>Was selected by Google to work as an algorithms TA and Student mentor for the Google education team.</li>
                <li>In charge of mentoring and teaching a group of 50 students.</li>
                <li>Made sure group had at least a 95% pass rate in their class.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
              <Image src="/hhc.png" alt="Helping Hands Community Logo" width={40} height={40} />

                <h3 className="text-2xl font-semibold text-gray-900">Helping Hands Community</h3>
              </div>
              <p className="text-gray-500">Field Operations Engineering Specialist | Jun 2020 - Sep 2020</p>
              <ul className="list-disc pl-8 text-gray-700">
                <li>Developed the HHC website.</li>
                <li>Created partnerships with the community.</li>
                <li>Supported volunteers.</li>
                <li>Worked closely with the COO and Engineering team to address issues.</li>
                <li>Worked at a company co-founded by Pedram Keyani, Former Director of Engineering at Facebook and Uber, and started by talented tech folks with big hearts from Uber, Lyft, Google, WhatsApp, and Facebook who joined forces to create a platform for those able to help, to connect with those struggling most with current events: the elderly, immunocompromised, and at-risk in communities.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
              <Image src="/nu.jpg" alt="Nu School Logo" width={40} height={40} />

                <h3 className="text-2xl font-semibold text-gray-900">Nu School</h3>
              </div>
              <p className="text-gray-500">Technology Fellow | Jul 2020</p>
              <ul className="list-disc pl-8 text-gray-700">
                <li>Participated in a week of training and webinars, improving soft skills and important processes, such as building an MVP.</li>
                <li>Used learnings to lead a global team to build an MVP and design a prototype for an idea that helped reduce food waste.</li>
                <li>Pitched idea to the CEO of PersistIQ and answered questions.</li>
                <li>Continued working on the idea as a team after the program.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
                <Image src="/wurrly.jpg" alt="Wurrly Logo" width={40} height={40} />
                <h3 className="text-2xl font-semibold ml-4 text-gray-900">Wurrly</h3>
              </div>
              <p className="text-gray-500">QA Engineer | May 2015 - Aug 2015</p>
              <ul className="list-disc pl-8 text-gray-700">
                <li>Conducted regression testing and developed automation scripts for the Wurrly application.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
                <Image src="/ted.png" alt="TED Conferences Logo" width={40} height={40} />
                <h3 className="text-2xl font-semibold ml-4 text-gray-900">TED Conferences</h3>
              </div>
              <p className="text-gray-500">Lead Organizer TEDxYouth@NewLondon | Jul 2018 - Dec 2019</p>
              <ul className="list-disc pl-8 text-gray-700">
                <li>Organized and managed TEDx events focusing on youth engagement and innovative ideas.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
                <Image src="/2e.png" alt="2eNews Logo" width={40} height={40} />
                <h3 className="text-2xl font-semibold ml-4 text-gray-900">2eNews</h3>
              </div>
              <p className="text-gray-500">Variations 2e Article Writer | Dec 2018 - Jun 2019</p>
              <ul className="list-disc pl-8 text-gray-700">
                <li>Wrote an article on 2E in the workplace, featured in the Spring 2019 issue of Variations 2E magazine.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
              <Image src="/ba.png" alt="Bridges Academy Logo" width={40} height={40} />

                <h3 className="text-2xl font-semibold text-gray-900">Clues Inc.</h3>
              </div>
              <p className="text-gray-500">Creator | Feb 2017 - 2019</p>
              <ul className="list-disc pl-8 text-gray-700">
                <li>Created and published a comic book to promote awareness about the benefits of neurodiversity.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
                <Image src="/2ecen.png" alt="The Bridges 2e Center Logo" width={40} height={40} />
                <h3 className="text-2xl font-semibold ml-4 text-gray-900">The Bridges 2e Center for Research and Professional Development</h3>
              </div>
              <p className="text-gray-500">Panelist at VISION & LEADERSHIP 2e SYMPOSIUM 2019 | Oct 2018 - Oct 2018</p>
              <ul className="list-disc pl-8 text-gray-700">
                <li>Participated as a panelist, discussing topics related to twice-exceptional education and leadership.</li>
              </ul>
            </motion.div>
          </div>
        </section>

        <section id="education" className="w-full max-w-5xl mx-auto mb-12 bg-white p-8 rounded-lg shadow">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-3xl font-bold mb-4 text-gray-900"
          >
            Education
          </motion.h2>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <Image src="/bgrad.webp" alt="Bridges Graduate School Logo" width={40} height={40} />
              <h3 className="text-2xl font-semibold text-gray-900">Bridges Graduate School of Cognitive Diversity in Education</h3>
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <Image src="/conn.svg.png" alt="Connecticut College Logo" width={40} height={40} />
              <h3 className="text-2xl font-semibold text-gray-900">Connecticut College</h3>
              <p className="text-gray-500">BA, Computer Science and Psychology, Minor in Cognitive Science, Certificate in Arts and Technology from the, Ammerman Center for Arts and Technology | Aug 2017 - May 2021</p>
              <ul className="list-disc pl-8 text-gray-700">
                <li>Research: Mechanisms of attentional processing, Bioinformatics and Computational Biology, Cyber Security and Network Infrastructure, Robotics and Artificial Intelligence </li>
                <li>Advisory Committee: Gary Parker, Joseph A. Schroeder, Jefferson A Singer</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <Image src="/coursera.svg.png" alt="Coursera Logo" width={40} height={40} />
              <h3 className="text-2xl font-semibold text-gray-900">Coursera</h3>
              <p className="text-gray-500">Certificates</p>
              <ul className="list-disc pl-8 text-gray-700">
                <li>Cloud Engineering with GCP by Google Cloud</li>
                <li>Google IT Automation with Python</li>
                <li>Google IT Support by Google</li>
                <li>G Suite Administration Specialization</li>
                <li>Architecting with Google Compute Engine</li>
              </ul>
            </motion.div>
          </div>
        </section>

        <section id="honors & awards" className="w-full max-w-5xl mx-auto mb-12 bg-white p-8 rounded-lg shadow">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-3xl font-bold mb-4 text-gray-900"
          >
            Honors & Awards
          </motion.h2>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <h3 className="text-xl font-semibold text-gray-900">Bridges Diamond Awards - Doug Lenzini</h3>
              <p className="text-gray-500">Apr 2010, Apr 2012, Apr 2013</p>
              <p className="text-gray-700">A distinction reserved for students who model exemplary year-long commitment and service to the school community.</p>
            </motion.div>
            <motion.div
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 1 }}
>
  <h3 className="text-xl font-semibold text-gray-900">2eASD grant scholarship - UCONN</h3>
  <p className="text-gray-500">May 2024</p>
  <p className="text-gray-700">I'm thrilled to share that I have been selected as a recipient of the 2eASD grant scholarship for Confratute 2024! This incredible opportunity will allow me to attend the transformative event at the University of Connecticut from July 14th to July 18th, where I will gain invaluable knowledge, skills, and strategies to better support and engage twice-exceptional (2e) students.
As an educator passionate about meeting the unique needs of 2e learners, I am deeply grateful for this scholarship, which covers my registration, meals, housing, and transportation to and from the event. I'm excited to participate in the keynote and special strand sessions led by renowned experts Sally Reis and Susan Baum, focusing on strength-based pedagogy for 2e students.
As part of the scholarship requirements, I will be developing a final project that showcases how I plan to implement strength-based strategies to support 2e learners in my educational setting. I look forward to collaborating with fellow educators, sharing ideas, and creating a actionable plan to make a positive impact on the lives of 2e students.
I want to express my heartfelt thanks to the 2eASD team for this incredible opportunity. I am committed to making the most of this experience and applying the knowledge gained to create a more inclusive and empowering learning environment for all students, especially those who are twice-exceptional.</p>
</motion.div>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <h3 className="text-xl font-semibold text-gray-900">2020 Impact Labs Fellow</h3>
              <p className="text-gray-500">Jan 2020</p>
              <p className="text-gray-700">Award recognizing innovative contributions in technology.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <h3 className="text-xl font-semibold text-gray-900">Computer Science Leader - Connecticut College</h3>
              <p className="text-gray-500">Aug 2017</p>
              <p className="text-gray-700">Leadership role acknowledged at the beginning of academic tenure.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <h3 className="text-xl font-semibold text-gray-900">Jacobs Design Award (C19 Bayshield)</h3>
              <p className="text-gray-500">Jun 2020</p>
              <p className="text-gray-700">Awarded for leading a team to develop an emergency resource management app, producing over 6300 pieces of PPE.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <h3 className="text-xl font-semibold text-gray-900">Ammerman Center Bridget Baird Award - Connecticut College</h3>
              <p className="text-gray-500">Apr 2021</p>
              <p className="text-gray-700">Awarded for excellence in research in arts and technology.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <h3 className="text-xl font-semibold text-gray-900">Top Emerging Talent Summer '21 - Pangea.app</h3>
              <p className="text-gray-500">Jun 2021</p>
              <p className="text-gray-700">Recognized as one of the most promising recent grads across the globe.</p>
            </motion.div>
          </div>
        </section>
        <section id="projects" className="w-full max-w-5xl mx-auto mb-12 bg-white p-8 rounded-lg shadow">
  <motion.h2
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1 }}
    className="text-3xl font-bold mb-4 text-gray-900"
  >
    Projects
  </motion.h2>
  <div className="space-y-8">
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <h3 className="text-xl font-semibold text-gray-900"><a href="https://resumechecker.cameronaaron.com/" target="_blank" className="text-blue-500 underline">Resume Feedback Assistant</a></h3>
      <p className="text-gray-500">Apr 2024 - Present</p>
      <p className="text-gray-700">Developed an advanced web application using FastAPI that provides actionable advice to improve resumes based on specific job listings. Key features of the application include:</p>
      <ul className="text-gray-700 list-disc pl-5">
        <li>File Upload and Text Extraction: Supports PDF and DOCX resume uploads, extracting text using PDFMiner, PyTesseract, and python-docx.</li>
        <li>AI-Driven Resume Analysis: Utilizes multiple AI providers including OpenAI, Anthropic, and Workers-AI to analyze resumes and job listings, providing tailored optimization advice.</li>
        <li>Comprehensive Resume Review: Extracts key information from resumes and compares it against job listings to identify strengths, gaps, and areas for improvement.</li>
        <li>Actionable Advice: Offers clear, concise, and actionable suggestions for enhancing resumes, including highlighting relevant skills, tailoring content to specific jobs, and optimizing format and structure.</li>
        <li>Robust Error Handling and Logging: Implements aiohttp for API calls with retry strategies and detailed logging using aiologger for monitoring and debugging.</li>
        <li>User-Friendly Interface: Provides a seamless user experience with file upload and resume analysis capabilities, ensuring easy navigation and clear guidance.</li>
      </ul>
      <p className="text-gray-700">This project highlights my skills in Python, FastAPI, asynchronous programming, AI integration, and web development. The application empowers job seekers to create compelling and effective resumes, increasing their chances of securing interviews and job offers.</p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <h3 className="text-xl font-semibold text-gray-900"><a href="https://resumetosite.cameronaaron.com/" target="_blank" className="text-blue-500 underline">Resume to Personal Web Site Converter</a></h3>
      <p className="text-gray-500">Apr 2024 - Present</p>
      <p className="text-gray-700">Developed a sophisticated web application using FastAPI that generates custom Bootstrap websites based on user-uploaded resumes. Key features of the application include:</p>
      <ul className="text-gray-700 list-disc pl-5">
        <li>File Upload and Text Extraction: Supports PDF and DOCX resume uploads, extracting text using PDFMiner, PyTesseract, and python-docx.</li>
        <li>AI-Driven Site Generation: Utilizes multiple AI providers including OpenAI, Anthropic, and Workers-AI to generate HTML, CSS, and JavaScript code for a fully responsive Bootstrap website.</li>
        <li>Comprehensive Content Parsing: Extracts and incorporates key resume information such as profile summaries, skills, certifications, education, and work experience into the website design.</li>
        <li>Robust Error Handling and Logging: Implements aiohttp for API calls with retry strategies and detailed logging using aiologger for monitoring and debugging.</li>
        <li>User-Friendly Interface: Provides a seamless user experience with file upload and site generation capabilities, ensuring easy navigation and clear calls-to-action.</li>
        <li>Responsive Design: Ensures the generated website is optimized for various devices and screen sizes, providing an excellent user experience across desktop, tablet, and mobile platforms.</li>
      </ul>
      <p className="text-gray-700">This project highlights my skills in Python, FastAPI, asynchronous programming, AI integration, and web development. The application empowers users to showcase their professional accomplishments and stand out in their job search or career advancement efforts by providing them with high-quality, custom-built websites.</p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <h3 className="text-xl font-semibold text-gray-900"><a href="https://slangtranslator.cameronaaron.com" target="_blank" className="text-blue-500 underline">Slangtranslator.com</a></h3>
      <p className="text-gray-500">Apr 2024 - Present</p>
      <p className="text-gray-700">Developed a FastAPI-based web application that translates internet slang, colloquialisms, and regional dialects into standard English. Key features of the application include:</p>
      <ul className="text-gray-700 list-disc pl-5">
        <li>Internet Slang Translation: Utilizes advanced AI models from OpenAI and Anthropic to translate slang and online lingo into clear, standard English.</li>
        <li>Contextual Understanding: Provides detailed explanations of the slang, including its meaning, typical usage contexts, and cultural significance.</li>
        <li>Multi-Provider AI Integration: Leverages multiple AI providers to ensure high-quality translations and comprehensive explanations.</li>
        <li>User-Friendly Interface: Allows users to input slang terms and receive translations and explanations in a clean, responsive interface.</li>
        <li>Responsive Design: Ensures the application is accessible and easy to use across various devices and screen sizes.</li>
      </ul>
      <p className="text-gray-700">This project showcases my skills in Python, FastAPI, asynchronous programming, AI integration, and web development. The application helps users understand and interpret modern internet slang, making online communication more accessible and comprehensible.</p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <h3 className="text-xl font-semibold text-gray-900"><a href="https://proofread.cameronaaron.com/" target="_blank" className="text-blue-500 underline">Academic Paper Reviewer/Proof Reader</a></h3>
      <p className="text-gray-500">Aug 2023 - Present</p>
      <p className="text-gray-700">Developed a Flask-based web application that provides detailed proofreading and feedback for academic papers using advanced AI models. Key features of the application include:</p>
      <ul className="text-gray-700 list-disc pl-5">
        <li>Academic Paper Proofreading: Utilizes OpenAI's GPT-4 to review academic papers, offering corrections and suggestions for grammar, style, clarity, content structure, and citations.</li>
        <li>Rate Limiting: Implements Flask-Limiter with Redis for efficient rate limiting to prevent abuse, allowing 10 requests per minute.</li>
        <li>Error Handling and Logging: Includes robust error handling for 404 and 500 errors with detailed logging for effective monitoring and debugging.</li>
        <li>Automatic Retry Strategy: Uses the Requests library with an automatic retry strategy for handling transient errors in API requests.</li>
        <li>User-Friendly Interface: Provides an intuitive interface for users to submit their academic papers and receive constructive feedback.</li>
        <li>Static File Handling: Serves static files like robots.txt efficiently.</li>
        <li>Scalable Deployment: Configured to run with Gunicorn for scalable deployment, ensuring high performance under load.</li>
      </ul>
      <p className="text-gray-700">This project highlights my skills in Python, Flask, API integration, web development, and implementing rate limiting and retry strategies. The application helps users enhance the quality of their academic writing by providing thorough and constructive feedback.</p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <h3 className="text-xl font-semibold text-gray-900"><a href="https://translate.cameronaaron.com/" target="_blank" className="text-blue-500 underline">Advanced Translation Tool</a></h3>
      <p className="text-gray-500">Apr 2023 - Present</p>
      <p className="text-gray-700">Developed an innovative translation application using FastAPI, designed to provide highly accurate and culturally nuanced translations. Key features of the application include:</p>
      <ul className="text-gray-700 list-disc pl-5">
        <li>Multilingual Support: Translates text between various languages with a focus on regional dialects and cultural nuances.</li>
        <li>Formality and Context Sensitivity: Adjusts translations based on formality levels, situational contexts, and specific tones.</li>
        <li>Gender and Tone Consideration: Incorporates gender-specific language and adjusts the tone to match the emotional and stylistic intent of the original text.</li>
        <li>Error Handling and Logging: Utilizes aiohttp for robust API communication with retry strategies and comprehensive logging with aiologger.</li>
        <li>Scalable Architecture: Built with FastAPI for high performance, asynchronous processing, and easy scalability.</li>
      </ul>
      <p className="text-gray-700">The translations are not only accurate but also resonate with native speakers on cultural and emotional levels. This project highlights my skills in Python, FastAPI, asynchronous programming, and API integration.</p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <h3 className="text-xl font-semibold text-gray-900"><a href="https://med.stanford.edu/neurodiversity/SNS2021/Day1.html" target="_blank" className="text-blue-500 underline">Stanford Neurodiversity Summit 2021 Panelist</a></h3>
      <p className="text-gray-500">Aug 2021 - Present</p>
      <p className="text-gray-700">Associated with Bridges Academy.</p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    
    >
      <h3 className="text-xl font-semibold text-gray-900"><a href="https://youtu.be/KQkgt8D0ULQ?si=m6wfwGoNzTrEM7z9" target="_blank" className="text-blue-500 underline">TED ED Talk: Can Machines Be Creative? A Look into Machine Intelligence</a></h3>
      <p className="text-gray-500">Jan 2015 - Present</p>
      <p className="text-gray-700">Associated with Bridges Academy. Will Machines take over the world? This is a question that has been in the minds of people everywhere since the dawn of the age of machine. Through the years machines have evolved literally and today we have the capability to create machines that can learn with no human interaction via trial and error not unlike how humans learn and evolve to adaption to our rapidly changing environment. Companies such as google that farm human data as a business model have already implemented this on a mass scale to serve you ads that its neural network hive mind have determined you would like. But what comes next could a simple spam filter AI determine the best way to get rid of spam is to get rid of humans.</p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <h3 className="text-xl font-semibold text-gray-900"><a href="https://en.wikipedia.org/wiki/Rebound_Rumble" target="_blank" className="text-blue-500 underline">Rebound Rumble</a></h3>
      <p className="text-gray-500">Jan 2012 - Present</p>
      <p className="text-gray-700">Associated with FIRST FRC Team 4019. Objective create a Robot that can score goals in basketball hood autonomously.</p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <h3 className="text-xl font-semibold text-gray-900"><a href="https://conncoll.edu" target="_blank" className="text-blue-500 underline">Machine Learning/Data Mining Project 2: Wrongful conviction data</a></h3>
      <p className="text-gray-500">Mar 2020</p>
      <p className="text-gray-700">Associated with Connecticut College.</p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <h3 className="text-xl font-semibold text-gray-900"><a href="https://conncoll.edu" target="_blank" className="text-blue-500 underline">2019 Connecticut College Network Penetration Test</a></h3>
      <p className="text-gray-500">Aug 2019 - Dec 2019</p>
      <p className="text-gray-700">Associated with Connecticut College.</p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <h3 className="text-xl font-semibold text-gray-900"><a href="https://conncoll.edu" target="_blank" className="text-blue-500 underline">Altruism and Self-esteem</a></h3>
      <p className="text-gray-500">Aug 2019 - Dec 2019</p>
      <p className="text-gray-700">Associated with Connecticut College. Conducted a survey-based study to measure the correlation between one's self-esteem and their altruistic tendencies.</p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <h3 className="text-xl font-semibold text-gray-900"><a href="https://2esymposium.com/speaker-attendee-biographies-a-f/" target="_blank" className="text-blue-500 underline">Panelist @ VISION & LEADERSHIP 2e SYMPOSIUM 2019</a></h3>
      <p className="text-gray-500">Oct 2018</p>
      <p className="text-gray-700">The Bridges 2e Center for Research and Professional Development. Was invited by The Bridges 2e Center for Research and Professional Development to be a Panelist at the VISION & LEADERSHIP 2e SYMPOSIUM 2019.</p>
    </motion.div>
  </div>
</section>
        <section id="testimonials" className="w-full max-w-5xl mx-auto mb-12 bg-white p-8 rounded-lg shadow">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-3xl font-bold mb-4 text-gray-900"
          >
            Testimonials
          </motion.h2>
          <div className="space-y-8">
            {[
              {
                name: "JoeAnna McDonald",
                title: "MA Mathematics",
                date: "March 21, 2024",
                connection: "JoeAnna worked with Cameron on the same team",
                recommendation: "Cameron is a wonderful collaborator. He has been an incredible resource for our school. His multi-faceted expertise (pedagogy, tech, and project development) has supported our students and staff immensely."
              },
              {
                name: "Nate Ledbury",
                title: "CRM Admin at Boston Museum of Science | Certified Salesforce Administrator",
                date: "February 22, 2024",
                connection: "Nate worked with Cameron on the same team",
                recommendation: "Cameron is a passionate and dedicated professional that is a welcomed addition to any team. Its evident he cares about his work, works hard, and gives his all in whatever role he finds himself in."
              },
              {
                name: "H. John Schaeffer",
                title: "CISO and Director of Networks, Servers & Security at Connecticut College",
                date: "February 9, 2024",
                connection: "H. John managed Cameron directly",
                recommendation: "Cameron performed cybersecurity research for Connecticut College during his time as an undergrad. His interest in white hat hacking and his ability to find vulnerabilities was an asset to his research. He found several vulnerabilities in our systems by utilizing different tools to detect them while having zero impact on the college's network. His research provided the college with proof of concept of how threat actors could take advantage of some of our vulnerabilities. We were able to make mitigations based on his findings. Cameron is a thorough investigator who likes to understand problems and get to the bottom of a solution. He is easygoing and a joy to work with. I'd recommend him for any position."
              },
              {
                name: "Rose East",
                title: "Customer support professional focused on building supportive and collaborative communities.",
                date: "January 29, 2024",
                connection: "Rose was senior to Cameron but didn't manage Cameron directly",
                recommendation: "Cameron is enthusiastic and persistent. He has a lot of energy and curiosity and the drive to follow it up."
              },
              {
                name: "Krystle Scott",
                title: "Voice Actor | Narrator | Analyst | Salesforce Administrator | Support Engineer",
                date: "January 24, 2024",
                connection: "Krystle worked with Cameron on the same team",
                recommendation: "Cameron did a phenomenal job with sourcing information across several teams in preparation for onboarding new members of the community forum team at GitHub. He consistently offered novel solutions to issues arising during policy changes and new feature roll out. He has a knack for smoothly connecting objective and introspective observations in collaborative environments."
              },
              {
                name: "Vinicius SantAnna",
                title: "Former HubSpot and Dutchie",
                date: "March 29, 2023",
                connection: "Vinicius was senior to Cameron but didn't manage Cameron directly",
                recommendation: "Cameron is a smart, well spoken, inquisitive worker who always digs deeper to understand the whys, hows and outcome of any task. During his time at Dutchie, I saw him work on a handful of extremely difficult projects with the utmost professionalism and dedication. Any company would be lucky to have Cameron as an employee."
              },
              {
                name: "Sean Hastings",
                title: "Information Security @ Dutchie",
                date: "November 7, 2022",
                connection: "Sean worked with Cameron on the same team",
                recommendation: "Cameron is an exceptional security-minded business applications expert. I consistently leaned on Cameron not only for his subject matter expertise and technical skills, but also his vision for securing the organization's most critical systems and applications. Cameron is a professional who is always looking forward to determine how solutions can be made more secure and more efficient, and he was an immensely helpful ally of the security team. I hope to be granted the privilege of working with Cameron again in the future!"
              },
              {
                name: "Ashley Pinales",
                title: "Latina in Tech | WFM People Leader | ex Grubhub, Wayfair",
                date: "November 6, 2022",
                connection: "Ashley was senior to Cameron but didn't manage Cameron directly",
                recommendation: "I could always count on Cameron to address issues that happened with our systems quickly and make sure they never happen again. Cameron's passion for technology is evident in his work and was demonstrated on a daily basis. He would research new ways for us to use the systems we had and discovered new ways to utilize the data we had to the fullest. I'll greatly miss working with him, but he would be an excellent asset to have on a team where creative problem-solving is revered."
              },
              {
                name: "Darin Mellor",
                title: "Project Manager armed with decades of experience in tech, and fueled by the desire to leave things better than they are found.",
                date: "November 4, 2022",
                connection: "Darin worked with Cameron but on different teams",
                recommendation: "Cameron is a highly motivated, passionate, and a hard working human. In my experience working with him he slayed any challenge he was given. He helped bring together three support organizations and set the foundation for our success. I consider myself lucky to have worked with and learned from Cameron. I know he will be beyond successful at anything he does."
              },
              {
                name: "Michael Gombos",
                title: "Infrastructure Guy",
                date: "July 11, 2022",
                connection: "Michael worked with Cameron but on different teams",
                recommendation: "Cameron is an exceptionally security minded employee at Dutchie. He has been a security champion for the support team. His proactive recommendations have helped security for the company as a whole."
              },
              {
                name: "Justin Hurst",
                title: "Dutchie Hardware and Product Support III",
                date: "July 7, 2022",
                connection: "Justin worked with Cameron on the same team",
                recommendation: "Cameron is a passionate, intelligent, and overall great person to add to any team."
              },
              {
                name: "KT Ellis",
                title: "#OpenToWork | OIT #over-40 Leadership | BRMP®",
                date: "July 6, 2022",
                connection: "KT worked with Cameron on the same team",
                recommendation: "I've only been working with Cameron for a couple months, but his passion for his work was evident on day one! When he attacks a problem, he comes at it from every angle possible, often in new and unique ways than the rest of the team. He shares ways for the company to improve even when they aren't in his natural swim lane. He's smart, dedicated, and really great guy to boot!"
              },
              {
                name: "Diane Walter",
                title: "Director of Marketing and Communications at 412 Food Rescue",
                date: "May 28, 2022",
                connection: "Diane worked with Cameron but they were at different companies",
                recommendation: "Cameron is a force of good in this world. As a senior-level Product Expert for Google Fi, he volunteers his empathy and expertise to assist users on a variety of platforms. His deep product knowledge, creative solutioning, and user-driven insights make him a valued part of the Fi family. He's also a stand-up guy who's just plain fun to interact with."
              },
              {
                name: "Raymond Martinez",
                title: "Customer Experience Leader | Project Manager",
                date: "April 25, 2022",
                connection: "Raymond was senior to Cameron but didn't manage Cameron directly",
                recommendation: "Cameron is a great collaborator and team player. He's someone who goes out of his way to ensure and confirm understanding with others when asked for assistance leaving no stone unturned. Cameron has been vital to my onboarding at Dutchie helping me understand some of our more complex CS systems. He constantly displays his professionalism when working with others to ensure the best and most informed outcome for our team."
              },
              {
                name: "Kate Berezo",
                title: "Community Engagement Director at Thrive Scholars | Driving Social Impact with Top Industry Leaders",
                date: "July 1, 2021",
                connection: "Kate managed Cameron directly",
                recommendation: "Cameron is a one of the most talented and dedicated mentors I've had to privilege of working with in my career. His positive attitude and passion for all things STEM is infectious. I'm forever grateful knowing that I can count on Cameron to provide support to one of our talented Scholars in both personal and professional development during their college careers and beyond."
              },
              {
                name: "Patricia Cebotari",
                title: "Software Developer & Manager | Frontend, SQL, React",
                date: "June 3, 2021",
                connection: "Patricia managed Cameron directly",
                recommendation: "Cameron is ridiculously efficient and has always been willing and able to take the lead in a team setting. After working with him, it was clear that he is forward-thinking and open to learning and putting research into new ideas and approaches. After working with him through an internship, I was particularly impressed by his ability to apply his past experience to new technologies and approaches at the moment."
              },
              {
                name: "Christine Chung, PhD",
                title: "Associate Professor of Computer Science at Connecticut College",
                date: "May 8, 2021",
                connection: "Christine was Cameron’s teacher",
                recommendation: "I have known Cameron Aaron since he was a first year at Conn when I was filling in for his Intro CS professor one day, and he made an immediate impression on me as a bright and inquisitive student. Cameron clearly has a special ability to make connections between and across various topics, concepts, and ways of thinking. He also has an infectious charisma that has made him naturally emerge as a leader among our students. Cameron is caring and passionate and always exudes a productive positivity. He would be an asset to any organization. Our department will sorely miss him after he graduates this spring!"
              },
              {
                name: "Karina Sinha",
                title: "Software Developer at Petricore, Inc",
                date: "April 29, 2021",
                connection: "Karina worked with Cameron on the same team",
                recommendation: "I only worked with Cameron for a few months as part of a summer internship, but those few months told me everything I need to know about his work ethic and personality. He is a hardworking and intelligent computer scientist and researcher who would be an excellent addition to any team. When we worked together at a VR startup, I always found myself pleasantly surprised by his expansive knowledge, attention to detail, and willingness to wear as many hats as needed. Cameron always gives 110%, and with his wide skillset, he has a lot to offer! I highly recommend Cameron to any employer, you won’t regret it!"
              },
              {
                name: "Gwendolyn D'Elia, CPTM",
                title: "Trainer | Salesforce CRM | Agile | Training Specialist within Higher Ed Advancement",
                date: "April 29, 2021",
                connection: "Gwendolyn worked with Cameron on the same team",
                recommendation: "Cameron engaged with the Office of Advancement enthusiastically during his senior year, jumping in always to be of assistance in a variety of ways. With the utmost professionalism and creativity, Cameron has brought all of his academic and professional success into the realm of Advancement and fundraising with kindness and consideration -- truly encompassing what it means to put 'the liberal arts into action'! I'm so excited to see all of the amazing things that Cameron will do in his future, as I'm convinced he'll move mountains."
              },
              {
                name: "Persephone L. Hall",
                title: "Dedicated leader in career development committed to building communities that help students grow to be best version of themselves.",
                date: "April 27, 2021",
                connection: "Persephone L. was Cameron’s mentor",
                recommendation: "Cameron engaged with the career office in his early days as a student at Connecticut College. His intellectual curiosity launched his academic career in computer classes as well as film and literature courses. Cameron has encompassed all aspects of the liberal arts and has been open to learning everything. His ability to think creatively and to be somewhat fearless, has allowed him to draw connections that I don't think the average student would see. As a result, Cameron has been able to secure coveted internship opportunities during his time as a student. I totally expect Cameron to invent or be a part of a team who invents the next best thing! When that happens, I'll be on the sidelines saying, 'I told you!!' I'm so proud of you, Cameron!"
              },
              {
                name: "Shalandy Zhang",
                title: "Software Engineer at Facebook",
                date: "April 26, 2021",
                connection: "Shalandy worked with Cameron on the same team",
                recommendation: "I had the pleasure of working with Cameron at C19 BayShield, where we were developing an app to help distribute 3D-printed PPE during the pandemic. I was inspired by both Cameron's technical knowledge in helping deploy the app to Google Play/iOS as well as his dedication and passion for the mission. Cameron was also a natural in project management, setting clear steps for himself as well as the rest of the engineering team all the while balancing his heavy college coursework. I cannot recommend him enough as I know he would be invaluable in any role and environment he is passionate about."
              },
              {
                name: "Andrea Griffiths PMP CCSK",
                title: "Senior Product Manager at GitHub",
                date: "April 20, 2021",
                connection: "Andrea worked with Cameron on the same team",
                recommendation: "Cameron is a highly empathetic and talented Engineer. Cameron is customer obsessed, an amazing team player and was a wonderful addition to our digital support team. I’d love an opportunity to work with Cameron again."
              },
              {
                name: "Amy Peck",
                title: "XR, Spatial Computing & Emerging Tech Strategist (Non-Hype) • CEO-EndeavorXR • Podcast Host-Future Construct • Keynote Speaker • Futurist • Board Member & Advisor • Author Blockchain is the New Black",
                date: "August 13, 2020",
                connection: "Amy worked with Cameron but they were at different companies",
                recommendation: "Cameron is a rock star!!"
              },
              {
                name: "Rethek Kumar",
                title: "Junior Software Engineer | MAC @ University Of Windsor | FAST Alumni",
                date: "July 30, 2020",
                connection: "Rethek worked with Cameron on the same team",
                recommendation: "Cameron is a critical thinker, always coming up with innovative solutions and a good team-mate, always ready to help and support over any idea, has professionalism and punctuality."
              },
              {
                name: "Anu Kaur",
                title: "Account Manager | Results-Driven Marketing Manager | SEO, Social Media | Aligning Strategies to Drive Win-Win Outcomes | Social Media Strategist | Strategy",
                date: "July 27, 2020",
                connection: "Anu worked with Cameron on the same team",
                recommendation: "Cameron has been a great teammate, always ready to take up new tasks, ready to help. Loved working together."
              },
              {
                name: "Sara Helin",
                title: "Product @ Pactio",
                date: "July 27, 2020",
                connection: "Sara worked with Cameron on the same team",
                recommendation: "Cameron was great to work with on our summer project and really took the initiative. Aside from being friendly and organised, he also has broad technical knowledge which helped develop our project. He is an asset to any team."
              },
              {
                name: "Danielle Fernandez",
                title: "Project Manager",
                date: "July 27, 2020",
                connection: "Danielle worked with Cameron on the same team",
                recommendation: "I’ve had the pleasure of collaborating with Cameron on a project during our fellowship at Nu School. His fresh ideas and perspective, as well as his leadership skills, made virtually working with a team of people who were strangers at first not only easier but also a meaningful learning experience. While our project was short-term, his innovative nature was evident. I have no doubts that Cameron will prove to be a valuable member to any company."
              },
              {
                name: "Dylan Arceneaux",
                title: "Owner and operator at A9 Designs Prototyping and Fabrication.",
                date: "July 27, 2020",
                connection: "Dylan worked with Cameron but on different teams",
                recommendation: "Having Cameron on our team was like having a shining lighthouse on the coast of a rocky shoreline, we would be absolutely lost without him. It’s been the utmost pleasure working with this highly talent, versatile, and skilled developer who has consistently gone above and beyond for the team. If you were making one right move for your company, it would be to have Cameron on your team."
              },
              {
                name: "Dana Castner",
                title: "Founder of Choice Tracker, Sr. Product Designer at Able",
                date: "July 26, 2020",
                connection: "Dana managed Cameron directly",
                recommendation: "During a 2 week capstone project for his internship, Cameron was given a very broad and vague engineering problem to solve. He and his team took the provided UX flows and were able to piece together multiple solution options. I was incredibly impressed when we needed to change direction as a team, he was able to suggest a new technical solution, on the spot, and clearly articulate the tradeoffs and benefits it would have on our product development going forward. Over the two weeks, he was wonderful to work with, taking the lead of his team and implementing organizational structure that made it even easier for me to manage. I would definitely recommend working with Cameron if you have the chance!"
              },
              {
                name: "Tina Taleb",
                title: "Software Engineer",
                date: "February 7, 2020",
                connection: "Tina worked with Cameron on the same team",
                recommendation: "I worked with Cameron at Github for a summer internship. He is undoubtedly intelligent and hard-working. His strong background in CS combined with his interest in other fields made working with him pleasurable and fun! I know he will have a bright future and I wish to work with him again in the future."
              },
              {
                name: "Chris Wiebe",
                title: "Head of School -- Tree Academy",
                date: "December 11, 2015",
                connection: "Chris was Cameron’s mentor",
                recommendation: "I am currently overseeing Cameron's independent study in computer programming and artificial intelligence. His mastery of programming languages and tools, willingness to pursue outside-the-box design thinking, and ability to resolve inevitable bugs that arise are a testament to his work ethic and immense potential in this field."
              },
              {
                name: "Max Goldberg",
                title: "Associate Director at Meredith Corporation | Google Ads | Paid Search SEM | Paid Social | Display Advertising | Digital Advertising | Performance Marketing",
                date: "September 21, 2015",
                connection: "Max worked with Cameron on the same team",
                recommendation: "Cameron is an exceptionally talented young man with remarkable communication skills and technical abilities. He is strong in his will and determined in everything he does. His professionalism is constant. As a young man he already has an impressive trajectory, having raised thousands of dollars for his school's robotics team and establishing relationships with big companies in the US and other countries. He has skill in HTML, Javascript, Python, CSS, and C++, and he loves learning new things. He is a valuable asset and worthy of strong professional consideration."
              },
              {
                name: "Amy Peck",
                title: "XR, Spatial Computing & Emerging Tech Strategist (Non-Hype) • CEO-EndeavorXR • Podcast Host-Future Construct • Keynote Speaker • Futurist • Board Member & Advisor • Author Blockchain is the New Black",
                date: "September 9, 2015",
                connection: "Amy worked with Cameron but they were at different companies",
                recommendation: "Cameron reached out to me when I was at Leap Motion to explore our technology for a school robotics project. I was impressed by his interest in combining several new technologies into what became a very ambitious project. Because Leap Motion was such a small company, it was rare we were able to support such school projects, but we were impressed by Cameron's drive and curiosity - both of which I am sure will serve him well in his future endeavors."
              },
              {
                name: "Kathryn Owen",
                title: "Marketing | Events | Trade Shows",
                date: "September 4, 2015",
                connection: "Kathryn worked with Cameron but they were at different companies",
                recommendation: "I’ve had the privilege of working with Cameron for the 2013-2014 FIRST season as a sponsor for Mechanical Paradise, FRC Team 4019. Cameron was always punctual with deadlines and tasks given, making the sponsorship process easy to manage. His passion for the FIRST Robotics program and his positive, go-getter attitude are great assets to his team. I highly believe Cameron will take these attributes and succeed in any journey he pursues in his future."
              }
            ].map(({ name, title, date, connection, recommendation }) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
              >
                <p className="text-xl italic text-gray-700">"{recommendation}"</p>
                <p className="text-gray-500 mt-2">- {name}, {title} | {date} | {connection}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="contact" className="w-full max-w-5xl mx-auto mb-12 bg-white p-8 rounded-lg shadow">
  <motion.h2
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1 }}
    className="text-3xl font-bold mb-4 text-gray-900"
  >
    Contact
  </motion.h2>
  <motion.p
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1 }}
    className="text-xl mb-4 text-gray-700"
  >
    Feel free to reach out to me for any inquiries or collaborations:
  </motion.p>
  <ul className="text-lg text-gray-700">
    <motion.li
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      Email: <a href="mailto:cameronaaron1@gmail.com" className="text-blue-800 hover:underline">cameronaaron1@gmail.com</a>
    </motion.li>
    <motion.li
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      LinkedIn: <a href="https://www.linkedin.com/in/kamisama" target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:underline">linkedin.com/in/kamisama</a>
    </motion.li>
  </ul>
  <div className="mt-4 flex flex-wrap gap-2">
    <a href="https://twitter.com/cameronaaron4" target="_blank" rel="noopener noreferrer">
      <img alt="Twitter Badge" src="https://img.shields.io/badge/-@cameronaaron4-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" />
    </a>
    
    <a href="https://github.com/cameronaaron" target="_blank" rel="noopener noreferrer">
      <img alt="GitHub Badge" src="https://img.shields.io/badge/-cameronaaron-181717?style=for-the-badge&logo=github&logoColor=white" />
    </a>
    <a href="https://linktr.ee/cameronaaron" target="_blank" rel="noopener noreferrer">
      <img alt="Linktree Badge" src="https://img.shields.io/badge/-linktree-39E09B?style=for-the-badge&logo=linktree&logoColor=white" />
    </a>
    
  </div>
</section>


</main>
</>
);
}
