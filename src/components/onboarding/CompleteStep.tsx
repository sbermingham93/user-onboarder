import { CheckCircle } from "lucide-react";

interface ICompleteStep {
    onBackHome: Function
}

export default function CompleteStep({ onBackHome }: ICompleteStep) {
    return (
        <div className="flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-xl p-8 flex flex-col items-center">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2 text-gray-900 text-center">
                    Thank You for Completing Onboarding!
                </h1>
                <p className="text-gray-700 text-center mb-4">
                    We appreciate your time and effort. We now have all the information we need to get you started.
                </p>
                <p className="text-gray-700 text-center mb-6">
                    Our team will be in touch with you as soon as possible. If you have any questions in the meantime, feel free to reach out!
                </p>
                <button
                    onClick={() => {
                        onBackHome()
                    }}
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    Return Home
                </button>
            </div>
        </div>
    );
}
