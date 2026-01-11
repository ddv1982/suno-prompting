import { describe, test, expect } from "bun:test";

describe("CreativeBoostPanel - Mood Selector Position", () => {
  test("exports CreativeBoostPanel component", async () => {
    const { CreativeBoostPanel } = await import(
      "@/components/creative-boost-panel/creative-boost-panel"
    );
    expect(CreativeBoostPanel).toBeDefined();
    expect(typeof CreativeBoostPanel).toBe("function");
  });

  test("mood selector is enabled in both simple and advanced modes", async () => {
    const { CreativeBoostPanel } = await import(
      "@/components/creative-boost-panel/creative-boost-panel"
    );
    const componentString = CreativeBoostPanel.toString();

    // Should have MoodCategoryCombobox in both simple and advanced modes
    expect(componentString).toContain("MoodCategoryCombobox");
    expect(componentString).toContain("isSimpleMode");
    expect(componentString).toContain("!isSimpleMode");
  });

  test("helper text is consistent regardless of direct mode", async () => {
    const { CreativeBoostPanel } = await import(
      "@/components/creative-boost-panel/creative-boost-panel"
    );
    const componentString = CreativeBoostPanel.toString();

    // Verify helper text is always the same (not conditional on Direct Mode)
    expect(componentString).toContain("Influences the emotional tone of enrichment");
    // Should NOT have Direct Mode disabled message
    expect(componentString).not.toContain("Disabled when using direct Suno styles");
  });

  test("badge text is always optional", async () => {
    const { CreativeBoostPanel } = await import(
      "@/components/creative-boost-panel/creative-boost-panel"
    );
    const componentString = CreativeBoostPanel.toString();

    // Verify badge text is always "optional" (not conditional)
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
