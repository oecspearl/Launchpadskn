import React from 'react';
import {
  FaVideo, FaImage, FaLink, FaClipboardCheck, FaTasks, FaClipboardList,
  FaFileSignature, FaProjectDiagram, FaPoll, FaGraduationCap, FaBook,
  FaLightbulb, FaQuestionCircle, FaComments, FaFileAlt, FaCheckCircle
} from 'react-icons/fa';

/**
 * Pure presentation/formatting helpers for the lesson content manager.
 * Extracted from LessonContentManager.jsx — no component state, safe to share.
 */

export const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 45;
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return Math.round((end - start) / (1000 * 60));
};

export const getContentIcon = (type) => {
  switch (type) {
    case 'VIDEO':
      return <FaVideo className="me-2" />;
    case 'IMAGE':
      return <FaImage className="me-2" />;
    case 'LINK':
      return <FaLink className="me-2" />;
    case 'QUIZ':
      return <FaClipboardCheck className="me-2 text-danger" />;
    case 'ASSIGNMENT':
      return <FaTasks className="me-2 text-warning" />;
    case 'TEST':
      return <FaClipboardList className="me-2 text-info" />;
    case 'EXAM':
      return <FaFileSignature className="me-2 text-danger" />;
    case 'PROJECT':
      return <FaProjectDiagram className="me-2 text-success" />;
    case 'SURVEY':
      return <FaPoll className="me-2 text-primary" />;
    case 'LEARNING_OUTCOMES':
      return <FaGraduationCap className="me-2 text-primary" />;
    case 'LEARNING_ACTIVITIES':
      return <FaBook className="me-2 text-success" />;
    case 'KEY_CONCEPTS':
      return <FaLightbulb className="me-2 text-warning" />;
    case 'REFLECTION_QUESTIONS':
      return <FaQuestionCircle className="me-2 text-info" />;
    case 'DISCUSSION_PROMPTS':
      return <FaComments className="me-2 text-purple" />;
    case 'SUMMARY':
      return <FaFileAlt className="me-2 text-secondary" />;
    default:
      return <FaFileAlt className="me-2" />;
  }
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const getYouTubeEmbedUrl = (url) => {
  if (!url) return '';
  // Extract video ID from various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

// Escape HTML to prevent XSS
export const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Build table HTML with proper structure
export const buildTableHTML = (headers, rows, hasHeaders) => {
  // Determine number of columns from headers or first row
  const numCols = headers.length > 0 ? headers.length : (rows.length > 0 ? rows[0].length : 0);
  if (numCols === 0) return '';

  let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 1rem 0; table-layout: fixed; border: 2px solid #212529;">';

  // Add headers if we have them
  if (hasHeaders && headers.length > 0) {
    tableHtml += '<thead><tr>';
    headers.forEach((header, idx) => {
      const colWidth = idx === 0 ? '20%' : `${80 / (headers.length - 1)}%`;
      tableHtml += `<th style="border: 2px solid #212529; padding: 0.75rem; background-color: #f8f9fa; font-weight: 600; text-align: left; width: ${colWidth}; word-wrap: break-word; overflow-wrap: break-word;">${escapeHtml(header)}</th>`;
    });
    tableHtml += '</tr></thead>';
  }

  // Add body rows
  tableHtml += '<tbody>';
  const rowsToRender = hasHeaders && headers.length > 0 ? rows : rows;
  rowsToRender.forEach(row => {
    tableHtml += '<tr>';
    // Ensure row has correct number of cells
    const paddedRow = [...row];
    while (paddedRow.length < numCols) {
      paddedRow.push('');
    }
    paddedRow.slice(0, numCols).forEach((cell, idx) => {
      const colWidth = idx === 0 ? '20%' : `${80 / (numCols - 1)}%`;
      tableHtml += `<td style="border: 1px solid #212529; padding: 0.75rem; width: ${colWidth}; word-wrap: break-word; overflow-wrap: break-word; vertical-align: top;">${escapeHtml(cell)}</td>`;
    });
    tableHtml += '</tr>';
  });
  tableHtml += '</tbody></table>';

  return tableHtml;
};

export const formatRubricForDisplay = (rubricText) => {
  if (!rubricText) return '';

  // Convert markdown-style tables to HTML tables
  const lines = rubricText.split('\n');
  const processedLines = [];
  let inTable = false;
  let tableRows = [];
  let tableHeaders = [];
  let headerSeparatorFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line is a table row (contains |)
    if (line.includes('|') && line.split('|').filter(c => c.trim()).length > 1) {
      // Check if it's a header separator (contains dashes and optional colons)
      if (line.match(/^[\|\s\-:]+$/) && !headerSeparatorFound) {
        // This is a separator row - mark that we have headers
        headerSeparatorFound = true;
        inTable = true;
        continue;
      }

      // Extract cells - split by | and filter out empty strings
      const rawCells = line.split('|');
      const cells = rawCells
        .map(c => c.trim())
        .filter((c, idx) => {
          // Keep first and last if they're not empty, or all middle ones
          if (idx === 0 || idx === rawCells.length - 1) {
            return c.length > 0;
          }
          return true;
        });

      // Ensure we have valid cells
      if (cells.length < 2) {
        // Not a valid table row, treat as regular text
        if (inTable && tableRows.length > 0) {
          // Close the table first
          processedLines.push(buildTableHTML(tableHeaders, tableRows, headerSeparatorFound));
          tableRows = [];
          tableHeaders = [];
          inTable = false;
          headerSeparatorFound = false;
        }
        if (line) {
          processedLines.push(`<p style="margin: 0.5rem 0;">${escapeHtml(line)}</p>`);
        } else {
          processedLines.push('<br />');
        }
        continue;
      }

      if (!inTable && !headerSeparatorFound) {
        // First row - treat as headers
        tableHeaders = cells;
        tableRows.push(cells);
      } else if (headerSeparatorFound && tableRows.length === 0) {
        // We had a separator, so previous row was headers, this is first data row
        tableRows.push(cells);
      } else {
        // Data row
        tableRows.push(cells);
      }
      inTable = true;
    } else {
      // Not a table row
      if (inTable && tableRows.length > 0) {
        // Close the table
        processedLines.push(buildTableHTML(tableHeaders, tableRows, headerSeparatorFound));
        tableRows = [];
        tableHeaders = [];
        inTable = false;
        headerSeparatorFound = false;
      }

      // Add regular text
      if (line) {
        processedLines.push(`<p style="margin: 0.5rem 0;">${escapeHtml(line)}</p>`);
      } else {
        processedLines.push('<br />');
      }
    }
  }

  // Handle any remaining table
  if (inTable && tableRows.length > 0) {
    processedLines.push(buildTableHTML(tableHeaders, tableRows, headerSeparatorFound));
  }

  return processedLines.join('\n');
};

export function getSectionIcon(sectionName) {
  const icons = {
    'Introduction': <FaGraduationCap className="section-icon" />,
    'Learning': <FaBook className="section-icon" />,
    'Practice': <FaTasks className="section-icon" />,
    'Assessment': <FaClipboardCheck className="section-icon" />,
    'Review': <FaLightbulb className="section-icon" />,
    'Closure': <FaCheckCircle className="section-icon" />
  };
  return icons[sectionName] || <FaBook className="section-icon" />;
}
