from sqlmodel import select
from fastapi import HTTPException
from datetime import datetime, timezone
from clients import extract_youtube_id, get_youtube_thumbnail, get_youtube_title
from database import engine, Session, Category, Job, JobStatus, Prompt, TaskPayload, TaskStatusResponse

# --- READ OPERATIONS ---
def read_jobs(db: Session, limit: int, offset: int, order_by: str = "updated_at"):
    statement = select(Job).order_by(getattr(Job, order_by).desc()).limit(limit).offset(offset)
    return db.exec(statement).all()

def count_jobs(db: Session) -> int:
    return db.exec(select(Job)).all().__len__()

def count_jobs_by_category(category_id: int, db: Session) -> int:
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return db.exec(select(Job).where(Job.category_id == category_id)).all().__len__()

def read_categories(db: Session):
    return db.exec(select(Category)).all()

def read_status(job_id: int, db: Session) -> TaskStatusResponse:
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return TaskStatusResponse(
        job_id=job.id,
        status=job.status,
        youtube_title=job.youtube_title,
        youtube_thumbnail=job.youtube_thumbnail,
        prompt=job.prompt,
        transcript=job.transcript,
        summary=job.summary,
        category_id=job.category_id,
        url=job.url,
        error_msg=job.error_msg,
        created_at=job.created_at.isoformat() if job.created_at else None,
        updated_at=job.updated_at.isoformat() if job.updated_at else None,
    )

def read_jobs_by_category(category_id: int, db: Session, limit: int, offset: int, order_by: str = "updated_at"):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    statement = select(Job).where(Job.category_id == category_id).order_by(getattr(Job, order_by).desc()).limit(limit).offset(offset)
    return db.exec(statement).all()

def read_prompts_by_category(category_id: int, db: Session):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return db.exec(select(Prompt).where(Prompt.category_id == category_id)).all()

# --- CREATE OPERATIONS ---
def create_category(name: str, description: str = None, db: Session = None):
    existing = db.exec(select(Category).where(Category.name == name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    category = Category(name=name, description=description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

def create_prompt(category_id: int, text: str, db: Session):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    existing = db.exec(select(Prompt).where(Prompt.text == text)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Prompt with this text already exists")
    prompt = Prompt(category_id=category_id, text=text)
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt

def create_new_job(url: str, category_id: int, prompt_text: str = None, prompt_id: int = None, db: Session = None) -> TaskPayload:
    category = db.get(Category, category_id)

    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    youtube_id = extract_youtube_id(url)
    youtube_title = get_youtube_title(youtube_id)
    youtube_thumbnail = get_youtube_thumbnail(youtube_id)

    if not category:
        raise HTTPException(status_code=404, detail="Category not found. Create the category first or use category_id=1 for General.")
    
    if prompt_text:
        final_prompt = prompt_text
    else:
        prompt = db.get(Prompt, prompt_id)
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt not found")
        final_prompt = prompt.text

    new_job = Job(url=url, youtube_id=youtube_id, youtube_title=youtube_title, youtube_thumbnail=youtube_thumbnail, category_id=category.id, prompt=final_prompt, status=JobStatus.PENDING)
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return TaskPayload(prompt=new_job.prompt, category_id=new_job.category_id, db_id=new_job.id, youtube_id=youtube_id)

# --- UPDATE OPERATIONS ---
def update_category(category_id: int, name: str = None, description: str = None, db: Session = None):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if category.is_protected:
        raise HTTPException(status_code=400, detail="Cannot edit system-protected category")
    
    if name: 
        category.name = name
    if description:
        category.description = description
    db.commit()
    db.refresh(category)
    return category

def update_prompt(prompt_id: int, text: str, db: Session):
    prompt = db.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    prompt.text = text
    db.commit()
    db.refresh(prompt)
    return prompt

def update_existing_job(job_id: int, last_celery_id: str = None, transcript: str = None, summary: str = None, status: JobStatus = None) -> bool:
    """Used primarily by Celery Workers"""
    with Session(engine) as db:
        job = db.get(Job, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        if last_celery_id:
            job.last_celery_id = last_celery_id
        if transcript:
            job.transcript = transcript
        if summary:
            job.summary = summary
        if status:
            job.status = status
        db.commit()
        return True

def retry_job(job_id: int, db: Session) -> TaskPayload:
    
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status not in [JobStatus.FAILED, JobStatus.CANCELLED]:
        raise HTTPException(
            status_code=400, 
            detail=f"Job cannot be retried. Current status: {job.status}. Only failed or cancelled jobs can be retried."
        )
    
    job.status = JobStatus.PENDING
    job.error_msg = None
    job.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(job)
    
    return TaskPayload(
        prompt=job.prompt,
        category_id=job.category_id,
        db_id=job.id,
        youtube_id=job.youtube_id
    )


# --- DELETE / FAIL OPERATIONS ---
def delete_category(category_id: int, db: Session):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if category.is_protected:
        raise HTTPException(status_code=400, detail="Cannot delete system-protected category")
    db.delete(category)
    db.commit()
    return True

def delete_prompt(prompt_id: int, db: Session):
    prompt = db.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    db.delete(prompt)
    db.commit()
    return True

def fail_existing_job(job_id: int, error_msg: str) -> bool:
    """Used by Celery Workers on exception. Celery cannot call FastAPI dependency-injected functions, so we directly interact with the database here."""
    with Session(engine) as db:
        job = db.get(Job, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        job.status = JobStatus.FAILED
        job.error_msg = error_msg
        db.commit()
        return True

def cancel_existing_job(job_id: int, db: Session) -> str:
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = JobStatus.CANCELLED
    db.commit()
    return job.last_celery_id

def delete_job(job_id: int, db: Session) -> bool:
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return True

def delete_jobs(job_ids: list[int], db: Session) -> int:
    """Delete multiple jobs by their IDs. Returns the count of deleted jobs."""
    jobs = db.exec(select(Job).where(Job.id.in_(job_ids))).all()
    deleted_count = 0
    for job in jobs:
        db.delete(job)
        deleted_count += 1
    db.commit()
    return deleted_count