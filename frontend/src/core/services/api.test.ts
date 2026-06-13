import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authAPI } from './api';

// Mock axios or localStorage if needed
describe('API Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('authAPI.getCurrentUser should return null when not logged in', () => {
    const user = authAPI.getCurrentUser();
    expect(user).toBeNull();
  });

  it('authAPI.getCurrentUser should return user data when logged in', () => {
    localStorage.setItem('pulse_user', JSON.stringify({ id: '1', name: 'Test User' }));
    const user = authAPI.getCurrentUser();
    expect(user).toEqual({ id: '1', name: 'Test User' });
  });

  it('authAPI.logout should clear localStorage', () => {
    localStorage.setItem('pulse_token', 'fake-token');
    localStorage.setItem('pulse_user', '{}');
    authAPI.logout();
    
    expect(localStorage.getItem('pulse_token')).toBeNull();
    expect(localStorage.getItem('pulse_user')).toBeNull();
  });
});
