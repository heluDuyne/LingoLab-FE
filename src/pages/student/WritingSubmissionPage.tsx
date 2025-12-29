import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Clock,
  FileText,
  Send,
  Save,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeStatus } from "@/components/ui/badge-status";
import { WritingSubmission } from "@/components/student/WritingSubmission";
import { ROUTES } from "@/constants";
import { assignmentApi } from "@/services/api/assignments";

// Types
interface AssignmentUI {
  id: string;
  title: string;
  className: string;
  type: "WRITING" | "SPEAKING";
  dueDate: string;
  description: string;
  instructions: string[];
  wordLimit?: { min: number; max: number };
  timeLimit?: number; // in minutes
}

export function WritingSubmissionPage() {
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const [text, setText] = useState("");
  const [autoSaved, setAutoSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [assignment, setAssignment] = useState<AssignmentUI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) return;
      try {
        const data = await assignmentApi.getAssignmentById(assignmentId);
        
        // Transform API data to UI model
        setAssignment({
            id: data.id,
            title: data.title,
            className: data.class?.name || "Class",
            type: "WRITING",
            dueDate: data.deadline.toString(),
            description: data.prompt?.title || data.description || "No description provided.",
            // Mock instructions/limits for now as they aren't in API yet
            instructions: [
                "Read the prompt carefully before you begin writing",
                "Plan your essay structure",
                "Review your work before submitting",
            ],
            wordLimit: { min: 150, max: 400 },
        });
      } catch (err) {
        console.error("Failed to load assignment", err);
        // handle error (navigate back or show error)
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [assignmentId]);

  // Auto-save effect
  useEffect(() => {
    if (text.length > 0) {
      const timer = setTimeout(() => {
        // Simulate auto-save
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [text]);

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
    );
  }

  if (!assignment) {
      return (
          <div className="flex h-screen items-center justify-center flex-col gap-4">
              <p>Assignment not found.</p>
              <Button onClick={() => navigate(ROUTES.LEARNER.DASHBOARD)}>
                  Back to Dashboard
              </Button>
          </div>
      );
  }

  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
  const isWordCountValid =
    assignment.wordLimit &&
    wordCount >= assignment.wordLimit.min &&
    wordCount <= assignment.wordLimit.max;
  const isUnderMinimum = assignment.wordLimit && wordCount < assignment.wordLimit.min;

  const handleBack = () => {
    navigate(ROUTES.LEARNER.DASHBOARD);
  };

  const handleSaveDraft = () => {
    // Simulate saving draft
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 2000);
  };

  const handleSubmit = async () => {
    if (isUnderMinimum) {
      setShowConfirmDialog(true);
      return;
    }
    await submitWork();
  };

  const submitWork = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setShowConfirmDialog(false);
    // Navigate back to dashboard after successful submission
    navigate(ROUTES.LEARNER.DASHBOARD);
  };

  const getDaysUntilDue = () => {
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    const diff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diff;
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-100 text-blue-600 p-1 rounded">
                <FileText size={16} />
              </span>
              <p className="text-sm text-slate-500">{assignment.className}</p>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {assignment.title}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <BadgeStatus variant="info">Writing Task</BadgeStatus>
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Clock size={14} />
                Due in {getDaysUntilDue()} days
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2 border-slate-300"
              onClick={handleSaveDraft}
            >
              <Save size={16} />
              Save Draft
            </Button>
            <Button
              className="gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={handleSubmit}
              disabled={isSubmitting || wordCount === 0}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Writing Area */}
        <div className="lg:col-span-2">
          <WritingSubmission
            text={text}
            onChange={setText}
            readOnly={false}
            autoSaved={autoSaved}
          />

          {/* Word Count Status */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isWordCountValid ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : isUnderMinimum ? (
                <AlertCircle size={16} className="text-amber-500" />
              ) : (
                <AlertCircle size={16} className="text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  isWordCountValid
                    ? "text-green-600"
                    : isUnderMinimum
                      ? "text-amber-600"
                      : "text-red-600"
                }`}
              >
                {wordCount} / {assignment.wordLimit?.min}-{assignment.wordLimit?.max} words
              </span>
            </div>
            {isUnderMinimum && (
              <span className="text-xs text-amber-600">
                {assignment.wordLimit!.min - wordCount} more words needed
              </span>
            )}
          </div>
        </div>

        {/* Sidebar - Instructions */}
        <div className="space-y-6">
          {/* Task Description */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Info size={18} className="text-purple-600" />
              Task Description
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {assignment.description}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Instructions
            </h3>
            <ul className="space-y-3">
              {assignment.instructions.map((instruction, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-slate-600">{instruction}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tips */}
          <div className="bg-purple-50 rounded-xl border border-purple-100 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              💡 Quick Tips
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Use paragraphs to organize your ideas</li>
              <li>• Include an introduction and conclusion</li>
              <li>• Proofread before submitting</li>
              <li>• Your work is auto-saved every few seconds</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowConfirmDialog(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertCircle size={24} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Word Count Below Minimum
                </h3>
                <p className="text-sm text-slate-600 mt-2">
                  Your essay has {wordCount} words, but the minimum requirement is{" "}
                  {assignment.wordLimit?.min} words. Are you sure you want to submit?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="border-slate-300"
              >
                Keep Writing
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={submitWork}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Anyway"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WritingSubmissionPage;

