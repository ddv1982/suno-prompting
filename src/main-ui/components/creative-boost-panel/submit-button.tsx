import { Dice3, Zap } from 'lucide-react';

import { PanelSubmitButton } from '@/components/shared';

import type { ReactElement } from 'react';

interface SubmitButtonProps {
  isGenerating: boolean;
  isRefineMode: boolean;
  isDirectMode: boolean;
  canSubmit: boolean;
  refined?: boolean;
  onSubmit: () => void;
}

export function SubmitButton({
  isGenerating,
  isRefineMode,
  isDirectMode,
  canSubmit,
  refined = false,
  onSubmit,
}: SubmitButtonProps): ReactElement {
  return (
    <PanelSubmitButton
      isGenerating={isGenerating}
      isRefineMode={isRefineMode}
      isDirectMode={isDirectMode}
      canSubmit={canSubmit}
      refined={refined}
      onSubmit={onSubmit}
      defaultIcon={<Dice3 className="w-4 h-4" />}
      defaultLabel="GENERATE CREATIVE BOOST"
      directModeIcon={<Zap className="w-4 h-4" />}
      directModeLabel="USE SELECTED STYLES"
      refineDirectModeLabel="REFINE TITLE & LYRICS"
    />
  );
}
