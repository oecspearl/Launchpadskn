import React, { useState, useMemo, useEffect } from "react";
import {
  Search, Plus, Pencil, Trash2, ChevronRight, ChevronDown,
  BookOpen, Target, Lightbulb, ClipboardCheck,
  GraduationCap, Filter, MoreHorizontal, X, Save,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContextSupabase";
import { curriculumService } from "../../services/curriculumService";

/* ──────────────────────────────────────────────────────────────
   LaunchPad · SKN — Curriculum Explorer (master–detail)
   Wired to curriculum_subjects → topics → subtopics →
   outcomes / strategies. Admins edit inline; teachers read-only.
   ────────────────────────────────────────────────────────────── */

const BLOOM = {
  REMEMBER:   { rank: 1, label: "Remember" },
  UNDERSTAND: { rank: 2, label: "Understand" },
  APPLY:      { rank: 3, label: "Apply" },
  ANALYSE:    { rank: 4, label: "Analyse" },
  EVALUATE:   { rank: 5, label: "Evaluate" },
  CREATE:     { rank: 6, label: "Create" },
};
const BLOOM_ALIAS = { ANALYZE: "ANALYSE" };
const BLOOM_OPTIONS = ["Remember", "Understand", "Apply", "Analyse", "Evaluate", "Create", "Knowledge", "Skills", "Values"];

function bloomKey(level) {
  if (!level) return null;
  const u = String(level).toUpperCase().trim();
  return BLOOM_ALIAS[u] || u;
}

function BloomTag({ level }) {
  if (!level) return null;
  const b = BLOOM[bloomKey(level)] || { rank: 0, label: level };
  return (
    <span className="ce-bloom" data-rank={b.rank} title={b.rank ? `Bloom level ${b.rank} of 6` : "Domain category"}>
      {b.rank > 0 && <span className="ce-bloom-rank">{b.rank}</span>}
      {b.label}
    </span>
  );
}

function RowMenu({ canEdit, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  if (!canEdit) return null;
  return (
    <div className="ce-rowmenu">
      <button className="ce-rowmenu-trigger" onClick={() => setOpen((o) => !o)} aria-label="Row actions">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="ce-rowmenu-pop" onMouseLeave={() => setOpen(false)}>
          <button onClick={() => { setOpen(false); onEdit(); }}><Pencil size={13} /> Edit</button>
          <button className="is-danger" onClick={() => { setOpen(false); onDelete(); }}><Trash2 size={13} /> Delete</button>
        </div>
      )}
    </div>
  );
}

// ── Modal field specs ────────────────────────────────────────────
const MODAL_SPEC = {
  topic: {
    title: "Topic",
    fields: [
      { name: "topic_number", label: "Topic Number", type: "number" },
      { name: "code", label: "Code", type: "text" },
      { name: "sort_order", label: "Sort Order", type: "number" },
      { name: "title", label: "Title", type: "text", full: true },
      { name: "strand", label: "Strand", type: "text", full: true },
      { name: "elo", label: "Essential Learning Outcome (ELO)", type: "textarea", full: true },
      { name: "grade_level_guidelines", label: "Grade Level Guidelines (one per line)", type: "textarea", full: true },
    ],
  },
  subtopic: {
    title: "Subtopic",
    fields: [
      { name: "code", label: "Code", type: "text" },
      { name: "sort_order", label: "Sort Order", type: "number" },
      { name: "title", label: "Title", type: "text", full: true },
      { name: "elo", label: "ELO", type: "textarea", full: true },
    ],
  },
  outcome: {
    title: "Outcome (SCO)",
    fields: [
      { name: "sco_number", label: "SCO #", type: "number" },
      { name: "sort_order", label: "Sort Order", type: "number" },
      { name: "bloom_level", label: "Bloom / Domain", type: "select", options: BLOOM_OPTIONS },
      { name: "statement", label: "Statement", type: "textarea", full: true },
    ],
  },
  strategy: {
    title: "Strategy",
    fields: [
      { name: "strategy_type", label: "Type", type: "select", options: ["assessment", "learning"] },
      { name: "sco_refs", label: "Linked SCO refs (e.g. 1,2,3)", type: "text" },
      { name: "title", label: "Title", type: "text", full: true },
      { name: "description", label: "Description", type: "textarea", full: true },
    ],
  },
};
const NUMERIC_FIELDS = new Set(["topic_number", "sort_order", "sco_number"]);
const JSON_LINE_FIELDS = new Set(["grade_level_guidelines"]);

