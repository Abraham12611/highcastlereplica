import type { DemoWorkspace } from '../types';
import { projects } from './projects';

/**
 * Seed fixture: the Northstar Labs sample workspace.
 *
 * Visibly a sample workspace (UI surfaces add the "Simulated demo" label).
 * Projects are composed from projects.ts so rows cannot drift apart.
 */

export const northstarWorkspace: DemoWorkspace = {
  id: 'ws-northstar-labs',
  name: 'Northstar Labs',
  synthetic: true,
  projects,
};
