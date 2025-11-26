import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert,
  Form, Badge, ListGroup
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaUpload, FaFileAlt, FaCheckCircle, FaClock, FaCalendarAlt,
  FaArrowLeft, FaDownload
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { supabase } from '../../config/supabase';
import { createNotification } from '../../services/notificationService';

function AssignmentSubmission() {
  const { assessmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submissionText, setSubmissionText] = useState('');

  useEffect(() => {
    if (assessmentId) {
      fetchData();
    }
  }, [assessmentId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get assessment details
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('subject_assessments')
        .select(`
          *,
          class_subject:class_subjects(
            *,
            subject_offering:subject_form_offerings(
              subject:subjects(*)
            ),
            class:classes(
              *,
              form:forms(*)
            )
          )
        `)
        .eq('assessment_id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      // Check for existing submission
      if (user && user.userId) {
        const { data: submissionData } = await supabase
          .from('student_submissions')
          .select('*')
          .eq('assessment_id', assessmentId)
          .eq('student_id', user.userId)
          .maybeSingle();

        setSubmission(submissionData);
        if (submissionData?.submission_text) {
          setSubmissionText(submissionData.submission_text);
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load assignment details');
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        setError('File size must be less than 20MB');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile && !submissionText.trim()) {
      setError('Please provide either a file or text submission');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setUploading(true);

      let fileUrl = null;
      let filePath = null;

      // Upload file if provided
      if (selectedFile) {
        const bucketName = 'assignments';
        const timestamp = Date.now();
        const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        filePath = `submissions/${assessmentId}/${user.userId}/${timestamp}-${sanitizedFileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL (or signed URL for private buckets)
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
      }

      // Create or update submission
      const submissionData = {
        assessment_id: parseInt(assessmentId),
        student_id: user.userId,
        submission_text: submissionText.trim() || null,
        file_url: fileUrl,
        file_path: filePath,
        file_name: selectedFile ? selectedFile.name : null,
        submitted_at: new Date().toISOString()
      };

      if (submission) {
        // Update existing submission
        const { error: updateError } = await supabase
          .from('student_submissions')
          .update(submissionData)
          .eq('submission_id', submission.submission_id);

        if (updateError) throw updateError;
        setSuccess('Submission updated successfully');
      } else {
        // Create new submission
        const { error: insertError } = await supabase
          .from('student_submissions')
          .insert(submissionData);

        if (insertError) throw insertError;
        setSuccess('Assignment submitted successfully');
      }

      // Send confirmation notification
      try {
        await createNotification({
          userId: user.userId,
          type: 'system',
          title: 'Assignment Submitted',
          message: `You have successfully submitted ${assessment.assessment_name}.`,
          link_url: `/student/assignments/${assessmentId}/submit`,
          related_id: parseInt(assessmentId),
          related_type: 'assessment'
        });
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
        // Don't block success state if notification fails
      }

      setSelectedFile(null);
      fetchData();
    } catch (err) {
      console.error('Error submitting assignment:', err);
      setError(err.message || 'Failed to submit assignment');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDaysUntilDue = () => {
    if (!assessment?.due_date) return null;
    const dueDate = new Date(assessment.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  if (error && !assessment) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (!assessment) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Assignment not found</Alert>
        <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  const daysUntilDue = getDaysUntilDue();
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3;

  return (
    <Container className="mt-4">
      {/* Header */}
      <Row className="mb-4 pt-5">
        <Col>
          <Button
            variant="link"
            className="p-0 mb-2"
            onClick={() => navigate('/student/dashboard')}
          >
            <FaArrowLeft className="me-2" />
            Back to Dashboard
          </Button>
          <h2>{assessment.assessment_name}</h2>
          <p className="text-muted mb-0">
            {assessment.class_subject?.subject_offering?.subject?.subject_name} •
            {assessment.class_subject?.class?.form?.form_name} - {assessment.class_subject?.class?.class_name}
          </p>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Main Content */}
        <Col md={8}>
          {/* Assignment Details */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Assignment Details</h5>
                <Badge bg={isOverdue ? 'danger' : isDueSoon ? 'warning' : 'success'}>
                  {isOverdue ? 'Overdue' : daysUntilDue !== null ? `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} left` : 'No due date'}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              {assessment.description && (
                <div className="mb-3">
                  <h6>Description</h6>
                  <p className="mb-0">{assessment.description}</p>
                </div>
              )}

              <Row className="mb-3">
                <Col md={6}>
                  <div>
                    <FaCalendarAlt className="me-2 text-primary" />
                    <strong>Due Date:</strong> {assessment.due_date ? formatDate(assessment.due_date) : 'No due date'}
                  </div>
                </Col>
                {assessment.total_marks && (
                  <Col md={6}>
                    <div>
                      <strong>Total Marks:</strong> {assessment.total_marks}
                    </div>
                  </Col>
                )}
              </Row>

              {assessment.assessment_type && (
                <div className="mb-2">
                  <Badge bg="secondary">{assessment.assessment_type}</Badge>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Submission Form */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0">
                {submission ? 'Update Submission' : 'Submit Assignment'}
              </h5>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
              {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

              {submission && (
                <Alert variant="info" className="mb-3">
                  <FaCheckCircle className="me-2" />
                  You have already submitted this assignment.
                  {submission.submitted_at && (
                    <div className="mt-2 small">
                      Submitted on: {formatDate(submission.submitted_at)}
                    </div>
                  )}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Submission Text (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Enter your submission text here..."
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Upload File {submission && '(Optional - will replace existing file)'}
                  </Form.Label>
                  <Form.Control
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <Form.Text className="text-muted">
                    Maximum file size: 20MB. Accepted formats: PDF, DOC, DOCX, TXT
                  </Form.Text>
                  {selectedFile && (
                    <div className="mt-2">
                      <Badge bg="info">
                        <FaFileAlt className="me-1" />
                        {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </Badge>
                    </div>
                  )}
                  {submission?.file_name && !selectedFile && (
                    <div className="mt-2">
                      <Badge bg="secondary">
                        <FaFileAlt className="me-1" />
                        Current: {submission.file_name}
                      </Badge>
                    </div>
                  )}
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={uploading || (!selectedFile && !submissionText.trim() && !submission)}
                  >
                    {uploading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        {submission ? 'Updating...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <FaUpload className="me-2" />
                        {submission ? 'Update Submission' : 'Submit Assignment'}
                      </>
                    )}
                  </Button>
                  {submission?.file_url && (
                    <Button
                      variant="outline-primary"
                      href={submission.file_url}
                      target="_blank"
                    >
                      <FaDownload className="me-2" />
                      View Submitted File
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col md={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h6 className="mb-0">Submission Status</h6>
            </Card.Header>
            <Card.Body>
              {submission ? (
                <div>
                  <Badge bg="success" className="mb-2" style={{ fontSize: '1rem', padding: '0.5rem' }}>
                    <FaCheckCircle className="me-2" />
                    Submitted
                  </Badge>
                  {submission.submitted_at && (
                    <p className="mb-0 mt-2 small text-muted">
                      <FaClock className="me-1" />
                      {formatDate(submission.submitted_at)}
                    </p>
                  )}
                </div>
              ) : (
                <Badge bg="warning" style={{ fontSize: '1rem', padding: '0.5rem' }}>
                  <FaClock className="me-2" />
                  Not Submitted
                </Badge>
              )}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h6 className="mb-0">Assignment Information</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                <strong>Type:</strong> {assessment.assessment_type || 'N/A'}
              </div>
              {assessment.total_marks && (
                <div className="mb-2">
                  <strong>Total Marks:</strong> {assessment.total_marks}
                </div>
              )}
              {assessment.due_date && (
                <div>
                  <strong>Due Date:</strong>
                  <div className="mt-1">
                    {formatDate(assessment.due_date)}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AssignmentSubmission;

