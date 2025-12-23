import { describe, expect, test } from 'bun:test';
import {
  TIME_SIGNATURES,
  TIME_SIGNATURE_JOURNEYS,
  detectTimeSignature,
  detectTimeSignatureJourney,
  getTimeSignatureGuidance,
  getTimeSignatureJourneyGuidance,
} from '@bun/instruments';

describe('TIME_SIGNATURES', () => {
  test('has standard time signatures', () => {
    expect(TIME_SIGNATURES.time_4_4).toBeDefined();
    expect(TIME_SIGNATURES.time_3_4).toBeDefined();
    expect(TIME_SIGNATURES.time_6_8).toBeDefined();
  });

  test('has odd time signatures', () => {
    expect(TIME_SIGNATURES.time_5_4).toBeDefined();
    expect(TIME_SIGNATURES.time_5_8).toBeDefined();
    expect(TIME_SIGNATURES.time_7_8).toBeDefined();
    expect(TIME_SIGNATURES.time_7_4).toBeDefined();
    expect(TIME_SIGNATURES.time_9_8).toBeDefined();
    expect(TIME_SIGNATURES.time_11_8).toBeDefined();
    expect(TIME_SIGNATURES.time_13_8).toBeDefined();
  });

  test('each signature has required fields', () => {
    for (const [, sig] of Object.entries(TIME_SIGNATURES)) {
      expect(sig.name).toBeDefined();
      expect(sig.signature).toBeDefined();
      expect(sig.beats).toBeGreaterThan(0);
      expect(sig.subdivision).toMatch(/quarter|eighth/);
      expect(sig.keywords.length).toBeGreaterThan(0);
      expect(sig.groupings.length).toBeGreaterThan(0);
      expect(sig.description).toBeDefined();
      expect(sig.feel).toBeDefined();
      expect(sig.characteristics.length).toBeGreaterThan(0);
      expect(sig.bestGenres.length).toBeGreaterThan(0);
    }
  });

  test('5/4 has correct groupings', () => {
    const sig = TIME_SIGNATURES.time_5_4;
    expect(sig.groupings).toContain('3+2');
    expect(sig.groupings).toContain('2+3');
  });

  test('7/8 has correct groupings', () => {
    const sig = TIME_SIGNATURES.time_7_8;
    expect(sig.groupings).toContain('2+2+3');
    expect(sig.groupings).toContain('3+2+2');
  });

  test('11/8 has complex groupings', () => {
    const sig = TIME_SIGNATURES.time_11_8;
    expect(sig.groupings.length).toBeGreaterThanOrEqual(3);
  });
});

describe('TIME_SIGNATURE_JOURNEYS', () => {
  test('has journey definitions', () => {
    expect(TIME_SIGNATURE_JOURNEYS.prog_odyssey).toBeDefined();
    expect(TIME_SIGNATURE_JOURNEYS.balkan_fusion).toBeDefined();
    expect(TIME_SIGNATURE_JOURNEYS.jazz_exploration).toBeDefined();
    expect(TIME_SIGNATURE_JOURNEYS.math_rock_descent).toBeDefined();
    expect(TIME_SIGNATURE_JOURNEYS.celtic_journey).toBeDefined();
    expect(TIME_SIGNATURE_JOURNEYS.metal_complexity).toBeDefined();
    expect(TIME_SIGNATURE_JOURNEYS.gentle_odd).toBeDefined();
  });

  test('each journey has required fields', () => {
    for (const [, journey] of Object.entries(TIME_SIGNATURE_JOURNEYS)) {
      expect(journey.name).toBeDefined();
      expect(journey.signatures.length).toBeGreaterThanOrEqual(2);
      expect(journey.keywords.length).toBeGreaterThan(0);
      expect(journey.description).toBeDefined();
      expect(journey.emotionalArc).toBeDefined();
      expect(journey.sectionGuide).toBeDefined();
      expect(journey.sectionGuide.introVerse).toBeDefined();
      expect(journey.bestGenres.length).toBeGreaterThan(0);
    }
  });

  test('prog odyssey has correct signatures', () => {
    const journey = TIME_SIGNATURE_JOURNEYS.prog_odyssey;
    expect(journey.signatures).toContain('time_4_4');
    expect(journey.signatures).toContain('time_7_8');
    expect(journey.signatures).toContain('time_5_4');
  });
});

