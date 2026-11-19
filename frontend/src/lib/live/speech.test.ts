import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  speechRecognitionAvailable,
  createSpeechRecognition,
  type SpeechRecognitionLike,
} from './speech';

class FakeRecognition implements SpeechRecognitionLike {
  continuous = false;
  interimResults = false;
  lang = '';
  maxAlternatives = 0;
  onresult: SpeechRecognitionLike['onresult'] = null;
  onerror: SpeechRecognitionLike['onerror'] = null;
  onend: SpeechRecognitionLike['onend'] = null;
  start() {}
  stop() {}
  abort() {}
}

describe('speech recognition helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports unavailability when neither constructor exists', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);

    expect(speechRecognitionAvailable()).toBe(false);
    expect(createSpeechRecognition()).toBeNull();
  });

  it('uses the standard constructor when available', () => {
    vi.stubGlobal('SpeechRecognition', FakeRecognition);
    vi.stubGlobal('webkitSpeechRecognition', undefined);

    expect(speechRecognitionAvailable()).toBe(true);
    expect(createSpeechRecognition()).toBeInstanceOf(FakeRecognition);
  });

  it('falls back to the webkit constructor', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);

    expect(speechRecognitionAvailable()).toBe(true);
    expect(createSpeechRecognition()).toBeInstanceOf(FakeRecognition);
  });
});
