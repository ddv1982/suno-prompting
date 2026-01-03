import { useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormLabel } from "@/components/ui/form-label";
import { Switch } from "@/components/ui/switch";
import { Dice3, Loader2, MessageSquare, Mic, RefreshCw, Zap, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreativeBoostInput, CreativitySliderValue } from "@shared/types";
import { APP_CONSTANTS } from "@shared/constants";
import { CreativitySlider } from "@/components/creativity-slider";
import { GenreMultiSelect } from "@/components/genre-multi-select";
import { SunoStylesMultiSelect } from "@/components/suno-styles-multi-select";
import { isSunoV5Style } from "@shared/suno-v5-styles";

const MAX_DESCRIPTION_CHARS = APP_CONSTANTS.CREATIVE_BOOST_MAX_DESCRIPTION_CHARS;
const MAX_LYRICS_TOPIC_CHARS = APP_CONSTANTS.CREATIVE_BOOST_MAX_LYRICS_TOPIC_CHARS;

type CreativeBoostPanelProps = {
  input: CreativeBoostInput;
  maxMode: boolean;
  lyricsMode: boolean;
  isGenerating: boolean;
  hasCurrentPrompt: boolean;
  onInputChange: (input: CreativeBoostInput) => void;
  onMaxModeChange: (mode: boolean) => void;
  onLyricsModeChange: (mode: boolean) => void;
  onGenerate: () => void;
  onRefine: (feedback: string) => void;
};

