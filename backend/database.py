from enum import Enum
from config import settings
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
from sqlmodel import Session, Field, Relationship, SQLModel, create_engine, select


class APIPayload(BaseModel):
    url: Optional[str] = None
    prompt: Optional[str] = None
    category_id: int = 1
    prompt_id: Optional[int] = None

class TaskPayload(BaseModel):
    prompt: Optional[str] = None
    category_id: int
    db_id: Optional[int] = None
    youtube_id: Optional[str] = None

class TaskResponse(BaseModel):
    job_id: int
    status: str
    message: str

class TaskStatusResponse(BaseModel):
    job_id: int
    status: str
    youtube_title: Optional[str] = None
    youtube_thumbnail: Optional[str] = None
    prompt: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    category_id: Optional[int] = None
    url: Optional[str] = None
    error_msg: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class JobStatus(str, Enum):
    PENDING = "pending"
    TRANSCRIBING = "transcribing"
    TRANSCRIPTION_COMPLETED = "transcription_completed"
    SUMMARIZING = "summarizing"
    SUMMARIZATION_COMPLETED = "summarization_completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Prompt(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    category_id: int = Field(foreign_key="category.id")
    text: str 

    category: "Category" = Relationship(back_populates="prompts")

class Category(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    description: Optional[str] = Field(default=None)
    is_protected: bool = Field(default=False)
    
    jobs: List["Job"] = Relationship(back_populates="category", cascade_delete=True)
    prompts: List[Prompt] = Relationship(back_populates="category", cascade_delete=True)

class Job(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    category_id: int = Field(foreign_key="category.id")
    last_celery_id: Optional[str] = Field(default=None)
    url: Optional[str] = Field(default=None, index=True)
    youtube_id: Optional[str] = Field(default=None, nullable=True)
    youtube_title: Optional[str] = Field(default=None, nullable=True)
    youtube_thumbnail: Optional[str] = Field(default=None, nullable=True)
    
    prompt: Optional[str] = Field(default=None, nullable=True)
    transcript: Optional[str] = Field(default=None, nullable=True)
    summary: Optional[str] = Field(default=None, nullable=True)
    
    status: JobStatus = Field(default=JobStatus.PENDING)
    error_msg: Optional[str] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    category: Category = Relationship(back_populates="jobs")


postgresql_url = settings.DATABASE_URL
engine = create_engine(postgresql_url, echo=False)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def seed_db():
    with Session(engine) as db:
        general_category = db.exec(select(Category).where(Category.name == "General")).first()
        if not general_category:
            general_category = Category(
                name="General",
                description="Default category for uncategorized jobs.",
                is_protected=True
            )
            db.add(general_category)
            db.commit()
            db.refresh(general_category)

def get_db():
    with Session(engine) as db:
        yield db

if __name__ == "__main__":
    create_db_and_tables()
    seed_db()