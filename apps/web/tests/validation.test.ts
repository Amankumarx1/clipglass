import { describe, it, expect } from 'vitest';
import { isValidYouTubeUrl, extractYouTubeId } from '../lib/validation';

describe('Frontend URL Validation', () => {
  it('correctly accepts standard YouTube video URLs', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    expect(isValidYouTubeUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });

  it('correctly accepts YouTube Shorts and Music URLs', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(true);
    expect(isValidYouTubeUrl('https://music.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });

  it('rejects non-YouTube or malicious URLs', () => {
    expect(isValidYouTubeUrl('https://evil.com/fake')).toBe(false);
    expect(isValidYouTubeUrl('http://169.254.169.254')).toBe(false);
    expect(isValidYouTubeUrl('https://vimeo.com/12345')).toBe(false);
    expect(isValidYouTubeUrl('')).toBe(false);
  });

  it('extracts correct video ID', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('dQw4w9WgXcQ');
  });
});

