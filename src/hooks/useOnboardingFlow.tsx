import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CompletionStatus, ConversationInput, ConversationSpeaker, type IConversationEntry, type IOnboardingData, type IOnboardingGoal, type IOnboardingReport, type IValidationResponse } from "../types/types";

import ONBOARDING_GOALS from '../config/onboardingGoals.json'
import { validateCompanyIndustry } from "../api/validation";
import { callAiService, type IAiOnboardingResponse } from "../api/onboarding";
import { extractDataFromResponse } from "../utils/utils";

const DATA_POINTS = ONBOARDING_GOALS.map((goal) => {
    return goal.dataField
})

const EMPTY_ONBOARDING_DATA = DATA_POINTS.reduce((result, item) => {
    result[item] = undefined

    return result
}, {})

// todo split conversation and general process flow - add to conversation and speaking
// start process finish process, process current step, process next step

export const useOnboardingFlow = (startListening: Function, speak: Function, interimTranscript: string, stopListening: Function, cancel: Function, isSupported: boolean) => {
    // STATE VARIABLES
    const [isProcessing, setIsProcessing] = useState(false) // used for api calls, creating report etc
    const [isComplete, setIsComplete] = useState(false) // is the process complete
    const [isInitializing, setIsInitializing] = useState(false);

    const [currentStep, setCurrentStep] = useState(0)
    const [textInput, setTextInput] = useState("") // text input in case issue with audio
    const [conversation, setConversation] = useState<IConversationEntry[]>([])
    const [onboardingData, setOnboardingData] = useState<IOnboardingData>(EMPTY_ONBOARDING_DATA) // object to track the important info
    const [validationResult, setValidationResult] = useState<IValidationResponse>() // response from api
    const [report, setReport] = useState<IOnboardingReport>();

    // REFS
    const onboardingDataRef = useRef<IOnboardingData>({})
    const conversationRef = useRef<IConversationEntry[]>([])
    const conversationElementRef = useRef(null)

    // MEMOS
    const currentStepMeta = useMemo(() => {
        return ONBOARDING_GOALS[currentStep];
    }, [currentStep]);

    // FUNCTIONS
    const addConversationEntry = useCallback((speaker: ConversationSpeaker, inputType: ConversationInput, textReceived: string, date: Date) => {
        conversationRef.current = [...conversationRef.current, {
            timestamp: date,
            speaker: speaker,
            text: textReceived,
            input: inputType
        }]

        setConversation(conversationRef.current);
    }, []);

    const speakAndAddConversationEntry = useCallback(async (speaker: ConversationSpeaker, inputType: ConversationInput, textReceived: string, date: Date) => {
        // add conversation entry
        addConversationEntry(speaker, inputType, textReceived, date)

        // speak if we can
        if (speaker == ConversationSpeaker.AGENT) {
            try {
                await speak(textReceived)
            } catch (err) {
                console.error({
                    err
                })
            }
        }
    }, [addConversationEntry, speak])

    const performIndustryCheckIfNeeded = useCallback(async (stepMeta: IOnboardingGoal) => {
        if (stepMeta != null && stepMeta.id === 'industry' && onboardingDataRef.current.companyName) {
            try {
                setIsProcessing(true)
                const validation = await validateCompanyIndustry(onboardingDataRef.current.companyName);
                setValidationResult(validation);

                setIsProcessing(false);

                const validationMessage = validation.industryMatch
                    ? "Great! I've confirmed that your company is in the food and beverage industry."
                    : "I see. While your company isn't primarily in food and beverage, we can still help you with your research needs.";

                await speakAndAddConversationEntry(ConversationSpeaker.AGENT, ConversationInput.TEXT, validationMessage, new Date())
            } catch (err) {
                console.warn('Validation failed, but continuing with onboarding.');
            } finally {
                setIsProcessing(false)
            }
        }
    }, [speakAndAddConversationEntry])

    const processCurrentStep = useCallback(async (speaker: ConversationSpeaker, inputType: ConversationInput, textReceived: string) => {
        // we want to extract any information of interest here
        const extracted = extractDataFromResponse(textReceived, currentStepMeta.dataField)
        const newOnboardingData = { ...onboardingDataRef.current, ...extracted }

        onboardingDataRef.current = newOnboardingData
        setOnboardingData(newOnboardingData)

        // empty the text input
        if (inputType == ConversationInput.TEXT) {
            setTextInput("")
        }

        // get the follow up, show it, onto the next step
        const followUp = ONBOARDING_GOALS[currentStep].followUp.replace(/\{(\w+)\}/g, (match, key) => {
            return (onboardingDataRef.current as any)[key] || match;
        });

        await speakAndAddConversationEntry(ConversationSpeaker.AGENT, ConversationInput.TEXT, followUp, new Date())
    }, [currentStepMeta, speakAndAddConversationEntry, extractDataFromResponse])

    // Complete the onboarding process - create report, add message
    const completeOnboarding = useCallback(async () => {
        setIsComplete(true);

        const finalReport: IOnboardingReport = {
            id: `onboarding-${Date.now()}`,
            timestamp: new Date(),
            userData: onboardingDataRef.current,
            transcript: conversationRef.current,
            validationResult: validationResult,
            completionStatus: CompletionStatus.COMPLETE
        };

        setReport(finalReport);

        // todo write report to DB

        const completionMessage = `Perfect! I've generated your onboarding report. You can review all the information we discussed and download it for your records. Thank you for completing the onboarding process!`;

        await speakAndAddConversationEntry(ConversationSpeaker.AGENT, ConversationInput.TEXT, completionMessage, new Date())
    }, [validationResult, speakAndAddConversationEntry])

    const processNextStep = useCallback(async () => {
        // if we are not on the last step, increment
        const nextStep = currentStep + 1
        const isFinalStep = nextStep >= ONBOARDING_GOALS.length

        if (isFinalStep == true) {
            completeOnboarding()
        } else {
            // ADD CHECK ON COMPANY NAME
            await performIndustryCheckIfNeeded(currentStepMeta)

            // increment the step
            setCurrentStep(nextStep)

            // add the prompt too
            const prompt = ONBOARDING_GOALS[nextStep].prompt.replace(/\{(\w+)\}/g, (match, key) => {
                return (onboardingDataRef.current as any)[key] || match;
            });

            await speakAndAddConversationEntry(ConversationSpeaker.AGENT, ConversationInput.TEXT, prompt, new Date())

            // listen for next response
            startListening()
        }
    }, [currentStep, completeOnboarding, performIndustryCheckIfNeeded, startListening, speakAndAddConversationEntry])

    const processAiResponse = useCallback(async (aiResponse: IAiOnboardingResponse) => {
        // extract any data from the reponse
        const nonNullFields = Object.entries(aiResponse.extractedData || {}).reduce((acc, [key, value]) => {
            if (value !== null && value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});

        // process ai response
        onboardingDataRef.current = {
            ...onboardingDataRef.current,
            ...nonNullFields
        }
        setOnboardingData(onboardingDataRef.current)

        // if we are finished, and have all the data points, call on complete
        if (aiResponse.isComplete == true) {
            await completeOnboarding()
        } else {
            // check if we are onto the next step
            const calculatedStep = Object.values(onboardingDataRef.current).filter((value) => {
                return value !== null
            }).length

            setCurrentStep(calculatedStep)

            if (aiResponse.response != null && aiResponse.response.length > 0) {
                await speakAndAddConversationEntry(ConversationSpeaker.AGENT, ConversationInput.AUDIO, aiResponse.response, new Date())

                // start listening
                startListening()
            }
        }
    }, [startListening, speakAndAddConversationEntry, completeOnboarding])

    const processAiStep = useCallback(async (textReceived: string) => {
        // check what fields are still missing
        const missingFields = DATA_POINTS.filter((field) => {
            return onboardingDataRef.current[field] === null || onboardingDataRef.current[field] === undefined
        })

        // prepare context
        const context = {
            collectedData: onboardingDataRef.current,
            missingFields: missingFields,
            conversationHistory: conversationRef.current,
            currentFocus: missingFields[0]
        }

        // try calling the ai endpoint...
        const aiResponse = await callAiService(textReceived, context)

        await processAiResponse(aiResponse)
    }, [processAiResponse])

    const handleTextReceived = useCallback(async (speaker: ConversationSpeaker, inputType: ConversationInput, textReceived: string) => {
        addConversationEntry(speaker, inputType, textReceived, new Date())

        // nothing more to do if its the agent
        if (speaker == ConversationSpeaker.AGENT) {
            return
        }

        // if text empty the input
        if (inputType == ConversationInput.TEXT) {
            setTextInput("")
        }

        // todo how to handle this gracefully - use ai unless we have a problem...
        await processAiStep(textReceived)

        // // process current step
        // await processCurrentStep(speaker, inputType, textReceived)

        // // process next step
        // await processNextStep()
    }, [addConversationEntry, processCurrentStep, processNextStep, processAiStep]);

    const downloadReport = useCallback(() => {
        if (!report) return;

        // maybe we should snitise the values here
        const dataStr = JSON.stringify(report, null, 2);


        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `onboarding-report-${report.id}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }, [report])

    // when we get text from the mic, we process it
    const previousInterimResultRef = useRef<string>(undefined)

    // todo - improve with a callback in the hook
    useEffect(() => {
        if (interimTranscript == null || interimTranscript.length == 0) {
            if (previousInterimResultRef.current != null && previousInterimResultRef.current.length > 0) {
                handleTextReceived(ConversationSpeaker.USER, ConversationInput.AUDIO, previousInterimResultRef.current)
                previousInterimResultRef.current = ""

                // stop listening too
                stopListening()
            }
        } else {
            previousInterimResultRef.current = interimTranscript
        }
    }, [interimTranscript])

    // kick off the process with adding the first prompt, reading it, and listen for reponse
    const startOnboarding = useCallback(async () => {
        setIsInitializing(true)

        try {
            const firstGoal = ONBOARDING_GOALS[0]
            const prompt = firstGoal.prompt

            const initialConversation = [{
                text: prompt,
                input: ConversationInput.TEXT,
                speaker: ConversationSpeaker.AGENT,
                timestamp: new Date()
            }]
            conversationRef.current = initialConversation
            setConversation(initialConversation)

            await speak(prompt)

            // listen for response
            startListening()
        } catch (err) {
            console.warn('Issue with first message')
        } finally {
            setIsInitializing(false)
        }
    }, [speak, startListening])

    // when conversation items are added, scroll to the bottom of the list
    useEffect(() => {
        if (conversationElementRef.current) {
            conversationElementRef.current.scrollTo({
                top: conversationElementRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [conversation]);

    // Add cleanup on unmount
    useEffect(() => {
        return () => {
            cancel(); // Cancel any ongoing speech
            stopListening(); // Stop any ongoing listening
        };
    }, []);

    const progressPercentage = useMemo(() => {
        return ((currentStep + 1) / ONBOARDING_GOALS.length) * 100;
    }, [currentStep]);

    const showProgressPercentage = useMemo(() => {
        return !isComplete && conversation.length > 0
    }, [isComplete, conversation])

    const showVoiceControls = useMemo(() => {
        return !isComplete && !isInitializing && conversation.length > 0 && isSupported == true
    }, [isComplete, isInitializing, conversation, isSupported])

    const showStartButton = useMemo(() => {
        return conversation.length == 0 || isInitializing == true
    }, [conversation, isInitializing])

    const showTextFallback = useMemo(() => {
        return !isComplete && isSupported == false
    }, [isComplete, isSupported])

    return useMemo(() => {
        return {
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
    }
    }, [ isComplete,
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
        downloadReport])
}