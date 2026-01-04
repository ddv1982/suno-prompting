import { SectionLabel } from "@/components/ui/section-label";
import { APP_CONSTANTS } from "@shared/constants";

import type { AIProvider } from "@shared/types";

const MODELS_BY_PROVIDER = APP_CONSTANTS.AI.MODELS_BY_PROVIDER;
const selectClassName = "border-border data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex h-[var(--height-control-md)] w-full min-w-0 rounded-md border bg-input/30 px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--text-footnote)] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

type ModelSectionProps = {
  provider: AIProvider;
  model: string;
  loading: boolean;
  onModelChange: (model: string) => void;
};

export function ModelSection({
  provider,
  model,
  loading,
  onModelChange,
}: ModelSectionProps): React.JSX.Element {
  const availableModels = MODELS_BY_PROVIDER[provider];

  return (
    <div className="space-y-2">
      <SectionLabel>AI Model</SectionLabel>
      <select
        value={model}
        onChange={(e) => { onModelChange(e.target.value); }}
        disabled={loading}
        className={selectClassName}
      >
        {loading && <option value="">Loading...</option>}
        {availableModels.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <p className="ui-helper">
        Select the AI model for generating prompts
      </p>
    </div>
  );
}
