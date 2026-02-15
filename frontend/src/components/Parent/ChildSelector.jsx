import React from 'react';
import { Form } from 'react-bootstrap';
import { FaChild } from 'react-icons/fa';

function ChildSelector({ children, activeChildId, onSelect }) {
  if (!children || children.length <= 1) return null;

  return (
    <div className="child-selector mb-3 d-flex align-items-center gap-3">
      <FaChild className="text-primary" size={18} />
      <Form.Select
        value={activeChildId || ''}
        onChange={(e) => onSelect(Number(e.target.value))}
        style={{ maxWidth: 300 }}
      >
        {children.map(link => (
          <option key={link.student.user_id} value={link.student.user_id}>
            {link.student.name} ({link.relationship})
          </option>
        ))}
      </Form.Select>
    </div>
  );
}

export default ChildSelector;
