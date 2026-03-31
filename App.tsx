import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  Globe, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity,
  Terminal,
  Lock,
  Cpu,
  RefreshCw,
  BrainCircuit,
  Eye,
  Layers,
  Database
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { SwarmVisualizer } from './components/SwarmVisualizer';

// --- Types ---
interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  type: string;
  lastUpdated: string;
}

interface SystemStatus {
  node: string;
  status: string;
  uptime: number;
  load: { user: number; system: number };
  memory: { rss: number; heapTotal: number };
  redundancy: { activeNodes: number; failoverReady: boolean };
}

interface ForecastPoint {
  date: string;
  value: number;
  confidence: number;
}

// --- Components ---

const StatCard = ({ title, value, subValue, trend, icon: Icon }: any) => (
  <div className="bg-[#151619] border border-[#2A2D32] p-4 rounded-lg shadow-xl">
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299]">{title}</span>
      <Icon size={14} className="text-[#F27D26]" />
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-mono font-bold text-white">{value}</span>
      <span className="text-[10px] font-mono text-[#8E9299]">{subValue}</span>
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-1 mt-2 text-[10px] font-mono ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
        {trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
        {Math.abs(trend)}% vs last period
      </div>
    )}
  </div>
);

const DataRow = ({ label, value, status }: any) => (
  <div className="flex justify-between items-center py-2 border-b border-[#2A2D32] hover:bg-[#1A1D21] px-2 transition-colors cursor-pointer group">
    <span className="text-xs font-mono text-[#8E9299] group-hover:text-white">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono text-white">{value}</span>
      {status && (
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'OK' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]'}`} />
      )}
    </div>
  </div>
);

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [godModeData, setGodModeData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/god-mode');
      const data = await response.json();
      
      setGodModeData(data);
      setAccounts(data.accounts);
      setStatus(data.status);
      setForecast(data.swarmForecast);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch God Mode data:", err);
      // Fallback to mock if server is not ready
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#E4E3E0] font-sans selection:bg-[#F27D26] selection:text-black">
      {/* Sidebar Rail */}
      <div className="fixed left-0 top-0 bottom-0 w-16 bg-[#151619] border-r border-[#2A2D32] flex flex-col items-center py-6 gap-8 z-50">
        <div className="w-10 h-10 bg-[#F27D26] rounded flex items-center justify-center shadow-[0_0_20px_rgba(242,125,38,0.3)]">
          <Zap size={24} className="text-black" />
        </div>
        <nav className="flex flex-col gap-6">
          <button onClick={() => setActiveTab('overview')} className={`p-2 rounded transition-colors ${activeTab === 'overview' ? 'text-[#F27D26] bg-[#2A2D32]' : 'text-[#8E9299] hover:text-white'}`}>
            <LayoutDashboard size={20} />
          </button>
          <button onClick={() => setActiveTab('swarm')} className={`p-2 rounded transition-colors ${activeTab === 'swarm' ? 'text-[#F27D26] bg-[#2A2D32]' : 'text-[#8E9299] hover:text-white'}`}>
            <BrainCircuit size={20} />
          </button>
          <button onClick={() => setActiveTab('god')} className={`p-2 rounded transition-colors ${activeTab === 'god' ? 'text-[#F27D26] bg-[#2A2D32]' : 'text-[#8E9299] hover:text-white'}`}>
            <Eye size={20} />
          </button>
          <button onClick={() => setActiveTab('security')} className={`p-2 rounded transition-colors ${activeTab === 'security' ? 'text-[#F27D26] bg-[#2A2D32]' : 'text-[#8E9299] hover:text-white'}`}>
            <ShieldCheck size={20} />
          </button>
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <button onClick={fetchData} className="text-[#8E9299] hover:text-white">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="pl-16 pt-6 pr-6 pb-6">
        {/* Header */}
        <header className="flex justify-between items-end mb-8 border-b border-[#2A2D32] pb-4">
          <div>
            <h1 className="text-3xl font-mono font-bold tracking-tighter uppercase italic">
              CashPro<span className="text-[#F27D26]">.OSS</span>
            </h1>
            <p className="text-[10px] font-mono text-[#8E9299] mt-1 tracking-widest uppercase">
              Corporate Treasury & Liquidity Management System // v4.2.0-STABLE
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-right">
              <div className="text-[10px] font-mono text-[#8E9299] uppercase">System Time (UTC)</div>
              <div className="text-sm font-mono text-white">{new Date().toISOString().replace('T', ' ').split('.')[0]}</div>
            </div>
            <div className="h-10 w-[1px] bg-[#2A2D32]" />
            <div className="flex items-center gap-2 bg-[#151619] border border-[#2A2D32] px-3 py-1.5 rounded">
              <Activity size={14} className="text-green-400" />
              <span className="text-xs font-mono text-white">NOMINAL</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-12 gap-6"
            >
              <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Liquidity (USD)" value="$25.5M" subValue=".00" trend={+4.2} icon={Zap} />
                <StatCard title="Active Accounts" value={accounts.length} subValue="Nodes" trend={0} icon={LayoutDashboard} />
                <StatCard title="Risk Exposure" value="LOW" subValue="0.04%" trend={-1.2} icon={ShieldCheck} />
                <StatCard title="Avg. Settlement" value="0.4s" subValue="ms" trend={+12.5} icon={Activity} />
              </div>

              <div className="col-span-12 lg:col-span-8 bg-[#151619] border border-[#2A2D32] p-6 rounded-lg shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#8E9299] flex items-center gap-2">
                    <BarChart3 size={14} /> 14-Day Liquidity Forecast
                  </h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast.slice(0, 14)}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F27D26" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#F27D26" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2D32" vertical={false} />
                      <XAxis dataKey="date" stroke="#8E9299" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#8E9299" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} />
                      <Tooltip contentStyle={{ backgroundColor: '#151619', border: '1px solid #2A2D32', fontSize: '12px' }} itemStyle={{ color: '#F27D26' }} />
                      <Area type="monotone" dataKey="value" stroke="#F27D26" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 bg-[#151619] border border-[#2A2D32] p-6 rounded-lg shadow-xl">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#8E9299] mb-6 flex items-center gap-2">
                  <Globe size={14} /> Global Accounts
                </h3>
                <div className="space-y-1">
                  {accounts.map((acc) => (
                    <div key={acc.id} className="group p-3 border-b border-[#2A2D32] hover:bg-[#1A1D21] transition-colors cursor-pointer">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[11px] font-mono text-white font-bold">{acc.name}</span>
                        <span className="text-[10px] font-mono text-[#F27D26]">{acc.currency}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-mono text-[#E4E3E0]">${acc.balance.toLocaleString()}</span>
                        <span className="text-[9px] font-mono text-[#8E9299] uppercase">{acc.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'swarm' && (
            <motion.div 
              key="swarm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="grid grid-cols-12 gap-6"
            >
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="bg-[#151619] border border-[#2A2D32] p-6 rounded-lg shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-widest text-[#8E9299] flex items-center gap-2">
                        <BrainCircuit size={14} /> Swarm Intelligence Engine
                      </h3>
                      <p className="text-[10px] font-mono text-[#F27D26] mt-1">
                        PIPELINE: HADOOP-MAPREDUCE // CONVERGENCE: {(godModeData?.swarmForecast?.[0]?.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-right">
                        <div className="text-[8px] font-mono text-[#8E9299] uppercase">Map Phase</div>
                        <div className="text-[10px] font-mono text-green-400">COMPLETED</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] font-mono text-[#8E9299] uppercase">Reduce Phase</div>
                        <div className="text-[10px] font-mono text-green-400">COMPLETED</div>
                      </div>
                    </div>
                  </div>
                  <div className="h-[400px]">
                    <SwarmVisualizer data={forecast} />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <StatCard title="Pipeline Latency" value={godModeData?.pipelineMetrics?.latency || "142ms"} subValue="REALTIME" icon={Zap} />
                  <StatCard title="Records Processed" value={godModeData?.pipelineMetrics?.processedRecords || "100"} subValue="TXNS" icon={Database} />
                  <StatCard title="Swarm Confidence" value={`${(godModeData?.swarmForecast?.[0]?.confidence * 100).toFixed(1)}%`} subValue="SIGMA" icon={ShieldCheck} />
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 bg-[#151619] border border-[#2A2D32] p-6 rounded-lg shadow-xl">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#8E9299] mb-6 flex items-center gap-2">
                  <Terminal size={14} /> Swarm Logs
                </h3>
                <div className="text-[10px] font-mono space-y-2 text-green-400/70 overflow-y-auto max-h-[500px]">
                  <p>[OK] Initializing Swarm Nodes...</p>
                  <p>[OK] Loading Historical Volatility Matrix</p>
                  <p>[OK] Applying Social Weight: 2.0</p>
                  <p>[OK] Applying Cognitive Weight: 1.5</p>
                  {forecast.map((f, i) => (
                    <p key={i} className={i % 5 === 0 ? "text-white" : ""}>
                      {`> Day ${i+1}: Converged at $${(f.value/1000000).toFixed(2)}M (Confidence: ${(f.confidence*100).toFixed(1)}%)`}
                    </p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'god' && (
            <motion.div 
              key="god"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-12 gap-6"
            >
              {/* Liquidity Intelligence "God Mode" View */}
              <div className="col-span-12 bg-[#050505] border border-[#F27D26]/30 p-8 rounded-lg shadow-[0_0_50px_rgba(242,125,38,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Eye size={200} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <h2 className="text-4xl font-mono font-bold tracking-tighter text-white uppercase italic">
                        Liquidity<span className="text-[#F27D26]">.Intelligence</span>
                      </h2>
                      <p className="text-xs font-mono text-[#8E9299] mt-2 tracking-[0.2em] uppercase">
                        Unified Global Treasury Command // God Mode Active
                      </p>
                    </div>
                    <div className="flex gap-8">
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-[#8E9299] uppercase">Engine</div>
                        <div className="text-xl font-mono text-white">SWARM_v1.0</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-[#8E9299] uppercase">Global Balance</div>
                        <div className="text-xl font-mono text-[#F27D26]">$25,550,950.42</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
                    <div className="p-4 bg-[#151619] border border-[#2A2D32] rounded">
                      <div className="text-[10px] font-mono text-[#8E9299] mb-1">CASH_ON_HAND</div>
                      <div className="text-lg font-mono text-white">$12.4M</div>
                    </div>
                    <div className="p-4 bg-[#151619] border border-[#2A2D32] rounded">
                      <div className="text-[10px] font-mono text-[#8E9299] mb-1">INVESTED_CAPITAL</div>
                      <div className="text-lg font-mono text-white">$8.9M</div>
                    </div>
                    <div className="p-4 bg-[#151619] border border-[#2A2D32] rounded">
                      <div className="text-[10px] font-mono text-[#8E9299] mb-1">RESERVE_FUNDS</div>
                      <div className="text-lg font-mono text-white">$4.2M</div>
                    </div>
                    <div className="p-4 bg-[#151619] border border-[#2A2D32] rounded">
                      <div className="text-[10px] font-mono text-[#8E9299] mb-1">FORECAST_30D</div>
                      <div className="text-lg font-mono text-green-400">+$2.1M</div>
                    </div>
                    <div className="p-4 bg-[#151619] border border-[#2A2D32] rounded">
                      <div className="text-[10px] font-mono text-[#8E9299] mb-1">SYSTEM_HEALTH</div>
                      <div className="text-lg font-mono text-[#F27D26]">OPTIMAL</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-7">
                      <h3 className="text-xs font-mono uppercase tracking-widest text-[#8E9299] mb-4 flex items-center gap-2">
                        <Activity size={14} /> Real-time Scenario Convergence
                      </h3>
                      <div className="h-[300px] bg-[#151619] rounded border border-[#2A2D32] p-4">
                         <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={forecast}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2A2D32" vertical={false} />
                            <XAxis dataKey="date" hide />
                            <YAxis hide domain={['auto', 'auto']} />
                            <Tooltip contentStyle={{ backgroundColor: '#050505', border: '1px solid #F27D26', fontSize: '10px' }} />
                            <Area type="step" dataKey="value" stroke="#F27D26" fill="#F27D26" fillOpacity={0.1} />
                          </AreaChart>
                         </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="col-span-12 lg:col-span-5 space-y-4">
                      <h3 className="text-xs font-mono uppercase tracking-widest text-[#8E9299] mb-4 flex items-center gap-2">
                        <Database size={14} /> Global Ledger Nodes
                      </h3>
                      {accounts.map(acc => (
                        <div key={acc.id} className="flex justify-between items-center p-3 bg-[#151619] border-l-2 border-[#F27D26] rounded-r">
                          <div>
                            <div className="text-[11px] font-mono text-white">{acc.name}</div>
                            <div className="text-[9px] font-mono text-[#8E9299]">{acc.id} // {acc.type}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono text-white">${acc.balance.toLocaleString()}</div>
                            <div className="text-[9px] font-mono text-green-400">SYNCED</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-16 right-0 h-8 bg-[#151619] border-t border-[#2A2D32] flex items-center px-4 justify-between z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[9px] font-mono text-[#8E9299] uppercase tracking-widest">Gateway: dal10-prod-01</span>
          </div>
          <div className="h-4 w-[1px] bg-[#2A2D32]" />
          <span className="text-[9px] font-mono text-[#8E9299] uppercase tracking-widest">Encryption: AES-256-GCM</span>
          <div className="h-4 w-[1px] bg-[#2A2D32]" />
          <span className="text-[9px] font-mono text-[#F27D26] uppercase tracking-widest">Engine: Swarm Intelligence v1.0</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-[#8E9299] uppercase tracking-widest">User: nashetaliaiexpert@gmail.com</span>
          <Lock size={10} className="text-[#F27D26]" />
        </div>
      </footer>
    </div>
  );
}
