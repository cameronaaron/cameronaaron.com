export interface CapstoneVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  focusArea: string;
  url: string;
}

export const capstone = {
  title:
    "Bridging Transitions: Video-Based Educational Content on Thrice-exceptional Black Male Students' Higher Education Journey",
  shortTitle: 'Bridging Transitions',
  advisor: 'Dr. Tyler Clark',
  institution: 'Elmbridge University',
  term: 'Spring 2026',
  datePublished: '2026-05-01',
  playlistUrl: 'https://www.youtube.com/playlist?list=PLPKJAUpRXbupAzN7UaPLEewRw2up_Nyz-',
  abstract:
    'This arts-based capstone produced five short educational videos that translate peer-reviewed research and lived experience into practical guidance for higher-education professionals supporting thrice-exceptional Black male students.',
  audience: [
    'Higher education professionals',
    'Disability services staff',
    'Educators and advisors',
    'Students and families',
  ],
  keywords: [
    'thrice exceptional',
    'thrice-exceptional Black male students',
    'gifted education',
    'higher education transition',
    'arts-based research',
    'culturally responsive education',
    'community cultural wealth',
    'disability services in higher education',
    'strength-based education',
    'educational video series',
    'educational equity',
    'intersectionality in education',
  ],
  objectives: [
    'Produce five research-grounded educational videos (2 to 3 minutes each).',
    'Address identification challenges, transition barriers, strength-based approaches, social-emotional experiences, and institutional recommendations.',
    'Incorporate iterative expert review for content quality, cultural authenticity, and production quality.',
  ],
  videos: [
    {
      id: 'video-1',
      title: 'Video 1: Intro - How identification systems fail to see thrice-exceptional Black males',
      description:
        'Explains under-identification patterns and how traditional gifted-identification systems miss intersecting profiles.',
      duration: 'PT2M30S',
      focusArea: 'Identification challenges',
      url: 'https://youtu.be/zVz1OpLugZo',
    },
    {
      id: 'video-2',
      title: 'Video 2: Transition Barriers - The cliff between K-12 support and higher education',
      description:
        'Examines the legal and operational shift from IDEA support models to ADA self-advocacy burden in college.',
      duration: 'PT2M40S',
      focusArea: 'Higher-education transition barriers',
      url: 'https://youtu.be/3to4vDHLO_4',
    },
    {
      id: 'video-3',
      title: 'Video 3: Strength-Based Approaches - Reframing from deficits to assets',
      description:
        'Applies culturally responsive and strength-based frameworks to support complex learner profiles.',
      duration: 'PT2M35S',
      focusArea: 'Strength-based educational practice',
      url: 'https://youtu.be/i4SgPsfrms0',
    },
    {
      id: 'video-4',
      title: 'Video 4: Social-Emotional Experiences - The hidden cognitive and emotional costs',
      description:
        'Highlights social-emotional load, stereotype threat, and identity navigation in campus environments.',
      duration: 'PT2M40S',
      focusArea: 'Social-emotional experience',
      url: 'https://youtu.be/u_hXunweL1Q',
    },
    {
      id: 'video-5',
      title: 'Video 5: Institutional Recommendations - Concrete actions for systemic change',
      description:
        'Provides practical institutional actions: coordinated supports, ongoing training, family partnership, funding supports, and self-advocacy development.',
      duration: 'PT2M50S',
      focusArea: 'Institutional change recommendations',
      url: 'https://youtu.be/m21bBd5EqK0',
    },
  ] as CapstoneVideo[],
};
