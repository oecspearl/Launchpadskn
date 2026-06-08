#!/usr/bin/env node
/**
 * Supabase schema audit / guardrail.
 *
 * Scans the frontend for supabase query chains and flags columns that don't
 * exist on the target table (the "schema drift" bug class). Heuristic but
 * catches select columns, embeds, filters (.eq/.in/.order/...), and
 * insert/update/upsert keys.
 *
 * Usage:  node scripts/audit-supabase-schema.mjs
 * Refresh SCHEMA from the DB with:
 *   select table_name, string_agg(column_name, ',' order by ordinal_position)
 *   from information_schema.columns where table_schema='public' group by 1;
 * Refresh FUNCTIONS (callable via supabase.rpc) from the DB with:
 *   select proname from pg_proc
 *   where pronamespace='public'::regnamespace and prokind='f' order by 1;
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// ── Live schema snapshot (public schema). Keep in sync with the DB. ──────────
const SCHEMA_RAW = {
  arvr_content: 'id,title,description,content_type,subject_id,form_level,file_url,thumbnail_url,external_url,metadata,is_published,created_by,created_at,updated_at',
  class_instructors: 'id,class_id,instructor_id,role,is_active,created_at',
  class_subjects: 'id,class_id,subject_id,teacher_id,periods_per_week,room,is_active,created_at',
  classes: 'id,form_id,name,capacity,room,form_tutor_id,is_active,created_at',
  collaborative_documents: 'id,document_id,session_id,title,content,content_type,last_edited_by,last_edited_at,created_by,created_at,updated_at',
  content_library: 'library_id,title,description,content_type,status,tags,subject_id,form_id,is_public,is_featured,is_required,rating_average,rating_count,use_count,view_count,url,file_path,file_name,file_size,mime_type,instructions,learning_outcomes,learning_activities,key_concepts,reflection_questions,discussion_prompts,summary,content_section,estimated_minutes,content_data,metadata,assignment_details_file_path,assignment_details_file_name,assignment_details_file_size,assignment_details_mime_type,assignment_rubric_file_path,assignment_rubric_file_name,assignment_rubric_file_size,assignment_rubric_mime_type,shared_by,published_at,created_at',
  content_library_usage: 'usage_id,library_id,lesson_id,content_id,used_by,created_at',
  curriculum_ai_suggestions: 'id,suggestion_id,offering_id,context_type,context_path,learning_outcome,suggestion_type,suggestion_data,confidence_score,used,used_at,created_at',
  curriculum_gaps: 'id,gap_id,class_subject_id,severity,gap_type,topic_number,unit_number,sco_number,description,recommended_action,resolved,identified_at,resolved_at,resolved_by,created_at',
  curriculum_resources: 'id,resource_id,title,description,resource_type,url,tags,rating,usage_count,is_public,subject_id,created_by,created_at,updated_at',
  curriculum_templates: 'id,template_id,template_name,description,subject_id,form_id,curriculum_structure,is_public,usage_count,tags,created_by,created_at,updated_at',
  departments: 'id,institution_id,name,code,head_of_department_id,contact_email,description,is_active,created_at',
  forms: 'id,institution_id,name,level,academic_year,coordinator_id,is_active,created_at',
  institutions: 'id,name,code,address,phone,email,website,logo_url,principal_name,is_active,created_at,updated_at,type,island',
  learner_progress: 'id,user_id,content_id,completion_percentage,completed_at,last_accessed_at,created_at,updated_at',
  lesson_attendance: 'id,lesson_id,student_id,status,notes,marked_by,created_at',
  lesson_content: 'id,lesson_id,content_type,title,description,file_url,external_url,order_index,is_required,instructions,learning_outcomes,key_concepts,discussion_prompts,created_at,content_data,content_section,estimated_minutes,file_path,file_name,file_size,mime_type,edu_content_id,lesson_phase',
  lesson_template_content: 'id,template_id,content_type,title,description,url,original_content_id,library_content_id,instructions,learning_outcomes,learning_activities,key_concepts,reflection_questions,discussion_prompts,summary,content_section,is_required,estimated_minutes,sequence_order,content_data,metadata,created_at',
  lesson_template_usage: 'id,template_id,lesson_id,used_by,created_at',
  lesson_templates: 'id,template_id,template_name,description,topic,lesson_title,learning_objectives,lesson_plan,homework_description,status,subject_id,form_id,is_public,is_featured,estimated_duration,use_count,view_count,content_count,rating_count,rating_average,tags,created_by,published_at,created_at,updated_at',
  lessons: 'id,class_subject_id,title,date,start_time,end_time,location,topic,learning_objectives,lesson_plan,homework_description,homework_due_date,status,created_at,updated_at',
  messages: 'id,conversation_id,sender_id,content,created_at',
  notifications: 'id,user_id,type,title,message,priority,is_read,link,created_at,archived_at',
  parent_student_links: 'id,parent_id,student_id,relationship,is_primary,created_at,consent_status,consent_date,consent_version,consent_method',
  quiz_options: 'id,question_id,option_text,is_correct,option_order,created_at',
  quiz_questions: 'id,quiz_id,question_type,question_text,points,order_index,explanation,created_at',
  quizzes: 'id,lesson_content_id,title,description,instructions,time_limit_minutes,passing_score,max_attempts,show_results_immediately,show_correct_answers,randomize_questions,randomize_answers,is_published,created_at,class_subject_id,due_date',
  report_card_grades: 'id,report_card_id,subject_id,coursework_average,exam_mark,final_mark,grade_letter,effort_grade,teacher_comment,teacher_id,created_at',
  report_cards: 'id,student_id,class_id,academic_year,term,days_present,days_absent,days_late,total_school_days,conduct_grade,form_teacher_comment,principal_comment,overall_average,class_rank,status,published_at,next_term_start,created_at',
  student_class_assignments: 'id,student_id,class_id,academic_year,is_active,created_at',
  student_class_subjects_view: 'student_id,class_id,class_name,form_id,form_name,form_level,class_subject_id,subject_id,subject_name,subject_code,teacher_id,teacher_first_name,teacher_last_name',
  student_grades: 'id,assessment_id,student_id,marks_obtained,percentage,grade_letter,comment,is_excused,graded_by,graded_at,created_at,criterion_scores',
  student_submissions: 'id,submission_id,assessment_id,student_id,submission_text,file_url,file_path,file_name,submitted_at,created_at,updated_at',
  subject_assessments: 'id,class_subject_id,title,type,total_marks,weight,due_date,term,sba_component,description,is_published,created_at,rubric_id',
  subject_form_offerings: 'id,subject_id,form_id,is_active,created_at',
  subjects: 'id,name,code,cxc_code,department_id,description,is_active,created_at,category,is_core,form_levels',
  teacher_class_subjects_view: 'teacher_id,class_subject_id,class_id,class_name,form_id,form_name,form_level,institution_id,subject_id,subject_name,subject_code,periods_per_week,room',
  tutor_conversations: 'id,student_id,class_subject_id,title,created_at,updated_at',
  tutor_messages: 'id,conversation_id,role,content,resources,created_at',
  tutor_settings: 'id,class_subject_id,is_enabled,created_at,updated_at,difficulty_level,response_style,tone,allowed_topics,max_hints_per_question,show_worked_examples,allow_off_topic,custom_instructions',
  users: 'id,email,first_name,last_name,role,phone,date_of_birth,address,profile_image_url,institution_id,is_active,force_password_change,created_at,updated_at,consent_given,consent_date,consent_version,last_login_at',
};

const SCHEMA = Object.fromEntries(Object.entries(SCHEMA_RAW).map(([t, c]) => [t, new Set(c.split(','))]));
const TABLES = new Set(Object.keys(SCHEMA));

// ── Live function snapshot (public schema, callable via supabase.rpc). ────────
// Keep in sync with the DB (see header for the refresh query). Internal trigger
// helpers are included for completeness; the app shouldn't .rpc() them, but
// listing them keeps the snapshot a faithful mirror of pg_proc.
const FUNCTIONS = new Set([
  'check_rate_limit',
  'create_lifecycle_event',
  'get_forum_posts',
  'get_forum_topics',
  'get_group_projects',
  'get_project_tasks',
  'get_student_accommodations',
  'get_student_disciplinary_records',
  'get_student_disciplinary_summary',
  'get_student_lifecycle',
  'get_student_profile',
  'get_student_special_needs',
  'get_student_transfers',
  'get_tutoring_sessions',
  'get_user_institution',
  'get_user_role',
  'increment_library_view_count',
  'increment_resource_usage',
  'increment_template_usage',
  'increment_template_view_count',
  'is_admin',
  'is_conversation_member',
  'rls_auto_enable',
  'update_curriculum_updated_at',
  'update_project_progress',
  'update_updated_at',
  'update_updated_at_column',
]);

// ── Baseline of KNOWN-missing RPCs (accepted, tracked tech debt). ─────────────
// These functions are called by the app but do NOT exist in the DB. They power
// feature areas (gamification, curriculum analytics, collaboration, student
// information, interactive content) that were never finished server-side, so
// they fail silently behind try/catch. They are baselined so CI stays green
// while still FAILING on any *new* missing RPC. As each is resolved — the SQL
// function is created, or the dead call is removed — delete it from this list.
const KNOWN_MISSING_RPCS = new Set([
  'award_points', 'calculate_time_allocation',
  'get_active_sessions', 'get_arvr_content', 'get_coverage_summary',
  'get_curriculum_coverage', 'get_gap_analysis', 'get_leaderboard',
  'get_learning_path_stages', 'get_outcome_achievement_summary',
  'get_session_participants', 'get_student_badges', 'get_student_gamification',
  'get_student_learning_path', 'get_time_allocation_analysis', 'get_virtual_labs',
  'identify_curriculum_gaps', 'join_session', 'leave_session',
  'update_coverage_from_lessons', 'update_learning_path_progress',
]);

// Tables we don't have a snapshot for -> skip (avoid false positives).
function known(table) { return SCHEMA[table]; }

// Parse a PostgREST select string into validations: {table, col} pairs.
function parseSelect(sel, table, out) {
  const cols = SCHEMA[table];
  let depth = 0, cur = '';
  const items = [];
  for (const ch of sel) {
    if (ch === '(') { depth++; cur += ch; }
    else if (ch === ')') { depth--; cur += ch; }
    else if (ch === ',' && depth === 0) { items.push(cur); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) items.push(cur);

  for (let raw of items) {
    raw = raw.trim();
    if (!raw || raw === '*') continue;
    const paren = raw.indexOf('(');
    if (paren !== -1) {
      // embed:  [alias:]relation(inner)
      let head = raw.slice(0, paren).trim();
      const inner = raw.slice(paren + 1, raw.lastIndexOf(')'));
      let rel = head.includes(':') ? head.split(':').pop() : head;
      rel = rel.split('!')[0].trim(); // strip FK hint
      if (TABLES.has(rel)) parseSelect(inner, rel, out);
      // else: unknown relation, can't validate inner — skip
      continue;
    }
    // plain column or alias:col
    let col = raw.includes(':') ? raw.split(':').pop().trim() : raw;
    col = col.split('->')[0].trim().replace(/::.*$/, ''); // strip json/cast
    if (!col || col === '*') continue;
    if (cols && !cols.has(col)) out.push({ table, col });
  }
}

const FILTER_RE = /\.(?:eq|neq|gt|gte|lt|lte|like|ilike|is|in|contains|order|match)\(\s*['"`]([^'"`]+)['"`]/g;
const WRITE_RE = /\.(insert|update|upsert)\(/g;

function auditFile(path, rel, findings) {
  const src = readFileSync(path, 'utf8');
  const fromRe = /\.from\(\s*['"`](\w+)['"`]\s*\)/g;
  let m;
  const froms = [];
  while ((m = fromRe.exec(src)) !== null) froms.push({ table: m[1], idx: m.index });

  for (let i = 0; i < froms.length; i++) {
    const { table, idx } = froms[i];
    if (!known(table)) continue;
    // Bound the query chain at its statement end (`;`) so filters belonging to a
    // later statement / an inline subquery's table aren't mis-attributed.
    const semi = src.indexOf(';', idx);
    const nextFrom = i + 1 < froms.length ? froms[i + 1].idx : Infinity;
    const end = Math.min(nextFrom, semi === -1 ? src.length : semi + 1, idx + 1600);
    const chunk = src.slice(idx, end);
    const lineOf = (off) => src.slice(0, idx + off).split('\n').length;

    // select(...)
    const selMatch = chunk.match(/\.select\(\s*([`'"])([\s\S]*?)\1/);
    if (selMatch) {
      const bad = [];
      parseSelect(selMatch[2], table, bad);
      for (const b of bad) findings.push({ rel, line: lineOf(selMatch.index), table: b.table, col: b.col, kind: 'select' });
    }
    // filters
    let f;
    FILTER_RE.lastIndex = 0;
    while ((f = FILTER_RE.exec(chunk)) !== null) {
      const colArg = f[1];
      if (colArg.includes('.')) continue; // nested embed filter path — skip
      const cols = SCHEMA[table];
      if (cols && !cols.has(colArg)) findings.push({ rel, line: lineOf(f.index), table, col: colArg, kind: 'filter' });
    }
    // insert/update/upsert object keys (top-level only)
    let w;
    WRITE_RE.lastIndex = 0;
    while ((w = WRITE_RE.exec(chunk)) !== null) {
      const openObj = chunk.indexOf('{', w.index);
      if (openObj === -1 || openObj - w.index > 12) continue;
      // capture balanced object
      let d = 0, j = openObj, body = '';
      for (; j < chunk.length; j++) { const c = chunk[j]; if (c === '{') d++; if (c === '}') { d--; if (d === 0) { break; } } body += c; }
      // top-level keys
      let dd = 0; const keyRe = /(?:^|[,{])\s*(\w+)\s*:/g; let km;
      const bodyTop = body.replace(/\{[\s\S]*?\}/g, ''); // crude: drop nested objects
      while ((km = keyRe.exec(',' + bodyTop)) !== null) {
        const key = km[1];
        const cols = SCHEMA[table];
        if (cols && !cols.has(key)) findings.push({ rel, line: lineOf(w.index), table, col: key, kind: 'write' });
      }
    }
  }
}

// Scan supabase.rpc('fn', ...) calls and flag function names that don't exist
// in the DB (the "missing RPC" bug class — silent failures behind try/catch).
const RPC_RE = /\.rpc\(\s*['"`]([a-zA-Z_]\w*)['"`]/g;
function auditRpc(path, rel, out) {
  const src = readFileSync(path, 'utf8');
  let m;
  RPC_RE.lastIndex = 0;
  while ((m = RPC_RE.exec(src)) !== null) {
    const fn = m[1];
    if (!FUNCTIONS.has(fn)) {
      const line = src.slice(0, m.index).split('\n').length;
      out.push({ rel, line, fn });
    }
  }
}

const ROOT = join(process.cwd(), 'frontend', 'src');
const findings = [];
const rpcFindings = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { if (name !== 'node_modules') walk(p); continue; }
    if (!['.js', '.jsx', '.ts', '.tsx'].includes(extname(p))) continue;
    if (/subjectCompat|userCompat|lessonCompat/.test(p)) continue; // shims define aliases intentionally
    auditFile(p, p.replace(process.cwd() + '/', ''), findings);
    auditRpc(p, p.replace(process.cwd() + '/', ''), rpcFindings);
  }
}
walk(ROOT);

// Split RPC findings: baselined (tracked debt, non-blocking) vs new (blocking).
const newRpc = rpcFindings.filter(f => !KNOWN_MISSING_RPCS.has(f.fn));
const baselinedRpc = rpcFindings.filter(f => KNOWN_MISSING_RPCS.has(f.fn));

if (findings.length === 0 && newRpc.length === 0) {
  console.log('✅ No schema-drift column or new missing-RPC issues found.');
  if (baselinedRpc.length) {
    const fns = new Set(baselinedRpc.map(f => f.fn));
    console.log(`ℹ️  ${fns.size} known-missing RPC functions still baselined (tracked debt — see KNOWN_MISSING_RPCS).`);
  }
  process.exit(0);
}

if (findings.length) {
  const byTable = {};
  for (const f of findings) (byTable[f.table] ??= []).push(f);
  console.log(`⚠️  ${findings.length} potential schema-drift issues across ${new Set(findings.map(f => f.rel)).size} files:\n`);
  for (const [table, list] of Object.entries(byTable).sort((a, b) => b[1].length - a[1].length)) {
    const badCols = [...new Set(list.map(f => f.col))];
    console.log(`■ ${table} (${list.length}) — bad columns: ${badCols.join(', ')}`);
    for (const f of list.slice(0, 4)) console.log(`    ${f.kind} '${f.col}'  ${f.rel}:${f.line}`);
    if (list.length > 4) console.log(`    … +${list.length - 4} more`);
  }
  console.log('');
}

if (newRpc.length) {
  const byFn = {};
  for (const f of newRpc) (byFn[f.fn] ??= []).push(f);
  const fns = Object.entries(byFn).sort((a, b) => b[1].length - a[1].length);
  console.log(`❌ ${newRpc.length} calls to ${fns.length} NEW RPC function(s) that don't exist in the DB:\n`);
  for (const [fn, list] of fns) {
    console.log(`■ ${fn}() — ${list.length} call site(s)`);
    for (const f of list.slice(0, 3)) console.log(`    ${f.rel}:${f.line}`);
    if (list.length > 3) console.log(`    … +${list.length - 3} more`);
  }
  console.log('\n   → Create the SQL function, or remove the call. To intentionally');
  console.log('     accept it as debt, add the name to KNOWN_MISSING_RPCS.\n');
}

if (baselinedRpc.length) {
  const fns = new Set(baselinedRpc.map(f => f.fn));
  console.log(`ℹ️  ${fns.size} known-missing RPC functions baselined (tracked debt, non-blocking).`);
}
process.exit(findings.length || newRpc.length ? 1 : 0);
