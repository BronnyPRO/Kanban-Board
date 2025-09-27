from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid
from app.models import ColumnModel, TaskModel
from app.schemas import TaskCreate, ColumnCreate, TaskUpdate, ColumnUpdate


# Column CRUD operations
def get_columns(db: Session, skip: int = 0, limit: int = 100):
    return db.query(ColumnModel).order_by(ColumnModel.column_order.asc()).offset(skip).limit(limit).all()


def get_column(db: Session, column_id: uuid.UUID):
    return db.query(ColumnModel).filter(ColumnModel.id == column_id).first()


def create_column(db: Session, column: ColumnCreate):
    # Get max order to place new column at the end
    max_order = db.query(func.max(ColumnModel.column_order)).scalar() or 0
    db_column = ColumnModel(
        title=column.title,
        column_order=max_order + 1.0
    )
    db.add(db_column)
    db.commit()
    db.refresh(db_column)
    return db_column


def update_column(db: Session, column_id: uuid.UUID, column: ColumnUpdate):
    db_column = get_column(db, column_id)
    if db_column:
        if column.title is not None:
            db_column.title = column.title
        if column.column_order is not None:
            db_column.column_order = column.column_order
        db.commit()
        db.refresh(db_column)
    return db_column


def delete_column(db: Session, column_id: uuid.UUID):
    db_column = get_column(db, column_id)
    if db_column:
        db.delete(db_column)
        db.commit()
    return db_column


# Task CRUD operations
def get_tasks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(TaskModel).order_by(TaskModel.task_order.asc()).offset(skip).limit(limit).all()


def get_task(db: Session, task_id: uuid.UUID):
    return db.query(TaskModel).filter(TaskModel.id == task_id).first()


def get_tasks_by_column(db: Session, column_id: uuid.UUID):
    return db.query(TaskModel).filter(TaskModel.column_id == column_id).order_by(TaskModel.task_order.asc()).all()


def create_task(db: Session, task: TaskCreate):
    # Get max order in the target column to place new task at the end
    max_order = db.query(func.max(TaskModel.task_order)).filter(
        TaskModel.column_id == task.column_id
    ).scalar() or 0

    db_task = TaskModel(
        title=task.title,
        description=task.description,
        column_id=task.column_id,
        task_order=max_order + 1.0
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task(db: Session, task_id: uuid.UUID, task: TaskUpdate):
    db_task = get_task(db, task_id)
    if db_task:
        if task.title is not None:
            db_task.title = task.title
        if task.description is not None:
            db_task.description = task.description
        if task.column_id is not None:
            db_task.column_id = task.column_id
        if task.task_order is not None:
            db_task.task_order = task.task_order
        db.commit()
        db.refresh(db_task)
    return db_task


def move_task(db: Session, task_id: uuid.UUID, task_move):
    """Specialized function for moving tasks with order recalculation"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None

    # If moving to different column or changing order
    if db_task.column_id != task_move.column_id or db_task.task_order != task_move.task_order:
        # Update the task
        db_task.column_id = task_move.column_id
        db_task.task_order = task_move.task_order
        db.commit()
        db.refresh(db_task)

    return db_task


def delete_task(db: Session, task_id: uuid.UUID):
    db_task = get_task(db, task_id)
    if db_task:
        db.delete(db_task)
        db.commit()
    return db_task


def recalculate_task_orders(db: Session, column_id: uuid.UUID):
    """Recalculate orders for tasks in a column (e.g., after deletion)"""
    tasks = get_tasks_by_column(db, column_id)
    for index, task in enumerate(tasks, start=1):
        task.task_order = float(index)
    db.commit()
    return tasks
