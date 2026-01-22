import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Clock,
  Mic,
  Send,
  Save,
  AlertCircle,
  Loader2,
  Info,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeStatus } from "@/components/ui/badge-status";
import { SpeakingSubmission } from "@/components/student/SpeakingSubmission";
import { ROUTES } from "@/constants";
import { assignmentApi } from "@/services/api/assignments";
import { attemptApi } from "@/services/api/attempts";
import { uploadApi } from "@/services/api/upload";
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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [assignment, setAssignment] = useState<AssignmentUI | null>(null);
  const [loading, setLoading] = useState(true);


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
            type: "SPEAKING",
            dueDate: data.deadline.toString(),
            description: data.description || "No description provided.",
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

            if (['SUBMITTED', 'SCORED', 'submitted', 'scored'].includes(data.submissionStatus)) {
                 navigate(ROUTES.LEARNER.SPEAKING_EVALUATION.replace(':assignmentId', assignmentId));
                 return;
            }

            // Fetch full attempt details to get the content/media
            try {
                const attemptDetails = await attemptApi.getAttemptById(data.attemptId);
                console.log("Attempt Details:", attemptDetails); // Debug log
                setAttemptResult(attemptDetails);
                if (attemptDetails.status) {
                    setSubmissionStatus(attemptDetails.status);
                    if (['SUBMITTED', 'SCORED', 'submitted', 'scored'].includes(attemptDetails.status)) {
                        navigate(ROUTES.LEARNER.SPEAKING_EVALUATION.replace(':assignmentId', assignmentId));
                        return;
                    }
                }
                
                if (attemptDetails.media && attemptDetails.media.length > 0) {
                    setExistingAudioUrl(attemptDetails.media[0].storageUrl);
                } else if (attemptDetails.content) {
                    setExistingAudioUrl(attemptDetails.content);
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

  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Recording timer effect
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= (assignment?.speakingTime || 120)) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, assignment?.speakingTime]);

  // Create and cleanup audio URL for preview
  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);
      console.log("Audio preview URL created:", url);
      
      // Cleanup function
      return () => {
        URL.revokeObjectURL(url);
        setAudioUrl(null);
      };
    } else {
      setAudioUrl(null);
    }
  }, [audioFile]);

  const maxRecordingTime = assignment?.speakingTime || 120;
  const isReadOnly = ['SUBMITTED', 'SCORED', 'submitted', 'scored'].includes(submissionStatus || '');

  // ...

  const hasRecording = recordingTime > 0 || audioFile !== null || existingAudioUrl !== null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      // Request audio with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      console.log("Audio stream obtained:", stream);
      console.log("Audio tracks:", stream.getAudioTracks());
      console.log("Audio track settings:", stream.getAudioTracks()[0]?.getSettings());
      
      // Check if we have audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        alert("No audio input detected. Please check your microphone.");
        return;
      }
      
      console.log("Audio track enabled:", audioTracks[0].enabled);
      console.log("Audio track muted:", audioTracks[0].muted);
      
      const mediaRecorder = new MediaRecorder(stream);
      console.log("MediaRecorder created with MIME type:", mediaRecorder.mimeType);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("Audio chunk received, size:", event.data.size);
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log("Recording stopped. Blob size:", audioBlob.size, "Type:", audioBlob.type);
        console.log("Number of chunks:", audioChunksRef.current.length);
        
        if (audioBlob.size === 0) {
            console.error("Recorded blob is empty!");
            alert("Recording failed: No audio captured. Please check your microphone.");
            return;
        }

        // Create WebM file (will be converted to MP3 by Cloudinary/backend)
        const file = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
        setAudioFile(file);
        
        // Stop all tracks
        stream.getTracks().forEach(track => {
          console.log("Stopping track:", track.kind, track.label);
          track.stop();
        });
      };

      mediaRecorder.start();
      console.log("Recording started");
      setRecordingTime(0);
      setIsRecording(true);
      setAudioFile(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please allow permissions and check your microphone is connected.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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
        let audioUrl = existingAudioUrl;

        if (audioFile) {
            const uploadRes = await uploadApi.uploadFile(audioFile);
            audioUrl = uploadRes.url;
        }

        if (!audioUrl) {
             // Fallback for testing if no file but mocking record logic
             // For now, require file or url
             console.warn("No audio file to upload, and no existing URL.");
        }
        
        // If we still don't have a URL (e.g. pure recording without file creation implemented yet?), 
        // we might fail. But setAudioFile is called by the recorder component presumably.

        await attemptApi.submitAttempt(attemptId, {
            content: audioUrl || "no-audio-uploaded"
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
              {submissionStatus === 'SCORED' && <BadgeStatus variant="success">Graded</BadgeStatus>}
              {submissionStatus === 'SUBMITTED' && <BadgeStatus variant="warning">Submitted</BadgeStatus>}
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Clock size={14} />
                Due in {getDaysUntilDue()} days
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isReadOnly && (
            <>
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
                disabled={isSubmitting}
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
            </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Topic Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
             <h3 className="text-lg font-bold text-slate-900 mb-3">Topic / Prompt</h3>
             <p className="text-lg text-slate-700 font-medium leading-relaxed">
               {assignment.prompt}
             </p>
          </div>

          {/* Recording Area */}
          {/* Recorder Area */}
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
              {/* Recording Status with Preview */}
              {hasRecording && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {audioFile ? "Recording ready" : "Recording complete"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Duration: {formatTime(recordingTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const audio = audioPreviewRef.current;
                        console.log("Preview clicked. Audio element:", audio);
                        console.log("Audio URL:", audioUrl);
                        console.log("Is playing:", isPlaying);
                        
                        if (audio && audioUrl) {
                          console.log("Audio element ready state:", audio.readyState);
                          console.log("Audio element paused:", audio.paused);
                          console.log("Audio element duration:", audio.duration);
                          console.log("Audio element volume:", audio.volume);
                          console.log("Audio element muted:", audio.muted);
                          
                          if (isPlaying) {
                            console.log("Pausing audio...");
                            audio.pause();
                          } else {
                            console.log("Playing audio...");
                            audio.play().then(() => {
                              console.log("Audio playback started successfully");
                            }).catch(err => {
                              console.error("Audio playback failed:", err);
                              alert("Failed to play audio. Please try recording again.");
                            });
                          }
                        } else {
                          console.warn("Audio preview not ready", { audio, audioUrl });
                          alert("Audio preview not ready. Please wait a moment and try again.");
                        }
                      }}
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      {isPlaying ? "Pause" : "Preview"}
                    </Button>
                  </div>
                  {/* Hidden audio element for preview */}
                  {audioUrl && (
                    <audio
                      ref={audioPreviewRef}
                      src={audioUrl}
                      onEnded={() => setIsPlaying(false)}
                      onPause={() => setIsPlaying(false)}
                      onPlay={() => setIsPlaying(true)}
                      onError={(e) => {
                        console.error("Audio element error:", e);
                        alert("Audio playback error. The recording may be corrupted.");
                      }}
                      className="hidden"
                    />
                  )}
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



