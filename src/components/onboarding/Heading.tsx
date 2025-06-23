interface IHeader {
    message: string
}
export const Header = ({ message }: IHeader) => {
    return <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
            AI Customer Onboarding Agent
        </h1>
        <p className="text-gray-600">
            {message}
        </p>
    </div>
}