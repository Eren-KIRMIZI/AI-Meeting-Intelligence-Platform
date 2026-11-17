import { useCallback, useEffect, useRef, useState } from 'react';

interface LocalRecording {
  url: string;
  filename: string;
}

/**
 * Records the local camera/microphone track with MediaRecorder. It is a
 * browser-local recording: nothing is uploaded, which keeps demo mode honest
 * about where the file lives.
 */
export function useLocalRecording(stream: MediaStream | null) {
  const supported =
    typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined';

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [clip, setClip] = useState<LocalRecording | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const clipRef = useRef<LocalRecording | null>(null);

  useEffect(() => {
    clipRef.current = clip;
  }, [clip]);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null;
        recorder.stop();
      }
      if (clipRef.current) {
        URL.revokeObjectURL(clipRef.current.url);
      }
    };
  }, []);

  const start = useCallback(() => {
    if (!supported) {
      setError('This browser cannot record locally.');
      return;
    }
    if (!stream) {
      setError('Join the room before starting a recording.');
      return;
    }

    try {
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type });
        const previous = clipRef.current;
        if (previous) URL.revokeObjectURL(previous.url);
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        setClip({
          url: URL.createObjectURL(blob),
          filename: `nova-live-${stamp}.webm`,
        });
        setRecording(false);
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      setSeconds(0);
      setError(null);
      setRecording(true);
    } catch {
      setError('Recording could not start on this device.');
    }
  }, [stream, supported]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      setRecording(false);
      return;
    }
    recorder.stop();
    recorderRef.current = null;
  }, []);

  const clearClip = useCallback(() => {
    setClip((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }, []);

  return { supported, recording, seconds, error, clip, start, stop, clearClip };
}
