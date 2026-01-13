import { type ReactElement } from "react";

import { CreativitySlider } from "@/components/creativity-slider";
import { MoodCategoryCombobox } from "@/components/mood-category-combobox";
import { useRefinedFeedback } from "@/hooks/use-refined-feedback";
import { canSubmitCreativeBoost } from "@shared/submit-validation";

import { CreativeBoostModeToggle } from "./creative-boost-mode-toggle";
import { DescriptionInput } from "./description-input";
import { LyricsTopicInput } from "./lyrics-topic-input";
import { ModeSpecificInputs } from "./mode-specific-inputs";
import { SubmitButton } from "./submit-button";
import { TogglesSection } from "./toggles-section";
import { useCreativeBoostHandlers } from "./use-creative-boost-handlers";

import type { MoodCategory } from "@bun/mood";
import type { CreativeBoostInput, CreativeBoostMode } from "@shared/types";

type CreativeBoostPanelProps = {
  input: CreativeBoostInput;
  maxMode: boolean;
  lyricsMode: boolean;
  isGenerating: boolean;
  hasCurrentPrompt: boolean;
  creativeBoostMode: CreativeBoostMode;
  onCreativeBoostModeChange: (mode: CreativeBoostMode) => void;
  onInputChange: (input: CreativeBoostInput | ((prev: CreativeBoostInput) => CreativeBoostInput)) => void;
  onMaxModeChange: (mode: boolean) => void;
  onLyricsModeChange: (mode: boolean) => void;
  onGenerate: () => void;
  onRefine: (feedback: string) => Promise<boolean>;
};

export function CreativeBoostPanel({
  input, maxMode, lyricsMode, isGenerating, hasCurrentPrompt, creativeBoostMode,
  onCreativeBoostModeChange, onInputChange, onMaxModeChange, onLyricsModeChange, onGenerate, onRefine,
}: CreativeBoostPanelProps): ReactElement {
  const isRefineMode = hasCurrentPrompt;
  const isDirectMode = input.sunoStyles.length > 0;
  const isSimpleMode = creativeBoostMode === 'simple';

  const { refined, handleRefine } = useRefinedFeedback(onRefine);

  // Use centralized validation for submit eligibility
  const canSubmit = canSubmitCreativeBoost({
    description: input.description,
    lyricsTopic: input.lyricsTopic,
    lyricsMode,
    sunoStyles: input.sunoStyles,
    seedGenres: input.seedGenres,
  });

  const { handleCreativityChange, handleGenresChange, handleSunoStylesChange, handleDescriptionChange, handleLyricsTopicChange, handleWordlessVocalsChange, handleLyricsToggleChange, handleKeyDown, handleSubmit } = useCreativeBoostHandlers({ input, isGenerating, isRefineMode, onInputChange, onLyricsModeChange, onGenerate, onRefine: handleRefine });

  const handleMoodCategoryChange = (category: MoodCategory | null): void => {
    onInputChange(prev => ({ ...prev, moodCategory: category }));
  };

  return (
    <div className="space-y-[var(--space-5)]">
      <CreativeBoostModeToggle
        mode={creativeBoostMode}
        isDirectMode={isDirectMode}
        isGenerating={isGenerating}
        onModeChange={onCreativeBoostModeChange}
      />

      <CreativitySlider
        value={input.creativityLevel}
        onChange={handleCreativityChange}
        disabled={isGenerating || isDirectMode}
      />
      {isDirectMode && (
        <p className="ui-helper -mt-3">
          Creativity slider disabled when using Suno V5 Styles
        </p>
      )}

      <ModeSpecificInputs
        input={input}
        isSimpleMode={isSimpleMode}
        isDirectMode={isDirectMode}
        isGenerating={isGenerating}
        onMoodCategoryChange={handleMoodCategoryChange}
        onGenresChange={handleGenresChange}
        onSunoStylesChange={handleSunoStylesChange}
      />

      {!isSimpleMode && (
        <MoodCategoryCombobox
          value={input.moodCategory}
          onChange={handleMoodCategoryChange}
          disabled={isGenerating || isDirectMode}
          helperText={isDirectMode ? "Disabled when using direct Suno styles" : "Influences the emotional tone of enrichment"}
          badgeText={isDirectMode ? "disabled" : "optional"}
        />
      )}

      <DescriptionInput
        value={input.description}
        isRefineMode={isRefineMode}
        isDirectMode={isDirectMode}
        isGenerating={isGenerating}
        onChange={handleDescriptionChange}
        onKeyDown={handleKeyDown}
      />

      {isSimpleMode && (
        <p className="ui-helper">
          AI will automatically select genres and vocal style based on your description
        </p>
      )}

      {lyricsMode && (
        <LyricsTopicInput
          value={input.lyricsTopic}
          isGenerating={isGenerating}
          onChange={handleLyricsTopicChange}
          onKeyDown={handleKeyDown}
        />
      )}

      <TogglesSection
        withWordlessVocals={input.withWordlessVocals}
        maxMode={maxMode}
        lyricsMode={lyricsMode}
        isDirectMode={isDirectMode}
        isGenerating={isGenerating}
        onWordlessVocalsChange={handleWordlessVocalsChange}
        onMaxModeChange={onMaxModeChange}
        onLyricsModeChange={handleLyricsToggleChange}
      />

      <SubmitButton
        isGenerating={isGenerating}
        isRefineMode={isRefineMode}
        isDirectMode={isDirectMode}
        canSubmit={canSubmit}
        refined={refined}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
