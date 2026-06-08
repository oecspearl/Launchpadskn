/**
 * Shared lesson-plan formatter.
 *
 * The AI lesson planner returns either a markdown string or a deeply-nested
 * structured object (sections like "1. LESSON HEADER", an OBJECTIVES TABLE with
 * a `columns` array, "3. LESSON COMPONENTS" with `sub_activities`, etc.). This
 * turns any of those shapes into readable GitHub-flavored markdown so the UI
 * never shows raw JSON.
 *
 * Single source of truth — used by EnhancedLessonPlannerForm, LessonPlanOutput,
 * and LessonPlanning. Do not re-implement per component.
 */

// "1. LESSON HEADER" -> "Lesson Header", "teacher_instructions" -> "Teacher Instructions"
export const humanizeKey = (k) =>
  String(k)
    .replace(/^\s*\d+[.)]\s*/, '') // strip "1. " / "2) " prefixes
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Render an objectives "columns" array (e.g. Knowledge/Skills/Values) as a table.
const objectivesTable = (columns) => {
  if (!Array.isArray(columns) || columns.length === 0) return '';
  const keys = Object.keys(columns[0] || {});
  if (keys.length === 0) return '';
  const esc = (v) => String(v ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');
  let md = '| ' + keys.map(humanizeKey).join(' | ') + ' |\n';
  md += '| ' + keys.map(() => '---').join(' | ') + ' |\n';
  columns.forEach((row) => {
    md += '| ' + keys.map((k) => esc(row[k])).join(' | ') + ' |\n';
  });
  return md + '\n';
};

// Recursively convert any value (string/array/object) into markdown.
const toMarkdown = (value, depth = 2) => {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return `${value}\n\n`;
  }
  if (Array.isArray(value)) {
    let md = '';
    value.forEach((item, i) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const title = item.name || item.title || `Item ${i + 1}`;
        md += `${'#'.repeat(Math.min(depth, 6))} ${humanizeKey(title)}\n\n`;
        const rest = { ...item };
        delete rest.name;
        delete rest.title;
        md += toMarkdown(rest, depth + 1);
      } else {
        md += `- ${item}\n`;
      }
    });
    return md + '\n';
  }
  if (typeof value === 'object') {
    if (Array.isArray(value.columns)) return objectivesTable(value.columns);
    let md = '';
    for (const [k, v] of Object.entries(value)) {
      const label = humanizeKey(k);
      if (v && typeof v === 'object') {
        md += `${'#'.repeat(Math.min(depth, 6))} ${label}\n\n`;
        md += toMarkdown(v, depth + 1);
      } else if (v != null && String(v).trim()) {
        md += `**${label}:** ${v}\n\n`;
      }
    }
    return md;
  }
  return '';
};

/**
 * Format a structured lesson-plan object (or string) into markdown.
 * Accepts the whole plan ({ lesson_title, learning_objectives, lesson_plan })
 * or just the lesson_plan body.
 */
export const formatStructuredLessonPlan = (planObj) => {
  if (planObj == null) return '';
  if (typeof planObj === 'string') return planObj;
  if (typeof planObj !== 'object') return String(planObj);

  let md = '';
  if (planObj.lesson_title) md += `# ${planObj.lesson_title}\n\n`;
  if (planObj.learning_objectives) {
    md += `## Learning Objectives\n\n${planObj.learning_objectives}\n\n`;
  }

  const body = planObj.lesson_plan;
  if (body && typeof body === 'object') {
    md += toMarkdown(body, 2);
  } else if (typeof body === 'string') {
    md += body;
  } else {
    // planObj itself is the structured plan body (no lesson_plan wrapper)
    const { lesson_title, learning_objectives, content, ...rest } = planObj;
    md += toMarkdown(rest, 2);
  }
  return md.trim() || JSON.stringify(planObj, null, 2);
};

/**
 * Coerce any lesson-plan value (string or object) to a display string.
 */
export const lessonPlanToString = (plan) => {
  if (!plan) return '';
  if (typeof plan === 'string') return plan;
  return formatStructuredLessonPlan(plan);
};
