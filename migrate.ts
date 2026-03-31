import { adminDb as db } from './firebase-admin-init.js';

/**
 * Migration Script
 * Ensures the database has the minimum required structure and data.
 * This script is idempotent (can be run multiple times safely).
 */

const SYSTEM_CONFIG = {
  id: 'global_config',
  version: '1.0.0',
  lastMigration: new Date().toISOString(),
  maintenanceMode: false
};

async function migrate() {
  console.log("🛠️  Starting database migration...");

  try {
    // 1. Ensure System Config exists
    const configRef = db.collection('system').doc(SYSTEM_CONFIG.id);
    await configRef.set(SYSTEM_CONFIG, { merge: true });
    console.log("✅ System configuration verified.");

    // 2. Ensure at least one account exists (if none)
    const accountsSnapshot = await db.collection('accounts').limit(1).get();
    if (accountsSnapshot.empty) {
      console.log("ℹ️  No accounts found. Seeding default account...");
      await db.collection('accounts').doc('default_operating').set({
        name: 'Default Operating Account',
        balance: 0,
        currency: 'USD',
        type: 'Checking',
        lastUpdated: new Date().toISOString()
      });
    } else {
      console.log("✅ Accounts already exist. Skipping default account creation.");
    }

    console.log("✨ Migration complete.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
