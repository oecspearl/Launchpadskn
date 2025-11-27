import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export Curriculum to PDF
 * Generates a professional syllabus/curriculum document
 */
export const exportCurriculumToPDF = (curriculumData, offering) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- Cover Page ---
    doc.setFontSize(24);
    doc.text(curriculumData.frontMatter?.coverPage?.title || 'Curriculum Document', pageWidth / 2, 60, { align: 'center' });

    doc.setFontSize(16);
    doc.text(curriculumData.frontMatter?.coverPage?.subjectName || offering?.subject?.subject_name || 'Subject', pageWidth / 2, 80, { align: 'center' });
    doc.text(curriculumData.frontMatter?.coverPage?.academicYear || '2024-2025', pageWidth / 2, 90, { align: 'center' });

    if (curriculumData.frontMatter?.coverPage?.ministryBranding) {
        doc.setFontSize(12);
        doc.text('Ministry of Education', pageWidth / 2, 40, { align: 'center' });
        doc.text('Saint Kitts and Nevis', pageWidth / 2, 46, { align: 'center' });
    }

    doc.addPage();

    // --- Introduction ---
    if (curriculumData.frontMatter?.introduction) {
        doc.setFontSize(16);
        doc.text('Introduction', 14, 20);
        doc.setFontSize(11);
        const splitIntro = doc.splitTextToSize(curriculumData.frontMatter.introduction, pageWidth - 28);
        doc.text(splitIntro, 14, 30);
        doc.addPage();
    }

    // --- Topics & Units ---
    doc.setFontSize(16);
    doc.text('Curriculum Content', 14, 20);

    let yPos = 30;

    curriculumData.topics.forEach((topic, index) => {
        // Check for page break
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        // Topic Header
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Topic ${topic.topicNumber}: ${topic.title}`, 14, yPos);
        yPos += 10;

        // Topic Details
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        if (topic.strandIdentification) {
            doc.text(`Strand: ${topic.strandIdentification}`, 14, yPos);
            yPos += 7;
        }

        // Essential Learning Outcomes
        if (topic.essentialLearningOutcomes && topic.essentialLearningOutcomes.length > 0) {
            doc.text('Essential Learning Outcomes:', 14, yPos);
            yPos += 7;
            topic.essentialLearningOutcomes.forEach(elo => {
                const splitElo = doc.splitTextToSize(`• ${elo}`, pageWidth - 35);
                doc.text(splitElo, 20, yPos);
                yPos += (splitElo.length * 5) + 2;
            });
        }

        // Units Table
        if (topic.instructionalUnits && topic.instructionalUnits.length > 0) {
            const tableBody = topic.instructionalUnits.map(unit => [
                unit.scoNumber,
                unit.title,
                unit.specificCurriculumOutcomes || '',
                unit.duration || ''
            ]);

            doc.autoTable({
                startY: yPos,
                head: [['SCO', 'Unit Title', 'Specific Outcomes', 'Duration']],
                body: tableBody,
                margin: { left: 14, right: 14 },
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 10, cellPadding: 3 }
            });

            yPos = doc.lastAutoTable.finalY + 15;
        } else {
            yPos += 10;
        }
    });

    // Save PDF
    doc.save(`Curriculum_${offering?.subject?.subject_name || 'Export'}.pdf`);
};

export default exportCurriculumToPDF;
