import { useNavigate } from "react-router";
import {
  X,
  FileText,
  Mic,
  Download,
  Bot,
  CheckCircle,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { BadgeStatus } from "@/components/ui/badge-status";
import { Button } from "@/components/ui/button";

interface AIFeedback {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

interface FeedbackSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId?: string;
  assignmentTitle: string;
  assignmentClassName: string;
  submissionStatus: "PENDING" | "SUBMITTED" | "GRADED" | "NOT_STARTED";
  submittedAt?: string;
  mediaType?: string;
  aiFeedback?: AIFeedback;
}

export function FeedbackSidebar({
  isOpen,
  onClose,
  submissionId,
  assignmentTitle,
  assignmentClassName,
  submissionStatus,
  submittedAt,
  mediaType,
  aiFeedback,
}: FeedbackSidebarProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleViewFullReport = () => {
    if (submissionId) {
      navigate(`/student/report/${submissionId}`);
      onClose();
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex justify-end'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity'
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside className='relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-slate-100'>
          <h2 className='text-xl font-bold text-slate-900'>Feedback Details</h2>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors'
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className='flex-1 p-6 space-y-8 overflow-y-auto'>
          {/* Assignment Info */}
          <div>
            <p className='text-sm text-slate-400'>{assignmentClassName}</p>
            <h3 className='text-2xl font-bold mt-1 text-slate-900'>
              {assignmentTitle}
            </h3>
            <div className='flex items-center gap-2 mt-3'>
              <BadgeStatus
                variant={submissionStatus === "GRADED" ? "success" : "warning"}
              >
                {submissionStatus}
              </BadgeStatus>
              {submittedAt && (
                <p className='text-sm text-slate-400'>
                  Submitted on {new Date(submittedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Submission File */}
          <div className='space-y-4'>
            <h4 className='text-lg font-semibold text-slate-900'>
              Your Submission
            </h4>
            <div className='flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200'>
              <div className='text-purple-600'>
                {mediaType?.startsWith("audio") ? (
                  <Mic size={32} />
                ) : (
                  <FileText size={32} />
                )}
              </div>
              <div className='flex-1 min-w-0'>
                <p className='font-medium text-slate-900 truncate'>
                  {mediaType?.startsWith("audio")
                    ? "Audio Recording"
                    : "Essay Submission"}
                </p>
                <p className='text-xs text-slate-400'>
                  {mediaType?.startsWith("audio")
                    ? "MP3 Audio"
                    : "Text Content"}
                </p>
              </div>
              <button className='flex items-center justify-center h-9 px-4 rounded-lg bg-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-300 transition-colors'>
                <Download size={16} className='mr-2' /> View
              </button>
            </div>
          </div>

          {/* AI Feedback */}
          {aiFeedback && (
            <div className='bg-purple-50 border-l-4 border-purple-600 p-5 rounded-r-lg space-y-6'>
              <div className='flex items-center justify-between gap-4'>
                <div className='flex items-center gap-3'>
                  <Bot size={28} className='text-purple-600' />
                  <h4 className='text-lg font-bold text-slate-900'>
                    AI Feedback
                  </h4>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-medium text-slate-400'>
                    AI Estimated Score
                  </p>
                  <p className='text-3xl font-bold text-purple-600'>
                    {aiFeedback.score}
                    <span className='text-lg font-medium text-slate-400'>
                      /9.0
                    </span>
                  </p>
                </div>
              </div>

              <div className='space-y-4'>
                <div className='space-y-2'>
                  <h5 className='font-semibold text-slate-900'>Summary</h5>
                  <p className='text-slate-600 leading-relaxed text-sm'>
                    {aiFeedback.summary}
                  </p>
                </div>

                <div className='space-y-3'>
                  <h5 className='font-semibold text-slate-900'>Strengths</h5>
                  {aiFeedback.strengths.slice(0, 2).map((str, i) => (
                    <div key={i} className='flex items-start gap-3'>
                      <CheckCircle
                        size={18}
                        className='text-green-500 mt-0.5 shrink-0'
                      />
                      <p className='text-slate-600 leading-relaxed text-sm'>
                        {str}
                      </p>
                    </div>
                  ))}
                </div>

                <div className='space-y-3'>
                  <h5 className='font-semibold text-slate-900'>
                    Areas for Improvement
                  </h5>
                  {aiFeedback.weaknesses.slice(0, 2).map((weak, i) => (
                    <div key={i} className='flex items-start gap-3'>
                      <Lightbulb
                        size={18}
                        className='text-amber-500 mt-0.5 shrink-0'
                      />
                      <p className='text-slate-600 leading-relaxed text-sm'>
                        {weak}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* View Full Report Button */}
              <Button
                onClick={handleViewFullReport}
                className='w-full bg-purple-600 hover:bg-purple-700 text-white font-medium gap-2'
              >
                View Full Report
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default FeedbackSidebar;
