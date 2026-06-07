import React, { useState, useMemo, useEffect } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, Accordion,
  Spinner, Alert, Modal, InputGroup, Table
} from 'react-bootstrap';
import {
  FaBook, FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaLayerGroup
} from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { curriculumService } from '../../services/curriculumService';
import './Curriculum.css';

const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

const bloomBadgeVariant = (level) => {
  switch ((level || '').trim()) {
    case 'Remember': return 'secondary';
    case 'Understand': return 'info';
    case 'Apply': return 'primary';
    case 'Analyze': return 'warning';
    case 'Evaluate': return 'danger';
    case 'Create': return 'success';
    default: return 'secondary';
  }
};

// Empty form shapes per entity type
const emptyForms = {
  topic: {
    topic_number: '', code: '', title: '', strand: '',
    elo: '', grade_level_guidelines: '', sort_order: ''
  },
  subtopic: { code: '', title: '', elo: '', sort_order: '' },
  outcome: { sco_number: '', statement: '', bloom_level: '', sort_order: '' },
  strategy: { strategy_type: '', title: '', sco_refs: '', description: '' }
};

const modalTitles = {
  topic: 'Topic',
  subtopic: 'Subtopic',
  outcome: 'Outcome (SCO)',
  strategy: 'Strategy'
};

