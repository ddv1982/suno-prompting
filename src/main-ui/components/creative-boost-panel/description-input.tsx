import { MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FormLabel } from "@/components/ui/form-label";
import { Textarea } from "@/components/ui/textarea";
import { APP_CONSTANTS } from "@shared/constants";

import type { ReactElement } from "react";

const MAX_DESCRIPTION_CHARS = APP_CONSTANTS.CREATIVE_BOOST_MAX_DESCRIPTION_CHARS;

type DescriptionInputProps = {
  value: string;
  isRefineMode: boolean;
  isDirectMode: boolean;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
};

export function DescriptionInput({
  value,
  isRefineMode,
  isDirectMode,
  onChange,
  onKeyDown,
}: DescriptionInputProps): ReactElement {
  const charCount = value.length;
  const isDisabledByMode = isDirectMode && !isRefineMode;

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
        disabled={isDisabledByMode}
        autoDisable
        maxLength={MAX_DESCRIPTION_CHARS}
        className="min-h-20 resize-none text-[length:var(--text-footnote)] p-4 rounded-xl bg-surface"
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