function pickFields(type, data) {
  const out = {};
  MODAL_SPEC[type].fields.forEach((f) => {
    let v = data ? data[f.name] : "";
    if (JSON_LINE_FIELDS.has(f.name)) v = Array.isArray(v) ? v.join("\n") : (typeof v === "string" ? v : "");
    out[f.name] = v ?? "";
  });
  return out;
}
function buildPayload(type, values) {
  const payload = {};
  MODAL_SPEC[type].fields.forEach((f) => {
    const raw = values[f.name];
    if (NUMERIC_FIELDS.has(f.name)) {
      payload[f.name] = raw === "" || raw == null ? null : Number(raw);
    } else if (JSON_LINE_FIELDS.has(f.name)) {
      const lines = typeof raw === "string" ? raw.split("\n").map((l) => l.trim()).filter(Boolean) : (Array.isArray(raw) ? raw : []);
      payload[f.name] = lines.length ? lines : null;
    } else {
      const t = typeof raw === "string" ? raw.trim() : raw;
      payload[f.name] = t === "" || t === undefined ? null : t;
    }
  });
  return payload;
}

function EditModal({ state, onClose, onSave, saving }) {
  const spec = MODAL_SPEC[state.type];
  const [values, setValues] = useState(() => pickFields(state.type, state.mode === "edit" ? state.data : null));
  useEffect(() => { setValues(pickFields(state.type, state.mode === "edit" ? state.data : null)); }, [state]);
  const set = (name, v) => setValues((p) => ({ ...p, [name]: v }));
  return (
    <div className="ce-modal-overlay" onMouseDown={onClose}>
      <div className="ce-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ce-modal-head">
          <h3>{state.mode === "edit" ? "Edit" : "Add"} {spec.title}</h3>
          <button className="ce-modal-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="ce-modal-body">
          {spec.fields.map((f) => (
            <label key={f.name} className={`ce-mfield ${f.full ? "ce-mfield--full" : ""}`}>
              <span>{f.label}</span>
              {f.type === "textarea" ? (
                <textarea rows={f.name === "statement" || f.name === "description" ? 3 : 2}
                  value={values[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} />
              ) : f.type === "select" ? (
                <select value={values[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)}>
                  <option value="">—</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type === "number" ? "number" : "text"}
                  value={values[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} />
              )}
            </label>
          ))}
        </div>
        <div className="ce-modal-foot">
          <button className="ce-btn ce-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="ce-btn ce-btn--primary" disabled={saving} onClick={() => onSave(buildPayload(state.type, values))}>
            <Save size={15} /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Curriculum() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();

  const [subjectId, setSubjectId] = useState("");
  const [activeSubId, setActiveSubId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [query, setQuery] = useState("");
  const [bloomFilter, setBloomFilter] = useState("all");
  const [strandFilter, setStrandFilter] = useState("all");
  const [modal, setModal] = useState(null); // { type, mode, data, parentId }
  const [err, setErr] = useState(null);

  const { data: subjects = [] } = useQuery({
    queryKey: ["curriculum-subjects"],
    queryFn: () => curriculumService.getSubjects(),
  });

  useEffect(() => {
    if (!subjectId && subjects.length > 0) setSubjectId(subjects[0].id);
  }, [subjects, subjectId]);

  const { data: tree, isLoading, error } = useQuery({
    queryKey: ["curriculum-tree", subjectId],
    queryFn: () => curriculumService.getSubjectTree(subjectId),
    enabled: !!subjectId,
  });

  const topics = tree?.topics || [];
  const selectedSubject = subjects.find((s) => s.id === subjectId);

  // filter helpers
  const q = query.trim().toLowerCase();
  const outcomeMatches = (o) =>
    (!q || (o.statement || "").toLowerCase().includes(q)) &&
    (bloomFilter === "all" || o.bloom_level === bloomFilter);

  const subtopicVisible = (topic, st) => {
    if (strandFilter !== "all" && topic.strand !== strandFilter) return false;
    const textHit = !q ||
      (st.title || "").toLowerCase().includes(q) ||
      (topic.title || "").toLowerCase().includes(q) ||
      (st.outcomes || []).some((o) => (o.statement || "").toLowerCase().includes(q));
    const bloomHit = bloomFilter === "all" || (st.outcomes || []).some((o) => o.bloom_level === bloomFilter);
    return textHit && bloomHit;
  };

  // visible tree
  const visibleTopics = useMemo(() => topics
    .filter((t) => strandFilter === "all" || t.strand === strandFilter)
    .map((t) => ({ ...t, _subs: (t.subtopics || []).filter((st) => subtopicVisible(t, st)) }))
    .filter((t) => t._subs.length > 0 || !q), [topics, q, bloomFilter, strandFilter]);

  // auto-expand first topic + select first subtopic when subject/filters change
  useEffect(() => {
    if (visibleTopics.length === 0) { setActiveSubId(null); return; }
    setExpanded((e) => (Object.keys(e).length ? e : { [visibleTopics[0].id]: true }));
    const stillVisible = visibleTopics.some((t) => (t._subs || []).some((s) => s.id === activeSubId));
    if (!stillVisible) {
      const firstTopicWithSubs = visibleTopics.find((t) => (t._subs || []).length > 0);
      setActiveSubId(firstTopicWithSubs ? firstTopicWithSubs._subs[0].id : null);
      if (firstTopicWithSubs) setExpanded((e) => ({ ...e, [firstTopicWithSubs.id]: true }));
    }
  }, [visibleTopics]); // eslint-disable-line

  // active subtopic + its topic
  const active = useMemo(() => {
    for (const t of topics) {
      const st = (t.subtopics || []).find((s) => s.id === activeSubId);
      if (st) return { topic: t, sub: st };
    }
    return null;
  }, [topics, activeSubId]);

  // filter options
  const strandOptions = useMemo(() => [...new Set(topics.map((t) => t.strand).filter(Boolean))], [topics]);
  const bloomOptionsPresent = useMemo(() => {
    const set = new Set();
    topics.forEach((t) => (t.subtopics || []).forEach((s) => (s.outcomes || []).forEach((o) => o.bloom_level && set.add(o.bloom_level))));
    return [...set].sort((a, b) => (BLOOM[bloomKey(a)]?.rank || 99) - (BLOOM[bloomKey(b)]?.rank || 99));
  }, [topics]);

  // counts
  const totals = tree?.counts || { topics: 0, subtopics: 0, outcomes: 0, strategies: 0 };
  const filteredCounts = useMemo(() => {
    let sub = 0, out = 0;
    visibleTopics.forEach((t) => (t._subs || []).forEach((s) => { sub++; out += (s.outcomes || []).filter(outcomeMatches).length; }));
    return { topics: visibleTopics.length, subtopics: sub, outcomes: out };
  }, [visibleTopics, q, bloomFilter]);

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  // ── mutations ──
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const { type, mode, data, parentId } = modal;
      const withParent = { ...payload };
      if (mode === "create") {
        if (type === "topic") withParent.subject_id = subjectId;
        if (type === "subtopic") withParent.topic_id = parentId;
        if (type === "outcome" || type === "strategy") withParent.subtopic_id = parentId;
      }
      const fn = {
        topic: mode === "edit" ? () => curriculumService.updateTopic(data.id, withParent) : () => curriculumService.createTopic(withParent),
        subtopic: mode === "edit" ? () => curriculumService.updateSubtopic(data.id, withParent) : () => curriculumService.createSubtopic(withParent),
        outcome: mode === "edit" ? () => curriculumService.updateOutcome(data.id, withParent) : () => curriculumService.createOutcome(withParent),
        strategy: mode === "edit" ? () => curriculumService.updateStrategy(data.id, withParent) : () => curriculumService.createStrategy(withParent),
      }[type];
      return fn();
    },
    onSuccess: () => { queryClient.invalidateQueries(["curriculum-tree", subjectId]); setModal(null); },
    onError: (e) => setErr(e.message || "Save failed"),
  });

  const deleteItem = async (type, id, label) => {
    if (!window.confirm(`Delete this ${type}${label ? ` (“${label}”)` : ""}? This cannot be undone.`)) return;
    try {
      const fn = { topic: "deleteTopic", subtopic: "deleteSubtopic", outcome: "deleteOutcome", strategy: "deleteStrategy" }[type];
      await curriculumService[fn](id);
      queryClient.invalidateQueries(["curriculum-tree", subjectId]);
    } catch (e) { setErr(e.message || "Delete failed"); }
  };

  return (
    <div className="ce-root">
      <style>{css}</style>

      <header className="ce-header">
        <div className="ce-crumb">Dashboard <ChevronRight size={13} /> Curriculum</div>
        <div className="ce-title-row">
          <div className="ce-title">
            <span className="ce-title-icon"><BookOpen size={20} /></span>
            <div>
              <h1>Curriculum Explorer</h1>
              <p>Browse the national curriculum hierarchy{isAdmin ? " — edit topics, subtopics, outcomes and strategies." : "."}</p>
            </div>
          </div>
          {isAdmin && (
            <button className="ce-btn ce-btn--primary" disabled={!subjectId}
              onClick={() => setModal({ type: "topic", mode: "create" })}>
              <Plus size={16} /> Add Topic
            </button>
          )}
        </div>

        {err && <div className="ce-error" onClick={() => setErr(null)}>{err} <span>(dismiss)</span></div>}

        <div className="ce-filters">
          <label className="ce-field ce-field--grow">
            <span><BookOpen size={13} /> Subject</span>
            <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setExpanded({}); setActiveSubId(null); }}>
              {subjects.length === 0 && <option value="">Loading…</option>}
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.level}</option>)}
            </select>
          </label>
          <label className="ce-field ce-field--search">
            <span><Search size={13} /> Search</span>
            <input placeholder="Search topics, subtopics, outcomes…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label className="ce-field">
            <span><Target size={13} /> Bloom</span>
            <select value={bloomFilter} onChange={(e) => setBloomFilter(e.target.value)}>
              <option value="all">All levels</option>
              {bloomOptionsPresent.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label className="ce-field">
            <span><Filter size={13} /> Strand</span>
            <select value={strandFilter} onChange={(e) => setStrandFilter(e.target.value)} disabled={strandOptions.length === 0}>
              <option value="all">All strands</option>
              {strandOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <div className="ce-summary">
          <span><b>{filteredCounts.topics}</b>/{totals.topics} topics</span>
          <span className="ce-dot" />
          <span><b>{filteredCounts.subtopics}</b>/{totals.subtopics} subtopics</span>
          <span className="ce-dot" />
          <span><b>{filteredCounts.outcomes}</b>/{totals.outcomes} outcomes <em>({totals.strategies} strategies)</em></span>
          {selectedSubject?.framework && <span className="ce-chip">{selectedSubject.framework}</span>}
        </div>
      </header>

      <div className="ce-body">
        <aside className="ce-tree">
          <p className="ce-tree-label">Curriculum map</p>
          {isLoading && <div className="ce-tree-empty">Loading…</div>}
          {!isLoading && visibleTopics.length === 0 && <div className="ce-tree-empty">No matching topics</div>}
          {visibleTopics.map((t) => {
            const isOpen = expanded[t.id];
            const outCount = (t.subtopics || []).reduce((n, s) => n + (s.outcomes || []).length, 0);
            return (
              <div className="ce-tree-topic" key={t.id}>
                <button className={`ce-tree-row ${active?.topic?.id === t.id ? "is-current" : ""}`} onClick={() => toggle(t.id)}>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="ce-tree-code">T{t.topic_number}</span>
                  <span className="ce-tree-name">{t.title}</span>
                  <span className="ce-tree-count">{outCount}</span>
                </button>
                {isOpen && (t._subs || []).length > 0 && (
                  <div className="ce-tree-subs">
                    {t._subs.map((s) => (
                      <button key={s.id} className={`ce-tree-sub ${activeSubId === s.id ? "is-active" : ""}`}
                        onClick={() => setActiveSubId(s.id)}>
                        {s.code && <span className="ce-tree-sub-code">{s.code}</span>}
                        <span>{s.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {isOpen && (t._subs || []).length === 0 && <div className="ce-tree-empty">No subtopics</div>}
              </div>
            );
          })}
        </aside>

        <section className="ce-detail">
          {error && <div className="ce-error">Failed to load curriculum: {error.message}</div>}
          {!error && !active && !isLoading && (
            <div className="ce-detail-empty">
              <BookOpen size={28} />
              <p>{topics.length === 0 ? "No curriculum has been added for this subject yet." : "Select a subtopic from the map to view its outcomes."}</p>
              {isAdmin && topics.length === 0 && <button className="ce-btn ce-btn--primary" onClick={() => setModal({ type: "topic", mode: "create" })}><Plus size={16} /> Add Topic</button>}
            </div>
          )}

          {active && (() => {
            const { topic, sub } = active;
            const outs = (sub.outcomes || []).filter(outcomeMatches);
            const strats = (sub.strategies || []).filter((st) => !q || (st.title || "").toLowerCase().includes(q) || (st.description || "").toLowerCase().includes(q));
            return (
              <>
                <div className="ce-detail-top">
                  <div className="ce-detail-context">
                    <span className="ce-strand">{topic.strand || `Topic ${topic.topic_number}`}</span>
                    <h2>{sub.code && <span className="ce-sub-code">{sub.code}</span>} {sub.title}</h2>
                    {(sub.elo || topic.elo) && <p className="ce-elo"><b>ELO:</b> {sub.elo || topic.elo}</p>}
                  </div>
                  {isAdmin && (
                    <div className="ce-detail-actions">
                      <button className="ce-btn ce-btn--ghost" onClick={() => setModal({ type: "subtopic", mode: "edit", data: sub, parentId: topic.id })}>
                        <Pencil size={14} /> Edit subtopic
                      </button>
                      <button className="ce-btn ce-btn--ghost is-danger" onClick={() => deleteItem("subtopic", sub.id, sub.title)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="ce-block">
                  <div className="ce-block-head">
                    <h3><Target size={15} /> Outcomes <span className="ce-count">{outs.length}</span></h3>
                    {isAdmin && <button className="ce-btn ce-btn--sm" onClick={() => setModal({ type: "outcome", mode: "create", parentId: sub.id })}><Plus size={14} /> Add outcome</button>}
                  </div>
                  <div className="ce-outcomes">
                    {outs.length === 0 && <p className="ce-empty-line">No outcomes match.</p>}
                    {outs.map((o) => (
                      <div className="ce-outcome" key={o.id}>
                        <span className="ce-outcome-n">{o.sco_number}</span>
                        <p className="ce-outcome-text">{o.statement}</p>
                        <BloomTag level={o.bloom_level} />
                        <RowMenu canEdit={isAdmin}
                          onEdit={() => setModal({ type: "outcome", mode: "edit", data: o, parentId: sub.id })}
                          onDelete={() => deleteItem("outcome", o.id, `SCO ${o.sco_number}`)} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ce-block">
                  <div className="ce-block-head">
                    <h3><Lightbulb size={15} /> Teaching &amp; Assessment Strategies <span className="ce-count">{strats.length}</span></h3>
                    {isAdmin && <button className="ce-btn ce-btn--sm" onClick={() => setModal({ type: "strategy", mode: "create", parentId: sub.id })}><Plus size={14} /> Add strategy</button>}
                  </div>
                  <div className="ce-strategies">
                    {strats.length === 0 && <p className="ce-empty-line">No strategies.</p>}
                    {strats.map((st) => (
                      <div className={`ce-strategy ce-strategy--${st.strategy_type === "assessment" ? "assessment" : "learning"}`} key={st.id}>
                        <div className="ce-strategy-icon">
                          {st.strategy_type === "assessment" ? <ClipboardCheck size={15} /> : <GraduationCap size={15} />}
                        </div>
                        <div className="ce-strategy-main">
                          <div className="ce-strategy-head">
                            <span className="ce-strategy-type">{st.strategy_type || "strategy"}</span>
                            <h4>{st.title}</h4>
                          </div>
                          {st.description && <p>{st.description}</p>}
                          {st.sco_refs && <span className="ce-refs">Linked to SCO {st.sco_refs}</span>}
                        </div>
                        <RowMenu canEdit={isAdmin}
                          onEdit={() => setModal({ type: "strategy", mode: "edit", data: st, parentId: sub.id })}
                          onDelete={() => deleteItem("strategy", st.id, st.title)} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </section>
      </div>

      {modal && <EditModal state={modal} onClose={() => setModal(null)} onSave={(p) => saveMutation.mutate(p)} saving={saveMutation.isLoading} />}
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Spline+Sans:wght@400;500;600&family=Spline+Sans+Mono:wght@400;500&display=swap');

.ce-root{
  --ink:#13140f; --ink-2:#2a2b22;
  --parch:#f4f1e8; --card:#fbfaf5; --line:#e1dbcc; --line-2:#ece7da;
  --muted:#8c8779; --muted-2:#a8a394;
  --accent:#1f7a3d; --accent-soft:#e3efe6; --accent-deep:#155c2d;
  --assess:#b4632a; --assess-soft:#f6e9dd;
  --learn:#2d6ca8; --learn-soft:#e2edf6;
  --shadow:0 1px 2px rgba(19,20,15,.04),0 6px 18px rgba(19,20,15,.05);
  --fd:'Fraunces',Georgia,serif; --fb:'Spline Sans',system-ui,sans-serif; --fm:'Spline Sans Mono',monospace;
  background:var(--parch); color:var(--ink); font-family:var(--fb); font-size:14px; line-height:1.5;
  -webkit-font-smoothing:antialiased; min-height:100%;
}
.ce-root *{box-sizing:border-box;}

.ce-header{padding:24px 32px 0; max-width:1320px; margin:0 auto;}
.ce-crumb{font-family:var(--fm); font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); display:flex; align-items:center; gap:6px;}
.ce-title-row{display:flex; align-items:flex-start; justify-content:space-between; gap:20px; margin:14px 0 18px;}
.ce-title{display:flex; gap:14px;}
.ce-title-icon{width:44px; height:44px; flex-shrink:0; border-radius:12px; background:var(--accent); color:#fff; display:grid; place-items:center;}
.ce-title h1{font-family:var(--fd); font-size:30px; font-weight:600; margin:0; letter-spacing:-.01em; line-height:1.1;}
.ce-title p{margin:5px 0 0; color:var(--muted); font-size:14px;}

.ce-btn{display:inline-flex; align-items:center; gap:7px; font-family:var(--fb); font-weight:500; font-size:13.5px; border-radius:9px; border:1px solid transparent; padding:9px 15px; cursor:pointer; transition:.15s; white-space:nowrap;}
.ce-btn:disabled{opacity:.5; cursor:not-allowed;}
.ce-btn--primary{background:var(--accent); color:#fff; box-shadow:0 3px 10px rgba(31,122,61,.28);}
.ce-btn--primary:hover{background:var(--accent-deep);}
.ce-btn--ghost{background:var(--card); border-color:var(--line); color:var(--ink-2);}
.ce-btn--ghost:hover{background:var(--parch);}
.ce-btn--ghost.is-danger{color:#b3261e;}
.ce-btn--sm{background:transparent; border-color:var(--line); color:var(--accent); padding:6px 11px; font-size:12.5px;}
.ce-btn--sm:hover{background:var(--accent-soft);}

.ce-error{background:#fbeae8; border:1px solid #f0c8c4; color:#b3261e; padding:9px 14px; border-radius:9px; font-size:13px; margin-bottom:14px; cursor:pointer;}
.ce-error span{color:#b3261e99; font-size:11px;}

.ce-filters{display:flex; gap:12px; flex-wrap:wrap; margin-bottom:14px;}
.ce-field{display:flex; flex-direction:column; gap:6px; min-width:150px;}
.ce-field--grow{flex:1.4; min-width:240px;}
.ce-field--search{flex:2; min-width:260px;}
.ce-field span{font-family:var(--fm); font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); display:flex; align-items:center; gap:5px;}
.ce-field select,.ce-field input{font-family:var(--fb); font-size:13.5px; color:var(--ink); background:var(--card); border:1px solid var(--line); border-radius:9px; padding:10px 12px; outline:none; transition:.15s; width:100%;}
.ce-field select:focus,.ce-field input:focus{border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft);}

.ce-summary{display:flex; align-items:center; gap:12px; padding:12px 0 20px; font-size:13px; color:var(--muted); flex-wrap:wrap;}
.ce-summary b{color:var(--ink); font-weight:600;}
.ce-summary em{font-style:normal; color:var(--muted-2);}
.ce-dot{width:3px; height:3px; border-radius:50%; background:var(--muted-2);}
.ce-chip{margin-left:auto; font-family:var(--fm); font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--accent-deep); background:var(--accent-soft); padding:5px 11px; border-radius:20px;}

.ce-body{display:grid; grid-template-columns:300px 1fr; gap:24px; padding:8px 32px 56px; max-width:1320px; margin:0 auto; align-items:start;}

.ce-tree{position:sticky; top:20px; background:var(--card); border:1px solid var(--line); border-radius:16px; padding:16px 12px; box-shadow:var(--shadow); max-height:calc(100vh - 40px); overflow:auto;}
.ce-tree-label{font-family:var(--fm); font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); margin:0 0 10px 8px;}
.ce-tree-row{display:flex; align-items:center; gap:8px; width:100%; padding:9px 10px; border:0; background:transparent; border-radius:9px; cursor:pointer; text-align:left; color:var(--ink-2); transition:.13s;}
.ce-tree-row:hover{background:var(--parch);}
.ce-tree-row.is-current{color:var(--ink);}
.ce-tree-code{font-family:var(--fm); font-size:10px; letter-spacing:.04em; color:var(--muted); flex-shrink:0;}
.ce-tree-name{font-size:13px; font-weight:500; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.ce-tree-count{font-family:var(--fm); font-size:10px; color:var(--muted); background:var(--line-2); padding:2px 7px; border-radius:10px; flex-shrink:0;}
.ce-tree-subs{display:flex; flex-direction:column; gap:2px; margin:2px 0 8px 14px; padding-left:8px; border-left:1.5px solid var(--line-2);}
.ce-tree-sub{display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border:0; background:transparent; border-radius:8px; cursor:pointer; text-align:left; font-size:12.5px; color:var(--muted); transition:.13s;}
.ce-tree-sub:hover{background:var(--parch); color:var(--ink-2);}
.ce-tree-sub.is-active{background:var(--accent-soft); color:var(--accent-deep); font-weight:600;}
.ce-tree-sub-code{font-family:var(--fm); font-size:10px; flex-shrink:0;}
.ce-tree-empty{font-size:11.5px; color:var(--muted-2); padding:4px 0 8px 16px; font-style:italic;}

.ce-detail{display:flex; flex-direction:column; gap:20px; min-width:0;}
.ce-detail-empty{background:var(--card); border:1px dashed var(--line); border-radius:16px; padding:48px 24px; text-align:center; color:var(--muted); display:flex; flex-direction:column; align-items:center; gap:12px;}
.ce-detail-top{display:flex; align-items:flex-start; justify-content:space-between; gap:20px; background:var(--card); border:1px solid var(--line); border-radius:16px; padding:22px 24px; box-shadow:var(--shadow);}
.ce-detail-actions{display:flex; gap:8px; flex-shrink:0;}
.ce-strand{font-family:var(--fm); font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--accent);}
.ce-detail-context h2{font-family:var(--fd); font-size:24px; font-weight:600; margin:8px 0 0; letter-spacing:-.01em; display:flex; align-items:baseline; gap:11px; flex-wrap:wrap;}
.ce-sub-code{font-family:var(--fm); font-size:13px; color:#fff; background:var(--accent); padding:3px 10px; border-radius:7px; letter-spacing:.02em;}
.ce-elo{margin:12px 0 0; font-size:13.5px; color:var(--ink-2); line-height:1.6; max-width:62ch;}
.ce-elo b{color:var(--accent-deep);}

.ce-block{background:var(--card); border:1px solid var(--line); border-radius:16px; padding:20px 24px; box-shadow:var(--shadow);}
.ce-block-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; gap:10px; flex-wrap:wrap;}
.ce-block-head h3{font-family:var(--fd); font-size:16px; font-weight:600; margin:0; display:flex; align-items:center; gap:8px; color:var(--ink);}
.ce-block-head h3 svg{color:var(--accent);}
.ce-count{font-family:var(--fm); font-size:11px; font-weight:500; color:var(--muted); background:var(--line-2); padding:2px 8px; border-radius:10px;}
.ce-empty-line{color:var(--muted-2); font-size:13px; font-style:italic; margin:0;}

.ce-outcomes{display:flex; flex-direction:column;}
.ce-outcome{display:flex; align-items:center; gap:14px; padding:13px 6px; border-top:1px solid var(--line-2); position:relative;}
.ce-outcome:first-child{border-top:0;}
.ce-outcome:hover{background:var(--parch); border-radius:8px;}
.ce-outcome-n{font-family:var(--fd); font-size:15px; font-weight:600; color:var(--accent); width:22px; flex-shrink:0; text-align:center;}
.ce-outcome-text{flex:1; margin:0; font-size:13.5px; line-height:1.5; color:var(--ink-2);}

.ce-bloom{display:inline-flex; align-items:center; gap:6px; font-family:var(--fm); font-size:10.5px; font-weight:500; letter-spacing:.04em; text-transform:uppercase; padding:4px 10px 4px 4px; border-radius:20px; white-space:nowrap; flex-shrink:0; border:1px solid transparent;}
.ce-bloom-rank{width:16px; height:16px; border-radius:50%; display:grid; place-items:center; font-size:9px; color:#fff;}
.ce-bloom[data-rank="0"]{background:var(--line-2); color:var(--muted); padding:4px 11px;}
.ce-bloom[data-rank="1"]{background:#eef4ee; color:#3d6b48; border-color:#dbe8de;} .ce-bloom[data-rank="1"] .ce-bloom-rank{background:#7fae8c;}
.ce-bloom[data-rank="2"]{background:#e6f1e9; color:#326b46;} .ce-bloom[data-rank="2"] .ce-bloom-rank{background:#5d9d71;}
.ce-bloom[data-rank="3"]{background:#daece0; color:#256040;} .ce-bloom[data-rank="3"] .ce-bloom-rank{background:#3d8f5c;}
.ce-bloom[data-rank="4"]{background:#cfe6d7; color:#1d5638;} .ce-bloom[data-rank="4"] .ce-bloom-rank{background:#2c7d4c;}
.ce-bloom[data-rank="5"]{background:#1f7a3d; color:#fff;} .ce-bloom[data-rank="5"] .ce-bloom-rank{background:rgba(255,255,255,.25);}
.ce-bloom[data-rank="6"]{background:#155c2d; color:#fff;} .ce-bloom[data-rank="6"] .ce-bloom-rank{background:rgba(255,255,255,.3);}

.ce-rowmenu{position:relative; flex-shrink:0; opacity:.35; transition:.13s;}
.ce-outcome:hover .ce-rowmenu,.ce-strategy:hover .ce-rowmenu{opacity:1;}
.ce-rowmenu-trigger{width:30px; height:30px; display:grid; place-items:center; background:transparent; border:1px solid transparent; border-radius:8px; color:var(--muted); cursor:pointer; transition:.13s;}
.ce-rowmenu-trigger:hover{background:var(--card); border-color:var(--line); color:var(--ink);}
.ce-rowmenu-pop{position:absolute; right:0; top:34px; z-index:10; background:var(--card); border:1px solid var(--line); border-radius:10px; box-shadow:0 8px 24px rgba(19,20,15,.14); padding:5px; min-width:130px; display:flex; flex-direction:column; gap:2px;}
.ce-rowmenu-pop button{display:flex; align-items:center; gap:9px; padding:8px 10px; border:0; background:transparent; border-radius:7px; font-size:12.5px; color:var(--ink-2); cursor:pointer; text-align:left;}
.ce-rowmenu-pop button:hover{background:var(--parch);}
.ce-rowmenu-pop button.is-danger{color:#b3261e;}
.ce-rowmenu-pop button.is-danger:hover{background:#fbeae8;}

.ce-strategies{display:flex; flex-direction:column; gap:10px;}
.ce-strategy{display:flex; gap:13px; padding:15px; border-radius:12px; border:1px solid var(--line-2); background:var(--parch); transition:.13s; position:relative;}
.ce-strategy:hover{border-color:var(--line); background:#fff;}
.ce-strategy-icon{width:32px; height:32px; flex-shrink:0; border-radius:9px; display:grid; place-items:center;}
.ce-strategy--assessment .ce-strategy-icon{background:var(--assess-soft); color:var(--assess);}
.ce-strategy--learning .ce-strategy-icon{background:var(--learn-soft); color:var(--learn);}
.ce-strategy-main{flex:1; min-width:0;}
.ce-strategy-head{display:flex; align-items:center; gap:10px; margin-bottom:4px; flex-wrap:wrap;}
.ce-strategy-head h4{font-family:var(--fd); font-size:14.5px; font-weight:600; margin:0; color:var(--ink);}
.ce-strategy-type{font-family:var(--fm); font-size:9px; letter-spacing:.1em; text-transform:uppercase; padding:3px 8px; border-radius:6px;}
.ce-strategy--assessment .ce-strategy-type{background:var(--assess-soft); color:var(--assess);}
.ce-strategy--learning .ce-strategy-type{background:var(--learn-soft); color:var(--learn);}
.ce-strategy-main p{margin:0; font-size:13px; line-height:1.55; color:var(--ink-2);}
.ce-refs{display:inline-block; margin-top:7px; font-family:var(--fm); font-size:10.5px; color:var(--muted); background:var(--line-2); padding:3px 9px; border-radius:6px;}

/* Modal */
.ce-modal-overlay{position:fixed; inset:0; z-index:1050; background:rgba(19,20,15,.45); display:grid; place-items:center; padding:20px;}
.ce-modal{background:var(--card); border:1px solid var(--line); border-radius:16px; width:min(620px,100%); max-height:90vh; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(19,20,15,.3); overflow:hidden;}
.ce-modal-head{display:flex; align-items:center; justify-content:space-between; padding:18px 22px; border-bottom:1px solid var(--line-2);}
.ce-modal-head h3{font-family:var(--fd); font-size:18px; font-weight:600; margin:0;}
.ce-modal-x{width:32px; height:32px; display:grid; place-items:center; border:0; background:transparent; border-radius:8px; color:var(--muted); cursor:pointer;}
.ce-modal-x:hover{background:var(--parch); color:var(--ink);}
.ce-modal-body{padding:20px 22px; overflow:auto; display:grid; grid-template-columns:1fr 1fr; gap:14px;}
.ce-mfield{display:flex; flex-direction:column; gap:6px;}
.ce-mfield--full{grid-column:1 / -1;}
.ce-mfield span{font-family:var(--fm); font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted);}
.ce-mfield input,.ce-mfield select,.ce-mfield textarea{font-family:var(--fb); font-size:13.5px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:9px; padding:9px 11px; outline:none; width:100%; resize:vertical;}
.ce-mfield input:focus,.ce-mfield select:focus,.ce-mfield textarea:focus{border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft);}
.ce-modal-foot{display:flex; justify-content:flex-end; gap:10px; padding:16px 22px; border-top:1px solid var(--line-2);}

@media (max-width:920px){
  .ce-body{grid-template-columns:1fr;}
  .ce-tree{position:relative; top:0; max-height:none;}
  .ce-header,.ce-body{padding-left:18px; padding-right:18px;}
  .ce-modal-body{grid-template-columns:1fr;}
}
`;
