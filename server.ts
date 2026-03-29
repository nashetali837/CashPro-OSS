import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // --- API Routes ---

  // Health & System Status
  app.get("/api/health", (req, res) => {
    res.json({ status: "UP", timestamp: new Date().toISOString() });
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

  // Liquidity forecast endpoint
  app.get("/api/forecast", (req, res) => {
    const days = parseInt(req.query.days as string) || 30;
    const forecast = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: 12000000 + Math.random() * 2000000 - 1000000
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
