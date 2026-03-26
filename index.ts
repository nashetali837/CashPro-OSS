import { eventBus } from '../../core/EventBus';

export interface FraudAlert {
  id: string;
  transactionId: string;
  type: 'VELOCITY_LIMIT' | 'AMOUNT_DEVIATION' | 'SUSPICIOUS_PATTERN';
  score: number; // 0 to 100
  timestamp: string;
  message: string;
}

export class BankFraudDetection {
  // --- Fraud Pattern Analysis ---
  private static VELOCITY_LIMIT = 5; // Max transactions per minute
  private static AMOUNT_DEVIATION_THRESHOLD = 3.0; // Standard deviations from mean

  static async analyzeTransaction(tx: any, history: any[]): Promise<FraudAlert | null> {
    const alerts: FraudAlert[] = [];

    // Rule 1: Velocity Check (simulated)
    const recentTxCount = history.filter(h => 
      new Date(h.timestamp).getTime() > Date.now() - 60000
    ).length;

    if (recentTxCount >= this.VELOCITY_LIMIT) {
      return {
        id: `fraud-${Date.now()}-1`,
        transactionId: tx.id,
        type: 'VELOCITY_LIMIT',
        score: 85,
        timestamp: new Date().toISOString(),
        message: `High transaction velocity detected: ${recentTxCount} tx/min`
      };
    }

    // Rule 2: Amount Deviation (simulated)
    const meanAmount = history.reduce((acc, h) => acc + Math.abs(h.amount), 0) / (history.length || 1);
    if (Math.abs(tx.amount) > meanAmount * this.AMOUNT_DEVIATION_THRESHOLD) {
      return {
        id: `fraud-${Date.now()}-2`,
        transactionId: tx.id,
        type: 'AMOUNT_DEVIATION',
        score: 70,
        timestamp: new Date().toISOString(),
        message: `Transaction amount ${tx.amount} significantly deviates from average ${meanAmount.toFixed(2)}`
      };
    }

    // Rule 3: Pattern Analysis (simulated)
    // For example, multiple small transactions followed by a large one
    const smallTxCount = history.slice(-3).filter(h => Math.abs(h.amount) < 100).length;
    if (smallTxCount >= 3 && Math.abs(tx.amount) > 5000) {
      return {
        id: `fraud-${Date.now()}-3`,
        transactionId: tx.id,
        type: 'SUSPICIOUS_PATTERN',
        score: 95,
        timestamp: new Date().toISOString(),
        message: `Suspicious layering pattern detected: Multiple small tx followed by large tx`
      };
    }

    return null;
  }

  static async flagTransaction(tx: any, alert: FraudAlert): Promise<void> {
    console.log(`[BankFraudDetection] Flagging transaction: ${tx.id} due to ${alert.type}`);
    await eventBus.publish('fraud.alert', alert, `fraud-${alert.id}`);
  }
}
