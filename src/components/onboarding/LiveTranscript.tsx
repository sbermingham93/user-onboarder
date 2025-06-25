interface ILiveTranscript {
    header?: string
    transcript: string
}

export const LiveTranscript = ({
    header = 'Live Transcript:',
    transcript
}: ILiveTranscript) => {
    return  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-1">{header}</h4>
        <p className="text-gray-600 italic">{transcript}</p>
    </div>
}