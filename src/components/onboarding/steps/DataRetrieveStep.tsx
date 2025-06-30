import { useContext, useMemo } from "react";
import { ConversationInput, ConversationSpeaker } from "../../../types/types";
import ConversationDisplay from "../ConversationDisplay";
import ErrorDisplay from "../ErrorDisplay";
import LiveTranscript from "../LiveTranscript";
import ProgressBar from "../ProgressBar";
import OnboardingStatusIndicators from "../StatusIndicators";
import VoiceControls from "../VoiceControls";
import { OnboardingConversationContext } from "../../../context/onboarding/OnboardingConversationContext";
import { LiveTranscriptionContext } from "../../../context/onboarding/LiveTranscriptionContext";
import { TextToSpeechContext } from "../../../context/onboarding/TextToSpeechContext";
import { OnboardingProcessContext } from "../../../context/onboarding/OnboardingProcessContext";
import { OnboardingFlowContext } from "../../../context/onboarding/OnboardingFlowContext";
import TextInput from "../TextInput";

export default function DataRetrieveStep() {
    // context
    const { conversation, inputMode, textInput, updateTextInput  } = useContext(OnboardingConversationContext) 
    const { isListening, error, interimTranscript, startListening, stopListening } = useContext(LiveTranscriptionContext)
    const { isSpeaking } = useContext(TextToSpeechContext)
    const { isProcessing } = useContext(OnboardingProcessContext)
    const { handleTextReceived, progressPercentage } = useContext(OnboardingFlowContext)

    const textInputComponent = useMemo(() => {
        return inputMode == ConversationInput.TEXT || error ? (
            <TextInput textInput={textInput} onTextInputChange={updateTextInput} onTextInputSubmit={(input: string) => {
                handleTextReceived(ConversationSpeaker.USER, ConversationInput.TEXT, input)
            }} isDisabled={isProcessing || isListening || isSpeaking} />
        ) : <></>
    }, [inputMode, error, textInput, updateTextInput, handleTextReceived, isProcessing, isListening, isSpeaking])
        
    return <>
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
    </>
}