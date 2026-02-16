import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Button, Alert, Badge, Table, Form,
  Modal, Spinner, InputGroup
} from 'react-bootstrap';
import {
  FaFileAlt, FaPlus, FaPaperPlane, FaCheckCircle, FaEye, FaDownload,
  FaTrash, FaEdit, FaArrowLeft
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { reportCardService } from '../../services/reportCardService';
import { exportReportCardPDF } from '../../services/ReportCardPDFExporter';
import Breadcrumb from '../common/Breadcrumb';

function ReportCardManagement() {
  const { user } = useAuth();
  const institutionId = user?.institution_id;
  const instName = user?.institution_name || '';

  // Filters
  const [forms, setForms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedForm, setSelectedForm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('1');
  const [academicYear, setAcademicYear] = useState('2025-2026');

  // Data
  const [reportCards, setReportCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    principal_comment: '',
    form_teacher_comment: '',
    conduct_grade: '',
    next_term_begins: ''
  });

  // View detail
  const [showDetail, setShowDetail] = useState(false);
  const [detailCard, setDetailCard] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/school-admin/dashboard', type: 'dashboard' },
    { label: 'Report Cards', type: 'reports' }
  ];

  // Load forms
  useEffect(() => {
    if (institutionId) {
      reportCardService.getForms(institutionId).then(setForms).catch(() => {});
    }
  }, [institutionId]);

  // Load classes when form changes
  useEffect(() => {
    if (selectedForm) {
      reportCardService.getClassesByForm(selectedForm).then(setClasses).catch(() => {});
    } else {
      setClasses([]);
      setSelectedClass('');
    }
  }, [selectedForm]);

  // Fetch report cards
  const fetchReportCards = useCallback(async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      setError('');
      const data = await reportCardService.getReportCardsByClass(
        selectedClass, academicYear, selectedTerm
      );
      setReportCards(data);
    } catch (err) {
      setError('Failed to load report cards');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, academicYear, selectedTerm]);

  useEffect(() => {
    if (selectedClass) fetchReportCards();
  }, [selectedClass, fetchReportCards]);

  // Generate report cards
  const handleGenerate = async () => {
    if (!selectedClass) return;
    try {
      setGenerating(true);
      setError('');
      const result = await reportCardService.generateReportCards(
        selectedClass, academicYear, Number(selectedTerm), user?.user_id, institutionId
      );
      setSuccess(`Generated ${result.generated} report cards for ${result.total} students`);
      fetchReportCards();
    } catch (err) {
      setError(err.message || 'Failed to generate report cards');
    } finally {
      setGenerating(false);
    }
  };

  // Delete drafts
  const handleDeleteDrafts = async () => {
    if (!window.confirm('Delete all DRAFT report cards for this class/term? This cannot be undone.')) return;
    try {
      setLoading(true);
      const count = await reportCardService.deleteDraftReportCards(
        selectedClass, academicYear, selectedTerm
      );
      setSuccess(`Deleted ${count} draft report cards`);
      fetchReportCards();
    } catch (err) {
      setError(err.message || 'Failed to delete drafts');
    } finally {
      setLoading(false);
    }
  };

  // Send to teachers (DRAFT → REVIEW)
  const handleSendToTeachers = async () => {
    const draftIds = reportCards.filter(rc => rc.status === 'DRAFT').map(rc => rc.report_card_id);
    if (!draftIds.length) return;
    try {
      setLoading(true);
      await reportCardService.updateStatus(draftIds, 'REVIEW', user?.user_id);
      setSuccess(`Sent ${draftIds.length} report cards to teachers for review`);
      fetchReportCards();
    } catch (err) {
      setError('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Publish (REVIEW → PUBLISHED)
  const handlePublish = async () => {
    const reviewIds = reportCards.filter(rc => rc.status === 'REVIEW').map(rc => rc.report_card_id);
    if (!reviewIds.length) return;
    if (!window.confirm(`Publish ${reviewIds.length} report cards? Parents and students will be able to view them.`)) return;
    try {
      setLoading(true);
      await reportCardService.updateStatus(reviewIds, 'PUBLISHED', user?.user_id);
      setSuccess(`Published ${reviewIds.length} report cards`);
      fetchReportCards();
    } catch (err) {
      setError('Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  // View detail
  const handleViewDetail = async (rcId) => {
    try {
      setDetailLoading(true);
      setShowDetail(true);
      const data = await reportCardService.getReportCard(rcId);
      setDetailCard(data);
    } catch (err) {
      setError('Failed to load report card details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Edit report card
  const handleEdit = (rc) => {
    setSelectedCard(rc);
    setEditData({
      principal_comment: rc.principal_comment || '',
      form_teacher_comment: rc.form_teacher_comment || '',
      conduct_grade: rc.conduct_grade || '',
      next_term_begins: rc.next_term_begins || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedCard) return;
    try {
      setLoading(true);
      await reportCardService.updateReportCard(selectedCard.report_card_id, editData);
      setShowEditModal(false);
      setSuccess('Report card updated');
      fetchReportCards();
    } catch (err) {
      setError('Failed to update report card');
    } finally {
      setLoading(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = async (rcId) => {
    try {
      const data = await reportCardService.getReportCard(rcId);
      exportReportCardPDF(data, instName);
    } catch (err) {
      setError('Failed to generate PDF');
    }
  };

  const statusBadge = (status) => {
    const map = {
      DRAFT: 'secondary',
      REVIEW: 'warning',
      PUBLISHED: 'success'
    };
    return <Badge bg={map[status] || 'secondary'}>{status}</Badge>;
  };

  const draftCount = reportCards.filter(rc => rc.status === 'DRAFT').length;
  const reviewCount = reportCards.filter(rc => rc.status === 'REVIEW').length;
  const publishedCount = reportCards.filter(rc => rc.status === 'PUBLISHED').length;

  return (
    <Container className="py-4">
      <Breadcrumb items={breadcrumbItems} />

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Row className="mb-4 pt-5">
        <Col>
          <h2 className="mb-1">
            <FaFileAlt className="me-2 text-primary" />
            Report Card Management
          </h2>
          <p className="text-muted">Generate, review, and publish student report cards</p>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small fw-bold">Academic Year</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  placeholder="2025-2026"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small fw-bold">Term</Form.Label>
                <Form.Select size="sm" value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold">Form</Form.Label>
                <Form.Select
                  size="sm"
                  value={selectedForm}
                  onChange={e => { setSelectedForm(e.target.value); setSelectedClass(''); }}
                >
                  <option value="">Select Form</option>
                  {forms.map(f => (
                    <option key={f.form_id} value={f.form_id}>
                      {f.form_name || `Form ${f.form_number}`}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold">Class</Form.Label>
                <Form.Select
                  size="sm"
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  disabled={!selectedForm}
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerate}
                disabled={!selectedClass || generating}
                className="w-100"
              >
                {generating ? <Spinner animation="border" size="sm" /> : <><FaPlus className="me-1" /> Generate</>}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Status Summary */}
      {reportCards.length > 0 && (
        <Row className="g-3 mb-4">
          <Col xs={4}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body className="py-3">
                <h5 className="mb-0">{draftCount}</h5>
                <small className="text-muted">Draft</small>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={4}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body className="py-3">
                <h5 className="mb-0 text-warning">{reviewCount}</h5>
                <small className="text-muted">In Review</small>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={4}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body className="py-3">
                <h5 className="mb-0 text-success">{publishedCount}</h5>
                <small className="text-muted">Published</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Action Buttons */}
      {reportCards.length > 0 && (
        <div className="d-flex gap-2 mb-3 flex-wrap">
          {draftCount > 0 && (
            <>
              <Button variant="warning" size="sm" onClick={handleSendToTeachers} disabled={loading}>
                <FaPaperPlane className="me-1" /> Send to Teachers ({draftCount})
              </Button>
              <Button variant="outline-danger" size="sm" onClick={handleDeleteDrafts} disabled={loading}>
                <FaTrash className="me-1" /> Delete Drafts
              </Button>
            </>
          )}
          {reviewCount > 0 && (
            <Button variant="success" size="sm" onClick={handlePublish} disabled={loading}>
              <FaCheckCircle className="me-1" /> Publish ({reviewCount})
            </Button>
          )}
        </div>
      )}

      {/* Report Cards List */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : !selectedClass ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <FaFileAlt size={48} className="text-muted mb-3" />
            <p className="text-muted">Select a form and class to view or generate report cards</p>
          </Card.Body>
        </Card>
      ) : reportCards.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <FaFileAlt size={48} className="text-muted mb-3" />
            <p className="text-muted">No report cards generated yet for this class/term</p>
            <Button variant="primary" size="sm" onClick={handleGenerate} disabled={generating}>
              <FaPlus className="me-1" /> Generate Report Cards
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th className="text-center">Average</th>
                  <th className="text-center">Attendance</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reportCards.map(rc => (
                  <tr key={rc.report_card_id}>
                    <td>{rc.class_rank || '—'}</td>
                    <td>{rc.student?.name || rc.student?.email || '—'}</td>
                    <td className="text-center">
                      {rc.overall_average != null ? (
                        <Badge bg={rc.overall_average >= 70 ? 'success' : rc.overall_average >= 50 ? 'warning' : 'danger'}>
                          {rc.overall_average}%
                        </Badge>
                      ) : '—'}
                    </td>
                    <td className="text-center">
                      {rc.attendance_percentage != null ? `${rc.attendance_percentage}%` : '—'}
                    </td>
                    <td className="text-center">{statusBadge(rc.status)}</td>
                    <td className="text-center">
                      <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleViewDetail(rc.report_card_id)}>
                        <FaEye />
                      </Button>
                      {rc.status !== 'PUBLISHED' && (
                        <Button variant="outline-secondary" size="sm" className="me-1" onClick={() => handleEdit(rc)}>
                          <FaEdit />
                        </Button>
                      )}
                      <Button variant="outline-success" size="sm" onClick={() => handleDownloadPDF(rc.report_card_id)}>
                        <FaDownload />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Detail Modal */}
      <Modal show={showDetail} onHide={() => { setShowDetail(false); setDetailCard(null); }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Report Card Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailLoading ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : detailCard ? (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <p className="mb-1"><strong>Student:</strong> {detailCard.student?.name}</p>
                  <p className="mb-1"><strong>Class:</strong> {detailCard.class?.class_name}</p>
                  <p className="mb-1"><strong>Form:</strong> {detailCard.form?.form_name || `Form ${detailCard.form?.form_number}`}</p>
                </Col>
                <Col md={6}>
                  <p className="mb-1"><strong>Academic Year:</strong> {detailCard.academic_year}</p>
                  <p className="mb-1"><strong>Term:</strong> Term {detailCard.term}</p>
                  <p className="mb-1"><strong>Rank:</strong> {detailCard.class_rank || '—'}</p>
                  <p className="mb-1"><strong>Overall:</strong> {detailCard.overall_average != null ? `${detailCard.overall_average}%` : '—'}</p>
                </Col>
              </Row>

              {detailCard.grades?.length > 0 && (
                <Table responsive size="sm" className="mb-3">
                  <thead className="table-light">
                    <tr>
                      <th>Subject</th>
                      <th className="text-center">Coursework</th>
                      <th className="text-center">Exam</th>
                      <th className="text-center">Final</th>
                      <th className="text-center">Grade</th>
                      <th className="text-center">Effort</th>
                      <th>Teacher Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailCard.grades.map(g => (
                      <tr key={g.id}>
                        <td>{g.subject_name}</td>
                        <td className="text-center">{g.coursework_avg != null ? `${g.coursework_avg}%` : '—'}</td>
                        <td className="text-center">{g.exam_mark != null ? `${g.exam_mark}%` : '—'}</td>
                        <td className="text-center">
                          <Badge bg={g.final_mark >= 70 ? 'success' : g.final_mark >= 50 ? 'warning' : 'danger'}>
                            {g.final_mark != null ? `${g.final_mark}%` : '—'}
                          </Badge>
                        </td>
                        <td className="text-center">{g.grade_letter || '—'}</td>
                        <td className="text-center">{g.effort_grade || '—'}</td>
                        <td className="small">{g.teacher_comment || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              <Row className="mb-2">
                <Col md={6}>
                  <p className="mb-1"><strong>Attendance:</strong> {detailCard.attendance_percentage != null ? `${detailCard.attendance_percentage}%` : '—'}</p>
                  <p className="mb-1 small text-muted">
                    Present: {detailCard.days_present} | Absent: {detailCard.days_absent} | Late: {detailCard.days_late} | Total: {detailCard.total_school_days}
                  </p>
                </Col>
                <Col md={6}>
                  <p className="mb-1"><strong>Conduct:</strong> {detailCard.conduct_grade || '—'}</p>
                </Col>
              </Row>

              {detailCard.form_teacher_comment && (
                <p className="mb-1"><strong>Form Teacher:</strong> {detailCard.form_teacher_comment}</p>
              )}
              {detailCard.principal_comment && (
                <p className="mb-1"><strong>Principal:</strong> {detailCard.principal_comment}</p>
              )}
            </>
          ) : (
            <p className="text-muted">No data</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          {detailCard && (
            <Button variant="success" size="sm" onClick={() => handleDownloadPDF(detailCard.report_card_id)}>
              <FaDownload className="me-1" /> Download PDF
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setShowDetail(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Report Card</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Conduct Grade</Form.Label>
            <Form.Select
              size="sm"
              value={editData.conduct_grade}
              onChange={e => setEditData(prev => ({ ...prev, conduct_grade: e.target.value }))}
            >
              <option value="">Select</option>
              <option value="Excellent">Excellent</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
              <option value="Satisfactory">Satisfactory</option>
              <option value="Needs Improvement">Needs Improvement</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Form Teacher Comment</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              size="sm"
              value={editData.form_teacher_comment}
              onChange={e => setEditData(prev => ({ ...prev, form_teacher_comment: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Principal Comment</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              size="sm"
              value={editData.principal_comment}
              onChange={e => setEditData(prev => ({ ...prev, principal_comment: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Next Term Begins</Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={editData.next_term_begins}
              onChange={e => setEditData(prev => ({ ...prev, next_term_begins: e.target.value }))}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSaveEdit} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ReportCardManagement;
