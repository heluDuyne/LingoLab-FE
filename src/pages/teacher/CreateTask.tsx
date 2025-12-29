import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Calendar, Search, Upload, X, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants";
import { toast } from "sonner";
import { type TaskType } from "@/data";
import { classApi } from "@/services/api/classes";
import { promptApi } from "@/services/api/prompts";
import { assignmentApi } from "@/services/api/assignments";
import { useAuthStore } from "@/stores";
import type { ClassList } from "@/types";
import { cn } from "@/lib/utils";




export function CreateTaskPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("WRITING");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");

  // AI Config State
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  const [criteria, setCriteria] = useState<string[]>([
    "Grammar",
    "Vocabulary",
    "Coherence",
  ]);
  const [tone, setTone] = useState("Formal & Encouraging");

  // Scheduling State
  const [dueDate, setDueDate] = useState("");
  
  // Class Selection State
  const [classes, setClasses] = useState<ClassList[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  // File Upload State
  const [attachments, setAttachments] = useState<File[]>([]);

  // Fetch Classes
  useEffect(() => {
    const fetchClasses = async () => {
      if (!user?.id) return;
      setIsLoadingClasses(true);
      try {
        const response = await classApi.getClassesByTeacher(user.id, 100); // Fetch all
        setClasses(response.data || []);
      } catch (error) {
        console.error("Failed to fetch classes", error);
        toast.error("Failed to load classes for assignment");
      } finally {
        setIsLoadingClasses(false);
      }
    };
    fetchClasses();
  }, [user?.id]);


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
    // Reset input value to allow uploading the same file again
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["pdf"].includes(ext || "")) return "📄";
    if (["doc", "docx"].includes(ext || "")) return "📝";
    if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) return "🖼️";
    if (["mp3", "wav", "ogg"].includes(ext || "")) return "🎵";
    if (["mp4", "mov", "avi"].includes(ext || "")) return "🎬";
    return "📎";
  };

  const toggleCriteria = (crit: string) => {
    if (criteria.includes(crit)) {
      setCriteria(criteria.filter((c) => c !== crit));
    } else {
      setCriteria([...criteria, crit]);
    }
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const toggleSelectAllClasses = () => {
    if (selectedClassIds.length === classes.length) {
      setSelectedClassIds([]); // Deselect all
    } else {
      setSelectedClassIds(classes.map(c => c.id)); // Select all
    }
  };


  const handleSave = async () => {
    if (selectedClassIds.length === 0) {
      toast.error("Please select at least one class.");
      return;
    }

    try {
      // 1. Create the Prompt first
      const newPrompt = await promptApi.createPrompt({
         skillType: type.toLowerCase() as any, // "writing" | "speaking"
         content: instructions,
         difficulty: "medium" as any, // Backend expects "medium"
         prepTime: 0,
         responseTime: 0,
         description: description
      });

      if (!newPrompt?.id) {
         throw new Error("Failed to create prompt");
      }

      // 2. Create Assignment for each selected class
      const createAssignmentPromises = selectedClassIds.map(classId => {
        return assignmentApi.createAssignment({
          classId: classId,
          promptId: newPrompt.id,
          title: title,
          description: description,
          deadline: dueDate || new Date(Date.now() + 86400000 * 7).toISOString(),
          status: 'active', // or 'draft' based on a new UI toggle if desired
          allowLateSubmission: true 
        });
      });

      await Promise.all(createAssignmentPromises);

      toast.success(`Task created successfully for ${selectedClassIds.length} classes!`);
      navigate(ROUTES.TEACHER.DASHBOARD);

    } catch (error) {
      console.error("Failed to create task", error);
      toast.error("Failed to create task. Please try again.");
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.TEACHER.DASHBOARD);
  };

  return (
    <div className='max-w-4xl mx-auto pb-12 animate-in fade-in duration-300'>
      <div className='flex flex-wrap justify-between gap-3 mb-8'>
        <p className='text-slate-900 text-4xl font-black leading-tight tracking-tight'>
          Create New Task
        </p>
      </div>

      <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8'>
        {/* Task Details Section */}
        <div className='space-y-6'>
          <h2 className='text-xl font-bold text-slate-900'>Task Details</h2>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='title'
              className='text-slate-900 text-base font-medium'
            >
              Task Title
            </Label>
            <Input
              id='title'
              className='h-14 bg-slate-50 border-slate-300 focus:border-purple-600 focus:ring-purple-600/50'
              placeholder='e.g., IELTS Writing Task 2: Opinion Essay'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <p className='text-slate-900 text-base font-medium leading-normal pb-2'>
              Type
            </p>
            <div className='grid grid-cols-2 gap-4'>
              <label
                className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                  type === "WRITING"
                    ? "border-purple-600 bg-purple-50 ring-2 ring-purple-600/20"
                    : "border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input
                  type='radio'
                  name='task_type'
                  value='WRITING'
                  checked={type === "WRITING"}
                  onChange={() => setType("WRITING")}
                  className='w-4 h-4 text-purple-600 focus:ring-purple-600'
                />
                <span className='font-medium text-slate-900'>Writing Task</span>
              </label>
              <label
                className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                  type === "SPEAKING"
                    ? "border-purple-600 bg-purple-50 ring-2 ring-purple-600/20"
                    : "border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input
                  type='radio'
                  name='task_type'
                  value='SPEAKING'
                  checked={type === "SPEAKING"}
                  onChange={() => setType("SPEAKING")}
                  className='w-4 h-4 text-purple-600 focus:ring-purple-600'
                />
                <span className='font-medium text-slate-900'>
                  Speaking Task
                </span>
              </label>
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='description'
              className='text-slate-900 text-base font-medium'
            >
              Description
            </Label>
            <textarea
              id='description'
              className='w-full rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/50 border border-slate-300 bg-slate-50 focus:border-purple-600 min-h-[144px] placeholder:text-slate-400 p-4 text-base resize-y'
              placeholder="Provide an overview of the task's purpose and learning goals..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='instructions'
              className='text-slate-900 text-base font-medium'
            >
              Instructions
            </Label>
            <textarea
              id='instructions'
              className='w-full rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/50 border border-slate-300 bg-slate-50 focus:border-purple-600 min-h-[144px] placeholder:text-slate-400 p-4 text-base resize-y'
              placeholder='Add step-by-step instructions for the students...'
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* File Attachments */}
          <div className='flex flex-col gap-2'>
            <Label className='text-slate-900 text-base font-medium'>
              Attachments (Optional)
            </Label>
            <p className='text-sm text-slate-500 -mt-1'>
              Upload reference materials, rubrics, or example files for students
            </p>

            {/* Upload Area */}
            <label className='border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 hover:border-purple-400 transition-colors bg-slate-50/50'>
              <div className='w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center'>
                <Upload size={24} />
              </div>
              <div className='text-center'>
                <p className='text-sm font-medium text-slate-900'>
                  Click to upload or drag and drop
                </p>
                <p className='text-xs text-slate-500 mt-1'>
                  PDF, DOC, Images, Audio, Video (Max 10MB each)
                </p>
              </div>
              <input
                type='file'
                className='hidden'
                multiple
                accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp3,.wav,.mp4,.mov'
                onChange={handleFileUpload}
              />
            </label>

            {/* Uploaded Files List */}
            {attachments.length > 0 && (
              <div className='mt-3 space-y-2'>
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg group hover:border-purple-200 transition-colors'
                  >
                    <div className='flex items-center gap-3 min-w-0'>
                      <span className='text-xl'>{getFileIcon(file.name)}</span>
                      <div className='min-w-0'>
                        <p className='text-sm font-medium text-slate-900 truncate'>
                          {file.name}
                        </p>
                        <p className='text-xs text-slate-500'>
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={() => removeAttachment(index)}
                      className='p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors'
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Scoring Section */}
        <div className='space-y-6 pt-8 border-t border-slate-200'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold text-slate-900'>
              AI Automated Scoring & Feedback
            </h2>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                className='sr-only peer'
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              <span className='ml-3 text-sm font-medium text-slate-900'>
                Enable AI
              </span>
            </label>
          </div>

          <div
            className={`${
              !aiEnabled ? "opacity-50 pointer-events-none" : ""
            } space-y-6 transition-opacity`}
          >
            <div className='flex flex-col gap-2'>
              <Label
                htmlFor='aiPrompt'
                className='text-slate-900 text-base font-medium'
              >
                AI Evaluation Prompt
              </Label>
              <textarea
                id='aiPrompt'
                className='w-full rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/50 border border-slate-300 bg-slate-50 focus:border-purple-600 min-h-[144px] placeholder:text-slate-400 p-4 text-base resize-y'
                placeholder="Describe how the AI should evaluate student submissions. For example: 'As an IELTS examiner, assess this writing task based on coherence, vocabulary, and grammar...'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>

            <div>
              <p className='text-slate-900 text-base font-medium leading-normal pb-2'>
                Scoring Criteria
              </p>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {[
                  "Grammar",
                  "Vocabulary",
                  "Coherence",
                  "Fluency",
                  "Task Achievement",
                ].map((crit) => (
                  <label
                    key={crit}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      criteria.includes(crit)
                        ? "border-purple-600 bg-purple-50"
                        : "border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type='checkbox'
                      className='w-4 h-4 text-purple-600 rounded focus:ring-purple-600'
                      checked={criteria.includes(crit)}
                      onChange={() => toggleCriteria(crit)}
                    />
                    <span className='text-sm font-medium text-slate-900'>
                      {crit}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className='flex flex-col gap-2'>
              <Label
                htmlFor='tone'
                className='text-slate-900 text-base font-medium'
              >
                AI Feedback Tone
              </Label>
              <select
                id='tone'
                className='w-full rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/50 border border-slate-300 bg-slate-50 focus:border-purple-600 h-14 px-4 text-base appearance-none cursor-pointer'
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option>Formal & Encouraging</option>
                <option>Direct & Concise</option>
                <option>In-depth & Analytical</option>
                <option>Custom Template...</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scheduling Section */}
        <div className='space-y-6 pt-8 border-t border-slate-200'>
          <h2 className='text-xl font-bold text-slate-900'>
            Scheduling & Assignment
          </h2>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='dueDate'
              className='text-slate-900 text-base font-medium'
            >
              Deadline
            </Label>
            <div className='relative'>
              <Calendar
                className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400'
                size={20}
              />
              <input
                id='dueDate'
                type='date'
                className='w-full rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/50 border border-slate-300 bg-slate-50 focus:border-purple-600 h-14 placeholder:text-slate-400 pl-12 pr-4 text-base'
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='classSelect'
              className='text-slate-900 text-base font-medium'
            >
              Assign Class(es)
            </Label>
            
            {/* Custom Multi-Select Dropdown */}
            <div className='relative'>
              <div
                className='w-full min-h-[56px] px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-600/50 cursor-pointer flex items-center justify-between'
                onClick={() => setIsClassOpen(!isClassOpen)}
              >
                <div className="flex flex-wrap gap-1">
                  {selectedClassIds.length === 0 ? (
                    <span className="text-slate-500 text-base font-normal px-1">Select classes...</span>
                  ) : selectedClassIds.length === classes.length ? (
                    <span className="text-slate-900 text-base font-normal px-1">All {classes.length} classes selected</span>
                  ) : (
                    <span className="text-slate-900 text-base font-normal px-1">{selectedClassIds.length} classes selected</span>
                  )}
                </div>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              </div>

              {isClassOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsClassOpen(false)} 
                  />
                  <div className='absolute z-20 w-full mt-2 bg-white rounded-md border border-slate-200 shadow-lg animate-in fade-in zoom-in-95 duration-100'>
                    <div className="p-2 border-b border-slate-100">
                      <div className="flex items-center px-2 bg-slate-50 rounded-md border border-slate-200">
                         <Search className="h-4 w-4 text-slate-400 mr-2" />
                         <input 
                           className="flex-1 bg-transparent border-none focus:ring-0 text-sm h-9 focus:outline-none"
                           placeholder="Search classes..."
                           onClick={(e) => e.stopPropagation()}
                         />
                      </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto p-1">
                      {isLoadingClasses && (
                        <p className="text-center text-sm text-slate-500 py-4">Loading classes...</p>
                      )}
                      
                      {!isLoadingClasses && classes.length > 0 && (
                        <div
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 cursor-pointer text-sm"
                          onClick={() => toggleSelectAllClasses()}
                        >
                          <div
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-sm border border-slate-400",
                              selectedClassIds.length === classes.length
                                ? "bg-purple-600 border-purple-600"
                                : ""
                            )}
                          >
                             {selectedClassIds.length === classes.length && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className="font-medium text-slate-700">Select All</span>
                        </div>
                      )}

                      {classes.map((cls) => {
                        const isSelected = selectedClassIds.includes(cls.id);
                        return (
                          <div
                            key={cls.id}
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 cursor-pointer text-sm"
                            onClick={() => toggleClassSelection(cls.id)}
                          >
                            <div
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border border-slate-400",
                                isSelected
                                  ? "bg-purple-600 border-purple-600"
                                  : ""
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className="text-slate-700">{cls.name}</span>
                            <span className="text-xs text-slate-400">
                              ({cls.learnerCount || 0} students)
                            </span>
                          </div>
                        );
                      })}
                      
                      {classes.length === 0 && (
                        <p className="text-center text-sm text-slate-500 py-4">No classes found.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex justify-end gap-4 pt-8 border-t border-slate-200'>
          <Button
            variant='ghost'
            onClick={handleCancel}
            className='px-6 py-3 h-auto rounded-lg text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200'
          >
            Cancel
          </Button>
          <Button
            variant='ghost'
            className='px-6 py-3 h-auto rounded-lg text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200'
          >
            Save as Draft
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title || selectedClassIds.length === 0}
            className='px-6 py-3 h-auto rounded-lg text-white font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200'
          >
            Create Task
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CreateTaskPage;
