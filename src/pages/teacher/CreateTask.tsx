import { useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, Search, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants";
import { toast } from "sonner";
import { mockClasses, type TaskType } from "@/data";

// Local type for creating new assignments with AI config
interface NewAssignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  type: TaskType;
  classId: string;
  points: number;
  dueDate: string;
  prompt: string;
  aiConfig: {
    enabled: boolean;
    evaluationPrompt: string;
    gradingCriteria: string[];
    tone: string;
  };
}

export function CreateTaskPage() {
  const navigate = useNavigate();

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
  const [selectedClassId, setSelectedClassId] = useState(
    mockClasses[0]?.id || ""
  );

  // File Upload State
  const [attachments, setAttachments] = useState<File[]>([]);

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

  const handleSave = () => {
    const newAssignment: NewAssignment = {
      id: Date.now().toString(),
      title,
      description,
      instructions,
      type,
      classId: selectedClassId,
      points: 100,
      dueDate:
        dueDate ||
        new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
      prompt: instructions,
      aiConfig: {
        enabled: aiEnabled,
        evaluationPrompt: aiPrompt,
        gradingCriteria: criteria,
        tone: tone,
      },
    };

    console.log("Created assignment:", newAssignment);
    toast.success("Task created successfully!");
    navigate(ROUTES.TEACHER.DASHBOARD);
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
              Assign Class
            </Label>
            <div className='relative'>
              <Search
                className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400'
                size={20}
              />
              <select
                id='classSelect'
                className='w-full rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/50 border border-slate-300 bg-slate-50 focus:border-purple-600 h-14 pl-12 pr-4 text-base appearance-none cursor-pointer'
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {mockClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
            disabled={!title}
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
