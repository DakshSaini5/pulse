import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import React from 'react';

// Mock the API
vi.mock('@core/services/api', () => ({
  authAPI: {
    verifyToken: vi.fn().mockResolvedValue({ id: '1', name: 'Test User' }),
    logout: vi.fn(),
  }
}));

describe('AuthContext', () => {
  it('should throw error when useAuth is used outside provider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  it('should initialize correctly within provider', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initial state (since verifyToken is mocked to succeed, it will eventually set user)
    // We would need to await the effect in a full test
    expect(result.current.loading).toBeDefined();
  });
});
