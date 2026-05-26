export interface Certification {
  name: string;
  issuer: string;
  status: string;
  credentialId: string;
  verificationUrl: string;
  verificationQueryParam?: string;
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
    verificationUrl: "https://emsregistry.emsa.ca.gov/caemsa?id=license_detail&sys_id=b94c1a2f1b6bb610f8e62138624bcb8d",
  },
  {
    name: "Emergency Medical Technician (EMT)",
    issuer: "National Registry of EMTs",
    status: "Active (Expires Mar 2028)",
    credentialId: "E4097508",
    verificationUrl: "https://www.nremt.org/verify-credentials",
  },
  {
    name: "Certified Nursing Assistant (CNA)",
    issuer: "California Dept. of Public Health",
    status: "Active (Expires Sep 2028)",
    credentialId: "CNA 01357099",
    verificationUrl: "https://cvl.cdph.ca.gov/DetailPage.aspx?cert_holder_id=797902",
  },
  {
    name: "Advanced Cardiovascular Life Support (ACLS)",
    issuer: "American Heart Association",
    status: "Active (Expires Dec 2027)",
    credentialId: "265408320996",
    verificationUrl: "https://ecards.heart.org/api/relay/v1/ecard/getfullpdf?eCardUId=A1B5403C-5D5D-40CA-B89B-BB660A452AE7&langId=1",
  },
  {
    name: "Pediatric Advanced Life Support (PALS)",
    issuer: "American Heart Association",
    status: "Active (Expires Jan 2028)",
    credentialId: "265429107644",
    verificationUrl: "https://ecards.heart.org/api/relay/v1/ecard/getfullpdf?eCardUId=5FDD8C2A-4EEC-4AAA-A39C-A31051C0112D&langId=1",
  },
  {
    name: "Basic Life Support (BLS)",
    issuer: "American Heart Association",
    status: "Active (Expires Aug 2027)",
    credentialId: "265415002799",
    verificationUrl: "https://ecards.heart.org/api/relay/v1/ecard/getfullpdf?eCardUId=D2652075-56D4-4452-9F44-AF0F20FA78B0&langId=1",
  },
  {
    name: "Neonatal Resuscitation Program (NRP) Advanced Provider",
    issuer: "NRP",
    status: "Active (Expires Nov 2027)",
    credentialId: "1hrm0zbkewrowjwkvaphzstd",
    verificationUrl: "https://nrplearningplatform.com/certificateAdmin/0.1/verify_certificate",
  },
  {
    name: "Community Health Worker (CHW) Certificate",
    issuer: "Los Angeles Valley College",
    status: "Earned (Oct 2025)",
    credentialId: "5ed28264-10a0-4798-b16b-f94393e0b7da",
    verificationUrl: "https://www.lavc.edu/admissions/order-transcripts",
    verificationQueryParam: "credentialId",
  },
  {
    name: "Private Security Agent",
    issuer: "CA Bureau of Security & Investigative Services",
    status: "Active (Expires Aug 2027)",
    credentialId: "6859700",
    verificationUrl: "https://search.dca.ca.gov/details/1201/G/6859700/e1facef21869287b88a72c38de0b3b3d",
  },
  {
    name: "Protecting Human Research Participants",
    issuer: "National Institutes of Health",
    status: "Active",
    credentialId: "2504076",
    verificationUrl: "https://phrptraining.com/login",
    verificationQueryParam: "certificateId",
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
