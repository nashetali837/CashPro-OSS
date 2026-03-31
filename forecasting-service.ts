/**
 * Swarm Intelligence Forecasting Service
 * Inspired by Particle Swarm Optimization and Boid-like behaviors.
 * This service simulates multiple "agents" representing different market scenarios
 * that converge on a liquidity forecast.
 */

export interface ForecastPoint {
  date: string;
  value: number;
  confidence: number;
}

export interface SwarmParticle {
  id: number;
  position: number;
  velocity: number;
  bestPosition: number;
}

export class ForecastingService {
  private numParticles = 50;
  private inertia = 0.5;
  private cognitiveWeight = 1.5;
  private socialWeight = 2.0;

  /**
   * Generates a forecast using a Swarm Intelligence simulation.
   * Each day's forecast is the result of particles converging on an optimal value
   * based on historical volatility and "social" pressure from other scenarios.
   * 
   * @param days Number of days to forecast
   * @param initialBalance Starting liquidity
   * @param historicalTrends Aggregated daily deltas from the data pipeline
   */
  public async generateSwarmForecast(
    days: number, 
    initialBalance: number, 
    historicalTrends: Record<string, number> = {}
  ): Promise<ForecastPoint[]> {
    const forecast: ForecastPoint[] = [];
    let currentBalance = initialBalance;

    // Calculate historical volatility from the pipeline data
    const deltas = Object.values(historicalTrends);
    const avgVolatility = deltas.length > 0 
      ? deltas.reduce((a, b) => a + Math.abs(b), 0) / deltas.length 
      : 500000;

    for (let d = 0; d < days; d++) {
      const particles: SwarmParticle[] = this.initializeSwarm(currentBalance);
      let globalBest = currentBalance;

      // Simulate swarm iterations for this specific day
      for (let iter = 0; iter < 10; iter++) {
        particles.forEach(p => {
          // Update velocity
          const r1 = Math.random();
          const r2 = Math.random();
          
          p.velocity = 
            this.inertia * p.velocity +
            this.cognitiveWeight * r1 * (p.bestPosition - p.position) +
            this.socialWeight * r2 * (globalBest - p.position);

          // Update position
          p.position += p.velocity;

          // Update personal best
          if (Math.abs(p.position - currentBalance) < Math.abs(p.bestPosition - currentBalance)) {
            p.bestPosition = p.position;
          }

          // Update global best
          if (Math.abs(p.position - currentBalance) < Math.abs(globalBest - currentBalance)) {
            globalBest = p.position;
          }
        });
      }

      // Apply historical volatility to the "market noise"
      const dailyChange = (Math.random() - 0.45) * avgVolatility;
      currentBalance = globalBest + dailyChange;

      forecast.push({
        date: new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: currentBalance,
        confidence: 0.95 - (d * 0.02)
      });
    }

    return forecast;
  }

  private initializeSwarm(center: number): SwarmParticle[] {
    return Array.from({ length: this.numParticles }, (_, i) => {
      const startPos = center + (Math.random() - 0.5) * 1000000;
      return {
        id: i,
        position: startPos,
        velocity: (Math.random() - 0.5) * 100000,
        bestPosition: startPos
      };
    });
  }
}
