import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Column } from './Column';
import { NewColumnForm } from './NewColumnForm';
import { NewTaskForm } from './NewTaskForm';
import { useKanban } from '../hooks/useKanban';

export const KanbanBoard = () => {
  const {
    columns,
    loading,
    error,
    fetchColumns,
    createColumn,
    deleteColumn,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
  } = useKanban();

  const [showNewColumnForm, setShowNewColumnForm] = useState(false);
  const [selectedColumnForTask, setSelectedColumnForTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  // Инициализация сенсоров должна быть внутри компонента
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the task
    let activeTask = null;
    let sourceColumnId = null;
    
    for (const column of columns) {
      const task = column.tasks.find(t => t.id === activeId);
      if (task) {
        activeTask = task;
        sourceColumnId = column.id;
        break;
      }
    }

    if (!activeTask) return;

    // Moving within same column
    if (over.data.current?.sortable && over.data.current.sortable.containerId === sourceColumnId) {
      const column = columns.find(col => col.id === sourceColumnId);
      const oldIndex = column.tasks.findIndex(task => task.id === activeId);
      const newIndex = column.tasks.findIndex(task => task.id === overId);

      if (oldIndex !== newIndex) {
        const newTasks = arrayMove(column.tasks, oldIndex, newIndex);
        
        // Optimistic update
        const updatedColumns = columns.map(col =>
          col.id === sourceColumnId ? { ...col, tasks: newTasks } : col
        );

        // Update order in backend
        try {
          await moveTask(activeId, sourceColumnId, newIndex + 1);
        } catch (error) {
          // Revert on error
          fetchColumns();
        }
      }
    }
    // Moving to different column
    else if (over.data.current?.type === 'droppable') {
      const targetColumnId = overId;
      
      // Optimistic update
      const updatedColumns = columns.map(col => ({
        ...col,
        tasks: col.tasks.filter(task => task.id !== activeId)
      })).map(col =>
        col.id === targetColumnId
          ? { ...col, tasks: [...col.tasks, activeTask] }
          : col
      );

      try {
        await moveTask(activeId, targetColumnId, updatedColumns.find(col => col.id === targetColumnId).tasks.length);
      } catch (error) {
        fetchColumns();
      }
    }
  };

  const handleCreateColumn = async (title) => {
    try {
      await createColumn(title);
      setShowNewColumnForm(false);
    } catch (error) {
      console.error('Error creating column:', error);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (window.confirm('Delete this column and all its tasks?')) {
      try {
        await deleteColumn(columnId);
      } catch (error) {
        console.error('Error deleting column:', error);
      }
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await createTask(taskData);
      setSelectedColumnForTask(null);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      await updateTask(editingTask.id, taskData);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="kanban-board">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="board-header">
          <h1>Kanban Board</h1>
        </div>

        <div className="board-content">
          <SortableContext 
            items={columns.map(col => col.id)} 
            strategy={horizontalListSortingStrategy}
          >
            {columns.map(column => (
              <Column
                key={column.id}
                column={column}
                onAddTask={setSelectedColumnForTask}
                onEditTask={setEditingTask}
                onDeleteTask={handleDeleteTask}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}
          </SortableContext>

          {showNewColumnForm ? (
            <NewColumnForm
              onSubmit={handleCreateColumn}
              onCancel={() => setShowNewColumnForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowNewColumnForm(true)}
              className="add-column-btn"
            >
              + Add Column
            </button>
          )}
        </div>
      </DndContext>

      {selectedColumnForTask && (
        <div className="modal-overlay">
          <NewTaskForm
            columnId={selectedColumnForTask}
            onSubmit={handleCreateTask}
            onCancel={() => setSelectedColumnForTask(null)}
          />
        </div>
      )}

      {editingTask && (
        <div className="modal-overlay">
          <div className="edit-task-form">
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleUpdateTask({
                title: formData.get('title'),
                description: formData.get('description'),
              });
            }}>
              <div className="form-header">
                <h3>Edit Task</h3>
                <button 
                  type="button" 
                  onClick={() => setEditingTask(null)} 
                  className="icon-btn"
                >
                  ✕
                </button>
              </div>
              
              <div className="form-group">
                <input
                  type="text"
                  name="title"
                  defaultValue={editingTask.title}
                  required
                />
              </div>
              
              <div className="form-group">
                <textarea
                  name="description"
                  defaultValue={editingTask.description}
                  rows={3}
                />
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setEditingTask(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
