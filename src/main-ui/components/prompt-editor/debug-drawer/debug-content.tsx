/**
 * Debug Content Components
 *
 * Components for rendering debug information and LLM calls.
 *
 * @module components/prompt-editor/debug-drawer/debug-content
 */

import { SectionLabel } from "@/components/ui/section-label";

import { LLMCallSection } from "./debug-section";

import type { LLMCallsSectionProps } from "./types";
import type { ReactElement } from "react";

/**
 * Renders collapsible sections for each LLM call (genre, title, lyrics, max).
 * Returns null when no LLM calls exist to avoid empty container.
 */
export function LLMCallsSection({ debugInfo, onCopy, copiedSection }: LLMCallsSectionProps): ReactElement | null {
  const hasLLMCalls = debugInfo.genreDetection || debugInfo.titleGeneration || debugInfo.lyricsGeneration || debugInfo.maxConversion;
  
  if (!hasLLMCalls) return null;

  return (
    <div className="space-y-2">
      <SectionLabel>LLM Calls</SectionLabel>

      {debugInfo.genreDetection && (
        <LLMCallSection
          title="Genre Detection"
          systemPrompt={debugInfo.genreDetection.systemPrompt}
          userPrompt={debugInfo.genreDetection.userPrompt}
          extraInfo={debugInfo.genreDetection.detectedGenre}
          defaultExpanded={true}
          onCopy={onCopy}
          copiedSection={copiedSection}
          sectionKey="genre"
        />
      )}

      {debugInfo.titleGeneration && (
        <LLMCallSection
          title="Title Generation"
          systemPrompt={debugInfo.titleGeneration.systemPrompt}
          userPrompt={debugInfo.titleGeneration.userPrompt}
          defaultExpanded={true}
          onCopy={onCopy}
          copiedSection={copiedSection}
          sectionKey="title"
        />
      )}

      {debugInfo.lyricsGeneration && (
        <LLMCallSection
          title="Lyrics Generation"
          systemPrompt={debugInfo.lyricsGeneration.systemPrompt}
          userPrompt={debugInfo.lyricsGeneration.userPrompt}
          defaultExpanded={true}
          onCopy={onCopy}
          copiedSection={copiedSection}
          sectionKey="lyrics"
        />
      )}

      {debugInfo.maxConversion?.systemPrompt && debugInfo.maxConversion?.userPrompt && (
        <LLMCallSection
          title="Max Mode Conversion"
          systemPrompt={debugInfo.maxConversion.systemPrompt}
          userPrompt={debugInfo.maxConversion.userPrompt}
          onCopy={onCopy}
          copiedSection={copiedSection}
          sectionKey="maxconv"
        />
      )}
    </div>
  );
}
