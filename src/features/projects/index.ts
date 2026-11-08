/**
 * Projects lane public surface (issue #8).
 * Route pages under `src/app/app/projects/` render these components.
 */
export { default as ProjectDetail } from './ProjectDetail';
export { default as ProjectsList } from './ProjectsList';
export { default as NewProjectWizard } from './NewProjectWizard';
export {
  SAMPLE_PERMISSIONS,
  SAMPLE_PROJECTS,
  SAMPLE_SCENARIOS,
  SIMULATED_DEMO_LABEL,
  URL_DISPLAY_ONLY_NOTICE,
  USER_PROJECTS_STORAGE_KEY,
  WORKSPACE_NAME,
  clearUserProjects,
  loadUserProjects,
  mergeProjects,
  projectIdForSlug,
  sampleProjectById,
  sampleScanIdFor,
  saveUserProjects,
  scenarioById,
  slugifyName,
  validateDisplayOnlyUrl,
} from './projects-catalog';
export { useDemoProjects, useSampleProject } from './use-demo-projects';
export type {
  NewProjectInput,
} from './use-demo-projects';
export type {
  ProjectStatus,
  ProjectView,
  SampleDemoProject,
  SampleDemoScenario,
  SamplePermissionId,
  UrlValidation,
} from './projects-catalog';
