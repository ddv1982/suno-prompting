import { useMemo } from 'react';

import { cn } from '@/lib/utils';

import type { ReactElement } from 'react';

// =============================================================================
// Line Detection Patterns
// =============================================================================

/**
 * Section tags - matches lines that are exactly [TAG_NAME].
 * Matches: [INTRO], [VERSE], [CHORUS], [BRIDGE], [OUTRO]
 * Does NOT match: [Is_MAX_MODE: MAX](MAX) (has trailing content)
 */
const SECTION_TAG_PATTERN = /^\[.+\]$/;

/** Field labels like Genre:, Mood:, Instruments: */
const FIELD_LABEL_PATTERN = /^(Genre|Mood|Instruments|Tempo|Key):/i;

/** Standard mode header line: [Mood], Genre, Key: */
const STANDARD_HEADER_PATTERN = /^\[Mood\],.*Key:/;

/**
 * MAX mode header lines - matches [FIELD: MAX] at start of line.
 * Matches: [Is_MAX_MODE: MAX](MAX), [QUALITY: MAX](MAX)
 * No end anchor ($) to allow trailing (MAX) content.
 */
const MAX_MODE_HEADER_PATTERN = /^\[.+: MAX\]/;

/**
 * Legacy Suno V5 tags format (for backward compatibility with saved prompts).
 * Matches: ::tags realistic music ::, ::quality maximum ::, ::style suno v5 ::
 */
const SUNO_V5_TAGS_PATTERN = /^::.+::$/;

// =============================================================================
// Component
// =============================================================================

interface PromptOutputProps {
  text: string;
}

/**
 * Renders prompt text with syntax highlighting for different line types.
 * Styles sections, fields, and headers differently for visual clarity.
 */
export function PromptOutput({ text }: PromptOutputProps): ReactElement {
  const lines = useMemo(() => text.split('\n'), [text]);

  return (
    <div className="font-mono text-[length:var(--text-body)] leading-[1.7] whitespace-pre-wrap break-words">
      {lines.map((line, idx) => {
        if (line.trim().length === 0) {
          return <div key={idx} className="h-4" />;
        }

        const cleanLine = line.trim();
        const isSection = SECTION_TAG_PATTERN.test(cleanLine);
        const isField = FIELD_LABEL_PATTERN.test(cleanLine);
        const isHeader = STANDARD_HEADER_PATTERN.test(cleanLine);
        // MAX mode headers signal quality settings - style them prominently in green
        // to match section styling and indicate special mode is active
        const isMaxModeHeader =
          MAX_MODE_HEADER_PATTERN.test(cleanLine) || SUNO_V5_TAGS_PATTERN.test(cleanLine);

        return (
          <div
            key={idx}
            className={cn(
              isHeader && 'text-muted-foreground',
              isField && 'text-foreground font-medium',
              (isSection || isMaxModeHeader) && !isHeader && 'text-primary font-bold tracking-wide'
            )}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
}
