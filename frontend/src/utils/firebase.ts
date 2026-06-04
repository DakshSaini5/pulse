import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';

// Check if credentials are set
const hasConfig = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

let app;
let auth: any = null;
let isFirebaseMockMode = true;

if (hasConfig) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    isFirebaseMockMode = false;
    console.log('✅ Firebase Client SDK initialized.');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Client SDK:', error);
  }
} else {
  console.log('⚠️ Firebase credentials not found in env. Running in Developer Mock Mode for SMS OTP.');
}

/**
 * Custom Mock Confirmation Result for testing without Firebase
 */
class MockConfirmationResult implements ConfirmationResult {
  verificationId: string;
  private phoneNumber: string;

  constructor(phoneNumber: string) {
    this.verificationId = 'mock-' + Math.random().toString(36).substr(2, 9);
    this.phoneNumber = phoneNumber;
  }

  async confirm(code: string): Promise<any> {
    if (code === '123456') {
      console.log(`🛡️ [MOCK AUTH] Mock code confirmed for ${this.phoneNumber}`);
      return {
        user: {
          phoneNumber: this.phoneNumber,
          getIdToken: async () => `mock-token-${this.phoneNumber}`,
        }
      };
    } else {
      throw new Error('Invalid verification code. Use 123456 for Developer Mock Mode.');
    }
  }
}

/**
 * Unified OTP Dispatcher supporting both live Firebase and developer mock flow.
 */
export async function sendSMSVerification(
  phoneNumber: string,
  elementId: string
): Promise<ConfirmationResult> {
  if (isFirebaseMockMode) {
    console.log(`📱 [MOCK OTP] Sending code 123456 to ${phoneNumber}`);
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    return new MockConfirmationResult(phoneNumber);
  }

  // Live Firebase Authentication Mode
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }

  // Clean up any existing verifier to prevent "already rendered" errors
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (err) {
      console.warn('Error clearing old recaptcha verifier:', err);
    }
    (window as any).recaptchaVerifier = null;
  }

  // Clear the container HTML to ensure a clean state
  const container = document.getElementById(elementId);
  if (container) {
    container.innerHTML = '<div id="' + elementId + '-inner"></div>';
  }

  const targetId = container ? `${elementId}-inner` : elementId;

  // Create reCAPTCHA verifier
  const recaptchaVerifier = new RecaptchaVerifier(auth, targetId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved.');
    }
  });

  (window as any).recaptchaVerifier = recaptchaVerifier;

  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

export { auth, isFirebaseMockMode };
