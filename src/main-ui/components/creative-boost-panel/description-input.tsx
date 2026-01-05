import { MessageSquare } from "lucide-react";


import { Badge } from "@/components/ui/badge";
import { FormLabel } from "@/components/ui/form-label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { APP_CONSTANTS } from "@shared/constants";

import type { ReactNode } from "react";

const MAX_DESCRIPTION_CHARS = APP_CONSTANTS.CREATIVE_BOOST_MAX_DESCRIPTION_CHARS;

type DescriptionInputProps = {
  value: string;
  isRefineMode: boolean;
  isDirectMode: boolean;
  isGenerating: boolean;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
};

export function DescriptionInput({
  value,
  isRefineMode,
  isDirectMode,
  isGenerating,
  onChange,
  onKeyDown,
}: DescriptionInputProps): ReactNode {
  const charCount = value.length;
  const isDisabled = isGenerating || (isDirectMode && !isRefineMode);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <FormLabel
          icon={<MessageSquare className="w-3 h-3" />}
          badge={isDirectMode ? "disabled" : "optional"}
        >
          {isRefineMode ? "Refine feedback" : "Description"}
        </FormLabel>
        <Badge variant="secondary" className="ui-badge font-mono h-5">
          {charCount} / {MAX_DESCRIPTION_CHARS}
        </Badge>
      </div>
      <Textarea
        value={value}
        onChange={(e): void => { onChange(e.target.value); }}
        onKeyDown={onKeyDown}
        disabled={isDisabled}
        maxLength={MAX_DESCRIPTION_CHARS}
        className={cn(
          "min-h-20 resize-none text-[length:var(--text-footnote)] p-4 rounded-xl bg-surface",
          isDisabled && "opacity-70"
        )}
        placeholder={
          isRefineMode
            ? "How should the creative boost change? (e.g., 'more upbeat', 'add ethnic elements', 'darker mood')"
            : isDirectMode
              ? "Description not used with Suno V5 Styles"
              : "I want something that sounds like..."
        }
      />
      <p className="ui-helper">
        {isRefineMode
          ? "Optionally describe how you'd like to adjust the output, or leave blank to regenerate."
          : isDirectMode
            ? "Description is not used when Suno V5 Styles are selected."
            : "Optionally describe the mood, style, or direction for your music."
        }
      </p>
    </div>
  );
}
