export enum JobStatus {
  PENDING = "pending",
  TRANSCRIBING = "transcribing",
  TRANSCRIPTION_COMPLETED = "transcription_completed",
  SUMMARIZING = "summarizing",
  SUMMARIZATION_COMPLETED = "summarization_completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_protected: boolean;
}

export interface Prompt {
  id: number;
  category_id: number;
  text: string;
}

export interface Job {
  id: number;
  category_id: number;
  url: string | null;
  youtube_id: string | null;
  youtube_title: string | null;
  youtube_thumbnail: string | null;
  prompt: string | null;
  transcript: string | null;
  summary: string | null;
  status: JobStatus;
  error_msg: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobStatusResponse {
  job_id: number;
  status: string;
  youtube_title: string | null;
  youtube_thumbnail: string | null;
  prompt: string | null;
  transcript: string | null;
  summary: string | null;
  category_id?: number;
  url?: string;
  error_msg?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaskResponse {
  job_id: number;
  status: string;
  message: string;
}

export interface APIPayload {
  url?: string;
  prompt?: string;
  category_id: number;
  prompt_id?: number;
}
