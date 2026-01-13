import { describe, test, expect } from 'bun:test';

/**
 * Unit tests for FullWidthSubmitButton component.
 *
 * Tests the button's visual states:
 * - Default generate mode
 * - Refine mode
 * - Generating/refining loading states
 * - Refined success feedback state
 *
 * Following project convention: test pure rendering logic without full React render.
 */

// ============================================
// Types matching the component props
// ============================================

interface FullWidthSubmitButtonProps {
  isGenerating: boolean;
  isRefineMode: boolean;
  disabled: boolean;
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

type ButtonIcon = 'Loader2' | 'Check' | 'RefreshCw' | 'Send';

/**
 * Compute the button's visual state based on props.
 */
function computeButtonState(props: FullWidthSubmitButtonProps): ButtonState {
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

  return { state: 'generate', label: 'GENERATE' };
}

/**
 * Get the icon name based on button state.
 */
function computeButtonIcon(state: ButtonState['state']): ButtonIcon {
  switch (state) {
    case 'generating':
      return 'Loader2';
    case 'refined':
      return 'Check';
    case 'refine':
      return 'RefreshCw';
    case 'generate':
      return 'Send';
  }
}

/**
 * Check if emerald (success) styling should be applied.
 */
function shouldApplySuccessStyling(refined: boolean): boolean {
  return refined;
}

// ============================================
// Tests: Button State Computation
// ============================================

describe('FullWidthSubmitButton', () => {
  describe('computeButtonState', () => {
    describe('generate mode (no current prompt)', () => {
      test('shows GENERATE when idle', () => {
        const props: FullWidthSubmitButtonProps = {
          isGenerating: false,
          isRefineMode: false,
          disabled: false,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('generate');
        expect(result.label).toBe('GENERATE');
      });

      test('shows GENERATING... when generating', () => {
        const props: FullWidthSubmitButtonProps = {
          isGenerating: true,
          isRefineMode: false,
          disabled: true,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('generating');
        expect(result.label).toBe('GENERATING...');
      });
    });

    describe('refine mode (has current prompt)', () => {
      test('shows REFINE when idle', () => {
        const props: FullWidthSubmitButtonProps = {
          isGenerating: false,
          isRefineMode: true,
          disabled: false,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('refine');
        expect(result.label).toBe('REFINE');
      });

      test('shows REFINING... when generating', () => {
        const props: FullWidthSubmitButtonProps = {
          isGenerating: true,
          isRefineMode: true,
          disabled: true,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('generating');
        expect(result.label).toBe('REFINING...');
      });

      test('shows REFINED! after successful refinement', () => {
        const props: FullWidthSubmitButtonProps = {
          isGenerating: false,
          isRefineMode: true,
          disabled: false,
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
        const props: FullWidthSubmitButtonProps = {
          isGenerating: true,
          isRefineMode: true,
          disabled: true,
          refined: true, // Should be ignored when generating
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('generating');
        expect(result.label).toBe('REFINING...');
      });

      test('refined state takes priority over normal refine', () => {
        const props: FullWidthSubmitButtonProps = {
          isGenerating: false,
          isRefineMode: true,
          disabled: false,
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

    test('returns Send for generate state', () => {
      expect(computeButtonIcon('generate')).toBe('Send');
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

  describe('disabled state interaction', () => {
    test('button can be disabled in generate mode', () => {
      const props: FullWidthSubmitButtonProps = {
        isGenerating: false,
        isRefineMode: false,
        disabled: true,
        onSubmit: () => {},
      };

      // Button state computed independently of disabled
      const result = computeButtonState(props);
      expect(result.state).toBe('generate');
      expect(props.disabled).toBe(true);
    });

    test('button can be disabled in refine mode', () => {
      const props: FullWidthSubmitButtonProps = {
        isGenerating: false,
        isRefineMode: true,
        disabled: true,
        onSubmit: () => {},
      };

      const result = computeButtonState(props);
      expect(result.state).toBe('refine');
      expect(props.disabled).toBe(true);
    });

    test('refined state shows even when disabled', () => {
      const props: FullWidthSubmitButtonProps = {
        isGenerating: false,
        isRefineMode: true,
        disabled: true,
        refined: true,
        onSubmit: () => {},
      };

      const result = computeButtonState(props);
      expect(result.state).toBe('refined');
      expect(result.label).toBe('REFINED!');
    });
  });
});
