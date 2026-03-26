import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobScheduler } from '../server/services/JobScheduler';
import { eventBus } from '../server/core/EventBus';
import { addDoc, updateDoc } from 'firebase/firestore';

vi.mock('../server/core/EventBus', () => {
  return {
    eventBus: {
      publish: vi.fn(),
    },
  };
});

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'job-123' }),
  updateDoc: vi.fn().mockResolvedValue({}),
  setDoc: vi.fn().mockResolvedValue({}),
  doc: vi.fn(),
  Timestamp: { now: vi.fn().mockReturnValue('mock-timestamp') },
}));

vi.mock('../server/core/firebase-server', () => ({
  db: {},
}));

describe('JobScheduler', () => {
  let jobScheduler: JobScheduler;

  beforeEach(() => {
    vi.clearAllMocks();
    jobScheduler = new JobScheduler();
    vi.useFakeTimers();
  });

  it('should start a background job and publish events', async () => {
    const jobPromise = jobScheduler.startBackgroundJob('Test Job', 'test-key');
    
    expect(addDoc).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      name: 'Test Job',
      status: 'Running',
      idempotencyKey: 'test-key'
    }));

    // Fast-forward timers to simulate job progress
    await vi.advanceTimersByTimeAsync(5000);
    
    expect(updateDoc).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledWith('job.completed', expect.objectContaining({
      jobId: 'job-123',
      name: 'Test Job'
    }));
  });

  it('should prevent duplicate jobs with the same idempotency key', async () => {
    const job1 = jobScheduler.startBackgroundJob('Job 1', 'same-key');
    const job2 = jobScheduler.startBackgroundJob('Job 2', 'same-key');
    
    await job1;
    await job2;
 
    expect(addDoc).toHaveBeenCalledTimes(1);
  });
});
