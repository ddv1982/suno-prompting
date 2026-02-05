import { useMemo } from 'react';

import { LLMUnavailableNotice } from '@/components/shared/llm-unavailable-notice';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { useSettingsContext } from '@/context/settings-context';
import { APP_CONSTANTS } from '@shared/constants';

import type { ReactElement } from 'react';

type StatusType = 'working' | 'ready' | 'local';

interface EditorStatusFooterProps {
  isGenerating: boolean;
  /** Whether we're in optimistic state (before server confirms) */
  isOptimistic?: boolean;
  currentModel?: string;
}

export function EditorStatusFooter({
  isGenerating,
  isOptimistic = false,
  currentModel,
}: EditorStatusFooterProps): ReactElement {
  const { isLLMAvailable, useLocalLLM } = useSettingsContext();

  // Determine status: optimistic or generating shows working, then local/ready
  const status: StatusType = useMemo(() => {
    if (isOptimistic || isGenerating) return 'working';
    return useLocalLLM ? 'local' : 'ready';
  }, [isOptimistic, isGenerating, useLocalLLM]);

  // Determine model name to display
  const modelDisplay = useMemo(() => {
    if (!isLLMAvailable) return null;
    if (useLocalLLM) return APP_CONSTANTS.OLLAMA.DEFAULT_MODEL;
    if (currentModel) return currentModel.split('/').pop();
    return null;
  }, [isLLMAvailable, useLocalLLM, currentModel]);

  return (
    <div className="flex justify-between items-center px-1 pb-[var(--space-2)]">
      <span className="text-[length:var(--text-caption)] text-muted-foreground flex items-center gap-4 font-mono">
        <span>⏎ send</span>
        <span>⇧⏎ new line</span>
      </span>
      <div className="flex items-center gap-4">
        <LLMUnavailableNotice showText />
        {modelDisplay && <span className="ui-label text-primary/70">{modelDisplay}</span>}
        <StatusIndicator status={status} showLabel={false} />
      </div>
    </div>
  );
}
