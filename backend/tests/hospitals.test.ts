import request from 'supertest';
import app from '../src/index';

describe('Hospitals API', () => {
  it('should return 400 when searching hospitals without lat/lng', async () => {
    const res = await request(app).get('/api/hospitals?query=apollo');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Location coordinates (lat, lng) are required to search hospitals.');
  });

  it('should return 400 when searching with invalid coordinates', async () => {
    const res = await request(app).get('/api/hospitals?query=apollo&lat=abc&lng=xyz');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid location coordinates provided.');
  });
});
