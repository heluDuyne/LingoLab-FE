import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Clock, Info, Star, PenTool, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeStatus } from "@/components/ui/badge-status";
import { ROUTES } from "@/constants";
import { assignmentApi } from "@/services/api/assignments";
import { attemptApi } from "@/services/api/attempts";
import { useAuthStore } from "@/stores";

interface AssignmentUI {
    id: string;
    title: string;
    className: string;
    type: "WRITING" | "SPEAKING";
    dueDate: string;
    description: string;
    prompt: string;
    tips: string[];
    promptId?: string;
}

export function WritingEvaluationPage() {
    const navigate = useNavigate();
    const { assignmentId } = useParams();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    
    const [assignment, setAssignment] = useState<AssignmentUI | null>(null);

    const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<any>(null);
    const [existingContent, setExistingContent] = useState<string | null>(null);

    useEffect(() => {
        const fetchAssignment = async () => {
            if (!assignmentId || !user?.id) return;
            try {
                const data = await assignmentApi.getAssignmentById(assignmentId) as any;

                // Transform API data to UI model
                setAssignment({
                    id: data.id,
                    title: data.title,
                    className: data.class?.name || "Class",
                    type: "WRITING",
                    dueDate: data.deadline.toString(),
                    description: data.description || "No description provided.",
                    prompt: data.prompt?.content || "No prompt content",
                    tips: [
                        "Check your grammar and spelling",
                        "Organize your thoughts into clear paragraphs",
                        "Use a variety of vocabulary"
                    ],
                    promptId: data.prompt?.id || data.promptId,
                });

                // Helper to safely load attempt details
                const loadAttemptDetails = async (id: string) => {
                     try {
                        const attemptDetails = await attemptApi.getAttemptById(id);
                        
                        if (attemptDetails.status) {
                            setSubmissionStatus(attemptDetails.status);
                        }

                        if (attemptDetails.content) {
                            setExistingContent(attemptDetails.content);
                        }

                        // Prefer attempt score if available (more detailed)
                        if (attemptDetails.score) {
                            setFeedback({
                                score: attemptDetails.score.overallBand,
                                summary: attemptDetails.score.feedback,
                                details: attemptDetails.score.detailedFeedback?.note || "",
                                aiScores: attemptDetails.score.aiScores || {
                                    taskResponse: attemptDetails.score.taskResponse,
                                    coherence: attemptDetails.score.coherence,
                                    lexical: attemptDetails.score.lexical,
                                    grammar: attemptDetails.score.grammar
                                },
                                aiEstimatedBand: attemptDetails.score.detailedFeedback?.overallBand || attemptDetails.score.overallBand,
                                strengths: attemptDetails.score.detailedFeedback?.strengths,
                                weaknesses: attemptDetails.score.detailedFeedback?.issues,
                                actions: attemptDetails.score.detailedFeedback?.actions,
                                gradedByTeacher: attemptDetails.score.detailedFeedback?.gradedByTeacher
                            });
                        }
                     } catch (err) {
                        console.error("Failed to fetch attempt details", err);
                     }
                };

                // Check for score on the assignment object itself (fallback)
                if (data.score) {
                     setFeedback({
                         score: data.score.overallBand || data.score, // Handle object or number
                         summary: data.score.feedback || "Teacher feedback available.",
                         details: data.score.detailedFeedback?.note || "",
                         aiScores: data.score.aiScores || {
                             // Default writing metrics if available
                             taskResponse: data.score.taskResponse,
                             coherence: data.score.coherence,
                             lexical: data.score.lexical,
                             grammar: data.score.grammar
                         },
                         aiEstimatedBand: data.score.detailedFeedback?.overallBand || data.score.overallBand,
                         strengths: data.score.detailedFeedback?.strengths,
                         weaknesses: data.score.detailedFeedback?.issues, // "issues" mapped to areas for improvement
                         actions: data.score.detailedFeedback?.actions,
                         gradedByTeacher: data.score.detailedFeedback?.gradedByTeacher
                     });
                }

                if (data.attemptId) {
                    setSubmissionStatus(data.submissionStatus || null);
                    await loadAttemptDetails(data.attemptId);
                } else if (data.prompt?.id || data.promptId) {
                    // Fallback: Try to find existing attempt via createAttempt
                    const promptId = data.prompt?.id || data.promptId;
                    console.log("[WritingEvaluation] No linked attempt. Finding attempt for prompt:", promptId);
                    
                    try {
                        const existingAttempt = await attemptApi.createAttempt({
                            learnerId: user.id,
                            promptId: promptId,
                            assignmentId: assignmentId, // passing assignmentId helps backend validation
                            skillType: "writing"
                        });
                        console.log("[WritingEvaluation] Found attempt:", existingAttempt.id);
                        await loadAttemptDetails(existingAttempt.id);
                    } catch (e) {
                        console.error("Failed to find fallback attempt", e);
                    }
                }
            } catch (err) {
                console.error("Failed to load assignment", err);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchAssignment();
        }
    }, [assignmentId, user?.id]);

    const handleBack = () => {
        navigate(ROUTES.LEARNER.DASHBOARD);
    };

    const getDaysUntilDue = () => {
        if (!assignment) return 0;
        const dueDate = new Date(assignment.dueDate);
        const now = new Date();
        return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    };

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
                            <span className="bg-purple-100 text-purple-600 p-1 rounded">
                                <PenTool size={16} />
                            </span>
                            <p className="text-sm text-slate-500">{assignment.className}</p>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {assignment.title}
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <BadgeStatus variant="info">Writing Task</BadgeStatus>
                            {submissionStatus === 'SCORED' && <BadgeStatus variant="success">Graded</BadgeStatus>}
                            {submissionStatus === 'SUBMITTED' && <BadgeStatus variant="warning">Submitted</BadgeStatus>}
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                <Clock size={14} />
                                Due in {getDaysUntilDue()} days
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* 1. Teacher Feedback */}
                        {(feedback?.gradedByTeacher) && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-purple-50 p-4 border-b border-purple-100 flex items-center justify-between">
                                    <h3 className="font-bold text-purple-900 flex items-center gap-2">
                                        <Star className="w-5 h-5 fill-purple-600 text-purple-600" />
                                        Teacher Feedback
                                    </h3>
                                    <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-purple-100">
                                        <span className="text-xs uppercase font-bold text-purple-400 mr-2">Band Score</span>
                                        <span className="text-xl font-black text-purple-600">{feedback?.score || "N/A"}</span>
                                    </div>
                                </div>
                                
                                {/* Criteria Breakdown */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 pt-6 pb-2 border-b border-slate-100">
                                    <div className="text-center">
                                        <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Task Response</span>
                                        <span className="block font-bold text-slate-900 text-lg">{feedback?.aiScores?.taskResponse ?? "-"}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Coherence</span>
                                        <span className="block font-bold text-slate-900 text-lg">{feedback?.aiScores?.coherence ?? "-"}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Lexical</span>
                                        <span className="block font-bold text-slate-900 text-lg">{feedback?.aiScores?.lexical ?? "-"}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Grammar</span>
                                        <span className="block font-bold text-slate-900 text-lg">{feedback?.aiScores?.grammar ?? "-"}</span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h4 className="text-sm font-bold text-slate-900 mb-2">Comments</h4>
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {feedback?.summary || "No comments provided."}
                                    </p>
                                    {feedback?.details && (
                                        <p className="text-slate-500 text-sm mt-4 italic border-t border-slate-100 pt-4">
                                            {feedback.details}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 2. AI Evaluation Breakdown */}
                        {(['SUBMITTED', 'SCORED', 'submitted', 'scored'].includes(submissionStatus || '') || feedback?.aiScores) && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-purple-600">
                                <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-2">
                                     <Sparkles className="w-5 h-5 text-purple-600 fill-purple-100" />
                                     <h3 className="font-bold text-slate-900">AI Evaluation</h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Scores & Band */}
                                    <div className="bg-purple-50 rounded-xl p-5 border border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Estimated Band</div>
                                            <div className="text-4xl font-black text-purple-700 leading-none">{feedback?.aiEstimatedBand || "N/A"}</div>
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { key: 'taskResponse', label: 'Task Response' },
                                                { key: 'coherence', label: 'Coherence & Cohesion' },
                                                { key: 'lexical', label: 'Lexical Resource' },
                                                { key: 'grammar', label: 'Grammatical Range & Accuracy' }
                                            ].map(({ key, label }) => {
                                                const value = feedback?.aiScores?.[key];
                                                return (
                                                    <div key={key} className="text-center">
                                                        <span className="block text-[10px] md:text-xs text-slate-500 uppercase font-bold mb-1 h-8 flex items-end justify-center">{label}</span>
                                                        <span className="block font-bold text-slate-900 text-lg">{typeof value === 'number' ? value.toFixed(1) : (value || "-")}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Detailed Feedback Sections */}
                                    {feedback?.aiScores ? (
                                        <div className="space-y-6">
                                            {/* Strengths */}
                                            <div className="space-y-2">
                                                <h4 className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                    Strengths
                                                </h4>
                                                <div className="text-sm text-slate-600 bg-green-50/50 p-3 rounded-md border border-green-100">
                                                    {feedback?.strengths || "No specific strengths analysis available."}
                                                </div>
                                            </div>

                                            {/* Areas for Improvement */}
                                            <div className="space-y-2">
                                                <h4 className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                                    Areas for Improvement
                                                </h4>
                                                <div className="text-sm text-slate-600 bg-amber-50/50 p-3 rounded-md border border-amber-100">
                                                    {feedback?.weaknesses || "No specific issues analysis available."}
                                                </div>
                                            </div>

                                            {/* Recommended Actions */}
                                            <div className="space-y-2">
                                                <h4 className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                                    Recommended Actions
                                                </h4>
                                                <div className="text-sm text-slate-600 bg-purple-50/50 p-3 rounded-md border border-purple-100 italic">
                                                    {feedback?.actions || "No specific actions available."}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-slate-500 italic">
                                            <p>AI processing in progress or no detailed scores available.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3. Your Response (Writing Content) */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <PenTool size={18} className="text-slate-500" />
                                Your Response
                            </h3>
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 min-h-[150px]">
                                {existingContent ? (
                                     <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
                                        {existingContent}
                                     </div>
                                ) : (
                                    <p className="text-slate-500 italic text-center py-8">No content submitted.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Sidebar */}
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

                    {/* Tips */}
                    <div className="bg-purple-50 rounded-xl border border-purple-100 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-3">
                            💡 Writing Tips
                        </h3>
                        <ul className="space-y-2 text-sm text-slate-600">
                            {assignment.tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
