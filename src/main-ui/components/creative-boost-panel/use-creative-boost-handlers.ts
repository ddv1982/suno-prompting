import { useCallback } from "react";

import { isSunoV5Style } from "@shared/suno-v5-styles";

import type { CreativeBoostInput, CreativitySliderValue } from "@shared/types";

type UseCreativeBoostHandlersProps = {
  input: CreativeBoostInput;
  isGenerating: boolean;
  isRefineMode: boolean;
  onInputChange: (input: CreativeBoostInput) => void;
  onLyricsModeChange: (mode: boolean) => void;
  onGenerate: () => void;
  onRefine: (feedback: string) => void;
};

export type CreativeBoostHandlers = {
  handleCreativityChange: (value: CreativitySliderValue) => void;
  handleGenresChange: (genres: string[]) => void;
  handleSunoStylesChange: (styles: string[]) => void;
  handleDescriptionChange: (value: string) => void;
  handleLyricsTopicChange: (value: string) => void;
  handleWordlessVocalsChange: (checked: boolean) => void;
  handleLyricsToggleChange: (checked: boolean) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSubmit: () => void;
};

export function useCreativeBoostHandlers({
  input, isGenerating, isRefineMode, onInputChange, onLyricsModeChange, onGenerate, onRefine,
}: UseCreativeBoostHandlersProps): CreativeBoostHandlers {
  const handleCreativityChange = useCallback((value: CreativitySliderValue): void => {
    onInputChange({ ...input, creativityLevel: value });
  }, [input, onInputChange]);

  const handleGenresChange = useCallback((genres: string[]): void => {
    onInputChange(genres.length > 0 && input.sunoStyles.length > 0
      ? { ...input, seedGenres: genres, sunoStyles: [] }
      : { ...input, seedGenres: genres });
  }, [input, onInputChange]);

  const handleSunoStylesChange = useCallback((styles: string[]): void => {
    const validStyles = styles.filter(isSunoV5Style);
    onInputChange(validStyles.length > 0 && input.seedGenres.length > 0
      ? { ...input, sunoStyles: validStyles, seedGenres: [] }
      : { ...input, sunoStyles: validStyles });
  }, [input, onInputChange]);

  const handleDescriptionChange = useCallback((value: string): void => {
    onInputChange({ ...input, description: value });
  }, [input, onInputChange]);

  const handleLyricsTopicChange = useCallback((value: string): void => {
    onInputChange({ ...input, lyricsTopic: value });
  }, [input, onInputChange]);

  const handleWordlessVocalsChange = useCallback((checked: boolean): void => {
    onInputChange({ ...input, withWordlessVocals: checked });
    if (checked) onLyricsModeChange(false);
  }, [input, onInputChange, onLyricsModeChange]);

  const handleLyricsToggleChange = useCallback((checked: boolean): void => {
    onLyricsModeChange(checked);
    if (checked) onInputChange({ ...input, withWordlessVocals: false });
  }, [input, onInputChange, onLyricsModeChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey && !isGenerating) {
      e.preventDefault();
      if (isRefineMode) { onRefine(input.description); } else { onGenerate(); }
    }
  }, [isGenerating, isRefineMode, input.description, onRefine, onGenerate]);

  const handleSubmit = useCallback((): void => {
    if (isRefineMode) { onRefine(input.description); } else { onGenerate(); }
  }, [isRefineMode, input.description, onRefine, onGenerate]);

  return {
    handleCreativityChange,
    handleGenresChange,
    handleSunoStylesChange,
    handleDescriptionChange,
    handleLyricsTopicChange,
    handleWordlessVocalsChange,
    handleLyricsToggleChange,
    handleKeyDown,
    handleSubmit,
  };
}
