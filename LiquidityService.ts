import { eventBus } from '../core/EventBus';

export class LiquidityService {
  init() {
    eventBus.subscribe('transaction.completed', async (tx: any) => {
      console.log(`[LiquidityService] Recalculating position for transaction: ${tx.id}`);
      // Simulate downstream processing
      await eventBus.publish('liquidity.recalculated', { txId: tx.id, newPosition: 12000000 + Math.random() * 1000000 }, `liquidity-recalc-${tx.id}`);
    });
    console.log("[LiquidityService] Initialized and monitoring transactions.");
  }
}

export const liquidityService = new LiquidityService();
