import { createContext, useMemo } from "react";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import type { ConversationInput, ConversationSpeaker } from "../../types/types";

export interface IOnboardingFlowContext {
    progressPercentage: number;
    handleTextReceived: (speaker: ConversationSpeaker, inputType: ConversationInput, textReceived: string) => Promise<void>
    startOnboarding: () => Promise<void>
    finishOnboarding: () => void
}

export const OnboardingFlowContext = createContext<IOnboardingFlowContext>({} as IOnboardingFlowContext);

interface Props {
    children: React.ReactNode;
}

export const OnboardingFlowProvider = ({ children }: Props) => {
    const onboardingFlow = useOnboardingFlow()

    return (
        <OnboardingFlowContext.Provider
            value={useMemo(
                () => ({
                    progressPercentage: onboardingFlow.progressPercentage,
                    handleTextReceived: onboardingFlow.handleTextReceived,
                    startOnboarding: onboardingFlow.startOnboarding,
                    finishOnboarding: onboardingFlow.finishOnboarding
                }),
                [onboardingFlow.progressPercentage, onboardingFlow.handleTextReceived, onboardingFlow.startOnboarding, onboardingFlow.finishOnboarding]
            )}
        >
            {children}
        </OnboardingFlowContext.Provider>
    );
};
