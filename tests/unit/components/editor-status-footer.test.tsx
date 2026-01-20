/**
 * Unit tests for EditorStatusFooter component.
 * Tests component structure through source code analysis.
 *
 * @module tests/unit/components/editor-status-footer
 */
import { describe, expect, test } from 'bun:test';

describe('EditorStatusFooter component structure', () => {
  test('component exists and is exported', async () => {
    const source = await Bun.file('src/main-ui/components/prompt-editor/editor-status-footer.tsx').text();
    expect(source).toContain('export function EditorStatusFooter(');
  });

  test('has isOptimistic prop with default value', async () => {
    const source = await Bun.file('src/main-ui/components/prompt-editor/editor-status-footer.tsx').text();
    expect(source).toContain('isOptimistic?: boolean');
    expect(source).toContain('isOptimistic = false');
  });

  test('status logic uses isOptimistic for working state', async () => {
    const source = await Bun.file('src/main-ui/components/prompt-editor/editor-status-footer.tsx').text();
    // The key behavior: isOptimistic OR isGenerating shows working status
    expect(source).toContain('if (isOptimistic || isGenerating) return "working"');
  });

  test('useMemo dependencies include isOptimistic', async () => {
    const source = await Bun.file('src/main-ui/components/prompt-editor/editor-status-footer.tsx').text();
    expect(source).toContain('[isOptimistic, isGenerating, useLocalLLM]');
  });

  test('renders keyboard shortcuts', async () => {
    const source = await Bun.file('src/main-ui/components/prompt-editor/editor-status-footer.tsx').text();
    expect(source).toContain('⏎ send');
    expect(source).toContain('⇧⏎ new line');
  });

  test('has StatusIndicator component', async () => {
    const source = await Bun.file('src/main-ui/components/prompt-editor/editor-status-footer.tsx').text();
    expect(source).toContain('import { StatusIndicator }');
    expect(source).toContain('<StatusIndicator');
  });

  test('handles currentModel prop', async () => {
    const source = await Bun.file('src/main-ui/components/prompt-editor/editor-status-footer.tsx').text();
    expect(source).toContain('currentModel?: string');
    // Model is displayed by taking last part after /
    expect(source).toContain("split('/')");
  });

  test('has correct return type annotation', async () => {
    const source = await Bun.file('src/main-ui/components/prompt-editor/editor-status-footer.tsx').text();
    expect(source).toContain(': ReactElement');
  });
});
