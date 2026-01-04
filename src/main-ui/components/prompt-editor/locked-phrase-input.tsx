import { AlertCircle, Lock } from "lucide-react";


import { FormLabel } from "@/components/ui/form-label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { APP_CONSTANTS } from "@shared/constants";

import type { EditorMode } from "@shared/types";
import type { ReactNode } from "react";

type LockedPhraseInputProps = {
  value: string;
  editorMode: EditorMode;
  isGenerating: boolean;
  validation: { isValid: boolean; error: string | null };
  onChange: (value: string) => void;
};

export function LockedPhraseInput({
  value,
  editorMode,
  isGenerating,
  validation,
  onChange,
}: LockedPhraseInputProps): ReactNode {
  return (
    <div className="space-y-1">
      <FormLabel
        icon={<Lock className="w-3 h-3" />}
        badge="optional"
        charCount={value ? value.length : undefined}
        maxChars={value ? APP_CONSTANTS.MAX_LOCKED_PHRASE_CHARS : undefined}
        error={!validation.isValid}
      >
        {editorMode === 'advanced' ? 'Additional Locked Text' : 'Locked Phrase'}
      </FormLabel>
      <Textarea
        value={value}
        onChange={(e): void => { onChange(e.target.value); }}
        disabled={isGenerating}
        className={cn(
          "min-h-12 max-h-24 resize-none text-[length:var(--text-footnote)] p-3 rounded-lg bg-surface",
          !validation.isValid && "border-destructive focus-visible:ring-destructive/20",
          isGenerating && "opacity-70"
        )}
        placeholder={editorMode === 'advanced' 
          ? "Additional text to lock (combined with music phrase above)"
          : "Text that will appear exactly as written in the output"}
      />
      {validation.error && (
        <p className="text-micro text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {validation.error}
        </p>
      )}
    </div>
  );
}
