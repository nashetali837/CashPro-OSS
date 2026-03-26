import React, { useState, useEffect, Component, ReactNode } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  History, 
  Settings, 
  Search, 
  Bell, 
  Terminal,
  Cpu,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  Menu,
  X,
  Activity,
  Database,
  Share2,
  Zap,
  Play,
  RefreshCw,
  LogOut,
  Fingerprint,
  ShieldAlert,
  Shield,
  CheckCircle2,
  QrCode,
  Camera,
  HelpCircle,
  Globe,
  ChevronDown
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Account, Transaction, CashFlowData, SystemJob } from './types';
import { GoogleGenAI } from "@google/genai";
import { db, auth } from './firebase';
import { collection, onSnapshot, query, orderBy, limit, doc, getDocFromServer, setDoc, Timestamp, addDoc } from 'firebase/firestore';
import { signInWithCustomToken, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import CryptoJS from 'crypto-js';

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends Component<any, any> {
  public state: any;
  public props: any;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      if (this.state.error && this.state.error.message) {
        try {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) errorMessage = `Security Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path}`;
        } catch (e) {
          errorMessage = this.state.error.message || errorMessage;
        }
      }

      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-8 text-center">
          <ShieldAlert size={48} className="text-red-600 mb-4" />
          <h1 className="text-2xl font-bold text-red-900 mb-2">Application Error</h1>
          <p className="text-red-700 max-w-md mb-6">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
          >
            Reload Platform
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Mock Data (Fallback) ---
const MOCK_ACCOUNTS: Account[] = [
  { id: '1', name: 'Main Operating', number: '**** 8829', balance: 1245000.50, currency: 'USD', type: 'Checking' },
  { id: '2', name: 'Global Treasury', number: '**** 4410', balance: 8420000.00, currency: 'USD', type: 'Liquidity' },
  { id: '3', name: 'EMEA Payroll', number: '**** 1102', balance: 450000.00, currency: 'EUR', type: 'Savings' },
  { id: '4', name: 'APAC Reserve', number: '**** 9938', balance: 2100000.00, currency: 'SGD', type: 'Investment' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2026-03-26', description: 'Vendor Payment: AWS Cloud', amount: -12400.00, status: 'Completed', category: 'Infrastructure', accountName: 'Main Operating' },
  { id: 't2', date: '2026-03-25', description: 'Client Inbound: Acme Corp', amount: 45000.00, status: 'Completed', category: 'Sales', accountName: 'Global Treasury' },
  { id: 't3', date: '2026-03-25', description: 'Internal Transfer: Reserve', amount: -100000.00, status: 'Pending', category: 'Transfer', accountName: 'Main Operating' },
  { id: 't4', date: '2026-03-24', description: 'Dividend Payout', amount: -5000.00, status: 'Completed', category: 'Investment', accountName: 'APAC Reserve' },
  { id: 't5', date: '2026-03-23', description: 'Stripe Settlement', amount: 8200.50, status: 'Completed', category: 'Sales', accountName: 'Main Operating' },
];

const MOCK_CASHFLOW: CashFlowData[] = [
  { name: 'Mon', inflow: 4000, outflow: 2400 },
  { name: 'Tue', inflow: 3000, outflow: 1398 },
  { name: 'Wed', inflow: 2000, outflow: 9800 },
  { name: 'Thu', inflow: 2780, outflow: 3908 },
  { name: 'Fri', inflow: 1890, outflow: 4800 },
  { name: 'Sat', inflow: 2390, outflow: 3800 },
  { name: 'Sun', inflow: 3490, outflow: 4300 },
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 text-sm transition-all border-b border-[var(--color-line)]",
      active ? "bg-[var(--color-ink)] text-[var(--color-bg)]" : "hover:bg-white/50"
    )}
  >
    <Icon size={18} />
    <span className="font-medium tracking-tight uppercase text-[11px]">{label}</span>
  </button>
);

