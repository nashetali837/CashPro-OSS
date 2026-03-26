import { v4 as uuidv4 } from 'uuid';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase-server';

export interface Event {
  id: string;
  topic: string;
  payload: any;
  timestamp: string;
  idempotencyKey?: string;
}

export class EventBus {
  private subscribers: Map<string, ((payload: any) => void)[]> = new Map();
  private sseClients: any[] = [];
  private processedEventIds: Set<string> = new Set();

  subscribe(topic: string, callback: (payload: any) => void) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }
    this.subscribers.get(topic)?.push(callback);
    console.log(`[EventBus] Subscribed to topic: ${topic}`);
  }

  addSseClient(res: any) {
    this.sseClients.push(res);
  }

  removeSseClient(res: any) {
    this.sseClients = this.sseClients.filter(client => client !== res);
  }

  async publish(topic: string, payload: any, idempotencyKey?: string) {
    // Idempotency check
    if (idempotencyKey && this.processedEventIds.has(idempotencyKey)) {
      console.log(`[EventBus] Duplicate event ignored: ${idempotencyKey}`);
      return null;
    }
    if (idempotencyKey) this.processedEventIds.add(idempotencyKey);

    const event: Event = {
      id: uuidv4(),
      topic,
      payload,
      timestamp: new Date().toISOString(),
      idempotencyKey
    };
    
    console.log(`[EventBus] Published to ${topic}:`, event.id);
    
    // Notify local subscribers
    this.subscribers.get(topic)?.forEach(cb => cb(payload));

    // Notify SSE clients
    this.sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    // Persist to Firestore
    try {
      await addDoc(collection(db, 'events'), {
        ...event,
        serverTimestamp: Timestamp.now()
      });

      // Log security, compliance, and fraud related events to audit_logs
      if (topic.startsWith('security.') || topic.startsWith('risk.') || topic.startsWith('compliance.') || topic.startsWith('fraud.')) {
        await addDoc(collection(db, 'audit_logs'), {
          timestamp: event.timestamp,
          message: `${topic.toUpperCase()}: ${payload.message || JSON.stringify(payload)}`,
          type: topic.includes('alert') || topic.includes('error') || topic.includes('report') ? 'WARN' : 'INFO',
          eventId: event.id,
          serverTimestamp: Timestamp.now()
        });
      }
    } catch (err) {
      console.error("[EventBus] Failed to persist event:", err);
    }

    return event;
  }
}

export const eventBus = new EventBus();
