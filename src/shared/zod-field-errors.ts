import type { z } from 'zod';

export function zodIssuesToFieldErrors(
  issues: readonly z.core.$ZodIssue[]
): Record<string, string[]> | undefined {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of issues) {
    const field = issue.path.map(String).join('.');
    if (!field) continue;
    fieldErrors[field] ??= [];
    fieldErrors[field].push(issue.message);
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}