const StatCard = ({ title, value, subValue, trend }: { title: string, value: string, subValue?: string, trend?: 'up' | 'down' }) => (
  <div className="data-cell bg-white/30 flex flex-col justify-between min-h-[140px]">
    <div>
      <h3 className="italic font-serif text-[11px] opacity-50 uppercase tracking-widest mb-2">{title}</h3>
      <p className="text-2xl font-mono tracking-tighter">{value}</p>
    </div>
    {subValue && (
      <div className="flex items-center justify-between mt-4">
        <span className="text-[10px] opacity-60 font-mono">{subValue}</span>
        {trend && (
          <span className={cn(
            "text-[10px] font-mono px-1.5 py-0.5 rounded",
            trend === 'up' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {trend === 'up' ? '↑' : '↓'} 12.4%
          </span>
        )}
      </div>
    )}
  </div>
);

const TopologyNode = ({ icon: Icon, label, status, active }: { icon: any, label: string, status: string, active?: boolean }) => (
  <div className={cn(
    "flex flex-col items-center gap-2 p-4 border border-[var(--color-line)] bg-white/40 min-w-[120px]",
    active && "ring-2 ring-[var(--color-ink)] bg-white/80"
  )}>
    <div className={cn(
      "w-10 h-10 flex items-center justify-center border border-[var(--color-line)]",
      active ? "bg-[var(--color-ink)] text-[var(--color-bg)]" : "bg-white"
    )}>
      <Icon size={20} />
    </div>
    <span className="text-[10px] font-bold uppercase text-center">{label}</span>
    <span className="text-[8px] mono opacity-50 uppercase">{status}</span>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('bank_token'));
  const [user, setUser] = useState<any>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [qrSessionId] = useState(`sess-${Math.random().toString(36).substr(2, 9)}`);

  // Real-time Data State
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [jobs, setJobs] = useState<SystemJob[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [qualityMetrics, setQualityMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [lastEvent, setLastEvent] = useState<any>(null);

  // --- QR Scanning Logic ---
  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          console.log(`[QR] Scan success: ${decodedText}`);
          // In a real app, we'd verify the QR token with the backend
          // For this demo, any valid-looking QR logs us in
          if (decodedText.startsWith('bank-auth-')) {
            handleLogin(undefined, 'admin', 'bank-secure-2026');
            setIsScanning(false);
            scanner.clear();
          }
        },
        (error) => {
          // console.warn(`[QR] Scan error: ${error}`);
        }
      );

      return () => {
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      };
    }
  }, [isScanning]);

  // --- Auth Logic ---
  const handleLogin = async (e?: React.FormEvent, qrUsername?: string, qrPassword?: string) => {
    if (e) e.preventDefault();
    
    let username = qrUsername;
    let password = qrPassword;

    if (!username || !password) {
      const formData = new FormData(e?.target as HTMLFormElement);
      username = formData.get('username') as string;
      password = formData.get('password') as string;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('bank_token', data.token);
        
        // Firebase Auth with Custom Token
        if (data.firebaseToken) {
          try {
            if (data.firebaseToken === "mock-firebase-token-for-demo") {
              console.warn("[Auth] Using mock Firebase token (Demo Mode). Attempting anonymous sign-in for Firestore access.");
              // Fallback to anonymous sign-in so we have a valid request.auth for Firestore rules
              try {
                await signInAnonymously(auth);
                console.log("[Auth] Signed in anonymously for demo mode");
              } catch (anonErr: any) {
                if (anonErr.code === 'auth/admin-restricted-operation') {
                  console.warn("[Auth] Anonymous sign-in is disabled in your Firebase Console. Please enable it under Authentication > Sign-in method.");
                } else {
                  console.error("[Auth] Anonymous sign-in failed:", anonErr);
                }
              }
            } else {
              await signInWithCustomToken(auth, data.firebaseToken);
              console.log("[Auth] Firebase authenticated successfully");
            }
          } catch (fbErr) {
            console.error("[Auth] Firebase auth failed:", fbErr);
            // Even if custom token fails, try anonymous as last resort
            try {
              await signInAnonymously(auth);
              console.log("[Auth] Fallback anonymous sign-in successful");
            } catch (anonErr) {
              console.error("[Auth] All Firebase auth methods failed:", anonErr);
            }
          }
        }
        
        setLoginError('');
      } else {
        setLoginError(data.error);
      }
    } catch (err) {
      setLoginError('Connection failed');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bank_token');
  };

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        console.log("[Auth] Firebase user state changed: Authenticated", user.uid);
      } else {
        console.log("[Auth] Firebase user state changed: Unauthenticated");
      }
    });
    return () => unsubscribe();
  }, []);

  // Event Stream (SSE)
  useEffect(() => {
    const eventSource = new EventSource('/api/events/stream');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents(prev => [data, ...prev].slice(0, 50));
      setLastEvent(data);
      
      // Clear last event after a few seconds for visual feedback
      setTimeout(() => setLastEvent(null), 3000);
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  // Firestore Sync - Only start when authenticated
  useEffect(() => {
    if (!firebaseUser) return;

    const pathAccounts = 'accounts';
    const unsubAccounts = onSnapshot(collection(db, pathAccounts), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      if (data.length > 0) setAccounts(data);
    }, (error) => {
      console.warn(`[Firestore] Failed to sync ${pathAccounts}:`, error.message);
      if (!error.message.includes('permissions')) {
        handleFirestoreError(error, OperationType.LIST, pathAccounts);
      }
    });

    const pathTransactions = 'transactions';
    const unsubTransactions = onSnapshot(
      query(collection(db, pathTransactions), orderBy('date', 'desc'), limit(10)), 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        if (data.length > 0) setTransactions(data);
      }, (error) => {
        console.warn(`[Firestore] Failed to sync ${pathTransactions}:`, error.message);
        if (!error.message.includes('permissions')) {
          handleFirestoreError(error, OperationType.LIST, pathTransactions);
        }
      }
    );

    const pathJobs = 'jobs';
    const unsubJobs = onSnapshot(collection(db, pathJobs), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemJob));
      if (data.length > 0) setJobs(data);
    }, (error) => {
      console.warn(`[Firestore] Failed to sync ${pathJobs}:`, error.message);
      if (!error.message.includes('permissions')) {
        handleFirestoreError(error, OperationType.LIST, pathJobs);
      }
    });

    return () => {
      unsubAccounts();
      unsubTransactions();
      unsubJobs();
    };
  }, [firebaseUser]);

  // Initial Auth Check (No automatic anonymous sign-in on mount to avoid console errors)
  useEffect(() => {
    const initAuth = async () => {
      if (!firebaseUser && !token) {
        // We don't try to sign in anonymously here anymore to avoid the 'auth/admin-restricted-operation' error
        // if the user hasn't enabled it in the Firebase Console.
        // The Firestore listeners will just wait or log a permission warning until the user logs in.
        console.log("[Auth] Waiting for user login or Firebase auth state change...");
      }
    };
    initAuth();
  }, [token, firebaseUser]);

  // Backend Polling (Status & Quality)
  useEffect(() => {
    if (!token) return;

    const fetchStatus = async () => {
      const headers = { 'Authorization': `Bearer ${token}` };
      try {
        const [statusRes, qualityRes, auditRes] = await Promise.all([
          fetch('/api/system-status', { headers }),
          fetch('/api/quality-metrics', { headers }),
          fetch('/api/security-audit', { headers })
        ]);

        if (statusRes.status === 401 || statusRes.status === 403) {
          handleLogout();
          return;
        }

        const safeJson = async (res: Response) => {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return await res.json();
          }
          return null;
        };

        const statusData = await safeJson(statusRes);
        const qualityData = await safeJson(qualityRes);
        const auditData = await safeJson(auditRes);

        if (statusData) setSystemStatus(statusData);
        if (qualityData) setQualityMetrics(qualityData);
        if (auditData) setAuditLogs(auditData);
      } catch (err) {
        console.error("Failed to fetch system status", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;

    setIsAiLoading(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        console.warn("[AI] Gemini API Key missing or placeholder, using mock response.");
        setTimeout(() => {
          setAiResponse(`**MOCK RESPONSE (No API Key)**\n\nBased on your query: "${aiMessage}", the Treasury Intelligence system suggests maintaining a 15% liquidity buffer in your APAC Reserve account due to projected volatility in the SGD market next week.`);
          setIsAiLoading(false);
          setAiMessage('');
        }, 1500);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are the CashPro-OSS Treasury Assistant. 
        Current context: User has ${accounts.length} accounts with total balance of ~$${accounts.reduce((a, b) => a + b.balance, 0).toLocaleString()} USD. 
        System Status: ${systemStatus?.status || 'Unknown'}.
        User question: ${aiMessage}`,
        config: {
          systemInstruction: "Be concise, professional, and technical. Use markdown for formatting. Focus on liquidity and risk management."
        }
      });
      setAiResponse(response.text || "No response from assistant.");
    } catch (err) {
      console.error(err);
      setAiResponse("Error connecting to Treasury Intelligence.");
    } finally {
      setIsAiLoading(false);
      setAiMessage('');
    }
  };

  const startJob = async (name: string) => {
    if (!token) return;
    await fetch('/api/jobs/start', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });
  };

  const sendEncryptedTransaction = async () => {
    if (!token) return;
    
    const payload = {
      amount: 50000,
      currency: 'USD',
      fromAccount: 'Main Operating',
      toAccount: 'Offshore Reserve',
      idempotencyKey: `enc-${Date.now()}`
    };

    // Encrypt using the same key as the backend (simulated)
    const ENCRYPTION_KEY = 'bank-payload-encryption-key-32';
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), ENCRYPTION_KEY).toString();

    try {
      const res = await fetch('/api/transactions/encrypted', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payload: encrypted })
      });
      if (res.ok) {
        alert("Encrypted transaction processed successfully");
        
        // Also log to Firestore for audit
        const path = 'audit_logs';
        try {
          await addDoc(collection(db, path), {
            message: `Encrypted transaction executed: $50,000.00`,
            type: 'INFO',
            timestamp: new Date().toISOString(),
            uid: auth.currentUser?.uid
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    } catch (err) {
      console.error("Encrypted transaction failed:", err);
    }
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const amount = parseFloat(formData.get('amount') as string);
    const toAccount = formData.get('toAccount') as string;
    const fromAccount = formData.get('fromAccount') as string;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount,
          currency: 'USD',
          fromAccount,
          toAccount,
          idempotencyKey: `pay-${Date.now()}`
        })
      });
      if (res.ok) {
        alert("Payment initiated successfully");
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error("Payment failed:", err);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans text-[#141414]">
        {/* Header */}
        <header className="w-full px-8 py-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[#004A99] font-black text-xl tracking-tighter">BANK OF AMERICA</span>
              <div className="w-[2px] h-6 bg-gray-200 mx-2" />
              <span className="text-[#004A99] text-2xl font-light">CashPro<sup className="text-[10px] ml-1">®</sup></span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#004A99]">
            <div className="flex items-center gap-2 cursor-pointer hover:underline">
              <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-5 h-auto" />
              <span>India</span>
              <ChevronDown size={14} />
            </div>
            <div className="flex items-center gap-2 cursor-pointer hover:underline">
              <span>English (US)</span>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div 
          className="flex-1 bg-cover bg-center relative flex items-center px-20"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop')` }}
        >
          <div className="absolute inset-0 bg-black/10" />
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative z-10 bg-white w-full max-w-[900px] shadow-2xl flex min-h-[500px]"
          >
            {/* Left Side: Form */}
            <div className="flex-1 p-10 border-r border-gray-100">
              <h2 className="text-2xl font-light mb-8 text-[#004A99]">Sign In</h2>
              <h3 className="text-lg font-medium mb-6 text-[#004A99]">With Your User ID</h3>
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Company ID</label>
                  <input 
                    name="companyId"
                    type="text" 
                    className="w-full p-2 border border-gray-300 focus:border-[#004A99] focus:outline-none transition-colors"
                    required
                  />
                  <div className="flex items-center gap-1 mt-1 text-[#D32F2F] text-xs">
                    <ShieldAlert size={14} />
                    <span>Company ID is required.</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">User ID</label>
                  <input 
                    name="username"
                    type="text" 
                    defaultValue="admin"
                    className="w-full p-2 border border-gray-300 focus:border-[#004A99] focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Password</label>
                  <input 
                    name="password"
                    type="password" 
                    defaultValue="bank-secure-2026"
                    className="w-full p-2 border border-gray-300 focus:border-[#004A99] focus:outline-none transition-colors"
                    required
                  />
                </div>

                {loginError && <p className="text-[#D32F2F] text-xs font-medium">{loginError}</p>}

                <div className="flex items-center gap-6 pt-4">
                  <button 
                    type="submit"
                    className="bg-[#F5F5F5] border border-gray-300 px-8 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Sign in
                  </button>
                  <button type="button" className="text-[#004A99] text-sm hover:underline">
                    Sign in assistance
                  </button>
                </div>
              </form>
            </div>

            {/* Separator */}
            <div className="relative flex flex-col items-center justify-center">
              <div className="absolute h-full w-[1px] bg-gray-200" />
              <div className="relative z-10 bg-white py-4 px-2 text-xs font-medium text-gray-400">
                OR
              </div>
            </div>

            {/* Right Side: QR */}
            <div className="flex-1 p-10 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 mb-8">
                <h3 className="text-lg font-medium text-[#004A99]">With a QR Code</h3>
                <HelpCircle size={18} className="text-[#004A99] cursor-pointer" />
              </div>

              <div className="relative mb-8">
                <div className="p-4 bg-white border border-gray-100 shadow-sm">
                  <QRCodeCanvas 
                    value={`bank-auth-${qrSessionId}`} 
                    size={140}
                    level="H"
                    fgColor="#004A99"
                  />
                </div>
                <div className="absolute -right-8 -bottom-4 w-16 h-24 bg-white border border-gray-200 rounded-lg shadow-lg flex items-center justify-center">
                   <div className="w-12 h-20 border-2 border-[#004A99] rounded-md flex items-center justify-center">
                      <div className="w-8 h-8 border border-dashed border-[#004A99] opacity-50" />
                   </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-8 max-w-[200px]">
                Use the CashPro App camera to sign in.
              </p>

              <button 
                type="button"
                onClick={() => setIsScanning(true)}
                className="border border-[#004A99] text-[#004A99] px-8 py-2 text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                Sign in with QR
              </button>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="bg-[#141414] text-white p-4 text-[10px] text-center opacity-80">
          <p>© 2026 Bank of America Corporation. All rights reserved. Authorized users only.</p>
        </footer>

        {isScanning && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white p-8 relative">
              <button 
                onClick={() => setIsScanning(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100"
              >
                <X size={24} />
              </button>
              <h2 className="text-xl font-light mb-8 text-center text-[#004A99]">Secure Badge Scanner</h2>
              <div id="qr-reader" className="w-full overflow-hidden border border-gray-200" />
              <div className="mt-6 flex flex-col items-center gap-4">
                <p className="text-xs text-center text-gray-500">Position your physical badge or mobile QR within the frame</p>
                <button 
                  onClick={() => handleLogin(undefined, 'admin', 'bank-secure-2026')}
                  className="text-[10px] text-[#004A99] underline opacity-50 hover:opacity-100"
                >
                  [ Simulate Successful Scan ]
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 240 : 64 }}
        className="border-r border-[var(--color-line)] bg-[var(--color-bg)] flex flex-col z-20"
      >
        <div className="p-4 border-b border-[var(--color-line)] flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[var(--color-ink)] flex items-center justify-center">
                <Terminal size={14} className="text-[var(--color-bg)]" />
              </div>
              <span className="font-bold tracking-tighter text-lg">CASHPRO-OSS</span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-white/50">
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Activity} label="Topology" active={activeTab === 'topology'} onClick={() => setActiveTab('topology')} />
          <SidebarItem icon={ArrowUpRight} label="Payments" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
          <SidebarItem icon={Wallet} label="Liquidity" active={activeTab === 'liquidity'} onClick={() => setActiveTab('liquidity')} />
          <SidebarItem icon={History} label="Reporting" active={activeTab === 'reporting'} onClick={() => setActiveTab('reporting')} />
          <SidebarItem icon={ShieldCheck} label="Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
          <SidebarItem icon={Settings} label="System" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4 border-t border-[var(--color-line)] bg-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-300 border border-[var(--color-line)]" />
              {isSidebarOpen && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase">Treasury Admin</span>
                  <span className="text-[9px] opacity-50 mono">{systemStatus?.node || 'OFFLINE'}</span>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button onClick={handleLogout} className="p-2 hover:bg-red-50 text-red-600 transition-colors">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-[var(--color-line)] bg-white/30 backdrop-blur-sm flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
              <input 
                type="text" 
                placeholder="Search transactions, accounts, or commands..." 
                className="w-full pl-10 pr-4 py-1.5 bg-transparent border border-[var(--color-line)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 border border-[var(--color-line)] bg-green-50">
              <Cpu size={14} className="text-green-600" />
              <span className="text-[10px] font-mono text-green-700 uppercase">
                {systemStatus?.status || 'Connecting...'}
              </span>
            </div>
            <button className="p-2 hover:bg-white/50 relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[var(--color-bg)]" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 data-grid mb-8">
                  <StatCard 
                    title="Total Cash Position" 
                    value={`${accounts.reduce((a, b) => a + b.balance, 0).toLocaleString()}`} 
                    subValue={`Across ${accounts.length} accounts`} 
                    trend="up" 
                  />
                  <StatCard title="Active Jobs" value={jobs.filter(j => j.status === 'Running').length.toString()} subValue="Background processing" />
                  <StatCard title="Forecasted Liquidity" value="$14,500,000.00" subValue="+18.5% next 30d" trend="up" />
                  <StatCard title="Risk Exposure" value="LOW" subValue="No flagged activity" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="xl:col-span-2 flex flex-col gap-8">
                    {/* Cash Flow Chart */}
                    <div className="border border-[var(--color-line)] bg-white/40 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="font-serif italic text-sm uppercase tracking-widest">Cash Flow Analysis</h2>
                        <div className="flex gap-2">
                          {['7D', '30D', '90D'].map(t => (
                            <button key={t} className={cn("px-3 py-1 text-[10px] mono border border-[var(--color-line)]", t === '7D' ? "bg-[var(--color-ink)] text-[var(--color-bg)]" : "hover:bg-white")}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={MOCK_CASHFLOW}>
                            <defs>
                              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#141414" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#141414" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141420" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontFamily: 'monospace'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontFamily: 'monospace'}} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#141414', color: '#E4E3E0', border: 'none', borderRadius: '0', fontSize: '12px', fontFamily: 'monospace' }}
                            />
                            <Area type="monotone" dataKey="inflow" stroke="#141414" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
                            <Area type="monotone" dataKey="outflow" stroke="#141414" strokeDasharray="5 5" fill="transparent" strokeWidth={1} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="border border-[var(--color-line)] bg-white/40">
                      <div className="p-4 border-b border-[var(--color-line)] flex items-center justify-between">
                        <h2 className="font-serif italic text-sm uppercase tracking-widest">Recent Transactions</h2>
                        <button className="text-[10px] uppercase font-bold flex items-center gap-1 hover:underline">
                          View All <ChevronRight size={12} />
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[var(--color-line)] bg-black/5">
                              <th className="p-4 text-[10px] uppercase font-serif italic opacity-50">Date</th>
                              <th className="p-4 text-[10px] uppercase font-serif italic opacity-50">Description</th>
                              <th className="p-4 text-[10px] uppercase font-serif italic opacity-50">Account</th>
                              <th className="p-4 text-[10px] uppercase font-serif italic opacity-50">Category</th>
                              <th className="p-4 text-[10px] uppercase font-serif italic opacity-50 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((tx) => (
                              <tr key={tx.id} className="border-b border-[var(--color-line)] hover:bg-white/50 transition-colors cursor-pointer group">
                                <td className="p-4 text-xs mono">{tx.date}</td>
                                <td className="p-4 text-xs font-medium">{tx.description}</td>
                                <td className="p-4 text-xs opacity-60">{tx.accountName}</td>
                                <td className="p-4">
                                  <span className="text-[9px] px-2 py-0.5 border border-[var(--color-line)] uppercase mono">
                                    {tx.category}
                                  </span>
                                </td>
                                <td className={cn(
                                  "p-4 text-xs text-right mono font-bold",
                                  tx.amount < 0 ? "text-red-600" : "text-green-600"
                                )}>
                                  {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-8">
                    {/* Treasury Intelligence */}
                    <div className="border border-[var(--color-line)] bg-[var(--color-ink)] text-[var(--color-bg)] p-6 flex flex-col h-[400px]">
                      <div className="flex items-center gap-2 mb-6">
                        <MessageSquare size={18} />
                        <h2 className="font-serif italic text-sm uppercase tracking-widest">Intelligence</h2>
                      </div>
                      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                        <div className="bg-white/10 p-3 text-xs border-l-2 border-[var(--color-bg)]">
                          System online. Monitoring {accounts.length} accounts.
                        </div>
                        {aiResponse && (
                          <div className="bg-white/5 p-3 text-xs border-l-2 border-blue-400">
                            <div className="prose prose-invert prose-xs">{aiResponse}</div>
                          </div>
                        )}
                        {isAiLoading && (
                          <div className="flex items-center gap-2 text-[10px] mono opacity-50 animate-pulse">
                            <Terminal size={12} /> Processing...
                          </div>
                        )}
                      </div>
                      <form onSubmit={handleAiAsk} className="mt-auto">
                        <div className="relative">
                          <input 
                            type="text" 
                            value={aiMessage}
                            onChange={(e) => setAiMessage(e.target.value)}
                            placeholder="Ask..." 
                            className="w-full bg-transparent border border-[var(--bg)]/30 p-3 text-xs focus:outline-none focus:border-[var(--bg)]"
                          />
                          <button type="submit" disabled={isAiLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10">
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Active Jobs */}
                    <div className="border border-[var(--color-line)] bg-white/40 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="font-serif italic text-sm uppercase tracking-widest">System Jobs</h2>
                        <button 
                          onClick={() => startJob("Liquidity Forecast")}
                          className="p-1 hover:bg-white border border-[var(--color-line)]"
                        >
                          <Play size={14} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {jobs.length === 0 && <p className="text-[10px] opacity-40 italic">No active jobs</p>}
                        {jobs.map(job => (
                          <div key={job.id} className="p-3 border border-[var(--color-line)] bg-white/50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold uppercase">{job.name}</span>
                              <span className={cn(
                                "text-[8px] px-1 border border-[var(--color-line)] uppercase",
                                job.status === 'Running' ? "bg-blue-50 text-blue-600 animate-pulse" : "bg-green-50 text-green-600"
                              )}>
                                {job.status}
                              </span>
                            </div>
                            <div className="w-full bg-black/10 h-1">
                              <div 
                                className="bg-[var(--color-ink)] h-full transition-all duration-500" 
                                style={{ width: `${job.progress}%` }} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div 
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Quality Metrics */}
                    <div className="border border-[var(--color-line)] bg-white/40 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="font-serif italic text-sm uppercase tracking-widest">SonarQube Quality Gate</h2>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 border border-[var(--color-line)] uppercase",
                          qualityMetrics?.status === 'PASSED' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {qualityMetrics?.status || 'SCANNING...'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Coverage', value: `${qualityMetrics?.coverage}%`, color: 'text-blue-600' },
                          { label: 'Bugs', value: qualityMetrics?.bugs, color: 'text-green-600' },
                          { label: 'Vulnerabilities', value: qualityMetrics?.vulnerabilities, color: 'text-green-600' },
                          { label: 'Code Smells', value: qualityMetrics?.codeSmells, color: 'text-yellow-600' }
                        ].map(metric => (
                          <div key={metric.label} className="p-4 border border-[var(--color-line)] bg-white/50">
                            <span className="text-[9px] uppercase opacity-50 block mb-1">{metric.label}</span>
                            <span className={cn("text-xl mono font-bold", metric.color)}>{metric.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Redundancy & Failover */}
                    <div className="border border-[var(--color-line)] bg-white/40 p-6">
                      <h2 className="font-serif italic text-sm uppercase tracking-widest mb-6">System Redundancy</h2>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border border-[var(--color-line)] bg-white/50">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-xs font-bold uppercase">Active Nodes</span>
                          </div>
                          <span className="text-xs mono">{systemStatus?.redundancy?.activeNodes || 0} / 3</span>
                        </div>
                        <div className="flex items-center justify-between p-3 border border-[var(--color-line)] bg-white/50">
                          <div className="flex items-center gap-3">
                            <ShieldCheck size={16} className="text-blue-600" />
                            <span className="text-xs font-bold uppercase">Failover Readiness</span>
                          </div>
                          <span className="text-xs mono">{systemStatus?.redundancy?.failoverReady ? 'READY' : 'STANDBY'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Encrypted API Demo */}
                    <div className="border border-[var(--color-line)] bg-white/40 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="font-serif italic text-sm uppercase tracking-widest">Encrypted API Demo</h2>
                        <Fingerprint size={18} className="opacity-40" />
                      </div>
                      <p className="text-[10px] opacity-60 mb-6 leading-relaxed">
                        Demonstrate end-to-end AES-256 payload encryption. The client encrypts the transaction 
                        data before transmission, and the server decrypts it using the internal security package.
                      </p>
                      <button 
                        onClick={sendEncryptedTransaction}
                        className="w-full py-3 border border-[var(--color-ink)] text-[var(--color-ink)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] transition-all flex items-center justify-center gap-2"
                      >
                        <Lock size={14} />
                        Execute Encrypted Tx
                      </button>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Fraud & Compliance Alerts */}
                    <div className="border border-[var(--color-line)] bg-white/40 p-6">
                      <h2 className="font-serif italic text-sm uppercase tracking-widest mb-6">Fraud & Compliance Alerts</h2>
                      <div className="space-y-3">
                        {auditLogs.filter(l => l.type === 'CRITICAL' || l.type === 'WARN').slice(0, 5).map((alert, i) => (
                          <div key={i} className="p-3 border border-red-100 bg-red-50/30 flex items-start gap-3">
                            <ShieldAlert size={16} className="text-red-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-bold text-red-700 uppercase">{alert.message}</p>
                              <p className="text-[8px] mono opacity-50 mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                        {auditLogs.filter(l => l.type === 'CRITICAL' || l.type === 'WARN').length === 0 && (
                          <div className="p-8 text-center border border-dashed border-[var(--color-line)] opacity-40">
                            <CheckCircle2 size={24} className="mx-auto mb-2 text-green-600" />
                            <p className="text-[10px] uppercase font-bold">No active threats detected</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Security Log */}
                    <div className="border border-[var(--color-line)] bg-[var(--color-ink)] text-[var(--color-bg)] p-6 h-[400px] flex flex-col">
                      <div className="flex items-center gap-2 mb-6">
                        <ShieldCheck size={18} />
                        <h2 className="font-serif italic text-sm uppercase tracking-widest">Security Audit</h2>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {auditLogs.length === 0 && <p className="text-[10px] opacity-40 italic">No audit logs available</p>}
                        {auditLogs.map((log, i) => (
                          <div key={log.id || i} className="text-[10px] mono border-l border-white/20 pl-3 py-1">
                            <span className="opacity-40">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'topology' && (
              <motion.div 
                key="topology"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full flex flex-col"
              >
                <div className="mb-8 flex justify-between items-start">
                  <div>
                    <h2 className="font-serif italic text-2xl uppercase tracking-widest mb-2">System Topology</h2>
                    <p className="text-xs opacity-60">Real-time data pipeline and downstream dependency visualization.</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 border border-[var(--color-line)] bg-white/50">
                    <div className={cn("w-2 h-2 rounded-full", events.length > 0 ? "bg-green-500 animate-pulse" : "bg-slate-400")} />
                    <span className="text-[10px] mono uppercase">Stream: {events.length > 0 ? 'Connected' : 'Idle'}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
                  <div className="flex-1 flex items-center justify-center p-12 border border-dashed border-[var(--color-line)] bg-white/20 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                      {/* Pipeline Visualization */}
                      <TopologyNode icon={LayoutDashboard} label="Frontend" status="Active" active={lastEvent?.topic.startsWith('command')} />
                      <div className="w-12 h-px bg-[var(--color-line)] relative">
                        {lastEvent?.topic.startsWith('command') && (
                          <Zap size={12} className="absolute -top-1.5 left-0 text-yellow-500 animate-[moveRight_1s_linear_infinite]" />
                        )}
                      </div>
                      
                      <TopologyNode icon={Database} label="API Gateway" status="Nominal" active={!!lastEvent} />
                      <div className="w-12 h-px bg-[var(--color-line)] relative">
                        {lastEvent && (
                          <Zap size={12} className="absolute -top-1.5 left-0 text-yellow-500 animate-[moveRight_1s_linear_infinite]" />
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-8">
                        <div className="flex items-center gap-12">
                          <TopologyNode icon={ShieldCheck} label="Auth Service" status="Secure" active={lastEvent?.topic.includes('auth')} />
                          <TopologyNode icon={Activity} label="Risk Engine" status="Monitoring" active={lastEvent?.topic.includes('risk')} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-80 flex flex-col gap-4">
                    <div className="p-4 border border-[var(--color-line)] bg-white/40">
                      <h3 className="text-[10px] font-bold uppercase mb-4">Live Event Stream</h3>
                      <div className="space-y-2 h-[300px] overflow-y-auto pr-2">
                        {events.map((ev, i) => (
                          <div key={ev.id || i} className="p-2 border border-[var(--color-line)] bg-white/50 text-[9px] mono">
                            <div className="flex justify-between opacity-50 mb-1">
                              <span>{ev.topic}</span>
                              <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="truncate">{JSON.stringify(ev.payload)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div 
                key="payments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto"
              >
                <div className="border border-[var(--color-line)] bg-white/40 p-8">
                  <h2 className="font-serif italic text-2xl uppercase tracking-widest mb-8">Initiate Payment</h2>
                  <form onSubmit={handleInitiatePayment} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold uppercase mb-2">From Account</label>
                        <select name="fromAccount" className="w-full p-3 border border-[var(--color-line)] bg-white focus:outline-none">
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.name}>{acc.name} ({acc.number})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase mb-2">Amount (USD)</label>
                        <input name="amount" type="number" step="0.01" required className="w-full p-3 border border-[var(--color-line)] bg-white focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase mb-2">Recipient Account / IBAN</label>
                      <input name="toAccount" type="text" required className="w-full p-3 border border-[var(--color-line)] bg-white focus:outline-none" />
                    </div>
                    <div className="pt-4">
                      <button type="submit" className="w-full bg-[var(--color-ink)] text-[var(--color-bg)] py-4 font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
                        Authorize Transaction
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'liquidity' && (
              <motion.div 
                key="liquidity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="border border-[var(--color-line)] bg-white/40 p-6">
                    <h2 className="font-serif italic text-sm uppercase tracking-widest mb-6">Account Balances</h2>
                    <div className="space-y-4">
                      {accounts.map(acc => (
                        <div key={acc.id} className="p-4 border border-[var(--color-line)] bg-white/50 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold uppercase">{acc.name}</p>
                            <p className="text-[10px] mono opacity-50">{acc.number}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono font-bold">${acc.balance.toLocaleString()}</p>
                            <p className="text-[9px] uppercase opacity-50">{acc.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border border-[var(--color-line)] bg-white/40 p-6">
                    <h2 className="font-serif italic text-sm uppercase tracking-widest mb-6">Liquidity Forecast (30D)</h2>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={MOCK_CASHFLOW}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141420" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontFamily: 'monospace'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontFamily: 'monospace'}} />
                          <Tooltip contentStyle={{ backgroundColor: '#141414', color: '#E4E3E0', border: 'none', borderRadius: '0', fontSize: '12px', fontFamily: 'monospace' }} />
                          <Line type="monotone" dataKey="inflow" stroke="#141414" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reporting' && (
              <motion.div 
                key="reporting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="border border-[var(--color-line)] bg-white/40">
                  <div className="p-6 border-b border-[var(--color-line)]">
                    <h2 className="font-serif italic text-sm uppercase tracking-widest">Financial Reports</h2>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { title: 'Daily Cash Position', date: '2026-03-26', size: '1.2 MB' },
                      { title: 'Monthly Reconciliation', date: '2026-02-28', size: '4.5 MB' },
                      { title: 'Compliance Audit Q1', date: '2026-03-15', size: '8.1 MB' },
                      { title: 'Tax Liability Summary', date: '2026-03-01', size: '2.3 MB' },
                      { title: 'Intercompany Transfers', date: '2026-03-20', size: '3.7 MB' },
                    ].map((report, i) => (
                      <div key={i} className="p-4 border border-[var(--color-line)] bg-white/50 hover:bg-white transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                          <Database size={20} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                          <span className="text-[9px] mono opacity-50">{report.size}</span>
                        </div>
                        <h3 className="text-xs font-bold uppercase mb-1">{report.title}</h3>
                        <p className="text-[10px] mono opacity-50">Generated: {report.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-1 space-y-4">
                    <div className="p-6 border border-[var(--color-line)] bg-white/40 text-center">
                      <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4 border border-[var(--color-line)]" />
                      <h3 className="font-bold uppercase text-sm">Treasury Admin</h3>
                      <p className="text-[10px] mono opacity-50">admin@cashpro-oss.bank</p>
                    </div>
                    <nav className="flex flex-col border border-[var(--color-line)] bg-white/40">
                      {['Profile', 'Security', 'Notifications', 'API Keys'].map(item => (
                        <button key={item} className="p-4 text-left text-[10px] font-bold uppercase border-b border-[var(--color-line)] last:border-0 hover:bg-white/50">
                          {item}
                        </button>
                      ))}
                    </nav>
                  </div>
                  <div className="md:col-span-2 border border-[var(--color-line)] bg-white/40 p-8">
                    <h2 className="font-serif italic text-xl uppercase tracking-widest mb-8">System Configuration</h2>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 border border-[var(--color-line)] bg-white/50">
                        <div>
                          <p className="text-xs font-bold uppercase">Multi-Factor Authentication</p>
                          <p className="text-[10px] opacity-50">Require biometric verification for large transfers</p>
                        </div>
                        <div className="w-10 h-5 bg-green-500 rounded-full relative">
                          <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 border border-[var(--color-line)] bg-white/50">
                        <div>
                          <p className="text-xs font-bold uppercase">Auto-Reconciliation</p>
                          <p className="text-[10px] opacity-50">Sync with ERP every 15 minutes</p>
                        </div>
                        <div className="w-10 h-5 bg-slate-300 rounded-full relative">
                          <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="pt-4">
                        <button className="px-6 py-3 bg-[var(--color-ink)] text-[var(--color-bg)] text-[10px] font-bold uppercase tracking-widest">
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
    </ErrorBoundary>
  );
}

export default App;
