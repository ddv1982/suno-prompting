import { Mic, Zap } from "lucide-react";


import { ToggleRow } from "@/components/ui/toggle-row";
import { getMaxModeHelperText } from "@shared/constants";

import type { ReactNode } from "react";

type TogglesSectionProps = {
  withWordlessVocals: boolean;
  maxMode: boolean;
  isDirectMode: boolean;
  isGenerating: boolean;
  onWordlessVocalsChange: (checked: boolean) => void;
  onMaxModeChange: (checked: boolean) => void;
};

export function TogglesSection({
  withWordlessVocals,
  maxMode,
  isDirectMode,
  isGenerating,
  onWordlessVocalsChange,
  onMaxModeChange,
}: TogglesSectionProps): ReactNode {
  return (
    <div className="space-y-1 border-t border-border/50 pt-[var(--space-4)]">
      <ToggleRow
        id="qv-wordless-vocals"
        icon={<Mic className="w-3.5 h-3.5" />}
        label="Wordless vocals"
        helperText="(humming, oohs)"
        checked={isDirectMode ? false : withWordlessVocals}
        onChange={onWordlessVocalsChange}
        disabled={isGenerating || isDirectMode}
        showNaBadge={isDirectMode}
      />
      <ToggleRow
        id="qv-max-mode"
        icon={<Zap className="w-3.5 h-3.5" />}
        label="Max Mode"
        checked={isDirectMode ? false : maxMode}
        onChange={onMaxModeChange}
        disabled={isGenerating || isDirectMode}
        showNaBadge={isDirectMode}
      />
      <p className="ui-helper pl-6">{getMaxModeHelperText(isDirectMode, maxMode)}</p>
    </div>
  );
}