describe('detectTimeSignature', () => {
  test('detects 5/4 from keywords', () => {
    expect(detectTimeSignature('a track in 5/4 time')).toBe('time_5_4');
    expect(detectTimeSignature('take five style')).toBe('time_5_4');
    expect(detectTimeSignature('five four groove')).toBe('time_5_4');
  });

  test('detects 7/8 from keywords', () => {
    expect(detectTimeSignature('7/8 balkan groove')).toBe('time_7_8');
    expect(detectTimeSignature('aksak rhythm')).toBe('time_7_8');
    expect(detectTimeSignature('limping beat')).toBe('time_7_8');
  });

  test('detects 9/8 from keywords', () => {
    expect(detectTimeSignature('9/8 slip jig')).toBe('time_9_8');
    expect(detectTimeSignature('compound triple meter')).toBe('time_9_8');
  });

  test('detects 11/8 from keywords', () => {
    expect(detectTimeSignature('11/8 prog metal')).toBe('time_11_8');
    expect(detectTimeSignature('tool time feel')).toBe('time_11_8');
  });

  test('detects waltz time', () => {
    expect(detectTimeSignature('waltz style')).toBe('time_3_4');
    expect(detectTimeSignature('3/4 time')).toBe('time_3_4');
  });

  test('detects compound time', () => {
    expect(detectTimeSignature('6/8 jig')).toBe('time_6_8');
    expect(detectTimeSignature('shuffle feel')).toBe('time_6_8');
  });

  test('returns null for no match', () => {
    expect(detectTimeSignature('a simple pop song')).toBeNull();
  });
});

describe('detectTimeSignatureJourney', () => {
  test('detects prog odyssey', () => {
    expect(detectTimeSignatureJourney('prog odyssey journey')).toBe('prog_odyssey');
    expect(detectTimeSignatureJourney('meter journey through time')).toBe('prog_odyssey');
  });

  test('detects balkan fusion', () => {
    expect(detectTimeSignatureJourney('balkan fusion style')).toBe('balkan_fusion');
    expect(detectTimeSignatureJourney('aksak journey')).toBe('balkan_fusion');
  });

  test('detects jazz exploration', () => {
    expect(detectTimeSignatureJourney('jazz exploration')).toBe('jazz_exploration');
    expect(detectTimeSignatureJourney('brubeck style journey')).toBe('jazz_exploration');
  });

  test('detects math rock descent', () => {
    expect(detectTimeSignatureJourney('math rock complexity')).toBe('math_rock_descent');
  });

  test('returns null for no match', () => {
    expect(detectTimeSignatureJourney('standard rock song')).toBeNull();
  });
});

describe('getTimeSignatureGuidance', () => {
  test('includes signature info', () => {
    const guidance = getTimeSignatureGuidance('time_5_4');
    expect(guidance).toContain('TIME SIGNATURE:');
    expect(guidance).toContain('5/4');
    expect(guidance).toContain('5/4 Time');
  });

  test('includes feel and beats', () => {
    const guidance = getTimeSignatureGuidance('time_7_8');
    expect(guidance).toContain('Feel:');
    expect(guidance).toContain('Beats:');
    expect(guidance).toContain('7 per measure');
  });

  test('includes grouping', () => {
    const guidance = getTimeSignatureGuidance('time_7_8');
    expect(guidance).toContain('Grouping:');
  });

  test('includes characteristics', () => {
    const guidance = getTimeSignatureGuidance('time_5_4');
    expect(guidance).toContain('Characteristics:');
    expect(guidance.match(/^- /gm)?.length).toBeGreaterThanOrEqual(1);
  });

  test('includes famous examples', () => {
    const guidance = getTimeSignatureGuidance('time_5_4');
    expect(guidance).toContain('Famous examples:');
    expect(guidance).toContain('Take Five');
  });

  test('includes best genres', () => {
    const guidance = getTimeSignatureGuidance('time_7_8');
    expect(guidance).toContain('Best genres:');
  });
});

describe('getTimeSignatureJourneyGuidance', () => {
  test('includes journey name', () => {
    const guidance = getTimeSignatureJourneyGuidance('prog_odyssey');
    expect(guidance).toContain('TIME SIGNATURE JOURNEY:');
    expect(guidance).toContain('Prog Odyssey');
  });

  test('includes section guide', () => {
    const guidance = getTimeSignatureJourneyGuidance('balkan_fusion');
    expect(guidance).toContain('SECTION GUIDE:');
    expect(guidance).toContain('INTRO/VERSE:');
  });

  test('includes emotional arc', () => {
    const guidance = getTimeSignatureJourneyGuidance('jazz_exploration');
    expect(guidance).toContain('Emotional Arc:');
  });

  test('includes best genres', () => {
    const guidance = getTimeSignatureJourneyGuidance('metal_complexity');
    expect(guidance).toContain('Best genres:');
  });
});
