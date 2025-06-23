interface IPreviewData {
    data: Object
    heading: string
}
export const PreviewData = ({ data, heading }: IPreviewData) => {
    return <>
        {Object.keys(data).length > 0 ?
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-3">{heading}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                            <span className="text-blue-700 font-medium capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="text-blue-900">
                                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                            </span>
                        </div>
                    ))}
                </div>
            </div> : 'No data to preview'}
    </>
}