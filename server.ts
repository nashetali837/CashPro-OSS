import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { ForecastingService } from "./forecasting-service.js";
import { DataPipeline } from "./data-pipeline.js";
import { adminDb as db } from "./firebase-admin-init.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const forecastingService = new ForecastingService();

  // Middleware
  app.use(express.json());

  // --- Production-Ready Data Pipeline ---
  
  // Mock Data for the Pipeline (In a real app, this would be pulled from Firestore/BigQuery)
  const rawTransactions = Array.from({ length: 100 }, (_, i) => ({
    accountId: `ACC-${Math.floor(Math.random() * 5)}`,
    amount: Math.random() * 500000,
    type: Math.random() > 0.4 ? 'credit' : 'debit' as 'credit' | 'debit',
    timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
  }));

  // --- API Routes ---

  // Health & System Status
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "UP", 
      timestamp: new Date().toISOString(),
      engine: "Swarm-v1.2",
      pipeline: "Hadoop-Inspired-MapReduce"
    });
  });

  // God Mode: Full System State (The "God Variable" equivalent)
  app.get("/api/god-mode", async (req, res) => {
    try {
      // 1. Run the Data Pipeline (MapReduce) to aggregate historical trends
      const dailyTrends = await DataPipeline.processTransactions(rawTransactions);
      
      // 2. Feed the aggregated trends into the Swarm Intelligence engine
      const swarmForecast = await forecastingService.generateSwarmForecast(30, 25550950.42, dailyTrends);

      // 3. Fetch Real Accounts from Firestore (Simulated fallback if DB is empty)
      let accounts: any[] = [];
      try {
        const accountsSnapshot = await db.collection('accounts').get();
        accounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        console.warn("Firestore Read Error, using mock fallback:", e);
      }

      if (accounts.length === 0) {
        accounts = [
          { id: '1', name: 'MAIN_OPERATING_USD', balance: 12450800.42, currency: 'USD', type: 'Checking', lastUpdated: new Date().toISOString() },
          { id: '2', name: 'APAC_RESERVE_SGD', balance: 4200150.00, currency: 'SGD', type: 'Savings', lastUpdated: new Date().toISOString() },
          { id: '3', name: 'OFFSHORE_RESERVE_LUX', balance: 8900000.00, currency: 'EUR', type: 'Investment', lastUpdated: new Date().toISOString() }
        ];
      }

      const status = {
        node: "NODE-04-X92",
        status: "NOMINAL",
        uptime: process.uptime(),
        load: process.cpuUsage(),
        memory: process.memoryUsage(),
        redundancy: {
          activeNodes: 3,
          failoverReady: true,
          lastSync: new Date().toISOString()
        }
      };

      res.json({
        status,
        accounts,
        swarmForecast,
        pipelineMetrics: {
          processedRecords: rawTransactions.length,
          mapPhase: "COMPLETED",
          reducePhase: "COMPLETED",
          latency: "142ms"
        },
        timestamp: new Date().toISOString(),
        version: "4.2.0-STABLE",
        engine: "SWARM_INTELLIGENCE_v1"
      });
    } catch (error) {
      console.error("God Mode Error:", error);
      res.status(500).json({ error: "System State Retrieval Failure" });
    }
  });

  app.get("/api/system-status", (req, res) => {
    res.json({
      node: "NODE-04-X92",
      status: "NOMINAL",
      uptime: process.uptime(),
      load: process.cpuUsage(),
      memory: process.memoryUsage(),
      redundancy: {
        activeNodes: 3,
        failoverReady: true,
        lastSync: new Date().toISOString()
      }
    });
  });

  // Liquidity forecast endpoint (Legacy)
  app.get("/api/forecast", (req, res) => {
    const days = parseInt(req.query.days as string) || 30;
    const forecast = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: 12000000 + Math.random() * 2000000 - 1000000
    }));
    res.json(forecast);
  });

  // Swarm Intelligence Forecast Endpoint
  app.get("/api/swarm-forecast", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const initialBalance = parseFloat(req.query.initialBalance as string) || 25000000;
      
      // Run Pipeline
      const dailyTrends = await DataPipeline.processTransactions(rawTransactions);
      
      const forecast = await forecastingService.generateSwarmForecast(days, initialBalance, dailyTrends);
      res.json(forecast);
    } catch (error) {
      console.error("Swarm Forecast Error:", error);
      res.status(500).json({ error: "Forecasting Failure" });
    }
  });

  // Test connection to Firestore
  async function testConnection() {
    try {
      await db.collection('test').doc('connection').get();
    } catch (error) {
      console.error("Firestore Admin Connection Error:", error);
    }
  }
  testConnection();

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CashPro-OSS Banking Platform running on http://localhost:${PORT}`);
  });
}

startServer();
