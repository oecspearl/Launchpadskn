/**
 * Curriculum Service
 * Reads and (for admins) edits the structured national curriculum:
 *   curriculum_subjects -> curriculum_topics -> curriculum_subtopics
 *     -> curriculum_outcomes (SCOs) + curriculum_strategies + curriculum_content_notes
 *
 * RLS: authenticated users can read; only admins/super_admins can write.
 */
import { supabase } from '../config/supabase';

const chunk = (arr) => arr; // .in() handles our sizes (<1k) fine

export const curriculumService = {
  // ── Reads ──────────────────────────────────────────────────────────
  async getSubjects() {
    const { data, error } = await supabase
      .from('curriculum_subjects')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  /**
   * Load the full hierarchy for one subject, assembled into a nested tree:
   * topic.subtopics[].{outcomes[], strategies[], notes[]}
   */
  async getSubjectTree(subjectId) {
    if (!subjectId) return { topics: [] };

    const [topicsRes, notesRes] = await Promise.all([
      supabase.from('curriculum_topics').select('*').eq('subject_id', subjectId)
        .order('sort_order', { ascending: true }).order('topic_number', { ascending: true }),
      supabase.from('curriculum_content_notes').select('*').eq('subject_id', subjectId)
    ]);
    if (topicsRes.error) throw topicsRes.error;
    const topics = topicsRes.data || [];
    const notes = notesRes.data || [];
    if (topics.length === 0) return { topics: [] };

    const topicIds = topics.map(t => t.id);
    const { data: subtopics = [], error: stErr } = await supabase
      .from('curriculum_subtopics').select('*').in('topic_id', topicIds)
      .order('sort_order', { ascending: true });
    if (stErr) throw stErr;

    const subtopicIds = subtopics.map(s => s.id);
    let outcomes = [], strategies = [];
    if (subtopicIds.length > 0) {
      const [outRes, stratRes] = await Promise.all([
        supabase.from('curriculum_outcomes').select('*').in('subtopic_id', chunk(subtopicIds))
          .order('sort_order', { ascending: true }).order('sco_number', { ascending: true }),
        supabase.from('curriculum_strategies').select('*').in('subtopic_id', chunk(subtopicIds))
      ]);
      if (outRes.error) throw outRes.error;
      if (stratRes.error) throw stratRes.error;
      outcomes = outRes.data || [];
      strategies = stratRes.data || [];
    }

    // index children by parent
    const outBySub = groupBy(outcomes, 'subtopic_id');
    const stratBySub = groupBy(strategies, 'subtopic_id');
    const notesBySub = groupBy(notes.filter(n => n.subtopic_id), 'subtopic_id');
    const subsByTopic = groupBy(subtopics, 'topic_id');

    const tree = topics.map(t => ({
      ...t,
      subtopics: (subsByTopic[t.id] || []).map(s => ({
        ...s,
        outcomes: outBySub[s.id] || [],
        strategies: stratBySub[s.id] || [],
        notes: notesBySub[s.id] || []
      }))
    }));

    return {
      topics: tree,
      subjectNotes: notes.filter(n => !n.subtopic_id),
      counts: {
        topics: topics.length,
        subtopics: subtopics.length,
        outcomes: outcomes.length,
        strategies: strategies.length
      }
    };
  },

  // ── Topic CRUD (admin) ─────────────────────────────────────────────
  createTopic: (payload) => insert('curriculum_topics', payload),
  updateTopic: (id, updates) => update('curriculum_topics', id, updates),
  deleteTopic: (id) => remove('curriculum_topics', id),

  // ── Subtopic CRUD ──────────────────────────────────────────────────
  createSubtopic: (payload) => insert('curriculum_subtopics', payload),
  updateSubtopic: (id, updates) => update('curriculum_subtopics', id, updates),
  deleteSubtopic: (id) => remove('curriculum_subtopics', id),

  // ── Outcome (SCO) CRUD ─────────────────────────────────────────────
  createOutcome: (payload) => insert('curriculum_outcomes', payload),
  updateOutcome: (id, updates) => update('curriculum_outcomes', id, updates),
  deleteOutcome: (id) => remove('curriculum_outcomes', id),

  // ── Strategy CRUD ──────────────────────────────────────────────────
  createStrategy: (payload) => insert('curriculum_strategies', payload),
  updateStrategy: (id, updates) => update('curriculum_strategies', id, updates),
  deleteStrategy: (id) => remove('curriculum_strategies', id),

  // ── Subject CRUD (admin) ───────────────────────────────────────────
  createSubject: (payload) => insert('curriculum_subjects', payload),
  updateSubject: (id, updates) => update('curriculum_subjects', id, updates),
};

// ── helpers ──────────────────────────────────────────────────────────
function groupBy(rows, key) {
  return (rows || []).reduce((acc, r) => {
    (acc[r[key]] = acc[r[key]] || []).push(r);
    return acc;
  }, {});
}

async function insert(table, payload) {
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) throw error;
  return data;
}
async function update(table, id, updates) {
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
async function remove(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  return true;
}

export default curriculumService;
