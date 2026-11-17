import { describe, expect, it } from 'vitest';
import {
  baseMimeType,
  formatBytes,
  formatRecordingLength,
  isVideoRecording,
  recordingExtension,
} from './recordings';

describe('baseMimeType', () => {
  it('strips codec parameters and lowercases the type', () => {
    expect(baseMimeType('Video/WebM;codecs=vp9,opus')).toBe('video/webm');
    expect(baseMimeType('audio/webm')).toBe('audio/webm');
  });

  it('falls back when the type is empty', () => {
    expect(baseMimeType('')).toBe('video/webm');
  });
});

describe('recordingExtension', () => {
  it('maps common recorder mime types to file extensions', () => {
    expect(recordingExtension('video/webm')).toBe('webm');
    expect(recordingExtension('audio/webm')).toBe('webm');
    expect(recordingExtension('video/mp4')).toBe('mp4');
    expect(recordingExtension('audio/mp4')).toBe('m4a');
    expect(recordingExtension('audio/mpeg')).toBe('mp3');
    expect(recordingExtension('audio/ogg')).toBe('ogg');
  });

  it('ignores codec parameters and casing', () => {
    expect(recordingExtension('Video/WebM;codecs=vp9,opus')).toBe('webm');
  });

  it('falls back to webm for unknown types', () => {
    expect(recordingExtension('application/octet-stream')).toBe('webm');
    expect(recordingExtension('')).toBe('webm');
  });
});

describe('isVideoRecording', () => {
  it('detects video containers only', () => {
    expect(isVideoRecording('video/webm')).toBe(true);
    expect(isVideoRecording('VIDEO/MP4')).toBe(true);
    expect(isVideoRecording('audio/webm')).toBe(false);
  });
});

describe('formatBytes', () => {
  it('keeps small files in bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
  });

  it('scales to KB, MB and GB', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(42_000_000)).toBe('40.1 MB');
    expect(formatBytes(1024 ** 3)).toBe('1 GB');
  });

  it('never shows negative sizes', () => {
    expect(formatBytes(-10)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
  });
});

describe('formatRecordingLength', () => {
  it('formats minutes and seconds', () => {
    expect(formatRecordingLength(0)).toBe('00:00');
    expect(formatRecordingLength(75)).toBe('01:15');
  });

  it('adds an hours segment when needed', () => {
    expect(formatRecordingLength(3725)).toBe('1:02:05');
  });

  it('clamps invalid durations', () => {
    expect(formatRecordingLength(-5)).toBe('00:00');
  });
});
