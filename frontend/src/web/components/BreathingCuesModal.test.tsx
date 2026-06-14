import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import BreathingCuesModal from './BreathingCuesModal';

// Mock the platform utility
vi.mock('../../core/utils/platform', () => ({
  isNativeApp: false, // Default to web
}));

describe('BreathingCuesModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<BreathingCuesModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText(/You're Safe/i)).not.toBeInTheDocument();
  });

  it('renders breathing cues when isOpen is true', () => {
    render(<BreathingCuesModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/You're Safe/i)).toBeInTheDocument();
    expect(screen.getByText(/Breathe In...|Hold In...|Breathe Out.../i)).toBeInTheDocument();
  });

  it('hides "No, I need support" button on the web (isNativeApp = false)', () => {
    render(<BreathingCuesModal isOpen={true} onClose={vi.fn()} />);
    // "Yes, I am okay" should be there
    expect(screen.getByText(/Yes, I am okay/i)).toBeInTheDocument();
    // "No, I need support" should NOT be there
    expect(screen.queryByText(/No, I need support/i)).not.toBeInTheDocument();
  });

  it('shows "No, I need support" button on mobile (isNativeApp = true)', async () => {
    // Re-mock for mobile
    vi.doMock('../../core/utils/platform', () => ({
      isNativeApp: true,
    }));
    vi.resetModules();
    const { default: Modal } = await import('./BreathingCuesModal');

    render(<Modal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Yes, I am okay/i)).toBeInTheDocument();
    expect(screen.getByText(/No, I need support/i)).toBeInTheDocument();
  });

  it('navigates to YES_OKAY step when "Yes, I am okay" is clicked', () => {
    render(<BreathingCuesModal isOpen={true} onClose={vi.fn()} />);
    
    const yesButton = screen.getByText(/Yes, I am okay/i);
    fireEvent.click(yesButton);
    
    // Now it should show the "Glad you are safe!" screen
    expect(screen.getByText(/Glad you are safe!/i)).toBeInTheDocument();
  });
});
