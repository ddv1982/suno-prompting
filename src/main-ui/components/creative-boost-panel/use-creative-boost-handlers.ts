import { useCallback } from "react";

import { isSunoV5Style } from "@shared/suno-v5-styles";

import type { CreativeBoostInput, CreativitySliderValue } from "@shared/types";

interface UseCreativeBoostHandlersProps {
  input: CreativeBoostInput;
  isGenerating: boolean;
  isRefineMode: boolean;
  onInputChange: (input: CreativeBoostInput | ((prev: CreativeBoostInput) => CreativeBoostInput)) => void;
  onLyricsModeChange: (mode: boolean) => void;
  onGenerate: () => void;
  onRefine: (feedback: string) => void;
}

export interface CreativeBoostHandlers {
  handleCreativityChange: (value: CreativitySliderValue) => void;
  handleGenresChange: (genres: string[]) => void;
  handleSunoStylesChange: (styles: string[]) => void;
  handleDescriptionChange: (value: string) => void;
  handleLyricsTopicChange: (value: string) => void;
  handleLyricsToggleChange: (checked: boolean) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSubmit: () => void;
}

export function useCreativeBoostHandlers({
  input, isGenerating, isRefineMode, onInputChange, onLyricsModeChange, onGenerate, onRefine,
}: UseCreativeBoostHandlersProps): CreativeBoostHandlers {
  const handleCreativityChange = useCallback((value: CreativitySliderValue): void => {
    onInputChange(prev => ({ ...prev, creativityLevel: value }));
  }, [onInputChange]);

  const handleGenresChange = useCallback((genres: string[]): void => {
    onInputChange(prev => genres.length > 0 && prev.sunoStyles.length > 0
      ? { ...prev, seedGenres: genres, sunoStyles: [] }
      : { ...prev, seedGenres: genres });
  }, [onInputChange]);

  const handleSunoStylesChange = useCallback((styles: string[]): void => {
    const validStyles = styles.filter(isSunoV5Style);
    onInputChange(prev => validStyles.length > 0 && prev.seedGenres.length > 0
      ? { ...prev, sunoStyles: validStyles, seedGenres: [] }
      : { ...prev, sunoStyles: validStyles });
  }, [onInputChange]);

  const handleDescriptionChange = useCallback((value: string): void => {
    onInputChange(prev => ({ ...prev, description: value }));
  }, [onInputChange]);

  const handleLyricsTopicChange = useCallback((value: string): void => {
    onInputChange(prev => ({ ...prev, lyricsTopic: value }));
  }, [onInputChange]);

  const handleLyricsToggleChange = useCallback((checked: boolean): void => {
    onLyricsModeChange(checked);
  }, [onLyricsModeChange]);

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
    handleLyricsToggleChange,
    handleKeyDown,
    handleSubmit,
  };
}
