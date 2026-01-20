// Refinement types - for auto-detecting refinement type in Full Prompt Mode
// StyleChanges is inferred from Zod schema (single source of truth)

import type { StyleChangesInput } from '@shared/schemas/generation';

/**
 * Refinement type enum for auto-detection.
 * - 'none': No changes detected, button should be disabled (frontend-only, not sent to API)
 * - 'style': Only style fields changed (no feedback text)
 * - 'lyrics': Only feedback text provided (requires lyrics mode ON)
 * - 'combined': Both style changes AND feedback text present
 */
export type RefinementType = 'none' | 'style' | 'lyrics' | 'combined';

/**
 * Style changes detected between original and current selection.
 * Used to pass changed style fields to the refinement handler.
 * 
 * Type is inferred from StyleChangesSchema in @shared/schemas/generation.ts
 * to ensure Zod schema is the single source of truth.
 */
export type StyleChanges = StyleChangesInput;

/**
 * Refinement context for auto-detected refinement.
 * Passed from frontend to backend to route the refinement.
 */
export interface RefinementContext {
  /** The detected refinement type */
  type: RefinementType;
  /** Style changes to apply (only present for 'style' or 'combined' types) */
  styleChanges?: StyleChanges;
  /** Feedback text for lyrics refinement (only present for 'lyrics' or 'combined' types) */
  feedbackText?: string;
}

/**
 * Original advanced selection values captured when a prompt is generated.
 * Used to detect what fields have changed for style refinement.
 */
export interface OriginalAdvancedSelection {
  /** Original seed genres selected at generation time */
  seedGenres: string[];
  /** Original Suno V5 style keys selected at generation time */
  sunoStyles: string[];
  /** Original BPM value at generation time */
  bpm?: number;
  /** Original instruments at generation time */
  instruments?: string[];
  /** Original mood categories at generation time */
  mood?: string[];
  /** Original harmonic style at generation time */
  harmonicStyle?: string | null;
  /** Original harmonic combination at generation time */
  harmonicCombination?: string | null;
  /** Original polyrhythm combination at generation time */
  polyrhythmCombination?: string | null;
  /** Original time signature at generation time */
  timeSignature?: string | null;
  /** Original time signature journey at generation time */
  timeSignatureJourney?: string | null;
  /** Original mood category at generation time */
  moodCategory?: string | null;
}
