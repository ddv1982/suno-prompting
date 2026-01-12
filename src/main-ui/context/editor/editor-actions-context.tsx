import { createContext, useContext } from 'react';

import { type EditorActionsContextType } from './types';

/**
 * Context for editor action functions.
 * Separated from state to prevent re-renders in components
 * that only need to dispatch actions without reading state.
 */
export const EditorActionsContext = createContext<EditorActionsContextType | null>(null);

/**
 * Hook to access editor action functions.
 * Use this when your component only needs to call actions.
 * @throws Error if used outside of EditorProvider
 */
export const useEditorActions = (): EditorActionsContextType => {
  const context = useContext(EditorActionsContext);
  if (!context) {
    throw new Error('useEditorActions must be used within EditorProvider');
  }
  return context;
};
