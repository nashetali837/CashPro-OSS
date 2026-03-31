import { adminDb as db } from './firebase-admin-init.js';

async function reset() {
  console.log("⚠️  Starting database reset...");

  try {
    const collections = ['accounts', 'forecasts'];
    
    for (const colName of collections) {
      const snapshot = await db.collection(colName).get();
      console.log(`🗑️  Clearing collection: ${colName} (${snapshot.size} docs)`);
      
      for (const d of snapshot.docs) {
        await d.ref.delete();
      }
    }

    console.log("✅ Database reset complete.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  }
}

reset();
