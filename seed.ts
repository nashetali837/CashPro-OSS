import { adminDb as db } from './firebase-admin-init.js';

const ACCOUNTS = [
  { name: 'Global Operating Account', balance: 12450800.42, currency: 'USD', type: 'Checking', lastUpdated: new Date().toISOString() },
  { name: 'APAC Treasury Reserve', balance: 4200150.00, currency: 'SGD', type: 'Savings', lastUpdated: new Date().toISOString() },
  { name: 'EMEA Liquidity Pool', balance: 8900000.00, currency: 'EUR', type: 'Investment', lastUpdated: new Date().toISOString() },
  { name: 'LATAM Growth Fund', balance: 1500000.00, currency: 'BRL', type: 'Investment', lastUpdated: new Date().toISOString() }
];

async function seed() {
  console.log("🚀 Starting database seeding...");

  try {
    // 1. Clear existing accounts (optional, but good for a clean start)
    const snapshot = await db.collection('accounts').get();
    for (const d of snapshot.docs) {
      await d.ref.delete();
    }
    console.log("✅ Cleared existing accounts.");

    // 2. Add new accounts
    for (const acc of ACCOUNTS) {
      const docRef = await db.collection('accounts').add(acc);
      console.log(`✅ Added account: ${acc.name} (ID: ${docRef.id})`);
      
      // 3. Add some transactions for each account
      for (let i = 0; i < 5; i++) {
        await db.collection(`accounts/${docRef.id}/transactions`).add({
          accountId: docRef.id,
          amount: Math.random() * 100000,
          type: Math.random() > 0.5 ? 'credit' : 'debit',
          timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          description: `Automated Treasury Transfer ${i + 1}`,
          category: 'Liquidity Management'
        });
      }
      console.log(`   - Seeded 5 transactions for ${acc.name}`);
    }

    console.log("✨ Seeding complete! Your CashPro-OSS database is production-ready.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
