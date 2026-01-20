import { type ReactElement } from "react";

import { CreativitySlider } from "@/components/creativity-slider";
import { useRefinedFeedback } from "@/hooks/use-refined-feedback";
import { CreativeBoostSubmitSchema } from "@shared/schemas/submit-validation";

import { CreativeBoostModeToggle } from "./creative-boost-mode-toggle";
import { DescriptionInput } from "./description-input";
import { LyricsTopicInput } from "./lyrics-topic-input";
import { ModeSpecificInputs } from "./mode-specific-inputs";
import { SubmitButton } from "./submit-button";
import { TogglesSection } from "./toggles-section";
import { useCreativeBoostHandlers } from "./use-creative-boost-handlers";

import type { MoodCategory } from "@bun/mood";
import type { CreativeBoostInput, CreativeBoostMode } from "@shared/types";

interface CreativeBoostPanelProps {
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
}

export function CreativeBoostPanel({
  input, maxMode, lyricsMode, isGenerating, hasCurrentPrompt, creativeBoostMode,
  onCreativeBoostModeChange, onInputChange, onMaxModeChange, onLyricsModeChange, onGenerate, onRefine,
}: CreativeBoostPanelProps): ReactElement {
  const isRefineMode = hasCurrentPrompt;
  const isDirectMode = input.sunoStyles.length > 0;
  const isSimpleMode = creativeBoostMode === 'simple';

  const { refined, handleRefine } = useRefinedFeedback(onRefine);

  // Use centralized validation for submit eligibility
  const canSubmit = CreativeBoostSubmitSchema.safeParse({
    description: input.description,
    lyricsTopic: input.lyricsTopic,
    lyricsMode,
    sunoStyles: input.sunoStyles,
    seedGenres: input.seedGenres,
  }).success;

  const { handleCreativityChange, handleGenresChange, handleSunoStylesChange, handleDescriptionChange, handleLyricsTopicChange, handleWordlessVocalsChange, handleLyricsToggleChange, handleKeyDown, handleSubmit } = useCreativeBoostHandlers({ input, isGenerating, isRefineMode, onInputChange, onLyricsModeChange, onGenerate, onRefine: handleRefine });

  const handleMoodCategoryChange = (category: MoodCategory | null): void => {
    onInputChange(prev => ({ ...prev, moodCategory: category }));
  };

  return (
    <div className="space-y-[var(--space-5)]">
        <CreativeBoostModeToggle
          mode={creativeBoostMode}
          isDirectMode={isDirectMode}
          onModeChange={onCreativeBoostModeChange}
        />

        <CreativitySlider
          value={input.creativityLevel}
          onChange={handleCreativityChange}
          disabled={isDirectMode}
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
          onMoodCategoryChange={handleMoodCategoryChange}
          onGenresChange={handleGenresChange}
          onSunoStylesChange={handleSunoStylesChange}
        />

        <DescriptionInput
          value={input.description}
          isRefineMode={isRefineMode}
          isDirectMode={isDirectMode}
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
            onChange={handleLyricsTopicChange}
            onKeyDown={handleKeyDown}
          />
        )}

        <TogglesSection
          withWordlessVocals={input.withWordlessVocals}
          maxMode={maxMode}
          lyricsMode={lyricsMode}
          isDirectMode={isDirectMode}
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