export function CreativeBoostPanel({
  input,
  maxMode,
  lyricsMode,
  isGenerating,
  hasCurrentPrompt,
  onInputChange,
  onMaxModeChange,
  onLyricsModeChange,
  onGenerate,
  onRefine,
}: CreativeBoostPanelProps) {
  const descriptionCharCount = input.description.length;
  const isRefineMode = hasCurrentPrompt;

  const handleCreativityChange = useCallback((value: CreativitySliderValue) => {
    onInputChange({ ...input, creativityLevel: value });
  }, [input, onInputChange]);

  const handleGenresChange = useCallback((genres: string[]) => {
    // Clear suno styles when seed genres are selected (mutual exclusivity)
    if (genres.length > 0 && input.sunoStyles.length > 0) {
      onInputChange({ ...input, seedGenres: genres, sunoStyles: [] });
    } else {
      onInputChange({ ...input, seedGenres: genres });
    }
  }, [input, onInputChange]);

  const handleSunoStylesChange = useCallback((styles: string[]) => {
    // Validate all styles are valid Suno V5 styles
    const validStyles = styles.filter(isSunoV5Style);
    // Clear seed genres when suno styles are selected (mutual exclusivity)
    if (validStyles.length > 0 && input.seedGenres.length > 0) {
      onInputChange({ ...input, sunoStyles: validStyles, seedGenres: [] });
    } else {
      onInputChange({ ...input, sunoStyles: validStyles });
    }
  }, [input, onInputChange]);

  const handleDescriptionChange = useCallback((value: string) => {
    onInputChange({ ...input, description: value });
  }, [input, onInputChange]);

  const handleLyricsTopicChange = useCallback((value: string) => {
    onInputChange({ ...input, lyricsTopic: value });
  }, [input, onInputChange]);

  const handleWordlessVocalsChange = useCallback((checked: boolean) => {
    onInputChange({ ...input, withWordlessVocals: checked });
    if (checked) {
      onLyricsModeChange(false);
    }
  }, [input, onInputChange, onLyricsModeChange]);

  const handleLyricsToggleChange = useCallback((checked: boolean) => {
    onLyricsModeChange(checked);
    if (checked) {
      onInputChange({ ...input, withWordlessVocals: false });
    }
  }, [input, onInputChange, onLyricsModeChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isGenerating) {
      e.preventDefault();
      if (isRefineMode) {
        onRefine(input.description);
      } else {
        onGenerate();
      }
    }
  }, [isGenerating, isRefineMode, input.description, onRefine, onGenerate]);

  const handleSubmit = useCallback(() => {
    if (isRefineMode) {
      onRefine(input.description);
    } else {
      onGenerate();
    }
  }, [isRefineMode, input.description, onRefine, onGenerate]);

  return (
    <div className="space-y-[var(--space-5)]">
      {/* Creativity Slider */}
      <CreativitySlider
        value={input.creativityLevel}
        onChange={handleCreativityChange}
        disabled={isGenerating}
      />

      {/* Seed Genres Multi-Select */}
      <GenreMultiSelect
        selected={input.seedGenres}
        onChange={handleGenresChange}
        maxSelections={4}
        disabled={isGenerating || input.sunoStyles.length > 0}
        helperText={
          input.sunoStyles.length > 0
            ? "Disabled when Suno styles are selected"
            : undefined
        }
        badgeText={input.sunoStyles.length > 0 ? "disabled" : "optional"}
      />

      {/* Suno V5 Styles Multi-Select */}
      <SunoStylesMultiSelect
        selected={input.sunoStyles}
        onChange={handleSunoStylesChange}
        maxSelections={4}
        disabled={isGenerating || input.seedGenres.length > 0}
        helperText={
          input.seedGenres.length > 0
            ? "Disabled when Seed Genres are selected"
            : undefined
        }
        badgeText={input.seedGenres.length > 0 ? "disabled" : "optional"}
      />

      {/* Description / Feedback Input */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <FormLabel
            icon={<MessageSquare className="w-3 h-3" />}
            badge={isRefineMode ? undefined : "optional"}
          >
            {isRefineMode ? "Refine feedback" : "Description"}
          </FormLabel>
          <Badge variant="secondary" className="ui-badge font-mono h-5">
            {descriptionCharCount} / {MAX_DESCRIPTION_CHARS}
          </Badge>
        </div>
        <Textarea
          value={input.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          maxLength={MAX_DESCRIPTION_CHARS}
          className={cn(
            "min-h-20 resize-none text-[length:var(--text-footnote)] p-4 rounded-xl bg-surface",
            isGenerating && "opacity-70"
          )}
          placeholder={
            isRefineMode
              ? "How should the creative boost change? (e.g., 'more upbeat', 'add ethnic elements', 'darker mood')"
              : "I want something that sounds like..."
          }
        />
        <p className="ui-helper">
          {isRefineMode
            ? "Describe how you'd like to adjust the current output."
            : "Optionally describe the mood, style, or direction for your music."
          }
        </p>
      </div>

      {/* Lyrics Topic - shown only when Lyrics toggle is ON */}
      {lyricsMode && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <FormLabel
              icon={<FileText className="w-3 h-3" />}
              badge="optional"
            >
              Lyrics Topic
            </FormLabel>
            <Badge variant="secondary" className="ui-badge font-mono h-5">
              {input.lyricsTopic.length} / {MAX_LYRICS_TOPIC_CHARS}
            </Badge>
          </div>
          <Textarea
            value={input.lyricsTopic}
            onChange={(e) => handleLyricsTopicChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            maxLength={MAX_LYRICS_TOPIC_CHARS}
            className={cn(
              "min-h-16 resize-none text-[length:var(--text-footnote)] p-4 rounded-xl bg-surface",
              isGenerating && "opacity-70"
            )}
            placeholder="Theme or subject for lyrics..."
          />
          <p className="ui-helper">
            What should the lyrics be about?
          </p>
        </div>
      )}

      {/* Toggles Section */}
      <div className="space-y-1 border-t border-border/50 pt-[var(--space-4)]">
        {/* Wordless Vocals Toggle */}
        <label htmlFor="cb-wordless-vocals" className="flex items-center gap-3 py-2 cursor-pointer">
          <Mic className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[length:var(--text-footnote)]">Wordless vocals</span>
          <span className="ui-helper">(humming, oohs)</span>
          <Switch
            id="cb-wordless-vocals"
            checked={input.withWordlessVocals}
            onCheckedChange={handleWordlessVocalsChange}
            disabled={isGenerating || lyricsMode}
            size="sm"
          />
        </label>

        {/* Max Mode Toggle */}
        <label htmlFor="cb-max-mode" className="flex items-center gap-3 py-2 cursor-pointer">
          <Zap className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[length:var(--text-footnote)]">Max Mode</span>
          <Switch
            id="cb-max-mode"
            checked={maxMode}
            onCheckedChange={onMaxModeChange}
            disabled={isGenerating}
            size="sm"
          />
        </label>

        {/* Lyrics Toggle */}
        <label htmlFor="cb-lyrics" className="flex items-center gap-3 py-2 cursor-pointer">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[length:var(--text-footnote)]">Lyrics</span>
          <Switch
            id="cb-lyrics"
            checked={lyricsMode}
            onCheckedChange={handleLyricsToggleChange}
            disabled={isGenerating || input.withWordlessVocals}
            size="sm"
          />
        </label>
        <p className="ui-helper pl-6">
          {lyricsMode
            ? "Will generate lyrics based on genre and topic."
            : input.withWordlessVocals
              ? "Wordless vocals enabled - no lyrics will be generated."
              : "Instrumental output - no vocals."
          }
        </p>
      </div>

      {/* Generate / Refine Button */}
      <Button
        onClick={handleSubmit}
        disabled={isGenerating}
        className="w-full h-11 font-semibold text-[length:var(--text-footnote)] shadow-panel gap-2"
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
            <Dice3 className="w-4 h-4" />
            GENERATE CREATIVE BOOST
          </>
        )}
      </Button>
    </div>
  );
}
