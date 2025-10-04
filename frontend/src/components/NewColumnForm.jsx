import React, { useState } from 'react';
import { X } from 'lucide-react';

export const NewColumnForm = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title.trim());
      setTitle('');
    }
  };

  return (
    <div className="new-column-form">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Column title"
          autoFocus
          required
        />
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Add
          </button>
          <button type="button" onClick={onCancel} className="icon-btn">
            <X size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};
