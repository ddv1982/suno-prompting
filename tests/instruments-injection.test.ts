import { describe, expect, test } from 'bun:test';

import { injectInstrumentTags } from '@bun/prompt/instruments-injection';

describe('injectInstrumentTags', () => {
  test('injects tags into max format instruments line and strips existing vocal items', () => {
    const input = `[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)
genre: "ambient metal"
bpm: "90"
instruments: "baritone guitar, vocals, crystalline synth pads"
style tags: "raw"
recording: "studio"`;

    const output = injectInstrumentTags(
      input,
      ['alto vocals', 'breathy vocals', 'shouted hooks'],
      true
    );

    const lower = output.toLowerCase();
    expect(lower).toContain('instruments:');
    expect(lower).toContain('alto vocals');
    expect(lower).toContain('breathy vocals');
    expect(lower).toContain('shouted hooks');
    expect(lower).not.toContain('instruments: "baritone guitar, vocals');
  });

  test('inserts Instruments line in non-max format when missing', () => {
    const input = `[warm, smooth, groovy, jazz]

Genre: jazz
BPM: 110
Mood: warm, smooth, groovy

[INTRO] ...`;

    const output = injectInstrumentTags(input, ['soprano vocals'], false);
    expect(output).toContain('Instruments:');
    expect(output.toLowerCase()).toContain('soprano vocals');
  });
});
