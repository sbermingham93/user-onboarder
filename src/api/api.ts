import axios from 'axios'
import type { IConversationEntry, IOnboardingReport, IValidationResponse } from '../types/types'

const BASE_URL = "http://localhost:3002"

export interface IAiOnboardingResponse {
  response: string
  extractedData: object
  nextQuestion: string
  isComplete: boolean
}

// AI service function
export const callAiService = async (userMessage: string, context: any): Promise<IAiOnboardingResponse> => {
  const prompt = `
You are an AI onboarding assistant. Your goal is to collect the following information from the user:
- What company do they work for
- What role do they have in the company
- What are they hoping to achieve with your research
- Is their company in the food and beverage industry
- What would the ideal output look like for them

Current context:
- Collected data: ${JSON.stringify(context.collectedData)}
- Missing fields: ${context.missingFields.join(', ')}
- Conversation history: ${JSON.stringify(context.conversationHistory)} 
- Current focus: ${context.currentFocus}

User just said: "${userMessage}"

Respond with a JSON object containing:
{
  "response": "Your conversational response to the user",
  "extractedData": {
    // Any data you extracted from their message 
    "companyName": "extracted company or null", 
    "role": "extracted role or null",
    "objective": "extracted objective if contacting or null",
    "inFoodAndBeverage": "extracted in food and beverage or null",
    "idealOutput": "extracted ideal output or null"
  },
  "isComplete": boolean // true if you have all required information
}

Be conversational, natural. 
Only ask for one piece of information at a time.
If you have all the pieces of information, respond with a statement, and no question.
`;

    // Replace with your preferred AI service (OpenAI, Anthropic, etc.)
    const response = await axios.post(`${BASE_URL}/api/ai-onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, temperature: 0.7 })
    });
    
    return response.data.content;
};


export const validateCompanyIndustry = async (companyName: string): Promise<IValidationResponse> => {
    try {
        const reponse = await axios.get(`${BASE_URL}/api/validate-industry?companyName=${companyName}`)

        return reponse.data
    } catch (err) {
        console.warn(`Issue checking for industry match, returning default`)
        console.warn({
            error: JSON.stringify(err)
        })
        return {
            industryMatch: false,
            companyOverview: 'Company overview not found.'
        }
    }
}

export const persistOnboardingData = async (report: IOnboardingReport): Promise<IAiOnboardingResponse> => {
    const response = await axios.post(`${BASE_URL}/api/onboarding-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report })
    });
    
    return response.data;
};