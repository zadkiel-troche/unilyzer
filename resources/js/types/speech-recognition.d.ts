/**
 * Web Speech API: TypeScript todavía no incluye SpeechRecognition en lib.dom.
 * Solo se declara lo que usa la app.
 */
interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
}

interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    onstart: ((ev: Event) => void) | null;
    onend: ((ev: Event) => void) | null;
    onresult: ((ev: SpeechRecognitionEvent) => void) | null;
    onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
}

interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
}
