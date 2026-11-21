import { describe, it, expect } from 'vitest';
import { formatDuration, formatBytes, sanitizeClientFilename } from '../lib/formatUtils';

describe('Format Utilities', () => {
  it('formats durations properly', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(45)).toBe('0:45');
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(3665)).toBe('1:01:05');
  });

  it('formats byte sizes cleanly', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(1024 * 1024 * 350)).toBe('350.0 MB');
    expect(formatBytes(1024 * 1024 * 1024 * 1.5)).toBe('1.5 GB');
  });

  it('sanitizes illegal filename characters', () => {
    expect(sanitizeClientFilename('Video: Ep. 1 / *Special*?')).toBe('Video Ep. 1  Special');
  });
});

