import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
