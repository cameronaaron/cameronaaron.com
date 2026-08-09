import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PrereqChecklistRow from './PrereqChecklistRow';
import type { RequirementMatch } from './matching-logic';
import type { TranscriptCourse } from '@/data/nursingTranscript';

const course: TranscriptCourse = {
  category: 'anatomy',
  course: 'BIOL 210',
  institution: 'LACCD',
  units: 4,
  status: 'completed',
  grade: 'A',
  gradePoints: 4.0,
};

describe('PrereqChecklistRow', () => {
  it('shows the matched course and no pulse indicator when completed', () => {
    const match: RequirementMatch = {
      requirement: { category: 'anatomy', label: 'Human Anatomy' },
      state: 'completed',
      matchedCourses: [course],
      bestCourse: course,
    };
    render(
      <ul>
        <PrereqChecklistRow match={match} />
      </ul>
    );

    expect(screen.getByText('BIOL 210')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(document.querySelector('.animate-ping')).toBeNull();
  });

  it('omits the course line and shows a pulse indicator when nothing is matched yet', () => {
    const match: RequirementMatch = {
      requirement: { category: 'anatomy', label: 'Human Anatomy' },
      state: 'missing',
      matchedCourses: [],
      bestCourse: null,
    };
    render(
      <ul>
        <PrereqChecklistRow match={match} />
      </ul>
    );

    expect(screen.queryByText('BIOL 210')).toBeNull();
    expect(screen.getByText('Not started')).toBeTruthy();
  });

  it('renders requirement notes when present', () => {
    const match: RequirementMatch = {
      requirement: { category: 'anatomy', label: 'Human Anatomy', notes: 'Prefer 4-unit lab section' },
      state: 'in-progress',
      matchedCourses: [],
      bestCourse: null,
    };
    render(
      <ul>
        <PrereqChecklistRow match={match} />
      </ul>
    );

    expect(screen.getByText('Prefer 4-unit lab section')).toBeTruthy();
    expect(document.querySelector('.animate-ping')).toBeTruthy();
  });
});
