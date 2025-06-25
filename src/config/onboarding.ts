import GOALS from './onboardingGoals.json'

export const ONBOARDING_GOALS = GOALS
export const ONBOARDING_DATA_POINTS = ONBOARDING_GOALS.map((goal) => {
    return goal.dataField
})

export const EMPTY_ONBOARDING_DATA = ONBOARDING_DATA_POINTS.reduce((result, item) => {
    result[item] = undefined

    return result
}, {})