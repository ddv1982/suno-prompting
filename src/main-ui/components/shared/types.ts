/**
 * Shared types for panel components.
 *
 * @module components/shared/types
 */

import type { ReactNode } from "react";

/**
 * Common props for submit buttons across panels.
 */
export type PanelSubmitButtonProps = {
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Whether in refine mode (editing existing output) */
  isRefineMode: boolean;
  /** Whether in direct mode (using Suno V5 styles) */
  isDirectMode?: boolean;
  /** Whether the submit action can proceed */
  canSubmit: boolean;
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
};

/**
 * Common props for description/feedback text inputs across panels.
 */
export type PanelDescriptionInputProps = {
  /** Current input value */
  value: string;
  /** Whether in refine mode */
  isRefineMode: boolean;
  /** Whether in direct mode */
  isDirectMode: boolean;
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Handler for value changes */
  onChange: (value: string) => void;
  /** Handler for keyboard events (e.g., Enter to submit) */
  onKeyDown: (e: React.KeyboardEvent) => void;
  /** Maximum character limit */
  maxChars: number;
  /** Placeholder text for default state */
  defaultPlaceholder?: string;
  /** Placeholder text for refine mode */
  refinePlaceholder?: string;
  /** Placeholder text for direct mode */
  directModePlaceholder?: string;
  /** Helper text for default state */
  defaultHelperText?: string;
  /** Helper text for refine mode */
  refineHelperText?: string;
  /** Helper text for direct mode */
  directModeHelperText?: string;
  /** Label for default state */
  defaultLabel?: string;
  /** Label for refine mode */
  refineLabel?: string;
  /** Badge to show for the input (e.g., "optional") */
  badge?: string;
  /** Whether to disable in direct mode (non-refine) */
  disableInDirectMode?: boolean;
};

/**
 * Toggle configuration for panel toggles section.
 */
export type PanelToggleConfig = {
  /** Unique ID for the toggle */
  id: string;
  /** Icon to display */
  icon: ReactNode;
  /** Toggle label */
  label: string;
  /** Optional helper text shown below toggle */
  helperText?: string;
  /** Current checked state */
  checked: boolean;
  /** Handler for toggle changes */
  onChange: (checked: boolean) => void;
  /** Whether toggle is disabled */
  disabled?: boolean;
  /** Show N/A badge when disabled */
  showNaBadge?: boolean;
};

/**
 * Props for the toggles section component.
 */
export type PanelTogglesSectionProps = {
  /** Array of toggle configurations */
  toggles: PanelToggleConfig[];
  /** Additional helper texts to display below toggles */
  additionalHelperTexts?: Array<{
    text: string;
    condition?: boolean;
  }>;
};
