import { Readable, Transform, Writable } from 'stream';

/**
 * DataPipeline Service
 * Simulates a Hadoop-like MapReduce flow for liquidity forecasting.
 * 
 * Flow:
 * 1. Extract: Pull raw transactions (Simulated as a stream)
 * 2. Map: Transform transactions into daily liquidity deltas
 * 3. Shuffle/Sort: Group by date (Simulated in memory for this environment)
 * 4. Reduce: Aggregate deltas into a daily trend
 * 5. Load: Feed into the Swarm Intelligence engine
 */

interface RawTransaction {
  accountId: string;
  amount: number;
  type: 'credit' | 'debit';
  timestamp: string;
}

interface DailyDelta {
  date: string;
  delta: number;
}

export class DataPipeline {
  /**
   * Simulates the "Map" phase of a Hadoop job.
   * Transforms raw transactions into daily liquidity deltas.
   */
  static createMapStream() {
    return new Transform({
      objectMode: true,
      transform(transaction: RawTransaction, encoding, callback) {
        const date = transaction.timestamp.split('T')[0];
        const delta = transaction.type === 'credit' ? transaction.amount : -transaction.amount;
        this.push({ date, delta });
        callback();
      }
    });
  }

  /**
   * Simulates the "Reduce" phase of a Hadoop job.
   * Aggregates daily deltas into a single trend map.
   */
  static createReduceStream(onComplete: (result: Record<string, number>) => void) {
    const aggregates: Record<string, number> = {};
    
    return new Writable({
      objectMode: true,
      write(chunk: DailyDelta, encoding, callback) {
        aggregates[chunk.date] = (aggregates[chunk.date] || 0) + chunk.delta;
        callback();
      },
      final(callback) {
        onComplete(aggregates);
        callback();
      }
    });
  }

  /**
   * Executes the full pipeline.
   * In a real production environment, this would be a distributed Spark/Hadoop job.
   */
  static async processTransactions(transactions: RawTransaction[]): Promise<Record<string, number>> {
    return new Promise((resolve, reject) => {
      const source = Readable.from(transactions);
      const mapper = this.createMapStream();
      const reducer = this.createReduceStream((result) => resolve(result));

      source.pipe(mapper).pipe(reducer);
      
      source.on('error', reject);
      mapper.on('error', reject);
      reducer.on('error', reject);
    });
  }
}
