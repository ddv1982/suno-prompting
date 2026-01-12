import { SectionLabel } from "@/components/ui/section-label";

import type { ReactElement } from "react";

export function OllamaModelSection(): ReactElement {
  return (
    <div className="space-y-2">
      <SectionLabel>Required Model</SectionLabel>
      <div className="rounded-md bg-muted/50 p-3 text-sm">
        <p className="text-muted-foreground">
          Install the Gemma model to use local generation:
        </p>
        <code className="block rounded bg-muted px-2 py-1 font-mono text-xs mt-2">
          ollama pull gemma3:4b
        </code>
      </div>
    </div>
  );
}
