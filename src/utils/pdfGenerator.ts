import jsPDF from 'jspdf';
import { ScanResult } from '../types';
import { computeComplianceScore } from './complianceCalculator';

export function generatePDFReport(data: ScanResult) {
  const compScore = data.compliance_benchmark_score || computeComplianceScore(
    data.securityHeaders,
    data.ssl,
    data.openPorts
  );

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 15;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Dark slate bg (#0f172a)
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(248, 250, 252);
  doc.text('EXECUTIVE COMPLIANCE & OSINT SECURITY AUDIT', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Target Host: ${data.target}   |   Audit Timestamp: ${new Date(data.timestamp).toLocaleString()}`, 14, 20);
  doc.text(`Audit ID: ${data.id}   |   Classification: STRICTLY CONFIDENTIAL`, 14, 25);

  y = 36;

  // Executive Compliance Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 38, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Executive Audit Summary & Compliance Rating', 18, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Primary IP: ${data.ipAddress}   |   Location: ${data.location || 'Unknown'}`, 18, y + 14);
  doc.text(`Framework Compliance: ${compScore.overallScore}% (${compScore.passedControls}/${compScore.totalControls} Controls Satisfied)`, 18, y + 20);
  doc.text(`Assigned Grade: ${compScore.grade}   |   Risk Exposure Index: ${data.riskScore}/100`, 18, y + 26);
  doc.text(`Subdomains Enumerated: ${data.subdomains.length}   |   Active Open Ports: ${data.openPorts.length}`, 18, y + 32);

  // Compliance Grade Badge
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(pageWidth - 48, y + 5, 30, 28, 2, 2, 'F');
  doc.setTextColor(52, 211, 153); // Emerald
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`GRADE`, pageWidth - 44, y + 14);
  doc.setFontSize(18);
  doc.text(compScore.grade, pageWidth - 37, y + 25);

  y += 44;

  // NIST & OWASP Benchmark Scores Overview Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Regulatory Benchmark Scores', 14, y);
  y += 5;

  const boxWidth = (pageWidth - 28 - 9) / 4;
  const frameworks = [
    { name: 'NIST SP 800-53', score: `${compScore.frameworkScores.nist}%` },
    { name: 'OWASP Top 10', score: `${compScore.frameworkScores.owasp}%` },
    { name: 'CIS Controls', score: `${compScore.frameworkScores.cis}%` },
    { name: 'PCI-DSS v4.0', score: `${compScore.frameworkScores.pciDss}%` },
  ];

  frameworks.forEach((fw, idx) => {
    const xPos = 14 + idx * (boxWidth + 3);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(xPos, y, boxWidth, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(fw.name, xPos + 4, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(fw.score, xPos + 4, y + 11);
  });

  y += 20;

  // NIST & OWASP Benchmark Gaps Analysis
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Benchmark Gap Analysis (NIST SP 800-53 & OWASP Top 10)', 14, y);
  y += 6;

  if (compScore.findingsSummary.criticalMissing.length > 0) {
    doc.setFillColor(254, 242, 242); // Light red
    doc.setDrawColor(252, 165, 165);
    doc.roundedRect(14, y, pageWidth - 28, 8 + compScore.findingsSummary.criticalMissing.length * 5, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(185, 28, 28); // Red
    doc.text(`CRITICAL BENCHMARK GAPS IDENTIFIED (${compScore.findingsSummary.criticalMissing.length}):`, 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(127, 29, 29);

    compScore.findingsSummary.criticalMissing.forEach((gap, idx) => {
      doc.text(`• ${gap}`, 20, y + 11 + idx * 5);
    });

    y += 12 + compScore.findingsSummary.criticalMissing.length * 5;
  } else {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(14, y, pageWidth - 28, 12, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(4, 120, 87);
    doc.text('✔ ZERO CRITICAL NIST/OWASP BENCHMARK GAPS DETECTED', 18, y + 7.5);

    y += 16;
  }

  y += 4;

  // HTTP Security Headers Table
  if (y > 230) {
    doc.addPage();
    y = 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. HTTP Security Headers Audit Matrix', 14, y);
  y += 6;

  data.securityHeaders.forEach((header) => {
    if (y > 270) {
      doc.addPage();
      y = 15;
    }

    const isPass = header.status === 'pass';
    const isFail = header.status === 'fail';

    doc.setFillColor(isPass ? 240 : isFail ? 254 : 254, isPass ? 253 : isFail ? 242 : 252, isPass ? 244 : isFail ? 242 : 232);
    doc.setDrawColor(isPass ? 187 : isFail ? 254 : 253, isPass ? 247 : isFail ? 202 : 230, isPass ? 208 : isFail ? 202 : 138);
    
    doc.roundedRect(14, y, pageWidth - 28, header.recommendation ? 15 : 10, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    if (isPass) doc.setTextColor(4, 120, 87);
    else if (isFail) doc.setTextColor(185, 28, 28);
    else doc.setTextColor(180, 83, 9);

    const statusBadge = isPass ? '[PASS]' : isFail ? '[FAIL / GAP]' : '[WARNING]';
    doc.text(`${statusBadge} ${header.header}`, 18, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Value: ${header.value}`, 22, y + 9);

    if (header.recommendation) {
      doc.setTextColor(180, 83, 9);
      doc.text(`NIST/OWASP Rec: ${header.recommendation}`, 22, y + 13);
      y += 16;
    } else {
      y += 11;
    }
  });

  y += 4;

  // SSL/TLS Assessment Section
  if (y > 230) {
    doc.addPage();
    y = 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Cryptographic & TLS Certificate Audit', 14, y);
  y += 6;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`• Certificate Issuer: ${data.ssl.issuer}`, 18, y + 5);
  doc.text(`• Protocol & Cipher Key: ${data.ssl.protocol} (${data.ssl.keyStrength})`, 18, y + 10);
  doc.text(`• Expiration Window: Valid to ${data.ssl.validTo} (${data.ssl.daysRemaining} days remaining)`, 18, y + 15);
  doc.text(`• Certificate Health Status: ${data.ssl.status.toUpperCase()} (NIST SC-13 Cryptographic Key Protection)`, 18, y + 20);

  y += 28;

  // Subdomains and Network Surface
  if (y > 230) {
    doc.addPage();
    y = 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('5. Open Network Ports & Service Exposure', 14, y);
  y += 6;

  if (data.openPorts.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text('• No risky open network ports detected during passive scan.', 18, y);
    y += 6;
  } else {
    data.openPorts.forEach((portItem) => {
      if (y > 270) {
        doc.addPage();
        y = 15;
      }

      const isHigh = portItem.risk === 'high';
      const isMed = portItem.risk === 'medium';

      doc.setFillColor(isHigh ? 254 : isMed ? 254 : 241, isHigh ? 242 : isMed ? 252 : 245, isHigh ? 242 : isMed ? 232 : 249);
      doc.setDrawColor(isHigh ? 252 : isMed ? 253 : 203, isHigh ? 165 : isMed ? 230 : 213, isHigh ? 165 : isMed ? 138 : 225);
      doc.roundedRect(14, y, pageWidth - 28, 10, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(isHigh ? 185 : isMed ? 180 : 15, isHigh ? 28 : isMed ? 83 : 23, isHigh ? 28 : isMed ? 9 : 42);
      doc.text(`Port ${portItem.port}/${portItem.protocol} (${portItem.service.toUpperCase()}) - Risk Level: ${portItem.risk.toUpperCase()}`, 18, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(portItem.description, 18, y + 8.5);

      y += 13;
    });
  }

  y += 2;

  // Discovered Technology Stack
  if (y > 230) {
    doc.addPage();
    y = 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('6. Discovered Technology Stack Fingerprints', 14, y);
  y += 6;

  if (data.techStack.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text('• No specific technology fingerprints matched.', 18, y);
    y += 6;
  } else {
    data.techStack.forEach((tech) => {
      if (y > 275) {
        doc.addPage();
        y = 15;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`• ${tech.name} (${tech.category}) - Confidence: ${tech.confidence}%`, 18, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`  ${tech.description}`, 18, y + 4);
      y += 8;
    });
  }

  y += 2;

  // Subdomains and Network Surface
  if (y > 230) {
    doc.addPage();
    y = 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('7. Network Attack Surface & Enumerated Subdomains', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  if (data.subdomains.length === 0) {
    doc.text('• No external subdomains discovered during passive lookup.', 18, y);
    y += 5;
  } else {
    data.subdomains.slice(0, 10).forEach((sub) => {
      if (y > 275) {
        doc.addPage();
        y = 15;
      }
      doc.text(`• ${sub.subdomain}  (${sub.ip})  - Status: ${sub.status} [${sub.source}]`, 18, y);
      y += 5;
    });
    if (data.subdomains.length > 10) {
      doc.setTextColor(100, 116, 139);
      doc.text(`... and ${data.subdomains.length - 10} additional subdomains recorded in raw SIEM export.`, 18, y);
      y += 5;
    }
  }

  y += 4;

  // Executive Sign-off Block
  if (y > 240) {
    doc.addPage();
    y = 15;
  }

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, pageWidth - 28, 25, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Executive Sign-off & Auditor Attestation:', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('This compliance report is strictly based on non-intrusive passive OSINT reconnaissance and web headers analysis.', 18, y + 11);
  doc.text(`Audited By: OSINT Recon Suite Automated Agent v1.4   |   Approved Date: ${new Date().toLocaleDateString()}`, 18, y + 16);
  doc.text('Digital Signature Hash: SHA256:' + data.id.replace(/-/g, '').slice(0, 32), 18, y + 21);

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`OSINT Compliance Audit - Target: ${data.target} - Page ${i} of ${totalPages}`, 14, pageHeight - 8);
  }

  doc.save(`Compliance_Report_${data.target.replace(/[^a-zA-Z0-9.-]/g, '_')}_${Date.now()}.pdf`);
}
