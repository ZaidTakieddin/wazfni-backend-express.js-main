import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseApp: admin.app.App | null = null;
let isFirebaseEnabled = false;

// Check if Firebase environment variables are available
const hasFirebaseConfig = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_CLIENT_EMAIL
);

// Initialize Firebase Admin SDK only if environment variables are available
if (hasFirebaseConfig && !admin.apps.length) {
  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      }),
    });
    isFirebaseEnabled = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.warn('⚠️ Failed to initialize Firebase Admin SDK:', error);
    isFirebaseEnabled = false;
  }
} else if (!hasFirebaseConfig) {
  console.warn(
    '⚠️ Firebase environment variables not found. Firebase notifications will be disabled.',
  );
  console.warn(
    'Missing variables: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL',
  );
  isFirebaseEnabled = false;
}

// Export a safe Firebase admin object that won't crash
const safeFirebaseAdmin = {
  ...admin,
  messaging: () => {
    if (!isFirebaseEnabled) {
      return {
        sendEachForMulticast: async () => {
          console.warn(
            'Firebase notifications disabled - skipping notification',
          );
          return { successCount: 0, failureCount: 0, responses: [] };
        },
      };
    }
    return admin.messaging();
  },
};

export { isFirebaseEnabled };
export default safeFirebaseAdmin;
