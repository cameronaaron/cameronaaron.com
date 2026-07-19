'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { NursingProgram } from '@/data/nursingPrograms';
import type { TranscriptCourse } from '@/data/nursingTranscript';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { buildTranscriptIndex } from './matching-logic';
import {
  ALL_CITIES,
  EMPTY_PROGRAM_TASKS,
  EMPTY_STARRED,
  EMPTY_TASKS,
  type StarredMap,
  type TaskCompletionMap,
  buildProgramView,
  filterViewsByCity,
  groupProgramsByCity,
  listCities,
} from './dashboard-logic';
import { NOW_REFRESH_MS } from './window-logic';
import CityFilterBar from './CityFilterBar';
import ProgramCard from './ProgramCard';

interface NursingDashboardProps {
  programs: NursingProgram[];
  transcriptCourses: TranscriptCourse[];
}

export default function NursingDashboard({ programs, transcriptCourses }: NursingDashboardProps) {
  // Deterministic constant on first render (server HTML and first client
  // paint both compute every window as "closed"), replaced with the real
  // clock inside useEffect — never a live Date() read in a lazy initializer.
  // See src/ssr-hydration-contract.test.ts / local-time-logic.ts for the
  // same pattern used elsewhere in this codebase.
  const [now, setNow] = useState<Date>(new Date(0));
  const [selectedCity, setSelectedCity] = useState<string>(ALL_CITIES);
  const [starred, setStarred] = useLocalStorage<StarredMap>('nursing.starredPrograms', EMPTY_STARRED);
  const [taskCompletion, setTaskCompletion] = useLocalStorage<TaskCompletionMap>('nursing.applicationTasks', EMPTY_TASKS);

  useEffect(() => {
    const sync = () => setNow(new Date());
    sync();
    const id = window.setInterval(sync, NOW_REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  const transcriptIndex = useMemo(() => buildTranscriptIndex(transcriptCourses), [transcriptCourses]);
  const cities = useMemo(() => listCities(programs), [programs]);
  const views = useMemo(
    () => programs.map((program) => buildProgramView(program, transcriptIndex, now)),
    [programs, transcriptIndex, now]
  );
  const cityGroups = useMemo(
    () => groupProgramsByCity(filterViewsByCity(views, selectedCity)),
    [views, selectedCity]
  );

  const handleToggleStar = useCallback(
    (programId: string) => {
      setStarred((prev) => ({ ...prev, [programId]: !prev[programId] }));
    },
    [setStarred]
  );

  const handleToggleTask = useCallback(
    (programId: string, taskId: string) => {
      setTaskCompletion((prev) => ({
        ...prev,
        [programId]: { ...prev[programId], [taskId]: !prev[programId]?.[taskId] },
      }));
    },
    [setTaskCompletion]
  );

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-white/10 py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,212,146,0.2),transparent_55%)]" />
        <div className="container relative z-10 mx-auto px-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Private Tracker</p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-white md:text-4xl font-display">
            Nursing Program Tracker
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            An unofficial, self-maintained tracker — verify all deadlines and prerequisite requirements directly with
            each school before relying on anything shown here. Prerequisite checklists and GPA are computed live
            against my own coursework; application windows update automatically as they open, get close to closing,
            or close. This page is intentionally excluded from search and navigation.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-6">
          {programs.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-muted-foreground">
              No verified programs yet.
            </p>
          ) : (
            <>
              <div className="mb-8">
                <CityFilterBar cities={cities} selectedCity={selectedCity} onSelectCity={setSelectedCity} />
              </div>

              <div className="space-y-10">
                {cityGroups.map((group) => (
                  <div key={group.city}>
                    <h2 className="mb-4 text-2xl font-bold text-white font-display">{group.city}</h2>
                    <div className="grid gap-6 lg:grid-cols-2">
                      {group.views.map((view) => (
                        <ProgramCard
                          key={view.program.id}
                          view={view}
                          isStarred={starred[view.program.id] ?? false}
                          onToggleStar={() => handleToggleStar(view.program.id)}
                          completedTaskIds={taskCompletion[view.program.id] ?? EMPTY_PROGRAM_TASKS}
                          onToggleTask={(taskId) => handleToggleTask(view.program.id, taskId)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
