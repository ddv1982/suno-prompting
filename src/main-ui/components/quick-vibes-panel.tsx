import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormLabel } from "@/components/ui/form-label";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Loader2, MessageSquare, Mic, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickVibesCategory, QuickVibesInput } from "@shared/types";
import { APP_CONSTANTS } from "@shared/constants";
import { QUICK_VIBES_CATEGORIES } from "@shared/quick-vibes-categories";
import { CategorySelector } from "@/components/category-selector";

const getCategoryLabel = (categoryId: QuickVibesCategory): string => {
  return QUICK_VIBES_CATEGORIES[categoryId]?.label ?? categoryId;
};

type QuickVibesPanelProps = {
  input: QuickVibesInput;
  withWordlessVocals: boolean;
  maxMode: boolean;
  isGenerating: boolean;
  hasCurrentPrompt: boolean;
  onInputChange: (input: QuickVibesInput) => void;
  onWordlessVocalsChange: (value: boolean) => void;
  onMaxModeChange: (value: boolean) => void;
  onGenerate: () => void;
  onRefine: (feedback: string) => void;
};

export function QuickVibesPanel({
  input,
  withWordlessVocals,
  maxMode,
  isGenerating,
  hasCurrentPrompt,
  onInputChange,
  onWordlessVocalsChange,
  onMaxModeChange,
  onGenerate,
  onRefine,
}: QuickVibesPanelProps) {
  const charCount = input.customDescription.length;
  const isRefineMode = hasCurrentPrompt;
  const canSubmit = isRefineMode 
    ? input.customDescription.trim().length > 0 || input.category !== null
    : input.category !== null || input.customDescription.trim().length > 0;

  const handleCategorySelect = (categoryId: QuickVibesCategory | null) => {
    onInputChange({ ...input, category: categoryId });
  };

  const handleDescriptionChange = (value: string) => {
    onInputChange({ ...input, customDescription: value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && canSubmit && !isGenerating) {
      e.preventDefault();
      if (isRefineMode) {
        onRefine(input.customDescription);
      } else {
        onGenerate();
      }
    }
  };

  const handleSubmit = () => {
    if (isRefineMode) {
      onRefine(input.customDescription);
    } else {
      onGenerate();
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div className="space-y-2">
        <FormLabel icon={<Sparkles className="w-3 h-3" />} badge="optional">
          {isRefineMode ? "Refine toward category" : "Category"}
        </FormLabel>
        <CategorySelector
          selectedCategory={input.category}
          onSelect={handleCategorySelect}
          disabled={isGenerating}
        />
      </div>

      {/* Description / Feedback Input */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <FormLabel 
            icon={<MessageSquare className="w-3 h-3" />} 
            badge={isRefineMode ? undefined : "optional"}
          >
            {isRefineMode ? "Refine the vibe" : "Describe the vibe"}
          </FormLabel>
          <Badge
            variant="secondary"
            className="text-tiny font-mono tabular-nums h-5"
          >
            {charCount} / {APP_CONSTANTS.QUICK_VIBES_MAX_CHARS}
          </Badge>
        </div>
        <Textarea
          value={input.customDescription}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          className={cn(
            "min-h-20 resize-none shadow-sm text-sm p-4 rounded-xl glass-control focus-visible:ring-primary/20",
            isGenerating && "opacity-70"
          )}
          placeholder={isRefineMode 
            ? "How should the vibe change? (e.g., 'more dreamy', 'add rain sounds', 'slower tempo')"
            : "e.g., mellow afternoon coding session, rainy window coffee shop, late night study vibes..."
          }
        />
        <p className="text-micro text-muted-foreground">
          {isRefineMode 
            ? input.category
              ? `Will refine toward "${getCategoryLabel(input.category)}". Add feedback or leave blank.`
              : "Describe how you'd like to adjust the current vibe, or select a category above."
            : input.category 
              ? `Category "${getCategoryLabel(input.category)}" selected. Add custom details or leave blank.`
              : "Describe the mood, setting, or activity for your music."
          }
        </p>
      </div>

      {/* Wordless Vocals Toggle */}
      <label className="flex items-center gap-3 py-2 cursor-pointer">
        <Mic className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm">Wordless vocals</span>
        <span className="text-micro text-muted-foreground">(humming, oohs)</span>
        <Switch
          checked={withWordlessVocals}
          onCheckedChange={onWordlessVocalsChange}
          disabled={isGenerating}
          size="sm"
        />
      </label>

      {/* Max Mode Toggle with Info */}
      <div className="space-y-1">
        <label className="flex items-center gap-3 py-2 cursor-pointer">
          <Zap className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm">Max Mode</span>
          <Switch
            checked={maxMode}
            onCheckedChange={onMaxModeChange}
            disabled={isGenerating}
            size="sm"
          />
        </label>
        <p className="text-micro text-muted-foreground pl-6">
          {maxMode 
            ? "Creates a slightly different flavour with real instruments and subtle realism tags. Can be really nice!"
            : "Keeps quick vibe genres more pure and focused."
          }
        </p>
      </div>

      {/* Generate / Refine Button */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || isGenerating}
        className="w-full h-11 font-bold text-sm shadow-lg shadow-primary/10 gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {isRefineMode ? "REFINING..." : "GENERATING..."}
          </>
        ) : isRefineMode ? (
          <>
            <RefreshCw className="w-4 h-4" />
            REFINE
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            GENERATE QUICK VIBES
          </>
        )}
      </Button>
    </div>
  );
}
