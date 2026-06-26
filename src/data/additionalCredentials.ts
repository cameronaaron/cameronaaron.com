export interface AcademicVerificationResource {
  name: string;
  institution: string;
  description: string;
  url: string;
  credentialId?: string;
}

export interface AdditionalCredential {
  name: string;
  issuer: string;
  issued: string;
  credentialId: string;
  verificationUrl: string;
  notes?: string;
}

export const academicVerificationResources: AcademicVerificationResource[] = [
  {
    name: 'Connecticut College Digital Diploma Validation',
    institution: 'Connecticut College',
    description: 'Official degree verification portal for digital diploma authentication.',
    url: 'https://www.conncoll.edu/academics/registrar/digital-diplomas/cediploma-validation/',
    credentialId: '227H-DXTM-CXND',
  },
  {
    name: 'Community Health Worker (CHW) Credential Verification Record',
    institution: 'Los Angeles Valley College via Parchment',
    description: 'Direct verification record for CHW credential confirmation.',
    url: 'https://www.parchment.com/lp/award/5ed28264-10a0-4798-b16b-f94393e0b7da',
    credentialId: '5ed28264-10a0-4798-b16b-f94393e0b7da',
  },
];

export const additionalCredentials: AdditionalCredential[] = [
  {
    name: 'Google Advanced Data Analytics Specialization',
    issuer: 'Google (Coursera)',
    issued: 'Sep 2024',
    credentialId: 'YL97H6X2CJB9',
    verificationUrl: 'https://www.coursera.org/verify/specialization/YL97H6X2CJB9',
  },
  {
    name: 'Google Business Intelligence Specialization',
    issuer: 'Google (Coursera)',
    issued: 'Jul 2024',
    credentialId: 'AN29HKSZVTSJ',
    verificationUrl: 'https://www.coursera.org/verify/specialization/AN29HKSZVTSJ',
  },
  {
    name: 'Google Project Management Specialization',
    issuer: 'Google (Coursera)',
    issued: 'Jul 2024',
    credentialId: '35GA4PT55P58',
    verificationUrl: 'https://www.coursera.org/verify/specialization/35GA4PT55P58',
  },
  {
    name: 'Google Data Analytics Specialization',
    issuer: 'Google (Coursera)',
    issued: 'Dec 2022',
    credentialId: 'NNB9A5JV8WSA',
    verificationUrl: 'https://www.coursera.org/verify/specialization/NNB9A5JV8WSA',
  },
  {
    name: 'Suite of Tools Level 2',
    issuer: 'Elmbridge University (formerly Bridges Graduate School)',
    issued: 'Apr 2024',
    credentialId: 'Suite-of-Tools-Level-2',
    verificationUrl: 'https://elmbridge.edu/',
    notes: 'Institutional training credential.',
  },
  {
    name: 'SENSORY INCLUSIVE Training Certificate',
    issuer: 'KultureCity',
    issued: 'Feb 2026',
    credentialId: 'KULTURECITY-SI-2026',
    verificationUrl: 'https://www.kulturecity.org/training/',
    notes: 'Expires Feb 2027.',
  },
  {
    name: 'SENSORY INCLUSIVE First Responder Training Certificate',
    issuer: 'KultureCity',
    issued: 'Feb 2026',
    credentialId: 'KULTURECITY-FR-2026',
    verificationUrl: 'https://www.kulturecity.org/training/',
    notes: 'Expires Feb 2027.',
  },
  {
    name: 'KultureCity Sensory Accessible/Inclusive Training',
    issuer: 'KultureCity',
    issued: 'Feb 2026',
    credentialId: 'KULTURECITY-ACCESS-2026',
    verificationUrl: 'https://www.kulturecity.org/training/',
    notes: 'Expires Feb 2027.',
  },
  {
    name: 'Google IT Automation with Python Specialization',
    issuer: 'Coursera',
    issued: 'Mar 2020',
    credentialId: '56UX6XK93RUE',
    verificationUrl: 'https://www.coursera.org/verify/specialization/56UX6XK93RUE',
  },
  {
    name: 'G Suite Administration Specialization',
    issuer: 'Coursera',
    issued: 'Mar 2020',
    credentialId: 'KE556WEY57QK',
    verificationUrl: 'https://www.coursera.org/verify/specialization/KE556WEY57QK',
  },
  {
    name: 'Cloud Engineering with GCP Specialization',
    issuer: 'Coursera',
    issued: 'Jan 2020',
    credentialId: 'QU4S27ZCRDXZ',
    verificationUrl: 'https://www.coursera.org/verify/specialization/QU4S27ZCRDXZ',
  },
  {
    name: 'Google IT Support Specialization',
    issuer: 'Coursera',
    issued: 'Jan 2020',
    credentialId: 'QBP8786KGTVK',
    verificationUrl: 'https://www.coursera.org/verify/specialization/QBP8786KGTVK',
  },
  {
    name: 'Architecting with Google Compute Engine Specialization',
    issuer: 'Coursera',
    issued: 'Dec 2019',
    credentialId: 'VW7G9Y7KVBF3',
    verificationUrl: 'https://www.coursera.org/verify/specialization/VW7G9Y7KVBF3',
  },
];
