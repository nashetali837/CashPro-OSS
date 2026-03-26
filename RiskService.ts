import { eventBus } from '../core/EventBus';

export class RiskService {
  init() {
    eventBus.subscribe('transaction.completed', async (tx: any) => {
      if (Math.abs(tx.amount) > 100000) {
        console.log(`[RiskService] ALERT: High value transaction detected: ${tx.id}`);
        await eventBus.publish('risk.alert', { txId: tx.id, severity: 'HIGH' }, `risk-alert-${tx.id}`);
      }
    });
    console.log("[RiskService] Initialized and monitoring transactions.");
  }
}

export const riskService = new RiskService();
