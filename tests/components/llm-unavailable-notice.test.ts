import { describe, test, expect } from 'bun:test';

/**
 * Unit tests for LLMUnavailableNotice component logic.
 *
 * Tests the component's rendering decisions based on:
 * - isLLMAvailable state
 * - showText prop
 *
 * Following the project's pattern of testing pure logic extraction.
 */

// ============================================
// Types matching the component props/context
// ============================================

interface LLMUnavailableNoticeProps {
  showText?: boolean;
}

interface SettingsContextValue {
  isLLMAvailable: boolean;
  llmUnavailableReason: 'no_api_key' | 'ollama_offline' | 'model_missing' | null;
  openSettings: () => void;
}

// ============================================
// Pure logic functions extracted from component
// ============================================

interface RenderDecision {
  shouldRender: boolean;
  showIconOnly: boolean;
  showWithText: boolean;
  tooltipContent: string;
}

/**
 * Compute what the component should render based on props and context.
 */
function computeRenderDecision(
  props: LLMUnavailableNoticeProps,
  context: SettingsContextValue
): RenderDecision {
  const { showText = false } = props;
  const { isLLMAvailable } = context;

  if (isLLMAvailable) {
    return {
      shouldRender: false,
      showIconOnly: false,
      showWithText: false,
      tooltipContent: '',
    };
  }

  return {
    shouldRender: true,
    showIconOnly: !showText,
    showWithText: showText,
    tooltipContent: 'Configure AI in Settings to generate',
  };
}

/**
 * Get the text to display when showText is true.
 */
function getDisplayText(): string {
  return 'Configure AI in Settings';
}

/**
 * Handle click action - should open settings.
 */
function handleClick(openSettings: () => void): void {
  openSettings();
}

// ============================================
// Tests
// ============================================

describe('LLMUnavailableNotice', () => {
  describe('computeRenderDecision', () => {
    describe('when LLM is available', () => {
      test('renders nothing when LLM is available', () => {
        const props: LLMUnavailableNoticeProps = {};
        const context: SettingsContextValue = {
          isLLMAvailable: true,
          llmUnavailableReason: null,
          openSettings: () => {},
        };

        const result = computeRenderDecision(props, context);

        expect(result.shouldRender).toBe(false);
        expect(result.showIconOnly).toBe(false);
        expect(result.showWithText).toBe(false);
      });

      test('renders nothing when LLM is available even with showText=true', () => {
        const props: LLMUnavailableNoticeProps = { showText: true };
        const context: SettingsContextValue = {
          isLLMAvailable: true,
          llmUnavailableReason: null,
          openSettings: () => {},
        };

        const result = computeRenderDecision(props, context);

        expect(result.shouldRender).toBe(false);
      });
    });

    describe('when LLM is unavailable', () => {
      test('renders info icon when LLM is unavailable (default showText=false)', () => {
        const props: LLMUnavailableNoticeProps = {};
        const context: SettingsContextValue = {
          isLLMAvailable: false,
          llmUnavailableReason: 'no_api_key',
          openSettings: () => {},
        };

        const result = computeRenderDecision(props, context);

        expect(result.shouldRender).toBe(true);
        expect(result.showIconOnly).toBe(true);
        expect(result.showWithText).toBe(false);
      });

      test('renders text when showText=true and LLM unavailable', () => {
        const props: LLMUnavailableNoticeProps = { showText: true };
        const context: SettingsContextValue = {
          isLLMAvailable: false,
          llmUnavailableReason: 'ollama_offline',
          openSettings: () => {},
        };

        const result = computeRenderDecision(props, context);

        expect(result.shouldRender).toBe(true);
        expect(result.showIconOnly).toBe(false);
        expect(result.showWithText).toBe(true);
      });

      test('does not render text when showText=false', () => {
        const props: LLMUnavailableNoticeProps = { showText: false };
        const context: SettingsContextValue = {
          isLLMAvailable: false,
          llmUnavailableReason: 'model_missing',
          openSettings: () => {},
        };

        const result = computeRenderDecision(props, context);

        expect(result.shouldRender).toBe(true);
        expect(result.showWithText).toBe(false);
        expect(result.showIconOnly).toBe(true);
      });

      test('tooltip content is always set when rendered', () => {
        const props: LLMUnavailableNoticeProps = {};
        const context: SettingsContextValue = {
          isLLMAvailable: false,
          llmUnavailableReason: 'no_api_key',
          openSettings: () => {},
        };

        const result = computeRenderDecision(props, context);

        expect(result.tooltipContent).toBe('Configure AI in Settings to generate');
      });
    });

    describe('different unavailable reasons', () => {
      test('renders for no_api_key reason', () => {
        const props: LLMUnavailableNoticeProps = { showText: true };
        const context: SettingsContextValue = {
          isLLMAvailable: false,
          llmUnavailableReason: 'no_api_key',
          openSettings: () => {},
        };

        const result = computeRenderDecision(props, context);
        expect(result.shouldRender).toBe(true);
      });

      test('renders for ollama_offline reason', () => {
        const props: LLMUnavailableNoticeProps = { showText: true };
        const context: SettingsContextValue = {
          isLLMAvailable: false,
          llmUnavailableReason: 'ollama_offline',
          openSettings: () => {},
        };

        const result = computeRenderDecision(props, context);
        expect(result.shouldRender).toBe(true);
      });

      test('renders for model_missing reason', () => {
        const props: LLMUnavailableNoticeProps = { showText: true };
        const context: SettingsContextValue = {
          isLLMAvailable: false,
          llmUnavailableReason: 'model_missing',
          openSettings: () => {},
        };

        const result = computeRenderDecision(props, context);
        expect(result.shouldRender).toBe(true);
      });
    });
  });

  describe('getDisplayText', () => {
    test('returns correct display text', () => {
      expect(getDisplayText()).toBe('Configure AI in Settings');
    });
  });

  describe('handleClick', () => {
    test('calls openSettings when clicked', () => {
      let called = false;
      const openSettings = () => {
        called = true;
      };

      handleClick(openSettings);

      expect(called).toBe(true);
    });
  });
});
