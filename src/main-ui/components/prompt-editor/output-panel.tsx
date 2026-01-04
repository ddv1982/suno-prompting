import { OutputSection } from "@/components/prompt-editor/output-section";
import { PromptOutput } from "@/components/prompt-output";
import { QuickVibesOutput } from "@/components/quick-vibes-output";
import { RemixButtonGroup } from "@/components/remix-button-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

import type { GeneratingAction } from "@/context/app-context";
import type { DebugInfo } from "@shared/types";

type OutputPanelProps = {
  promptMode: 'full' | 'quickVibes' | 'creativeBoost';
  currentPrompt: string;
  currentTitle?: string;
  currentLyrics?: string;
  isGenerating: boolean;
  generatingAction: GeneratingAction;
  maxMode: boolean;
  lyricsMode: boolean;
  copied: boolean;
  promptOverLimit: boolean;
  charCount: number;
  maxChars: number;
  debugInfo?: Partial<DebugInfo>;
  onRemixQuickVibes: () => void;
  onRemixTitle: () => void;
  onRemixLyrics: () => void;
  onRemixGenre: () => void;
  onRemixMood: () => void;
  onRemixInstruments: () => void;
  onRemixStyleTags: () => void;
  onRemixRecording: () => void;
  onRemix: () => void;
  onCopy: () => void;
  onDebugOpen: () => void;
};

export function OutputPanel({
  promptMode,
  currentPrompt,
  currentTitle,
  currentLyrics,
  isGenerating,
  generatingAction,
  maxMode,
  lyricsMode,
  copied,
  promptOverLimit,
  charCount,
  maxChars,
  debugInfo,
  onRemixQuickVibes,
  onRemixTitle,
  onRemixLyrics,
  onRemixGenre,
  onRemixMood,
  onRemixInstruments,
  onRemixStyleTags,
  onRemixRecording,
  onRemix,
  onCopy,
  onDebugOpen,
}: OutputPanelProps) {
  if (!currentPrompt) return null;

  if (promptMode === 'quickVibes') {
    return (
      <div className="space-y-[var(--space-5)]">
        <QuickVibesOutput
          prompt={currentPrompt}
          title={currentTitle}
          isGenerating={isGenerating}
          hasDebugInfo={!!debugInfo}
          onRemix={onRemixQuickVibes}
          onCopy={onCopy}
          onDebugOpen={onDebugOpen}
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
          onCopy={() => navigator.clipboard.writeText(currentTitle)}
          onRemix={onRemixTitle}
          isGenerating={isGenerating}
          isRemixing={generatingAction === 'remixTitle'}
        />
      )}

      <div>
        <div className="flex justify-between items-center mb-2">
          <SectionLabel>Style Prompt</SectionLabel>
          <Badge
            variant={promptOverLimit ? "destructive" : "secondary"}
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
            isGenerating={isGenerating}
            generatingAction={generatingAction}
            maxMode={maxMode}
            copied={copied}
            promptOverLimit={promptOverLimit}
            hasDebugInfo={!!debugInfo}
            onDebugOpen={onDebugOpen}
            onRemixGenre={onRemixGenre}
            onRemixMood={onRemixMood}
            onRemixInstruments={onRemixInstruments}
            onRemixStyleTags={onRemixStyleTags}
            onRemixRecording={onRemixRecording}
            onRemix={onRemix}
            onCopy={onCopy}
          />
        </Card>
      </div>

      {lyricsMode && currentLyrics && (
        <OutputSection
          label="Lyrics"
          content={currentLyrics}
          onCopy={() => navigator.clipboard.writeText(currentLyrics)}
          onRemix={onRemixLyrics}
          isGenerating={isGenerating}
          isRemixing={generatingAction === 'remixLyrics'}
          scrollable
        />
      )}
    </div>
  );
}
