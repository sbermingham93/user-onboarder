interface IProgressBar {
    percentage: number
}

export const ProgressBar = ({percentage}: IProgressBar) => {
    return <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
            <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    </div>
}