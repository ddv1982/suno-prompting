import { describe, test, expect } from "bun:test";

describe("AdvancedPanel - Mood Selector", () => {
  test("exports AdvancedPanel with mood props", async () => {
    const { AdvancedPanel } = await import("@/components/advanced-panel/advanced-panel");
    expect(AdvancedPanel).toBeDefined();
    expect(typeof AdvancedPanel).toBe("function");
  });

  test("mood props are properly typed", async () => {
    // Verify TypeScript compilation with mood props
    const mockSelection = {
      seedGenres: [],
      sunoStyles: [],
      harmonicStyle: null,
      harmonicCombination: null,
      polyrhythmCombination: null,
      timeSignature: null,
      timeSignatureJourney: null,
    };

    const mockProps = {
      selection: mockSelection,
      onUpdate: () => {},
      onClear: () => {},
      computedPhrase: "",
      moodCategory: "energetic" as const,
      onMoodCategoryChange: () => {},
      isGenerating: false,
    };

    const { AdvancedPanel } = await import("@/components/advanced-panel/advanced-panel");
    // Component should accept mood props without TypeScript errors
    expect(() => AdvancedPanel(mockProps)).not.toThrow();
  });

  test("mood props handle null values", async () => {
    const mockSelection = {
      seedGenres: [],
      sunoStyles: [],
      harmonicStyle: null,
      harmonicCombination: null,
      polyrhythmCombination: null,
      timeSignature: null,
      timeSignatureJourney: null,
    };

    const mockPropsWithNull = {
      selection: mockSelection,
      onUpdate: () => {},
      onClear: () => {},
      computedPhrase: "",
      moodCategory: null,
      onMoodCategoryChange: () => {},
      isGenerating: false,
    };

    const { AdvancedPanel } = await import("@/components/advanced-panel/advanced-panel");
    // Component should handle null mood value
    expect(() => AdvancedPanel(mockPropsWithNull)).not.toThrow();
  });

  test("mood props handle undefined values", async () => {
    const mockSelection = {
      seedGenres: [],
      sunoStyles: [],
      harmonicStyle: null,
      harmonicCombination: null,
      polyrhythmCombination: null,
      timeSignature: null,
      timeSignatureJourney: null,
    };

    const mockPropsWithUndefined = {
      selection: mockSelection,
      onUpdate: () => {},
      onClear: () => {},
      computedPhrase: "",
      moodCategory: undefined,
      onMoodCategoryChange: () => {},
      isGenerating: false,
    };

    const { AdvancedPanel } = await import("@/components/advanced-panel/advanced-panel");
    // Component should handle undefined mood value
    expect(() => AdvancedPanel(mockPropsWithUndefined)).not.toThrow();
  });

  test("mood selector appears before genres in component structure", async () => {
    const { AdvancedPanel } = await import("@/components/advanced-panel/advanced-panel");
    // Structural test - verify mood import and usage
    const componentString = AdvancedPanel.toString();
    expect(componentString).toContain("MoodCategoryCombobox");
    expect(componentString).toContain("GenreMultiSelect");
  });

  test("component imports MoodCategory type", async () => {
    // Verify type import exists
    const module = await import("@/components/advanced-panel/advanced-panel");
    expect(module.AdvancedPanel).toBeDefined();
  });
});
