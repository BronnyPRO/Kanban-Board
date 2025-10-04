import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from './Task';

export const Column = ({ 
  column, 
  onAddTask, 
  onEditTask, 
  onDeleteTask, 
  onDeleteColumn 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div 
      className={`column ${isOver ? 'column--over' : ''}`}
      ref={setNodeRef}
    >
      <div className="column-header">
        <h2 className="column-title">{column.title}</h2>
        <div className="column-actions">
          <button 
            onClick={() => onAddTask(column.id)}
            className="icon-btn"
            title="Add task"
          >
            +
          </button>
          <button 
            onClick={() => onDeleteColumn(column.id)}
            className="icon-btn icon-btn--danger"
            title="Delete column"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="column-content">
        <SortableContext 
          items={column.tasks.map(task => task.id)} 
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map(task => (
            <Task
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>
        
        {column.tasks.length === 0 && (
          <div className="empty-state">
            <p>No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};
