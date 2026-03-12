"use client";

import { useState } from "react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreatePrompt,
  useUpdatePrompt,
  useDeletePrompt,
  usePromptsByCategory,
  useJobsByCategory,
  useJobsCountByCategory,
} from "@/hooks/useYouCube";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  FolderOpen,
  Shield,
  ExternalLink,
  Clock,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import { JobStatus } from "@/lib/types";
import Link from "next/link";

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(1);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<number | null>(null);

  // Category form state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryDesc, setEditCategoryDesc] = useState("");

  // Prompt form state
  const [newPromptText, setNewPromptText] = useState("");
  const [editPromptText, setEditPromptText] = useState("");

  // Mutations
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt();
  const deletePrompt = useDeletePrompt();

  const [categoryJobsPage, setCategoryJobsPage] = useState(0);
  const CATEGORY_JOBS_PAGE_SIZE = 5;

  const { data: prompts } = usePromptsByCategory(selectedCategoryId || 0);
  // Fetch one extra item to detect if there's more content
  const { data: categoryJobs, isLoading: jobsLoading } = useJobsByCategory(
    selectedCategoryId || 0,
    CATEGORY_JOBS_PAGE_SIZE + 1,
    categoryJobsPage * CATEGORY_JOBS_PAGE_SIZE
  );
  // Get total count of jobs in this category
  const { data: totalJobsCount } = useJobsCountByCategory(selectedCategoryId || 0);

  // Check if we have more pages
  const hasMoreCategoryJobs = categoryJobs && categoryJobs.length > CATEGORY_JOBS_PAGE_SIZE;
  // Display only PAGE_SIZE items
  const displayCategoryJobs =
    categoryJobs && categoryJobs.length > CATEGORY_JOBS_PAGE_SIZE
      ? categoryJobs.slice(0, CATEGORY_JOBS_PAGE_SIZE)
      : categoryJobs;

  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await createCategory.mutateAsync({
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim() || undefined,
      });
      setNewCategoryName("");
      setNewCategoryDesc("");
    } catch (error) {
      console.error("Failed to create category:", error);
      alert("Failed to create category. Name might already exist.");
    }
  };

  const handleUpdateCategory = async (categoryId: number) => {
    try {
      await updateCategory.mutateAsync({
        categoryId,
        name: editCategoryName.trim() || undefined,
        description: editCategoryDesc.trim() || undefined,
      });
      setEditingCategory(null);
    } catch (error) {
      console.error("Failed to update category:", error);
      alert("Failed to update category.");
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm("WARNING: Deleting a category will remove all associated videos and prompts. This cannot be undone. Continue?")) return;

    try {
      await deleteCategory.mutateAsync(categoryId);
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(null);
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Failed to delete category. It might be a protected category.");
    }
  };

  const handleStartEditCategory = (category: { id: number; name: string; description: string | null }) => {
    setEditingCategory(category.id);
    setEditCategoryName(category.name);
    setEditCategoryDesc(category.description || "");
  };

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptText.trim() || !selectedCategoryId) return;

    try {
      await createPrompt.mutateAsync({
        categoryId: selectedCategoryId,
        text: newPromptText.trim(),
      });
      setNewPromptText("");
    } catch (error) {
      console.error("Failed to create prompt:", error);
      alert("Failed to create prompt. Text might already exist.");
    }
  };

  const handleUpdatePrompt = async (promptId: number) => {
    try {
      await updatePrompt.mutateAsync({
        promptId,
        text: editPromptText.trim(),
      });
      setEditingPrompt(null);
    } catch (error) {
      console.error("Failed to update prompt:", error);
      alert("Failed to update prompt.");
    }
  };

  const handleDeletePrompt = async (promptId: number) => {
    if (!confirm("Delete this prompt? This cannot be undone.")) return;

    try {
      await deletePrompt.mutateAsync(promptId);
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      alert("Failed to delete prompt.");
    }
  };

  const handleStartEditPrompt = (prompt: { id: number; text: string }) => {
    setEditingPrompt(prompt.id);
    setEditPromptText(prompt.text);
  };

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setCategoryJobsPage(0);
  };

  const handleCategoryJobsPageChange = (newPage: number) => {
    setCategoryJobsPage(newPage);
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

  const isCompleted = (status: string) => {
    return status === JobStatus.SUMMARIZATION_COMPLETED || status === JobStatus.TRANSCRIPTION_COMPLETED;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Categories & Prompts</h1>
        <p className="text-muted-foreground mt-1">Manage your categories and custom prompts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Create Category Form */}
          <div className="bg-card rounded-lg shadow-sm border p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Category
            </h2>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
              <input
                type="text"
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
              <button
                type="submit"
                disabled={!newCategoryName.trim() || createCategory.isPending}
                className="w-full py-2 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {createCategory.isPending ? (
                  <>
                    <Plus className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Category
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Categories */}
          <div className="bg-card rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h2 className="text-sm font-semibold text-foreground">All Categories</h2>
            </div>
            <div className="divide-y">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              ) : categories?.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No categories yet</div>
              ) : (
                categories?.map((category) => (
                  <div
                    key={category.id}
                    className={`p-4 hover:bg-slate-100 cursor-pointer transition-colors ${
                      selectedCategoryId === category.id ? "bg-red-50" : ""
                    }`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{category.name}</span>
                          {category.is_protected && (
                            <Shield className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">{category.description}</p>
                        )}
                      </div>
                      {!category.is_protected && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(category.id);
                            }}
                            className="p-1 hover:bg-red-100 rounded transition-all hover:scale-110"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Prompts Management */}
        <div className="lg:col-span-2">
          {selectedCategoryId && selectedCategory ? (
            <div className="bg-card rounded-lg shadow-sm border">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{selectedCategory.name}</h2>
                  {selectedCategory.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedCategory.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 hover:underline transition-all"
                >
                  <X className="w-4 h-4 hover:scale-110 transition-transform" />
                  Close
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* Edit Category (only for non-protected) */}
                {!selectedCategory.is_protected && editingCategory === selectedCategory.id ? (
                  <div className="bg-slate-100 rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Edit Category</h3>
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      placeholder="Category name"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    />
                    <input
                      type="text"
                      value={editCategoryDesc}
                      onChange={(e) => setEditCategoryDesc(e.target.value)}
                      placeholder="Description"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateCategory(selectedCategory.id)}
                        className="py-2 px-4 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="py-2 px-4 rounded-md bg-slate-100 hover:bg-slate-100/80 text-foreground text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  !selectedCategory.is_protected && (
                    <button
                      onClick={() => handleStartEditCategory(selectedCategory)}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline transition-all"
                    >
                      <Pencil className="w-4 h-4 hover:scale-110 transition-transform" />
                      Edit Category
                    </button>
                  )
                )}

                {/* Create Prompt Form */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Prompt
                  </h3>
                  <form onSubmit={handleCreatePrompt} className="space-y-3">
                    <textarea
                      value={newPromptText}
                      onChange={(e) => setNewPromptText(e.target.value)}
                      placeholder="Enter prompt text..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                    />
                    <button
                      type="submit"
                      disabled={!newPromptText.trim() || createPrompt.isPending}
                      className="py-2 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 transition-all hover:scale-105 flex items-center gap-2"
                    >
                      {createPrompt.isPending ? (
                        <>
                          <Plus className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add Prompt
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Prompts List */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Prompts ({prompts?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {prompts?.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No prompts in this category yet
                      </div>
                    ) : (
                      prompts?.map((prompt) => (
                        <div
                          key={prompt.id}
                          className="border rounded-lg p-4 hover:border-gray-300 transition-colors"
                        >
                          {editingPrompt === prompt.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={editPromptText}
                                onChange={(e) => setEditPromptText(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdatePrompt(prompt.id)}
                                  className="py-1.5 px-3 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-all hover:scale-105 flex items-center gap-1"
                                >
                                  <Save className="w-3 h-3" />
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingPrompt(null)}
                                  className="py-1.5 px-3 rounded-md bg-slate-100 hover:bg-slate-100/80 text-foreground text-xs font-medium transition-all hover:scale-105 flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm text-foreground flex-1">{prompt.text}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleStartEditPrompt(prompt)}
                                  className="p-1 hover:bg-slate-100 rounded transition-all hover:scale-110"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <button
                                  onClick={() => handleDeletePrompt(prompt.id)}
                                  className="p-1 hover:bg-red-100 rounded transition-all hover:scale-110"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Videos in this Category */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Videos in this Category ({totalJobsCount || 0})
                  </h3>
                  <div className="space-y-3">
                    {jobsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : displayCategoryJobs?.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg border-border">
                        <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No videos processed with this category yet
                      </div>
                    ) : (
                      displayCategoryJobs?.map((job) => (
                        <div
                          key={job.id}
                          className="border rounded-lg p-4 hover:border-gray-300 transition-colors bg-card"
                        >
                          <div className="flex items-start gap-4">
                            {job.youtube_thumbnail ? (
                              <img
                                src={job.youtube_thumbnail}
                                alt={job.youtube_title || "Video thumbnail"}
                                className="w-32 h-20 object-cover rounded-lg shrink-0"
                              />
                            ) : (
                              <div className="w-32 h-20 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                <ExternalLink className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate">
                                {job.youtube_title || "Untitled Video"}
                              </h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(job.created_at)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <JobStatusBadge jobId={job.id} compact />
                                {isCompleted(job.status) && (
                                  <Link
                                    href={`/history/${job.id}`}
                                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline transition-all"
                                  >
                                    <FileText className="w-3 h-3 hover:scale-110 transition-transform" />
                                    View Details
                                  </Link>
                                )}
                                {job.url && (
                                  <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 hover:underline transition-all"
                                  >
                                    <ExternalLink className="w-3 h-3 hover:scale-110 transition-transform" />
                                    Watch
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {displayCategoryJobs && displayCategoryJobs.length > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        Page {categoryJobsPage + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCategoryJobsPageChange(categoryJobsPage - 1)}
                          disabled={categoryJobsPage === 0}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-100/80 text-foreground font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </button>
                        <button
                          onClick={() => handleCategoryJobsPageChange(categoryJobsPage + 1)}
                          disabled={!hasMoreCategoryJobs}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-100/80 text-foreground font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-sm border p-12 text-center">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Select a Category</h3>
              <p className="text-muted-foreground">
                Choose a category from the list to manage its prompts and view associated videos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
