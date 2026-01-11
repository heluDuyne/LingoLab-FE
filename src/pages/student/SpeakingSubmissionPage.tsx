import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Clock,
  Mic,
  Send,
  Save,
  AlertCircle,
  Info,
  Volume2,
  Play,
  Pause,
  Loader2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeStatus } from "@/components/ui/badge-status";
import { SpeakingSubmission } from "@/components/student/SpeakingSubmission";
import { ROUTES } from "@/constants";
import { assignmentApi } from "@/services/api/assignments";
import { attemptApi } from "@/services/api/attempts";
import { useAuthStore } from "@/stores";

// Types
interface AssignmentUI {
  id: string;
  title: string;
  className: string;
  type: "WRITING" | "SPEAKING";
  dueDate: string;
  description: string;
  prompt: string;
  speakingTime?: number; // in seconds
  tips: string[];
  promptId?: string;
}

export function SpeakingSubmissionPage() {
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const { user } = useAuthStore();
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [existingAudioUrl, setExistingAudioUrl] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [attemptResult, setAttemptResult] = useState<any>(null);

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);

  const [assignment, setAssignment] = useState<AssignmentUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<any>(null); // Feedback state

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId || !user?.id) return;
      try {
        console.log("Fetching assignment:", assignmentId); // Debug log


        
        const data = await assignmentApi.getAssignmentById(assignmentId) as any;
        
        // Transform API data to UI model
        setAssignment({
            id: data.id,
            title: data.title,
            className: data.class?.name || "Class",
            type: "SPEAKING",
            dueDate: data.deadline.toString(),
            description: data.prompt?.title || data.description || "No description provided.",
            prompt: data.prompt?.content || "No prompt content",
            speakingTime: 120, // Default or fetch from assignment/prompt
            tips: [
                "Speak clearly and at a natural pace",
                "Try to use a variety of vocabulary",
                "Don't worry about small mistakes, focus on communication"
            ],
            promptId: data.prompt?.id || data.promptId,
        });
        
        // Handle attempt creation/retrieval
        if (data.attemptId) {
            setAttemptId(data.attemptId);
            setSubmissionStatus(data.submissionStatus || null);

            // Fetch full attempt details to get the content/media
            try {
                const attemptDetails = await attemptApi.getAttemptById(data.attemptId);
                console.log("Attempt Details:", attemptDetails); // Debug log
                setAttemptResult(attemptDetails);
                
                if (attemptDetails.media && attemptDetails.media.length > 0) {
                    setExistingAudioUrl(attemptDetails.media[0].storageUrl);
                } else if (attemptDetails.content) {
                    setExistingAudioUrl(attemptDetails.content);
                }

                // Set feedback if available (Logic ported from WritingSubmissionPage)
                if (attemptDetails.score) {
                     setFeedback({
                         score: attemptDetails.score.overallBand,
                         summary: attemptDetails.score.feedback,
                         details: attemptDetails.score.detailedFeedback?.note || ""
                     });
                }

            } catch (err) {
                console.error("Failed to fetch attempt details", err);
            }

        } else if (data.prompt?.id) {
             const newAttempt = await attemptApi.createAttempt({
                learnerId: user.id,
                promptId: data.prompt.id,
                skillType: "speaking",
                assignmentId: data.id
            });
            setAttemptId(newAttempt.id);
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

  // Recording timer effect
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= (assignment?.speakingTime || 120)) {
            setIsRecording(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, assignment?.speakingTime]);

  const maxRecordingTime = assignment?.speakingTime || 120;
  const isReadOnly = submissionStatus === 'SUBMITTED' || submissionStatus === 'SCORED';

  // ...

  const hasRecording = recordingTime > 0 || audioFile !== null || existingAudioUrl !== null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // In a real app, this would save the recorded audio
    } else {
      // Start recording
      setRecordingTime(0);
      setIsRecording(true);
      setAudioFile(null);
    }
  };

  const handleBack = () => {
    navigate(ROUTES.LEARNER.DASHBOARD);
  };

  const handleSaveDraft = () => {
    // Simulate saving draft
    console.log("Draft saved");
  };

  const handleSubmit = async () => {
    if (recordingTime === 0 && !audioFile && !existingAudioUrl) {
      setShowConfirmDialog(true);
      return;
    }
    await submitWork();
  };

  const submitWork = async () => {
    if (!attemptId) {
        console.error("Attempt ID is missing");
        alert("Session error: Attempt ID not found. Please refresh the page.");
        return;
    }
    setIsSubmitting(true);
    try {
        // TODO: Upload audio file and get URL
        // const audioUrl = await uploadAudio(audioFile);
        const mockAudioUrl = "mock-audio-file.mp3"; 

        await attemptApi.submitAttempt(attemptId, {
            content: mockAudioUrl
        });
        navigate(ROUTES.LEARNER.DASHBOARD);
    } catch (error) {
        console.error("Submission failed", error);
        alert("Failed to submit. Please try again.");
    } finally {
        setIsSubmitting(false);
        setShowConfirmDialog(false);
    }
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
                <Mic size={16} />
              </span>
              <p className="text-sm text-slate-500">{assignment.className}</p>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {assignment.title}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <BadgeStatus variant="info">Speaking Task</BadgeStatus>
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
              disabled={!hasRecording}
            >
              <Save size={16} />
              Save Draft
            </Button>
            <Button
              className="gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={handleSubmit}
              disabled={isSubmitting || isReadOnly}
            >
              {isReadOnly ? "Submitted" : isSubmitting ? (
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
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Topic Card */}
          {/* ... */}

          {/* Recording Area */}
          <SpeakingSubmission
            isRecording={isRecording}
            toggleRecording={toggleRecording}
            recordingTime={recordingTime}
            audioFile={audioFile}
            setAudioFile={setAudioFile}
            readOnly={isReadOnly}
            existingAudioUrl={existingAudioUrl}
            formatTime={formatTime}
          />

          {/* Recording Status */}
          {hasRecording && (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Mic size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {audioFile ? "Audio file uploaded" : "Recording complete"}
                  </p>
                  <p className="text-sm text-slate-500">
                    Duration: {formatTime(recordingTime)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? "Pause" : "Preview"}
              </Button>
            </div>
          )}

          {/* Teacher Grading Result */}
          {/* Teacher Grading Result */}
          {(submissionStatus === 'scored' || feedback) && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
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

          {/* Time Limit */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Time Limit
            </h3>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Max Speaking Time</span>
              <span className="font-bold text-slate-900">
                {formatTime(assignment.speakingTime || 120)}
              </span>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-purple-50 rounded-xl border border-purple-100 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              💡 Speaking Tips
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
                  No Recording Found
                </h3>
                <p className="text-sm text-slate-600 mt-2">
                  You haven't recorded any audio or uploaded a file. Please
                  record your speaking response before submitting.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="border-slate-300"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



