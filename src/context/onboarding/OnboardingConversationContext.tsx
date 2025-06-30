import { createContext, useMemo } from "react";
import { useConversationState } from "../../hooks/state/useConversationState";
import type { ConversationInput, ConversationResponse, IConversationEntry } from "../../types/types";

export interface IOnboardingConversationContext {
    textInput: string
    inputMode: ConversationInput
    responseMode: ConversationResponse
    conversation: IConversationEntry[]
    conversationRef: React.RefObject<IConversationEntry[]>
    updateConversation: (conversation: IConversationEntry[]) => void
    updateInputMode: (inputMode: ConversationInput) => void
    updateResponseMode: (responseMode: ConversationResponse) => void
    updateTextInput: (textInput: string) => void
}

export const OnboardingConversationContext = createContext<IOnboardingConversationContext>({} as IOnboardingConversationContext);

interface Props {
    children: React.ReactNode;
}

export const OnboardingConversationProvider = ({ children }: Props) => {
    const {
        inputMode,
        responseMode,
        conversation,
        conversationRef,
        updateConversation,
        updateInputMode,
        updateResponseMode,
        updateTextInput,
        textInput
    } = useConversationState()

    return (
        <OnboardingConversationContext.Provider
            value={useMemo(
                () => ({
                    textInput,
                    inputMode,
                    responseMode,
                    conversation,
                    conversationRef,
                    updateConversation,
                    updateInputMode,
                    updateResponseMode,
                    updateTextInput,
                }),
                [inputMode, responseMode,
                    conversation,
                    conversationRef,
                    updateConversation,
                    updateInputMode,
                    updateResponseMode,
                    updateTextInput, textInput]
            )}
        >
            {children}
        </OnboardingConversationContext.Provider>
    );
};
