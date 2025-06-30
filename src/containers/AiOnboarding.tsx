import AiOnboardingForm from "../components/AiOnboardingForm";
import { LiveTranscriptionProvider } from "../context/onboarding/LiveTranscriptionContext";
import { OnboardingConversationProvider } from "../context/onboarding/OnboardingConversationContext";
import { OnboardingFlowProvider } from "../context/onboarding/OnboardingFlowContext";
import { OnboardingProcessProvider } from "../context/onboarding/OnboardingProcessContext";
import { TextToSpeechProvider } from "../context/onboarding/TextToSpeechContext";

export default function AiOnboarding() {
    return <LiveTranscriptionProvider>
        <TextToSpeechProvider>
            <OnboardingProcessProvider>
                <OnboardingConversationProvider>
                    <OnboardingFlowProvider>
                        <AiOnboardingForm />
                    </OnboardingFlowProvider>
                </OnboardingConversationProvider>
            </OnboardingProcessProvider>
        </TextToSpeechProvider>
    </LiveTranscriptionProvider>
}