"use client";

import { useState } from "react";
import { useJobs, useDeleteJob, useCancelJob, useCategories, useRetryJob, useDeleteJobs, useJobsCount } from "@/hooks/useYouCube";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import {
  Trash2,
  Square,
  ExternalLink,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckSquare,
  Square as SquareIcon,
  Sparkles,
  Zap,
  Clock as ClockIcon,
  RefreshCwIcon
} from "lucide-react";
import { JobStatus } from "@/lib/types";
import Link from "next/link";

const PAGE_SIZE = 5;

export default function HistoryPage() {
  const [page, setPage] = useState(0);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());

  // Fetch one extra item to detect if there's more content
  const { data: jobs, isLoading, isFetching, refetch } = useJobs(PAGE_SIZE + 1, page * PAGE_SIZE);
  const { data: jobsCount } = useJobsCount();
  const { data: categories } = useCategories();
  const deleteJob = useDeleteJob();
  const deleteJobs = useDeleteJobs();
  const cancelJob = useCancelJob();
  const retryJob = useRetryJob();

  const totalJobs = jobsCount || 0;

  // Check if we have more pages (if we got PAGE_SIZE + 1 items, there's more)
  const hasMore = jobs && jobs.length > PAGE_SIZE;
  // Display only PAGE_SIZE items (hide the extra fetch item)
  const displayJobs = jobs && jobs.length > PAGE_SIZE ? jobs.slice(0, PAGE_SIZE) : jobs;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setExpandedJobId(null);
    setSelectedJobs(new Set());
    setBulkDeleteMode(false);
  };

  const toggleBulkDeleteMode = () => {
    setBulkDeleteMode(!bulkDeleteMode);
    setSelectedJobs(new Set());
  };

  const handleDelete = async (jobId: number) => {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    try {
      await deleteJob.mutateAsync(jobId);
    } catch (error) {
      console.error("Failed to delete job:", error);
      alert("Failed to delete job.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobs.size === 0) return;
    if (!confirm(`Delete ${selectedJobs.size} selected job(s)? This cannot be undone.`)) return;
    try {
      await deleteJobs.mutateAsync(Array.from(selectedJobs));
      setSelectedJobs(new Set());
    } catch (error) {
      console.error("Failed to delete jobs:", error);
      alert("Failed to delete jobs.");
    }
  };

  const toggleSelectJob = (jobId: number) => {
    setSelectedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedJobs.size === displayJobs?.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(displayJobs?.map((job) => job.id) || []));
    }
  };

  const handleCancel = async (jobId: number) => {
    if (!confirm("Cancel this job?")) return;
    try {
      await cancelJob.mutateAsync(jobId);
    } catch (error) {
      console.error("Failed to cancel job:", error);
      alert("Failed to cancel job.");
    }
  };

  const handleRetry = async (jobId: number) => {
    if (!confirm("Retry this job? This will resubmit the video for processing.")) return;
    try {
      await retryJob.mutateAsync(jobId);
      alert("Job restarted successfully!");
    } catch (error) {
      console.error("Failed to retry job:", error);
      alert("Failed to retry job.");
    }
  };

  const getCategoryName = (categoryId: number) => {
    return categories?.find((c) => c.id === categoryId)?.name || "Unknown";
  };

  const isCompleted = (status: string) => {
    return status === JobStatus.SUMMARIZATION_COMPLETED || status === JobStatus.TRANSCRIPTION_COMPLETED;
  };

  const isProcessing = (status: string) => {
    return [
      JobStatus.PENDING,
      JobStatus.TRANSCRIBING,
      JobStatus.SUMMARIZING,
    ].includes(status as JobStatus);
  };

  const isFailedOrCancelled = (status: string) => {
    return status === JobStatus.FAILED || status === JobStatus.CANCELLED;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}

        {/* Stats Banner */}
        {totalJobs > 0 && (
          <div className="relative mx-auto overflow-hidden rounded-xl sm:rounded-2xl p-0.5">
            <div className="absolute inset-0  opacity-50 blur-xl animate-pulse"></div>
            <div className="relative rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-center gap-2 mb-3">
              </div>
              <p className="text-lg sm:text-2xl font-semibold text-foreground mb-2 text-center">
                🎉 You&apos;ve transcribed and summarized{" "}
                <span className="text-xl sm:text-3xl bg-linear-to-r from-red-700 via-red-600 to-red-500 bg-clip-text text-transparent">
                  {totalJobs}
                </span>{" "}
                {totalJobs === 1 ? "video" : "videos"}!
              </p>
              <p className="text-sm sm:text-xl text-muted-foreground text-center">
                That&apos;s some serious time saved! Don&apos;t forget to read through your insights 📚
              </p>
            </div>
          </div>
        )}

      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">History</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">View all processed videos and their status</p>
          </div>
          {
            !bulkDeleteMode && (
              <>
                <button
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="shrink-0 p-2 inline-flex items-center justify-center rounded-lg text-foreground text-sm font-medium transition-all hover:scale-105 hover:bg-secondary disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${isFetching ? "animate-spin" : ""}`} /> 
                </button>
                <button
                  onClick={toggleBulkDeleteMode}
                  className="shrink-0 p-2 inline-flex items-center justify-center rounded-lg text-foreground text-sm font-medium transition-all hover:scale-105 hover:bg-secondary"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )
          }
        </div>
      </div>

      {/* Bulk Delete Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {bulkDeleteMode && (
            <>
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-red-600 transition-all"
              >
                {selectedJobs.size === displayJobs?.length ? (
                  <CheckSquare className="w-5 h-5 text-red-600" />
                ) : (
                  <SquareIcon className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">{selectedJobs.size === displayJobs?.length ? "Deselect all" : "Select all"}</span>
                <span className="sm:hidden">{selectedJobs.size === displayJobs?.length ? "Deselect all" : "Select all"}</span>
              </button>
              <span className="text-sm text-muted-foreground">|</span>
              <span className="text-sm text-muted-foreground">
                {selectedJobs.size} video{selectedJobs.size > 1 ? "s" : ""} selected
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {bulkDeleteMode && (
            <>
              <button
                onClick={toggleBulkDeleteMode}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-secondary hover:bg-muted-foreground/20 text-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
              >
                <span className="hidden sm:inline">Cancel</span>
                <span className="sm:hidden">✕</span>
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleteJobs.isPending || selectedJobs.size === 0}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete {selectedJobs.size > 0 ? `(${selectedJobs.size})` : ""}</span>
                <span className="sm:hidden">{selectedJobs.size > 0 ? `(${selectedJobs.size})` : ""}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : jobs?.length === 0 ? (
          <div className="bg-card rounded-lg shadow-sm border p-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No History Yet</h3>
            <p className="text-muted-foreground">
              Processed videos will appear here once you submit them for transcription
            </p>
          </div>
        ) : (
          <>
            {displayJobs?.map((job) => {
              const rowContent = (
                <div className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    {/* Checkbox - Only show in bulk delete mode */}
                    {bulkDeleteMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectJob(job.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="shrink-0 hover:scale-110 transition-transform"
                        title={selectedJobs.has(job.id) ? "Deselect" : "Select"}
                      >
                        {selectedJobs.has(job.id) ? (
                          <CheckSquare className="w-5 h-5 text-red-600" />
                        ) : (
                          <SquareIcon className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    )}

                    {/* Thumbnail */}
                    {job.youtube_thumbnail ? (
                      <img
                        src={job.youtube_thumbnail}
                        alt={job.youtube_title || "Video thumbnail"}
                        className="w-full sm:w-40 h-48 sm:h-24 object-cover rounded-lg shrink-0 hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full sm:w-40 h-48 sm:h-24 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                        <ExternalLink className="w-8 h-8 sm:w-8 sm:h-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground text-sm sm:text-base truncate">
                            {job.youtube_title || "Untitled Video"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(job.created_at)}
                            </span>
                            <span>•</span>
                            <span>{getCategoryName(job.category_id)}</span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <JobStatusBadge jobId={job.id} compact />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3">
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 hover:underline transition-all"
                          >
                            <ExternalLink className="w-3 h-3 hover:scale-110 transition-transform" />
                            Watch Video
                          </a>
                        )}
                        {isProcessing(job.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancel(job.id);
                            }}
                            disabled={cancelJob.isPending}
                            className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 disabled:opacity-50 hover:underline transition-all"
                          >
                            <Square className="w-3 h-3 hover:scale-110 transition-transform" />
                            Cancel
                          </button>
                        )}
                        {isFailedOrCancelled(job.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetry(job.id);
                            }}
                            disabled={retryJob.isPending}
                            className="inline-flex items-center gap-1 text-sm text-orange-400 hover:text-orange-500 disabled:opacity-50 hover:underline transition-all"
                          >
                            <RefreshCw className={`w-3 h-3 ${retryJob.isPending ? "animate-spin" : ""} hover:scale-110 transition-transform`} />
                            Retry
                          </button>
                        )}
                        {!bulkDeleteMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(job.id);
                            }}
                            disabled={deleteJob.isPending}
                            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 hover:underline transition-all sm:ml-auto"
                          >
                            <Trash2 className="w-3 h-3 hover:scale-110 transition-transform" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );

              return bulkDeleteMode ? (
                <div
                  key={job.id}
                  onClick={() => toggleSelectJob(job.id)}
                  className={`bg-card rounded-lg shadow-sm border overflow-hidden transition-colors cursor-pointer ${
                    selectedJobs.has(job.id)
                      ? "ring-2 ring-red-500 ring-offset-2"
                      : "hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {rowContent}
                </div>
              ) : (
                <Link
                  key={job.id}
                  href={`/history/${job.id}`}
                  className={`block bg-card rounded-lg shadow-sm border overflow-hidden transition-colors hover:border-gray-300 dark:hover:border-gray-600 ${
                    selectedJobs.has(job.id) ? "ring-2 ring-red-500 ring-offset-2" : ""
                  }`}
                >
                  {rowContent}
                </Link>
              );
            })}

            {/* Pagination Controls */}
            {displayJobs && displayJobs.length > 0 && (
              <div className="flex items-center justify-between pt-3 sm:pt-4">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Page {page + 1}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 0}
                    className="inline-flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!hasMore}
                    className="inline-flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
