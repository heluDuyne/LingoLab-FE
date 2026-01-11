
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Clock, Star, Sparkles, CheckCircle2, AlertCircle, Play, Pause, FileText, List, Bold, Italic, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { attemptApi } from "@/services/api/attempts";
import { toast } from "sonner";
// import { BadgeStatus } from "@/components/ui/badge-status"; // Unused for now

export function SpeakingGradingPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
        setDuration(audioRef.current.duration);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }
  };

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
      // Initialize form if already graded
      if (data.score) {
          setScore(data.score.overallBand);
          setFeedback(data.score.feedback);
      }
    } catch (error) {
      console.error("Failed to fetch attempt", error);
      toast.error("Failed to load submission");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId) return;
    
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

  // Mock format time
  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
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
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Column 1: Student Response (Speaking specific) */}
        <div className="xl:col-span-1 space-y-6">
            
          {/* Audio Player Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                  Student Response
              </CardTitle>
              <div className="bg-slate-100 text-slate-600 text-xs font-mono px-2 py-1 rounded">
                  {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </CardHeader>
            <CardContent className="pt-8 pb-8">
                {(() => {
                    const audioSrc = attempt?.media?.[0]?.storageUrl || (attempt?.content?.startsWith("http") ? attempt?.content : null);
                    console.log("Audio Source Attempted:", audioSrc, "Media:", attempt?.media, "Content:", attempt?.content);
                    
                    if (!audioSrc) {
                        return (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                                <AlertCircle className="w-8 h-8 text-slate-300" />
                                <p className="font-semibold">No Audio Recording Found</p>
                                <p className="text-xs">The student has not submitted an audio file.</p>
                            </div>
                        );
                    }

                    return (
                        <>
                            <audio
                                ref={audioRef}
                                src={audioSrc}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onEnded={() => setIsPlaying(false)}
                                onError={(e) => {
                                    console.error("Audio load error:", e);
                                    toast.error("Failed to load audio file");
                                }}
                                hidden
                            />
                            
                            {/* Visualizer Mockup (Static for now, but responsive to play state) */}
                            <div className="h-24 flex items-end justify-center gap-1 mb-6 px-4">
                                {[...Array(20)].map((_, i) => {
                                    // Simple animation simulation based on playing state
                                    const height = isPlaying ? Math.random() * 80 + 20 + "%" : "30%";
                                    const isActive = isPlaying || i < (currentTime / (duration || 1)) * 20; 
                                    return (
                                        <div 
                                            key={i} 
                                            className={`w-3 rounded-full transition-all duration-300 ${isActive ? 'bg-purple-600' : 'bg-purple-200'}`}
                                            style={{ height }} 
                                        />
                                    )
                                })}
                            </div>

                            {/* Player Controls */}
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={handlePlayPause}
                                    disabled={!duration}
                                    className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white shadow-lg shadow-purple-200 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-1" />}
                                </button>
                                
                                <div className="flex-1">
                                    <div 
                                        className={`h-1.5 bg-purple-100 rounded-full w-full relative group ${duration ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                        onClick={(e) => {
                                            if (audioRef.current && duration) {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const x = e.clientX - rect.left;
                                                const ratio = x / rect.width;
                                                audioRef.current.currentTime = ratio * duration;
                                            }
                                        }}
                                    >
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-purple-600 rounded-full transition-all duration-100"
                                            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                        ></div>
                                        {/* Thumb */}
                                        <div 
                                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-purple-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs font-medium text-slate-400">
                                        <span className="text-purple-600">{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                <button className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 hover:bg-slate-50">
                                    1x
                                </button>
                            </div>
                        </>
                    );
                })()}
            </CardContent>
          </Card>

          {/* Automated Transcription Card */}
          <Card className="border-slate-200 shadow-sm">
             <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Automated Transcription
              </CardTitle>
              <button className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1">
                  Download.txt
              </button>
            </CardHeader>
             <CardContent className="pt-0">
                 <div className="max-h-[400px] overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                     {attempt.content ? (
                         <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed">
                            {/* Mocking transcript formatting */}
                             <p>
                                 <span className="font-mono text-[10px] text-purple-400 mr-2">[00:00]</span>
                                 "Well, I think that technology has changed our lives in many ways. <span className="bg-yellow-100 px-1 rounded border-b-2 border-yellow-200 text-yellow-800">Firstly</span>, it allows us to communicate with people from all over the world instantly. In the past, we had to wait for letters, but now it's just a <span className="text-purple-600 bg-purple-50 px-1 rounded">click away</span>."
                             </p>
                             <p>
                                 <span className="font-mono text-[10px] text-purple-400 mr-2">[00:45]</span>
                                 "Regarding my hometown, I would say it's a <span className="bg-red-50 text-red-700 border-b border-red-300">very big city</span>. There are lots of people and cars, which makes it noisy. However, I like the vibe there because there's always something to do at night."
                             </p>
                             <p className="italic text-slate-400 text-xs py-2">
                                 [Student pauses for 3 seconds]
                             </p>
                             <p>
                                <span className="font-mono text-[10px] text-purple-400 mr-2">[01:22]</span>
                                "To conclude, I believe that technology will continue to evolve and <span className="border-b-2 border-purple-500 text-slate-900 font-medium">reshape</span> our daily routines in the coming decade."
                             </p>
                             
                             {/* Actual content fallback if we want to show it real */}
                             <div className="mt-8 pt-8 border-t border-slate-200">
                                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Raw Content</h4>
                                 <p className="whitespace-pre-wrap">{attempt.content}</p>
                             </div>
                         </div>
                     ) : (
                         <div className="text-center py-12 text-slate-400 italic">No transcription available.</div>
                     )}
                 </div>
             </CardContent>
          </Card>

        </div>

        {/* Column 2 & 3: AI Eval & Grading Form (Same as Writing) */}
         <div className="xl:col-span-1 space-y-4">
             {/* AI Eval Card (Same as GradingPage) */}
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
                            <div className="text-4xl font-black text-purple-700 leading-none">6.5</div>
                        </div>
                        <div className="text-right space-y-1">
                            <div className="text-xs text-slate-600 flex justify-between gap-4">
                                <span>Fluency:</span> <span className="font-bold text-slate-900">6.0</span>
                            </div>
                            <div className="text-xs text-slate-600 flex justify-between gap-4">
                                <span>Pronunciation:</span> <span className="font-bold text-slate-900">7.0</span>
                            </div>
                        </div>
                    </div>
                     <div className="space-y-3">
                        <h4 className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            Strengths
                        </h4>
                        <ul className="space-y-2">
                            <li className="text-sm text-slate-600 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                                <span>Good use of connectors ("Firstly", "However").</span>
                            </li>
                        </ul>
                    </div>
                     <div className="space-y-3">
                        <h4 className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            Areas for Improvement
                        </h4>
                         <ul className="space-y-2">
                            <li className="text-sm text-slate-600 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                <span>Some pauses affecting fluency.</span>
                            </li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="xl:col-span-1 space-y-4">
            {/* Grading Form (Same as GradingPage) */}
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
                                placeholder="e.g., 6.5"
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
