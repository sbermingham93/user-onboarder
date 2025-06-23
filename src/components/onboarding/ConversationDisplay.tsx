import { useMemo } from "react";
import { ConversationSpeaker, type IConversationEntry } from "../../types/types"

interface IConversationDisplay {
    conversation: IConversationEntry[],
    ref: React.RefObject<null>
}
export const ConversationDisplay = ({
    conversation,
    ref
}: IConversationDisplay) => {
     // Memoize the conversation rendering to avoid re-renders
    const conversationElements = useMemo(() => {
        return conversation.map((entry, index) => (
            <div key={`${entry.timestamp.getTime()}-${index}`} className={`mb-2 p-2 rounded ${entry.speaker === ConversationSpeaker.AGENT ? 'bg-blue-100 ml-4' : 'bg-green-100 mr-4'
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
        ));
    }, [conversation]);

    return <div className="mb-6 bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto" ref={ref}>
        <h3 className="font-semibold text-gray-800 mb-3">Conversation</h3>
        {conversationElements}
    </div>
}