import { v4 as uuidv4 } from 'uuid';
import { collection, addDoc, setDoc, doc, getDoc, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../core/firebase-server';
import { eventBus } from '../core/EventBus';
import { BankSecurity } from '../packages/security';
import { BankCompliance } from '../packages/compliance';
import { BankFraudDetection } from '../packages/fraud';

export interface Transaction {
  id: string;
  idempotencyKey: string;
  amount: number;
  currency: string;
  fromAccount: string;
  toAccount: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'FLAGGED';
  timestamp: string;
  complianceReports?: any[];
  fraudAlert?: any;
}

export class TransactionService {
  async processTransaction(txData: Omit<Transaction, 'id' | 'status' | 'timestamp'>) {
    const { idempotencyKey } = txData;

    // 1. Check if transaction already exists (Idempotency)
    const txRef = doc(db, 'transactions', idempotencyKey);
    const txSnap = await getDoc(txRef);

    if (txSnap.exists()) {
      console.log(`[TransactionService] Duplicate transaction: ${idempotencyKey}`);
      return txSnap.data() as Transaction;
    }

    const transaction: Transaction = {
      id: uuidv4(),
      ...txData,
      status: 'PENDING',
      timestamp: new Date().toISOString()
    };

    try {
      // 2. Fraud Detection Analysis
      // Fetch recent transaction history for this account to analyze patterns
      const historyQuery = query(
        collection(db, 'transactions'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const historySnap = await getDocs(historyQuery);
      const history = historySnap.docs.map(doc => doc.data());

      const fraudAlert = await BankFraudDetection.analyzeTransaction(transaction, history);
      if (fraudAlert && fraudAlert.score > 90) {
        console.warn(`[TransactionService] FRAUD ALERT: High risk transaction flagged: ${transaction.id}`);
        transaction.status = 'FLAGGED';
        transaction.fraudAlert = fraudAlert;
        await BankFraudDetection.flagTransaction(transaction, fraudAlert);
        
        // Persist flagged state and return early
        await setDoc(txRef, { ...transaction, createdAt: Timestamp.now() });
        return transaction;
      }

      // 3. Compliance & AML Checks
      const complianceReports = await BankCompliance.checkTransaction(transaction);
      if (complianceReports.length > 0) {
        transaction.complianceReports = complianceReports;
        // If critical compliance issue, we might want to flag it too
        if (complianceReports.some(r => r.severity === 'CRITICAL')) {
          transaction.status = 'FLAGGED';
        }
      }

      // 4. Persist Initial State
      await setDoc(txRef, {
        ...transaction,
        createdAt: Timestamp.now()
      });

      // 5. Simulate Processing
      console.log(`[TransactionService] Processing transaction: ${transaction.id}`);
      
      // Update status to COMPLETED if not flagged
      if (transaction.status === 'PENDING') {
        transaction.status = 'COMPLETED';
        await setDoc(txRef, {
          status: 'COMPLETED',
          updatedAt: Timestamp.now()
        }, { merge: true });

        // --- Business Logic: Update Account Balances ---
        try {
          // Find 'from' account
          const accountsRef = collection(db, 'accounts');
          const fromQuery = query(accountsRef); // We'll filter in JS if needed, or better use where()
          // For simplicity in this demo, we assume account names are unique and we find them
          const accountsSnap = await getDocs(accountsRef);
          
          const fromAccDoc = accountsSnap.docs.find(d => d.data().name === transaction.fromAccount);
          const toAccDoc = accountsSnap.docs.find(d => d.data().name === transaction.toAccount);

          if (fromAccDoc) {
            const newBalance = (fromAccDoc.data().balance || 0) - transaction.amount;
            await setDoc(fromAccDoc.ref, { balance: newBalance, lastUpdated: new Date().toISOString() }, { merge: true });
            console.log(`[TransactionService] Updated balance for ${transaction.fromAccount}: ${newBalance}`);
          }

          if (toAccDoc) {
            const newBalance = (toAccDoc.data().balance || 0) + transaction.amount;
            await setDoc(toAccDoc.ref, { balance: newBalance, lastUpdated: new Date().toISOString() }, { merge: true });
            console.log(`[TransactionService] Updated balance for ${transaction.toAccount}: ${newBalance}`);
          }
        } catch (balErr) {
          console.error("[TransactionService] Failed to update account balances:", balErr);
        }
      }

      // 6. Publish event for downstream services
      await eventBus.publish('transaction.completed', transaction, idempotencyKey);

      return transaction;
    } catch (err) {
      console.error("[TransactionService] Failed to process transaction:", err);
      transaction.status = 'FAILED';
      await setDoc(txRef, { status: 'FAILED' }, { merge: true });
      throw err;
    }
  }

  // --- Encrypted API Payload Handling ---
  async processEncryptedTransaction(encryptedPayload: string) {
    // Decrypt the payload using the internal security package
    const decryptedData = BankSecurity.decryptPayload(encryptedPayload);
    if (!decryptedData) {
      throw new Error("Invalid or corrupted encrypted payload");
    }

    // Process the decrypted transaction data
    return this.processTransaction(decryptedData);
  }
}

export const transactionService = new TransactionService();
