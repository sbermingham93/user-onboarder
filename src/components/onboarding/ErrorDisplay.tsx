import { AlertCircle } from "lucide-react"

interface IErrorDisplay {
    error: string
}

export default function ErrorDisplay({ error }: IErrorDisplay) {
    return <div className="mt-4 p-3 bg-red-50 rounded-lg">
        <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600" />
            <p className="text-red-700">{error}</p>
        </div>
    </div>
}