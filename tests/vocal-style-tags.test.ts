import { describe, expect, test } from 'bun:test';

import { parseVocalStyleDescriptorToTags } from '@bun/prompt/vocal-style-tags';

describe('parseVocalStyleDescriptorToTags', () => {
  test('parses range, delivery, and technique into deterministic tags', () => {
    expect(parseVocalStyleDescriptorToTags('Soprano, Soft Delivery, Shouted Hooks')).toEqual([
      'soprano vocals',
      'soft vocals',
      'shouted hooks',
    ]);
  });

  test('accepts an explicit "Vocal style:" prefix', () => {
    expect(parseVocalStyleDescriptorToTags('Vocal style: Alto, Breathy Delivery, Shouted Hooks')).toEqual([
      'alto vocals',
      'breathy vocals',
      'shouted hooks',
    ]);
  });

  test('drops unknown range and delivery values', () => {
    expect(parseVocalStyleDescriptorToTags('Contralto, Spooky Delivery, Shouted Hooks')).toEqual(['shouted hooks']);
  });
});
