"use client";

import { useJobStatus } from "@/hooks/useYouCube";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface JobStatusBadgeProps {
  jobId: number;
  compact?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    color: "bg-gray-700 text-white border-gray-800 dark:bg-gray-600 dark:border-gray-700",
    icon: <AlertCircle className="w-3 h-3" />,
  },
  transcribing: {
    label: "Transcribing",
    color: "bg-blue-700 text-white border-blue-800 dark:bg-blue-600 dark:border-blue-700",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  transcription_completed: {
    label: "Transcription Done",
    color: "bg-green-700 text-white border-green-800 dark:bg-green-600 dark:border-green-700",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  summarizing: {
    label: "Summarizing",
    color: "bg-purple-700 text-white border-purple-800 dark:bg-purple-600 dark:border-purple-700",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  summarization_completed: {
    label: "Completed",
    color: "bg-green-700 text-white border-green-800 dark:bg-green-600 dark:border-green-700",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  failed: {
    label: "Failed",
    color: "bg-red-700 text-white border-red-800 dark:bg-red-600 dark:border-red-700",
    icon: <XCircle className="w-3 h-3" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-700 text-white border-gray-800 dark:bg-gray-600 dark:border-gray-700",
    icon: <XCircle className="w-3 h-3" />,
  },
};

export function JobStatusBadge({ jobId, compact = false }: JobStatusBadgeProps) {
  const { data, isLoading, error } = useJobStatus(jobId, 5000);

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-700 text-white border border-gray-800 dark:bg-slate-100 dark:text-foreground dark:border-border">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading...
      </span>
    );
  }

  if (error || !data) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-700 text-white border border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
        <XCircle className="w-3 h-3" />
        Error
      </span>
    );
  }

  const config = statusConfig[data.status] || statusConfig.pending;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border w-fit ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
    </div>
  );
}

export function getStatusColor(status: string): string {
  const config = statusConfig[status] || statusConfig.pending;
  return config.color;
}
