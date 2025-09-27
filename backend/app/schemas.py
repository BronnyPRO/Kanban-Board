from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


# Base schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None


class ColumnBase(BaseModel):
    title: str


# Create schemas
class TaskCreate(TaskBase):
    column_id: UUID


class ColumnCreate(ColumnBase):
    column_order: Optional[float] = 0


# Response schemas
class Task(TaskBase):
    id: UUID
    column_id: UUID
    task_order: float
    created_at: datetime

    class Config:
        from_attributes = True


class Column(ColumnBase):
    id: UUID
    column_order: float
    created_at: datetime
    tasks: List[Task] = []

    class Config:
        from_attributes = True


# Update schemas
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    column_id: Optional[UUID] = None
    task_order: Optional[float] = None


class TaskMove(BaseModel):
    column_id: UUID
    task_order: float


class ColumnUpdate(BaseModel):
    title: Optional[str] = None
    column_order: Optional[float] = None
