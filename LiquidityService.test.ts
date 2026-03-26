import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { LiquidityService } from '../server/services/LiquidityService';
import { eventBus } from '../server/core/EventBus';

vi.mock('../server/core/EventBus', () => ({
  eventBus: {
    subscribe: vi.fn(),
    publish: vi.fn(),
  },
}));

describe('LiquidityService', () => {
  let liquidityService: LiquidityService;

  beforeEach(() => {
    vi.clearAllMocks();
    liquidityService = new LiquidityService();
  });

  it('should subscribe to transaction.completed on initialization', () => {
    const subscribeMock = eventBus.subscribe as Mock;
    expect(subscribeMock).toHaveBeenCalledWith('transaction.completed', expect.any(Function));
  });

  it('should publish liquidity.recalculated for any transaction', async () => {
    const subscribeMock = eventBus.subscribe as Mock;
    const call = subscribeMock.mock.calls.find(
      (c: any) => c[0] === 'transaction.completed'
    );
    
    expect(call).toBeDefined();
    const subscribeCallback = call![1];

    const tx = { amount: 1000, currency: 'USD' };
    await subscribeCallback(tx);

    expect(eventBus.publish).toHaveBeenCalledWith('liquidity.recalculated', expect.objectContaining({
      lastTransaction: tx
    }));
  });
});
