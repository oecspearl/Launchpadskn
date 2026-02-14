import React, { useState } from 'react';
import { Card, Form, Button, ListGroup, Badge } from 'react-bootstrap';
import { FaComments, FaPaperPlane, FaUserCircle, FaReply } from 'react-icons/fa';

function DiscussionBoard({ lessonId, user }) {
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    // Sample data — discussion persistence coming soon
    const [comments, setComments] = useState([
        {
            id: 1,
            user: 'Sarah Jenkins',
            avatar: null,
            text: 'I found the section on photosynthesis really helpful!',
            timestamp: '2 hours ago',
            replies: []
        },
        {
            id: 2,
            user: 'Mike Ross',
            avatar: null,
            text: 'Can someone explain the difference between light-dependent and light-independent reactions again?',
            timestamp: '1 hour ago',
            replies: [
                {
                    id: 3,
                    user: 'Mr. Thompson (Teacher)',
                    avatar: null,
                    text: 'Great question Mike! Light-dependent reactions require sunlight to produce ATP, while light-independent reactions use that ATP to make glucose.',
                    timestamp: '30 mins ago'
                }
            ]
        }
    ]);
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const comment = {
            id: Date.now(),
            user: user?.name || 'Me',
            avatar: user?.avatar_url,
            text: newComment,
            timestamp: 'Just now',
            replies: []
        };

        setComments([...comments, comment]);
        setNewComment('');
    };

    return (
        <Card className="glass-card border-0 mt-4">
            <Card.Header className="bg-transparent border-0 py-3">
                <h5 className="mb-0 fw-bold text-dark">
                    <FaComments className="me-2 text-primary" />
                    Class Discussion
                </h5>
            </Card.Header>
            <Card.Body>
                <div className="discussion-list mb-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {comments.map((comment) => (
                        <div key={comment.id} className="mb-3">
                            <div className="d-flex align-items-start">
                                <FaUserCircle size={32} className="text-muted me-2" />
                                <div className="flex-grow-1 bg-light p-3 rounded">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <strong>{comment.user}</strong>
                                        <small className="text-muted">{comment.timestamp}</small>
                                    </div>
                                    <p className="mb-1">{comment.text}</p>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="p-0 text-decoration-none"
                                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    >
                                        <FaReply className="me-1" /> Reply
                                    </Button>
                                </div>
                            </div>

                            {/* Replies */}
                            {comment.replies.map((reply) => (
                                <div key={reply.id} className="d-flex align-items-start mt-2 ms-5">
                                    <FaUserCircle size={24} className="text-muted me-2" />
                                    <div className="flex-grow-1 bg-light p-2 rounded border-start border-4 border-primary">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <strong>{reply.user}</strong>
                                            <small className="text-muted">{reply.timestamp}</small>
                                        </div>
                                        <p className="mb-0 small">{reply.text}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Reply Form */}
                            {replyingTo === comment.id && (
                                <div className="ms-5 mt-2 d-flex gap-2">
                                    <Form.Control
                                        type="text"
                                        size="sm"
                                        placeholder="Write a reply..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && replyText.trim()) {
                                                const reply = {
                                                    id: Date.now(),
                                                    user: user?.name || 'Me',
                                                    text: replyText,
                                                    timestamp: 'Just now'
                                                };
                                                setComments(comments.map(c =>
                                                    c.id === comment.id
                                                        ? { ...c, replies: [...c.replies, reply] }
                                                        : c
                                                ));
                                                setReplyText('');
                                                setReplyingTo(null);
                                            }
                                        }}
                                    />
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        disabled={!replyText.trim()}
                                        onClick={() => {
                                            if (!replyText.trim()) return;
                                            const reply = {
                                                id: Date.now(),
                                                user: user?.name || 'Me',
                                                text: replyText,
                                                timestamp: 'Just now'
                                            };
                                            setComments(comments.map(c =>
                                                c.id === comment.id
                                                    ? { ...c, replies: [...c.replies, reply] }
                                                    : c
                                            ));
                                            setReplyText('');
                                            setReplyingTo(null);
                                        }}
                                    >
                                        <FaPaperPlane />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="d-flex gap-2">
                        <Form.Control
                            type="text"
                            placeholder="Ask a question or share your thoughts..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="rounded-pill"
                        />
                        <Button type="submit" variant="primary" className="rounded-circle p-2" style={{ width: '40px', height: '40px' }}>
                            <FaPaperPlane />
                        </Button>
                    </Form.Group>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default DiscussionBoard;
