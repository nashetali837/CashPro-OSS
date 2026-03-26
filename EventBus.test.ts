import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../server/core/EventBus';

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'mock-id' }),
  Timestamp: { now: () => ({ toDate: () => new Date() }) }
}));

// Mock Firebase initialization
vi.mock('../server/core/firebase-server', () => ({
  db: {}
}));

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  it('should subscribe and publish events', async () => {
    const callback = vi.fn();
    eventBus.subscribe('test.topic', callback);

    await eventBus.publish('test.topic', { data: 'test' });

    expect(callback).toHaveBeenCalledWith({ data: 'test' });
  });

  it('should maintain idempotency', async () => {
    const callback = vi.fn();
    eventBus.subscribe('test.topic', callback);

    const key = 'idempotency-key-1';
    await eventBus.publish('test.topic', { data: 'test' }, key);
    await eventBus.publish('test.topic', { data: 'test' }, key);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should notify SSE clients', async () => {
    const mockRes = {
      write: vi.fn()
    };
    eventBus.addSseClient(mockRes);

    await eventBus.publish('test.topic', { data: 'test' });

    expect(mockRes.write).toHaveBeenCalled();
  });
});
