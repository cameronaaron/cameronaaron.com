import { getPageUrl } from '@/data/site';
import { nursingPrograms } from '@/data/nursingPrograms';
import { transcriptCourses } from '@/data/nursingTranscript';
import NursingDashboard from './NursingDashboard';
import { buildNursingMetadata } from './metadata';
import { NURSING_FONT_PRELOADS, preloadFontFiles } from '../font-preloads';

export const dynamic = 'force-static';

const pageUrl = getPageUrl('/nursing');

export const metadata = buildNursingMetadata(pageUrl);

export default function NursingPage() {
  preloadFontFiles(NURSING_FONT_PRELOADS);
  return <NursingDashboard programs={nursingPrograms} transcriptCourses={transcriptCourses} />;
}
