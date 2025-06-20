import { useMemo, useRef, useState, useCallback, useEffect } from "react"

interface ITranscriptionSettings {
    continuous: boolean,
    interimResults: boolean,
    lang: string
}

class LiveTranscription {
    recognition: any // SpeechRecognition
    isListening: boolean

    finalTranscript: string
    interimTranscript: string

    // pass callbacks into the constructor for the react component
    onError: Function
    onSupportedUpdate: Function
    onListeningUpdate: Function
    onTranscriptUpdate: Function

    // config
    settings: ITranscriptionSettings

    constructor(
        onError: (error: string) => void,
        onSupportedUpdate: (isSupported: boolean, message: string) => void,
        onListeningUpdate: (isListening: boolean) => void,
        onTranscriptUpdate: (interimTranscript: string, finalTranscript: string) => void,
        settings: ITranscriptionSettings = {
            continuous: true,
            interimResults: true,
            lang: "en-US"
        }
    ) {
        this.recognition = null;
        this.isListening = false;
        this.finalTranscript = '';
        this.interimTranscript = '';
        this.settings = settings

        this.onError = onError
        this.onSupportedUpdate = onSupportedUpdate
        this.onListeningUpdate = onListeningUpdate
        this.onTranscriptUpdate = onTranscriptUpdate

        this.init();
    }

    init() {
        // Check for Web Speech API support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            const message = "Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari."
            this.onError(message);
            this.onSupportedUpdate(false, message);
            return;
        }

        this.onSupportedUpdate(true, 'Web Speech API is supported! You can start transcribing.');

        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // Configure recognition settings using the settings object
        this.recognition.continuous = this.settings.continuous;
        this.recognition.interimResults = this.settings.interimResults;
        this.recognition.lang = this.settings.lang;

        // Set up event listeners
        this.setupRecognitionEvents();
    }

    setupRecognitionEvents() {
        this.recognition.onstart = () => {
            this.isListening = true;
            this.onListeningUpdate(true);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.onListeningUpdate(false);
        };

        this.recognition.onresult = (event) => {
            this.interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    this.finalTranscript += transcript + ' ';
                } else {
                    this.interimTranscript += transcript;
                }
            }

            // Fixed: Pass both interim and final transcripts
            this.onTranscriptUpdate(this.interimTranscript, this.finalTranscript);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            let errorMessage = 'An error occurred: ';

            switch (event.error) {
                case 'no-speech':
                    errorMessage += 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage += 'No microphone found. Please check your microphone.';
                    break;
                case 'not-allowed':
                    errorMessage += 'Microphone access denied. Please allow microphone access.';
                    break;
                case 'network':
                    errorMessage += 'Network error. Please check your internet connection.';
                    break;
                default:
                    errorMessage += event.error;
            }

            this.onError(errorMessage);
            this.stopListening();
        };
    }

    startListening() {
        if (!this.recognition) {
            this.onError('Speech recognition not available');
            return;
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.onError('Could not start speech recognition. Please try again.');
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    // Add method to clear transcripts
    clearTranscript() {
        this.finalTranscript = '';
        this.interimTranscript = '';
        this.onTranscriptUpdate(this.interimTranscript, this.finalTranscript);
    }
}

export const useLiveTranscription = (settings?: ITranscriptionSettings) => {
    // state variables - initialize with proper default values
    const [interimTranscript, setInterimTranscript] = useState<string>('')
    const [finalTranscript, setFinalTranscript] = useState<string>('')
    const [error, setError] = useState<string>('')
    const [isListening, setIsListening] = useState<boolean>(false)
    const [isSupported, setIsSupported] = useState<boolean>(false)

    // Use useRef with lazy initialization to prevent recreation on every render
    const liveTranscriptionRef = useRef<LiveTranscription | null>(null)

    // Initialize the LiveTranscription instance only once
    useEffect(() => {
         if (!liveTranscriptionRef.current) {
        liveTranscriptionRef.current = new LiveTranscription(
            (error: string) => {
                setError(error)
            },
            (isSupportedUpdate: boolean, message: string) => {
                setIsSupported(isSupportedUpdate)
            },
            (listening: boolean) => {
                setIsListening(listening)
            },
            (interim: string, final: string) => {
                setInterimTranscript(interim)
                setFinalTranscript(final)
            },
            settings
        )
    }
    }, [])

    // Use useCallback to prevent function recreation on every render
    const startListening = useCallback(() => {
        liveTranscriptionRef.current?.startListening()
    }, [])

    const stopListening = useCallback(() => {
        liveTranscriptionRef.current?.stopListening()
    }, [])

    const clearTranscript = useCallback(() => {
        liveTranscriptionRef.current?.clearTranscript()
        setInterimTranscript('')
        setFinalTranscript('')
    }, [])

    return useMemo(() => {
        return {
            interimTranscript: interimTranscript,
            finalTranscript: finalTranscript,
            error: error,
            isListening: isListening,
            isSupported: isSupported,
            startListening: startListening,
            stopListening: stopListening,
            clearTranscript: clearTranscript
        }
    }, [interimTranscript, finalTranscript, error, isListening, isSupported, startListening, stopListening, clearTranscript])
}