import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FormLabel } from "@/components/ui/form-label";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Loader2, MessageSquare, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickVibesCategory, QuickVibesInput } from "@shared/types";
import { APP_CONSTANTS } from "@shared/constants";

// Category definitions (client-side)
const QUICK_VIBES_CATEGORIES: Array<{
  id: QuickVibesCategory;
  label: string;
  description: string;
}> = [
  { id: 'lofi-study', label: 'Lo-fi / Study', description: 'Chill beats for studying and focus' },
  { id: 'cafe-coffeeshop', label: 'Cafe / Coffee shop', description: 'Cozy acoustic and jazz vibes' },
  { id: 'ambient-focus', label: 'Ambient / Focus', description: 'Atmospheric soundscapes for deep work' },
  { id: 'latenight-chill', label: 'Late night / Chill', description: 'Mellow late-night listening' },
  { id: 'cozy-rainy', label: 'Cozy / Rainy day', description: 'Warm sounds for rainy days' },
  { id: 'lofi-chill', label: 'Lo-fi chill', description: 'Classic lo-fi chill beats' },
];

type QuickVibesPanelProps = {
  input: QuickVibesInput;
  withWordlessVocals: boolean;
  isGenerating: boolean;
  onInputChange: (input: QuickVibesInput) => void;
  onWordlessVocalsChange: (value: boolean) => void;
  onGenerate: () => void;
};

export function QuickVibesPanel({
  input,
  withWordlessVocals,
  isGenerating,
  onInputChange,
  onWordlessVocalsChange,
  onGenerate,
}: QuickVibesPanelProps) {
  const charCount = input.customDescription.length;
  const canGenerate = input.category !== null || input.customDescription.trim().length > 0;

  const handleCategorySelect = (categoryId: QuickVibesCategory | null) => {
    onInputChange({ ...input, category: categoryId });
  };

  const handleDescriptionChange = (value: string) => {
    onInputChange({ ...input, customDescription: value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && canGenerate && !isGenerating) {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div className="space-y-2">
        <FormLabel icon={<Sparkles className="w-3 h-3" />} badge="optional">
          Category
        </FormLabel>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={input.category === null ? 'default' : 'outline'}
            size="xs"
            onClick={() => handleCategorySelect(null)}
            disabled={isGenerating}
            className="font-medium"
          >
            None
          </Button>
          {QUICK_VIBES_CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={input.category === cat.id ? 'default' : 'outline'}
              size="xs"
              onClick={() => handleCategorySelect(cat.id)}
              disabled={isGenerating}
              className="font-medium"
              title={cat.description}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Description */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <FormLabel icon={<MessageSquare className="w-3 h-3" />}>
            Describe the vibe
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
          placeholder="e.g., mellow afternoon coding session, rainy window coffee shop, late night study vibes..."
        />
        <p className="text-micro text-muted-foreground">
          {input.category 
            ? `Category "${QUICK_VIBES_CATEGORIES.find(c => c.id === input.category)?.label}" selected. Add custom details or leave blank.`
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

      {/* Generate Button */}
      <Button
        onClick={onGenerate}
        disabled={!canGenerate || isGenerating}
        className="w-full h-11 font-bold text-sm shadow-lg shadow-primary/10 gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            GENERATING...
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
