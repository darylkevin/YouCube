import { APIPayload, Category, Job, JobStatusResponse, Prompt, TaskResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

// Jobs API
export async function getJobStatus(jobId: number): Promise<JobStatusResponse> {
  const response = await fetch(`/api/v1/jobs/${jobId}`);
  return handleResponse<JobStatusResponse>(response);
}

export async function getJobs(limit: number = 5, offset: number = 0, orderBy: string = "updated_at"): Promise<Job[]> {
  const response = await fetch(`/api/v1/jobs?limit=${limit}&offset=${offset}&order_by=${orderBy}`);
  return handleResponse<Job[]>(response);
}

export async function getJobsCount(): Promise<number> {
  const response = await fetch(`/api/v1/jobs/count`);
  return handleResponse<number>(response);
}

export async function getJobsByCategory(categoryId: number, limit: number = 10, offset: number = 0, orderBy: string = "updated_at"): Promise<Job[]> {
  const response = await fetch(`/api/v1/categories/${categoryId}/jobs?limit=${limit}&offset=${offset}&order_by=${orderBy}`);
  return handleResponse<Job[]>(response);
}

export async function getJobsCountByCategory(categoryId: number): Promise<number> {
  const response = await fetch(`/api/v1/jobs/${categoryId}/count`);
  return handleResponse<number>(response);
}

export async function submitJob(payload: APIPayload): Promise<TaskResponse> {
  const response = await fetch(`/api/v1/jobs/transcribe-summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<TaskResponse>(response);
}

export async function cancelJob(jobId: number): Promise<{ message: string }> {
  const response = await fetch(`/api/v1/jobs/${jobId}/cancel`, {
    method: "POST",
  });
  return handleResponse<{ message: string }>(response);
}

export async function deleteJob(jobId: number): Promise<{ message: string }> {
  const response = await fetch(`/api/v1/jobs/${jobId}`, {
    method: "DELETE",
  });
  return handleResponse<{ message: string }>(response);
}

export async function deleteJobs(jobIds: number[]): Promise<{ message: string }> {
  const response = await fetch(`/api/v1/jobs`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_ids: jobIds }),
  });
  return handleResponse<{ message: string }>(response);
}

export async function retryJob(jobId: number): Promise<TaskResponse> {
  const response = await fetch(`/api/v1/jobs/${jobId}/retry`, {
    method: "POST",
  });
  return handleResponse<TaskResponse>(response);
}

// Categories API
export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`/api/v1/categories`);
  return handleResponse<Category[]>(response);
}

export async function getPromptsByCategory(categoryId: number): Promise<Prompt[]> {
  const response = await fetch(`/api/v1/categories/${categoryId}/prompts`);
  return handleResponse<Prompt[]>(response);
}

export async function createCategory(name: string, description?: string): Promise<Category> {
  const params = new URLSearchParams({ name });
  if (description) params.append("description", description);
  const response = await fetch(`/api/v1/categories?${params}`, {
    method: "POST",
  });
  return handleResponse<Category>(response);
}

export async function createPrompt(categoryId: number, text: string): Promise<Prompt> {
  const params = new URLSearchParams({ text });
  const response = await fetch(`/api/v1/categories/${categoryId}/prompts?${params}`, {
    method: "POST",
  });
  return handleResponse<Prompt>(response);
}

export async function updateCategory(
  categoryId: number,
  name?: string,
  description?: string
): Promise<Category> {
  const params = new URLSearchParams();
  if (name) params.append("name", name);
  if (description) params.append("description", description);
  const response = await fetch(`/api/v1/categories/${categoryId}?${params}`, {
    method: "PUT",
  });
  return handleResponse<Category>(response);
}

export async function updatePrompt(promptId: number, text: string): Promise<Prompt> {
  const params = new URLSearchParams({ text });
  const response = await fetch(`/api/v1/prompts/${promptId}?${params}`, {
    method: "PUT",
  });
  return handleResponse<Prompt>(response);
}

export async function deleteCategory(categoryId: number): Promise<{ message: string }> {
  const response = await fetch(`/api/v1/categories/${categoryId}`, {
    method: "DELETE",
  });
  return handleResponse<{ message: string }>(response);
}

export async function deletePrompt(promptId: number): Promise<{ message: string }> {
  const response = await fetch(`/api/v1/prompts/${promptId}`, {
    method: "DELETE",
  });
  return handleResponse<{ message: string }>(response);
}
