/**
 * Shared types for Debug Drawer components.
 *
 * During the Debug Trace migration, the drawer only renders the persisted
 * `TraceRun` object.
 */

import type { TraceRun } from '@shared/types';

export type DebugDrawerBodyProps = {
  debugTrace: TraceRun;
};
