import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import { AiOnboardingForm } from '../components/AiOnboardingForm'

// test render start button, answering some questions, we see the success screen
const START_ONBOARDING_BUTTON = "Start Onboarding"

test('it should begin with the start button', async () => {
  // render the component
  render(
    <AiOnboardingForm />
  );

  // check button there to start flow
  expect(screen.getByText(START_ONBOARDING_BUTTON)).toBeInTheDocument()
});

test('after clicking the start button we should see the conversation', async () => {
  // render the component
  render(
    <AiOnboardingForm />
  );

  // click the start button
  await userEvent.click(screen.getByText(START_ONBOARDING_BUTTON))

  // check the conversation is there
  expect(screen.getByText("Conversation")).toBeInTheDocument()
});