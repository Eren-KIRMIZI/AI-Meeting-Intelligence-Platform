import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createSpeechRecognition,
  speechRecognitionAvailable,
  type SpeechRecognitionLike,
} from '@/lib/live/speech';
import type { TranscriptSegment } from '@/types';

const errorMessages: Record<string, string> = {
  'not-allowed':
    'Microphone access is blocked. Allow it in the browser, or use the demo dialogue instead.',
  'service-not-allowed':
    'The browser blocked its speech service. Use the demo dialogue to test the transcript.',
  'audio-capture':
    'No microphone was found. Use the demo dialogue to test the transcript.',
  network:
    'The browser speech service is unreachable right now. The demo dialogue still works.',
  language:
    'This browser does not support the current caption language.',
};

interface UseLiveCaptionsOptions {
  active: boolean;
  speakerId: string;
  speaker: string;
  /** Epoch milliseconds when the room started; used for segment offsets. */
  startedAtMs: number | null;
  onSegment: (segment: TranscriptSegment) => void;
}

/**
 * Wraps the Web Speech API in a controlled hook. Browsers end recognition on
 * their own after a pause, so the hook restarts it while captions stay enabled
 * and stops permanently on permission errors.
 */
export function useLiveCaptions({
  active,
  speakerId,
  speaker,
  startedAtMs,
  onSegment,
}: UseLiveCaptionsOptions) {
  const supported = useMemo(() => speechRecognitionAvailable(), []);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const restartRef = useRef<number | null>(null);
  const blockedRef = useRef(false);
  const metaRef = useRef({ speakerId, speaker, startedAtMs, active });
  const segmentRef = useRef(onSegment);

  useEffect(() => {
    metaRef.current = { speakerId, speaker, startedAtMs, active };
  }, [speakerId, speaker, startedAtMs, active]);

  useEffect(() => {
    segmentRef.current = onSegment;
  }, [onSegment]);

  useEffect(() => {
    if (!supported) return;

    if (!active) {
      const current = recognitionRef.current;
      recognitionRef.current = null;
      if (current) {
        current.onresult = null;
        current.onerror = null;
        current.onend = null;
        try {
          current.abort();
        } catch {
          // Recognition was already stopped.
        }
      }
      setListening(false);
      setInterim('');
      return;
    }

    let cancelled = false;

    const start = () => {
      if (cancelled || !metaRef.current.active) return;

      const recognition = createSpeechRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = navigator.language || 'en-US';

      recognition.onresult = (event) => {
        let pending = '';

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const alternative = result[0];
          if (!alternative) continue;

          if (!result.isFinal) {
            pending += ` ${alternative.transcript}`;
            continue;
          }

          const text = alternative.transcript.trim();
          if (!text) continue;

          const started = metaRef.current.startedAtMs ?? Date.now();
          segmentRef.current({
            id: `seg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            speakerId: metaRef.current.speakerId,
            speaker: metaRef.current.speaker,
            text,
            at: Math.max(0, (Date.now() - started) / 1000),
            createdAt: new Date().toISOString(),
            source: 'speech',
            confidence: alternative.confidence,
          });
        }

        setInterim(pending.trim());
      };

      recognition.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'aborted') return;

        setError(
          errorMessages[event.error] ??
            'Live captions stopped unexpectedly. You can restart them any time.'
        );

        if (
          event.error === 'not-allowed' ||
          event.error === 'service-not-allowed' ||
          event.error === 'audio-capture'
        ) {
          blockedRef.current = true;
        }
      };

      recognition.onend = () => {
        setListening(false);
        setInterim('');
        if (cancelled || !metaRef.current.active || blockedRef.current) return;
        restartRef.current = window.setTimeout(start, 500);
      };

      try {
        blockedRef.current = false;
        recognition.start();
        setListening(true);
        setError(null);
      } catch {
        setError('Live captions could not start. Try again in a moment.');
      }
    };

    start();

    return () => {
      cancelled = true;
      if (restartRef.current !== null) {
        window.clearTimeout(restartRef.current);
        restartRef.current = null;
      }

      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try {
          recognition.abort();
        } catch {
          // Recognition was already stopped.
        }
      }

      setListening(false);
      setInterim('');
    };
  }, [active, supported]);

  return { supported, listening, interim, error, setError };
}
