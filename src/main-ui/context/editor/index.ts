/**
 * Editor context module - provides editor state and actions to the application.
 *
 * Architecture:
 * - State and actions are split into separate contexts for performance
 * - Components that only read state use `useEditorState`
 * - Components that only dispatch actions use `useEditorActions`
 * - Components that need both use `useEditorContext` (backward compatible)
 *
 * Performance benefits:
 * - State updates don't trigger re-renders in components that only use actions
 * - Action callbacks are stable and don't cause unnecessary re-renders
 */

export { EditorProvider } from './editor-provider';
export { EditorStateContext, useEditorState } from './editor-state-context';
export { EditorActionsContext, useEditorActions } from './editor-actions-context';
export type { EditorContextType, EditorStateContextType, EditorActionsContextType } from './types';

// Backward compatible hook that combines state and actions
import { useEditorActions } from './editor-actions-context';
import { useEditorState } from './editor-state-context';
import { type EditorContextType } from './types';

/**
 * Combined hook for backward compatibility.
 * Returns both state and actions in a single object.
 * @throws Error if used outside of EditorProvider
 */
export const useEditorContext = (): EditorContextType => {
  const state = useEditorState();
  const actions = useEditorActions();
  return { ...state, ...actions };
};
