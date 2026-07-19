import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import NursingPage, { dynamic, metadata } from './page';
import { nursingPrograms } from '@/data/nursingPrograms';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('nursing page', () => {
  it('is statically generated and noindexed', () => {
    expect(dynamic).toBe('force-static');
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates?.canonical).toBe('/nursing');
  });

  it('renders a card for every program, grouped under its city', async () => {
    render(<NursingPage />);
    await act(async () => {});

    for (const program of nursingPrograms) {
      expect(screen.getByTestId(`program-card-${program.id}`)).toBeTruthy();
    }
    expect(screen.getByRole('heading', { name: 'Los Angeles' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Azusa' })).toBeTruthy();
  });

  it('shows the correct chemistry badge per program (MSMU: no chem, APU: chem required)', async () => {
    render(<NursingPage />);
    await act(async () => {});

    const msmuCard = screen.getByTestId('program-card-msmu-absn');
    expect(within(msmuCard).getByText('No chemistry required')).toBeTruthy();

    const apuCard = screen.getByTestId('program-card-apu-elm');
    expect(within(apuCard).getByText('Chemistry required')).toBeTruthy();
  });

  it('filters programs by city', async () => {
    render(<NursingPage />);
    await act(async () => {});

    fireEvent.click(screen.getByRole('button', { name: 'Azusa' }));

    expect(screen.queryByTestId('program-card-msmu-absn')).toBeNull();
    expect(screen.getByTestId('program-card-apu-elm')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'All cities' }));
    expect(screen.getByTestId('program-card-msmu-absn')).toBeTruthy();
  });

  it('persists the starred/applying toggle to localStorage', async () => {
    render(<NursingPage />);
    await act(async () => {});

    const card = screen.getByTestId('program-card-msmu-absn');
    const starButton = within(card).getByRole('button', { name: /track this one/i });
    fireEvent.click(starButton);

    expect(within(card).getByRole('button', { name: /applying/i })).toBeTruthy();
    expect(window.localStorage.getItem('nursing.starredPrograms')).toContain('msmu-absn');
  });

  it('persists an application-task checkbox to localStorage', async () => {
    render(<NursingPage />);
    await act(async () => {});

    const card = screen.getByTestId('program-card-msmu-absn');
    const checkbox = within(card).getByLabelText('Submit the application') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(window.localStorage.getItem('nursing.applicationTasks')).toContain('submit-application');
  });

  it('renders the prerequisite checklist and readiness summary for a program', async () => {
    render(<NursingPage />);
    await act(async () => {});

    const card = screen.getByTestId('program-card-msmu-absn');
    expect(within(card).getByText('Prerequisites')).toBeTruthy();
    expect(within(card).getAllByText(/prereqs complete/).length).toBeGreaterThan(0);
    expect(within(card).getByText(/readiness/i)).toBeTruthy();
  });
});
