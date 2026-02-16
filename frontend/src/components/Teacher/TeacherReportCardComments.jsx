import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Alert, Badge, Table,
  Form, Spinner, Accordion
} from 'react-bootstrap';
import { FaFileAlt, FaSave, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { reportCardService } from '../../services/reportCardService';
import Breadcrumb from '../common/Breadcrumb';

function TeacherReportCardComments() {
  const { user } = useAuth();
  const [reviewCards, setReviewCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Track edits: { gradeId: { comment, effortGrade } }
  const [edits, setEdits] = useState({});

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/teacher/dashboard', type: 'dashboard' },
    { label: 'Report Card Comments', type: 'reports' }
  ];

  useEffect(() => {
    fetchReviewCards();
  }, []);

  const fetchReviewCards = async () => {
    try {
      setLoading(true);
      const data = await reportCardService.getTeacherReviewCards(user?.user_id);
      setReviewCards(data);

      // Initialize edits from existing data
      const initial = {};
      data.forEach(card => {
        card.subjects?.forEach(s => {
          initial[s.id] = {
            comment: s.teacher_comment || '',
            effortGrade: s.effort_grade || ''
          };
        });
      });
      setEdits(initial);
    } catch (err) {
      setError('Failed to load report cards for review');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (gradeId, field, value) => {
    setEdits(prev => ({
      ...prev,
      [gradeId]: {
        ...prev[gradeId],
        [field]: value
      }
    }));
  };

  const handleSaveSubject = async (gradeId) => {
    const edit = edits[gradeId];
    if (!edit) return;

    try {
      setSaving(prev => ({ ...prev, [gradeId]: true }));
      await reportCardService.updateSubjectComment(gradeId, edit.comment, edit.effortGrade);
      setSuccess('Comment saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save comment');
    } finally {
      setSaving(prev => ({ ...prev, [gradeId]: false }));
    }
  };

  const handleSaveAll = async (card) => {
    const subjectIds = card.subjects?.map(s => s.id) || [];
    try {
      for (const sid of subjectIds) {
        const edit = edits[sid];
        if (edit) {
          setSaving(prev => ({ ...prev, [sid]: true }));
          await reportCardService.updateSubjectComment(sid, edit.comment, edit.effortGrade);
          setSaving(prev => ({ ...prev, [sid]: false }));
        }
      }
      setSuccess(`All comments saved for ${card.student?.name || 'student'}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save some comments');
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2">Loading report cards...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Breadcrumb items={breadcrumbItems} />

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Row className="mb-4 pt-5">
        <Col>
          <h2 className="mb-1">
            <FaFileAlt className="me-2 text-primary" />
            Report Card Comments
          </h2>
          <p className="text-muted">Add effort grades and comments for your subjects on student report cards</p>
        </Col>
      </Row>

      {reviewCards.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <FaCheckCircle size={48} className="text-success mb-3" />
            <h5>All caught up!</h5>
            <p className="text-muted">No report cards currently awaiting your comments.</p>
          </Card.Body>
        </Card>
      ) : (
        <Accordion defaultActiveKey="0">
          {reviewCards.map((card, cardIdx) => (
            <Accordion.Item key={card.report_card_id} eventKey={String(cardIdx)} className="mb-3 border-0 shadow-sm">
              <Accordion.Header>
                <div className="d-flex align-items-center gap-3 w-100 me-3">
                  <div>
                    <strong>{card.student?.name || card.student?.email}</strong>
                    <span className="text-muted ms-2 small">
                      {card.class?.class_name} — {card.form?.form_name || `Form ${card.form?.form_number}`}
                    </span>
                  </div>
                  <Badge bg="warning" className="ms-auto">
                    {card.subjects?.length || 0} subject{(card.subjects?.length || 0) !== 1 ? 's' : ''}
                  </Badge>
                  <Badge bg="info" className="small">
                    Term {card.term} — {card.academic_year}
                  </Badge>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <Table responsive size="sm" className="mb-3">
                  <thead className="table-light">
                    <tr>
                      <th>Subject</th>
                      <th className="text-center" style={{ width: 80 }}>Final</th>
                      <th className="text-center" style={{ width: 80 }}>Grade</th>
                      <th className="text-center" style={{ width: 120 }}>Effort</th>
                      <th>Comment</th>
                      <th style={{ width: 60 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {card.subjects?.map(s => (
                      <tr key={s.id}>
                        <td className="fw-medium">{s.subject_name}</td>
                        <td className="text-center">
                          <Badge bg={s.final_mark >= 70 ? 'success' : s.final_mark >= 50 ? 'warning' : 'danger'}>
                            {s.final_mark != null ? `${s.final_mark}%` : '—'}
                          </Badge>
                        </td>
                        <td className="text-center">{s.grade_letter || '—'}</td>
                        <td>
                          <Form.Select
                            size="sm"
                            value={edits[s.id]?.effortGrade || ''}
                            onChange={e => handleEditChange(s.id, 'effortGrade', e.target.value)}
                          >
                            <option value="">—</option>
                            <option value="A">A - Outstanding</option>
                            <option value="B">B - Good</option>
                            <option value="C">C - Satisfactory</option>
                            <option value="D">D - Needs Improvement</option>
                            <option value="E">E - Unsatisfactory</option>
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Control
                            as="textarea"
                            rows={1}
                            size="sm"
                            placeholder="Add comment..."
                            value={edits[s.id]?.comment || ''}
                            onChange={e => handleEditChange(s.id, 'comment', e.target.value)}
                          />
                        </td>
                        <td>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleSaveSubject(s.id)}
                            disabled={saving[s.id]}
                          >
                            {saving[s.id] ? <Spinner animation="border" size="sm" /> : <FaSave />}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div className="text-end">
                  <Button variant="primary" size="sm" onClick={() => handleSaveAll(card)}>
                    <FaSave className="me-1" /> Save All Comments
                  </Button>
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Container>
  );
}

export default TeacherReportCardComments;
