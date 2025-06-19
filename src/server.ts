import express from 'express';
import cors from 'cors';

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

    if (companyName == null || companyName.length == 0) {
      res.status(400).send({
        message: 'Please pass a companyName url parameter to this endpoint'
      });
    } else {
      // todo - possibly check against list of companies
      if (["heineken", "musgrave", "glanbia", "ballymoyle"].includes(companyName)) {
        res.json({
          industryMatch: true,
          companyOverview: 'This is the company overview.'
        });
      } else {
        res.json({
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

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
