import React, { useState, useEffect } from 'react';
import { Nav, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { messageService } from '../../services/messageService';

function MessageIcon() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.user_id) return;

    // Initial fetch
    messageService.getUnreadCount(user.user_id)
      .then(setUnreadCount)
      .catch(() => {});

    // Subscribe to realtime updates
    const unsubscribe = messageService.subscribeToUnreadCount(
      user.user_id,
      (count) => setUnreadCount(count)
    );

    return unsubscribe;
  }, [user?.user_id]);

  // Only show for roles that can message
  const role = user?.role?.toUpperCase();
  if (role !== 'INSTRUCTOR' && role !== 'PARENT') return null;

  return (
    <Nav.Link
      as={Link}
      to="/messages"
      className="position-relative nav-link-custom"
      title="Messages"
    >
      <FaEnvelope size={16} />
      {unreadCount > 0 && (
        <Badge
          bg="danger"
          pill
          className="position-absolute"
          style={{ top: 2, right: -2, fontSize: '0.6rem', padding: '2px 5px' }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Nav.Link>
  );
}

export default MessageIcon;
