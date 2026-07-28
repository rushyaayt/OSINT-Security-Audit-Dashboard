import { ScanResult } from '../types';

/**
 * Downloads a text/JSON/CSV file directly in the user's browser.
 */
export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate CSV representation of ScanResult structured for SIEM table import
 */
export function generateSIEMCSV(data: ScanResult, siemTarget: 'splunk' | 'elastic' | 'generic' = 'splunk'): string {
  const headers = [
    'timestamp',
    'siem_sourcetype',
    'target_domain',
    'target_ip',
    'risk_score',
    'ssl_status',
    'ssl_days_remaining',
    'subdomain_count',
    'open_ports',
    'missing_headers',
    'tech_stack',
    'summary'
  ];

  const sourcetype = siemTarget === 'splunk' ? 'osint:recon:splunk' : siemTarget === 'elastic' ? 'ecs.network.recon' : 'osint.audit.csv';
  const missingHeaders = data.securityHeaders.filter(h => h.status === 'fail').map(h => h.header).join('; ');
  const openPortsStr = data.openPorts.filter(p => p.status === 'open').map(p => `${p.port}/${p.service}`).join('; ');
  const techStackStr = data.techStack.map(t => t.name).join('; ');

  const row = [
    data.timestamp,
    sourcetype,
    data.target,
    data.ipAddress,
    data.riskScore,
    data.ssl.status,
    data.ssl.daysRemaining,
    data.subdomains.length,
    openPortsStr,
    missingHeaders,
    techStackStr,
    data.summary
  ].map(val => `"${String(val).replace(/"/g, '""')}"`);

  return `${headers.join(',')}\n${row.join(',')}`;
}

/**
 * Generate JSON string for Splunk HEC or Elastic Common Schema (ECS)
 */
export function generateSIEMJSON(data: ScanResult, siemFormat: 'splunk' | 'elastic' | 'json'): string {
  if (siemFormat === 'splunk') {
    const splunkEvent = {
      time: Math.floor(new Date(data.timestamp).getTime() / 1000),
      host: "osint-dashboard",
      source: "audit-scanner",
      sourcetype: "osint:recon:v1",
      event: {
        target: data.target,
        risk_score: data.riskScore,
        primary_ip: data.ipAddress,
        location: data.location,
        ssl_status: data.ssl.status,
        ssl_issuer: data.ssl.issuer,
        ssl_days_remaining: data.ssl.daysRemaining,
        missing_headers: data.securityHeaders.filter(h => h.status === 'fail').map(h => h.header),
        open_ports: data.openPorts.filter(p => p.status === 'open').map(p => `${p.port}/${p.service}`),
        subdomains: data.subdomains.map(s => s.subdomain),
        tech_stack: data.techStack.map(t => `${t.name} (${t.category})`),
        summary: data.summary
      }
    };
    return JSON.stringify(splunkEvent, null, 2);
  }

  if (siemFormat === 'elastic') {
    const elasticDoc = {
      "@timestamp": data.timestamp,
      "event": {
        "kind": "alert",
        "category": ["network", "threat"],
        "type": ["info"],
        "dataset": "osint.reconnaissance"
      },
      "target": {
        "domain": data.target,
        "ip": data.ipAddress,
        "geo": { "country_name": data.location }
      },
      "vulnerability": {
        "score": { "base": data.riskScore },
        "description": data.summary
      },
      "tls": {
        "status": data.ssl.status,
        "issuer": data.ssl.issuer,
        "valid_until": data.ssl.validTo
      },
      "http": {
        "security_headers": data.securityHeaders
      },
      "subdomains": data.subdomains,
      "open_ports": data.openPorts
    };
    return JSON.stringify(elasticDoc, null, 2);
  }

  return JSON.stringify(data, null, 2);
}
