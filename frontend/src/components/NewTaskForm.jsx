import React, { useState } from 'react';
import { X } from 'lucide-react';

export const NewTaskForm = ({ columnId, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit({
        title: title.trim(),
        description: description.trim(),
        column_id: columnId,
      });
      setTitle('');
      setDescription('');
    }
  };

  return (
    <div className="new-task-form">
      <form onSubmit={handleSubmit}>
        <div className="form-header">
          <h3>New Task</h3>
          <button type="button" onClick={onCancel} className="icon-btn">
            <X size={16} />
          </button>
        </div>
        
        <div className="form-group">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            autoFocus
            required
          />
        </div>
        
        <div className="form-group">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task description (optional)"
            rows={3}
          />
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Create Task
          </button>
        </div>
      </form>
    </div>
  );
};
