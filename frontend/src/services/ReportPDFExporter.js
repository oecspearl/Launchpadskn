import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = {
  primary: [41, 128, 185],
  success: [39, 174, 96],
  warning: [243, 156, 18],
  danger: [231, 76, 60],
  dark: [52, 73, 94],
  light: [236, 240, 241]
};

/**
 * Add a styled header to the PDF page
 */
function addHeader(doc, title, subtitle, date) {
  const pageWidth = doc.internal.pageSize.width;

  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(title, 14, 12);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  if (subtitle) doc.text(subtitle, 14, 20);

  doc.setFontSize(9);
  doc.text(date || new Date().toLocaleDateString(), pageWidth - 14, 20, { align: 'right' });

  doc.setTextColor(0, 0, 0);
}

/**
 * Add page numbers to all pages
 */
function addPageNumbers(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 8,
      { align: 'center' }
    );
  }
}

/**
 * Export Overview Report
 */
export function exportOverviewPDF(stats, studentsByForm, userDistribution, institutionName) {
  const doc = new jsPDF();
  const title = institutionName ? `${institutionName} — Overview Report` : 'Overview Report';
  addHeader(doc, title, 'System Overview & Statistics', new Date().toLocaleDateString());

  let y = 38;

  // Key metrics table
  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.text('Key Metrics', 14, y);
  y += 4;

  doc.autoTable({
    startY: y,
    head: [['Metric', 'Count']],
    body: [
      ['Students', String(stats.students || 0)],
      ['Teachers', String(stats.teachers || 0)],
      ['Classes', String(stats.classes || 0)],
      ['Subjects', String(stats.subjects || 0)],
      ['Forms', String(stats.forms || 0)]
    ],
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 1: { halign: 'center' } }
  });

  y = doc.lastAutoTable.finalY + 14;

  // Students by Form
  if (studentsByForm?.length) {
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Students by Form', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Form', 'Students']],
      body: studentsByForm.map(f => [f.name, String(f.students)]),
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { fillColor: COLORS.success },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 1: { halign: 'center' } }
    });

    y = doc.lastAutoTable.finalY + 14;
  }

  // User Distribution
  if (userDistribution?.length) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('User Distribution by Role', 14, y);
    y += 4;

    const total = userDistribution.reduce((s, u) => s + u.count, 0);
    doc.autoTable({
      startY: y,
      head: [['Role', 'Count', 'Percentage']],
      body: userDistribution.map(u => [
        u.role,
        String(u.count),
        total > 0 ? `${((u.count / total) * 100).toFixed(1)}%` : '0%'
      ]),
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { fillColor: COLORS.warning },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' } }
    });
  }

  addPageNumbers(doc);
  doc.save('Overview_Report.pdf');
}

/**
 * Export Academic Performance Report
 */
