'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SAMPLE_PROJECTS,
  clearUserProjects,
  loadUserProjects,
  mergeProjects,
  projectIdForSlug,
  sampleProjectById,
  saveUserProjects,
  slugifyName,
  type ProjectView,
  type SampleDemoProject,
} from './projects-catalog';

export interface NewProjectInput {
  name: string;
  description: string;
  /** Already format-validated display-only URL. */
  url: string;
  scenarioId: string;
  permissionIds: string[];
}

function slugTaken(all: ProjectView[], slug: string): boolean {
  return all.some((p) => p.slug === slug || p.id === `proj-${slug}`);
}

/**
 * Mount-guarded project store. Reads localStorage only after mount so SSR
 * output matches the server (no hydration mismatch). Samples are always
 * present; user rows persist across reloads until reset.
 */
export function useDemoProjects() {
  const [userProjects, setUserProjects] = useState<SampleDemoProject[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUserProjects(loadUserProjects());
    setMounted(true);
  }, []);

  const projects: ProjectView[] = useMemo(() => mergeProjects(userProjects), [userProjects]);

  const findProject = useCallback(
    (id: string): ProjectView | undefined =>
      projects.find((p) => p.id === id) ?? mergeProjects(loadUserProjects()).find((p) => p.id === id),
    [projects],
  );

  const createProject = useCallback(
    (input: NewProjectInput): ProjectView => {
      const slugBase = slugifyName(input.name);
      const takenIds = new Set<string>([
        ...SAMPLE_PROJECTS.map((p) => p.id),
        ...userProjects.map((p) => p.id),
      ]);
      let slug = slugBase;
      let n = 2;
      const current: ProjectView[] = mergeProjects(userProjects);
      while (slugTaken(current, slug)) {
        slug = `${slugBase}-${n}`;
        n += 1;
      }
      const project: SampleDemoProject = {
        id: projectIdForSlug(slug, takenIds),
        slug,
        name: input.name.trim(),
        description: input.description.trim() || 'Custom demo project (display-only URL).',
        url: input.url,
        createdAt: new Date().toISOString(),
        status: 'ready',
        scenarioId: input.scenarioId,
      };
      const next = [...userProjects, project];
      setUserProjects(next);
      saveUserProjects(next);
      return { ...project, sample: false };
    },
    [userProjects],
  );

  const resetToSamples = useCallback(() => {
    clearUserProjects();
    setUserProjects([]);
  }, []);

  return { projects, findProject, createProject, resetToSamples, mounted, sampleCount: SAMPLE_PROJECTS.length };
}

/** Resolve a sample project synchronously (no store needed). */
export function useSampleProject(id: string): ProjectView | undefined {
  return useMemo(() => {
    const found = sampleProjectById(id);
    return found ? { ...found, sample: true } : undefined;
  }, [id]);
}
