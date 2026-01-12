/**
 * Creative Boost Conversion Helpers
 *
 * Max/non-max mode conversion utilities.
 *
 * @module ai/creative-boost/helpers/conversion
 */

import { convertToMaxFormat, convertToNonMaxFormat } from '@bun/prompt/conversion';

import type { ConversionOptions, DebugInfo } from '@shared/types';
import type { LanguageModel } from 'ai';

/**
 * Applies max or non-max mode conversion to style output.
 */
export async function applyMaxModeConversion(
  style: string,
  maxMode: boolean,
  getModel: () => LanguageModel,
  options: ConversionOptions = {}
): Promise<{ styleResult: string; debugInfo?: DebugInfo['maxConversion'] }> {
  if (maxMode) {
    const result = await convertToMaxFormat(style, getModel, options);
    return { styleResult: result.convertedPrompt, debugInfo: result.debugInfo };
  } else {
    const result = await convertToNonMaxFormat(style, getModel, options);
    return { styleResult: result.convertedPrompt, debugInfo: result.debugInfo };
  }
}
