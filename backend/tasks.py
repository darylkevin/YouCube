from typing import Dict
from config import settings
from celery import Celery, chain
from database import TaskPayload, JobStatus
from celery.utils.log import get_task_logger
from utils import update_existing_job, fail_existing_job
from clients import fetch_youtube_transcript, fetch_summary_openrouter

logger = get_task_logger(__name__)

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True
)

@celery_app.task(name="tasks.task_a1_transcribe", bind=True, track_started=True)
def task_a1_youtube_transcript(
    self,
    payload: Dict,
) -> Dict:
    db_id = payload.get("db_id")
    prompt = payload.get("prompt")
    youtube_id = payload.get("youtube_id")

    try:
        update_existing_job(
            job_id=db_id,
            last_celery_id=self.request.id,
            status=JobStatus.TRANSCRIBING,
        )
        
        transcript = fetch_youtube_transcript(youtube_id)

        result = {
            "db_id": db_id,
            "prompt": prompt,
            "transcript": transcript
        }
        
        update_existing_job(
            job_id=db_id,
            transcript=result["transcript"],
            status=JobStatus.TRANSCRIPTION_COMPLETED,
        )

        return result
    
    except Exception as exc:
        fail_existing_job(job_id=db_id, error_msg=str(exc))
        logger.error(f"A1 Failed: {exc}")
        raise exc

@celery_app.task(name="tasks.task_b1_summarize", bind=True, track_started=True)
def task_b1_local_ai_summarization(
    self,
    payload: Dict,
) -> Dict:
    db_id = payload.get("db_id")
    prompt = payload.get("prompt")
    transcript = payload.get("transcript")

    try:
        update_existing_job(
            job_id=db_id,
            last_celery_id=self.request.id,
            status=JobStatus.SUMMARIZING,
        )

        summary = fetch_summary_openrouter(prompt, transcript)

        update_existing_job(
            job_id=db_id,
            summary=summary,
            status=JobStatus.SUMMARIZATION_COMPLETED,
        )

        return {"db_id": db_id, "summary": summary}
    
    except Exception as exc:
        fail_existing_job(job_id=db_id, error_msg=str(exc))
        logger.error(f"B1 Failed: {exc}")
        raise exc

def job_transcribe(
    task_payload: TaskPayload,
):
    return task_a1_youtube_transcript.apply_async(
        args=[task_payload.model_dump()],
    )

def job_transcribe_summarize(
    task_payload: TaskPayload,
):
    workflow = chain(
        task_a1_youtube_transcript.s(task_payload.model_dump()),
        task_b1_local_ai_summarization.s(),
    )
    return workflow.apply_async()