import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Form, Badge, Spinner, Alert,
  Table, Button
} from 'react-bootstrap';
import { FaRobot, FaToggleOn, FaToggleOff, FaUsers, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { supabase } from '../../config/supabase';
import tutorService from '../../services/tutorService';
import { personName } from '../../utils/personName';

function TutorSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [classSubjects, setClassSubjects] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [studentOverrides, setStudentOverrides] = useState({});
  const [classStudents, setClassStudents] = useState({});
  const [savingStates, setSavingStates] = useState({});

  const teacherId = user?.user_id;

  useEffect(() => {
    if (teacherId) loadSettings();
  }, [teacherId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await tutorService.getTutorSettingsForTeacher(teacherId);
      setClassSubjects(data || []);
    } catch (err) {
      console.error('[TutorSettings] Error loading:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleClass = async (cs) => {
    const csId = cs.class_subject_id;
    const newEnabled = !cs.isEnabled;
    setSavingStates(prev => ({ ...prev, [csId]: true }));

    try {
      await tutorService.updateTutorSetting(csId, teacherId, newEnabled);
      setClassSubjects(prev =>
        prev.map(item =>
          item.class_subject_id === csId
            ? { ...item, isEnabled: newEnabled }
            : item
        )
      );
    } catch (err) {
      console.error('[TutorSettings] Error toggling:', err);
    } finally {
      setSavingStates(prev => ({ ...prev, [csId]: false }));
    }
  };

  const handleExpandCard = async (csId) => {
    if (expandedCard === csId) {
      setExpandedCard(null);
      return;
    }

    setExpandedCard(csId);

    // Load students for this class if not already loaded
    const cs = classSubjects.find(c => c.class_subject_id === csId);
    if (cs && !classStudents[cs.class?.class_id]) {
      try {
        const { data: assignments } = await supabase
          .from('student_class_assignments')
          .select('student:users(id, first_name, last_name, email)')
          .eq('class_id', cs.class.class_id)
          .eq('is_active', true);

        const students = (assignments || []).map(a => a.student).filter(Boolean);
        setClassStudents(prev => ({ ...prev, [cs.class.class_id]: students }));
      } catch (err) {
        console.error('[TutorSettings] Error loading students:', err);
      }
    }

    // Load overrides for this class_subject
    if (!studentOverrides[csId]) {
      try {
        const overrides = await tutorService.getStudentOverrides(csId);
        setStudentOverrides(prev => ({ ...prev, [csId]: overrides }));
      } catch (err) {
        console.error('[TutorSettings] Error loading overrides:', err);
      }
    }
  };

  const handleToggleStudentOverride = async (csId, studentId, currentlyEnabled) => {
    const key = `${csId}-${studentId}`;
    setSavingStates(prev => ({ ...prev, [key]: true }));

    try {
      if (currentlyEnabled === null) {
        // No override exists — create one (opposite of class default)
        const cs = classSubjects.find(c => c.class_subject_id === csId);
        const classDefault = cs?.isEnabled ?? true;
        await tutorService.upsertStudentOverride(csId, studentId, !classDefault, '', teacherId);
      } else {
        // Override exists — toggle it
        await tutorService.upsertStudentOverride(csId, studentId, !currentlyEnabled, '', teacherId);
      }

      // Reload overrides
      const overrides = await tutorService.getStudentOverrides(csId);
      setStudentOverrides(prev => ({ ...prev, [csId]: overrides }));
    } catch (err) {
      console.error('[TutorSettings] Error toggling override:', err);
    } finally {
      setSavingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRemoveOverride = async (csId, studentId) => {
    const key = `${csId}-${studentId}-rm`;
    setSavingStates(prev => ({ ...prev, [key]: true }));

    try {
      await tutorService.deleteStudentOverride(csId, studentId);
      const overrides = await tutorService.getStudentOverrides(csId);
      setStudentOverrides(prev => ({ ...prev, [csId]: overrides }));
    } catch (err) {
      console.error('[TutorSettings] Error removing override:', err);
    } finally {
      setSavingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const getSubjectName = (cs) =>
    cs.subject_offering?.subject?.subject_name || 'Unknown Subject';

  const getClassName = (cs) => {
    const formName = cs.class?.form?.form_name || '';
    const className = cs.class?.class_name || '';
    return formName ? `[${formName}] ${className}` : className;
  };

  const getStudentOverrideStatus = (csId, studentId) => {
    const overrides = studentOverrides[csId] || [];
    const override = overrides.find(o => o.student_id === studentId);
    return override ? override.is_enabled : null; // null = no override (uses class default)
  };

  if (isLoading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4 pt-4">
      <Row className="mb-4">
        <Col>
          <h2 className="d-flex align-items-center gap-2">
            <FaRobot /> AI Tutor Settings
          </h2>
          <p className="text-muted">
            Control whether the AI Tutor is available for your classes. You can enable or disable it
            per subject, or set individual student overrides.
          </p>
        </Col>
      </Row>

      <Alert variant="info" className="mb-4">
        The AI Tutor uses the Socratic method — it guides students to answers through questions
        and hints. It never provides direct answers to homework or assessment questions.
      </Alert>

      {classSubjects.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <p className="text-muted">No class-subjects assigned to you.</p>
          </Card.Body>
        </Card>
      ) : (
        classSubjects.map(cs => {
          const csId = cs.class_subject_id;
          const isExpanded = expandedCard === csId;
          const students = classStudents[cs.class?.class_id] || [];
          const overrides = studentOverrides[csId] || [];

          return (
            <Card key={csId} className="border-0 shadow-sm mb-3">
              <Card.Header className="bg-white d-flex align-items-center justify-content-between py-3">
                <div
                  className="d-flex align-items-center gap-2 flex-grow-1"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleExpandCard(csId)}
                >
                  <strong>{getClassName(cs)}</strong>
                  <span className="text-muted">—</span>
                  <span>{getSubjectName(cs)}</span>
                  {overrides.length > 0 && (
                    <Badge bg="secondary" className="ms-2">
                      {overrides.length} override{overrides.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="small text-muted">
                    {cs.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Form.Check
                    type="switch"
                    checked={cs.isEnabled}
                    onChange={() => handleToggleClass(cs)}
                    disabled={savingStates[csId]}
                    label=""
                  />
                </div>
              </Card.Header>

              {isExpanded && (
                <Card.Body>
                  <h6 className="d-flex align-items-center gap-2 mb-3">
                    <FaUsers size={14} />
                    Student Overrides
                  </h6>
                  <p className="text-muted small mb-3">
                    By default, all students follow the class setting ({cs.isEnabled ? 'enabled' : 'disabled'}).
                    Add overrides below for individual students.
                  </p>

                  {students.length === 0 ? (
                    <p className="text-muted small">No students found in this class.</p>
                  ) : (
                    <Table size="sm" hover responsive>
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th style={{ width: '140px' }}>Status</th>
                          <th style={{ width: '120px' }}>Override</th>
                          <th style={{ width: '60px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(student => {
                          const overrideStatus = getStudentOverrideStatus(csId, student.id);
                          const effectiveEnabled = overrideStatus !== null ? overrideStatus : cs.isEnabled;
                          const hasOverride = overrideStatus !== null;
                          const key = `${csId}-${student.id}`;

                          return (
                            <tr key={student.id}>
                              <td>{personName(student, student.email)}</td>
                              <td>
                                {effectiveEnabled ? (
                                  <Badge bg="success">
                                    <FaToggleOn className="me-1" /> Enabled
                                  </Badge>
                                ) : (
                                  <Badge bg="secondary">
                                    <FaToggleOff className="me-1" /> Disabled
                                  </Badge>
                                )}
                                {!hasOverride && (
                                  <span className="text-muted small ms-1">(class default)</span>
                                )}
                              </td>
                              <td>
                                <Form.Check
                                  type="switch"
                                  checked={effectiveEnabled}
                                  onChange={() => handleToggleStudentOverride(csId, student.id, overrideStatus)}
                                  disabled={savingStates[key]}
                                  label=""
                                />
                              </td>
                              <td>
                                {hasOverride && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger p-0"
                                    onClick={() => handleRemoveOverride(csId, student.id)}
                                    disabled={savingStates[`${key}-rm`]}
                                    title="Remove override (revert to class default)"
                                  >
                                    <FaTrash size={12} />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              )}
            </Card>
          );
        })
      )}
    </Container>
  );
}

export default TutorSettings;
