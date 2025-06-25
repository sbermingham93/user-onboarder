import { useCallback, useMemo, useRef, useState } from "react";
import type { IOnboardingData, IOnboardingReport, IValidationResponse } from "../../types/types";
import { EMPTY_ONBOARDING_DATA } from "../../config/onboarding";

interface IDataState {
  onboardingData: IOnboardingData;
  validationResult?: IValidationResponse;
  report?: IOnboardingReport;
};

export const useDataState = () => {
  const [state, setState] = useState<IDataState>({
    onboardingData: EMPTY_ONBOARDING_DATA,
  });
  
  const onboardingDataRef = useRef<IOnboardingData>({});

  const updateOnboardingData = useCallback((data: IOnboardingData) => {
    onboardingDataRef.current = data;
    setState(prev => ({ ...prev, onboardingData: data }));
  }, []);

  const updateValidationResult = useCallback((validationResult: IValidationResponse) => {
    setState(prev => ({ ...prev, validationResult: validationResult }));
  }, []);

  const updateReport = useCallback((report: IOnboardingReport) => {
    setState(prev => ({ ...prev, report: report }));
  }, []);

  return useMemo(() => {
    return {
        ...state,
        onboardingDataRef,
        updateOnboardingData,
        updateValidationResult,
        updateReport,
    }
  }, [state, updateOnboardingData, updateValidationResult, updateReport])
}