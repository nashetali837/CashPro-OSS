import { v4 as uuidv4 } from 'uuid';
import { collection, setDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../core/firebase-server';
import { eventBus } from '../core/EventBus';

export interface Job {
  id: string;
  name: string;
  status: 'Running' | 'Completed' | 'Failed' | 'Scheduled';
  progress: number;
  idempotencyKey: string;
}

const activeJobs: Map<string, Job> = new Map();

export class JobScheduler {
  async startBackgroundJob(name: string, idempotencyKey: string) {
    // Check if job already exists (Idempotency)
    if (activeJobs.has(idempotencyKey)) {
      console.log(`[JobScheduler] Duplicate job: ${idempotencyKey}`);
      return activeJobs.get(idempotencyKey);
    }

    const id = uuidv4();
    const job: Job = { id, name, status: 'Running', progress: 0, idempotencyKey };
    activeJobs.set(idempotencyKey, job);

    // Persist initial job state
    try {
      await setDoc(doc(db, 'jobs', id), {
        ...job,
        createdAt: Timestamp.now()
      });
    } catch (err) {
      console.error("[JobScheduler] Failed to persist job:", err);
    }

    const interval = setInterval(async () => {
      const currentJob = activeJobs.get(idempotencyKey);
      if (currentJob) {
        currentJob.progress += 10;
        if (currentJob.progress >= 100) {
          currentJob.status = 'Completed';
          currentJob.progress = 100;
          clearInterval(interval);
          console.log(`[JobScheduler] Job ${name} (${id}) completed.`);
          await eventBus.publish('job.completed', { jobId: id, name }, `job-completed-${id}`);
        }

        // Sync progress to Firestore
        try {
          await setDoc(doc(db, 'jobs', id), {
            ...currentJob,
            updatedAt: Timestamp.now()
          }, { merge: true });
        } catch (err) {
          console.error("[JobScheduler] Failed to sync job progress:", err);
        }
      }
    }, 2000);

    return job;
  }

  getActiveJobs() {
    return Array.from(activeJobs.values());
  }
}

export const jobScheduler = new JobScheduler();
