/**
 * Integration tests for generation flow with optimistic UI.
 * Tests file structure and integration between modules.
 *
 * @module tests/integration/generation-optimistic
 */
import { describe, expect, test } from 'bun:test';

describe('Generation Flow with Optimistic UI Integration', () => {
  describe('Module integration', () => {
    test('PromptEditor imports and passes optimistic props', async () => {
      const source = await Bun.file('src/main-ui/components/prompt-editor.tsx').text();

      // Verify destructuring includes optimistic state
      expect(source).toContain('isOptimistic');
      expect(source).toContain('showSkeleton');

      // Verify props are passed to OutputPanel
      expect(source).toContain('showSkeleton={showSkeleton}');

      // Verify props are passed to EditorStatusFooter
      expect(source).toContain('isOptimistic={isOptimistic}');
    });

    test('PromptEditorContainer extracts optimistic state from context', async () => {
      const source = await Bun.file('src/main-ui/components/prompt-editor-container.tsx').text();

      // Verify extraction from context
      expect(source).toContain('isOptimistic');
      expect(source).toContain('showSkeleton');
    });

    test('GenerationState type includes optimistic properties', async () => {
      const source = await Bun.file('src/main-ui/components/prompt-editor/types.ts').text();

      expect(source).toContain('isOptimistic: boolean');
      expect(source).toContain('showSkeleton: boolean');
    });

    test('OutputPanel has showSkeleton prop', async () => {
      const source = await Bun.file('src/main-ui/components/prompt-editor/output-panel.tsx').text();

      // Verify prop is defined
      expect(source).toContain('showSkeleton?: boolean');

      // Verify skeleton is rendered conditionally
      expect(source).toContain('if (showSkeleton && !currentPrompt)');
      expect(source).toContain('return <OutputSkeleton />');
    });

    test('EditorStatusFooter has isOptimistic prop', async () => {
      const source = await Bun.file(
        'src/main-ui/components/prompt-editor/editor-status-footer.tsx'
      ).text();

      // Verify prop is defined
      expect(source).toContain('isOptimistic?: boolean');

      // Verify status logic uses optimistic
      expect(source).toContain("if (isOptimistic || isGenerating) return 'working'");
    });
  });

  describe('Generation action integration', () => {
    test('useGenerationAction calls optimistic methods', async () => {
      const source = await Bun.file('src/main-ui/hooks/use-generation-action.ts').text();

      // Verify methods are called at the right points
      expect(source).toContain('// Start optimistic UI immediately');
      expect(source).toContain('startOptimistic?.(action)');
      expect(source).toContain('// Complete optimistic UI on success');
      expect(source).toContain('completeOptimistic?.()');
      expect(source).toContain('// Reset optimistic UI on error');
      expect(source).toContain('errorOptimistic?.()');
    });

    test('baseDeps includes optimistic methods', async () => {
      const source = await Bun.file('src/main-ui/context/generation/generation-context.tsx').text();

      expect(source).toContain('startOptimistic: stateCtx.startOptimistic');
      expect(source).toContain('completeOptimistic: stateCtx.completeOptimistic');
      expect(source).toContain('errorOptimistic: stateCtx.errorOptimistic');
    });
  });

  describe('OutputSkeleton component', () => {
    test('OutputSkeleton file exists and exports component', async () => {
      const source = await Bun.file(
        'src/main-ui/components/prompt-editor/output-skeleton.tsx'
      ).text();

      // Verify component is exported
      expect(source).toContain('export function OutputSkeleton()');

      // Verify it uses Skeleton component
      expect(source).toContain('import { Skeleton }');
      expect(source).toContain('<Skeleton');

      // Verify it has title and prompt sections
      expect(source).toContain('>Title<');
      expect(source).toContain('>Style Prompt<');
    });
  });

  describe('State flow completeness', () => {
    test('optimistic state flows from hook to UI', async () => {
      // Hook defines state
      const hookSource = await Bun.file('src/main-ui/hooks/use-optimistic-generation.ts').text();
      expect(hookSource).toContain('isOptimistic: false');
      expect(hookSource).toContain('showSkeleton: false');

      // Context connects hook to provider
      const contextSource = await Bun.file(
        'src/main-ui/context/generation/generation-state-context.tsx'
      ).text();
      expect(contextSource).toContain('useOptimisticGeneration');

      // Types define the contract
      const typesSource = await Bun.file('src/main-ui/context/generation/types.ts').text();
      expect(typesSource).toContain('isOptimistic: boolean');

      // Container extracts from context
      const containerSource = await Bun.file(
        'src/main-ui/components/prompt-editor-container.tsx'
      ).text();
      expect(containerSource).toContain('isOptimistic');

      // Editor passes to children
      const editorSource = await Bun.file('src/main-ui/components/prompt-editor.tsx').text();
      expect(editorSource).toContain('showSkeleton={showSkeleton}');
      expect(editorSource).toContain('isOptimistic={isOptimistic}');
    });
  });
});

describe('Optimistic UI Flow Sequence', () => {
  test('generation start triggers optimistic state', async () => {
    const source = await Bun.file('src/main-ui/hooks/use-generation-action.ts').text();

    // Find the try block to verify order
    const tryBlockStart = source.indexOf('try {');
    const startOptimisticCall = source.indexOf('startOptimistic?.(action)');
    const setGeneratingActionCall = source.indexOf('setGeneratingAction(action)', tryBlockStart);

    // startOptimistic should be called before setGeneratingAction
    expect(startOptimisticCall).toBeLessThan(setGeneratingActionCall);
    expect(startOptimisticCall).toBeGreaterThan(tryBlockStart);
  });

  test('generation success calls completeOptimistic', async () => {
    const source = await Bun.file('src/main-ui/hooks/use-generation-action.ts').text();

    // completeOptimistic should be called after completeSessionUpdate
    const completeSessionCall = source.indexOf('completeSessionUpdate(');
    const completeOptimisticCall = source.indexOf('completeOptimistic?.()');

    expect(completeOptimisticCall).toBeGreaterThan(completeSessionCall);
  });

  test('generation error calls errorOptimistic', async () => {
    const source = await Bun.file('src/main-ui/hooks/use-generation-action.ts').text();

    // errorOptimistic should be in catch block
    const catchBlock = source.indexOf('} catch (error: unknown) {');
    const errorOptimisticCall = source.indexOf('errorOptimistic?.()');
    const handleErrorCall = source.indexOf('handleGenerationError(');

    expect(errorOptimisticCall).toBeGreaterThan(catchBlock);
    expect(errorOptimisticCall).toBeLessThan(handleErrorCall);
  });
});
