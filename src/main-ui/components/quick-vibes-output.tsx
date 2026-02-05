import { OutputSection } from '@/components/prompt-editor/output-section';
import { PromptOutput } from '@/components/prompt-output';
import { RemixButtonGroup } from '@/components/remix-button-group';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SectionLabel } from '@/components/ui/section-label';
import { APP_CONSTANTS } from '@shared/constants';
import { stripMaxModeHeader } from '@shared/prompt-utils';

import type { GeneratingAction } from '@/context/app-context';
import type { ReactElement } from 'react';

interface QuickVibesOutputProps {
  prompt: string;
  title?: string;
  lyrics?: string;
  generatingAction: GeneratingAction;
  storyMode: boolean;
  hasDebugInfo: boolean;
  onRemix: () => void;
  onDebugOpen: () => void;
  onRemixGenre: () => void;
  onRemixMood: () => void;
  onRemixInstruments: () => void;
  onRemixStyleTags: () => void;
  onRemixRecording: () => void;
  onRemixLyrics?: () => void;
}

export function QuickVibesOutput({
  prompt,
  title,
  lyrics,
  generatingAction,
  storyMode,
  hasDebugInfo,
  onRemix,
  onDebugOpen,
  onRemixGenre,
  onRemixMood,
  onRemixInstruments,
  onRemixStyleTags,
  onRemixRecording,
  onRemixLyrics,
}: QuickVibesOutputProps): ReactElement {
  const contentOnly = stripMaxModeHeader(prompt);
  const charCount = contentOnly.length;
  const isOverLimit = charCount > APP_CONSTANTS.QUICK_VIBES_MAX_CHARS;

  return (
    <div className="space-y-[var(--space-5)]">
      {title && <OutputSection label="Title" content={title} />}

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <SectionLabel>Quick Vibes Prompt</SectionLabel>
          <Badge
            variant={isOverLimit ? 'destructive' : 'secondary'}
            className="text-tiny font-mono tabular-nums h-5"
          >
            {charCount} / {APP_CONSTANTS.QUICK_VIBES_MAX_CHARS}
          </Badge>
        </div>
        <Card className="relative group border bg-surface overflow-hidden">
          <CardContent className="p-6">
            <PromptOutput text={prompt} />
          </CardContent>
          <RemixButtonGroup
            generatingAction={generatingAction}
            storyMode={storyMode}
            currentPrompt={prompt}
            promptOverLimit={isOverLimit}
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

      {lyrics && (
        <OutputSection
          label="Lyrics"
          content={lyrics}
          onRemix={onRemixLyrics}
          isRemixing={generatingAction === 'remixLyrics'}
          scrollable
        />
      )}
    </div>
  );
}
