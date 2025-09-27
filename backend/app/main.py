from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid
from typing import List

from app.database import get_db, engine
from app.models import Base
from app.schemas import Column, ColumnCreate, Task, TaskCreate, TaskUpdate, TaskMove, ColumnUpdate
import app.crud

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kanban Board API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Kanban Board API"}


# Column endpoints
@app.get("/columns/", response_model=List[Column])
def read_columns(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all columns with their tasks"""
    columns = crud.get_columns(db, skip=skip, limit=limit)
    return columns


@app.get("/columns/{column_id}", response_model=Column)
def read_column(column_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific column"""
    db_column = crud.get_column(db, column_id=column_id)
    if db_column is None:
        raise HTTPException(status_code=404, detail="Column not found")
    return db_column


@app.post("/columns/", response_model=Column)
def create_column(column: ColumnCreate, db: Session = Depends(get_db)):
    """Create a new column"""
    return crud.create_column(db=db, column=column)


@app.put("/columns/{column_id}", response_model=Column)
def update_column(column_id: uuid.UUID, column: ColumnUpdate, db: Session = Depends(get_db)):
    """Update a column"""
    db_column = crud.update_column(db, column_id=column_id, column=column)
    if db_column is None:
        raise HTTPException(status_code=404, detail="Column not found")
    return db_column


@app.delete("/columns/{column_id}")
def delete_column(column_id: uuid.UUID, db: Session = Depends(get_db)):
    """Delete a column and all its tasks"""
    db_column = crud.delete_column(db, column_id=column_id)
    if db_column is None:
        raise HTTPException(status_code=404, detail="Column not found")
    return {"message": "Column deleted successfully"}


# Task endpoints
@app.get("/tasks/", response_model=List[Task])
def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all tasks"""
    tasks = crud.get_tasks(db, skip=skip, limit=limit)
    return tasks


@app.get("/tasks/{task_id}", response_model=Task)
def read_task(task_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific task"""
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task


@app.post("/tasks/", response_model=Task)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task"""
    # Verify that the column exists
    db_column = crud.get_column(db, task.column_id)
    if db_column is None:
        raise HTTPException(status_code=404, detail="Column not found")

    return crud.create_task(db=db, task=task)


@app.put("/tasks/{task_id}", response_model=Task)
def update_task(task_id: uuid.UUID, task: TaskUpdate, db: Session = Depends(get_db)):
    """Update a task"""
    if task.column_id:
        # Verify that the new column exists
        db_column = crud.get_column(db, task.column_id)
        if db_column is None:
            raise HTTPException(status_code=404, detail="Column not found")

    db_task = crud.update_task(db, task_id=task_id, task=task)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task


@app.patch("/tasks/{task_id}/move", response_model=Task)
def move_task(task_id: uuid.UUID, task_move: TaskMove, db: Session = Depends(get_db)):
    """Move a task to a different column/position"""
    # Verify that the target column exists
    db_column = crud.get_column(db, task_move.column_id)
    if db_column is None:
        raise HTTPException(status_code=404, detail="Column not found")

    db_task = crud.move_task(db, task_id=task_id, task_move=task_move)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task


@app.delete("/tasks/{task_id}")
def delete_task(task_id: uuid.UUID, db: Session = Depends(get_db)):
    """Delete a task"""
    db_task = crud.delete_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}


# Utility endpoints
@app.post("/columns/{column_id}/recalculate-orders")
def recalculate_orders(column_id: uuid.UUID, db: Session = Depends(get_db)):
    """Recalculate task orders in a column (useful after multiple operations)"""
    db_column = crud.get_column(db, column_id=column_id)
    if db_column is None:
        raise HTTPException(status_code=404, detail="Column not found")

    crud.recalculate_task_orders(db, column_id=column_id)
    return {"message": "Task orders recalculated"}