import { createContext, useContext } from 'react';

import { type EditorStateContextType } from './types';

/**
 * Context for editor state values.
 * Separated from actions to prevent re-renders in components
 * that only need to read state without updating it.
 */
export const EditorStateContext = createContext<EditorStateContextType | null>(null);

/**
 * Hook to access editor state values.
 * Use this when your component only needs to read state.
 * @throws Error if used outside of EditorProvider
 */
export const useEditorState = (): EditorStateContextType => {
  const context = useContext(EditorStateContext);
  if (!context) {
    throw new Error('useEditorState must be used within EditorProvider');
  }
  return context;
};
