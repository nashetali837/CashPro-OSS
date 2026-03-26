import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { eventBus } from "./server/core/EventBus";
import { riskService } from "./server/services/RiskService";
import { liquidityService } from "./server/services/LiquidityService";
import { transactionService } from "./server/services/TransactionService";
import { jobScheduler } from "./server/services/JobScheduler";
import { BankSecurity } from "./server/packages/security";
import { db } from "./server/core/firebase-server";
import { adminAuth } from "./server/core/firebase-admin";
import { collection, getDocs, query, orderBy, limit, setDoc, doc } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- JWT Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Access token required" });

  const user = BankSecurity.verifyToken(token);
  if (!user) return res.status(403).json({ error: "Invalid or expired token" });

  req.user = user;
  next();
};

async function startServer() {
  // Initialize Microservices
  riskService.init();
  liquidityService.init();

  // --- Seed Firestore Data ---
  try {
    const accountsRef = collection(db, 'accounts');
    const snapshot = await getDocs(accountsRef);
    if (snapshot.empty) {
      console.log("[Seed] Initializing accounts collection...");
      const initialAccounts = [
        { id: 'acc-1', name: 'Main Operating', balance: 12500000, currency: 'USD', type: 'Checking', lastUpdated: new Date().toISOString() },
        { id: 'acc-2', name: 'APAC Reserve', balance: 4200000, currency: 'SGD', type: 'Savings', lastUpdated: new Date().toISOString() },
        { id: 'acc-3', name: 'Offshore Reserve', balance: 8900000, currency: 'USD', type: 'Investment', lastUpdated: new Date().toISOString() },
        { id: 'acc-4', name: 'Payroll Account', balance: 1500000, currency: 'USD', type: 'Liquidity', lastUpdated: new Date().toISOString() }
      ];
      for (const acc of initialAccounts) {
        await setDoc(doc(db, 'accounts', acc.id), acc);
      }
      console.log("[Seed] Accounts initialized successfully.");
    }
  } catch (err) {
    console.warn("[Seed] Failed to seed accounts (likely permission denied or offline):", err);
  }

  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // --- API Routes ---

  // Auth: Login (Simulated)
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    
    const MOCK_USER = process.env.MOCK_USERNAME || 'admin';
    const MOCK_PASS = process.env.MOCK_PASSWORD || 'bank-secure-2026';

    // In a real app, verify against DB
    if (username === MOCK_USER && password === MOCK_PASS) {
      const jwtToken = BankSecurity.generateToken({ username, role: 'ADMIN' });
      
      let firebaseCustomToken = null;
      try {
        // Generate a Firebase custom token for the client to sync with Firestore
        // Using a fixed UID for the admin for now
        firebaseCustomToken = await adminAuth.createCustomToken('admin-uid', { role: 'ADMIN' });
      } catch (err) {
        console.warn("[Auth] Failed to generate Firebase custom token, proceeding with mock token:", err);
        // Fallback mock token for UI demonstration if Firebase Admin fails
        firebaseCustomToken = "mock-firebase-token-for-demo";
      }

      res.json({ 
        token: jwtToken, 
        firebaseToken: firebaseCustomToken,
        user: { username, role: 'ADMIN' } 
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Health & System Status
  app.get("/api/health", (req, res) => {
    res.json({ status: "UP", timestamp: new Date().toISOString() });
  });

  app.get("/api/system-status", authenticateToken, (req, res) => {
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

  // Quality & Control (SonarQube simulation)
  app.get("/api/quality-metrics", authenticateToken, (req, res) => {
    res.json({
      coverage: 84.5,
      bugs: 0,
      vulnerabilities: 0,
      codeSmells: 12,
      debt: "2h",
      status: "PASSED",
      lastScan: new Date().toISOString()
    });
  });

  // Security Audit Log API
  app.get("/api/security-audit", authenticateToken, async (req, res) => {
    try {
      const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      
      if (logs.length === 0) {
        return res.json([
          { id: '1', timestamp: new Date().toISOString(), message: 'System Boot: Security Module Initialized', type: 'INFO' },
          { id: '2', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), message: 'IP Whitelist Sync: Complete', type: 'INFO' },
          { id: '3', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), message: 'Firewall Rules: Updated', type: 'INFO' }
        ]);
      }
      
      res.json(logs);
    } catch (error) {
      console.warn("[API] Firebase audit logs fetch failed, returning mock data:", error);
      res.json([
        { id: 'm1', timestamp: new Date().toISOString(), message: 'MOCK: Security Module Initialized (Firebase Offline)', type: 'INFO' },
        { id: 'm2', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), message: 'MOCK: Threat Detection Active', type: 'WARN' }
      ]);
    }
  });

  // Transactions API (Idempotent & Protected)
  app.post("/api/transactions", authenticateToken, async (req, res) => {
    const { idempotencyKey, amount, currency, fromAccount, toAccount } = req.body;
    
    if (!idempotencyKey) {
      return res.status(400).json({ error: "Idempotency-Key is required" });
    }

    try {
      const transaction = await transactionService.processTransaction({
        idempotencyKey,
        amount,
        currency,
        fromAccount,
        toAccount
      });
      res.json(transaction);
    } catch (err) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Encrypted Transaction API (High Security)
  app.post("/api/transactions/encrypted", authenticateToken, async (req, res) => {
    const { payload } = req.body;
    if (!payload) return res.status(400).json({ error: "Encrypted payload required" });

    try {
      const transaction = await transactionService.processEncryptedTransaction(payload);
      res.json(transaction);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Jobs API (Idempotent)
  app.get("/api/jobs", authenticateToken, (req, res) => {
    res.json(jobScheduler.getActiveJobs());
  });

  app.post("/api/jobs/start", authenticateToken, async (req, res) => {
    const { name, idempotencyKey } = req.body;
    const key = idempotencyKey || `job-${Date.now()}`;
    const job = await jobScheduler.startBackgroundJob(name || "Generic Treasury Job", key);
    res.json(job);
  });

  // Real-time Event Stream (SSE)
  app.get("/api/events/stream", (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    eventBus.addSseClient(res);

    req.on('close', () => {
      eventBus.removeSseClient(res);
    });
  });

  // Command execution endpoint
  app.post("/api/commands", async (req, res) => {
    const { command, payload, idempotencyKey } = req.body;
    const key = idempotencyKey || `cmd-${Date.now()}`;
    
    const event = await eventBus.publish(`command.${command}`, payload, key);
    
    res.json({
      status: "SUCCESS",
      message: `Command '${command}' queued for processing.`,
      executionId: event?.id,
      timestamp: event?.timestamp
    });
  });

  // Liquidity forecast endpoint
  app.get("/api/forecast", (req, res) => {
    const days = parseInt(req.query.days as string) || 30;
    const forecast = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      projectedBalance: 12000000 + Math.random() * 2000000 - 1000000
    }));
    res.json(forecast);
  });

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
