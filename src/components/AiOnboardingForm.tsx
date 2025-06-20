import { useEffect, useRef, useState } from 'react';
import ONBOARDING_GOALS from '../config/onboardingGoals.json'
import { AlertCircle, CheckCircle, Download, Mic, MicOff, Volume2 } from 'lucide-react';
import { CompletionStatus, ConversationInput, ConversationSpeaker, type IConversationEntry, type IOnboardingData, type IOnboardingGoal, type IOnboardingReport, type IValidationResponse } from '../types/types';
import { validateCompanyIndustry } from '../api/validation';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useLiveTranscription } from '../hooks/useLiveTranscription';


// initial thoughts
// get it working with text inputs first (also will be used if we are having issues with the audio)
// add the audio, so text can be read, and input taken from the mic of the machine
// ui - top - header, 2. what step they are on, 3. input - which is either a text box, or audio input, 4. chat messages

// afterwards we add ai for each step (again may need to fall back to previous solution if issue with AI api)

// tests for hooks, tests for api endpoint, e2e test for text, audio, ai

// make the UI look nicer


// KNOWN BUGS
// first prompt is not being read - not allowed error from the utterance.speak
// simple text parsing can easily miss the keywords

export const AiOnboardingForm = () => {
    // STATE VARIABLES
    const [isProcessing, setIsProcessing] = useState(false) // used for api calls, creating report etc
    const [isComplete, setIsComplete] = useState(false) // is the process complete

    const [currentStep, setCurrentStep] = useState(0)
    const [textInput, setTextInput] = useState("") // text input in case issue with audio
    const [conversation, setConversation] = useState<IConversationEntry[]>([])
    const [onboardingData, setOnboardingData] = useState<IOnboardingData>({}) // object to track the important info
    const [validationResult, setValidationResult] = useState<IValidationResponse>() // response from api
    const [report, setReport] = useState<IOnboardingReport>();

    // REFS
    const onboardingDataRef = useRef<IOnboardingData>({})
    const conversationRef = useRef<IConversationEntry[]>([])
    const conversationElementRef = useRef(null)

    // HOOKS
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


    // FUNCTIONS
    const addConversationEntry = (speaker: ConversationSpeaker, inputType: ConversationInput, textReceived: string, date: Date) => {
        setConversation(prev => [...prev, {
            timestamp: date,
            speaker: speaker,
            text: textReceived,
            input: inputType
        }])
    }

    const speakAndAddConversationEntry = async (speaker: ConversationSpeaker, inputType: ConversationInput, textReceived: string, date: Date) => {
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
    }

    // simple method to pick out data of interest based on the step they are on
    const extractDataFromResponse = (response: string, dataField: string): Partial<IOnboardingData> => {
        const data: any = {};

        switch (dataField) {
            case 'userName':
                // Extract name from responses like "My name is John" or "I'm Sarah"
                const nameMatch = response.match(/(?:name is|i'm|i am)\s+(\w+)/i) || response.match(/^(\w+)$/);
                data.userName = nameMatch ? nameMatch[1] : response.split(' ')[0];
                break;

            case 'companyName':
                // Clean up company response
                data.companyName = response.replace(/^(i work for|i work at|at|i work in|for|in)\s+/i, '').trim();
                break;

            case 'role':
                data.role = response.replace(/^(i am|i'm|i am a|i'm a|my role is|i work as|a)\s+/i, '').trim();
                break;

            case 'objective':
                data.objective = response;
                break;

            case 'industryConfirmed':
                data.industryConfirmed = /yes|yeah|yep|correct|right|true/i.test(response);
                break;

            case 'idealOutput':
                data.idealOutput = response;
                break;
        }

        return data;
    };

    const performIndustryCheckIfNeeded = async (stepMeta: IOnboardingGoal) => {
        if (stepMeta != null && stepMeta.id === 'industry' && onboardingDataRef.current.companyName) {
            try {
                setIsProcessing(true)
                const validation = await validateCompanyIndustry(onboardingDataRef.current.companyName);
                setValidationResult(validation);

                const validationMessage = validation.industryMatch
                    ? "Great! I've confirmed that your company is in the food and beverage industry."
                    : "I see. While your company isn't primarily in food and beverage, we can still help you with your research needs.";

                addConversationEntry(ConversationSpeaker.AGENT, ConversationInput.TEXT, validationMessage, new Date())
            } catch (err) {
                console.warn('Validation failed, but continuing with onboarding.');
            } finally {
                setIsProcessing(false)
            }
        }
    }

    // todo - make this method less horrible
    const handleTextReceived = async (speaker: ConversationSpeaker, inputType: ConversationInput, textReceived: string) => {
        // add a row to the conversation
        addConversationEntry(speaker, inputType, textReceived, new Date())

        // nothing more to do if its the agent
        if (speaker == ConversationSpeaker.AGENT) {
            return
        }

        const stepMeta = ONBOARDING_GOALS[currentStep]

        // we want to extract any information of interest here
        const extracted = extractDataFromResponse(textReceived, stepMeta.dataField)
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

        // if we are not on the last step, increment
        const nextStep = currentStep + 1
        const isFinalStep = nextStep >= ONBOARDING_GOALS.length

        if (isFinalStep == true) {
            completeOnboarding()
        } else {
            // ADD CHECK ON COMPANY NAME
            await performIndustryCheckIfNeeded(stepMeta)

            // increment the step, show the prompt
            setCurrentStep(nextStep)
            const prompt = ONBOARDING_GOALS[nextStep].prompt.replace(/\{(\w+)\}/g, (match, key) => {
                return (onboardingDataRef.current as any)[key] || match;
            });

            // add the prompt too
            await speakAndAddConversationEntry(ConversationSpeaker.AGENT, ConversationInput.TEXT, prompt, new Date())
        }

    }

    // Complete the onboarding process - create report, add message
    const completeOnboarding = async () => {
        setIsComplete(true);

        const finalReport: IOnboardingReport = {
            id: `onboarding-${Date.now()}`,
            timestamp: new Date(),
            userData: onboardingData,
            transcript: conversation,
            validationResult,
            completionStatus: CompletionStatus.COMPLETE
        };

        setReport(finalReport);

        // todo write report to DB

        const completionMessage = `Perfect! I've generated your onboarding report. You can review all the information we discussed and download it for your records. Thank you for completing the onboarding process, ${onboardingData?.userName}!`;

        // addConversationEntry(ConversationSpeaker.AGENT, ConversationInput.TEXT, completionMessage, new Date());
        await speakAndAddConversationEntry(ConversationSpeaker.AGENT, ConversationInput.TEXT, completionMessage, new Date())
    };

    const downloadReport = () => {
        if (!report) return;

        const dataStr = JSON.stringify(report, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `onboarding-report-${report.id}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // when we get text from the mic, we process it
    const previousInterimResultRef = useRef<string>(undefined)

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

    // kick off the process with adding the first prompt
    useEffect(() => {
        async function speakFirstMessage() {
            const prompt = ONBOARDING_GOALS[0].prompt

            const initialConversation = [{
                text: prompt,
                input: ConversationInput.TEXT,
                speaker: ConversationSpeaker.AGENT,
                timestamp: new Date()
            }]
            conversationRef.current = initialConversation
            setConversation(initialConversation)

            try {
                await speak(prompt)
            } catch (err) {
                console.warn('Issue with first message')
            }
        }

        // add the first step to the conversation
        if (conversationRef.current.length == 0) {
            speakFirstMessage()
        }
    }, [])

    // when conversation items are added, scroll to the bottom of the list
    useEffect(() => {
        if (conversationElementRef.current) {
            conversationElementRef.current.scrollTo({
                top: conversationElementRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [conversation]);

    // UI
    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    AI Customer Onboarding Agent
                </h1>
                <p className="text-gray-600">
                    {isComplete ? 'Onboarding Complete!' : `Step ${currentStep + 1} of ${ONBOARDING_GOALS.length}`}
                </p>
            </div>

            {/* Progress Bar */}
            {!isComplete && (
                <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${((currentStep + 1) / ONBOARDING_GOALS.length) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Status Indicators */}
            <div className="flex justify-center gap-4 mb-6">
                {isSpeaking && (
                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                        <Volume2 size={16} />
                        <span>AI Speaking...</span>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                )}

                {isListening && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                        <Mic size={16} />
                        <span>Listening...</span>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                )}

                {isProcessing && (
                    <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                    </div>
                )}
            </div>

            {/* Voice Controls */}
            {!isComplete && isSupported == true ? (
                <div className="flex justify-center gap-4 mb-6">
                    <button
                        onClick={isListening ? stopListening : startListening}
                        disabled={isSpeaking || isProcessing}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${isListening
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                            } ${(isSpeaking || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        {isListening ? 'Stop Recording' : 'Start Recording'}
                    </button>
                </div>
            ) : ''}

            {/* Text Fallback */}
            {!isComplete && isSupported == false ? (
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle size={20} className="text-yellow-600" />
                        <span className="font-medium text-yellow-800">Text Input Mode</span>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleTextReceived(ConversationSpeaker.USER, ConversationInput.TEXT, textInput)
                                }
                            }}
                            placeholder="Type your response here..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => {
                                handleTextReceived(ConversationSpeaker.USER, ConversationInput.TEXT, textInput)
                            }}
                            disabled={!textInput.trim() || isProcessing}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                            Send
                        </button>
                    </div>
                </div>
            ) : ''}

            {/* Live Transcript */}
            {interimTranscript && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-1">Live Transcript:</h4>
                    <p className="text-gray-600 italic">{interimTranscript}</p>
                </div>
            )}

            {finalTranscript && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-1">Final Transcript:</h4>
                    <p className="text-gray-600 italic">{finalTranscript}</p>
                </div>
            )}

            {/* Conversation History */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto" ref={conversationElementRef}>
                <h3 className="font-semibold text-gray-800 mb-3">Conversation</h3>
                {conversation.map((entry, index) => (
                    <div key={index} className={`mb-2 p-2 rounded ${entry.speaker === ConversationSpeaker.AGENT ? 'bg-blue-100 ml-4' : 'bg-green-100 mr-4'
                        }`}>
                        <div className="flex justify-between items-start">
                            <span className={`font-medium ${entry.speaker === ConversationSpeaker.AGENT ? 'text-blue-800' : 'text-green-800'
                                }`}>
                                {entry.speaker === ConversationSpeaker.AGENT ? 'AI Agent' : 'You'}
                            </span>
                            <span className="text-xs text-gray-500">
                                {entry.timestamp.toLocaleTimeString()}
                            </span>
                        </div>
                        <p className="text-gray-700 mt-1">{entry.text}</p>
                    </div>
                ))}
            </div>

            {/* Collected Data Preview */}
            {Object.keys(onboardingData).length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-3">Collected Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(onboardingData).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                                <span className="text-blue-700 font-medium capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="text-blue-900">
                                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Industry Validation Result */}
            {/* {validationResult && (
        <div className={`mb-6 p-4 rounded-lg ${validationResult.industryMatch ? 'bg-green-50' : 'bg-orange-50'
          }`}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className={
              validationResult.industryMatch ? 'text-green-600' : 'text-orange-600'
            } />
            <h3 className={`font-semibold ${validationResult.industryMatch ? 'text-green-800' : 'text-orange-800'
              }`}>
              Industry Validation
            </h3>
          </div>
          <p className={validationResult.industryMatch ? 'text-green-700' : 'text-orange-700'}>
            {validationResult.companyOverview}
          </p>
        </div>
      )} */}

            {/* Completion Report */}
            {isComplete && report && (
                <div className="p-6 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={24} className="text-green-600" />
                            <h2 className="text-xl font-bold text-green-800">Onboarding Complete!</h2>
                        </div>
                        <button
                            onClick={downloadReport}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <Download size={16} />
                            Download Report
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded border">
                        <h3 className="font-semibold mb-3">Final Report Summary</h3>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify({
                                reportId: report.id,
                                completedAt: report.timestamp,
                                userData: report.userData,
                                industryValidation: report.validationResult,
                                conversationLength: report.transcript.length
                            }, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {/* {error && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )} */}
        </div>
    );
}