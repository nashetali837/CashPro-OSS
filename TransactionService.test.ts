import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionService } from '../server/services/TransactionService';

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'mock-id' }),
  setDoc: vi.fn().mockResolvedValue({}),
  updateDoc: vi.fn().mockResolvedValue({}),
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: { now: () => ({ toDate: () => new Date() }) }
}));

// Mock EventBus
vi.mock('../server/core/EventBus', () => ({
  eventBus: {
    publish: vi.fn().mockResolvedValue({ id: 'event-id' })
  }
}));

// Mock Bank Packages
vi.mock('../server/packages/security', () => ({
  BankSecurity: {
    decryptPayload: vi.fn().mockImplementation((p) => JSON.parse(p)),
  },
}));

vi.mock('../server/packages/compliance', () => ({
  BankCompliance: {
    checkTransaction: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../server/packages/fraud', () => ({
  BankFraudDetection: {
    analyzeTransaction: vi.fn().mockResolvedValue(null),
    flagTransaction: vi.fn(),
  },
}));

// Mock Firebase initialization
vi.mock('../server/core/firebase-server', () => ({
  db: {}
}));

describe('TransactionService', () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionService = new TransactionService();
  });

  it('should process a new transaction', async () => {
    const txData = {
      idempotencyKey: 'tx-key-1',
      amount: 1000,
      currency: 'USD',
      fromAccount: 'acc-1',
      toAccount: 'acc-2'
    };

    const result = await transactionService.processTransaction(txData);

    expect(result.status).toBe('COMPLETED');
    expect(result.idempotencyKey).toBe(txData.idempotencyKey);
  });
});
