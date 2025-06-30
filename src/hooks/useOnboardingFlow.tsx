import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { CompletionStatus, ConversationInput, ConversationResponse, ConversationSpeaker, ProcessStage, type IConversationEntry, type IOnboardingReport } from "../types/types";
import { persistOnboardingData, validateCompanyIndustry } from "../api/api";
import { callAiService, type IAiOnboardingResponse } from "../api/api";
import { extractDataFromResponse } from "../utils/utils";
import { ONBOARDING_DATA_POINTS, ONBOARDING_GOALS } from "../config/onboarding";
import { TextToSpeechContext } from "../context/onboarding/TextToSpeechContext";
import { LiveTranscriptionContext } from "../context/onboarding/LiveTranscriptionContext";
import { OnboardingConversationContext } from "../context/onboarding/OnboardingConversationContext";
import { OnboardingProcessContext } from "../context/onboarding/OnboardingProcessContext";

// consider looking into xstate for state machine - ready, initialised, listening, speaking, processing (parsing response, calling api, creating report), 

export const useOnboardingFlow = () => {
    // parent contexts
    const { speak, cancel, isEnabled } = useContext(TextToSpeechContext)
    const { startListening, stopListening, interimTranscript, finalTranscript, clearTranscript } = useContext(LiveTranscriptionContext)
    const conversationState = useContext(OnboardingConversationContext)
    const processState = useContext(OnboardingProcessContext)

    // Memoized values
    const currentStepMeta = useMemo(() => {
        return ONBOARDING_GOALS[processState.currentStep];
    }, [processState.currentStep]);

    const progressPercentage = useMemo(() => {
        return ((processState.currentStep + 1) / ONBOARDING_GOALS.length) * 100;
    }, [processState.currentStep]);

    // Core conversation functions
    const addConversationEntry = useCallback((
        speaker: ConversationSpeaker,
        inputType: ConversationInput,
        textReceived: string,
        date: Date
    ) => {
        const newEntry: IConversationEntry = {
            timestamp: date,
            speaker,
            text: textReceived,
            input: inputType
        };

        const updatedConversation = [...conversationState.conversationRef.current, newEntry];
        conversationState.updateConversation(updatedConversation);
    }, [conversationState]);

    const speakAndAddConversationEntry = useCallback(async (
        speaker: ConversationSpeaker,
        inputType: ConversationInput,
        textReceived: string,
        date: Date
    ) => {
        addConversationEntry(speaker, inputType, textReceived, date);

        if (speaker === ConversationSpeaker.AGENT && isEnabled == true) {
            await speak(textReceived);
        }
    }, [addConversationEntry, speak, isEnabled]);

    const listenIfEnabled = useCallback(() => {
        if (isEnabled && conversationState.inputMode == ConversationInput.AUDIO) {
            startListening()
        } else {
            console.warn('Listening is not enabled...')
        }
    }, [isEnabled, startListening, conversationState.inputMode])

    const processCurrentStep = useCallback(async (speaker: ConversationSpeaker, inputType: ConversationInput, textReceived: string) => {
        // we want to extract any information of interest here
        const extracted = extractDataFromResponse(textReceived, currentStepMeta.dataField)
        const newOnboardingData = { ...processState.onboardingDataRef.current, ...extracted }

        processState.onboardingDataRef.current = newOnboardingData
        processState.updateOnboardingData(newOnboardingData)

        // empty the text input
        if (inputType == ConversationInput.TEXT) {
            conversationState.updateTextInput("")
        }

        // get the follow up, show it, onto the next step
        const followUp = ONBOARDING_GOALS[processState.currentStep].followUp.replace(/\{(\w+)\}/g, (match, key) => {
            return (processState.onboardingDataRef.current as any)[key] || match;
        });

        await speakAndAddConversationEntry(ConversationSpeaker.AGENT, ConversationInput.TEXT, followUp, new Date())
    }, [currentStepMeta, speakAndAddConversationEntry, extractDataFromResponse])

    // Completion handling
    const completeOnboarding = useCallback(async () => {
        const companyName = processState.onboardingDataRef.current.companyName

        // validate the company
        let comapnyValidationResult

        try {
            if (companyName) {
                comapnyValidationResult = await validateCompanyIndustry(companyName)
                processState.updateValidationResult(comapnyValidationResult)
            }
        } catch (err) { }

        // generate the report
        const finalReport: IOnboardingReport = {
            id: `onboarding-${Date.now()}`,
            timestamp: new Date(),
            userData: processState.onboardingDataRef.current,
            transcript: conversationState.conversationRef.current,
            validationResult: comapnyValidationResult,
            completionStatus: CompletionStatus.COMPLETE
        };

        processState.updateReport(finalReport);


        // persist the report
        try {
            await persistOnboardingData(finalReport)
        } catch (err) {
            console.error("Issue persisting the report")
            console.error({
                err
            })
        }

        // let the user know they are finished
        const completionMessage = `Great, I have all the details i need.`;

        await speakAndAddConversationEntry(ConversationSpeaker.AGENT, ConversationInput.TEXT, completionMessage, new Date());

        processState.updateProcessingState({ stage: ProcessStage.COMPLETE });
    }, [processState, conversationState, speakAndAddConversationEntry, finalTranscript]);

    const processNextStep = useCallback(async () => {
        // if we are not on the last step, increment
        const nextStep = processState.currentStep + 1
        const isFinalStep = nextStep >= ONBOARDING_GOALS.length

        if (isFinalStep == true) {
            completeOnboarding()
        } else {
            // increment the step
            processState.updateProcessingState({
                currentStep: nextStep
            })

            // add the prompt too
            const prompt = ONBOARDING_GOALS[nextStep].prompt.replace(/\{(\w+)\}/g, (match, key) => {
                return (processState.onboardingDataRef.current as any)[key] || match;
            });

            await speakAndAddConversationEntry(ConversationSpeaker.AGENT, ConversationInput.TEXT, prompt, new Date())

            // listen for next response
            listenIfEnabled()
        }
    }, [processState.currentStep, completeOnboarding, listenIfEnabled, speakAndAddConversationEntry])

    // AI processing
    const processAiResponse = useCallback(async (aiResponse: IAiOnboardingResponse) => {
        // Extract and merge non-null data
        const extractedData = Object.entries(aiResponse.extractedData || {}).reduce((acc, [key, value]) => {
            if (value !== null && value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});

        const updatedData = { ...processState.onboardingDataRef.current, ...extractedData };
        processState.updateOnboardingData(updatedData);

        if (aiResponse.isComplete) {
            await completeOnboarding();
        } else {
            // Calculate current step based on collected data
            const collectedFields = Object.values(updatedData).filter(value => value !== null).length;
            processState.updateProcessingState({ currentStep: collectedFields });

            if (aiResponse.response?.length > 0) {
                await speakAndAddConversationEntry(
                    ConversationSpeaker.AGENT,
                    ConversationInput.AUDIO,
                    aiResponse.response,
                    new Date()
                );
                listenIfEnabled()
            }
        }
    }, [processState, speakAndAddConversationEntry, listenIfEnabled]);

    const processAiStep = useCallback(async (textReceived: string) => {
        try {
            const missingFields = ONBOARDING_DATA_POINTS.filter(field =>
                processState.onboardingDataRef.current[field] === null ||
                processState.onboardingDataRef.current[field] === undefined
            );

            const context = {
                collectedData: processState.onboardingDataRef.current,
                missingFields,
                conversationHistory: conversationState.conversationRef.current,
                currentFocus: missingFields[0]
            };

            processState.updateProcessingState({ isProcessing: true });
            const aiResponse = await callAiService(textReceived, context);
            await processAiResponse(aiResponse);
        } catch (err) {
            console.error(`Issue processing the AI step`)
            console.error({
                err
            })
            throw err
        } finally {
            processState.updateProcessingState({ isProcessing: false });
        }
    }, [processState, conversationState, processAiResponse]);

    const getCurrentStep = useCallback(() => {
        let impliedStep = 0

        for (let i = 0; i < ONBOARDING_DATA_POINTS.length; i++) {
            const stepMeta = ONBOARDING_DATA_POINTS[i]

            if (processState.onboardingDataRef.current[stepMeta] === null && processState.onboardingDataRef.current[stepMeta] === undefined) {
                return impliedStep
            } else {
                impliedStep = i
            }
        }

        return impliedStep
    }, [])

    const processSimpleStep = useCallback(async (
        speaker: ConversationSpeaker,
        inputType: ConversationInput,
        textReceived: string
    ) => {
        // // process current step
        await processCurrentStep(speaker, inputType, textReceived)

        // // process next step
        await processNextStep()
    }, [processCurrentStep, processNextStep])

    // process step with either ai (with fallback) or simple
    const processStep = useCallback(async (
        speaker: ConversationSpeaker,
        inputType: ConversationInput,
        textReceived: string
    ) => {

        if (conversationState.responseMode == ConversationResponse.AI) {
            try {
                await processAiStep(textReceived);
            } catch (err) {
                // fallback from any issues
                // find step based on collected info...
                const updatedStep = getCurrentStep()
                processState.updateProcessingState(
                    {
                        currentStep: updatedStep
                    }
                )
                // process step
                await processSimpleStep(speaker, inputType, textReceived)
            }
        } else {
            // simple
            // process step
            await processSimpleStep(speaker, inputType, textReceived)
        }
    }, [processAiStep, getCurrentStep, processState.updateProcessingState, conversationState.responseMode, processSimpleStep])


    // Main text processing handler
    const handleTextReceived = useCallback(async (
        speaker: ConversationSpeaker,
        inputType: ConversationInput,
        textReceived: string
    ) => {
        addConversationEntry(speaker, inputType, textReceived, new Date());

        if (speaker === ConversationSpeaker.AGENT) {
            return;
        }

        if (inputType === ConversationInput.TEXT) {
            conversationState.updateTextInput("");
        }

        await processStep(speaker, inputType, textReceived)
    }, [addConversationEntry, conversationState, processStep]);

    // Onboarding initialization
    const startOnboarding = useCallback(async () => {
        processState.updateProcessingState({ stage: ProcessStage.QUESTIONS });

        const firstGoal = ONBOARDING_GOALS[0];
        const prompt = firstGoal.prompt;

        const initialConversation: IConversationEntry[] = [{
            text: prompt,
            input: ConversationInput.TEXT,
            speaker: ConversationSpeaker.AGENT,
            timestamp: new Date()
        }];

        conversationState.updateConversation(initialConversation);

        if (isEnabled) {
            await speak(prompt);
        }

        listenIfEnabled();
    }, [processState, conversationState, speak, listenIfEnabled, isEnabled]);

    const finishOnboarding = useCallback(() => {
        // back to start and empty out the state
        clearTranscript()
        conversationState.updateConversation([])

        processState.updateProcessingState(
            {
                stage: ProcessStage.LANDING,
                currentStep: 0
            }
        )
    }, [clearTranscript, conversationState.updateConversation, processState.updateProcessingState])

    // Audio transcript handling
    const previousInterimResultRef = useRef<string>("");

    useEffect(() => {
        if (!interimTranscript?.length) {
            if (previousInterimResultRef.current?.length > 0) {
                handleTextReceived(ConversationSpeaker.USER, ConversationInput.AUDIO, previousInterimResultRef.current);
                previousInterimResultRef.current = "";
                stopListening();
            }
        } else {
            previousInterimResultRef.current = interimTranscript;
        }
    }, [interimTranscript, handleTextReceived, stopListening]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cancel();
            stopListening();
        };
    }, [cancel, stopListening]);

    return useMemo(() => {
        return {
            progressPercentage: progressPercentage,
            handleTextReceived: handleTextReceived,
            startOnboarding: startOnboarding,
            finishOnboarding: finishOnboarding
        }
    }, [
        progressPercentage,
        handleTextReceived,
        startOnboarding,
        finishOnboarding
    ])
}