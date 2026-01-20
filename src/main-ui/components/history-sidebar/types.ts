/**
 * Shared types for History Sidebar components.
 *
 * @module components/history-sidebar/types
 */

import type { PromptSession } from "@shared/types";

/**
 * Props for the main HistorySidebar component.
 */
export interface HistorySidebarProps {
  sessions: PromptSession[];
  currentSessionId: string | null;
  onSelectSession: (session: PromptSession) => void;
  onDeleteSession: (id: string) => Promise<void>;
  onNewProject: () => void;
}

/**
 * Props for individual history items.
 */
export interface HistoryItemProps {
  session: PromptSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => Promise<void>;
}
