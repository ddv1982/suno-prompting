/**
 * Unit tests for OutputSkeleton component.
 * Tests component structure through source code analysis.
 *
 * @module tests/unit/components/output-skeleton
 */
import { describe, expect, test } from 'bun:test';

describe('OutputSkeleton component structure', () => {
  test('component exists and is exported', async () => {
    const source = await Bun.file(
      'src/main-ui/components/prompt-editor/output-skeleton.tsx'
    ).text();
    expect(source).toContain('export function OutputSkeleton()');
  });

  test('renders title section label', async () => {
    const source = await Bun.file(
      'src/main-ui/components/prompt-editor/output-skeleton.tsx'
    ).text();
    expect(source).toContain('<SectionLabel>Title</SectionLabel>');
  });

  test('renders style prompt section label', async () => {
    const source = await Bun.file(
      'src/main-ui/components/prompt-editor/output-skeleton.tsx'
    ).text();
    expect(source).toContain('<SectionLabel>Style Prompt</SectionLabel>');
  });

  test('uses Skeleton components', async () => {
    const source = await Bun.file(
      'src/main-ui/components/prompt-editor/output-skeleton.tsx'
    ).text();
    expect(source).toContain('import { Skeleton }');
    expect(source).toContain('<Skeleton');
  });

  test('uses Card components', async () => {
    const source = await Bun.file(
      'src/main-ui/components/prompt-editor/output-skeleton.tsx'
    ).text();
    expect(source).toContain('import { Card, CardContent }');
    expect(source).toContain('<Card');
    expect(source).toContain('<CardContent');
  });

  test('has proper layout spacing', async () => {
    const source = await Bun.file(
      'src/main-ui/components/prompt-editor/output-skeleton.tsx'
    ).text();
    expect(source).toContain('space-y-[var(--space-5)]');
  });

  test('title skeleton has appropriate dimensions', async () => {
    const source = await Bun.file(
      'src/main-ui/components/prompt-editor/output-skeleton.tsx'
    ).text();
    // Title skeleton should have h-6 and w-48
    expect(source).toContain('h-6 w-48');
  });

  test('prompt skeletons have full width lines', async () => {
    const source = await Bun.file(
      'src/main-ui/components/prompt-editor/output-skeleton.tsx'
    ).text();
    // Should have full-width skeletons for prompt content
    expect(source).toContain('w-full');
    // Should have a 3/4 width line at the end
    expect(source).toContain('w-3/4');
  });

  test('has correct return type annotation', async () => {
    const source = await Bun.file(
      'src/main-ui/components/prompt-editor/output-skeleton.tsx'
    ).text();
    expect(source).toContain(': ReactElement');
  });
});
