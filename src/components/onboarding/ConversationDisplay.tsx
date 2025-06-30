import { useEffect, useMemo, useRef, type JSX } from "react";
import { ConversationSpeaker, type IConversationEntry } from "../../types/types";

interface IConversationDisplay {
    conversation: IConversationEntry[];
    textInput: JSX.Element;
}

export default function ConversationDisplay({
    conversation,
    textInput
}: IConversationDisplay) {
    // Auto-scroll conversation
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (ref.current?.scrollTo) {
            ref.current.scrollTo({
                top: ref.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [conversation]);

    // Memoize the conversation rendering to avoid re-renders
    const conversationElements = useMemo(() => {
        return conversation.map((entry, index) => (
            <div
                key={`${entry.timestamp.getTime()}-${index}`}
                className={`flex ${entry.speaker === ConversationSpeaker.AGENT ? 'justify-start' : 'justify-end'} mb-2`}
            >
                <div
                    className={`
                        max-w-xs md:max-w-md
                        p-3 rounded-2xl shadow
                        ${entry.speaker === ConversationSpeaker.AGENT
                            ? 'bg-blue-100 text-blue-900 rounded-bl-none'
                            : 'bg-green-100 text-green-900 rounded-br-none'
                        }
                        transition-all
                    `}
                >
                    <div className="flex items-center mb-1">
                        <span className="font-semibold text-sm">
                            {entry.speaker === ConversationSpeaker.AGENT ? 'AI Agent' : 'You'}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                            {entry.timestamp.toLocaleTimeString()}
                        </span>
                    </div>
                    <p className="text-gray-800 text-base">{entry.text}</p>
                </div>
            </div>
        ));
    }, [conversation]);

    return (
        <div className="relative bg-gray-50 rounded-xl shadow-lg max-h-96 md:max-h-[30rem] flex flex-col overflow-hidden">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur px-4 pt-4 pb-2 border-b border-gray-200">
                <h3 className="font-bold text-gray-800 text-lg tracking-tight">Conversation</h3>
            </div>

            {/* Scrollable Conversation Area */}
            <div
                ref={ref}
                className="flex-1 overflow-y-auto px-4 py-2 space-y-1"
                style={{ scrollBehavior: "smooth" }}
            >
                {conversationElements}
            </div>

            {/* Sticky Footer (Text Input) */}
            <div className="sticky bottom-0 z-10 bg-gray-50/95 backdrop-blur px-4 pb-4 pt-2 border-t border-gray-200">
                {textInput}
            </div>
        </div>
    );
};
