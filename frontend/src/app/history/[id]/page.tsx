"use client";

import { useParams, useRouter } from "next/navigation";
import { useJobStatus, useCategories } from "@/hooks/useYouCube";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import { marked } from "marked";
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  AlertCircle,
  Loader2,
  Film,
  Tag,
  FileText,
  Sparkles,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { JobStatus } from "@/lib/types";
import { useState } from "react";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = parseInt(params.id as string);

  const { data: job, isLoading, error } = useJobStatus(jobId, 5000);
  const { data: categories } = useCategories();
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [transcriptCollapsed, setTranscriptCollapsed] = useState(false);

  const getCategoryName = (categoryId: number) => {
    return categories?.find((c) => c.id === categoryId)?.name || "Unknown";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isFullyCompleted = (status: string) => {
    return status === JobStatus.SUMMARIZATION_COMPLETED || status === JobStatus.TRANSCRIPTION_COMPLETED;
  };

  const isSummarizationCompleted = (status: string) => {
    return status === JobStatus.SUMMARIZATION_COMPLETED;
  };

  const handleCopyTranscript = async () => {
    if (!job?.transcript) return;
    
    // Check if navigator.clipboard is available (requires HTTPS or localhost)
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(job.transcript);
        setCopiedTranscript(true);
        setTimeout(() => setCopiedTranscript(false), 2000);
        return;
      } catch (err) {
        console.log("navigator.clipboard failed, trying fallback", err);
      }
    }
    
    // Fallback for browsers without clipboard API (non-HTTPS contexts)
    const textArea = document.createElement("textarea");
    textArea.value = job.transcript;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch (e) {
      console.error("Failed to copy transcript", e);
    }
    document.body.removeChild(textArea);
  };

  const handleCopySummary = async () => {
    if (!job?.summary) return;
    
    // Check if navigator.clipboard is available (requires HTTPS or localhost)
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(job.summary);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
        return;
      } catch (err) {
        console.log("navigator.clipboard failed, trying fallback", err);
      }
    }
    
    // Fallback for browsers without clipboard API (non-HTTPS contexts)
    const textArea = document.createElement("textarea");
    textArea.value = job.summary;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch (e) {
      console.error("Failed to copy summary", e);
    }
    document.body.removeChild(textArea);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground hover:underline transition-all"
        >
          <ArrowLeft className="w-4 h-4 hover:scale-110 transition-transform" />
          Back
        </button>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-medium text-red-900 dark:text-red-300 mb-2">Job Not Found</h2>
          <p className="text-red-700 dark:text-red-400">Unable to load job details. The job may have been deleted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/history")}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground hover:underline transition-all"
      >
        <ArrowLeft className="w-4 h-4 hover:scale-110 transition-transform" />
        Back to History
      </button>

      {/* Main Content */}
      <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
        {/* Header with Thumbnail */}
        <div className="bg-linear-to-r from-secondary to-card border-b p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {job.youtube_thumbnail ? (
              <img
                src={job.youtube_thumbnail}
                alt={job.youtube_title || "Video thumbnail"}
                className="w-full sm:w-64 h-36 object-cover rounded-lg shadow-sm shrink-0"
              />
            ) : (
              <div className="w-full sm:w-64 h-36 bg-secondary rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                <Film className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0 w-full">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2 wrap-break-word">
                {job.youtube_title || "Untitled Video"}
              </h1>
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  {getCategoryName(job.category_id || 0)}
                </span>
                <JobStatusBadge jobId={jobId} />
              </div>
              {job.url && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all hover:scale-105"
                >
                  <ExternalLink className="w-4 h-4 hover:scale-110 transition-transform" />
                  Watch on YouTube
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-6">
          {/* Prompt - Show for all jobs if available */}
          {job.prompt && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Prompt</h2>
              </div>
              <div className="bg-secondary border border-border rounded-lg p-4">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{job.prompt}</p>
              </div>
            </div>
          )}

          {/* Category Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Category</h2>
            </div>
            <div className="bg-secondary border border-border rounded-lg p-4">
              <p className="text-foreground font-medium">{getCategoryName(job.category_id || 0)}</p>
            </div>
          </div>

          {/* Transcript - Only show for fully completed jobs */}
          {job.transcript && isFullyCompleted(job.status) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Transcript</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTranscriptCollapsed(!transcriptCollapsed)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary text-foreground text-sm font-medium transition-all"
                  >
                    {transcriptCollapsed ? (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span className="hidden sm:inline">Expand</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span className="hidden sm:inline">Collapse</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCopyTranscript}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary text-foreground text-sm font-medium transition-all"
                  >
                    {copiedTranscript ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              {!transcriptCollapsed && (
                <div className="bg-secondary border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: marked.parse(job.transcript) as string }} />
                </div>
              )}
            </div>
          )}

          {/* Summary - Only show for fully completed jobs */}
          {job.summary && isFullyCompleted(job.status) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Summary</h2>
                </div>
                <button
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary text-foreground text-sm font-medium transition-all"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-secondary border border-border rounded-lg p-4 max-h-192 overflow-y-auto">
                <div
                  className="prose max-w-none leading-relaxed prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-h1:text-foreground prose-h2:text-foreground prose-h3:text-foreground prose-h4:text-foreground prose-h5:text-foreground prose-h6:text-foreground dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: marked.parse(job.summary) as string }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {job.error_msg && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-foreground">Error</h2>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-400">{job.error_msg}</p>
              </div>
            </div>
          )}

          {/* Status Info for non-fully-completed jobs */}
          {!isFullyCompleted(job.status) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-300">
                This job is still being processed or only partially completed. Please check back later for the full transcript and summary.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