export function exportAcademicPDF(performanceData, gradeDistribution, rankings, filters, institutionName) {
  const doc = new jsPDF('landscape');
  const title = institutionName ? `${institutionName} — Academic Performance` : 'Academic Performance Report';
  const filterParts = [];
  if (filters?.termLabel) filterParts.push(`Term: ${filters.termLabel}`);
  if (filters?.formLabel) filterParts.push(`Form: ${filters.formLabel}`);
  if (filters?.classLabel) filterParts.push(`Class: ${filters.classLabel}`);
  const subtitle = filterParts.length ? filterParts.join(' | ') : 'All Terms';

  addHeader(doc, title, subtitle, new Date().toLocaleDateString());

  let y = 38;

  // Performance by class-subject
  if (performanceData?.length) {
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Class Subject Averages', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Form', 'Class', 'Subject', 'Avg %', 'Highest', 'Lowest', 'Students']],
      body: performanceData.map(r => [
        r.formName,
        r.className,
        r.subjectName,
        `${r.averageGrade}%`,
        `${r.highest}%`,
        `${r.lowest}%`,
        String(r.studentCount)
      ]),
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' }
      }
    });

    y = doc.lastAutoTable.finalY + 14;
  }

  // Grade Distribution
  if (gradeDistribution && Object.values(gradeDistribution).some(v => v > 0)) {
    if (y > 150) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Grade Distribution', 14, y);
    y += 4;

    const total = Object.values(gradeDistribution).reduce((s, v) => s + v, 0);
    doc.autoTable({
      startY: y,
      head: [['Grade', 'Count', 'Percentage', 'Range']],
      body: [
        ['A', String(gradeDistribution.A), `${total > 0 ? ((gradeDistribution.A / total) * 100).toFixed(1) : 0}%`, '80-100%'],
        ['B', String(gradeDistribution.B), `${total > 0 ? ((gradeDistribution.B / total) * 100).toFixed(1) : 0}%`, '70-79%'],
        ['C', String(gradeDistribution.C), `${total > 0 ? ((gradeDistribution.C / total) * 100).toFixed(1) : 0}%`, '60-69%'],
        ['D', String(gradeDistribution.D), `${total > 0 ? ((gradeDistribution.D / total) * 100).toFixed(1) : 0}%`, '50-59%'],
        ['F', String(gradeDistribution.F), `${total > 0 ? ((gradeDistribution.F / total) * 100).toFixed(1) : 0}%`, 'Below 50%']
      ],
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { fillColor: COLORS.success },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } }
    });

    y = doc.lastAutoTable.finalY + 14;
  }

  // Top Students
  if (rankings?.top?.length) {
    if (y > 150) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Top Performing Students', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Rank', 'Name', 'Average %', 'Assessments']],
      body: rankings.top.map((s, i) => [
        String(i + 1),
        s.name,
        `${s.average}%`,
        String(s.assessmentCount)
      ]),
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } }
    });

    y = doc.lastAutoTable.finalY + 14;
  }

  // Bottom Students
  if (rankings?.bottom?.length) {
    if (y > 150) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Students Needing Support', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Rank', 'Name', 'Average %', 'Assessments']],
      body: rankings.bottom.map((s, i) => [
        String(rankings.bottom.length - i),
        s.name,
        `${s.average}%`,
        String(s.assessmentCount)
      ]),
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { fillColor: COLORS.danger },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } }
    });
  }

  addPageNumbers(doc);
  doc.save('Academic_Performance_Report.pdf');
}

/**
 * Export Attendance Report
 */
export function exportAttendancePDF(attendanceData, filters, institutionName) {
  const doc = new jsPDF();
  const title = institutionName ? `${institutionName} — Attendance Report` : 'Attendance Report';
  const filterParts = [];
  if (filters?.startDate) filterParts.push(`From: ${filters.startDate}`);
  if (filters?.endDate) filterParts.push(`To: ${filters.endDate}`);
  const subtitle = filterParts.length ? filterParts.join(' | ') : 'All Dates';

  addHeader(doc, title, subtitle, new Date().toLocaleDateString());

  let y = 38;

  if (attendanceData?.length) {
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Attendance by Class', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Form', 'Class', 'Total', 'Present', 'Absent', 'Late', 'Excused', 'Rate']],
      body: attendanceData.map(r => [
        r.formName,
        r.className,
        String(r.totalRecords),
        String(r.present),
        String(r.absent),
        String(r.late),
        String(r.excused || 0),
        `${r.rate}%`
      ]),
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 7) {
          const rate = parseFloat(data.cell.raw);
          if (rate < 80) {
            data.cell.styles.textColor = COLORS.danger;
            data.cell.styles.fontStyle = 'bold';
          } else if (rate >= 95) {
            data.cell.styles.textColor = COLORS.success;
          }
        }
      }
    });

    y = doc.lastAutoTable.finalY + 14;

    // Summary
    const totalRecords = attendanceData.reduce((s, r) => s + r.totalRecords, 0);
    const totalPresent = attendanceData.reduce((s, r) => s + r.present, 0);
    const totalAbsent = attendanceData.reduce((s, r) => s + r.absent, 0);
    const totalLate = attendanceData.reduce((s, r) => s + r.late, 0);
    const overallRate = totalRecords > 0 ? Math.round(((totalPresent + totalLate) / totalRecords) * 1000) / 10 : 0;

    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Attendance Records', String(totalRecords)],
        ['Total Present', String(totalPresent)],
        ['Total Absent', String(totalAbsent)],
        ['Total Late', String(totalLate)],
        ['Overall Attendance Rate', `${overallRate}%`],
        ['Classes Below 80%', String(attendanceData.filter(r => r.rate < 80).length)]
      ],
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { fillColor: COLORS.dark },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 1: { halign: 'center' } }
    });
  } else {
    doc.setFontSize(12);
    doc.text('No attendance data available for the selected filters.', 14, y);
  }

  addPageNumbers(doc);
  doc.save('Attendance_Report.pdf');
}

/**
 * Export data as CSV
 */
export function exportCSV(data, columns, filename) {
  if (!data?.length) return;

  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      const val = typeof c.key === 'function' ? c.key(row) : row[c.key];
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
