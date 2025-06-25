import request from 'supertest';
import app from '../server';
import OpenAI from 'openai';
import { beforeEach, describe, it, expect, vi, type Mock } from 'vitest';

// Mock fs module (assuming you use 'fs' in your server)
import * as mockFs from 'fs';
vi.mock('fs');

// Mock OpenAI class
vi.mock('openai', () => {
  return {
    default: vi.fn()
  };
});

describe('API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return health check status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok'
      });
    });
  });

  describe('GET /api/validate-industry', () => {
    it('should return industry match for recognized companies', async () => {
      const response = await request(app)
        .get('/api/validate-industry')
        .query({ companyName: 'Heineken' })
        .expect(200);

      expect(response.body).toEqual({
        industryMatch: true,
        companyOverview: 'This is the company overview.'
      });
    });

    it('should handle case insensitive company names', async () => {
      const response = await request(app)
        .get('/api/validate-industry')
        .query({ companyName: 'MUSGRAVE' })
        .expect(200);

      expect(response.body).toEqual({
        industryMatch: true,
        companyOverview: 'This is the company overview.'
      });
    });

    it('should return no match for unrecognized companies', async () => {
      const response = await request(app)
        .get('/api/validate-industry')
        .query({ companyName: 'Unknown Company' })
        .expect(200);

      expect(response.body).toEqual({
        industryMatch: false,
        companyOverview: 'This company is not recognised in our food and beverage group.'
      });
    });

    it('should return 400 for missing company name', async () => {
      const response = await request(app)
        .get('/api/validate-industry')
        .expect(400);

      expect(response.body).toEqual({
        message: 'Please pass a companyName url parameter to this endpoint'
      });
    });

    it('should return 400 for empty company name', async () => {
      const response = await request(app)
        .get('/api/validate-industry')
        .query({ companyName: '   ' })
        .expect(400);

      expect(response.body).toEqual({
        message: 'Please pass a companyName url parameter to this endpoint'
      });
    });

    it('should trim whitespace from company names', async () => {
      const response = await request(app)
        .get('/api/validate-industry')
        .query({ companyName: '  glanbia  ' })
        .expect(200);

      expect(response.body).toEqual({
        industryMatch: true,
        companyOverview: 'This is the company overview.'
      });
    });
  });

  describe('POST /api/onboarding-report', () => {
    it('should successfully persist a report', async () => {
      const testReport = { company: 'Test Corp', data: 'sample data' };

      // Mock writeFileSync
      const writeFileSyncMock = vi.spyOn(mockFs, 'writeFileSync').mockImplementation(() => {});

      const response = await request(app)
        .post('/api/onboarding-report')
        .send({
          body: JSON.stringify({ report: testReport })
        })
        .expect(200);

      expect(response.body).toEqual({
        message: 'Report Persisted'
      });

      expect(writeFileSyncMock).toHaveBeenCalledWith(
        './onboarding.json',
        JSON.stringify({ report: testReport })
      );
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/onboarding-report')
        .send({
          body: 'invalid json'
        })
        .expect(500);

      expect(response.body).toEqual({
        error: 'Issue persisting the onboarding report'
      });
    });

    it('should handle file system errors', async () => {
      vi.spyOn(mockFs, 'writeFileSync').mockImplementation(() => {
        throw new Error('File system error');
      });

      const response = await request(app)
        .post('/api/onboarding-report')
        .send({
          body: JSON.stringify({ report: { test: 'data' } })
        })
        .expect(500);

      expect(response.body).toEqual({
        error: 'Issue persisting the onboarding report'
      });
    });
  });

  describe('POST /api/ai-onboarding', () => {
    const mockOpenAIResponse = {
      choices: [{
        message: {
          content: '{"result": "test response"}'
        }
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15
      }
    };

    beforeEach(() => {
      // Mock OpenAI class and its methods
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIResponse);
      (OpenAI as unknown as Mock).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));
    });

    it('should handle OpenAI API errors', async () => {
      const mockCreate = vi.fn().mockRejectedValue(new Error('OpenAI API Error'));
      (OpenAI as unknown as Mock).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      const response = await request(app)
        .post('/api/ai-onboarding')
        .send({
          body: JSON.stringify({
            prompt: 'Test prompt'
          })
        })
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to process AI request'
      });
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/ai-onboarding')
        .send({
          body: 'invalid json'
        })
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to process AI request'
      });
    });
  });
});
