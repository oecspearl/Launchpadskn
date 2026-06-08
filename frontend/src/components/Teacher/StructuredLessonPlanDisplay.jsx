import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import './StructuredLessonPlanDisplay.css';

/**
 * Renders a lesson plan for display. Generated plans are markdown (headings,
 * lists, tables, bold); content edited in TinyMCE comes back as HTML. Detect
 * which and render appropriately so the user never sees raw markup.
 */
function StructuredLessonPlanDisplay({ lessonPlanText }) {
  const text = (lessonPlanText == null ? '' : String(lessonPlanText)).trim();

  if (!text) {
    return (
      <div className="structured-lesson-plan markdown-body">
        <p className="text-muted mb-0">No lesson plan content.</p>
      </div>
    );
  }

  const looksLikeHtml = /<\/?(p|div|h[1-6]|ul|ol|li|table|thead|tbody|tr|td|th|strong|em|b|i|br|span|blockquote)[\s>/]/i.test(text);

  if (looksLikeHtml) {
    return (
      <div
        className="structured-lesson-plan markdown-body"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }}
      />
    );
  }

  return (
    <div className="structured-lesson-plan markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

export default StructuredLessonPlanDisplay;
