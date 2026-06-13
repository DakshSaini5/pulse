import request from 'supertest';
import app from '../src/index';

describe('Prescriptions API', () => {
  it('should return 401 when uploading without authentication', async () => {
    const res = await request(app)
      .post('/api/prescriptions/upload')
      .attach('file', Buffer.from('fake image data'), 'test.png');
    
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Authentication required');
  });
});
