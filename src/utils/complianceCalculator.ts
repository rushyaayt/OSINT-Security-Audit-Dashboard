import { SecurityHeader, SSLCheckResult, PortOverview, ComplianceScore } from '../types';

export function computeComplianceScore(
  securityHeaders: SecurityHeader[] = [],
  ssl?: SSLCheckResult,
  openPorts: PortOverview[] = []
): ComplianceScore {
  let passedControls = 0;
  const totalControls = 8;
  
  const criticalMissing: string[] = [];
  const warnings: string[] = [];
  const passed: string[] = [];

  // Control 1: HSTS (Strict-Transport-Security)
  const hsts = securityHeaders.find(h => 
    h.header.toLowerCase().includes('strict-transport-security') || h.header.toLowerCase().includes('hsts')
  );
  if (hsts && hsts.status === 'pass') {
    passedControls++;
    passed.push('Strict-Transport-Security (HSTS) Enforced');
  } else {
    criticalMissing.push('Missing HSTS (Strict-Transport-Security) - Violates NIST SC-8 & OWASP A05');
  }

  // Control 2: CSP (Content-Security-Policy)
  const csp = securityHeaders.find(h => 
    h.header.toLowerCase().includes('content-security-policy') || h.header.toLowerCase().includes('csp')
  );
  if (csp && csp.status === 'pass') {
    passedControls++;
    passed.push('Content-Security-Policy (CSP) Active');
  } else if (csp && csp.status === 'warning') {
    passedControls += 0.5;
    warnings.push('CSP presents weak/permissive directives - OWASP A03/A05 Warning');
  } else {
    criticalMissing.push('Missing Content-Security-Policy - Violates NIST SC-28 & OWASP XSS Protection');
  }

  // Control 3: X-Frame-Options
  const xfo = securityHeaders.find(h => h.header.toLowerCase().includes('frame-options'));
  if (xfo && xfo.status === 'pass') {
    passedControls++;
    passed.push('X-Frame-Options Clickjacking Protection Enforced');
  } else {
    warnings.push('Missing X-Frame-Options header - Risk of Clickjacking (OWASP A05)');
  }

  // Control 4: X-Content-Type-Options
  const xcto = securityHeaders.find(h => h.header.toLowerCase().includes('content-type-options'));
  if (xcto && xcto.status === 'pass') {
    passedControls++;
    passed.push('X-Content-Type-Options nosniff Active');
  } else {
    warnings.push('Missing X-Content-Type-Options: nosniff - Risk of MIME-sniffing');
  }

  // Control 5: Referrer-Policy & Privacy Headers
  const refPol = securityHeaders.find(h => h.header.toLowerCase().includes('referrer-policy'));
  if (refPol && refPol.status === 'pass') {
    passedControls++;
    passed.push('Referrer-Policy Privacy Controls Configured');
  } else {
    warnings.push('Referrer-Policy not explicitly defined');
  }

  // Control 6: SSL/TLS Certificate Validity
  if (ssl && ssl.status === 'valid') {
    passedControls++;
    passed.push(`TLS Certificate Valid (${ssl.protocol}, ${ssl.daysRemaining} days remaining)`);
  } else if (ssl && ssl.status === 'expiring') {
    passedControls += 0.5;
    warnings.push(`TLS Certificate expiring in ${ssl.daysRemaining} days`);
  } else {
    criticalMissing.push('TLS Certificate Expired, Invalid, or Self-Signed - Violates NIST SC-13');
  }

  // Control 7: Unencrypted High-Risk Database/Management Port Exposure
  const dangerousOpen = openPorts.filter(p => p.status === 'open' && (p.risk === 'high' || p.port === 3306 || p.port === 5432 || p.port === 27017 || p.port === 6379));
  if (dangerousOpen.length === 0) {
    passedControls++;
    passed.push('No Dangerous Database or Internal Management Ports Publicly Exposed');
  } else {
    criticalMissing.push(`Exposed high-risk database ports: ${dangerousOpen.map(p => `${p.port}/${p.service}`).join(', ')}`);
  }

  // Control 8: Plaintext Legacy Ports (FTP/Telnet)
  const plaintextPort = openPorts.find(p => p.status === 'open' && (p.port === 23 || p.port === 21));
  if (!plaintextPort) {
    passedControls++;
    passed.push('No Legacy Plaintext Protocol Ports Open (Telnet/FTP)');
  } else {
    criticalMissing.push('Legacy unencrypted management service open (FTP/Telnet)');
  }

  const overallScore = Math.round((passedControls / totalControls) * 100);

  // Framework Specific Calculations
  const nist = Math.min(100, Math.max(0, Math.round(overallScore * 0.95 + (ssl?.status === 'valid' ? 5 : -10))));
  const owasp = Math.min(100, Math.max(0, Math.round(overallScore * 1.0 - (criticalMissing.length * 6))));
  const cis = Math.min(100, Math.max(0, Math.round(overallScore * 0.92)));
  const pciDss = Math.min(100, Math.max(0, Math.round(overallScore * 0.88 + (ssl?.status === 'valid' ? 12 : -20))));

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (overallScore >= 95) grade = 'A+';
  else if (overallScore >= 85) grade = 'A';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 55) grade = 'C';
  else if (overallScore >= 40) grade = 'D';

  return {
    overallScore,
    grade,
    passedControls: Math.floor(passedControls),
    totalControls,
    frameworkScores: {
      nist,
      owasp,
      cis,
      pciDss
    },
    findingsSummary: {
      criticalMissing,
      warnings,
      passed
    }
  };
}
