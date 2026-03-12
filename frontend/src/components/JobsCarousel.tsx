"use client";

import { useEffect, useState } from "react";
import { useJobs, useRetryJob } from "@/hooks/useYouCube";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import { Clock, ChevronLeft, ChevronRight, ExternalLink, FileText, RefreshCw, Tag } from "lucide-react";
import { JobStatus } from "@/lib/types";
import Link from "next/link";

interface Job {
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

interface JobsCarouselProps {
  categories: { id: number; name: string }[] | undefined;
}

export function JobsCarousel({ categories }: JobsCarouselProps) {
  const { data: jobs, isLoading } = useJobs(10, 0);
  const retryJob = useRetryJob();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(3);

  // Adjust visible cards based on screen size
  useEffect(() => {
    const updateVisibleCards = () => {
      if (window.innerWidth < 640) {
        setVisibleCards(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCards(2);
      } else {
        setVisibleCards(3);
      }
    };

    updateVisibleCards();
    window.addEventListener("resize", updateVisibleCards);
    return () => window.removeEventListener("resize", updateVisibleCards);
  }, []);

  const getCategoryName = (categoryId: number) => {
    return categories?.find((c) => c.id === categoryId)?.name || "Unknown";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isCompleted = (status: string) => {
    return status === JobStatus.SUMMARIZATION_COMPLETED || status === JobStatus.TRANSCRIPTION_COMPLETED;
  };

  const isFailedOrCancelled = (status: string) => {
    return status === JobStatus.FAILED || status === JobStatus.CANCELLED;
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

  const goToPrevious = () => {
    if (!jobs || jobs.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? Math.max(0, jobs.length - visibleCards) : prev - 1));
  };

  const goToNext = () => {
    if (!jobs || jobs.length === 0) return;
    setCurrentIndex((prev) => (prev >= jobs.length - visibleCards ? 0 : prev + 1));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading recent jobs...</div>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No recent jobs to display
      </div>
    );
  }

  const visibleJobs = jobs.slice(currentIndex, currentIndex + visibleCards);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < jobs.length - visibleCards;

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      <button
        onClick={goToPrevious}
        disabled={!canGoPrevious}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-24 z-10 p-2 rounded-full bg-card border border-border shadow-lg disabled:opacity-0 disabled:cursor-not-allowed hover:bg-slate-100 hover:scale-110 transition-all"
        aria-label="Previous jobs"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>

      <button
        onClick={goToNext}
        disabled={!canGoNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-24 z-10 p-2 rounded-full bg-card border border-border shadow-lg disabled:opacity-0 disabled:cursor-not-allowed hover:bg-slate-100 hover:scale-110 transition-all"
        aria-label="Next jobs"
      >
        <ChevronRight className="w-5 h-5 text-foreground" />
      </button>

      {/* Carousel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleJobs.map((job) => (
          <div
            key={job.id}
            className="bg-card rounded-lg shadow-sm border overflow-hidden hover:shadow-md hover-lift cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="relative group">
              {job.youtube_thumbnail ? (
                <img
                  src={job.youtube_thumbnail}
                  alt={job.youtube_title || "Video thumbnail"}
                  className="w-full h-60 object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-60 bg-slate-100 flex items-center justify-center">
                  <ExternalLink className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              
              {/* Status Badge Overlay */}
              <div className="absolute top-2 right-2">
                <JobStatusBadge jobId={job.id} compact />
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 space-y-3">
              {/* Title */}
              <h3 className="font-medium text-foreground line-clamp-2 min-h-10">
                {job.youtube_title || "Untitled Video"}
              </h3>

              {/* Metadata */}
              <div className="space-y-2">
                {/* Category */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 py-1 rounded-md text-xs font-medium text-foreground">
                    <Tag className="w-3 h-3" />
                    {getCategoryName(job.category_id)}
                  </span>
                </div>

                {/* Time */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDate(job.created_at)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                {job.url && (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-all hover:scale-105"
                  >
                    <ExternalLink className="w-3 h-3 hover:scale-110 transition-transform" />
                    Watch
                  </a>
                )}
                {isCompleted(job.status) && (
                  <Link
                    href={`/history/${job.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-100/80 text-foreground transition-all hover:scale-105"
                  >
                    <FileText className="w-3 h-3 hover:scale-110 transition-transform" />
                    Details
                  </Link>
                )}
                {isFailedOrCancelled(job.status) && (
                  <button
                    onClick={() => handleRetry(job.id)}
                    disabled={retryJob.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-all hover:scale-105 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${retryJob.isPending ? "animate-spin" : ""} hover:scale-110 transition-transform`} />
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {Array.from({ length: Math.max(1, jobs.length - visibleCards + 1) }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all hover:scale-125 ${
              idx === currentIndex ? "bg-red-600 w-6" : "bg-slate-100 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
