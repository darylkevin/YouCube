"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { Category, Prompt, Job, JobStatusResponse } from "@/lib/types";

// Query keys
export const queryKeys = {
  jobs: {
    all: ["jobs"] as const,
    lists: () => [...queryKeys.jobs.all, "list"] as const,
    list: (filters: { limit: number; offset: number }) =>
      [...queryKeys.jobs.lists(), filters] as const,
    details: () => [...queryKeys.jobs.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.jobs.details(), id] as const,
  },
  categories: {
    all: ["categories"] as const,
    lists: () => [...queryKeys.categories.all, "list"] as const,
    list: () => [...queryKeys.categories.lists()] as const,
    prompts: (categoryId: number) => [...queryKeys.categories.all, categoryId, "prompts"] as const,
  },
};

// Jobs hooks
export function useJobs(limit: number = 5, offset: number = 0) {
  return useQuery<Job[], Error>({
    queryKey: queryKeys.jobs.list({ limit, offset }),
    queryFn: () => api.getJobs(limit, offset),
  });
}

export function useJobsCount() {
  return useQuery<number, Error>({
    queryKey: ["jobsCount"],
    queryFn: () => api.getJobsCount(),
  });
}

export function useJobStatus(jobId: number, refetchInterval: number = 5000) {
  return useQuery<JobStatusResponse, Error>({
    queryKey: queryKeys.jobs.detail(jobId),
    queryFn: () => api.getJobStatus(jobId),
    refetchInterval,
    enabled: !!jobId,
  });
}

export function useSubmitJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.submitJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.cancelJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}

export function useDeleteJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteJobs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}

export function useRetryJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.retryJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}

// Categories hooks
export function useCategories() {
  return useQuery<Category[], Error>({
    queryKey: queryKeys.categories.list(),
    queryFn: api.getCategories,
  });
}

export function useJobsByCategory(categoryId: number, limit: number = 10, offset: number = 0) {
  return useQuery<Job[], Error>({
    queryKey: [...queryKeys.categories.all, categoryId, "jobs", limit, offset] as const,
    queryFn: () => api.getJobsByCategory(categoryId, limit, offset),
    enabled: !!categoryId,
  });
}

export function useJobsCountByCategory(categoryId: number) {
  return useQuery<number, Error>({
    queryKey: ["jobsCountByCategory", categoryId] as const,
    queryFn: () => api.getJobsCountByCategory(categoryId),
    enabled: !!categoryId,
  });
}

export function usePromptsByCategory(categoryId: number) {
  return useQuery<Prompt[], Error>({
    queryKey: queryKeys.categories.prompts(categoryId),
    queryFn: () => api.getPromptsByCategory(categoryId),
    enabled: !!categoryId,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      api.createCategory(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, text }: { categoryId: number; text: string }) =>
      api.createPrompt(categoryId, text),
    onSuccess: (_, { categoryId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.prompts(categoryId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      name,
      description,
    }: {
      categoryId: number;
      name?: string;
      description?: string;
    }) => api.updateCategory(categoryId, name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ promptId, text }: { promptId: number; text: string }) =>
      api.updatePrompt(promptId, text),
    onSuccess: (_, { promptId }) => {
      // Invalidate all category prompts since we don't know which category it belongs to
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deletePrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
