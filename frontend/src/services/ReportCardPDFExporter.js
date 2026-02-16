import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = {
  primary: [41, 128, 185],
  dark: [52, 73, 94],
  light: [236, 240, 241],
  success: [39, 174, 96],
  danger: [231, 76, 60]
};

/**
 * Generate a single-student report card PDF
 */
export function exportReportCardPDF(reportCard, institutionName) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;

  // ── Header ──
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(institutionName || 'School Report Card', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('STUDENT REPORT CARD', pageWidth / 2, 24, { align: 'center' });

  doc.setTextColor(0, 0, 0);

  // ── Student Info ──
  let y = 42;

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  const formName = reportCard.form?.form_name || `Form ${reportCard.form?.form_number}`;
  const studentName = reportCard.student?.name || reportCard.student?.email || 'Student';

  const infoLeft = [
    ['Student:', studentName],
    ['Form:', formName],
    ['Class:', reportCard.class?.class_name || '']
  ];
  const infoRight = [
    ['Academic Year:', reportCard.academic_year || ''],
    ['Term:', `Term ${reportCard.term}`],
    ['Class Rank:', reportCard.class_rank ? `${reportCard.class_rank}` : '—']
  ];

  doc.setFontSize(10);
  infoLeft.forEach(([label, val], i) => {
    doc.setFont(undefined, 'bold');
    doc.text(label, margin, y + i * 7);
    doc.setFont(undefined, 'normal');
    doc.text(val, margin + 30, y + i * 7);
  });

  infoRight.forEach(([label, val], i) => {
    doc.setFont(undefined, 'bold');
    doc.text(label, pageWidth / 2 + 10, y + i * 7);
    doc.setFont(undefined, 'normal');
    doc.text(val, pageWidth / 2 + 50, y + i * 7);
  });

  y += 28;

  // ── Grades Table ──
  const grades = reportCard.grades || [];
  if (grades.length) {
    doc.autoTable({
      startY: y,
      head: [['Subject', 'Coursework', 'Exam', 'Final Mark', 'Grade', 'Effort', 'Comment']],
      body: grades.map(g => [
        g.subject_name || '',
        g.coursework_avg != null ? `${g.coursework_avg}%` : '—',
        g.exam_mark != null ? `${g.exam_mark}%` : '—',
        g.final_mark != null ? `${g.final_mark}%` : '—',
        g.grade_letter || '—',
        g.effort_grade || '—',
        g.teacher_comment || ''
      ]),
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { halign: 'center', cellWidth: 22 },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', cellWidth: 15 },
        5: { halign: 'center', cellWidth: 15 },
        6: { cellWidth: 'auto' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 4) {
          const grade = data.cell.raw;
          if (grade === 'A') data.cell.styles.textColor = COLORS.success;
          else if (grade === 'F') data.cell.styles.textColor = COLORS.danger;
        }
      }
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Overall Average ──
  if (reportCard.overall_average != null) {
    doc.setFillColor(...COLORS.light);
    doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`Overall Average: ${reportCard.overall_average}%`, margin + 4, y + 7);
    if (reportCard.class_rank) {
      doc.text(`Class Rank: ${reportCard.class_rank}`, pageWidth - margin - 4, y + 7, { align: 'right' });
    }
    y += 16;
  }

  // ── Attendance Box ──
  if (reportCard.total_school_days > 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Attendance', margin, y);
    y += 3;

    doc.autoTable({
      startY: y,
      head: [['Days Present', 'Days Absent', 'Days Late', 'Total Days', 'Attendance Rate']],
      body: [[
        String(reportCard.days_present || 0),
        String(reportCard.days_absent || 0),
        String(reportCard.days_late || 0),
        String(reportCard.total_school_days || 0),
        reportCard.attendance_percentage != null ? `${reportCard.attendance_percentage}%` : '—'
      ]],
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: { fillColor: COLORS.dark, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3, halign: 'center' }
    });

    y = doc.lastAutoTable.finalY + 10;
  }

  // ── Comments Section ──
  const comments = [
    { label: 'Conduct', value: reportCard.conduct_grade },
    { label: 'Form Teacher Comment', value: reportCard.form_teacher_comment },
    { label: 'Principal Comment', value: reportCard.principal_comment }
  ].filter(c => c.value);

  if (comments.length) {
    if (y > 230) { doc.addPage(); y = 20; }

    comments.forEach(c => {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`${c.label}:`, margin, y);
      y += 5;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(c.value, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 4 + 6;
    });
  }

  // ── Next Term ──
  if (reportCard.next_term_begins) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Next Term Begins: ${new Date(reportCard.next_term_begins).toLocaleDateString()}`, margin, y);
    y += 12;
  }

  // ── Signature Lines ──
  if (y > 250) { doc.addPage(); y = 20; }
  const sigY = Math.max(y + 5, 255);
  doc.setDrawColor(150, 150, 150);
  doc.setFontSize(9);

  // Form Teacher signature
  doc.line(margin, sigY, margin + 60, sigY);
  doc.text('Form Teacher Signature', margin, sigY + 5);

  // Principal signature
  doc.line(pageWidth - margin - 60, sigY, pageWidth - margin, sigY);
  doc.text('Principal Signature', pageWidth - margin - 60, sigY + 5);

  // ── Page Numbers ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 8,
      { align: 'center' }
    );
  }

  doc.save(`Report_Card_${studentName.replace(/\s+/g, '_')}_Term${reportCard.term}.pdf`);
}

/**
 * Batch export: generate one PDF per student, or all in one PDF
 */
export function exportBatchReportCardsPDF(reportCards, institutionName) {
  if (!reportCards?.length) return;

  if (reportCards.length === 1) {
    return exportReportCardPDF(reportCards[0], institutionName);
  }

  // For batch, generate individual PDFs
  reportCards.forEach(rc => {
    exportReportCardPDF(rc, institutionName);
  });
}
