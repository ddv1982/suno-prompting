/**
 * Shared types for Debug Drawer components.
 *
 * @module components/prompt-editor/debug-drawer/types
 */

import type { DebugInfo } from "@shared/types";

/**
 * Props for the main DebugDrawerBody component.
 */
export type DebugDrawerBodyProps = {
  debugInfo: Partial<DebugInfo>;
};

/**
 * Props for collapsible LLM call sections.
 */
export type LLMCallSectionProps = {
  title: string;
  systemPrompt: string;
  userPrompt: string;
  extraInfo?: string;
  defaultExpanded?: boolean;
  onCopy: (text: string, section: string) => void;
  copiedSection: string | null;
  sectionKey: string;
};

/**
 * Props for the debug metadata header.
 */
export type DebugMetadataHeaderProps = {
  debugInfo: Partial<DebugInfo>;
};

/**
 * Props for the LLM calls section.
 */
export type LLMCallsSectionProps = {
  debugInfo: Partial<DebugInfo>;
  onCopy: (text: string, section: string) => void;
  copiedSection: string | null;
};