function Curriculum() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();

  // ── Filters / controls ──────────────────────────────────────────────
  const [subjectId, setSubjectId] = useState('');
  const [search, setSearch] = useState('');
  const [bloomFilter, setBloomFilter] = useState('all');
  const [strandFilter, setStrandFilter] = useState('all');

  // ── Modal state ─────────────────────────────────────────────────────
  // { type, mode, data, parentId } | null
  const [modal, setModal] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [mutationError, setMutationError] = useState(null);

  // ── Queries ─────────────────────────────────────────────────────────
  const {
    data: subjects = [],
    isLoading: loadingSubjects,
    error: subjectsError
  } = useQuery({
    queryKey: ['curriculum-subjects'],
    queryFn: () => curriculumService.getSubjects()
  });

  // Auto-select first subject on load
  useEffect(() => {
    if (!subjectId && subjects.length > 0) {
      setSubjectId(String(subjects[0].id));
    }
  }, [subjects, subjectId]);

  const {
    data: tree,
    isLoading: loadingTree,
    error: treeError
  } = useQuery({
    queryKey: ['curriculum-tree', subjectId],
    queryFn: () => curriculumService.getSubjectTree(subjectId),
    enabled: !!subjectId
  });

  const topics = tree?.topics || [];
  const totals = tree?.counts || { topics: 0, subtopics: 0, outcomes: 0, strategies: 0 };
  const selectedSubject = subjects.find(s => String(s.id) === String(subjectId));

  // Reset filters when subject changes
  useEffect(() => {
    setBloomFilter('all');
    setStrandFilter('all');
    setSearch('');
  }, [subjectId]);

  // ── Distinct values for filters (from loaded tree) ──────────────────
  const bloomOptions = useMemo(() => {
    const set = new Set();
    topics.forEach(t => (t.subtopics || []).forEach(st =>
      (st.outcomes || []).forEach(o => { if (o.bloom_level) set.add(o.bloom_level); })
    ));
    return Array.from(set).sort();
  }, [topics]);

  const strandOptions = useMemo(() => {
    const set = new Set();
    topics.forEach(t => { if (t.strand) set.add(t.strand); });
    return Array.from(set).sort();
  }, [topics]);

  // ── Client-side filtering ───────────────────────────────────────────
  const q = search.trim().toLowerCase();

  const filteredTopics = useMemo(() => {
    const matchText = (txt) => q && (txt || '').toLowerCase().includes(q);

    return topics
      .filter(t => strandFilter === 'all' || t.strand === strandFilter)
      .map(topic => {
        const topicMatches = matchText(topic.title);

        const subtopics = (topic.subtopics || []).map(st => {
          // Filter outcomes by bloom level
          let outcomes = st.outcomes || [];
          if (bloomFilter !== 'all') {
            outcomes = outcomes.filter(o => o.bloom_level === bloomFilter);
          }

          const subtopicMatches =
            matchText(st.title) || (outcomes.some(o => matchText(o.statement)));

          return { ...st, _outcomes: outcomes, _subtopicMatches: subtopicMatches };
        })
        // When bloom filter is active, drop subtopics that have no remaining outcomes
        .filter(st => {
          if (bloomFilter !== 'all' && (st._outcomes || []).length === 0) return false;
          return true;
        })
        // Search: keep subtopic if it or any descendant matches (only when searching)
        .filter(st => {
          if (!q) return true;
          return topicMatches || st._subtopicMatches;
        });

        return { ...topic, _subtopics: subtopics, _topicMatches: topicMatches };
      })
      // Drop topics with no visible subtopics under active filters
      .filter(topic => {
        if (q && !topic._topicMatches && topic._subtopics.length === 0) return false;
        if (bloomFilter !== 'all' && topic._subtopics.length === 0) return false;
        return true;
      });
  }, [topics, q, bloomFilter, strandFilter]);

  // Counts after filters
  const filteredCounts = useMemo(() => {
    let st = 0, out = 0;
    filteredTopics.forEach(t => {
      st += t._subtopics.length;
      t._subtopics.forEach(s => { out += (s._outcomes || []).length; });
    });
    return { topics: filteredTopics.length, subtopics: st, outcomes: out };
  }, [filteredTopics]);

  // ── Mutations ───────────────────────────────────────────────────────
  const invalidateTree = () =>
    queryClient.invalidateQueries(['curriculum-tree', subjectId]);

  const saveMutation = useMutation({
    mutationFn: async ({ type, mode, data, payload }) => {
      const svc = curriculumService;
      if (mode === 'create') {
        if (type === 'topic') return svc.createTopic(payload);
        if (type === 'subtopic') return svc.createSubtopic(payload);
        if (type === 'outcome') return svc.createOutcome(payload);
        if (type === 'strategy') return svc.createStrategy(payload);
      } else {
        if (type === 'topic') return svc.updateTopic(data.id, payload);
        if (type === 'subtopic') return svc.updateSubtopic(data.id, payload);
        if (type === 'outcome') return svc.updateOutcome(data.id, payload);
        if (type === 'strategy') return svc.updateStrategy(data.id, payload);
      }
    },
    onSuccess: () => {
      invalidateTree();
      closeModal();
    },
    onError: (err) => setMutationError(err?.message || 'Failed to save changes')
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }) => {
      const svc = curriculumService;
      if (type === 'topic') return svc.deleteTopic(id);
      if (type === 'subtopic') return svc.deleteSubtopic(id);
      if (type === 'outcome') return svc.deleteOutcome(id);
      if (type === 'strategy') return svc.deleteStrategy(id);
    },
    onSuccess: () => invalidateTree(),
    onError: (err) => setMutationError(err?.message || 'Failed to delete')
  });

  // ── Modal handlers ──────────────────────────────────────────────────
  const openModal = (type, mode, { data = null, parentId = null } = {}) => {
    setMutationError(null);
    const base = emptyForms[type];
    setFormValues(mode === 'edit' && data
      ? { ...base, ...pickFields(type, data) }
      : { ...base });
    setModal({ type, mode, data, parentId });
  };

  const closeModal = () => {
    setModal(null);
    setFormValues({});
    setMutationError(null);
  };

  const setField = (name, value) =>
    setFormValues(prev => ({ ...prev, [name]: value }));

  const handleSave = (e) => {
    e.preventDefault();
    setMutationError(null);
    const { type, mode, data, parentId } = modal;
    const payload = buildPayload(type, formValues);

    // Inject parent ids
    if (type === 'topic') payload.subject_id = selectedSubject?.id ?? subjectId;
    if (type === 'subtopic') payload.topic_id = parentId;
    if (type === 'outcome' || type === 'strategy') payload.subtopic_id = parentId;

    saveMutation.mutate({ type, mode, data, payload });
  };

  const handleDelete = (type, id, label) => {
    if (window.confirm(`Delete this ${modalTitles[type].toLowerCase()}${label ? `: "${label}"` : ''}? This cannot be undone.`)) {
      setMutationError(null);
      deleteMutation.mutate({ type, id });
    }
  };

  // ── Render: loading / error gates ───────────────────────────────────
  if (loadingSubjects) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (subjectsError) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          Failed to load curriculum subjects: {subjectsError.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 curriculum-page">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="mb-1">
            <FaBook className="me-2 text-primary" />
            Curriculum Explorer
          </h2>
          <p className="text-muted mb-0">
            Browse the national curriculum hierarchy{isAdmin ? ' — edit topics, subtopics, outcomes and strategies' : ''}.
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            disabled={!subjectId}
            onClick={() => openModal('topic', 'create')}
          >
            <FaPlus className="me-2" /> Add Topic
          </Button>
        )}
      </div>

      {mutationError && (
        <Alert variant="danger" dismissible onClose={() => setMutationError(null)}>
          {mutationError}
        </Alert>
      )}

      {/* Controls */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Label><FaBook className="me-1" /> Subject</Form.Label>
              <Form.Select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                {subjects.length === 0 && <option value="">No subjects</option>}
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.level}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col md={4}>
              <Form.Label><FaSearch className="me-1" /> Search</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search topics, subtopics, outcomes…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <Button variant="outline-secondary" onClick={() => setSearch('')}>
                    Clear
                  </Button>
                )}
              </InputGroup>
            </Col>

            <Col md={2}>
              <Form.Label><FaFilter className="me-1" /> Bloom Level</Form.Label>
              <Form.Select
                value={bloomFilter}
                onChange={(e) => setBloomFilter(e.target.value)}
              >
                <option value="all">All levels</option>
                {bloomOptions.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Form.Select>
            </Col>

            <Col md={2}>
              <Form.Label><FaLayerGroup className="me-1" /> Strand</Form.Label>
              <Form.Select
                value={strandFilter}
                onChange={(e) => setStrandFilter(e.target.value)}
                disabled={strandOptions.length === 0}
              >
                <option value="all">All strands</option>
                {strandOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          {/* Counts summary */}
          {!loadingTree && topics.length > 0 && (
            <div className="mt-3 text-muted small">
              Showing{' '}
              <strong>{filteredCounts.topics}</strong>/{totals.topics} topics,{' '}
              <strong>{filteredCounts.subtopics}</strong>/{totals.subtopics} subtopics,{' '}
              <strong>{filteredCounts.outcomes}</strong>/{totals.outcomes} outcomes
              {' '}({totals.strategies} strategies total)
              {selectedSubject?.framework && (
                <Badge bg="light" text="dark" className="ms-2 border">
                  {selectedSubject.framework}
                </Badge>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Tree states */}
      {loadingTree && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading curriculum…</p>
        </div>
      )}

      {treeError && !loadingTree && (
        <Alert variant="danger">
          Failed to load curriculum tree: {treeError.message}
        </Alert>
      )}

      {!loadingTree && !treeError && topics.length === 0 && (
        <Alert variant="info">
          No topics have been added for{' '}
          <strong>{selectedSubject ? `${selectedSubject.name} — ${selectedSubject.level}` : 'this subject'}</strong> yet.
          {isAdmin && ' Use the “Add Topic” button to get started.'}
        </Alert>
      )}

      {!loadingTree && !treeError && topics.length > 0 && filteredTopics.length === 0 && (
        <Alert variant="warning">
          No curriculum entries match the current filters. Try adjusting your search, Bloom level, or strand.
        </Alert>
      )}

      {/* Hierarchy */}
      {!loadingTree && !treeError && filteredTopics.length > 0 && (
        <Accordion alwaysOpen className="curriculum-accordion">
          {filteredTopics.map((topic, idx) => {
            const subCount = topic._subtopics.length;
            const outCount = topic._subtopics.reduce((n, s) => n + (s._outcomes || []).length, 0);
            return (
              <Accordion.Item eventKey={String(topic.id ?? idx)} key={topic.id ?? idx} className="mb-2">
                <Accordion.Header>
                  <div className="d-flex align-items-center w-100 flex-wrap gap-2 pe-2">
                    <strong>Topic {topic.topic_number}: {topic.title}</strong>
                    {topic.strand && <Badge bg="dark">{topic.strand}</Badge>}
                    <span className="ms-auto d-flex gap-2">
                      <Badge bg="secondary">{subCount} subtopics</Badge>
                      <Badge bg="info">{outCount} outcomes</Badge>
                    </span>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  {/* Admin topic actions */}
                  {isAdmin && (
                    <div className="d-flex gap-2 mb-3">
                      <Button size="sm" variant="outline-primary"
                        onClick={() => openModal('topic', 'edit', { data: topic })}>
                        <FaEdit className="me-1" /> Edit Topic
                      </Button>
                      <Button size="sm" variant="outline-danger"
                        onClick={() => handleDelete('topic', topic.id, topic.title)}>
                        <FaTrash className="me-1" /> Delete Topic
                      </Button>
                      <Button size="sm" variant="outline-success" className="ms-auto"
                        onClick={() => openModal('subtopic', 'create', { parentId: topic.id })}>
                        <FaPlus className="me-1" /> Add Subtopic
                      </Button>
                    </div>
                  )}

                  {topic.elo && (
                    <p className="mb-2"><strong>ELO:</strong> {topic.elo}</p>
                  )}
                  {Array.isArray(topic.grade_level_guidelines)
                    ? topic.grade_level_guidelines.length > 0 && (
                      <div className="mb-3">
                        <h6 className="text-muted">Grade Level Guidelines</h6>
                        <ul className="mb-0 ps-3">
                          {topic.grade_level_guidelines.map((g, i) => (
                            <li key={i}>{typeof g === 'string' ? g : JSON.stringify(g)}</li>
                          ))}
                        </ul>
                      </div>
                    )
                    : topic.grade_level_guidelines && (
                      <div className="mb-3">
                        <h6 className="text-muted">Grade Level Guidelines</h6>
                        <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                          {typeof topic.grade_level_guidelines === 'string'
                            ? topic.grade_level_guidelines
                            : JSON.stringify(topic.grade_level_guidelines)}
                        </p>
                      </div>
                    )}

                  {topic._subtopics.length === 0 ? (
                    <p className="text-muted small mb-0">No subtopics under this topic.</p>
                  ) : (
                    topic._subtopics.map((st) => (
                      <Card key={st.id} className="mb-3 border">
                        <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                          <div>
                            {st.code && <Badge bg="primary" className="me-2">{st.code}</Badge>}
                            <strong>{st.title}</strong>
                          </div>
                          {isAdmin && (
                            <div className="d-flex gap-1">
                              <Button size="sm" variant="outline-primary"
                                onClick={() => openModal('subtopic', 'edit', { data: st, parentId: topic.id })}
                                title="Edit subtopic">
                                <FaEdit />
                              </Button>
                              <Button size="sm" variant="outline-danger"
                                onClick={() => handleDelete('subtopic', st.id, st.title)}
                                title="Delete subtopic">
                                <FaTrash />
                              </Button>
                            </div>
                          )}
                        </Card.Header>
                        <Card.Body>
                          {st.elo && (
                            <p className="mb-3"><strong>ELO:</strong> {st.elo}</p>
                          )}

                          {/* Outcomes */}
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <h6 className="mb-0">Outcomes (SCOs)</h6>
                            {isAdmin && (
                              <Button size="sm" variant="outline-success"
                                onClick={() => openModal('outcome', 'create', { parentId: st.id })}>
                                <FaPlus className="me-1" /> Add Outcome
                              </Button>
                            )}
                          </div>
                          {(st._outcomes || []).length === 0 ? (
                            <p className="text-muted small">No outcomes.</p>
                          ) : (
                            <Table responsive size="sm" hover className="mb-3 align-middle">
                              <thead>
                                <tr>
                                  <th style={{ width: '90px' }}>SCO #</th>
                                  <th>Statement</th>
                                  <th style={{ width: '130px' }}>Bloom</th>
                                  {isAdmin && <th style={{ width: '90px' }}>Actions</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {st._outcomes.map((o) => (
                                  <tr key={o.id}>
                                    <td><code>{o.sco_number}</code></td>
                                    <td>{o.statement}</td>
                                    <td>
                                      {o.bloom_level && (
                                        <Badge bg={bloomBadgeVariant(o.bloom_level)}>
                                          {o.bloom_level}
                                        </Badge>
                                      )}
                                    </td>
                                    {isAdmin && (
                                      <td>
                                        <div className="d-flex gap-1">
                                          <Button size="sm" variant="outline-primary"
                                            onClick={() => openModal('outcome', 'edit', { data: o, parentId: st.id })}
                                            title="Edit outcome">
                                            <FaEdit />
                                          </Button>
                                          <Button size="sm" variant="outline-danger"
                                            onClick={() => handleDelete('outcome', o.id, o.sco_number)}
                                            title="Delete outcome">
                                            <FaTrash />
                                          </Button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          )}

                          {/* Strategies */}
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <h6 className="mb-0">Strategies</h6>
                            {isAdmin && (
                              <Button size="sm" variant="outline-success"
                                onClick={() => openModal('strategy', 'create', { parentId: st.id })}>
                                <FaPlus className="me-1" /> Add Strategy
                              </Button>
                            )}
                          </div>
                          {(st.strategies || []).length === 0 ? (
                            <p className="text-muted small mb-0">No strategies.</p>
                          ) : (
                            <ul className="list-unstyled mb-0">
                              {st.strategies.map((str) => (
                                <li key={str.id} className="mb-2 d-flex align-items-start">
                                  <div className="flex-grow-1">
                                    {str.strategy_type && (
                                      <Badge bg="secondary" className="me-2">{str.strategy_type}</Badge>
                                    )}
                                    <strong>{str.title}</strong>
                                    {str.description && <>: <span>{str.description}</span></>}
                                    {str.sco_refs && (
                                      <span className="text-muted small ms-2">[refs: {str.sco_refs}]</span>
                                    )}
                                  </div>
                                  {isAdmin && (
                                    <div className="d-flex gap-1 ms-2">
                                      <Button size="sm" variant="outline-primary"
                                        onClick={() => openModal('strategy', 'edit', { data: str, parentId: st.id })}
                                        title="Edit strategy">
                                        <FaEdit />
                                      </Button>
                                      <Button size="sm" variant="outline-danger"
                                        onClick={() => handleDelete('strategy', str.id, str.title)}
                                        title="Delete strategy">
                                        <FaTrash />
                                      </Button>
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </Card.Body>
                      </Card>
                    ))
                  )}
                </Accordion.Body>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}

      {/* ── Edit / Create Modal (admin only) ── */}
      {isAdmin && modal && (
        <Modal show onHide={closeModal} size="lg">
          <Form onSubmit={handleSave}>
            <Modal.Header closeButton>
              <Modal.Title>
                {modal.mode === 'create' ? 'Add' : 'Edit'} {modalTitles[modal.type]}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {mutationError && (
                <Alert variant="danger" dismissible onClose={() => setMutationError(null)}>
                  {mutationError}
                </Alert>
              )}
              {renderFields(modal.type, formValues, setField)}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saveMutation.isLoading}>
                {saveMutation.isLoading
                  ? 'Saving…'
                  : (modal.mode === 'create' ? 'Create' : 'Update')}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </Container>
  );
}

// ── Field config-driven rendering ─────────────────────────────────────
function renderFields(type, values, setField) {
  const text = (name, label, opts = {}) => (
    <Form.Group className="mb-3" key={name}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type={opts.number ? 'number' : 'text'}
        value={values[name] ?? ''}
        onChange={(e) => setField(name, e.target.value)}
        placeholder={opts.placeholder || ''}
      />
    </Form.Group>
  );
  const area = (name, label, rows = 3) => (
    <Form.Group className="mb-3" key={name}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        as="textarea"
        rows={rows}
        value={values[name] ?? ''}
        onChange={(e) => setField(name, e.target.value)}
      />
    </Form.Group>
  );

  if (type === 'topic') {
    return (
      <>
        <Row>
          <Col md={4}>{text('topic_number', 'Topic Number', { number: true })}</Col>
          <Col md={4}>{text('code', 'Code')}</Col>
          <Col md={4}>{text('sort_order', 'Sort Order', { number: true })}</Col>
        </Row>
        {text('title', 'Title')}
        {text('strand', 'Strand')}
        {area('elo', 'Essential Learning Outcome (ELO)')}
        {area('grade_level_guidelines', 'Grade Level Guidelines')}
      </>
    );
  }
  if (type === 'subtopic') {
    return (
      <>
        <Row>
          <Col md={8}>{text('code', 'Code')}</Col>
          <Col md={4}>{text('sort_order', 'Sort Order', { number: true })}</Col>
        </Row>
        {text('title', 'Title')}
        {area('elo', 'Essential Learning Outcome (ELO)')}
      </>
    );
  }
  if (type === 'outcome') {
    return (
      <>
        <Row>
          <Col md={4}>{text('sco_number', 'SCO Number')}</Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Bloom Level</Form.Label>
              <Form.Select
                value={values.bloom_level ?? ''}
                onChange={(e) => setField('bloom_level', e.target.value)}
              >
                <option value="">—</option>
                {BLOOM_LEVELS.map(b => <option key={b} value={b}>{b}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>{text('sort_order', 'Sort Order', { number: true })}</Col>
        </Row>
        {area('statement', 'Statement')}
      </>
    );
  }
  if (type === 'strategy') {
    return (
      <>
        <Row>
          <Col md={6}>{text('strategy_type', 'Strategy Type')}</Col>
          <Col md={6}>{text('sco_refs', 'SCO References')}</Col>
        </Row>
        {text('title', 'Title')}
        {area('description', 'Description')}
      </>
    );
  }
  return null;
}

// ── Payload helpers ───────────────────────────────────────────────────
const FIELD_MAP = {
  topic: ['topic_number', 'code', 'title', 'strand', 'elo', 'grade_level_guidelines', 'sort_order'],
  subtopic: ['code', 'title', 'elo', 'sort_order'],
  outcome: ['sco_number', 'statement', 'bloom_level', 'sort_order'],
  strategy: ['strategy_type', 'title', 'sco_refs', 'description']
};
const NUMERIC_FIELDS = new Set(['topic_number', 'sort_order', 'sco_number']);
// jsonb columns the UI edits as newline-separated text <-> array of strings
const JSON_LINE_FIELDS = new Set(['grade_level_guidelines']);

// Pull only the relevant fields out of an existing row for editing
function pickFields(type, data) {
  const out = {};
  (FIELD_MAP[type] || []).forEach((f) => {
    let v = data[f];
    if (JSON_LINE_FIELDS.has(f)) {
      v = Array.isArray(v) ? v.join('\n') : (typeof v === 'string' ? v : '');
    }
    out[f] = v ?? '';
  });
  return out;
}

// Convert form values into a clean DB payload (numbers coerced, empties → null)
function buildPayload(type, values) {
  const payload = {};
  (FIELD_MAP[type] || []).forEach((f) => {
    const raw = values[f];
    if (NUMERIC_FIELDS.has(f)) {
      payload[f] = raw === '' || raw === null || raw === undefined ? null : Number(raw);
    } else if (JSON_LINE_FIELDS.has(f)) {
      const lines = typeof raw === 'string'
        ? raw.split('\n').map((l) => l.trim()).filter(Boolean)
        : (Array.isArray(raw) ? raw : []);
      payload[f] = lines.length ? lines : null;
    } else {
      const trimmed = typeof raw === 'string' ? raw.trim() : raw;
      payload[f] = trimmed === '' || trimmed === undefined ? null : trimmed;
    }
  });
  return payload;
}

export default Curriculum;
