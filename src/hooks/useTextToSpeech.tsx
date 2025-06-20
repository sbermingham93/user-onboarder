import { useMemo, useRef, useState, useCallback, useEffect } from "react"

// class useful for reading text
interface ITextToSpeech {
    speak: (
        text: string,
        options?: {
            rate?: number,
            pitch?: number,
            voice?: SpeechSynthesisVoice
        }
    ) => Promise<string>
    cancel: () => void
    getVoices: () => SpeechSynthesisVoice[]
}

class TextToSpeech implements ITextToSpeech {
    enabled: boolean
    speechSynthesis: SpeechSynthesis
    isSpeaking: boolean

    onSpeakingUpdate: Function
    onError: Function
    onEnabledUpdate: Function

    constructor(
        onSpeakingUpdate: (speaking: boolean) => void,
        onError: (error: string) => void,
        onEnabledUpdate: (enabled: boolean) => void
    ) {
        const enabled = 'speechSynthesis' in window
        this.enabled = enabled
        onEnabledUpdate(enabled)

        this.speechSynthesis = window.speechSynthesis
        this.isSpeaking = false

        this.onSpeakingUpdate = onSpeakingUpdate
        this.onError = onError
        this.onEnabledUpdate = onEnabledUpdate
    }

    speak = (
        text: string,
        options: {
            rate?: number,
            pitch?: number,
            voice?: SpeechSynthesisVoice
        } = {}
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!this.enabled || !this.speechSynthesis) {
                const error = 'Speech synthesis not supported'
                this.onError(error)
                reject(new Error(error))
                this.updateIsSpeaking(false)
                this.onEnabledUpdate(false)
                return;
            }

            if (!text.trim()) {
                const error = 'No text provided to speak'
                this.onError(error)
                reject(new Error(error))
                return
            }

            // Cancel any ongoing speech before starting new one
            this.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);

            // Set options with defaults
            utterance.rate = options.rate ?? 1;
            utterance.pitch = options.pitch ?? 1;
            if (options.voice) {
                utterance.voice = options.voice;
            }

            utterance.onstart = () => {
                this.updateIsSpeaking(true)
            }

            utterance.onend = () => {
                this.updateIsSpeaking(false)
                resolve(text);
            }

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event.error)
                const errorMessage = `Speech synthesis failed: ${event.error}`
                this.onError(errorMessage)
                this.updateIsSpeaking(false)
                reject(new Error(errorMessage));
            };

            // Handle cases where speech might be interrupted
            utterance.onpause = () => {
                console.log('Speech paused')
            }

            utterance.onresume = () => {
                console.log('Speech resumed')
            }

            this.speechSynthesis.speak(utterance);
        });
    }

    cancel = () => {
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
            this.updateIsSpeaking(false)
        }
    }

    getVoices = (): SpeechSynthesisVoice[] => {
        if (!this.enabled || !this.speechSynthesis) {
            return [];
        }
        return this.speechSynthesis.getVoices();
    }

    private updateIsSpeaking(speaking: boolean) {
        this.isSpeaking = speaking
        this.onSpeakingUpdate(speaking)
    }
}

interface TTSOptions {
    rate?: number;
    pitch?: number;
    voice?: SpeechSynthesisVoice;
}

export const useTextToSpeech = () => {
    const [isEnabled, setIsEnabled] = useState<boolean>(false)
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

    // Use lazy initialization to prevent recreation on every render
    const textToSpeechRef = useRef<TextToSpeech | null>(null)

    // Load voices when component mounts or voices change
    const loadVoices = useCallback(() => {
        if (textToSpeechRef.current) {
            const availableVoices = textToSpeechRef.current.getVoices()
            setVoices(availableVoices)
        }
    }, [])

    // Handle voices loading (they might load asynchronously)
    const handleVoicesChanged = useCallback(() => {
        loadVoices()
    }, [loadVoices])

    useEffect(() => {
        // Initialize the TextToSpeech instance only once
        if (!textToSpeechRef.current) {
            const tts =  new TextToSpeech(
                (speaking: boolean) => setIsSpeaking(speaking),
                (error: string) => setError(error),
                (enabled: boolean) => setIsEnabled(enabled)
            )
            textToSpeechRef.current = tts

             // Set up voice loading
            if (textToSpeechRef.current?.enabled) {
                // Load voices immediately if available
                loadVoices()
                
                // Also listen for the voiceschanged event in case voices load asynchronously
                if (window.speechSynthesis) {
                    window.speechSynthesis.onvoiceschanged = handleVoicesChanged
                }
            }
        }
    }, [])

    const speak = useCallback(async (text: string, options?: TTSOptions): Promise<string> => {
        if (!textToSpeechRef.current) {
            throw new Error('TextToSpeech not initialized')
        }
        setError('') // Clear previous errors
        return textToSpeechRef.current.speak(text, options)
    }, [])

    const cancel = useCallback(() => {
        textToSpeechRef.current?.cancel()
    }, [])

    const clearError = useCallback(() => {
        setError('')
    }, [])

    return useMemo(() => {
        return {
            isEnabled: isEnabled != null ? isEnabled: false,
            speak,
            cancel,
            isSpeaking,
            error,
            voices,
            clearError,
            loadVoices
        }
    }, [isEnabled, isSpeaking, error, voices, speak, cancel, clearError, loadVoices])
}