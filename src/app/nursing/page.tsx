import { getPageUrl } from '@/data/site';
import { nursingPrograms } from '@/data/nursingPrograms';
import { transcriptCourses } from '@/data/nursingTranscript';
import NursingDashboard from './NursingDashboard';
import { buildNursingMetadata } from './metadata';

export const dynamic = 'force-static';

const pageUrl = getPageUrl('/nursing');

export const metadata = buildNursingMetadata(pageUrl);

export default function NursingPage() {
  return <NursingDashboard programs={nursingPrograms} transcriptCourses={transcriptCourses} />;
}
