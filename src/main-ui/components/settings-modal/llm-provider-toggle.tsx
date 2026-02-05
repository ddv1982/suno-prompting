import { Server, Cloud } from 'lucide-react';
import { type ReactElement } from 'react';

import { SectionLabel } from '@/components/ui/section-label';
import { ToggleRow } from '@/components/ui/toggle-row';

interface LLMProviderToggleProps {
  useLocalLLM: boolean;
  hasApiKey: boolean;
  loading: boolean;
  onToggle: (value: boolean) => void;
}

export function LLMProviderToggle({
  useLocalLLM,
  hasApiKey,
  loading,
  onToggle,
}: LLMProviderToggleProps): ReactElement {
  const statusIcon = useLocalLLM ? <Server className="w-4 h-4" /> : <Cloud className="w-4 h-4" />;

  const helperText = useLocalLLM ? '(Ollama/Gemma 3 4B)' : '(Cloud Provider)';

  return (
    <div className="space-y-3">
      <SectionLabel>LLM Provider</SectionLabel>

      <ToggleRow
        id="use-local-llm"
        icon={statusIcon}
        label="Use Local LLM"
        helperText={helperText}
        checked={useLocalLLM}
        onChange={onToggle}
        disabled={loading}
      />

      <div className="pl-9 space-y-2">
        {useLocalLLM ? (
          <p className="text-sm text-muted-foreground">
            All AI operations use Ollama (Gemma 3 4B) running locally. No internet required,
            completely private.
            {hasApiKey && ' Your API key is configured but not being used.'}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Using cloud AI provider with your API key.
            {!hasApiKey && ' ⚠️ No API key configured - please add one above.'}
          </p>
        )}
      </div>

      {!useLocalLLM && !hasApiKey && (
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/10 p-3 border border-yellow-200 dark:border-yellow-900/30">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ No API key configured. Please add an API key above or enable Local LLM.
          </p>
        </div>
      )}
    </div>
  );
}
