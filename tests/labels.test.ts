import { describe, test, expect } from 'bun:test';
import { getConciseLabel } from '../src/shared/labels';

describe('getConciseLabel', () => {
    describe('genre category', () => {
        test('returns label for valid genre key', () => {
            expect(getConciseLabel('genre', 'jazz')).toBe('Jazz');
            expect(getConciseLabel('genre', 'ambient')).toBe('Ambient');
            expect(getConciseLabel('genre', 'lofi')).toBe('Lo-Fi');
            expect(getConciseLabel('genre', 'rnb')).toBe('R&B');
        });

        test('returns key as fallback for unknown genre', () => {
            expect(getConciseLabel('genre', 'unknown')).toBe('unknown');
        });
    });

    describe('genreCombination category', () => {
        test('returns label for valid genre combination', () => {
            expect(getConciseLabel('genreCombination', 'jazz fusion')).toBe('Jazz Fusion');
            expect(getConciseLabel('genreCombination', 'progressive rock')).toBe('Progressive Rock');
            expect(getConciseLabel('genreCombination', 'lo-fi hip hop')).toBe('Lo-Fi Hip Hop');
        });

        test('returns key as fallback for unknown combination', () => {
            expect(getConciseLabel('genreCombination', 'unknown combo')).toBe('unknown combo');
        });
    });

    describe('existing categories', () => {
        test('returns label for harmonic category', () => {
            expect(getConciseLabel('harmonic', 'lydian')).toBe('Lydian #11');
            expect(getConciseLabel('harmonic', 'dorian')).toBe('Dorian');
        });

        test('returns label for combination category', () => {
            expect(getConciseLabel('combination', 'major_minor')).toBe('Major↔Minor bittersweet');
        });

        test('returns label for polyrhythm category', () => {
            expect(getConciseLabel('polyrhythm', 'hemiola')).toBe('2:3 swing');
        });

        test('returns label for time category', () => {
            expect(getConciseLabel('time', 'time_7_8')).toBe('7/8 (2+2+3)');
        });

        test('returns label for journey category', () => {
            expect(getConciseLabel('journey', 'prog_odyssey')).toBe('4/4→7/8→5/4 prog');
        });
    });
});
