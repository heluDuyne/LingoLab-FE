import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react"; // Added imports
import {
  ArrowLeft,
  FileText,
  Mic,
  Download,
  Bot,
  CheckCircle,
  Lightbulb,
  Clock,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  UserCheck, // Added icon for teacher feedback
  Loader2 // Added loader
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeStatus } from "@/components/ui/badge-status";
import { ROUTES } from "@/constants";
import { attemptApi } from "@/services/api/attempts";

// Types
interface AIFeedback {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  detailedAnalysis?: {
    taskAchievement: { score: number; feedback: string };
    coherenceCohesion: { score: number; feedback: string };
    lexicalResource: { score: number; feedback: string };
    grammaticalRange: { score: number; feedback: string };
  };
  suggestions?: string[];
}

interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  assignmentClassName: string;
  studentId: string;
  status: "PENDING" | "SUBMITTED" | "GRADED" | "SCORED"; // Updated status
  submittedAt?: string;
  mediaType?: string;
  content?: string;
  aiFeedback?: AIFeedback;
  teacherFeedback?: {
    score: number;
    feedback: string;
    gradedBy: string;
    gradedAt: string;
  };
}

export function ReportDetailPage() {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchSubmission = async () => {
          if (!submissionId) return;
          try {
              const data = await attemptApi.getAttemptById(submissionId);
              
              // Map API response to Component State
              const mappedSubmission: Submission = {
                  id: data.id,
                  assignmentId: data.assignment?.id || "",
                  assignmentTitle: data.assignmentTitle || "Untitled Assignment",
                  assignmentClassName: data.className || "Unknown Class",
                  studentId: data.learnerId,
                  status: data.status === 'scored' ? 'GRADED' : (data.status === 'submitted' ? 'SUBMITTED' : 'PENDING'),
                  submittedAt: data.submittedAt,
                  mediaType: data.skillType === 'speaking' ? 'audio' : 'text', // Infer from skillType
                  content: data.content,
                  aiFeedback: data.score ? {
                      score: Number(data.score.overallBand),
                      summary: (data.score.detailedFeedback?.issues || data.score.detailedFeedback?.actions) 
                          ? `${data.score.detailedFeedback.issues || ''}\n\n${data.score.detailedFeedback.actions || ''}`.trim()
                          : data.score.feedback, // Use detailed if available (AI), else feedback (AI or Teacher if overwritten, but logic below handles separation)
                      strengths: Array.isArray(data.score.detailedFeedback?.strengths) ? data.score.detailedFeedback.strengths : [],
                      weaknesses: Array.isArray(data.score.detailedFeedback?.weaknesses) ? data.score.detailedFeedback.weaknesses : [],
                      suggestions: typeof data.score.detailedFeedback?.actions === 'string' 
                          ? data.score.detailedFeedback.actions.split('\n').filter((s: string) => s.trim()) 
                          : (Array.isArray(data.score.detailedFeedback?.actions) ? data.score.detailedFeedback.actions : []),
                      detailedAnalysis: data.score.detailedFeedback?.aiScores ? {
                           taskAchievement: { score: Number(data.score.detailedFeedback.aiScores.taskResponse || 0), feedback: "" },
                           coherenceCohesion: { score: Number(data.score.detailedFeedback.aiScores.coherence || 0), feedback: "" },
                           lexicalResource: { score: Number(data.score.detailedFeedback.aiScores.lexical || 0), feedback: "" },
                           grammaticalRange: { score: Number(data.score.detailedFeedback.aiScores.grammar || 0), feedback: "" }
                      } : undefined
                  } : undefined,
                  teacherFeedback: data.score?.detailedFeedback?.gradedByTeacher ? {
                      score: Number(data.score.overallBand),
                      feedback: data.score.feedback,
                      gradedBy: "Teacher", // Could be enriched if we had teacher name in score
                      gradedAt: data.scoredAt || new Date().toISOString()
                  } : undefined
              };

              // Fallback for strengths/weaknesses if not structured (e.g. from simpler AI response)
              if (mappedSubmission.aiFeedback && mappedSubmission.aiFeedback.strengths.length === 0) {
                   // Try to parse from free text feedback if needed, or leave empty
              }

              setSubmission(mappedSubmission);

          } catch (error) {
              console.error("Failed to load submission", error);
          } finally {
              setLoading(false);
          }
      };

      fetchSubmission();
  }, [submissionId]);

  const handleBack = () => {
    navigate(ROUTES.LEARNER.PROGRESS); // Redirect to Progress or Dashboard
  };

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
      );
  }

  if (!submission) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Report not found</p>
      </div>
    );
  }

  const { aiFeedback } = submission;
  const teacherFeedback = submission.teacherFeedback;

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back to Progress
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-sm text-slate-400">{submission.assignmentClassName}</p>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              {submission.assignmentTitle}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <BadgeStatus
                variant={submission.status === "GRADED" ? "success" : "warning"}
              >
                {submission.status}
              </BadgeStatus>
              {submission.submittedAt && (
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <Clock size={14} />
                  Submitted on{" "}
                  {new Date(submission.submittedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            className="gap-2 border-slate-300"
            onClick={() => window.print()}
          >
            <Download size={16} />
            Download Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Teacher Feedback Card (If exists) */}
          {teacherFeedback && (
             <div className="bg-white rounded-xl border border-indigo-100 p-6 shadow-sm ring-1 ring-indigo-50">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <UserCheck size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Teacher's Feedback</h3>
                    <p className="text-sm text-slate-500">Graded by {teacherFeedback.gradedBy}</p>
                  </div>
                  <div className="ml-auto text-right">
                      <div className="text-2xl font-bold text-indigo-600">{teacherFeedback.score}</div>
                      <div className="text-xs text-slate-500">Overall Score</div>
                  </div>
               </div>
               <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 text-slate-700 whitespace-pre-wrap">
                   {teacherFeedback.feedback}
               </div>
             </div>
          )}

          {/* Overall Score Card AI */}
          {aiFeedback && !teacherFeedback && (
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot size={32} />
                  <div>
                    <h2 className="text-lg font-bold">AI Assessment</h2>
                    <p className="text-purple-200 text-sm">Overall Band Score</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-5xl font-bold">{aiFeedback.score}</p>
                  <p className="text-purple-200 text-sm">/9.0</p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Scores */}
          {aiFeedback?.detailedAnalysis && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-purple-600" />
                Detailed Band Scores (AI)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Task Achievement */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Task Achievement
                    </span>
                    <span className="text-lg font-bold text-purple-600">
                      {aiFeedback.detailedAnalysis.taskAchievement.score}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${(aiFeedback.detailedAnalysis.taskAchievement.score / 9) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Coherence & Cohesion */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Coherence & Cohesion
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {aiFeedback.detailedAnalysis.coherenceCohesion.score}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(aiFeedback.detailedAnalysis.coherenceCohesion.score / 9) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Lexical Resource */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Lexical Resource
                    </span>
                    <span className="text-lg font-bold text-emerald-600">
                      {aiFeedback.detailedAnalysis.lexicalResource.score}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{
                        width: `${(aiFeedback.detailedAnalysis.lexicalResource.score / 9) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Grammatical Range */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Grammatical Range
                    </span>
                    <span className="text-lg font-bold text-amber-600">
                      {aiFeedback.detailedAnalysis.grammaticalRange.score}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-amber-600 h-2 rounded-full"
                      style={{
                        width: `${(aiFeedback.detailedAnalysis.grammaticalRange.score / 9) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Your Submission */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              {submission.mediaType?.startsWith("audio") ? (
                <Mic size={20} className="text-purple-600" />
              ) : (
                <FileText size={20} className="text-purple-600" />
              )}
              Your Submission
            </h3>
            {submission.content && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                  {submission.content}
                </p>
              </div>
            )}
          </div>

          {/* AI Summary */}
          {aiFeedback && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Bot size={20} className="text-purple-600" />
                AI Summary
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {aiFeedback.summary}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Strengths */}
          {aiFeedback && aiFeedback.strengths.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                Strengths
              </h3>
              <div className="space-y-3">
                {aiFeedback.strengths.map((strength, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
                  >
                    <CheckCircle
                      size={16}
                      className="text-green-600 mt-0.5 shrink-0"
                    />
                    <p className="text-sm text-slate-700">{strength}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Areas for Improvement */}
          {aiFeedback && aiFeedback.weaknesses.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-600" />
                Areas for Improvement
              </h3>
              <div className="space-y-3">
                {aiFeedback.weaknesses.map((weakness, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100"
                  >
                    <Lightbulb
                      size={16}
                      className="text-amber-600 mt-0.5 shrink-0"
                    />
                    <p className="text-sm text-slate-700">{weakness}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {aiFeedback?.suggestions && aiFeedback.suggestions.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-blue-600" />
                Suggestions for Improvement
              </h3>
              <ul className="space-y-2">
                {aiFeedback.suggestions.map((suggestion, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <span className="text-purple-600 font-bold">{i + 1}.</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportDetailPage;

