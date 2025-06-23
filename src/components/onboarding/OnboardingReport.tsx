import { CheckCircle, Download } from "lucide-react"
import type { IOnboardingReport } from "../../types/types"

interface IOnboardingReportProps {
    downloadReport: Function
    report: IOnboardingReport
}
export const OnboardingReport = ({ downloadReport, report }: IOnboardingReportProps) => {
    return <div className="p-6 bg-green-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <CheckCircle size={24} className="text-green-600" />
                <h2 className="text-xl font-bold text-green-800">Onboarding Complete!</h2>
            </div>
            <button
                onClick={() => {
                    downloadReport()
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
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
}