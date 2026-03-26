import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { RiskService } from '../server/services/RiskService';
import { eventBus } from '../server/core/EventBus';

vi.mock('../server/core/EventBus', () => ({
  eventBus: {
    subscribe: vi.fn(),
    publish: vi.fn(),
  },
}));

describe('RiskService', () => {
  let riskService: RiskService;

  beforeEach(() => {
    vi.clearAllMocks();
    riskService = new RiskService();
  });

  it('should subscribe to transaction.completed on initialization', () => {
    const subscribeMock = eventBus.subscribe as Mock;
    expect(subscribeMock).toHaveBeenCalledWith('transaction.completed', expect.any(Function));
  });

  it('should publish risk.alert for high value transactions', async () => {
    const subscribeMock = eventBus.subscribe as Mock;
    const call = subscribeMock.mock.calls.find(
      (c: any) => c[0] === 'transaction.completed'
    );
    
    expect(call).toBeDefined();
    const subscribeCallback = call![1];

    const highValueTx = { amount: 150000, currency: 'USD' };
    await subscribeCallback(highValueTx);

    expect(eventBus.publish).toHaveBeenCalledWith('risk.alert', expect.objectContaining({
      message: expect.stringContaining('High value transaction detected'),
      amount: 150000
    }));
  });

  it('should not publish risk.alert for low value transactions', async () => {
    const subscribeMock = eventBus.subscribe as Mock;
    const call = subscribeMock.mock.calls.find(
      (c: any) => c[0] === 'transaction.completed'
    );
    
    expect(call).toBeDefined();
    const subscribeCallback = call![1];

    const lowValueTx = { amount: 5000, currency: 'USD' };
    await subscribeCallback(lowValueTx);

    expect(eventBus.publish).not.toHaveBeenCalledWith('risk.alert', expect.any(Object));
  });
});
