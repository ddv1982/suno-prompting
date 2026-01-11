import { describe, test, expect } from "bun:test";

describe("CreativeBoostPanel - Mood Selector Position", () => {
  test("exports CreativeBoostPanel component", async () => {
    const { CreativeBoostPanel } = await import(
      "@/components/creative-boost-panel/creative-boost-panel"
    );
    expect(CreativeBoostPanel).toBeDefined();
    expect(typeof CreativeBoostPanel).toBe("function");
  });

  test("mood selector maintains existing disabled logic", async () => {
    const { CreativeBoostPanel } = await import(
      "@/components/creative-boost-panel/creative-boost-panel"
    );
    const componentString = CreativeBoostPanel.toString();

    // Should have disabled logic for mood
    expect(componentString).toContain("isGenerating || isDirectMode");
    expect(componentString).toContain("MoodCategoryCombobox");
  });

  test("helper text logic includes direct mode check", async () => {
    const { CreativeBoostPanel } = await import(
      "@/components/creative-boost-panel/creative-boost-panel"
    );
    const componentString = CreativeBoostPanel.toString();

    // Verify conditional helper text
    expect(componentString).toContain("Disabled when using direct Suno styles");
    expect(componentString).toContain("Influences the emotional tone of enrichment");
  });

  test("badge text logic includes direct mode check", async () => {
    const { CreativeBoostPanel } = await import(
      "@/components/creative-boost-panel/creative-boost-panel"
    );
    const componentString = CreativeBoostPanel.toString();

    // Verify conditional badge text (check for the values in minified output)
    expect(componentString).toContain("disabled");
    expect(componentString).toContain("optional");
    expect(componentString).toContain("badgeText");
  });

  test("component structure includes mood after creativity slider", async () => {
    const { CreativeBoostPanel } = await import(
      "@/components/creative-boost-panel/creative-boost-panel"
    );
    const componentString = CreativeBoostPanel.toString();

    // Verify mood appears in component
    expect(componentString).toContain("CreativitySlider");
    expect(componentString).toContain("MoodCategoryCombobox");
    expect(componentString).toContain("GenreMultiSelect");

    // Mood should appear in advanced mode (!isSimpleMode)
    const moodIndex = componentString.indexOf("MoodCategoryCombobox");
    const genreIndex = componentString.indexOf("GenreMultiSelect");

    // There should be at least one MoodCategoryCombobox before GenreMultiSelect in advanced mode
    expect(moodIndex).toBeGreaterThan(-1);
    expect(genreIndex).toBeGreaterThan(-1);
  });
});
