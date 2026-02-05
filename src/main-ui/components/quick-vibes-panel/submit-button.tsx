import { Sparkles } from 'lucide-react';

import { PanelSubmitButton } from '@/components/shared';

import type { ReactElement } from 'react';

interface SubmitButtonProps {
  isGenerating: boolean;
  isRefineMode: boolean;
  canSubmit: boolean;
  refined?: boolean;
  onSubmit: () => void;
}

export function SubmitButton({
  isGenerating,
  isRefineMode,
  canSubmit,
  refined = false,
  onSubmit,
}: SubmitButtonProps): ReactElement {
  return (
    <PanelSubmitButton
      isGenerating={isGenerating}
      isRefineMode={isRefineMode}
      canSubmit={canSubmit}
      refined={refined}
      onSubmit={onSubmit}
      defaultIcon={<Sparkles className="w-4 h-4" />}
      defaultLabel="GENERATE QUICK VIBES"
    />
  );
}
