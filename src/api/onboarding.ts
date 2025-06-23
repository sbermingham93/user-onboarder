import axios from 'axios'

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
- User's name
- Company name  
- Their role/position in the company
- Their main objective/goal of contacting us
- Their ideal output 

Current context:
- Collected data: ${JSON.stringify(context.collectedData)}
- Missing fields: ${context.missingFields.join(', ')}
- Conversation history: ${JSON.stringify(context.conversationHistory)} // Last 3 exchanges

User just said: "${userMessage}"

Respond with a JSON object containing:
{
  "response": "Your conversational response to the user",
  "extractedData": {
    // Any data you extracted from their message 
    "userName": "extracted name or null",
    "companyName": "extracted company or null", 
    "role": "extracted role or null",
    "objective": "extracted objective if contacting or null",
    "idealOutput": "extracted ideal output or null"
  },
  "isComplete": boolean // true if you have all required information
}

Be conversational, natural. 
Only ask for one piece of information at a time.
If you have all the pieces of information, respond with a statement, and no question.
`;
console.log({
  prompt
})
    // Replace with your preferred AI service (OpenAI, Anthropic, etc.)
    const response = await axios.post(`${BASE_URL}/api/ai-onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, temperature: 0.7 })
    });

    console.log({
      response
    })
    
    return response.data.content;
};