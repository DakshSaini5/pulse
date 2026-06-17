import request from 'supertest';
import app from '../src/index';

describe('Auth API', () => {
  it('should hit rate limiter when requesting OTP too many times', async () => {
    const promises = [];
    // The rate limit for auth is 5 requests per 15 minutes
    for (let i = 0; i < 6; i++) {
      promises.push(
        request(app)
          .post('/api/auth/register/send-otp')
          .send({ email: `test${i}@example.com` })
      );
    }
    
    const responses = await Promise.all(promises);
    const tooManyRequests = responses.find(r => r.status === 429);
    
    expect(tooManyRequests).toBeDefined();
    expect(tooManyRequests!.body.error).toContain('Security limit reached. 0 login attempts left. Please try again in 15 minutes.');
  }, 15000);
});
