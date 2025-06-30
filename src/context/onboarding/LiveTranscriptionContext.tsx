import { createContext, useMemo } from "react";
import { useLiveTranscription } from "../../hooks/useLiveTranscription";

export interface ILiveTranscriptionContext {
  interimTranscript: string;
  finalTranscript: string;
  error: any;
  isListening: boolean
  isSupported: boolean
  clearTranscript: Function
  startListening: Function
  stopListening: Function
}

export const LiveTranscriptionContext = createContext<ILiveTranscriptionContext>({} as ILiveTranscriptionContext);

interface Props {
  children: React.ReactNode;
}

export const LiveTranscriptionProvider = ({ children }: Props) => {
  const {
    interimTranscript,
    finalTranscript,
    error,
    isListening,
    isSupported,
    clearTranscript,
    startListening,
    stopListening,
  } = useLiveTranscription()

  return (
    <LiveTranscriptionContext.Provider
      value={useMemo(
        () => ({
          interimTranscript,
          finalTranscript,
          error,
          isListening,
          isSupported,
          clearTranscript,
          startListening,
          stopListening
        }),
        [interimTranscript,
          finalTranscript,
          error,
          isListening,
          isSupported,
          clearTranscript,
          startListening,
          stopListening]
      )}
    >
      {children}
    </LiveTranscriptionContext.Provider>
  );
};
