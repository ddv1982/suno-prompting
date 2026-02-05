import { OutputSection } from '@/components/prompt-editor/output-section';
import { OutputSkeleton } from '@/components/prompt-editor/output-skeleton';
import { PromptOutput } from '@/components/prompt-output';
import { QuickVibesOutput } from '@/components/quick-vibes-output';
import { RemixButtonGroup } from '@/components/remix-button-group';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SectionLabel } from '@/components/ui/section-label';

import type { GeneratingAction } from '@/context/app-context';
import type { TraceRun } from '@shared/types';
import type { ReactElement } from 'react';

interface OutputPanelProps {
  promptMode: 'full' | 'quickVibes' | 'creativeBoost';
  currentPrompt: string;
  currentTitle?: string;
  currentLyrics?: string;
  generatingAction: GeneratingAction;
  storyMode: boolean;
  promptOverLimit: boolean;
  charCount: number;
  maxChars: number;
  debugTrace?: TraceRun;
  /** Whether to show skeleton loading UI during optimistic generation */
  showSkeleton?: boolean;
  onRemixQuickVibes: () => void;
  onRemixTitle: () => void;
  onRemixLyrics: () => void;
  onRemixGenre: () => void;
  onRemixMood: () => void;
  onRemixInstruments: () => void;
  onRemixStyleTags: () => void;
  onRemixRecording: () => void;
  onRemix: () => void;
  onDebugOpen: () => void;
}

export function OutputPanel({
  promptMode,
  currentPrompt,
  currentTitle,
  currentLyrics,
  generatingAction,
  storyMode,
  promptOverLimit,
  charCount,
  maxChars,
  debugTrace,
  showSkeleton = false,
  onRemixQuickVibes,
  onRemixTitle,
  onRemixLyrics,
  onRemixGenre,
  onRemixMood,
  onRemixInstruments,
  onRemixStyleTags,
  onRemixRecording,
  onRemix,
  onDebugOpen,
}: OutputPanelProps): ReactElement | null {
  if (showSkeleton && !currentPrompt) return <OutputSkeleton />;
  if (!currentPrompt) return null;

  const hasDebugInfo = !!debugTrace;

  if (promptMode === 'quickVibes') {
    return (
      <div className="space-y-[var(--space-5)]">
        <QuickVibesOutput
          prompt={currentPrompt}
          title={currentTitle}
          lyrics={currentLyrics}
          generatingAction={generatingAction}
          storyMode={storyMode}
          hasDebugInfo={hasDebugInfo}
          onRemix={onRemixQuickVibes}
          onDebugOpen={onDebugOpen}
          onRemixGenre={onRemixGenre}
          onRemixMood={onRemixMood}
          onRemixInstruments={onRemixInstruments}
          onRemixStyleTags={onRemixStyleTags}
          onRemixRecording={onRemixRecording}
          onRemixLyrics={onRemixLyrics}
        />
      </div>
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      {currentTitle && (
        <OutputSection
          label="Title"
          content={currentTitle}
          onRemix={onRemixTitle}
          isRemixing={generatingAction === 'remixTitle'}
        />
      )}
      <div>
        <div className="flex justify-between items-center mb-2">
          <SectionLabel>Style Prompt</SectionLabel>
          <Badge
            variant={promptOverLimit ? 'destructive' : 'secondary'}
            className="text-tiny font-mono tabular-nums h-5"
          >
            {charCount} / {maxChars}
          </Badge>
        </div>
        <Card className="relative group border bg-surface overflow-hidden">
          <CardContent className="p-6">
            <PromptOutput text={currentPrompt} />
          </CardContent>
          <RemixButtonGroup
            generatingAction={generatingAction}
            storyMode={storyMode}
            currentPrompt={currentPrompt}
            promptOverLimit={promptOverLimit}
            hasDebugInfo={hasDebugInfo}
            onDebugOpen={onDebugOpen}
            onRemixGenre={onRemixGenre}
            onRemixMood={onRemixMood}
            onRemixInstruments={onRemixInstruments}
            onRemixStyleTags={onRemixStyleTags}
            onRemixRecording={onRemixRecording}
            onRemix={onRemix}
          />
        </Card>
      </div>
      {currentLyrics && (
        <OutputSection
          label="Lyrics"
          content={currentLyrics}
          onRemix={onRemixLyrics}
          isRemixing={generatingAction === 'remixLyrics'}
          scrollable
        />
      )}
    </div>
  );
}
