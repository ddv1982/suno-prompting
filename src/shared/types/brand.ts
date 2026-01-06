/**
 * Branded types for compile-time ID safety.
 * Prevents accidentally mixing up different ID types.
 */

declare const brand: unique symbol;

/**
 * Creates a branded type that is structurally incompatible with other brands.
 * @example
 * type UserId = Brand<string, 'UserId'>;
 * type PostId = Brand<string, 'PostId'>;
 * 
 * function getUser(id: UserId) { ... }
 * const postId: PostId = createPostId();
 * getUser(postId); // Type error!
 */
export type Brand<T, B extends string> = T & { readonly [brand]: B };

// Session ID - uniquely identifies a prompt session
export type SessionId = Brand<string, 'SessionId'>;

// Version ID - uniquely identifies a prompt version within a session
export type VersionId = Brand<string, 'VersionId'>;

/**
 * Creates a new SessionId using Bun's UUID v7 generator.
 * UUID v7 is time-ordered, making it suitable for session sorting.
 */
export function createSessionId(): SessionId {
  return Bun.randomUUIDv7() as SessionId;
}

/**
 * Creates a new VersionId using Bun's UUID v7 generator.
 */
export function createVersionId(): VersionId {
  return Bun.randomUUIDv7() as VersionId;
}

/**
 * Type guard to check if a string is a valid SessionId format.
 * Note: This only checks format, not if the ID exists.
 */
export function isSessionId(value: unknown): value is SessionId {
  return typeof value === 'string' && value.length === 36;
}

/**
 * Type guard to check if a string is a valid VersionId format.
 */
export function isVersionId(value: unknown): value is VersionId {
  return typeof value === 'string' && value.length === 36;
}

/**
 * Converts a plain string to SessionId.
 * Use when reading from storage/external source where brand is lost.
 */
export function toSessionId(value: string): SessionId {
  return value as SessionId;
}

/**
 * Converts a plain string to VersionId.
 * Use when reading from storage/external source where brand is lost.
 */
export function toVersionId(value: string): VersionId {
  return value as VersionId;
}
