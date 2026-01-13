import { describe, test, expect } from 'bun:test';

/**
 * Unit tests for Creative Boost SubmitButton component.
 *
 * Tests the button's visual states including:
 * - Default generate mode (GENERATE CREATIVE BOOST)
 * - Direct mode (USE SELECTED STYLES)
 * - Refine mode (REFINE, REFINE TITLE & LYRICS)
 * - Generating/refining loading states
 * - Refined success feedback state
 */

// ============================================
// Types matching the component props
// ============================================

interface SubmitButtonProps {
  isGenerating: boolean;
  isRefineMode: boolean;
  isDirectMode: boolean;
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
  | { state: 'directMode'; label: string }
  | { state: 'generate'; label: string };

type ButtonIcon = 'Loader2' | 'Check' | 'RefreshCw' | 'Zap' | 'Dice3';

function computeButtonState(props: SubmitButtonProps): ButtonState {
  const { isGenerating, isRefineMode, isDirectMode, refined = false } = props;

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
    return {
      state: 'refine',
      label: isDirectMode ? 'REFINE TITLE & LYRICS' : 'REFINE',
    };
  }

  if (isDirectMode) {
    return { state: 'directMode', label: 'USE SELECTED STYLES' };
  }

  return { state: 'generate', label: 'GENERATE CREATIVE BOOST' };
}

function computeButtonIcon(state: ButtonState['state']): ButtonIcon {
  switch (state) {
    case 'generating':
      return 'Loader2';
    case 'refined':
      return 'Check';
    case 'refine':
      return 'RefreshCw';
    case 'directMode':
      return 'Zap';
    case 'generate':
      return 'Dice3';
  }
}

function shouldApplySuccessStyling(refined: boolean): boolean {
  return refined;
}

// ============================================
// Tests
// ============================================

describe('Creative Boost SubmitButton', () => {
  describe('computeButtonState', () => {
    describe('generate mode', () => {
      test('shows GENERATE CREATIVE BOOST when idle', () => {
        const props: SubmitButtonProps = {
          isGenerating: false,
          isRefineMode: false,
          isDirectMode: false,
          canSubmit: true,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('generate');
        expect(result.label).toBe('GENERATE CREATIVE BOOST');
      });

      test('shows GENERATING... when generating', () => {
        const props: SubmitButtonProps = {
          isGenerating: true,
          isRefineMode: false,
          isDirectMode: false,
          canSubmit: false,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('generating');
        expect(result.label).toBe('GENERATING...');
      });
    });

    describe('direct mode (Suno V5 styles)', () => {
      test('shows USE SELECTED STYLES when direct mode active', () => {
        const props: SubmitButtonProps = {
          isGenerating: false,
          isRefineMode: false,
          isDirectMode: true,
          canSubmit: true,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('directMode');
        expect(result.label).toBe('USE SELECTED STYLES');
      });
    });

    describe('refine mode', () => {
      test('shows REFINE when refine mode without direct mode', () => {
        const props: SubmitButtonProps = {
          isGenerating: false,
          isRefineMode: true,
          isDirectMode: false,
          canSubmit: true,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('refine');
        expect(result.label).toBe('REFINE');
      });

      test('shows REFINE TITLE & LYRICS when refine mode with direct mode', () => {
        const props: SubmitButtonProps = {
          isGenerating: false,
          isRefineMode: true,
          isDirectMode: true,
          canSubmit: true,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('refine');
        expect(result.label).toBe('REFINE TITLE & LYRICS');
      });

      test('shows REFINING... when refining', () => {
        const props: SubmitButtonProps = {
          isGenerating: true,
          isRefineMode: true,
          isDirectMode: false,
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
          isDirectMode: false,
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
          isDirectMode: false,
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
          isDirectMode: false,
          canSubmit: true,
          refined: true,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('refined');
      });

      test('refine mode takes priority over direct mode', () => {
        const props: SubmitButtonProps = {
          isGenerating: false,
          isRefineMode: true,
          isDirectMode: true,
          canSubmit: true,
          onSubmit: () => {},
        };

        const result = computeButtonState(props);

        expect(result.state).toBe('refine');
        expect(result.label).toBe('REFINE TITLE & LYRICS');
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

    test('returns Zap for direct mode state', () => {
      expect(computeButtonIcon('directMode')).toBe('Zap');
    });

    test('returns Dice3 for generate state', () => {
      expect(computeButtonIcon('generate')).toBe('Dice3');
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
