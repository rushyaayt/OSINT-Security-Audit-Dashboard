export interface ScanRequest {
  target: string;
  options: {
    enumerateSubdomains: boolean;
    checkSSL: boolean;
    auditHeaders: boolean;
    checkPorts: boolean;
    detectTechStack: boolean;
    dnsLookup: boolean;
    whoisPassive: boolean;
  };
}

export interface SubdomainItem {
  subdomain: string;
  ip: string;
  status: 'active' | 'unreachable' | 'unknown';
  source: string;
}

export interface SSLCheckResult {
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  protocol: string;
  keyStrength: string;
  status: 'valid' | 'expiring' | 'expired' | 'self-signed' | 'error';
  fingerprintSha256: string;
}

export interface SecurityHeader {
  header: string;
  value: string;
  status: 'pass' | 'warning' | 'fail' | 'info';
  recommendation?: string;
  explanation: string;
}

export interface PortOverview {
  port: number;
  service: string;
  protocol: 'TCP' | 'UDP';
  status: 'open' | 'filtered' | 'closed';
  risk: 'low' | 'medium' | 'high' | 'info';
  description: string;
}

export interface TechStackItem {
  name: string;
  category: string;
  version?: string;
  confidence: number; // 0-100
  iconName?: string;
  description: string;
}

export interface DNSRecord {
  type: 'A' | 'AAAA' | 'MX' | 'TXT' | 'NS' | 'CNAME' | 'SOA';
  value: string;
  ttl?: number;
}

export interface WhoisPassiveData {
  registrar?: string;
  createdDate?: string;
  updatedDate?: string;
  expiresDate?: string;
  nameServers?: string[];
  orgName?: string;
  country?: string;
}

export interface ComplianceScore {
  overallScore: number; // 0-100 (100 = fully compliant)
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  passedControls: number;
  totalControls: number;
  frameworkScores: {
    nist: number;
    owasp: number;
    cis: number;
    pciDss: number;
  };
  findingsSummary: {
    criticalMissing: string[];
    warnings: string[];
    passed: string[];
  };
}

export interface RemediationSuggestion {
  id: string;
  category: 'Header' | 'SSL/TLS' | 'Port/Network' | 'Subdomain' | 'TechStack' | 'Compliance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  suggestion: string;
  targetCriteria: string;
  actionableStep?: string;
}

export interface ScanResult {
  id: string;
  target: string;
  timestamp: string;
  status: 'completed' | 'failed' | 'in_progress';
  riskScore: number; // 0-100 (0 = safe, 100 = high risk)
  compliance_benchmark_score?: ComplianceScore;
  ipAddress: string;
  location?: string;
  subdomains: SubdomainItem[];
  ssl: SSLCheckResult;
  securityHeaders: SecurityHeader[];
  openPorts: PortOverview[];
  techStack: TechStackItem[];
  dnsRecords: DNSRecord[];
  whois: WhoisPassiveData;
  summary: string;
  remediationSuggestions?: RemediationSuggestion[];
}

export interface SIEMExportPayload {
  format: 'splunk' | 'elastic' | 'cef' | 'json';
  data: ScanResult;
}

export interface ScanHistoryItem {
  id: string;
  target: string;
  timestamp: string;
  riskScore: number;
  ipAddress: string;
  result: ScanResult;
}

export interface BenchmarkItem {
  id: string;
  category: string; // e.g., 'Transport Layer Security', 'Frame Protection', 'Content Injection', 'CORS / Access', 'Network Exposure', 'Information Disclosure'
  itemTested: string; // e.g., 'HSTS Header', 'CSP Header', 'Port 22 SSH', etc.
  owaspBenchmark: {
    ref: string;
    status: 'pass' | 'medium' | 'high' | 'critical' | 'info';
    note: string;
  };
  cisBenchmark: {
    ref: string;
    status: 'pass' | 'medium' | 'high' | 'critical' | 'info';
    note: string;
  };
  nistBenchmark: {
    ref: string;
    status: 'pass' | 'medium' | 'high' | 'critical' | 'info';
    note: string;
  };
}

export interface ScheduledTask {
  id: string;
  target: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  options: ScanRequest['options'];
  lastRun?: string;
  nextRun: string;
  enabled: boolean;
  alertOnCritical: boolean;
  notifyEmail?: string;
}

export interface EmailAlertConfig {
  recipientEmail: string;
  enableAlerts: boolean;
  triggerThresholdScore: number; // e.g. Alert if Risk Score > 40
  alertOnCriticalHeaderMissing: boolean;
  alertOnSslExpiring: boolean;
  webhookUrl?: string;
}

export interface AlertLogItem {
  id: string;
  timestamp: string;
  target: string;
  riskScore: number;
  triggerReason: string;
  recipientEmail: string;
  status: 'sent' | 'simulated' | 'failed';
}


