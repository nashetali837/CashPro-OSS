export interface Account {
  id: string;
  name: string;
  number: string;
  balance: number;
  currency: string;
  type: 'Checking' | 'Savings' | 'Liquidity' | 'Investment';
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Flagged';
  category: string;
  accountName: string;
}

export interface CashFlowData {
  name: string;
  inflow: number;
  outflow: number;
}

export interface SystemJob {
  id: string;
  name: string;
  status: 'Running' | 'Completed' | 'Failed' | 'Scheduled';
  progress: number;
}

export interface EventStream {
  id: string;
  topic: string;
  payload: any;
  timestamp: string;
}
