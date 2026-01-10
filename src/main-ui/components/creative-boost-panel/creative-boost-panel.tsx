import { CreativitySlider } from "@/components/creativity-slider";
import { GenreMultiSelect } from "@/components/genre-multi-select";
import { SunoStylesMultiSelect } from "@/components/suno-styles-multi-select";
import { canSubmitCreativeBoost } from "@shared/submit-validation";

import { CreativeBoostModeToggle } from "./creative-boost-mode-toggle";
import { DescriptionInput } from "./description-input";
import { DirectModeIndicator } from "./direct-mode-indicator";
import { LyricsTopicInput } from "./lyrics-topic-input";
import { SubmitButton } from "./submit-button";
import { TogglesSection } from "./toggles-section";
import { useCreativeBoostHandlers } from "./use-creative-boost-handlers";

import type { CreativeBoostInput, CreativeBoostMode } from "@shared/types";
import type { ReactNode } from "react";

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
  onRefine: (feedback: string) => void;
};

export function CreativeBoostPanel({
  input, maxMode, lyricsMode, isGenerating, hasCurrentPrompt, creativeBoostMode,
  onCreativeBoostModeChange, onInputChange, onMaxModeChange, onLyricsModeChange, onGenerate, onRefine,
}: CreativeBoostPanelProps): ReactNode {
  const isRefineMode = hasCurrentPrompt;
  const isDirectMode = input.sunoStyles.length > 0;
  const isSimpleMode = creativeBoostMode === 'simple';

  // Use centralized validation for submit eligibility
  const canSubmit = canSubmitCreativeBoost({
    description: input.description,
    lyricsTopic: input.lyricsTopic,
    lyricsMode,
    sunoStyles: input.sunoStyles,
    seedGenres: input.seedGenres,
  });

  const {
    handleCreativityChange, handleGenresChange, handleSunoStylesChange,
    handleDescriptionChange, handleLyricsTopicChange, handleWordlessVocalsChange,
    handleLyricsToggleChange, handleKeyDown, handleSubmit,
  } = useCreativeBoostHandlers({
    input, isGenerating, isRefineMode, onInputChange, onLyricsModeChange, onGenerate, onRefine,
  });

  return (
    <div className="space-y-[var(--space-5)]">
      <CreativeBoostModeToggle
        mode={creativeBoostMode}
        isDirectMode={isDirectMode}
        isGenerating={isGenerating}
        onModeChange={onCreativeBoostModeChange}
      />

      {!isSimpleMode && <DirectModeIndicator isDirectMode={isDirectMode} />}

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

      {!isSimpleMode && (
        <GenreMultiSelect
          selected={input.seedGenres} onChange={handleGenresChange} maxSelections={4}
          disabled={isGenerating || input.sunoStyles.length > 0}
          helperText={input.sunoStyles.length > 0 ? "Disabled when Suno styles are selected" : undefined}
          badgeText={input.sunoStyles.length > 0 ? "disabled" : "optional"}
        />
      )}

      {!isSimpleMode && (
        <SunoStylesMultiSelect
          selected={input.sunoStyles} onChange={handleSunoStylesChange} maxSelections={4}
          disabled={isGenerating || input.seedGenres.length > 0}
          helperText={input.seedGenres.length > 0 ? "Disabled when Seed Genres are selected" : isDirectMode ? "Selected styles will be used exactly as-is" : undefined}
          badgeText={input.seedGenres.length > 0 ? "disabled" : "optional"}
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
        onSubmit={handleSubmit}
      />
    </div>
  );
}
