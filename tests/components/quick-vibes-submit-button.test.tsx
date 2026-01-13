import { describe, test, expect } from 'bun:test';

/**
 * Unit tests for Quick Vibes SubmitButton component.
 *
 * Tests the button's visual states including:
 * - Default generate mode (GENERATE QUICK VIBES)
 * - Refine mode (REFINE)
 * - Generating/refining loading states
 * - Refined success feedback state
 */

// ============================================
// Types matching the component props
// ============================================

interface SubmitButtonProps {
  isGenerating: boolean;
  isRefineMode: boolean;
  canSubmit: boolean;
  refined?: boolean;
  onSubmit: () => void;
}

// ============================================
// Pure logic functions extracted from component
// ============================================

type ButtonState =
  | { state: 'generating'; label: string }
  | { state: 'refined'; label: string }
  | { state: 'refine'; label: string }
  | { state: 'generate'; label: string };

type ButtonIcon = 'Loader2' | 'Check' | 'RefreshCw' | 'Sparkles';

function computeButtonState(props: SubmitButtonProps): ButtonState {
  const { isGenerating, isRefineMode, refined = false } = props;

  if (isGenerating) {
    return {
      state: 'generating',
      label: isRefineMode ? 'REFINING...' : 'GENERATING...',
    };
  }

  if (refined) {
    return { state: 'refined', label: 'REFINED!' };
  }

  if (isRefineMode) {
    return { state: 'refine', label: 'REFINE' };
  }

  return { state: 'generate', label: 'GENERATE QUICK VIBES' };
}

function computeButtonIcon(state: ButtonState['state']): ButtonIcon {
  switch (state) {
    case 'generating':
      return 'Loader2';
    case 'refined':
      return 'Check';
    case 'refine':
      return 'RefreshCw';
    case 'generate':
      return 'Sparkles';
  }
}

function shouldApplySuccessStyling(refined: boolean): boolean {
  return refined;
}

// ============================================
// Tests
// ============================================

describe('Quick Vibes SubmitButton', () => {
  describe('computeButtonState', () => {
    describe('generate mode', () => {
      test('shows GENERATE QUICK VIBES when idle', () => {
        const props: SubmitButtonProps = {
          isGenerating: false,
          isRefineMode: false,
          canSubmit: true,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('generate');
        expect(result.label).toBe('GENERATE QUICK VIBES');
      });

      test('shows GENERATING... when generating', () => {
        const props: SubmitButtonProps = {
          isGenerating: true,
          isRefineMode: false,
          canSubmit: false,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('generating');
        expect(result.label).toBe('GENERATING...');
      });
    });

    describe('refine mode', () => {
      test('shows REFINE when refine mode', () => {
        const props: SubmitButtonProps = {
          isGenerating: false,
          isRefineMode: true,
          canSubmit: true,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('refine');
        expect(result.label).toBe('REFINE');
      });

      test('shows REFINING... when refining', () => {
        const props: SubmitButtonProps = {
          isGenerating: true,
          isRefineMode: true,
          canSubmit: false,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('generating');
        expect(result.label).toBe('REFINING...');
      });

      test('shows REFINED! after successful refinement', () => {
        const props: SubmitButtonProps = {
          isGenerating: false,
          isRefineMode: true,
          canSubmit: true,
          refined: true,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('refined');
        expect(result.label).toBe('REFINED!');
      });
    });

    describe('state priority', () => {
      test('generating state takes priority over refined', () => {
        const props: SubmitButtonProps = {
          isGenerating: true,
          isRefineMode: true,
          canSubmit: false,
          refined: true,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('generating');
      });

      test('refined state takes priority over refine mode', () => {
        const props: SubmitButtonProps = {
          isGenerating: false,
          isRefineMode: true,
          canSubmit: true,
          refined: true,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('refined');
      });
    });
  });

  describe('computeButtonIcon', () => {
    test('returns Loader2 for generating state', () => {
      expect(computeButtonIcon('generating')).toBe('Loader2');
    });

    test('returns Check for refined state', () => {
      expect(computeButtonIcon('refined')).toBe('Check');
    });

    test('returns RefreshCw for refine state', () => {
      expect(computeButtonIcon('refine')).toBe('RefreshCw');
    });

    test('returns Sparkles for generate state', () => {
      expect(computeButtonIcon('generate')).toBe('Sparkles');
    });
  });

  describe('shouldApplySuccessStyling', () => {
    test('returns true when refined is true', () => {
      expect(shouldApplySuccessStyling(true)).toBe(true);
    });

    test('returns false when refined is false', () => {
      expect(shouldApplySuccessStyling(false)).toBe(false);
    });
  });
});
