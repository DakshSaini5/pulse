import request from 'supertest';
import app from '../src/index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Authentication API', () => {
  beforeAll(async () => {
    // Clean up test data before running tests
    await prisma.user.deleteMany({ where: { email: { contains: 'test' } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return 400 for login without credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Validation failed');
  });


  it('should verify health endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('HEALTHY');
  });
});
