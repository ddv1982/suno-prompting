import { describe, test, expect } from 'bun:test';

/**
 * Unit tests for useRefinedFeedback hook logic.
 *
 * Tests the hook's behavior for managing refined success feedback state:
 * - Initial state is false
 * - triggerRefinedFeedback sets refined to true
 * - handleRefine calls onRefine and triggers feedback on success
 * - handleRefine does not trigger feedback on failure
 */

// ============================================
// Pure Logic Functions (matching hook behavior)
// ============================================

interface RefinedFeedbackState {
  refined: boolean;
}

function createInitialState(): RefinedFeedbackState {
  return { refined: false };
}

function triggerRefinedFeedback(state: RefinedFeedbackState): RefinedFeedbackState {
  return { ...state, refined: true };
}

function resetRefinedFeedback(state: RefinedFeedbackState): RefinedFeedbackState {
  return { ...state, refined: false };
}

async function handleRefine(
  state: RefinedFeedbackState,
  onRefine: ((feedback: string) => Promise<boolean>) | undefined,
  feedback: string
): Promise<{ newState: RefinedFeedbackState; shouldTrigger: boolean }> {
  if (!onRefine) {
    return { newState: state, shouldTrigger: false };
  }

  const success = await onRefine(feedback);
  if (success) {
    return { newState: triggerRefinedFeedback(state), shouldTrigger: true };
  }

  return { newState: state, shouldTrigger: false };
}

// ============================================
// Tests
// ============================================

describe('useRefinedFeedback', () => {
  describe('initial state', () => {
    test('refined starts as false', () => {
      const state = createInitialState();
      expect(state.refined).toBe(false);
    });
  });

  describe('triggerRefinedFeedback', () => {
    test('sets refined to true', () => {
      const state = createInitialState();
      const newState = triggerRefinedFeedback(state);
      expect(newState.refined).toBe(true);
    });

    test('can be called multiple times', () => {
      let state = createInitialState();
      state = triggerRefinedFeedback(state);
      state = resetRefinedFeedback(state);
      state = triggerRefinedFeedback(state);
      expect(state.refined).toBe(true);
    });
  });

  describe('resetRefinedFeedback', () => {
    test('sets refined back to false', () => {
      let state = createInitialState();
      state = triggerRefinedFeedback(state);
      state = resetRefinedFeedback(state);
      expect(state.refined).toBe(false);
    });
  });

  describe('handleRefine', () => {
    test('triggers feedback on successful refinement', async () => {
      const state = createInitialState();
      const onRefine = async (_feedback: string): Promise<boolean> => true;

      const { newState, shouldTrigger } = await handleRefine(state, onRefine, 'test feedback');

      expect(shouldTrigger).toBe(true);
      expect(newState.refined).toBe(true);
    });

    test('does not trigger feedback on failed refinement', async () => {
      const state = createInitialState();
      const onRefine = async (_feedback: string): Promise<boolean> => false;

      const { newState, shouldTrigger } = await handleRefine(state, onRefine, 'test feedback');

      expect(shouldTrigger).toBe(false);
      expect(newState.refined).toBe(false);
    });

    test('does not trigger feedback when onRefine is undefined', async () => {
      const state = createInitialState();

      const { newState, shouldTrigger } = await handleRefine(state, undefined, 'test feedback');

      expect(shouldTrigger).toBe(false);
      expect(newState.refined).toBe(false);
    });

    test('passes feedback to onRefine callback', async () => {
      const state = createInitialState();
      let receivedFeedback = '';
      const onRefine = async (feedback: string): Promise<boolean> => {
        receivedFeedback = feedback;
        return true;
      };

      await handleRefine(state, onRefine, 'my feedback text');

      expect(receivedFeedback).toBe('my feedback text');
    });
  });

  describe('usage patterns', () => {
    test('simple pattern: onRefine provided, handleRefine used', async () => {
      const state = createInitialState();
      const onRefine = async (_feedback: string): Promise<boolean> => true;

      const { newState } = await handleRefine(state, onRefine, 'feedback');

      expect(newState.refined).toBe(true);
    });

    test('manual pattern: triggerRefinedFeedback called directly', () => {
      let state = createInitialState();

      // Simulate manual async operation
      const success = true;
      if (success) {
        state = triggerRefinedFeedback(state);
      }

      expect(state.refined).toBe(true);
    });
  });
});
