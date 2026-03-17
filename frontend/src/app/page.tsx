"use client";

import { useState } from "react";
import { useSubmitJob, useCategories, usePromptsByCategory, useJobs } from "@/hooks/useYouCube";
import { Send, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import { JobsCarousel } from "@/components/JobsCarousel";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);
  const [selectedPromptId, setSelectedPromptId] = useState<number | undefined>();
  const [customPrompt, setCustomPrompt] = useState("");
  const [processType, setProcessType] = useState<"transcript" | "summarize">("transcript");
  const [submittedJobId, setSubmittedJobId] = useState<number | null>(null);

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: prompts } = usePromptsByCategory(selectedCategoryId);
  const submitJob = useSubmitJob();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) return;

    try {
      const payload = {
        url,
        category_id: selectedCategoryId,
        prompt_id: selectedPromptId,
        prompt: customPrompt || undefined,
      };

      const result = await submitJob.mutateAsync(payload);
      setSubmittedJobId(result.job_id);
      setUrl("");
      setCustomPrompt("");
    } catch (error) {
      console.error("Failed to submit job:", error);
      alert("Failed to submit job. Please try again.");
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "") {
      setSelectedPromptId(undefined);
      setCustomPrompt("");
    } else {
      const promptId = parseInt(value);
      setSelectedPromptId(promptId);
      const prompt = prompts?.find((p) => p.id === promptId);
      if (prompt) {
        setCustomPrompt(prompt.text);
      }
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Transform YouTube Videos into Insights
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Paste any YouTube URL and get AI-powered transcriptions and summaries
        </p>
      </div>

      {/* Recent Job Status */}
      {submittedJobId && (
        <div className="bg-card rounded-lg shadow-sm border p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground mb-1">Latest Job Status</h3>
              <JobStatusBadge jobId={submittedJobId} />
            </div>
            <button
              onClick={() => setSubmittedJobId(null)}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-all shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-card rounded-lg shadow-sm border p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            YouTube URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={submitJob.isPending || categoriesLoading}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all disabled:opacity-50 text-sm sm:text-base"
          />
        </div>

        {/* Process Type Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Processing Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProcessType("transcript")}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                processType === "transcript"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-center">
                <div className="font-medium text-foreground text-sm sm:text-base">Transcript Only</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Get full transcription</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setProcessType("summarize")}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                processType === "summarize"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-center">
                <div className="font-medium text-foreground text-sm sm:text-base">Transcribe & Summarize</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Get summary with category</div>
              </div>
            </button>
          </div>
        </div>

        {categoriesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <div className="relative">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(parseInt(e.target.value));
                    setSelectedPromptId(undefined);
                    setCustomPrompt("");
                  }}
                  disabled={submitJob.isPending}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all disabled:opacity-50 appearance-none text-sm sm:text-base"
                >
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Prompt Selection (only for summarize mode) */}
            {processType === "summarize" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Prompt (optional)
                  </label>
                  <div className="relative">
                    <select
                      value={selectedPromptId || ""}
                      onChange={handlePromptChange}
                      disabled={submitJob.isPending}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all disabled:opacity-50 appearance-none text-sm sm:text-base"
                    >
                      <option value="">Select a prompt...</option>
                      {prompts?.map((prompt) => (
                        <option key={prompt.id} value={prompt.id}>
                          {prompt.text.substring(0, 50)}
                          {prompt.text.length > 50 ? "..." : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Custom Prompt Textarea */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Custom Prompt (editable)
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Enter or modify the prompt..."
                    rows={4}
                    disabled={submitJob.isPending}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all disabled:opacity-50 resize-none text-sm sm:text-base"
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Error Display */}
        {submitJob.error && (
          <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="text-sm">{submitJob.error.message}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!url.trim() || submitJob.isPending}
          className="w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {submitJob.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {processType === "transcript" ? "Transcribe Video" : "Transcribe & Summarize"}
            </>
          )}
        </button>
      </form>

      {/* Recent Jobs Carousel */}
      <div className="bg-card rounded-lg shadow-sm border p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Recent Jobs</h2>
        <JobsCarousel categories={categories} />
      </div>
    </div>
  );
}
