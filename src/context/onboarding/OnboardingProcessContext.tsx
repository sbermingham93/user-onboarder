import { createContext, useMemo } from "react";
import { useProcessingState, type IProcessingState } from "../../hooks/state/useProcessingState";
import { useDataState } from "../../hooks/state/useDataState";
import type { IOnboardingData, IOnboardingReport, IValidationResponse, ProcessStage } from "../../types/types";

export interface IOnboardingProcessContext {
    // processing state
    updateProcessingState: (updates: Partial<IProcessingState>) => void;
    isProcessing: boolean;
    currentStep: number;
    stage: ProcessStage;

    // data state
    onboardingDataRef: React.RefObject<IOnboardingData>;
    updateOnboardingData: (data: IOnboardingData) => void;
    updateValidationResult: (validationResult: IValidationResponse) => void;
    updateReport: (report: IOnboardingReport) => void;
    onboardingData: IOnboardingData;
    validationResult?: IValidationResponse;
    report?: IOnboardingReport;
}

export const OnboardingProcessContext = createContext<IOnboardingProcessContext>({} as IOnboardingProcessContext);

interface Props {
    children: React.ReactNode;
}

export const OnboardingProcessProvider = ({ children }: Props) => {
    const {
        isProcessing,
        updateProcessingState,
        stage,
        currentStep
    } = useProcessingState();

    const {
        onboardingData,
        onboardingDataRef,
        updateOnboardingData,
        updateReport,
        updateValidationResult,
        report,
        validationResult
    } = useDataState();

    return (
        <OnboardingProcessContext.Provider
            value={useMemo(
                () => ({
                    updateProcessingState,
                    isProcessing,
                    currentStep,
                    stage,

                    onboardingData,
                    onboardingDataRef,
                    updateOnboardingData,
                    updateReport,
                    updateValidationResult,
                    report,
                    validationResult
                }),
                [updateProcessingState,
                    isProcessing,
                    currentStep,
                    stage, onboardingData,
                    onboardingDataRef,
                    updateOnboardingData,
                    updateReport,
                    updateValidationResult,
                    report,
                    validationResult]
            )}
        >
            {children}
        </OnboardingProcessContext.Provider>
    );
};
