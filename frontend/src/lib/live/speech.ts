export interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly 0: {
    transcript: string;
    confidence: number;
  };
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorLike {
  readonly error: string;
}

export interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechConstructor = new () => SpeechRecognitionLike;

function speechConstructor(): SpeechConstructor | null {
  if (typeof window === 'undefined') return null;

  const candidate = window as unknown as {
    SpeechRecognition?: SpeechConstructor;
    webkitSpeechRecognition?: SpeechConstructor;
  };

  return candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition ?? null;
}

export function speechRecognitionAvailable() {
  return speechConstructor() !== null;
}

export function createSpeechRecognition(): SpeechRecognitionLike | null {
  const Constructor = speechConstructor();
  return Constructor ? new Constructor() : null;
}
