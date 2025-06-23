interface IStartOnboarding {
    startOnboarding: Function,
    isInitializing: boolean
}

export const StartOnboarding = (
    {
        startOnboarding,
        isInitializing
    }: IStartOnboarding
) => {
    return <div className="flex justify-center gap-4 mb-6">
        <button
            onClick={() => {
                startOnboarding()
            }}
            disabled={isInitializing}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all cursor-pointer ${isInitializing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
                } text-white`}
        >
            {isInitializing ? (
                <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Initializing...
                </>
            ) : (
                'Start Onboarding Flow'
            )}
        </button>
    </div>
}