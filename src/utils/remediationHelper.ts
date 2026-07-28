import { ScanResult, RemediationSuggestion } from '../types';

/**
 * Evaluates failed security audit criteria from a ScanResult
 * and returns an array of brief, context-aware remediation suggestions.
 */
export function generateRemediationSuggestions(scanResult: ScanResult): RemediationSuggestion[] {
  if (!scanResult) return [];

  const suggestions: RemediationSuggestion[] = [];
  let counter = 1;

  // 1. Audit Security Response Headers
  if (scanResult.securityHeaders && scanResult.securityHeaders.length > 0) {
    scanResult.securityHeaders.forEach((header) => {
      const isFailed = header.status === 'fail' || header.status === 'warning';
      const nameLower = header.header.toLowerCase();

      if (isFailed) {
        if (nameLower.includes('strict-transport-security')) {
          suggestions.push({
            id: `rem-${counter++}`,
            category: 'Header',
            severity: 'critical',
            title: 'Enable HSTS Header',
            targetCriteria: 'Strict-Transport-Security (HSTS) Missing or Invalid',
            suggestion: "Configure 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload' to enforce HTTPS and prevent SSL stripping attacks.",
            actionableStep: "Add the header in Nginx (add_header Strict-Transport-Security ...), Apache (Header always set Strict-Transport-Security ...), or Cloudflare transform rules.",
          });
        } else if (nameLower.includes('content-security-policy')) {
          suggestions.push({
            id: `rem-${counter++}`,
            category: 'Header',
            severity: 'high',
            title: 'Implement Content Security Policy (CSP)',
            targetCriteria: 'Content-Security-Policy (CSP) Missing or Weak',
            suggestion: "Define a strict Content Security Policy to control loaded scripts, styles, and frames to mitigate Cross-Site Scripting (XSS) and data injection.",
            actionableStep: "Define 'Content-Security-Policy: default-src \'self\'; script-src \'self\' https://trusted.cdn.com;' in your web server headers.",
          });
        } else if (nameLower.includes('x-frame-options')) {
          suggestions.push({
            id: `rem-${counter++}`,
            category: 'Header',
            severity: 'medium',
            title: 'Set X-Frame-Options Header',
            targetCriteria: 'X-Frame-Options Missing',
            suggestion: "Set 'X-Frame-Options: DENY' or 'SAMEORIGIN' to prevent malicious embedding in external iframes (Clickjacking protection).",
            actionableStep: "Configure 'X-Frame-Options: DENY' in web server HTTP response headers.",
          });
        } else if (nameLower.includes('x-content-type-options')) {
          suggestions.push({
            id: `rem-${counter++}`,
            category: 'Header',
            severity: 'medium',
            title: 'Enable X-Content-Type-Options',
            targetCriteria: 'X-Content-Type-Options Missing',
            suggestion: "Add 'X-Content-Type-Options: nosniff' to instruct browsers not to override declared Content-Type header via MIME sniffing.",
            actionableStep: "Set 'X-Content-Type-Options: nosniff' in HTTP response headers.",
          });
        } else if (nameLower.includes('referrer-policy')) {
          suggestions.push({
            id: `rem-${counter++}`,
            category: 'Header',
            severity: 'low',
            title: 'Configure Referrer-Policy Header',
            targetCriteria: 'Referrer-Policy Missing',
            suggestion: "Set 'Referrer-Policy: strict-origin-when-cross-origin' to prevent leaking sensitive internal URL paths in cross-origin HTTP Referer headers.",
            actionableStep: "Add 'Referrer-Policy: strict-origin-when-cross-origin' to site headers.",
          });
        } else if (nameLower.includes('permissions-policy')) {
          suggestions.push({
            id: `rem-${counter++}`,
            category: 'Header',
            severity: 'low',
            title: 'Define Permissions-Policy Header',
            targetCriteria: 'Permissions-Policy Missing',
            suggestion: "Restrict unused client hardware APIs (e.g. camera, microphone, geolocation) using 'Permissions-Policy: camera=(), microphone=(), geolocation=()'.",
            actionableStep: "Set 'Permissions-Policy: camera=(), microphone=(), geolocation=()' in server response headers.",
          });
        } else {
          // Generic header failure
          suggestions.push({
            id: `rem-${counter++}`,
            category: 'Header',
            severity: 'medium',
            title: `Configure ${header.header}`,
            targetCriteria: `${header.header} Audit Warning`,
            suggestion: header.recommendation || header.explanation || `Ensure ${header.header} is configured according to security best practices.`,
            actionableStep: `Audit and update web application header configuration for ${header.header}.`,
          });
        }
      }
    });
  }

  // 2. Audit SSL / TLS Certificate
  if (scanResult.ssl) {
    const ssl = scanResult.ssl;
    if (ssl.status === 'expired' || ssl.daysRemaining <= 0) {
      suggestions.push({
        id: `rem-${counter++}`,
        category: 'SSL/TLS',
        severity: 'critical',
        title: 'Renew Expired SSL/TLS Certificate',
        targetCriteria: `SSL Certificate Expired (${ssl.daysRemaining} days remaining)`,
        suggestion: `The TLS certificate for ${scanResult.target} has expired. Browsers will block connection with security errors.`,
        actionableStep: "Immediately renew TLS certificate using Let's Encrypt (certbot renew), AWS ACM, or your certificate authority.",
      });
    } else if (ssl.status === 'expiring' || (ssl.daysRemaining > 0 && ssl.daysRemaining < 30)) {
      suggestions.push({
        id: `rem-${counter++}`,
        category: 'SSL/TLS',
        severity: 'high',
        title: 'Renew Expiring SSL/TLS Certificate',
        targetCriteria: `SSL Certificate Expiring Soon (${ssl.daysRemaining} days remaining)`,
        suggestion: `The TLS certificate expires in ${ssl.daysRemaining} days. Schedule renewal to avoid outage.`,
        actionableStep: "Ensure automated ACME renew hooks are active or issue a fresh certificate before expiration.",
      });
    } else if (ssl.status === 'self-signed') {
      suggestions.push({
        id: `rem-${counter++}`,
        category: 'SSL/TLS',
        severity: 'high',
        title: 'Replace Self-Signed Certificate',
        targetCriteria: 'Self-Signed Certificate Detected',
        suggestion: "Self-signed certificates trigger browser distrust warnings. Replace with a trusted public CA certificate.",
        actionableStep: "Obtain a free public certificate via Let's Encrypt or zeroSSL.",
      });
    }

    if (ssl.protocol && (ssl.protocol.includes('TLS 1.0') || ssl.protocol.includes('TLS 1.1') || ssl.protocol.includes('SSLv3'))) {
      suggestions.push({
        id: `rem-${counter++}`,
        category: 'SSL/TLS',
        severity: 'high',
        title: 'Disable Legacy TLS Protocols',
        targetCriteria: `Insecure TLS Protocol (${ssl.protocol})`,
        suggestion: "TLS 1.0 and 1.1 contain known cryptographic vulnerabilities. Enforce TLS 1.2 or TLS 1.3 exclusively.",
        actionableStep: "Update web server SSL/TLS cipher suite configuration to disable TLSv1.0 and TLSv1.1.",
      });
    }
  }

  // 3. Audit Open Ports & Network Exposure
  if (scanResult.openPorts && scanResult.openPorts.length > 0) {
    scanResult.openPorts.forEach((port) => {
      const pNum = port.port;
      const svcLower = port.service.toLowerCase();

      if (pNum === 21 || svcLower.includes('ftp')) {
        suggestions.push({
          id: `rem-${counter++}`,
          category: 'Port/Network',
          severity: 'high',
          title: 'Disable Unencrypted FTP (Port 21)',
          targetCriteria: 'Unencrypted FTP Port 21 Exposed',
          suggestion: "FTP transmits credentials and file data in cleartext. Replace with SFTP (Port 22) or FTPS.",
          actionableStep: "Disable port 21 in firewall rules and migrate users to SSH/SFTP authentication.",
        });
      } else if (pNum === 23 || svcLower.includes('telnet')) {
        suggestions.push({
          id: `rem-${counter++}`,
          category: 'Port/Network',
          severity: 'critical',
          title: 'Disable Unencrypted Telnet (Port 23)',
          targetCriteria: 'Cleartext Telnet Service Exposed',
          suggestion: "Telnet is insecure and vulnerable to credential sniffing. Disable Telnet immediately.",
          actionableStep: "Stop the in.telnetd daemon and enforce SSH (Port 22) for shell administration.",
        });
      } else if ([3306, 5432, 27017, 6379, 9200, 11211, 1433, 1521].includes(pNum)) {
        suggestions.push({
          id: `rem-${counter++}`,
          category: 'Port/Network',
          severity: 'critical',
          title: `Restrict Public Access to Database Port ${pNum}`,
          targetCriteria: `Database Service (${port.service.toUpperCase()}) Exposed on Port ${pNum}`,
          suggestion: `Port ${pNum} (${port.service}) is exposed to the public internet. Unrestricted database ports invite brute-force and remote exploit attacks.`,
          actionableStep: "Bind database listeners to localhost (127.0.0.1 or internal VPC IP) and restrict inbound access via security group/firewall.",
        });
      } else if (pNum === 3389 || pNum === 445 || svcLower.includes('rdp') || svcLower.includes('smb')) {
        suggestions.push({
          id: `rem-${counter++}`,
          category: 'Port/Network',
          severity: 'critical',
          title: `Secure Remote Management Port ${pNum}`,
          targetCriteria: `Management Service (${port.service.toUpperCase()}) Exposed on Port ${pNum}`,
          suggestion: `Exposing ${port.service} on port ${pNum} to public traffic poses severe ransomware and unauthorized access risks.`,
          actionableStep: "Block public inbound access on port " + pNum + " and enforce access via secure VPN or bastion host.",
        });
      } else if (port.risk === 'high') {
        suggestions.push({
          id: `rem-${counter++}`,
          category: 'Port/Network',
          severity: 'high',
          title: `Remediate Open Port ${pNum} (${port.service.toUpperCase()})`,
          targetCriteria: `High Risk Open Service on Port ${pNum}`,
          suggestion: port.description || `Audit and restrict access to port ${pNum}.`,
          actionableStep: "Verify if this service requires external visibility; restrict access via IP whitelist if internal.",
        });
      }
    });
  }

  // 4. Audit Dangling Subdomains
  if (scanResult.subdomains && scanResult.subdomains.length > 0) {
    const unreachableSubs = scanResult.subdomains.filter(s => s.status === 'unreachable');
    if (unreachableSubs.length > 0) {
      const sampleNames = unreachableSubs.slice(0, 3).map(s => s.subdomain).join(', ');
      suggestions.push({
        id: `rem-${counter++}`,
        category: 'Subdomain',
        severity: 'medium',
        title: 'Audit Dangling Subdomains & Stale CNAMEs',
        targetCriteria: `${unreachableSubs.length} Unreachable Subdomain(s) Detected`,
        suggestion: `Found ${unreachableSubs.length} unreachable subdomain(s) (${sampleNames}${unreachableSubs.length > 3 ? '...' : ''}). Dangling CNAME pointers can be hijacked for Subdomain Takeover attacks.`,
        actionableStep: "Review DNS provider records and delete CNAME pointers to decommissioned cloud resources (AWS S3, GitHub Pages, Heroku).",
      });
    }
  }

  // 5. Overall Risk Score Recommendation
  if (scanResult.riskScore >= 60) {
    suggestions.push({
      id: `rem-${counter++}`,
      category: 'Compliance',
      severity: scanResult.riskScore >= 80 ? 'critical' : 'high',
      title: 'Execute High Priority Security Hardening',
      targetCriteria: `Elevated Target Risk Score (${scanResult.riskScore}/100)`,
      suggestion: `The target domain risk score is elevated (${scanResult.riskScore}/100). Implement top critical recommendations (HSTS, DB port closure) to drop risk posture below 30.`,
      actionableStep: "Schedule a SecOps remediation sprint to resolve critical missing headers and exposed service ports.",
    });
  }

  return suggestions;
}

/**
 * Returns a cloned ScanResult object with remediationSuggestions populated.
 */
export function injectRemediationSuggestions(scanResult: ScanResult): ScanResult {
  if (!scanResult) return scanResult;
  const remediationSuggestions = generateRemediationSuggestions(scanResult);
  return {
    ...scanResult,
    remediationSuggestions,
  };
}
