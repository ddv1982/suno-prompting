import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";

import type { ReactElement } from "react";

interface PhrasePreviewProps {
  phrase: string;
}

export function PhrasePreview({ phrase }: PhrasePreviewProps): ReactElement | null {
  if (!phrase) return null;

  return (
    <div className="pt-2 border-t">
      <div className="flex items-center gap-2 mb-1">
        <SectionLabel>Generated Music Phrase</SectionLabel>
        <Badge variant="outline" className="text-micro">locked</Badge>
      </div>
      <p className="text-[length:var(--text-footnote)] font-mono bg-background/50 rounded px-3 py-2 border">
        {phrase}
      </p>
      <p className="ui-helper mt-1">
        This phrase will appear verbatim in your prompt - the AI won't modify it.
      </p>
    </div>
  );
}
