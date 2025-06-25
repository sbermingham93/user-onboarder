import { useCallback, useMemo, useRef, useState } from "react";
import { ConversationInput, ConversationResponse, type IConversationEntry } from "../../types/types";

interface IConversationState {
    conversation: IConversationEntry[]
    textInput: string
    inputMode: ConversationInput,
    responseMode: ConversationResponse
}

export const useConversationState = () => {
    
  const [state, setState] = useState<IConversationState>({
    conversation: [],
    textInput: "",
    inputMode: ConversationInput.AUDIO,
    responseMode: ConversationResponse.AI
  });
  
  const conversationRef = useRef<IConversationEntry[]>([]);

  const updateConversation = useCallback((conversation: IConversationEntry[]) => {
    conversationRef.current = conversation;
    setState(prev => ({ ...prev, conversation }));
  }, []);

  const updateTextInput = useCallback((textInput: string) => {
    setState(prev => ({ ...prev, textInput }));
  }, []);

  const updateInputMode = useCallback((inputMode: ConversationInput) => {
    setState(prev => ({ ...prev, inputMode }));
  }, []);
  const updateResponseMode = useCallback((responseMode: ConversationResponse) => {
    setState(prev => ({ ...prev, responseMode }));
  }, []);

  return useMemo(() => {
    return {
        ...state,
        conversationRef,
        updateConversation,
        updateTextInput,
        updateInputMode,
        updateResponseMode
    }
  }, [state, updateConversation, updateTextInput, updateInputMode, updateResponseMode]);
}