import { useCallback, useMemo, useState } from "react";
import { ProcessStage } from "../../types/types";

interface IProcessingState {
    isProcessing: boolean;
    currentStep: number;
    stage: ProcessStage
}

export const useProcessingState = () => {
    const [state, setState] = useState<IProcessingState>({
        isProcessing: false,
        currentStep: 0,
        stage: ProcessStage.LANDING
    });

    const updateProcessingState = useCallback((updates: Partial<IProcessingState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    return useMemo(() => {
        return { 
            ...state,
            updateProcessingState: updateProcessingState 
        }
    }, [state, updateProcessingState])
}