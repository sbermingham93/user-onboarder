import ONBOARDING_GOALS from '../config/onboardingGoals.json'
import Header from './onboarding/Heading';
import LandingStep from './onboarding/steps/LandingStep';
import CompleteStep from './onboarding/steps/CompleteStep';
import { useContext } from 'react';
import { OnboardingProcessContext } from '../context/onboarding/OnboardingProcessContext';
import DataRetrieveStep from './onboarding/steps/DataRetrieveStep';
import { OnboardingFlowContext } from '../context/onboarding/OnboardingFlowContext';
import { ProcessStage } from '../types/types';

export default function AiOnboardingForm() {
    const { stage, currentStep, report } = useContext(OnboardingProcessContext)
    const { finishOnboarding } = useContext(OnboardingFlowContext)

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg bg-gray-50">
            <Header header='AI Customer Onboarding Agent' message={stage == ProcessStage.QUESTIONS ? `Step ${currentStep + 1} of ${ONBOARDING_GOALS.length}` : ''} />

            {/* Show landing page */}
            {stage == ProcessStage.LANDING ? <LandingStep /> : <></>}

            {/* show questions */}
            {stage == ProcessStage.QUESTIONS ? <DataRetrieveStep />: ''}

            {/* Show complete */}
            {stage == ProcessStage.COMPLETE && report ? <CompleteStep onBackHome={finishOnboarding} /> : <></>}
        </div>
    );
}