import admin from 'firebase-admin';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

// Initialize Firebase Admin SDK
// If running in Cloud Run, it will use the default service account credentials.
// We provide the projectId from the config.
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
    databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

// If a specific database ID is provided in the config, use it.
if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
  // Note: Firestore Admin SDK supports multiple databases, but we need to ensure we're using the right one.
  // In many cases, the default instance is what we want, but if it's a named database:
  // adminDb = admin.firestore(firebaseConfig.firestoreDatabaseId);
  // However, the standard admin.firestore() usually works if the project is correctly configured.
}

export default admin;
