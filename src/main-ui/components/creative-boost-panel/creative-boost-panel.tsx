import { useCallback, type ReactNode } from "react";

import { CreativitySlider } from "@/components/creativity-slider";
import { GenreMultiSelect } from "@/components/genre-multi-select";
import { SunoStylesMultiSelect } from "@/components/suno-styles-multi-select";
import { isSunoV5Style } from "@shared/suno-v5-styles";

import { CreativeBoostModeToggle } from "./creative-boost-mode-toggle";
import { DescriptionInput } from "./description-input";
import { DirectModeIndicator } from "./direct-mode-indicator";
import { LyricsTopicInput } from "./lyrics-topic-input";
import { SubmitButton } from "./submit-button";
import { TogglesSection } from "./toggles-section";

import type { CreativeBoostInput, CreativeBoostMode, CreativitySliderValue } from "@shared/types";

type CreativeBoostPanelProps = {
  input: CreativeBoostInput;
  maxMode: boolean;
  lyricsMode: boolean;
  isGenerating: boolean;
  hasCurrentPrompt: boolean;
  creativeBoostMode: CreativeBoostMode;
  onCreativeBoostModeChange: (mode: CreativeBoostMode) => void;
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
  creativeBoostMode,
  onCreativeBoostModeChange,
  onInputChange,
  onMaxModeChange,
  onLyricsModeChange,
  onGenerate,
  onRefine,
}: CreativeBoostPanelProps): ReactNode {
  const isRefineMode = hasCurrentPrompt;
  const isDirectMode = input.sunoStyles.length > 0;
  const isSimpleMode = creativeBoostMode === 'simple';

  const handleCreativityChange = useCallback((value: CreativitySliderValue): void => {
    onInputChange({ ...input, creativityLevel: value });
  }, [input, onInputChange]);

  const handleGenresChange = useCallback((genres: string[]): void => {
    if (genres.length > 0 && input.sunoStyles.length > 0) {
      onInputChange({ ...input, seedGenres: genres, sunoStyles: [] });
    } else {
      onInputChange({ ...input, seedGenres: genres });
    }
  }, [input, onInputChange]);

  const handleSunoStylesChange = useCallback((styles: string[]): void => {
    const validStyles = styles.filter(isSunoV5Style);
    if (validStyles.length > 0 && input.seedGenres.length > 0) {
      onInputChange({ ...input, sunoStyles: validStyles, seedGenres: [] });
    } else {
      onInputChange({ ...input, sunoStyles: validStyles });
    }
  }, [input, onInputChange]);

  const handleDescriptionChange = useCallback((value: string): void => {
    onInputChange({ ...input, description: value });
  }, [input, onInputChange]);

  const handleLyricsTopicChange = useCallback((value: string): void => {
    onInputChange({ ...input, lyricsTopic: value });
  }, [input, onInputChange]);

  const handleWordlessVocalsChange = useCallback((checked: boolean): void => {
    onInputChange({ ...input, withWordlessVocals: checked });
    if (checked) {
      onLyricsModeChange(false);
    }
  }, [input, onInputChange, onLyricsModeChange]);

  const handleLyricsToggleChange = useCallback((checked: boolean): void => {
    onLyricsModeChange(checked);
    if (checked) {
      onInputChange({ ...input, withWordlessVocals: false });
    }
  }, [input, onInputChange, onLyricsModeChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey && !isGenerating) {
      e.preventDefault();
      if (isRefineMode) {
        onRefine(input.description);
      } else {
        onGenerate();
      }
    }
  }, [isGenerating, isRefineMode, input.description, onRefine, onGenerate]);

  const handleSubmit = useCallback((): void => {
    if (isRefineMode) {
      onRefine(input.description);
    } else {
      onGenerate();
    }
  }, [isRefineMode, input.description, onRefine, onGenerate]);

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
      )}

      {!isSimpleMode && (
        <SunoStylesMultiSelect
          selected={input.sunoStyles}
          onChange={handleSunoStylesChange}
          maxSelections={4}
          disabled={isGenerating || input.seedGenres.length > 0}
          helperText={
            input.seedGenres.length > 0
              ? "Disabled when Seed Genres are selected"
              : isDirectMode
                ? "Selected styles will be used exactly as-is"
                : undefined
          }
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
        onSubmit={handleSubmit}
      />
    </div>
  );
}
