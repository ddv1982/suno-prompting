/**
 * Re-export module for backward compatibility.
 * The EditorContext has been split into separate state and actions contexts
 * for improved performance. See `@/context/editor/` for the implementation.
 *
 * Migration guide:
 * - Components that only read state: use `useEditorState` from `@/context/editor`
 * - Components that only call actions: use `useEditorActions` from `@/context/editor`
 * - Components that need both: continue using `useEditorContext`
 */
export {
  EditorProvider,
  useEditorContext,
  useEditorState,
  useEditorActions,
  type EditorContextType,
  type EditorStateContextType,
  type EditorActionsContextType,
} from './editor';
