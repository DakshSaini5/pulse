import request from 'supertest';
import app from '../src/index';

describe('User API', () => {
  it('should return 401 when trying to access user profile without token', async () => {
    const res = await request(app).get('/api/user/profile');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication required. Missing token.');
  });
});
