import { AlertCircle } from "lucide-react";

import { SectionLabel } from "@/components/ui/section-label";

interface OllamaModelSectionProps {
  showWarning: boolean;
}

export function OllamaModelSection({
  showWarning,
}: OllamaModelSectionProps): React.JSX.Element {
  if (!showWarning) {
    return <></>;
  }

  return (
    <div className="space-y-2">
      <SectionLabel>Required Model</SectionLabel>
      <div className="rounded-md bg-destructive/10 p-3 text-sm">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
          <div className="space-y-2">
            <p className="font-medium text-destructive">
              Gemma model not found
            </p>
            <p className="text-muted-foreground">
              Install the Gemma model to use local generation:
            </p>
            <code className="block rounded bg-muted px-2 py-1 font-mono text-xs">
              ollama pull gemma3:4b
            </code>
            <p className="text-xs text-muted-foreground">
              After installation, refresh to verify the model is available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
