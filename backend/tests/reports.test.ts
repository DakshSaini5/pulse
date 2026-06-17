import request from 'supertest';

// Mock the authentication middleware to let requests pass through
jest.mock('../src/middleware/auth', () => {
  const originalModule = jest.requireActual('../src/middleware/auth');
  return {
    __esModule: true,
    ...originalModule,
    authenticateToken: (req: any, res: any, next: any) => {
      req.user = { id: 'test-user-id' };
      next();
    },
    adminOnly: (req: any, res: any, next: any) => {
      next();
    }
  };
});

import app from '../src/index';
import { prisma } from '../src/db';

describe('Reports API', () => {
  it('should block rapid AI document verification via rate limiter', async () => {
    const promises = [];
    // Rate limit is 10 requests per hour
    for (let i = 0; i < 16; i++) {
      promises.push(
        request(app)
          .post('/api/reports/test-id/verify')
          .send({ verifiedData: {} })
      );
    }
    
    const responses = await Promise.all(promises);
    const tooManyRequests = responses.find(r => r.status === 429);
    
    expect(tooManyRequests).toBeDefined();
    expect(tooManyRequests!.body.error).toContain('You have 0 document scans left. Please try again next hour.');
  });
});
