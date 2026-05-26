export interface Certification {
  name: string;
  issuer: string;
  status: string;
  credentialId: string;
}

export interface InProgressCertification {
  name: string;
  expectedCompletion: string;
  status: string;
}

export const certifications: Certification[] = [
  {
    name: "Emergency Medical Technician (EMT)",
    issuer: "Los Angeles County EMS Agency",
    status: "Active (Expires Feb 2028)",
    credentialId: "E216130",
  },
  {
    name: "Emergency Medical Technician (EMT)",
    issuer: "National Registry of EMTs",
    status: "Active (Expires Mar 2028)",
    credentialId: "E4097508",
  },
  {
    name: "Certified Nursing Assistant (CNA)",
    issuer: "California Dept. of Public Health",
    status: "Active (Expires Sep 2028)",
    credentialId: "CNA 01357099",
  },
  {
    name: "Advanced Cardiovascular Life Support (ACLS)",
    issuer: "American Heart Association",
    status: "Active (Expires Dec 2027)",
    credentialId: "265408320996",
  },
  {
    name: "Pediatric Advanced Life Support (PALS)",
    issuer: "American Heart Association",
    status: "Active (Expires Jan 2028)",
    credentialId: "265429107644",
  },
  {
    name: "Basic Life Support (BLS)",
    issuer: "American Heart Association",
    status: "Active (Expires Aug 2027)",
    credentialId: "265415002799",
  },
  {
    name: "Neonatal Resuscitation Program (NRP) Advanced Provider",
    issuer: "NRP",
    status: "Active (Expires Nov 2027)",
    credentialId: "1hrm0zbkewrowjwkvaphzstd",
  },
  {
    name: "Community Health Worker (CHW) Certificate",
    issuer: "Los Angeles Valley College",
    status: "Earned (Oct 2025)",
    credentialId: "5ed28264-10a0-4798-b16b-f94393e0b7da",
  },
  {
    name: "Private Security Agent",
    issuer: "CA Bureau of Security & Investigative Services",
    status: "Active (Expires Aug 2027)",
    credentialId: "6859700",
  },
  {
    name: "Protecting Human Research Participants",
    issuer: "National Institutes of Health",
    status: "Active",
    credentialId: "2504076",
  },
];

export const inProgressCertifications: InProgressCertification[] = [
  {
    name: "Certified EKG Technician (CET) - NHA",
    expectedCompletion: "2026 (Estimated)",
    status: "In Progress",
  },
  {
    name: "Certified Phlebotomist",
    expectedCompletion: "2026 (Estimated)",
    status: "In Progress",
  },
];
