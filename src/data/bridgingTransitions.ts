/** Companion data for the /bridging-transitions landing page — the target of
 *  the QR code printed on the Stanford Neurodiversity Summit 2026 poster.
 *
 *  Scope discipline: the poster is on the wall next to the person scanning
 *  this. The page does not reprint it. It carries only what paper cannot —
 *  the videos themselves — plus the two things a practitioner wants to leave
 *  with: what to do Monday, and a copy of the poster.
 *
 *  Every string below is copied verbatim from content/poster.yaml in
 *  cameronaaron/bridging-transitions-poster, which is the single source of
 *  truth for the printed copy and is itself language-linted and citation-
 *  checked there. Reword here and the page silently stops matching the poster
 *  the reader is standing in front of. */

/** One "what to do Monday" action, addressed to a specific campus office. */
export interface PosterAction {
  /** The office or role the action is addressed to. */
  audience: string;
  /** Which video in the series backs this action, e.g. 'V2' or 'V4 + V5'. */
  video: string;
  action: string;
}

/** An expert reviewer's on-record assessment of the series. */
export interface PosterReview {
  reviewer: string;
  role: string;
  quote: string;
}

/** A print-ready PDF served from public/poster/. */
export interface PosterDownload {
  label: string;
  description: string;
  href: string;
}

export const bridgingTransitions = {
  /** CONT-01 in the poster repo: must match the registered title in the
   *  SNS26 poster assignments sheet. Distinct from `capstone.title`, which is
   *  the academic capstone's own longer title. */
  posterTitle:
    'Bridging Transitions: A Strength-Based Video Series for Thrice-Exceptional Black Male Students',
  kicker: 'Arts-Based Research',
  presenter: 'Cameron Aaron',
  affiliation: 'Elmbridge University · Graduate School of Cognitive Diversity in Education',
  advisor: 'Advisor: Dr. Tyler Clark',
  category: 'Non-Research Poster · Higher Education',
  session: {
    event: 'Stanford Neurodiversity Summit 2026',
    detail: 'Session #2 · Saturday, September 19, 2026 · 3:35–4:35 PM · LKSC 101/102',
  },

  /** The one-sentence framing that opens the poster's Background panel. */
  premise:
    'Thrice-exceptional students hold three things at once: intellectual giftedness, a learning difference, and cultural complexity (Davis & Robinson, 2018).',
  problem:
    'For Black male students that combination is hard for institutions to see. Read as gifted, the learning difference disappears. Read as disabled, the giftedness disappears. Read through a cultural deficit lens, both disappear at once (Reis et al., 2014; Robinson, 2017).',

  /** Poster's Method panel — why a video series rather than a paper. */
  method:
    'Arts-based research: the making is the inquiry (Leavy, 2020; Guryil et al., 2026). Each video pairs peer-reviewed evidence with the researcher’s own account as a thrice-exceptional Black male student, in a format built for social platforms and staff training rather than journals.',

  actions: [
    {
      audience: 'Disability services',
      video: 'V2',
      action:
        'Revisit intake when documentation arrives incomplete — that is the norm for this population, not an exception.',
    },
    {
      audience: 'Academic advisors',
      video: 'V3',
      action:
        'Read a transcript shaped by masking as evidence about conditions, not a verdict about capacity.',
    },
    {
      audience: 'Faculty',
      video: 'V1',
      action:
        'Run a semester-opening primer on twice- and thrice-exceptionality before accommodation letters arrive.',
    },
    {
      audience: 'Student affairs & DEIB',
      video: 'V4 + V5',
      action: 'Build belonging across the whole identity instead of one office at a time.',
    },
  ] as PosterAction[],

  reviews: [
    {
      reviewer: 'Dr. Joy Lawson Davis',
      role: 'Content review · co-author of the thrice-exceptional framework (Davis & Robinson, 2018)',
      quote: 'Outstanding … comprehensive, clear, concise and potentially very impactful.',
    },
    {
      reviewer: 'Dr. Tyler Clark',
      role: 'Production review · capstone advisor, visiting faculty, Elmbridge University',
      quote: 'Make it feel more authentically you.',
    },
  ] as PosterReview[],

  downloads: [
    {
      label: 'Poster (48 × 36 in)',
      description: 'The full printed poster, vector PDF.',
      href: '/poster/bridging-transitions-poster-48x36.pdf',
    },
    {
      label: 'Handout (11 × 17 in)',
      description: 'Tabloid reduction of the same poster, made to print at home.',
      href: '/poster/bridging-transitions-handout-11x17.pdf',
    },
  ] as PosterDownload[],

  closing: {
    quote:
      'When systems actually work, thrice-exceptional students don’t just survive. We lead.',
    attribution: 'Cameron Aaron · Bridging Transitions',
  },
};
