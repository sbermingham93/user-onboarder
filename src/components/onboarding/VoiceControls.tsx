import { Mic, MicOff } from "lucide-react"

interface IVoiceControls {
    isListening: boolean
    isDisabled: boolean
    stopListening: Function
    startListening: Function
}

export const VoiceControls = ({
    isListening,
    isDisabled,
    stopListening,
    startListening
}: IVoiceControls) => {
    return <div className="flex justify-center gap-4 my-6">
        <button
            onClick={() => {
                isListening ? stopListening() : startListening()
            }}
            disabled={isDisabled}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all cursor-pointer ${isListening
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            {isListening ? 'Stop Recording' : 'Start Recording'}
        </button>
    </div>
}