import { useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, MessageSquare, Lightbulb } from "lucide-react";
import { useAuthStore } from "@/stores";
import { TaskCard, FeedbackSidebar } from "@/components/student";
import { mockAssignments, mockSubmissions } from "@/data";

// Types
type TaskFilter = "ALL" | "TODO" | "SUBMITTED";

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("ALL");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);

  // Find selected submission and assignment for sidebar
  const selectedSubmission = mockSubmissions.find(
    (s) => s.id === selectedSubmissionId
  );
  const selectedAssignment = selectedSubmission
    ? mockAssignments.find((a) => a.id === selectedSubmission.assignmentId)
    : null;

  // Filter assignments based on selected tab
  const filteredAssignments = mockAssignments.filter((assignment) => {
    const sub = mockSubmissions.find(
      (s) => s.assignmentId === assignment.id && s.studentId === user?.id
    );
    if (taskFilter === "TODO") return !sub || sub.status === "PENDING";
    if (taskFilter === "SUBMITTED") return sub && sub.status !== "PENDING";
    return true;
  });

  // Get upcoming deadlines (tasks not yet submitted)
  const upcomingDeadlines = [...mockAssignments]
    .filter((a) => {
      const sub = mockSubmissions.find(
        (s) => s.assignmentId === a.id && s.studentId === user?.id
      );
      return !sub || sub.status === "PENDING";
    })
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
    .slice(0, 3);

  const handleTaskAction = (assignmentId: string) => {
    const assignment = mockAssignments.find((a) => a.id === assignmentId);
    const sub = mockSubmissions.find(
      (s) => s.assignmentId === assignmentId && s.studentId === user?.id
    );

    if (sub && (sub.status === "SUBMITTED" || sub.status === "GRADED")) {
      // Show feedback sidebar for submitted/graded tasks
      setSelectedSubmissionId(sub.id);
    } else if (assignment) {
      // Navigate to submission page based on task type
      if (assignment.type === "WRITING") {
        navigate(`/student/submit/writing/${assignmentId}`);
      } else if (assignment.type === "SPEAKING") {
        navigate(`/student/submit/speaking/${assignmentId}`);
      }
    }
  };

  return (
    <div className='relative'>
      <div className='grid grid-cols-12 gap-8'>
        {/* LEFT COLUMN */}
        <div className='col-span-12 lg:col-span-8 space-y-8'>
          <div className='flex flex-col gap-2'>
            <h1 className='text-3xl font-bold text-slate-900 leading-tight'>
              Welcome back, {user?.name?.split(" ")[0] || "Student"}!
            </h1>
            <p className='text-slate-500'>Here's your summary for today.</p>
          </div>

          <section>
            <div className='flex items-center justify-between pb-4 pt-2'>
              <h2 className='text-xl font-bold text-slate-900'>My Tasks</h2>
            </div>

            {/* Filter Tabs */}
            <div className='flex gap-2 mb-6 overflow-x-auto pb-2'>
              {[
                { label: "All Tasks", value: "ALL" },
                { label: "To Do", value: "TODO" },
                { label: "Submitted", value: "SUBMITTED" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setTaskFilter(tab.value as TaskFilter)}
                  className={`flex h-9 items-center px-4 rounded-lg text-sm font-medium transition-colors ${
                    taskFilter === tab.value
                      ? "bg-purple-100 text-purple-700"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tasks List */}
            <div className='space-y-4'>
              {filteredAssignments.map((assignment) => {
                const sub = mockSubmissions.find(
                  (s) =>
                    s.assignmentId === assignment.id && s.studentId === user?.id
                );
                const isGraded = sub?.status === "GRADED";
                const isSubmitted = sub?.status === "SUBMITTED";

                return (
                  <TaskCard
                    key={assignment.id}
                    id={assignment.id}
                    title={assignment.title}
                    className={assignment.className}
                    dueDate={assignment.dueDate}
                    image={assignment.image}
                    isGraded={isGraded}
                    isSubmitted={isSubmitted}
                    score={sub?.aiFeedback?.score}
                    onAction={handleTaskAction}
                  />
                );
              })}
              {filteredAssignments.length === 0 && (
                <div className='text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200'>
                  <p>No tasks found in this category.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (Widgets) */}
        <div className='col-span-12 lg:col-span-4 space-y-8'>
          {/* Upcoming Deadlines */}
          <section className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
            <h3 className='text-lg font-bold text-slate-900 mb-5'>
              Upcoming Deadlines
            </h3>
            <div className='space-y-5'>
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((assignment) => {
                  const date = new Date(assignment.dueDate);
                  const month = date
                    .toLocaleString("default", { month: "short" })
                    .toUpperCase();
                  const day = date.getDate();
                  const daysUntil = Math.ceil(
                    (date.getTime() - Date.now()) / (1000 * 3600 * 24)
                  );
                  return (
                    <div
                      key={assignment.id}
                      className='flex items-center gap-4'
                    >
                      <div className='flex flex-col items-center justify-center bg-purple-50 rounded-lg w-12 h-12 text-purple-700'>
                        <span className='text-[10px] font-bold leading-none'>
                          {month}
                        </span>
                        <span className='text-lg font-bold leading-none mt-0.5'>
                          {day}
                        </span>
                      </div>
                      <div className='overflow-hidden'>
                        <p className='font-semibold text-slate-900 truncate'>
                          {assignment.title}
                        </p>
                        <p className='text-xs text-slate-500'>
                          Due in {daysUntil} days
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className='text-slate-500 text-sm'>No upcoming deadlines.</p>
              )}
            </div>
          </section>

          {/* Course Progress */}
          <section>
            <h3 className='text-lg font-bold text-slate-900 mb-4'>
              Course Progress
            </h3>
            <div className='space-y-3'>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3'>
                <div className='flex justify-between items-center'>
                  <p className='font-semibold text-slate-900'>IELTS Writing</p>
                  <span className='text-xs font-bold text-slate-400'>75%</span>
                </div>
                <div className='w-full bg-slate-100 rounded-full h-2'>
                  <div
                    className='bg-purple-500 h-2 rounded-full'
                    style={{ width: "75%" }}
                  />
                </div>
              </div>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3'>
                <div className='flex justify-between items-center'>
                  <p className='font-semibold text-slate-900'>IELTS Speaking</p>
                  <span className='text-xs font-bold text-slate-400'>40%</span>
                </div>
                <div className='w-full bg-slate-100 rounded-full h-2'>
                  <div
                    className='bg-blue-400 h-2 rounded-full'
                    style={{ width: "40%" }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <h3 className='text-lg font-bold text-slate-900 mb-4'>
              Recent Activity
            </h3>
            <div className='space-y-4'>
              <div className='flex items-start gap-3'>
                <div className='bg-green-100 p-2 rounded-full text-green-600 shrink-0'>
                  <CheckCircle size={16} />
                </div>
                <div>
                  <p className='text-sm text-slate-800'>
                    Grade posted for{" "}
                    <span className='font-bold'>Writing Task 1</span>.
                  </p>
                  <p className='text-xs text-slate-400 mt-1'>2 hours ago</p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className='bg-blue-100 p-2 rounded-full text-blue-600 shrink-0'>
                  <MessageSquare size={16} />
                </div>
                <div>
                  <p className='text-sm text-slate-800'>
                    New comment on{" "}
                    <span className='font-bold'>Speaking Practice</span>.
                  </p>
                  <p className='text-xs text-slate-400 mt-1'>1 day ago</p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className='bg-amber-100 p-2 rounded-full text-amber-600 shrink-0'>
                  <Lightbulb size={16} />
                </div>
                <div>
                  <p className='text-sm text-slate-800'>
                    New tip:{" "}
                    <span className='font-bold'>Vocabulary expansion</span>.
                  </p>
                  <p className='text-xs text-slate-400 mt-1'>2 days ago</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* FEEDBACK SIDEBAR */}
      <FeedbackSidebar
        isOpen={!!(selectedSubmission && selectedAssignment)}
        onClose={() => setSelectedSubmissionId(null)}
        submissionId={selectedSubmission?.id}
        assignmentTitle={selectedAssignment?.title || ""}
        assignmentClassName={selectedAssignment?.className || ""}
        submissionStatus={selectedSubmission?.status || "PENDING"}
        submittedAt={selectedSubmission?.submittedAt}
        mediaType={selectedSubmission?.mediaType}
        aiFeedback={selectedSubmission?.aiFeedback}
      />
    </div>
  );
}

export default StudentDashboard;
