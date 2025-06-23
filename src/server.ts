import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { OPEN_AI_KEY } from './env/env';

const openAi = new OpenAI({
  apiKey: OPEN_AI_KEY,
});

const app = express();
const port = 3002;

app.use(express.json());

// Enable CORS for all origins (for development)
app.use(cors());

// Endpoint to validate if a company is in the food industry
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
  });
});

// endpoint to validate the company industry
app.get('/api/validate-industry', async (req, res) => {
  try {
    // AUTH, CHECK THE INPUTS ARE OK

    // MOCK THE WAIT
    await new Promise(resolve => setTimeout(resolve, 500))

    // get the company name from the params
    const companyName = String(req.query.companyName)
      .trim()
      .toLowerCase()

    if (companyName == null || companyName.length == 0) {
      res.status(400).send({
        message: 'Please pass a companyName url parameter to this endpoint'
      });
    } else {
      // todo - possibly check against list of companies
      if (["heineken", "musgrave", "glanbia", "ballymoyle"].includes(companyName)) {
        res.status(200).send({
          industryMatch: true,
          companyOverview: 'This is the company overview.'
        });
      } else {
        res.status(200).send({
          industryMatch: false,
          companyOverview: 'This company is not recognised in our food and beverage group.'
        });
      }
    }
  } catch (err) {
    // do something with the error - log, message etc
    res.status(500).send({
      message: 'There was an unexpected issue with the api, please try again.'
    })
  }
});

// endpoint to persist the report



// todo - null checks, input checks, format specified in the api not the app

// endpoint to get ai response
app.post('/api/ai-onboarding', async (req, res) => {
  try {
    const { prompt, temperature = 0.7 } = JSON.parse(req.body.body);

    const completion = await openAi.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful onboarding assistant for Talio.ai, a research and advisory company for the food and beverage industry. Always respond with valid JSON in the format specified."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature,
      max_tokens: 500
    });

    console.log({
      completion,
      content: completion.choices[0]
    })

    // null check on this
    const jsonResponse = JSON.parse(completion.choices[0].message.content || "{}")

    return res.status(200).send({
      content: jsonResponse,
      usage: completion.usage
    });

  } catch (error) {
    console.error('AI API Error:', error);
    return res.status(500).send(
      { error: 'Failed to process AI request' }
    );
  }
})

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
