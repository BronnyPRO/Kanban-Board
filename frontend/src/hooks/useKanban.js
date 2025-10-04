import { useState, useEffect } from 'react';
import { columnApi, taskApi } from '../services/api';

export const useKanban = () => {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchColumns();
  }, []);

  const fetchColumns = async () => {
    try {
      setLoading(true);
      const response = await columnApi.getAll();
      setColumns(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching columns:', err);
    } finally {
      setLoading(false);
    }
  };

  const createColumn = async (title) => {
    try {
      const response = await columnApi.create({ title });
      setColumns(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteColumn = async (columnId) => {
    try {
      await columnApi.delete(columnId);
      setColumns(prev => prev.filter(col => col.id !== columnId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const createTask = async (taskData) => {
    try {
      const response = await taskApi.create(taskData);
      setColumns(prev => prev.map(col => 
        col.id === taskData.column_id 
          ? { ...col, tasks: [...col.tasks, response.data] }
          : col
      ));
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateTask = async (taskId, taskData) => {
    try {
      const response = await taskApi.update(taskId, taskData);
      setColumns(prev => prev.map(col => ({
        ...col,
        tasks: col.tasks.map(task => 
          task.id === taskId ? response.data : task
        )
      })));
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const moveTask = async (taskId, columnId, newOrder) => {
    try {
      const response = await taskApi.move(taskId, {
        column_id: columnId,
        task_order: newOrder
      });

      setColumns(prev => {
        // Remove from old column
        const withoutTask = prev.map(col => ({
          ...col,
          tasks: col.tasks.filter(task => task.id !== taskId)
        }));
        
        // Add to new column
        return withoutTask.map(col => 
          col.id === columnId 
            ? { ...col, tasks: [...col.tasks, response.data] }
            : col
        );
      });

      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await taskApi.delete(taskId);
      setColumns(prev => prev.map(col => ({
        ...col,
        tasks: col.tasks.filter(task => task.id !== taskId)
      })));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
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
  };
};
