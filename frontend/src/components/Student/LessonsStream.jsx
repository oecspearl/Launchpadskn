                            </div >
                          )}
{
  lesson.location && (
    <div className="meta-item">
      <FaMapMarkerAlt className="me-1" />
      <span>{lesson.location}</span>
    </div>
  )
}
                        </div >

{
  lesson.topic && (
    <div className="lesson-topic">
      <Badge bg="info" className="me-1">Topic</Badge>
      <span className="small">{lesson.topic}</span>
    </div>
  )
}

{
  lesson.description && (
    <p className="lesson-description">
      {lesson.description.length > 150
        ? `${lesson.description.substring(0, 150)}...`
        : lesson.description}
    </p>
  )
}

{
  lesson.homework_description && (
    <div className="lesson-homework">
      <Badge bg="warning">Homework Assigned</Badge>
      {lesson.homework_due_date && (
        <small className="text-muted ms-2">
          Due: {formatDate(lesson.homework_due_date)}
        </small>
      )}
    </div>
  )
}

<div className="lesson-action">
  <Button
    variant={lesson.isPast ? "outline-secondary" : "primary"}
    size="sm"
    onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
    className="lesson-action-btn"
  >
    {lesson.isPast ? 'Review' : 'View'}
    <FaChevronRight className="ms-1" style={{ fontSize: '0.75rem' }} />
  </Button>
</div>
                      </div >
                    </Card.Body >
                  </Card >
                ))}
              </div >
            </div >
          ))}
        </div >
      )}
    </div >
  );
}

export default LessonsStream;

