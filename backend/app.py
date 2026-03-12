import utils
import uvicorn

from config import settings
from sqlmodel import Session
from fastapi import FastAPI, Depends, Body
from celery.result import AsyncResult
from fastapi.middleware.cors import CORSMiddleware
from database import APIPayload, TaskResponse, get_db
from tasks import celery_app, job_transcribe, job_transcribe_summarize

app = FastAPI(
    title="YouCube API",
    version="1.0.0",
    contact={
        "name": "Daryl Kevin",
        "url": "https://personal-portfolio-two-eight.vercel.app/",
        "email": "dkevin77@connect.hku.hk"
    },
    summary="Transcribe and summarize videos from Youtube. View /api/docs for usage details."
)

origins = [
    settings.CORS_ORIGIN_1,
    settings.CORS_ORIGIN_2,
    settings.CORS_ORIGIN_3,
    settings.CORS_ORIGIN_4,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


RELOAD = settings.ENV == "dev"

@app.get("/", tags=["Health"])
def get_root():
    return {"message": "YouCube API v1.0.0. View /api/docs for usage details."}

# --- JOB ENDPOINTS ---
@app.get("/api/v1/jobs/count", tags=["Jobs"])
def get_jobs_count(
    db: Session = Depends(get_db),
):
    return utils.count_jobs(db)

@app.get("/api/v1/jobs/{job_id}", tags=["Jobs"])
def get_job_status(
    job_id: int,
    db: Session = Depends(get_db),
):
    return utils.read_status(job_id, db)

@app.get("/api/v1/jobs", tags=["Jobs"])
def get_jobs(
    limit: int = 5,
    offset: int = 0,
    order_by: str = "updated_at",
    db: Session = Depends(get_db),
):
    return utils.read_jobs(db, limit=limit, offset=offset, order_by=order_by)

@app.get("/api/v1/jobs/{category_id}/count", tags=["Jobs"])
def get_jobs_count_by_category(
    category_id: int,
    db: Session = Depends(get_db),
):
    return utils.count_jobs_by_category(category_id, db)

@app.get("/api/v1/categories/{category_id}/jobs", tags=["Jobs"])
def get_jobs_by_category(
    category_id: int,
    limit: int = 5,
    offset: int = 0,
    order_by: str = "updated_at",
    db: Session = Depends(get_db),
):
    return utils.read_jobs_by_category(category_id, db, limit=limit, offset=offset, order_by=order_by)

@app.post("/api/v1/jobs/transcribe-summarize", response_model=TaskResponse, tags=["Jobs"])
def post_job_transcribe_summarize(
    payload: APIPayload,
    db: Session = Depends(get_db),
):
    if not payload.prompt and not payload.prompt_id:
        task_payload = utils.create_new_job(
            url=payload.url,
            prompt_text="NA",
            category_id=payload.category_id,
            prompt_id=payload.prompt_id,
            db=db,
        )
        task = job_transcribe(task_payload)
    else:
        task_payload = utils.create_new_job(
            url=payload.url,
            prompt_text=payload.prompt,
            category_id=payload.category_id,
            prompt_id=payload.prompt_id,
            db=db,
        )
        task = job_transcribe_summarize(task_payload)

    return TaskResponse(job_id=task_payload.db_id, status=task.state, message="Workflow Started")


@app.post("/api/v1/jobs/{job_id}/retry", response_model=TaskResponse, tags=["Jobs"])
def post_retry_job(
    job_id: int,
    db: Session = Depends(get_db),
):
    task_payload = utils.retry_job(job_id, db)
    
    if not task_payload.prompt or task_payload.prompt == "NA":
        task = job_transcribe(task_payload)
    else:
        task = job_transcribe_summarize(task_payload)
    
    return TaskResponse(job_id=task_payload.db_id, status=task.state, message="Job retry initiated")

@app.post("/api/v1/jobs/{job_id}/cancel", tags=["Jobs"])
def post_cancel_job(
    job_id: int,
    db: Session = Depends(get_db),
):
    celery_id = utils.cancel_existing_job(job_id, db=db)
    task_result = AsyncResult(celery_id, app=celery_app)
    
    if task_result.state in ["SUCCESS", "FAILURE", "REVOKED"]:
        return {"message": f"Job {job_id} cannot be cancelled. Current status: {task_result.state}"}
    
    task_result.revoke(terminate=True)
    return {"message": f"Job {job_id} cancellation requested."}

@app.delete("/api/v1/jobs/{job_id}", tags=["Jobs"])
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
):
    utils.delete_job(job_id, db)
    return {"message": f"Job {job_id} deleted."}

@app.delete("/api/v1/jobs", tags=["Jobs"])
def delete_jobs(
    job_ids: list[int] = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    deleted_count = utils.delete_jobs(job_ids, db)
    return {"message": f"{deleted_count} job(s) deleted."}

# --- CATEGORY & PROMPT ENDPOINTS ---
@app.get("/api/v1/categories", tags=["Operational"])
def get_categories(
    db: Session = Depends(get_db),
):
    return utils.read_categories(db)

@app.get("/api/v1/categories/{category_id}/prompts", tags=["Operational"])
def get_prompts_by_category(
    category_id: int,
    db: Session = Depends(get_db),
):
    return utils.read_prompts_by_category(category_id, db)

@app.post("/api/v1/categories", tags=["Operational"])
def create_category(
    name: str,
    description: str = None,
    db: Session = Depends(get_db),
):
    return utils.create_category(name, description, db)

@app.post("/api/v1/categories/{category_id}/prompts", tags=["Operational"])
def create_prompt(
    category_id: int,
    text: str,
    db: Session = Depends(get_db),
):
    return utils.create_prompt(category_id, text, db)

@app.put("/api/v1/categories/{category_id}", tags=["Operational"])
def update_category(
    category_id: int,
    name: str = None,
    description: str = None,
    db: Session = Depends(get_db),
):
    return utils.update_category(category_id, name, description, db)

@app.put("/api/v1/prompts/{prompt_id}", tags=["Operational"])
def update_prompt(
    prompt_id: int,
    text: str,
    db: Session = Depends(get_db),
):
    return utils.update_prompt(prompt_id, text, db)

@app.delete("/api/v1/categories/{category_id}", tags=["Operational"])
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
):
    utils.delete_category(category_id, db)
    return {"message": "Category and related items deleted."}

@app.delete("/api/v1/prompts/{prompt_id}", tags=["Operational"])
def delete_prompt(
    prompt_id: int,
    db: Session = Depends(get_db),
):
    utils.delete_prompt(prompt_id, db)
    return {"message": "Prompt deleted."}

if __name__ == "__main__":
    uvicorn.run("app:app", host=settings.API_HOST, port=settings.API_PORT, reload=RELOAD)