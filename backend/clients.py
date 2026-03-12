import re
import requests

from typing import Optional
from config import settings
from fastapi import HTTPException
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
from youtube_transcript_api import YouTubeTranscriptApi


# --- Best Practice: Configured Session ---
def get_http_session() -> requests.Session:
    """Creates a requests.Session with connection pooling and automatic retries."""
    session = requests.Session()
    
    retries = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    return session

http_session = get_http_session()

# --- YouTube Helpers ---
def extract_youtube_id(url: str) -> Optional[str]:
    """Extracts the video ID from standard YouTube and youtu.be URLs."""
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
    if match:
        return match.group(1)
    
    raise HTTPException(status_code=400, detail="Invalid YouTube URL")


def get_youtube_title(video_id: str) -> str:
    """Fetches the title of a YouTube video."""
    try:
        url = f"https://www.youtube.com/oembed?url=youtube.com/watch?v={video_id}&format=json"
        response = http_session.get(url)
        response.raise_for_status()
        data = response.json()
        return data.get("title", "Unknown Title")

    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code

        if status_code == 404:
            detail = f"YouTube video with ID '{video_id}' not found."
        else:
            detail = e.response.text or "Failed to fetch YouTube title due to a client/server error."
            
        raise HTTPException(status_code=status_code, detail=detail)

    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail="Network error while contacting YouTube.")


def get_youtube_thumbnail(video_id: str) -> str:
    """YouTube thumbnails have a predictable URL structure."""
    return f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"


# --- YoutubeTranscriptAPI Client ---
def fetch_youtube_transcript(video_id: str) -> str:
    """Fetches Transcript via youtube-transcript-api."""
    try:
        api = YouTubeTranscriptApi()

        transcript = ""
        transcript_data = api.fetch(
            video_id=video_id,
            languages=['id', 'en']
        )

        for snippet in transcript_data.snippets:
            transcript += snippet.text.strip() + " "

        return transcript

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching transcript: {str(e)}")


# --- OpenRouter Client ---
def fetch_summary_openrouter(prompt: str, transcript: str) -> str:
    """Calls OpenRouter API for summarization."""

    if transcript == "":
        raise HTTPException(status_code=400, detail="No transcripts provided. Cannot summarize.")

    model_attempts = [settings.OPENROUTER_FREE_MODEL1, settings.OPENROUTER_FREE_MODEL2, settings.OPENROUTER_FREE_MODEL3]

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.OPENROUTER_KEY}",
    }

    payload = {
        "messages": [
            {
                "role": "user",
                "content":  f"""
                    You are an expert analyst and professional writer, tasked with creating a clear and insightful summary based on a user's request and a provided transcript. Your response must be meticulously structured in Markdown.
                    ---
                    ### **1. User's Core Request**
                    
                    {prompt}
                    ---
                    ### **2. Formatting and Style Mandates**

                    You must adhere to the following rules without exception:
                    *   **Language:** The entire response must be in English.
                    *   **Main Title:** Start with a single, compelling main title using H1 Markdown (`#`).
                    *   **Subheadings:** Structure the body of the response under exactly three (3) descriptive subheadings using H2 Markdown (`##`).
                    *   **Emphasis:** Identify and highlight all **key terminology**, **concepts**, and **proper nouns** by making them **bold**. This is crucial for reader comprehension.
                    *   **Lists:** When presenting advantages, disadvantages, features, or sequential points, use bulleted lists (`-`). This is required for any "pros and cons" sections.
                    *   **Tone:** Maintain a professional, objective, and informative tone.
                    *   **Markdown Purity:** Generate clean, standard Markdown. Do not use HTML tags or any non-standard syntax.
                    ---
                    ### **3. Source Material**
                    Analyze the following transcript to extract the necessary information to fulfill the user's request.

                    **BEGIN VIDEO TRANSCRIPT:**
                    {transcript}
                    **END VIDEO TRANSCRIPT:**

                    ---
                    Proceed with generating the response, ensuring every mandate is met.
                """,
            }
        ],
        "reasoning": {
            "enabled": True
        }
    }
    
    for model in model_attempts:
        try:
            payload["model"] = model

            # ALWAYS use timeouts in Celery, otherwise a hanging request freezes the worker
            response = http_session.post(settings.OPENROUTER_URL, json=payload, headers=headers, timeout=60)
            response.raise_for_status()
            choices = response.json().get("choices", [])

            return choices[0].get("message", {}).get("content", "")
        except requests.RequestException:
            continue
    
    raise HTTPException(status_code=500, detail="Failed to fetch summary from OpenRouter after multiple attempts.")