import { Capacitor } from '@capacitor/core';
import { useState, useEffect } from 'react';

// Centralized platform detection
// Returns true if running natively on iOS or Android via Capacitor
export const isNativeApp = Capacitor.isNativePlatform() || import.meta.env.VITE_APP_TARGET === 'mobile';

// Centralized software keyboard activity listener
export const useKeyboardActive = (): boolean => {
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);

  useEffect(() => {
    const handleFocusChange = () => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      );
      setIsKeyboardActive(!!isInput);
    };

    // Use capturing phase to receive focus/blur events on all elements
    window.addEventListener('focus', handleFocusChange, true);
    window.addEventListener('blur', handleFocusChange, true);
    
    // Initial check
    handleFocusChange();
    
    return () => {
      window.removeEventListener('focus', handleFocusChange, true);
      window.removeEventListener('blur', handleFocusChange, true);
    };
  }, []);

  return isKeyboardActive;
};
