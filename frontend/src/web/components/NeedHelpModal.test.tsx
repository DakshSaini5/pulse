import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import NeedHelpModal from './NeedHelpModal';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the platform utility
vi.mock('../../core/utils/platform', () => ({
  isNativeApp: false, // Default to web
}));

describe('NeedHelpModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<NeedHelpModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText(/Emergency Services & Guidance/i)).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    render(<NeedHelpModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Emergency Services & Guidance/i)).toBeInTheDocument();
    expect(screen.getByText(/Show Hospital/i)).toBeInTheDocument();
    expect(screen.getByText(/Emergency Call/i)).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<NeedHelpModal isOpen={true} onClose={mockOnClose} />);
    
    // There are a few close/action items, but we specifically target the X button or an action
    // In our case we can click the "Show Hospital" card and see if onClose is called
    const hospitalCard = screen.getByText(/Show Hospital/i).closest('div');
    if (hospitalCard) {
      fireEvent.click(hospitalCard);
    }
    
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/search?emergency=true&sort=distance');
  });

  it('shows web-specific emergency text when isNativeApp is false', async () => {
    // Re-mock for web
    vi.doMock('../../core/utils/platform', () => ({
      isNativeApp: false,
    }));
    
    // Dynamically re-import the module to apply the new mock
    const { default: Modal } = await import('./NeedHelpModal');
    
    render(<Modal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Quick-dial nearby hospitals or national medical emergency helplines immediately/i)).toBeInTheDocument();
  });

  it('shows mobile-specific emergency text when isNativeApp is true', async () => {
    // Re-mock for mobile
    vi.doMock('../../core/utils/platform', () => ({
      isNativeApp: true,
    }));
    
    // Dynamically re-import the module to apply the new mock
    vi.resetModules();
    const { default: Modal } = await import('./NeedHelpModal');
    
    render(<Modal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Dial the personal emergency contact number you filled in your profile immediately/i)).toBeInTheDocument();
  });
});
