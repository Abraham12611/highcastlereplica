/**
 * Clean public import surface for the Finding Detail page (and any host):
 *
 *   import { AttackMap } from '@/features/attack-map';
 *
 * No global styles are pulled in — only the co-located CSS module.
 */

export { AttackMap } from './AttackMap';
export { ATTACK_MAP_REVISIONS, buildAttackPath, getNode } from './attackPathModel';
export type {
  AttackMapEdge,
  AttackMapEdgeState,
  AttackMapFindingRef,
  AttackMapHttpSample,
  AttackMapModel,
  AttackMapNode,
  AttackMapNodeKind,
  AttackMapNodeStatus,
  AttackMapProps,
  AttackMapRevision,
  AttackMapVerdict,
} from './types';
