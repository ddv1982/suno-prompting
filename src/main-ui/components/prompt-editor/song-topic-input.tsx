import { AlertCircle, Music2 } from "lucide-react";

import { FormLabel } from "@/components/ui/form-label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { APP_CONSTANTS } from "@shared/constants";

import type { ReactElement } from "react";

interface SongTopicInputProps {
  value: string;
  hasCurrentPrompt: boolean;
  isOverLimit: boolean;
  onChange: (value: string) => void;
  /** Optional keyboard handler for Enter key to trigger generation. */
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function SongTopicInput({
  value,
  hasCurrentPrompt,
  isOverLimit,
  onChange,
  onKeyDown,
}: SongTopicInputProps): ReactElement {
  return (
    <div className="space-y-1">
      <FormLabel
        icon={<Music2 className="w-3 h-3" />}
        badge="optional"
        charCount={value ? value.length : undefined}
        maxChars={value ? APP_CONSTANTS.MAX_LYRICS_TOPIC_CHARS : undefined}
        error={isOverLimit}
      >
        {hasCurrentPrompt ? 'Song Topic' : 'Song Topic (for lyrics)'}
      </FormLabel>
      <Textarea
        value={value}
        onChange={(e): void => { onChange(e.target.value); }}
        onKeyDown={onKeyDown}
        autoDisable
        className={cn(
          "min-h-16 max-h-32 resize-none text-[length:var(--text-footnote)] p-3 rounded-lg bg-surface",
          isOverLimit && "border-destructive focus-visible:ring-destructive/20"
        )}
        placeholder="What is the song about? (e.g., 'the meaning of life', 'lost love', 'summer road trip')"
      />
      {isOverLimit ? (
        <p className="text-micro text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Song topic exceeds {APP_CONSTANTS.MAX_LYRICS_TOPIC_CHARS} characters.
        </p>
      ) : (
        <p className="ui-helper">
          If provided, lyrics will focus on this topic instead of the musical style description above.
        </p>
      )}
    </div>
  );
}
