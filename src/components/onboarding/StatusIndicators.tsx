import { Mic, Volume2 } from "lucide-react"

interface IOnboardingStatusIndicators {
    isSpeaking: boolean
    isListening: boolean
    isProcessing: boolean
}

export const OnboardingStatusIndicators = ({
    isSpeaking,
    isListening,
    isProcessing
}: IOnboardingStatusIndicators) => {
    return <div className="flex justify-center gap-4 mb-6">
        {isSpeaking ? (
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                <Volume2 size={16} />
                <span>AI Speaking...</span>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
        ): ''}

        {isListening ? (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <Mic size={16} />
                <span>Listening...</span>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
        ): ''}

        {isProcessing ? (
            <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
            </div>
        ): ''}
    </div>
}