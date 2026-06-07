import React from 'react';
import { Modal, Button, Alert, Card, Badge, ListGroup } from 'react-bootstrap';
import {
  FaEye, FaClipboardCheck, FaTasks, FaCheckCircle, FaExternalLinkAlt, FaFilePdf, FaEdit
} from 'react-icons/fa';
import DOMPurify from 'dompurify';
import { supabase } from '../../config/supabase';
import FlashcardViewer from '../Student/FlashcardViewer';
import { getYouTubeEmbedUrl, formatFileSize } from './lessonContentHelpers';

/**
 * Read-only preview of a lesson content item (video, image, text blocks,
 * quiz, assignment, …). Extracted verbatim from LessonContentManager.
 */
function ContentPreviewModal({
  show,
  previewingContent,
  previewUrl,
  onClose,
  onEditContent,
  onOpenQuizBuilder,
  onError,
}) {
  return (
      <Modal show={show} onHide={onClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEye className="me-2" />
            Preview: {previewingContent?.title || 'Content Preview'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ minHeight: '400px' }}>
          {previewingContent && (
            <>
              {(() => {
                // Skip IIFE rendering for full quiz/assignment previews
                if (previewingContent.content_type === 'QUIZ' && previewingContent.hasInAppQuiz) {
                  return null;
                }
                if (previewingContent.content_type === 'ASSIGNMENT') {
                  return null;
                }

                if (previewingContent.content_type === 'FLASHCARD') {
                  // Flashcard preview handled separately
                } else if (previewingContent.content_type === 'INTERACTIVE_VIDEO') {
                  // Interactive video preview - handled separately in modal
                  return null;
                } else if (previewingContent.content_type === 'INTERACTIVE_BOOK') {
                  // Interactive book preview - handled separately in modal
                  return null;
                } else if (previewingContent.content_type === 'FLASHCARD') {
                  return (
                    <div className="p-3">
                      <FlashcardViewer
                        contentData={previewingContent.content_data || { cards: [], settings: {} }}
                        title={previewingContent.title}
                        description={previewingContent.description}
                      />
                    </div>
                  );
                }

                const isTextContent = ['LEARNING_OUTCOMES', 'LEARNING_ACTIVITIES', 'KEY_CONCEPTS',
                  'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(previewingContent.content_type);

                if (isTextContent) {
                  const contentText =
                    previewingContent.content_type === 'LEARNING_OUTCOMES' ? previewingContent.learning_outcomes :
                      previewingContent.content_type === 'LEARNING_ACTIVITIES' ? previewingContent.learning_activities :
                        previewingContent.content_type === 'KEY_CONCEPTS' ? previewingContent.key_concepts :
                          previewingContent.content_type === 'REFLECTION_QUESTIONS' ? previewingContent.reflection_questions :
                            previewingContent.content_type === 'DISCUSSION_PROMPTS' ? previewingContent.discussion_prompts :
                              previewingContent.content_type === 'SUMMARY' ? previewingContent.summary : '';

                  return (
                    <div className="p-4">
                      <div className="mb-3">
                        <h5 className="mb-3">{previewingContent.title}</h5>
                        <div
                          style={{ fontSize: '1rem', lineHeight: '1.8' }}
                          dangerouslySetInnerHTML={{
                            __html: contentText ? DOMPurify.sanitize(contentText) : '<p class="text-muted">No content available.</p>'
                          }}
                        />
                      </div>
                    </div>
                  );
                }

                if (previewUrl) {
                  const isVideo = previewingContent.content_type === 'VIDEO' ||
                    (previewUrl && (previewUrl.includes('youtube.com') || previewUrl.includes('youtu.be')));
                  const isImage = previewingContent.content_type === 'IMAGE' ||
                    (previewingContent.mime_type && previewingContent.mime_type.startsWith('image/'));

                  if (isVideo) {
                    if (previewUrl.includes('youtube.com') || previewUrl.includes('youtu.be')) {
                      return (
                        <div className="ratio ratio-16x9">
                          <iframe
                            src={getYouTubeEmbedUrl(previewUrl)}
                            title={previewingContent.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ border: 0 }}
                          />
                        </div>
                      );
                    } else {
                      return (
                        <video controls className="w-100" style={{ maxHeight: '500px' }}>
                          <source src={previewUrl} type={previewingContent.mime_type || 'video/mp4'} />
                          Your browser does not support the video tag.
                        </video>
                      );
                    }
                  } else if (isImage) {
                    return (
                      <div className="text-center">
                        <img
                          src={previewUrl}
                          alt={previewingContent.title}
                          className="img-fluid"
                          style={{ maxHeight: '500px', maxWidth: '100%' }}
                        />
                      </div>
                    );
                  } else {
                    const assessmentTypes = ['QUIZ', 'ASSIGNMENT', 'TEST', 'EXAM', 'PROJECT', 'SURVEY'];
                    const isAssessment = assessmentTypes.includes(previewingContent.content_type);
                    const assessmentLabels = {
                      'QUIZ': 'Quiz',
                      'ASSIGNMENT': 'Assignment',
                      'TEST': 'Test',
                      'EXAM': 'Exam',
                      'PROJECT': 'Project',
                      'SURVEY': 'Survey'
                    };
                    const label = assessmentLabels[previewingContent.content_type] || 'Content';
                    return (
                      <div className="text-center py-5">
                        {isAssessment ? (
                          <>
                            <h5 className="mb-3">{label}: {previewingContent.title}</h5>
                            <p className="mb-3">Click the button below to open the {label.toLowerCase()} in a new tab.</p>
                          </>
                        ) : (
                          <p className="mb-3">Preview not available for this content type.</p>
                        )}
                        <Button
                          variant="primary"
                          onClick={() => window.open(previewUrl, '_blank')}
                        >
                          <FaExternalLinkAlt className="me-2" />
                          {isAssessment ? `Open ${label}` : 'Open in New Tab'}
                        </Button>
                      </div>
                    );
                  }
                  return null;
                }

                return null;
              })()}
              {/* Full Quiz Preview */}
              {previewingContent.content_type === 'QUIZ' && previewingContent.hasInAppQuiz && previewingContent.quiz && (
                <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <Alert variant="success" className="mb-4">
                    <h5>
                      <FaClipboardCheck className="me-2" />
                      In-App Quiz Preview
                    </h5>
                    <div className="mb-2">
                      <strong>Quiz Title:</strong> {previewingContent.quiz.title || previewingContent.title}
                    </div>
                    {previewingContent.quiz.description && (
                      <div className="mb-2">
                        <strong>Description:</strong> {previewingContent.quiz.description}
                      </div>
                    )}
                    <div className="d-flex gap-4 flex-wrap">
                      {previewingContent.quiz.total_points && (
                        <div>
                          <strong>Total Points:</strong> {previewingContent.quiz.total_points}
                        </div>
                      )}
                      {previewingContent.quiz.time_limit_minutes && (
                        <div>
                          <strong>Time Limit:</strong> {previewingContent.quiz.time_limit_minutes} minutes
                        </div>
                      )}
                      {previewingContent.quiz.passing_score && (
                        <div>
                          <strong>Passing Score:</strong> {previewingContent.quiz.passing_score}%
                        </div>
                      )}
                      <div>
                        <strong>Status:</strong>{' '}
                        <Badge bg={previewingContent.quiz.is_published ? 'success' : 'warning'}>
                          {previewingContent.quiz.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                    </div>
                  </Alert>

                  {previewingContent.quiz.questions && previewingContent.quiz.questions.length > 0 ? (
                    <div>
                      <h6 className="mb-3">Questions ({previewingContent.quiz.questions.length})</h6>
                      {previewingContent.quiz.questions.map((question, index) => (
                        <Card key={question.question_id || index} className="mb-3">
                          <Card.Header className="bg-light">
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>Question {index + 1}</strong>
                              <Badge bg="info">{question.points || 0} points</Badge>
                            </div>
                          </Card.Header>
                          <Card.Body>
                            <p className="mb-3"><strong>{question.question_text}</strong></p>
                            <Badge bg="secondary" className="mb-3">{question.question_type}</Badge>

                            {['MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.question_type) && question.options && (
                              <div className="mt-3">
                                <strong>Answer Options:</strong>
                                <ListGroup className="mt-2">
                                  {question.options.map((option, optIndex) => (
                                    <ListGroup.Item
                                      key={option.option_id || optIndex}
                                      className={option.is_correct ? 'bg-success bg-opacity-25' : ''}
                                    >
                                      <div className="d-flex align-items-center">
                                        {option.is_correct && (
                                          <FaCheckCircle className="me-2 text-success" />
                                        )}
                                        <span>{option.option_text}</span>
                                        {option.is_correct && (
                                          <Badge bg="success" className="ms-auto">Correct</Badge>
                                        )}
                                      </div>
                                    </ListGroup.Item>
                                  ))}
                                </ListGroup>
                              </div>
                            )}

                            {['SHORT_ANSWER', 'FILL_BLANK'].includes(question.question_type) && question.correct_answers && question.correct_answers.length > 0 && (
                              <div className="mt-3">
                                <strong>Correct Answer(s):</strong>
                                <ul className="mt-2">
                                  {question.correct_answers.map((answer, ansIndex) => (
                                    <li key={ansIndex}>
                                      {answer.correct_answer}
                                      {answer.case_sensitive && <Badge bg="info" className="ms-2">Case Sensitive</Badge>}
                                      {answer.accept_partial && <Badge bg="info" className="ms-2">Partial Match</Badge>}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {question.explanation && (
                              <Alert variant="info" className="mt-3 mb-0">
                                <strong>Explanation:</strong> {question.explanation}
                              </Alert>
                            )}
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert variant="warning">
                      No questions added to this quiz yet.
                    </Alert>
                  )}

                  <div className="d-flex gap-2 justify-content-center mt-4">
                    <Button
                      variant="success"
                      onClick={() => {
                        onClose();
                        onOpenQuizBuilder(previewingContent);
                      }}
                    >
                      <FaClipboardCheck className="me-2" />
                      {previewingContent.quiz.is_published ? 'Edit Quiz' : 'Edit & Publish Quiz'}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        onClose();
                        onEditContent(previewingContent);
                      }}
                    >
                      <FaEdit className="me-2" />
                      Edit Content
                    </Button>
                  </div>
                </div>
              )}

              {/* Full Assignment Preview */}
              {previewingContent.content_type === 'ASSIGNMENT' && (
                <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <Alert variant="info" className="mb-4">
                    <h5>
                      <FaTasks className="me-2" />
                      Assignment Preview
                    </h5>
                    <div className="mb-2">
                      <strong>Title:</strong> {previewingContent.title}
                    </div>
                    {previewingContent.description && (
                      <div className="mb-2">
                        <strong>Description:</strong> {previewingContent.description}
                      </div>
                    )}
                    {previewingContent.instructions && (
                      <div className="mb-2">
                        <strong>Instructions:</strong> {previewingContent.instructions}
                      </div>
                    )}
                    {previewingContent.estimated_minutes && (
                      <div>
                        <strong>Estimated Time:</strong> {previewingContent.estimated_minutes} minutes
                      </div>
                    )}
                  </Alert>

                  {/* Assignment Details PDF */}
                  {previewingContent.assignment_details_file_name && (
                    <Card className="mb-3">
                      <Card.Header className="bg-primary text-white">
                        <FaFilePdf className="me-2" />
                        Assignment Details PDF
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{previewingContent.assignment_details_file_name}</strong>
                            {previewingContent.assignment_details_file_size && (
                              <small className="text-muted ms-2">
                                ({formatFileSize(previewingContent.assignment_details_file_size)})
                              </small>
                            )}
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.storage
                                  .from('course-content')
                                  .createSignedUrl(previewingContent.assignment_details_file_path, 3600);

                                if (error) throw error;
                                if (data?.signedUrl) {
                                  window.open(data.signedUrl, '_blank');
                                }
                              } catch (err) {
                                console.error('Error opening assignment details:', err);
                                onError('Unable to open assignment details PDF.');
                              }
                            }}
                          >
                            <FaFilePdf className="me-2" />
                            View PDF
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  )}

                  {/* Assignment Rubric PDF */}
                  {previewingContent.assignment_rubric_file_name && (
                    <Card className="mb-3">
                      <Card.Header className="bg-success text-white">
                        <FaFilePdf className="me-2" />
                        Grading Rubric PDF
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{previewingContent.assignment_rubric_file_name}</strong>
                            {previewingContent.assignment_rubric_file_size && (
                              <small className="text-muted ms-2">
                                ({formatFileSize(previewingContent.assignment_rubric_file_size)})
                              </small>
                            )}
                          </div>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.storage
                                  .from('course-content')
                                  .createSignedUrl(previewingContent.assignment_rubric_file_path, 3600);

                                if (error) throw error;
                                if (data?.signedUrl) {
                                  window.open(data.signedUrl, '_blank');
                                }
                              } catch (err) {
                                console.error('Error opening assignment rubric:', err);
                                onError('Unable to open assignment rubric PDF.');
                              }
                            }}
                          >
                            <FaFilePdf className="me-2" />
                            View PDF
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  )}

                  {/* Assignment URL */}
                  {previewingContent.url && (
                    <Card className="mb-3">
                      <Card.Header className="bg-secondary text-white">
                        <FaExternalLinkAlt className="me-2" />
                        Assignment Link
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="text-truncate me-3">
                            <a href={previewingContent.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                              {previewingContent.url}
                            </a>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => window.open(previewingContent.url, '_blank')}
                          >
                            <FaExternalLinkAlt className="me-2" />
                            Open Link
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  )}

                  {/* Additional Assignment Information */}
                  {(previewingContent.learning_outcomes || previewingContent.key_concepts || previewingContent.reflection_questions) && (
                    <div className="mt-4">
                      {previewingContent.learning_outcomes && (
                        <Card className="mb-3">
                          <Card.Header className="bg-light">
                            <strong>Learning Outcomes</strong>
                          </Card.Header>
                          <Card.Body>
                            <div className="white-space-pre-wrap">{previewingContent.learning_outcomes}</div>
                          </Card.Body>
                        </Card>
                      )}
                      {previewingContent.key_concepts && (
                        <Card className="mb-3">
                          <Card.Header className="bg-light">
                            <strong>Key Concepts</strong>
                          </Card.Header>
                          <Card.Body>
                            <div className="white-space-pre-wrap">{previewingContent.key_concepts}</div>
                          </Card.Body>
                        </Card>
                      )}
                      {previewingContent.reflection_questions && (
                        <Card className="mb-3">
                          <Card.Header className="bg-light">
                            <strong>Reflection Questions</strong>
                          </Card.Header>
                          <Card.Body>
                            <div className="white-space-pre-wrap">{previewingContent.reflection_questions}</div>
                          </Card.Body>
                        </Card>
                      )}
                    </div>
                  )}

                  {!previewingContent.assignment_details_file_name &&
                    !previewingContent.assignment_rubric_file_name &&
                    !previewingContent.url && (
                      <Alert variant="warning">
                        No assignment materials uploaded yet. Add assignment details PDF, rubric PDF, or an assignment URL.
                      </Alert>
                    )}

                  <div className="d-flex gap-2 justify-content-center mt-4">
                    <Button
                      variant="primary"
                      onClick={() => {
                        onClose();
                        onEditContent(previewingContent);
                      }}
                    >
                      <FaEdit className="me-2" />
                      Edit Assignment
                    </Button>
                  </div>
                </div>
              )}

              {!['LEARNING_OUTCOMES', 'LEARNING_ACTIVITIES', 'KEY_CONCEPTS',
                'REFLECTION_QUESTIONS', 'DISCUSSION_PROMPTS', 'SUMMARY'].includes(previewingContent.content_type) &&
                !previewUrl &&
                previewingContent.content_type !== 'QUIZ' &&
                previewingContent.content_type !== 'ASSIGNMENT' && (
                  <div className="text-center py-5">
                    {(
                      <>
                        <Alert variant="warning" className="mb-4">
                          <h5>No URL Available</h5>
                          <p className="mb-0">
                            {previewingContent.content_type === 'VIDEO'
                              ? 'This video content does not have a URL. Please edit the content to add a video URL (YouTube link or direct video URL).'
                              : previewingContent.content_type === 'IMAGE'
                                ? 'This image content does not have a URL. Please edit the content to add an image URL.'
                                : previewingContent.content_type === 'QUIZ'
                                  ? 'This quiz does not have a URL or an in-app quiz. You can either add an external quiz URL (Google Forms, Kahoot, Quizizz, etc.) or create an in-app quiz.'
                                  : previewingContent.content_type === 'ASSIGNMENT'
                                    ? (previewingContent.assignment_details_file_name || previewingContent.assignment_rubric_file_name)
                                      ? 'This assignment does not have a URL, but it has uploaded PDFs (details and/or rubric). You can optionally add an assignment URL (Google Classroom, assignment platform, etc.).'
                                      : 'This assignment does not have a URL. You can optionally add an assignment URL (Google Classroom, assignment platform, etc.) or upload assignment details and rubric PDFs.'
                                    : previewingContent.content_type === 'TEST'
                                      ? 'This test does not have a URL. Please edit the content to add a test URL (test platform, Google Forms, etc.).'
                                      : previewingContent.content_type === 'EXAM'
                                        ? 'This exam does not have a URL. Please edit the content to add an exam URL (exam platform, Google Forms, etc.).'
                                        : previewingContent.content_type === 'PROJECT'
                                          ? 'This project does not have a URL. Please edit the content to add a project URL (project description, submission link, etc.).'
                                          : previewingContent.content_type === 'SURVEY'
                                            ? 'This survey does not have a URL. Please edit the content to add a survey URL (Google Forms, SurveyMonkey, etc.).'
                                            : previewingContent.file_path
                                              ? 'Unable to generate preview URL. The file may not be accessible or you may not have permission to view it.'
                                              : 'This content does not have a URL or file path. Please edit the content to add a URL or upload a file.'}
                          </p>
                        </Alert>
                        <div className="d-flex gap-2 justify-content-center">
                          {previewingContent.content_type === 'QUIZ' && (
                            <Button
                              variant="success"
                              onClick={() => {
                                onClose();
                                onOpenQuizBuilder(previewingContent);
                              }}
                            >
                              <FaClipboardCheck className="me-2" />
                              Create In-App Quiz
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            onClick={() => {
                              onClose();
                              onEditContent(previewingContent);
                            }}
                          >
                            <FaEdit className="me-2" />
                            {previewingContent.content_type === 'QUIZ' ? 'Edit Content or Add URL' : 'Edit Content to Add URL'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {previewUrl ? (
            <Button
              variant="primary"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              <FaExternalLinkAlt className="me-2" />
              Open in New Tab
            </Button>
          ) : previewingContent && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onEditContent(previewingContent);
              }}
            >
              <FaEdit className="me-2" />
              Edit Content
            </Button>
          )}
        </Modal.Footer>
      </Modal>
  );
}

export default ContentPreviewModal;
