import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';

import { useOriginalSelection } from '@/hooks/use-original-selection';

import { renderWithAct, updateWithAct } from '../helpers/react-test-renderer';

import type { MoodCategory } from '@bun/mood';
import type { AdvancedSelection, OriginalAdvancedSelection } from '@shared/types';
import type { ReactElement } from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';

interface HarnessProps {
  currentPrompt: string;
  advancedSelection: AdvancedSelection;
  moodCategory: MoodCategory | null;
  onValue: (value: OriginalAdvancedSelection | null) => void;
}

interface HarnessHandle {
  renderer: ReactTestRenderer;
  latest: { current: OriginalAdvancedSelection | null };
  update: (nextProps: Omit<HarnessProps, 'onValue'>) => Promise<void>;
}

function createSelection(overrides: Partial<AdvancedSelection> = {}): AdvancedSelection {
  return {
    seedGenres: ['jazz'],
    sunoStyles: ['dream-pop'],
    harmonicStyle: 'modal-shift',
    harmonicCombination: 'dorian-to-mixolydian',
    polyrhythmCombination: '3-over-4',
    timeSignature: '7/8',
    timeSignatureJourney: 'evolving',
    ...overrides,
  };
}

function renderHarness(initialProps: Omit<HarnessProps, 'onValue'>): HarnessHandle {
  const latest: { current: OriginalAdvancedSelection | null } = { current: null };

  function Harness({
    currentPrompt,
    advancedSelection,
    moodCategory,
    onValue,
  }: HarnessProps): ReactElement | null {
    const result = useOriginalSelection(currentPrompt, advancedSelection, moodCategory);
    onValue(result);
    return null;
  }

  const renderElement = (props: Omit<HarnessProps, 'onValue'>): ReactElement =>
    createElement(Harness, {
      ...props,
      onValue: (value: OriginalAdvancedSelection | null) => {
        latest.current = value;
      },
    });

  const renderer = renderWithAct(renderElement(initialProps));

  return {
    renderer,
    latest,
    update: async (nextProps) => {
      await updateWithAct(renderer, renderElement(nextProps));
    },
  };
}

describe('useOriginalSelection', () => {
  test('captures selection only on no-prompt to prompt transition with deep-copied arrays', async () => {
    const initialSelection = createSelection();
    const { latest, update } = renderHarness({
      currentPrompt: '',
      advancedSelection: initialSelection,
      moodCategory: 'melancholy' as MoodCategory,
    });

    expect(latest.current).toBeNull();

    await update({
      currentPrompt: 'generated prompt',
      advancedSelection: initialSelection,
      moodCategory: 'melancholy' as MoodCategory,
    });
    await update({
      currentPrompt: 'generated prompt',
      advancedSelection: initialSelection,
      moodCategory: 'melancholy' as MoodCategory,
    });

    expect(latest.current).not.toBeNull();
    expect(latest.current?.seedGenres).toEqual(['jazz']);
    expect(latest.current?.sunoStyles).toEqual(['dream-pop']);
    expect(latest.current?.harmonicStyle).toBe('modal-shift');
    expect(latest.current?.harmonicCombination).toBe('dorian-to-mixolydian');
    expect(latest.current?.polyrhythmCombination).toBe('3-over-4');
    expect(latest.current?.timeSignature).toBe('7/8');
    expect(latest.current?.timeSignatureJourney).toBe('evolving');
    expect(latest.current?.moodCategory).toBe('melancholy');
    expect(latest.current?.seedGenres).not.toBe(initialSelection.seedGenres);
    expect(latest.current?.sunoStyles).not.toBe(initialSelection.sunoStyles);

    initialSelection.seedGenres.push('rock');
    initialSelection.sunoStyles.push('shoegaze');

    expect(latest.current?.seedGenres).toEqual(['jazz']);
    expect(latest.current?.sunoStyles).toEqual(['dream-pop']);
  });

  test('keeps original selection stable while prompt remains truthy', async () => {
    const firstSelection = createSelection({ seedGenres: ['jazz'] });
    const { latest, update } = renderHarness({
      currentPrompt: '',
      advancedSelection: firstSelection,
      moodCategory: null,
    });

    await update({
      currentPrompt: 'prompt-1',
      advancedSelection: firstSelection,
      moodCategory: null,
    });
    await update({
      currentPrompt: 'prompt-1',
      advancedSelection: firstSelection,
      moodCategory: null,
    });

    const capturedSeedGenres = latest.current?.seedGenres;

    await update({
      currentPrompt: 'prompt-2',
      advancedSelection: createSelection({ seedGenres: ['rock'], sunoStyles: ['grunge'] }),
      moodCategory: 'uplifting' as MoodCategory,
    });

    expect(latest.current?.seedGenres).toEqual(capturedSeedGenres);
    expect(latest.current?.seedGenres).toEqual(['jazz']);
    expect(latest.current?.sunoStyles).toEqual(['dream-pop']);
  });

  test('resets capture on clear and recaptures on the next generation', async () => {
    const { latest, update } = renderHarness({
      currentPrompt: '',
      advancedSelection: createSelection({ seedGenres: ['jazz'] }),
      moodCategory: null,
    });

    await update({
      currentPrompt: 'prompt-1',
      advancedSelection: createSelection({ seedGenres: ['jazz'] }),
      moodCategory: null,
    });
    await update({
      currentPrompt: 'prompt-1',
      advancedSelection: createSelection({ seedGenres: ['jazz'] }),
      moodCategory: null,
    });

    expect(latest.current?.seedGenres).toEqual(['jazz']);

    await update({
      currentPrompt: '',
      advancedSelection: createSelection({ seedGenres: ['jazz'] }),
      moodCategory: null,
    });
    await update({
      currentPrompt: '',
      advancedSelection: createSelection({ seedGenres: ['jazz'] }),
      moodCategory: null,
    });

    expect(latest.current).toBeNull();

    await update({
      currentPrompt: 'prompt-2',
      advancedSelection: createSelection({ seedGenres: ['rock'], sunoStyles: ['indie-pop'] }),
      moodCategory: 'anxious' as MoodCategory,
    });
    await update({
      currentPrompt: 'prompt-2',
      advancedSelection: createSelection({ seedGenres: ['rock'], sunoStyles: ['indie-pop'] }),
      moodCategory: 'anxious' as MoodCategory,
    });

    expect(latest.current?.seedGenres).toEqual(['rock']);
    expect(latest.current?.sunoStyles).toEqual(['indie-pop']);
    expect(latest.current?.moodCategory).toBe('anxious');
  });
});
