import * as admin from 'firebase-admin';

let firebaseEnabled = false;

try {
  // Check if Firebase service account environment variable is present
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccountVar) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountVar);
    } catch {
      // If not a JSON string, assume it is a path to a service account file
      serviceAccount = require(serviceAccountVar);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('✅ Firebase Admin initialized successfully.');
    firebaseEnabled = true;
  } else {
    console.log('⚠️ FIREBASE_SERVICE_ACCOUNT not configured. Auth running in DEVELOPER MOCK MODE.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  console.log('⚠️ Authentication falling back to DEVELOPER MOCK MODE.');
}

/**
 * Verifies a Firebase ID token.
 * In Developer Mock Mode, accepts 'mock-token-[phone]' and returns the mock phone number.
 */
export async function verifyFirebaseIdToken(token: string): Promise<{ phoneNumber: string }> {
  if (!token) {
    throw new Error('No Firebase ID token provided.');
  }

  // Developer Fallback Mode
  if (!firebaseEnabled || token.startsWith('mock-token-')) {
    if (token.startsWith('mock-token-')) {
      const mockPhone = token.replace('mock-token-', '');
      if (!mockPhone.startsWith('+')) {
        throw new Error('Invalid mock token format. Must be mock-token-[phone] with country code.');
      }
      console.log(`🛡️ [MOCK AUTH] Mock-verified phone number: ${mockPhone}`);
      return { phoneNumber: mockPhone };
    }
    throw new Error('Firebase Admin is not configured and a non-mock token was received.');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken.phone_number) {
      throw new Error('Verified Firebase token does not contain a phone number.');
    }
    return { phoneNumber: decodedToken.phone_number };
  } catch (error: any) {
    console.error('Firebase token verification failed:', error);
    throw new Error(`Firebase verification failed: ${error.message}`);
  }
}

export { admin };
