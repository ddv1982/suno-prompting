import { Mic, Zap } from "lucide-react";

import { ToggleRow } from "@/components/ui/toggle-row";
import { getMaxModeHelperText } from "@shared/constants";

import type { ReactElement } from "react";

interface TogglesSectionProps {
  withWordlessVocals: boolean;
  maxMode: boolean;
  isDirectMode: boolean;
  onWordlessVocalsChange: (checked: boolean) => void;
  onMaxModeChange: (checked: boolean) => void;
}

export function TogglesSection({
  withWordlessVocals,
  maxMode,
  isDirectMode,
  onWordlessVocalsChange,
  onMaxModeChange,
}: TogglesSectionProps): ReactElement {
  return (
    <div className="space-y-1 border-t border-border/50 pt-[var(--space-4)]">
      <ToggleRow
        id="qv-wordless-vocals"
        icon={<Mic className="w-3.5 h-3.5" />}
        label="Wordless vocals"
        helperText="(humming, oohs)"
        checked={isDirectMode ? false : withWordlessVocals}
        onChange={onWordlessVocalsChange}
        disabled={isDirectMode}
        autoDisable
        showNaBadge={isDirectMode}
      />
      <ToggleRow
        id="qv-max-mode"
        icon={<Zap className="w-3.5 h-3.5" />}
        label="Max Mode"
        checked={maxMode}
        onChange={onMaxModeChange}
        autoDisable
      />
      <p className="ui-helper pl-6">{getMaxModeHelperText(maxMode)}</p>
    </div>
  );
}
