/**
 * Base error class for all application errors.
 * Provides consistent error structure with code and cause properties.
 */
export class AppError extends Error {
  public readonly code: string;

  constructor(message: string, code: string, cause?: Error) {
    super(message, { cause });
    this.name = 'AppError';
    this.code = code;
  }
}

/**
 * Error thrown when input validation fails.
 * Includes optional field name for form error display.
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field?: string,
    cause?: Error
  ) {
    super(message, 'VALIDATION_ERROR', cause);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when AI generation fails.
 * Used for LLM API failures, empty responses, parsing errors, etc.
 */
export class AIGenerationError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, 'AI_GENERATION_ERROR', cause);
    this.name = 'AIGenerationError';
  }
}

/**
 * Error thrown when storage operations fail.
 * Includes the specific operation that failed for debugging.
 */
export class StorageError extends AppError {
  constructor(
    message: string,
    public readonly operation: 'read' | 'write' | 'decrypt' | 'encrypt',
    cause?: Error
  ) {
    super(message, 'STORAGE_ERROR', cause);
    this.name = 'StorageError';
  }
}

/**
 * Error thrown when an invariant is violated.
 * Used for impossible states that indicate a bug in the code.
 *
 * @example
 * if (items.length === 0) {
 *   throw new InvariantError('selectRandom called with empty array');
 * }
 */
export class InvariantError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, 'INVARIANT_VIOLATION', cause);
    this.name = 'InvariantError';
  }
}

/**
 * Error thrown when Ollama server is not reachable.
 * Indicates that Ollama needs to be started.
 */
export class OllamaUnavailableError extends AppError {
  constructor(endpoint: string, cause?: Error) {
    super(
      `Ollama server not reachable at ${endpoint}. Please ensure Ollama is running.`,
      'OLLAMA_UNAVAILABLE',
      cause
    );
    this.name = 'OllamaUnavailableError';
  }
}

/**
 * Error thrown when the required Gemma model is not installed.
 * Includes installation instructions for the user.
 */
export class OllamaModelMissingError extends AppError {
  constructor(model = 'gemma3:4b') {
    super(
      `Model ${model} not found. Run 'ollama pull ${model}' to install it.`,
      'OLLAMA_MODEL_MISSING'
    );
    this.name = 'OllamaModelMissingError';
  }
}

/**
 * Error thrown when Ollama generation times out.
 * Used when local generation exceeds the configured timeout.
 */
export class OllamaTimeoutError extends AppError {
  constructor(timeoutMs: number, cause?: Error) {
    super(
      `Ollama generation timed out after ${timeoutMs / 1000} seconds.`,
      'OLLAMA_TIMEOUT',
      cause
    );
    this.name = 'OllamaTimeoutError';
  }
}

/**
 * Error thrown when Ollama endpoint URL is not localhost.
 * Prevents SSRF attacks by restricting to localhost only.
 */
export class InvalidOllamaEndpointError extends ValidationError {
  constructor(message = 'Ollama endpoint must be localhost only.') {
    super(message, 'endpoint');
    this.name = 'InvalidOllamaEndpointError';
  }
}

/**
 * Checks if a hostname is a valid localhost address.
 * Includes IPv4, IPv6, and common IPv6 representations to prevent SSRF bypasses.
 *
 * @param hostname - The hostname to check
 * @returns true if hostname is localhost
 */
function isValidLocalhostHostname(hostname: string): boolean {
  const isLocalhost =
    // IPv4 localhost
    hostname === '127.0.0.1' ||
    hostname === 'localhost' ||
    // IPv6 localhost variations
    hostname === '::1' ||
    hostname === '[::1]' ||
    // IPv4-mapped IPv6 addresses (common bypass technique)
    hostname === '::ffff:127.0.0.1' ||
    hostname === '0:0:0:0:ffff:127.0.0.1' ||
    hostname === '0:0:0:0:ffff:7f00:1' ||
    // Bracket-wrapped IPv6 variations
    hostname === '[::ffff:127.0.0.1]' ||
    hostname === '[0:0:0:0:ffff:127.0.0.1]' ||
    hostname === '[0:0:0:0:ffff:7f00:1]' ||
    // IPv4-mapped IPv6 in hex
    hostname === '::ffff:7f00:1';

  return isLocalhost;
}

/**
 * Validates that an Ollama endpoint is localhost only.
 * Prevents SSRF attacks by restricting to localhost only.
 *
 * Security measures:
 * - Whitelists specific localhost addresses (IPv4 and IPv6)
 * - Validates protocol is http or https only
 * - Prevents DNS rebinding by strict hostname checking
 * - Blocks common IPv6 bypass techniques
 *
 * @param endpoint - The endpoint URL to validate
 * @throws InvalidOllamaEndpointError if endpoint is not localhost or invalid
 * @returns void if endpoint is valid
 */
export function validateOllamaEndpoint(endpoint: string): void {
  try {
    const url = new URL(endpoint);
    const hostname = url.hostname.toLowerCase();

    // Validate protocol - only allow http to prevent protocol confusion attacks
    const allowedProtocols = ['http:'];
    if (!allowedProtocols.includes(url.protocol)) {
      throw new InvalidOllamaEndpointError(
        `Invalid protocol: ${url.protocol}. Only http is allowed.`
      );
    }

    // Validate hostname is localhost
    if (!isValidLocalhostHostname(hostname)) {
      throw new InvalidOllamaEndpointError();
    }

    // Validate port range (non-privileged ports only: 1024-65535)
    // Note: URL parser returns empty string for default ports (80 for http, 443 for https)
    const defaultPort = url.protocol === 'https:' ? 443 : 80;
    const port = url.port ? parseInt(url.port, 10) : defaultPort;
    if (Number.isNaN(port) || port < 1024 || port > 65535) {
      throw new ValidationError(
        `Port must be between 1024 and 65535. Received: ${port}`,
        'endpoint'
      );
    }
  } catch (error) {
    if (error instanceof InvalidOllamaEndpointError || error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid Ollama endpoint format.', 'endpoint');
  }
}

/**
 * Extracts error message from unknown error type.
 * Use this instead of repeating `error instanceof Error ? error.message : fallback` pattern.
 */
export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}
