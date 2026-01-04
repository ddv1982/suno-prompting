/**
 * Component structure and export tests
 * 
 * Note: Full component render tests require React Testing Library.
 * These tests verify component structure, exports, and types.
 */
import { describe, test, expect } from "bun:test";

// Test component exports
describe("Component Exports", () => {
  describe("ToggleRow", () => {
    test("exports ToggleRow component", async () => {
      const { ToggleRow } = await import("@/components/ui/toggle-row");
      expect(ToggleRow).toBeDefined();
      expect(typeof ToggleRow).toBe("function");
    });
  });

  describe("Settings Modal", () => {
    // Note: SettingsModal uses RPC client which requires browser environment (window)
    // Testing the section components that don't have electrobun dependencies
    test("exports FeatureToggles section", async () => {
      const { FeatureToggles } = await import("@/components/settings-modal/feature-toggles");
      expect(FeatureToggles).toBeDefined();
      expect(typeof FeatureToggles).toBe("function");
    });

    test("exports ModelSection section", async () => {
      const { ModelSection } = await import("@/components/settings-modal/model-section");
      expect(ModelSection).toBeDefined();
      expect(typeof ModelSection).toBe("function");
    });
  });

  describe("Advanced Panel", () => {
    test("exports all advanced panel components", async () => {
      const { AdvancedOption, AdvancedPanel, PhrasePreview } = 
        await import("@/components/advanced-panel");
      
      expect(AdvancedOption).toBeDefined();
      expect(AdvancedPanel).toBeDefined();
      expect(PhrasePreview).toBeDefined();
      
      expect(typeof AdvancedOption).toBe("function");
      expect(typeof AdvancedPanel).toBe("function");
      expect(typeof PhrasePreview).toBe("function");
    });
  });

  describe("Quick Vibes Panel", () => {
    test("exports QuickVibesPanel component", async () => {
      const { QuickVibesPanel } = await import("@/components/quick-vibes-panel");
      expect(QuickVibesPanel).toBeDefined();
      expect(typeof QuickVibesPanel).toBe("function");
    });
  });

  describe("Creative Boost Panel", () => {
    test("exports CreativeBoostPanel component", async () => {
      const { CreativeBoostPanel } = await import("@/components/creative-boost-panel");
      expect(CreativeBoostPanel).toBeDefined();
      expect(typeof CreativeBoostPanel).toBe("function");
    });
  });

  // Note: Prompt Editor components use RPC client which requires browser environment (window)
  // These would need integration tests running in the browser context
});

// Test UI component structure
describe("UI Components", () => {
  describe("Button", () => {
    test("exports Button and buttonVariants", async () => {
      const { Button, buttonVariants } = await import("@/components/ui/button");
      expect(Button).toBeDefined();
      expect(buttonVariants).toBeDefined();
      expect(typeof Button).toBe("function");
      expect(typeof buttonVariants).toBe("function");
    });

    test("buttonVariants generates class strings", async () => {
      const { buttonVariants } = await import("@/components/ui/button");
      const classes = buttonVariants({ variant: "default", size: "default" });
      expect(typeof classes).toBe("string");
      expect(classes.length).toBeGreaterThan(0);
    });
  });

  describe("Badge", () => {
    test("exports Badge and badgeVariants", async () => {
      const { Badge, badgeVariants } = await import("@/components/ui/badge");
      expect(Badge).toBeDefined();
      expect(badgeVariants).toBeDefined();
      expect(typeof Badge).toBe("function");
      expect(typeof badgeVariants).toBe("function");
    });

    test("badgeVariants generates class strings", async () => {
      const { badgeVariants } = await import("@/components/ui/badge");
      const classes = badgeVariants({ variant: "secondary", size: "sm" });
      expect(typeof classes).toBe("string");
      expect(classes.length).toBeGreaterThan(0);
    });
  });

  describe("Switch", () => {
    test("exports Switch component", async () => {
      const { Switch } = await import("@/components/ui/switch");
      expect(Switch).toBeDefined();
      expect(typeof Switch).toBe("function");
    });
  });
});
