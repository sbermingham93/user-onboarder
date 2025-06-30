import React, { useContext } from "react";
import { Mic, Keyboard, Bot, List } from "lucide-react";
import { OnboardingConversationContext } from "../../../context/onboarding/OnboardingConversationContext";
import { OnboardingFlowContext } from "../../../context/onboarding/OnboardingFlowContext";
import { ConversationInput, ConversationResponse } from "../../../types/types";

export default function LandingStep() {
    // context
    const { inputMode, updateInputMode, responseMode, updateResponseMode } = useContext(OnboardingConversationContext)
    const { startOnboarding } = useContext(OnboardingFlowContext)

    return (
        <>
            {/* Explainer */}
            <p className="mb-6 text-gray-700">
                Meet your personal AI onboarding assistant! Choose how you want to interact and get started with step-by-step guidance. You can use your voice or keyboard, and pick between smart AI help or straightforward instructions.
            </p>

            {/* Input Mode Choice */}
            <div className="mb-6">
                <label className="block font-semibold mb-2 text-gray-800">
                    How would you like to interact?
                </label>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => updateInputMode(ConversationInput.AUDIO)}
                        className={`flex items-center gap-2 px-4 py-2 rounded border transition ${inputMode === ConversationInput.AUDIO
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100 cursor-pointer"
                            }`}
                        aria-pressed={inputMode === ConversationInput.AUDIO}
                    >
                        <Mic className="w-5 h-5" />
                        Voice
                    </button>
                    <button
                        type="button"
                        onClick={() => updateInputMode(ConversationInput.TEXT)}
                        className={`flex items-center gap-2 px-4 py-2 rounded border transition ${inputMode === ConversationInput.TEXT
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100 cursor-pointer"
                            }`}
                        aria-pressed={inputMode === ConversationInput.TEXT}
                    >
                        <Keyboard className="w-5 h-5" />
                        Text
                    </button>
                </div>
            </div>

            {/* Response Mode Choice */}
            <div className="mb-6">
                <label className="block font-semibold mb-2 text-gray-800">
                    What kind of help do you prefer?
                </label>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => updateResponseMode(ConversationResponse.AI)}
                        className={`flex items-center gap-2 px-4 py-2 rounded border transition ${responseMode === ConversationResponse.AI
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100 cursor-pointer"
                            }`}
                        aria-pressed={responseMode === ConversationResponse.AI}
                    >
                        <Bot className="w-5 h-5" />
                        AI Assistant
                    </button>
                    <button
                        type="button"
                        onClick={() => updateResponseMode(ConversationResponse.SIMPLE)}
                        className={`flex items-center gap-2 px-4 py-2 rounded border transition ${responseMode === ConversationResponse.SIMPLE
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100 cursor-pointer"
                            }`}
                        aria-pressed={responseMode === ConversationResponse.SIMPLE}
                    >
                        <List className="w-5 h-5" />
                        Simple Steps
                    </button>
                </div>
            </div>

            {/* Start Button */}
            <button
                onClick={() => {
                    startOnboarding()
                }}
                className="w-full py-3 mt-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition cursor-pointer"
            >
                Start Onboarding
            </button>
        </>
  );
}
