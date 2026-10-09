import { jsPDF } from 'jspdf';
import { RepositoryModel } from '../types/atlas';

export function generateRepositoryPdfReport(repo: RepositoryModel) {
  const { graph } = repo;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Total lines and functions
  const totalLines = repo.files.reduce((a, b) => a + b.linesCount, 0);
  const totalClasses = repo.files.reduce(
    (acc, f) => acc + f.symbols.filter(s => s.kind === 'class').length,
    0
  );
  const totalFunctions = repo.files.reduce(
    (acc, f) => acc + f.symbols.filter(s => s.kind === 'function' || s.kind === 'component').length,
    0
  );

  // -------------------------------------------------------------
  // 1. Header Banner (Navy / Dark Modern Theme)
  // -------------------------------------------------------------
  doc.setFillColor(11, 15, 25); // #0b0f19
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Brand Tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(99, 102, 241); // indigo
  doc.text('ATLAS  •  PROJECT INTELLIGENCE PLATFORM', margin, 12);

  // Document Title
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('CODEBASE ARCHITECTURE & HEALTH REPORT', margin, 20);

  // Subtitle / Repo Info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(148, 163, 184); // slate-400
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.text(
    `Repository: ${repo.fullName}  |  Branch: ${repo.branch}  |  Date: ${generatedDate}`,
    margin,
    28
  );

  // Description
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  const descSnippet = repo.description.length > 95 ? `${repo.description.slice(0, 95)}...` : repo.description;
  doc.text(descSnippet, margin, 35);

  let currentY = 50;

  // -------------------------------------------------------------
  // 2. Executive KPI Summary Cards
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('1. EXECUTIVE REPOSITORY METRICS', margin, currentY);
  currentY += 4;

  const cardWidth = (contentWidth - 6) / 4;
  const cardHeight = 16;
  const kpis = [
    { label: 'Total Files', value: `${repo.files.length}` },
    { label: 'Total Lines', value: `${totalLines.toLocaleString()}` },
    { label: 'Classes / Interfaces', value: `${totalClasses}` },
    { label: 'Functions / Comps', value: `${totalFunctions}` },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 2);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.rect(cardX, currentY, cardWidth, cardHeight, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(kpi.label, cardX + 3, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, cardX + 3, currentY + 12);
  });

  currentY += cardHeight + 8;

  // -------------------------------------------------------------
  // 3. Codebase Health & Integrity Overview
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. ARCHITECTURE HEALTH & COUPLING INTEGRITY', margin, currentY);
  currentY += 4;

  const healthCardWidth = (contentWidth - 4) / 3;
  const healthCards = [
    {
      title: 'Graph Health Score',
      score: `${graph.metrics.healthScore}%`,
      sub: graph.metrics.healthScore >= 90 ? 'Excellent Stability' : 'Attention Recommended',
      color: [16, 185, 129], // emerald
    },
    {
      title: 'Coupling Hotspots',
      score: `${graph.couplingHotspots.length} Modules`,
      sub: 'Afferent Coupling Ca >= 3',
      color: [245, 158, 11], // amber
    },
    {
      title: 'Circular Dependencies',
      score: `${graph.circularDependencies.length} Violations`,
      sub: graph.circularDependencies.length === 0 ? 'Zero recursion cycles' : 'Cycles require breaking',
      color: graph.circularDependencies.length === 0 ? [16, 185, 129] : [244, 63, 94],
    },
  ];

  healthCards.forEach((c, idx) => {
    const cX = margin + idx * (healthCardWidth + 2);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(cX, currentY, healthCardWidth, 20, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, cX + 4, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.score, cX + 4, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(c.sub, cX + 4, currentY + 17);
  });

  currentY += 26;

  // -------------------------------------------------------------
  // 4. Cognitive Load & Developer Velocity
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. COGNITIVE LOAD & MENTAL STRAIN ASSESSMENT', margin, currentY);
  currentY += 4;

  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, contentWidth, 18, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Dependency Density & Working Memory Index:', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const cogDesc =
    'Cognitive load index measures the mental tracking required for a developer to safely modify modules. Evaluates fan-out coupling, cyclomatic density, and transitive graph blast radius.';
  doc.text(doc.splitTextToSize(cogDesc, contentWidth - 8), margin + 4, currentY + 11);

  currentY += 24;

  // -------------------------------------------------------------
  // 5. Architectural Subsystem Distribution
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. ARCHITECTURAL SUBSYSTEM DOMAINS', margin, currentY);
  currentY += 5;

  const clusterEntries = Object.entries(graph.clusters).filter(([_, files]) => files.length > 0);
  const clusterColWidth = contentWidth / 2 - 2;

  clusterEntries.forEach(([clusterName, files], idx) => {
    const isRightCol = idx % 2 === 1;
    const colX = isRightCol ? margin + clusterColWidth + 4 : margin;
    const rowY = currentY + Math.floor(idx / 2) * 11;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(colX, rowY, clusterColWidth, 9, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`• ${clusterName}`, colX + 3, rowY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${files.length} file(s)`, colX + clusterColWidth - 16, rowY + 5.5);
  });

  currentY += Math.ceil(clusterEntries.length / 2) * 11 + 6;

  // -------------------------------------------------------------
  // 6. Top High-Coupling Hotspots Table
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('5. HIGH-COUPLING HOTSPOTS (BLAST RADIUS AUDIT)', margin, currentY);
  currentY += 4;

  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('FILE PATH', margin + 3, currentY + 4.5);
  doc.text('SUBSYSTEM', margin + 85, currentY + 4.5);
  doc.text('CALLERS (Ca)', margin + 120, currentY + 4.5);
  doc.text('IMPORTS (Ce)', margin + 145, currentY + 4.5);
  doc.text('INSTABILITY', margin + 168, currentY + 4.5);
  currentY += 7;

  // Table Rows (Top 6 hotspots)
  const topHotspots = graph.couplingHotspots.slice(0, 6);
  if (topHotspots.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No high-coupling risk hotspots detected.', margin + 3, currentY + 5);
    currentY += 8;
  } else {
    topHotspots.forEach((h, hIdx) => {
      const fileObj = repo.fileMap[h.filePath];
      const isEven = hIdx % 2 === 0;
      doc.setFillColor(isEven ? 250 : 255, isEven ? 250 : 255, isEven ? 250 : 255);
      doc.rect(margin, currentY, contentWidth, 6.5, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      const displayPath = h.filePath.length > 40 ? `...${h.filePath.slice(-37)}` : h.filePath;
      doc.text(displayPath, margin + 3, currentY + 4.5);

      doc.setTextColor(100, 116, 139);
      doc.text(fileObj?.moduleCluster || 'Module', margin + 85, currentY + 4.5);

      doc.setTextColor(h.afferentCoupling >= 3 ? 245 : 71, h.afferentCoupling >= 3 ? 158 : 85, h.afferentCoupling >= 3 ? 11 : 105);
      doc.text(`${h.afferentCoupling}`, margin + 126, currentY + 4.5);

      doc.setTextColor(71, 85, 105);
      doc.text(`${h.efferentCoupling}`, margin + 151, currentY + 4.5);
      doc.text(`${h.instability}`, margin + 172, currentY + 4.5);

      currentY += 6.5;
    });
  }

  // -------------------------------------------------------------
  // Footer
  // -------------------------------------------------------------
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated by ATLAS Project Intelligence Platform  •  Grounded in Deterministic Static Graph', margin, pageHeight - 9);
  doc.text('Page 1 of 1', pageWidth - margin - 16, pageHeight - 9);

  // Trigger browser download
  const cleanName = repo.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  doc.save(`${cleanName}_architecture_health_report.pdf`);
}
