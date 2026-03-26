import { eventBus } from '../../core/EventBus';

export interface ComplianceReport {
  id: string;
  transactionId: string;
  ruleId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  message: string;
}

export class BankCompliance {
  // --- AML Rules (Anti-Money Laundering) ---
  private static AML_LIMIT = 10000; // Threshold for mandatory reporting
  private static SUSPICIOUS_COUNTRIES = ['COUNTRY_X', 'COUNTRY_Y', 'COUNTRY_Z'];

  static async checkTransaction(tx: any): Promise<ComplianceReport[]> {
    const reports: ComplianceReport[] = [];

    // Rule 1: High value transaction threshold
    if (Math.abs(tx.amount) >= this.AML_LIMIT) {
      reports.push({
        id: `aml-${Date.now()}-1`,
        transactionId: tx.id,
        ruleId: 'AML_THRESHOLD_EXCEEDED',
        severity: 'MEDIUM',
        timestamp: new Date().toISOString(),
        message: `Transaction amount ${tx.amount} exceeds reporting threshold of ${this.AML_LIMIT}`
      });
    }

    // Rule 2: Suspicious country check (simulated)
    if (this.SUSPICIOUS_COUNTRIES.includes(tx.toCountry || '')) {
      reports.push({
        id: `aml-${Date.now()}-2`,
        transactionId: tx.id,
        ruleId: 'SUSPICIOUS_DESTINATION_COUNTRY',
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        message: `Transaction directed to high-risk country: ${tx.toCountry}`
      });
    }

    // If any reports, publish to compliance event stream
    if (reports.length > 0) {
      for (const report of reports) {
        await eventBus.publish('compliance.report', report, `compliance-${report.id}`);
      }
    }

    return reports;
  }

  static async generateSAR(tx: any): Promise<string> {
    // Suspicious Activity Report (SAR) generation
    console.log(`[BankCompliance] Generating SAR for transaction: ${tx.id}`);
    return `SAR-${tx.id}-${Date.now()}`;
  }
}
