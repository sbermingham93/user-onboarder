import { createContext, useMemo } from "react";
import { useTextToSpeech, type TTSOptions } from "../../hooks/useTextToSpeech";

export interface ITextToSpeechContext {
    isEnabled: boolean
    speak: (text: string, options?: TTSOptions) => Promise<string>
    cancel: () => void
    isSpeaking: boolean
    error: string
    voices: SpeechSynthesisVoice[]
    clearError: () => void
    loadVoices: () => void
}

export const TextToSpeechContext = createContext<ITextToSpeechContext>({} as ITextToSpeechContext);

interface Props {
    children: React.ReactNode;
}

export const TextToSpeechProvider = ({ children }: Props) => {
    const {
        isEnabled,
        speak,
        cancel,
        isSpeaking,
        error,
        voices,
        clearError,
        loadVoices
    } = useTextToSpeech()

    return (
        <TextToSpeechContext.Provider
            value={useMemo(
                () => ({
                    isEnabled,
                    isSpeaking,
                    speak,
                    cancel,
                    error,
                    voices,
                    clearError,
                    loadVoices
                }),
                [isEnabled,
                    isSpeaking,
                    speak,
                    cancel,
                    error,
                    voices,
                    clearError,
                    loadVoices]
            )}
        >
            {children}
        </TextToSpeechContext.Provider>
    );
};
