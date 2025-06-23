import ONBOARDING_GOALS from '../config/onboardingGoals.json'
import { ConversationInput, ConversationSpeaker } from '../types/types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useLiveTranscription } from '../hooks/useLiveTranscription';
import { OnboardingStatusIndicators } from './onboarding/StatusIndicators';
import { VoiceControls } from './onboarding/VoiceControls';
import { TextInput } from './onboarding/TextInput';
import { ProgressBar } from './onboarding/ProgressBar';
import { PreviewData } from './onboarding/PreviewData';
import { OnboardingReport } from './onboarding/OnboardingReport';
import { Header } from './onboarding/Heading';
import { ConversationDisplay } from './onboarding/ConversationDisplay';
import { StartOnboarding } from './onboarding/StartOnboarding';
import { ErrorDisplay } from './onboarding/ErrorDisplay';
import { useOnboardingFlow } from '../hooks/useOnboardingFlow';

export const AiOnboardingForm = () => {
    const { isSpeaking, cancel, isEnabled, speak } = useTextToSpeech()
    const {
        isListening,
        interimTranscript,
        finalTranscript,
        error,
        isSupported,
        startListening,
        stopListening
    } = useLiveTranscription()
    const {
        isComplete,
        currentStep,
        showProgressPercentage,
        progressPercentage,
        isProcessing,
        showVoiceControls,
        showTextFallback,
        textInput, 
        setTextInput,
        handleTextReceived,
        showStartButton,
        startOnboarding,
        conversation,
        conversationElementRef,
        isInitializing,
        onboardingData,
        report,
        downloadReport
    } = useOnboardingFlow(startListening, speak, interimTranscript, stopListening, cancel, isSupported)
    

    // UI
    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <Header message={isComplete ? 'Onboarding Complete!' : `Step ${currentStep + 1} of ${ONBOARDING_GOALS.length}`} />

            {/* Progress Bar */}
            {showProgressPercentage ? <ProgressBar percentage={progressPercentage} /> : ''}

            {/* Status Indicators */}
            <OnboardingStatusIndicators isListening={isListening} isProcessing={isProcessing} isSpeaking={isSpeaking} />

            {/* Voice Controls */}
            {showVoiceControls ? <VoiceControls isListening={isListening} isDisabled={isProcessing == true || isSpeaking == true} startListening={startListening} stopListening={stopListening} /> : ''}

            {/* Text Fallback */}
            {showTextFallback || true ? (
                <TextInput textInput={textInput} onTextInputChange={setTextInput} onTextInputSubmit={(input: string) => {
                    handleTextReceived(ConversationSpeaker.USER, ConversationInput.TEXT, input)
                }} isDisabled={isProcessing} heading='Text Input Mode' />
            ) : ''}

            {/* Live Transcript */}
            {interimTranscript ?
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-1">Live Transcript:</h4>
                    <p className="text-gray-600 italic">{interimTranscript}</p>
                </div> : ''}


            {/* Start Process */}
            {showStartButton ? <StartOnboarding startOnboarding={startOnboarding} isInitializing={isInitializing} /> : ''}

            {/* Conversation History */}
            <ConversationDisplay conversation={conversation} ref={conversationElementRef} />

            {/* Collected Data Preview */}
            <PreviewData data={onboardingData} heading='Data Captured' />

            {/* Completion Report */}
            {isComplete && report ? <OnboardingReport report={report} downloadReport={downloadReport} /> : ''}

            {/* Error Display */}
            {error ? <ErrorDisplay error={error} /> : ''}
        </div>
    );
}