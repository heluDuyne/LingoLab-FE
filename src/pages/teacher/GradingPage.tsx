import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Clock, Star, Sparkles, CheckCircle2, AlertCircle, FileText, ExternalLink, Bold, Italic, List, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { attemptApi } from "@/services/api/attempts";
import { toast } from "sonner";
import { BadgeStatus } from "@/components/ui/badge-status";

export function GradingPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (attemptId) {
      fetchAttempt(attemptId);
    }
  }, [attemptId]);

  const fetchAttempt = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await attemptApi.getAttemptById(id);
      setAttempt(data);
    } catch (error) {
      console.error("Failed to fetch attempt", error);
      toast.error("Failed to load submission");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId) return;
    
    // Validate score
    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) { 
        toast.error("Please enter a valid numeric score");
        return;
    }

    try {
      setIsSubmitting(true);
      await attemptApi.gradeAttempt(attemptId, {
          score: numScore,
          feedback: feedback
      });
      toast.success("Grading saved successfully!");
      navigate(-1);
    } catch (error) {
      console.error("Failed to save grading", error);
      toast.error("Failed to save grading");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900">Submission Not Found</h2>
        <Button variant="link" onClick={() => navigate(-1)} className="mt-4 text-purple-600">
          Go Back
        </Button>
      </div>
    );
  }

  const wordCount = attempt.content ? attempt.content.split(/\s+/).length : 0;

  return (
    <div className="max-w-[1600px] mx-auto pb-12 animate-in fade-in duration-300 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8 border-b border-slate-200 pb-6">
        <div className="flex items-center justify-between mb-4">
             <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="pl-0 hover:bg-transparent hover:text-purple-600 text-slate-500"
                >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>
            <div className="flex items-center text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                <Clock className="w-4 h-4 mr-2" />
                Submitted: {new Date(attempt.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                    {attempt.assignmentTitle || "Untitled Task"}
                </h1>
                <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold text-slate-900">{attempt.studentName || "Unknown Student"}</span>
                    {attempt.studentEmail && (
                        <>
                         <span className="text-slate-300">•</span>
                         <span>{attempt.studentEmail}</span>
                        </>
                    )}
                    {attempt.className && (
                        <>
                         <span className="text-slate-300">•</span>
                         <span className="text-slate-500">{attempt.className}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Column 1: Student Response */}
        <div className="xl:col-span-1 space-y-4">
          {/* Task Description Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5">
               <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                   <FileText className="w-4 h-4 text-slate-500" />
                   Task Description
               </CardTitle>
            </CardHeader>
             <CardContent className="pt-6">
                 <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {attempt.assignmentDescription || "No task description provided."}
                 </div>
             </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm h-full flex flex-col">
            <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900">Student Response</CardTitle>
                <BadgeStatus variant="info" className="text-[10px] uppercase tracking-wider font-bold">Writing Task</BadgeStatus>
              </div>
            </CardHeader>
            <CardContent className="pt-6 flex-1">
               {attempt.content ? (
                   <div className="prose prose-slate prose-sm max-w-none">
                       <p className="whitespace-pre-wrap text-slate-700 leading-relaxed font-serif text-lg">
                           {attempt.content}
                       </p>
                   </div>
               ) : (
                   <div className="flex flex-col items-center justify-center py-12 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                       <FileText className="h-8 w-8 mb-2 opacity-50" />
                       No content submitted
                   </div>
               )}
            </CardContent>
             <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500 font-medium">
                <span>Word Count: {wordCount} words</span>
                <button className="flex items-center text-purple-600 hover:text-purple-700 transition-colors">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Original
                </button>
            </div>
          </Card>
        </div>

        {/* Column 2: AI Evaluation */}
        <div className="xl:col-span-1 space-y-4">
            <Card className="border-slate-200 shadow-sm h-full border-t-4 border-t-purple-600">
                <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5">
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600 fill-purple-100" />
                        AI Evaluation
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Scores */}
                    <div className="bg-purple-50 rounded-xl p-5 border border-purple-100 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Estimated Band</div>
                            <div className="text-4xl font-black text-purple-700 leading-none">{attempt.score?.overallBand || "N/A"}</div>
                        </div>
                        <div className="space-y-2 min-w-[200px]">
                            <div className="text-xs text-slate-600 flex justify-between items-start gap-3">
                                <span className="text-left font-medium leading-tight">Task Response:</span> 
                                <span className="font-bold text-slate-900 shrink-0">{attempt.score?.detailedFeedback?.aiScores?.taskResponse || attempt.score?.taskResponse || "-"}</span>
                            </div>
                            <div className="text-xs text-slate-600 flex justify-between items-start gap-3">
                                <span className="text-left font-medium leading-tight">Coherence & Cohesion:</span> 
                                <span className="font-bold text-slate-900 shrink-0">{attempt.score?.detailedFeedback?.aiScores?.coherence || attempt.score?.coherence || "-"}</span>
                            </div>
                            <div className="text-xs text-slate-600 flex justify-between items-start gap-3">
                                <span className="text-left font-medium leading-tight">Lexical Resource:</span> 
                                <span className="font-bold text-slate-900 shrink-0">{attempt.score?.detailedFeedback?.aiScores?.lexical || attempt.score?.lexical || "-"}</span>
                            </div>
                            <div className="text-xs text-slate-600 flex justify-between items-start gap-3">
                                <span className="text-left font-medium leading-tight">Grammatical Range & Accuracy:</span> 
                                <span className="font-bold text-slate-900 shrink-0">{attempt.score?.detailedFeedback?.aiScores?.grammar || attempt.score?.grammar || "-"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Strengths */}
                    <div className="space-y-3">
                        <h4 className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            Strengths
                        </h4>
                        <div className="text-sm text-slate-600 bg-green-50/50 p-3 rounded-md border border-green-100 whitespace-pre-line">
                            {attempt.score?.detailedFeedback?.strengths || "No specific strengths analysis available."}
                        </div>
                    </div>

                    {/* Weaknesses */}
                    <div className="space-y-3">
                        <h4 className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            Areas for Improvement
                        </h4>
                         <div className="text-sm text-slate-600 bg-amber-50/50 p-3 rounded-md border border-amber-100 whitespace-pre-line">
                            {attempt.score?.detailedFeedback?.issues || "No specific issues analysis available."}
                        </div>
                    </div>

                    {/* AI Suggestion / Actions */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Actions</div>
                        <p className="text-sm text-slate-600 italic leading-relaxed whitespace-pre-line">
                            {attempt.score?.detailedFeedback?.actions || "No specific actions available."}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Column 3: Grading Form */}
        <div className="xl:col-span-1 space-y-4">
            <Card className="border-slate-200 shadow-sm sticky top-6">
                <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5">
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Star className="w-5 h-5 text-purple-600 fill-purple-600" />
                        Feedback & Score
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-900">Overall Band Score</label>
                        <div className="relative">
                            <Input 
                                type="text" 
                                placeholder="e.g., 7.5"
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                                className="pl-4 pr-12 h-11 text-lg font-medium"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">/ 9.0</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-900">Detailed Feedback</label>
                        <Textarea 
                            placeholder="Enter constructive feedback for the student..." 
                            className="min-h-[200px] resize-none p-4 text-base leading-relaxed"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        />
                         {/* Toolbar Mockup */}
                        <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-200 border-t-0 rounded-b-md -mt-2">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-200"><Bold className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-200"><Italic className="h-3.5 w-3.5" /></Button>
                            <div className="h-4 w-px bg-slate-300 mx-1" />
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-200"><List className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-200"><LinkIcon className="h-3.5 w-3.5" /></Button>
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                        <Button 
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 shadow-lg shadow-purple-200 transition-all hover:translate-y-[-1px]"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : "Submit Grade"}
                        </Button>
                        <Button 
                            variant="outline"
                            className="w-full border-slate-200 text-slate-700 font-bold h-11 hover:bg-slate-50"
                            onClick={() => toast.info("Draft saved locally")}
                        >
                            Save as Draft
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
