/**
 * Shared types for panel components.
 *
 * @module components/shared/types
 */

import type { ReactNode } from "react";

/**
 * Common props for submit buttons across panels.
 */
export interface PanelSubmitButtonProps {
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Whether in refine mode (editing existing output) */
  isRefineMode: boolean;
  /** Whether in direct mode (using Suno V5 styles) */
  isDirectMode?: boolean;
  /** Whether the submit action can proceed */
  canSubmit: boolean;
  /** Whether to show refined success state */
  refined?: boolean;
  /** Handler for submit action */
  onSubmit: () => void;
  /** Icon to display in default state */
  defaultIcon?: ReactNode;
  /** Label to display in default state */
  defaultLabel?: string;
  /** Icon to display in direct mode */
  directModeIcon?: ReactNode;
  /** Label to display in direct mode */
  directModeLabel?: string;
  /** Label to display in refine mode */
  refineLabel?: string;
  /** Label to display in refine direct mode */
  refineDirectModeLabel?: string;
}
