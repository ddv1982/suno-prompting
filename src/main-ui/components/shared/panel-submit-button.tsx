/**
 * Panel Submit Button Component
 *
 * Unified submit button for Creative Boost and Quick Vibes panels.
 *
 * @module components/shared/panel-submit-button
 */

import { Check, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSettingsContext } from '@/context/settings-context';
import { cn } from '@/lib/utils';

import { LLMUnavailableNotice } from './llm-unavailable-notice';

import type { PanelSubmitButtonProps } from './types';
import type { ReactElement } from 'react';

/**
 * Unified submit button for panel components.
 * Displays different states based on generation progress, mode, and refine state.
 */
export function PanelSubmitButton({
  isGenerating,
  isRefineMode,
  isDirectMode = false,
  canSubmit,
  refined = false,
  onSubmit,
  defaultIcon,
  defaultLabel = 'GENERATE',
  directModeIcon,
  directModeLabel = 'USE SELECTED STYLES',
  refineLabel = 'REFINE',
  refineDirectModeLabel = 'REFINE TITLE & LYRICS',
}: PanelSubmitButtonProps): ReactElement {
  const { isLLMAvailable } = useSettingsContext();

  const getContent = (): ReactElement => {
    if (isGenerating) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {isRefineMode ? 'REFINING...' : 'GENERATING...'}
        </>
      );
    }

    if (refined) {
      return (
        <>
          <Check className="w-4 h-4" />
          REFINED!
        </>
      );
    }

    if (isRefineMode) {
      return (
        <>
          <RefreshCw className="w-4 h-4" />
          {isDirectMode ? refineDirectModeLabel : refineLabel}
        </>
      );
    }

    if (isDirectMode && directModeIcon) {
      return (
        <>
          {directModeIcon}
          {directModeLabel}
        </>
      );
    }

    return (
      <>
        {defaultIcon}
        {defaultLabel}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={onSubmit}
        disabled={!canSubmit || isGenerating || !isLLMAvailable}
        className={cn(
          'w-full h-11 font-semibold text-[length:var(--text-footnote)] shadow-panel gap-2',
          refined &&
            'bg-emerald-500/20 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/30 hover:text-emerald-400'
        )}
      >
        {getContent()}
      </Button>
      {!isLLMAvailable && <LLMUnavailableNotice showText />}
    </div>
  );
}
