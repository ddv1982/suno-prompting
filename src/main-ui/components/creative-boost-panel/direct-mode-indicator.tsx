import { Zap } from "lucide-react";

import type { ReactElement } from "react";

interface DirectModeIndicatorProps {
  isDirectMode: boolean;
}

export function DirectModeIndicator({ isDirectMode }: DirectModeIndicatorProps): ReactElement | null {
  if (!isDirectMode) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-accent/30 rounded-lg border border-accent/50">
      <Zap className="w-4 h-4 text-accent-foreground" />
      <span className="text-[length:var(--text-footnote)] text-accent-foreground">
        Direct Mode: Styles will be used exactly as selected
      </span>
    </div>
  );
}
