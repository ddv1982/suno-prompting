import { APP_CONSTANTS } from './constants';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    charCount: number;
}

export interface LockedPhraseValidation {
    isValid: boolean;
    error: string | null;
}

export const EMPTY_VALIDATION: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    charCount: 0,
};

export function validateLockedPhrase(phrase: string): LockedPhraseValidation {
    if (!phrase) return { isValid: true, error: null };
    
    if (phrase.length > APP_CONSTANTS.MAX_LOCKED_PHRASE_CHARS) {
        return {
            isValid: false,
            error: `Locked phrase exceeds ${APP_CONSTANTS.MAX_LOCKED_PHRASE_CHARS} characters (${phrase.length}).`
        };
    }
    
    if (phrase.includes('{{') || phrase.includes('}}')) {
        return {
            isValid: false,
            error: 'Locked phrase cannot contain {{ or }} characters.'
        };
    }
    
    return { isValid: true, error: null };
}

const CONTRADICTORY_PAIRS = [
    ['lo-fi', 'ultra-clean'],
    ['lo-fi', 'high fidelity'],
    ['lo-fi', 'pristine'],
    ['lo-fi', 'studio quality'],
    ['acoustic', 'synth'],
    ['acoustic', 'electronic'],
    ['acoustic', 'synthesizer'],
    ['dry', 'reverb'],
    ['dry', 'reverberant'],
    ['minimal', 'maximal'],
    ['minimal', 'complex'],
    ['analog', 'digital'],
    ['monophonic', 'polyphonic'],
] as const satisfies ReadonlyArray<readonly [string, string]>;

export function validatePrompt(prompt: string): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        charCount: prompt.length
    };

    if (result.charCount > APP_CONSTANTS.MAX_PROMPT_CHARS) {
        result.isValid = false;
        result.errors.push(`Prompt exceeds ${APP_CONSTANTS.MAX_PROMPT_CHARS} characters (${result.charCount}).`);
    }

    const lowerPrompt = prompt.toLowerCase();

    for (const [tag1, tag2] of CONTRADICTORY_PAIRS) {
        if (lowerPrompt.includes(tag1) && lowerPrompt.includes(tag2)) {
            result.warnings.push(`Detected contradictory tags: "${tag1}" and "${tag2}".`);
        }
    }

    return result;
}
