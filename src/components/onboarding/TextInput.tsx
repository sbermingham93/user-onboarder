import { AlertCircle } from "lucide-react"

interface ITextInput {
    heading: string
    textInput: string
    onTextInputChange: Function
    onTextInputSubmit: Function
    isDisabled: boolean
}

export const TextInput = ({
    heading,
    textInput,
    onTextInputChange,
    onTextInputSubmit,
    isDisabled
}: ITextInput) => {
    return <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={20} className="text-yellow-600" />
            <span className="font-medium text-yellow-800">{heading}</span>
        </div>
        <div className="flex gap-2">
            <input
                type="text"
                value={textInput}
                onChange={(e) => onTextInputChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        onTextInputSubmit(textInput)
                    }
                }}
                placeholder="Type your response here..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                onClick={() => {
                    onTextInputSubmit(textInput)
                }}
                disabled={!textInput.trim() || isDisabled}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer disabled:opacity-50"
            >
                Send
            </button>
        </div>
    </div>
}