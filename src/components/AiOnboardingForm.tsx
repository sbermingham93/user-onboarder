import ONBOARDING_GOALS from '../config/onboardingGoals.json'
import { ConversationInput, ConversationSpeaker, ProcessStage } from '../types/types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useLiveTranscription } from '../hooks/useLiveTranscription';
import { OnboardingStatusIndicators } from './onboarding/StatusIndicators';
import { VoiceControls } from './onboarding/VoiceControls';
import { TextInput } from './onboarding/TextInput';
import { ProgressBar } from './onboarding/ProgressBar';
import { Header } from './onboarding/Heading';
import { ConversationDisplay } from './onboarding/ConversationDisplay';
import LandingStep from './onboarding/LandingStep';
import { ErrorDisplay } from './onboarding/ErrorDisplay';
import { useOnboardingFlow } from '../hooks/useOnboardingFlow';
import { LiveTranscript } from './onboarding/LiveTranscript';
import CompleteStep from './onboarding/CompleteStep';
import { useMemo } from 'react';

export const AiOnboardingForm = () => {
    const { isSpeaking, cancel, isEnabled, speak } = useTextToSpeech()
    const {
        isListening,
        interimTranscript,
        finalTranscript,
        error,
        isSupported,
        startListening,
        stopListening,
        clearTranscript
    } = useLiveTranscription()

    const {
        currentStep,
        progressPercentage,
        isProcessing,
        textInput,
        setTextInput,
        handleTextReceived,
        startOnboarding,
        conversation,
        updateConversation,
        processStage,
        updateProcessingState,
        report,
        inputMode,
        responseMode,
        updateInputMode,
        updateResponseMode
    } = useOnboardingFlow(startListening, speak, interimTranscript, stopListening, cancel, isEnabled, finalTranscript)

    const textInputComponent = useMemo(() => {
        return inputMode == ConversationInput.TEXT || error ? (
            <TextInput textInput={textInput} onTextInputChange={setTextInput} onTextInputSubmit={(input: string) => {
                handleTextReceived(ConversationSpeaker.USER, ConversationInput.TEXT, input)
            }} isDisabled={isProcessing || isListening || isSpeaking} />
        ) : <></>
    }, [inputMode, error, textInput, setTextInput, handleTextReceived, isProcessing, isListening, isSpeaking])

    // UI
    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg bg-gray-50">
            <Header header='AI Customer Onboarding Agent' message={processStage == ProcessStage.QUESTIONS ? `Step ${currentStep + 1} of ${ONBOARDING_GOALS.length}` : ''} />

            {/* Show landing page */}
            {processStage == ProcessStage.LANDING ? <LandingStep inputMode={inputMode} updateInputMode={updateInputMode} responseMode={responseMode} updateResponseMode={updateResponseMode} startOnboarding={startOnboarding} /> : <></>}

            {/* show questions */}
            {processStage == ProcessStage.QUESTIONS ? <>
                <ProgressBar percentage={progressPercentage} />
                <OnboardingStatusIndicators isListening={isListening} isProcessing={isProcessing} isSpeaking={isSpeaking} />

                {/* Live Transcript */}
                {interimTranscript ? <LiveTranscript transcript={interimTranscript} /> : <></>}

                {/* Conversation History */}
                {conversation.length > 0 ? <ConversationDisplay conversation={conversation} textInput={textInputComponent} /> : <></>}

                {/* Voice Controls */}
                {inputMode == ConversationInput.AUDIO ? <VoiceControls isListening={isListening} isDisabled={isProcessing == true || isSpeaking == true} startListening={startListening} stopListening={stopListening} /> : <></>}

                {/* Error Display */}
                {error ? <ErrorDisplay error={error} /> : <></>}
            </> : ''}

            {/* Show complete */}
            {processStage == ProcessStage.COMPLETE && report ? <CompleteStep onBackHome={() => {
                // back to start and empty out the state
                clearTranscript()
                updateConversation([])

                updateProcessingState(
                    {
                        stage: ProcessStage.LANDING,
                        currentStep: 0
                    }
                )
            }} /> : <></>}
        </div>
    );
}