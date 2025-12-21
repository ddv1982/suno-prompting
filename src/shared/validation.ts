export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    charCount: number;
}

export const EMPTY_VALIDATION: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    charCount: 0,
};

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
] as const;

export function validatePrompt(prompt: string): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        charCount: prompt.length
    };

    if (result.charCount > 1000) {
        result.isValid = false;
        result.errors.push(`Prompt exceeds 1000 characters (${result.charCount}).`);
    }

    const lowerPrompt = prompt.toLowerCase();

    for (const [tag1, tag2] of CONTRADICTORY_PAIRS) {
        if (lowerPrompt.includes(tag1) && lowerPrompt.includes(tag2)) {
            result.warnings.push(`Detected contradictory tags: "${tag1}" and "${tag2}".`);
        }
    }

    return result;
}
