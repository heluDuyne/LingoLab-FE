import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/stores";
import { TaskCard } from "@/components/student";
import { ROUTES } from "@/constants";
import { attemptApi } from "@/services/api/attempts";
import { BadgeStatus } from "@/components/ui/badge-status";
import { Clock } from "lucide-react";

// Types
type TaskFilter = "ALL" | "TODO" | "SUBMITTED" | "SCORED";

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("ALL");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load assignments and recent activity
  useEffect(() => {
    const loadData = async () => {
      try {
        const { assignmentApi } = await import("@/services/api/assignments");
        const [assignmentsRes, activityRes] = await Promise.all([
             assignmentApi.getMyAssignments(50, 0),
             user?.id ? attemptApi.getAttemptsByLearner(user.id, 5) : Promise.resolve({ data: [] })
        ]);

        setAssignments(assignmentsRes.data);
        setRecentActivity(activityRes.data || []);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) {
        loadData();
    }
  }, [user?.id]);

  // Filter assignments based on selected tab
  const filteredAssignments = assignments.filter((assignment) => {
    if (taskFilter === "TODO") return !assignment.submissionStatus || assignment.submissionStatus === "PENDING";
    if (taskFilter === "SUBMITTED") return (assignment.submissionStatus && assignment.submissionStatus !== "PENDING") && !assignment.score;
    if (taskFilter === "SCORED") return (assignment.submissionStatus === "SCORED" || assignment.submissionStatus === "GRADED") || (assignment.score !== undefined && assignment.score !== null);
    return true;
  });

  // Get upcoming deadlines
  const upcomingDeadlines = [...assignments]
    .filter((a) => !a.submissionStatus || a.submissionStatus === "PENDING")
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  const handleTaskAction = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    
    const type = assignment?.type?.toUpperCase();
    const status = assignment.submissionStatus?.toLowerCase();
    const isSubmittedOrGraded = status === "submitted" || status === "scored" || status === "graded" || (assignment.score !== undefined && assignment.score !== null);
    
    if (type === "SPEAKING") {
        if (isSubmittedOrGraded) {
             navigate(ROUTES.LEARNER.SPEAKING_EVALUATION.replace(":assignmentId", assignmentId));
        } else {
             navigate(ROUTES.LEARNER.SPEAKING_SUBMISSION.replace(":assignmentId", assignmentId));
        }
    } else {
        // Writing Task
        if (isSubmittedOrGraded) {
             navigate(ROUTES.LEARNER.WRITING_EVALUATION.replace(":assignmentId", assignmentId));
        } else {
             navigate(ROUTES.LEARNER.WRITING_SUBMISSION.replace(":assignmentId", assignmentId));
        }
    }
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

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
                { label: "Scored", value: "SCORED" },
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
                const status = assignment.submissionStatus?.toLowerCase();
                const isGraded = (status === "scored" || status === "graded") || (assignment.score !== undefined && assignment.score !== null);
                const isSubmitted = status === "submitted" || isGraded;

                return (
                  <TaskCard
                    key={assignment.id}
                    id={assignment.id}
                    title={assignment.title}
                    className={assignment.className}
                    dueDate={assignment.deadline}
                    image={undefined}
                    isGraded={isGraded}
                    isSubmitted={isSubmitted}
                    score={assignment.score}
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
                  const date = new Date(assignment.deadline);
                  const month = date
                    .toLocaleString("default", { month: "short" })
                    .toUpperCase();
                  const day = date.getDate();
                  const daysUntil = Math.ceil(
                    (date.getTime() - Date.now()) / (1000 * 3600 * 24)
                  );
                  
                  let deadlineText = `Due in ${daysUntil} days`;
                  let deadlineColor = "text-slate-500";
                  
                  if (daysUntil < 0) {
                    deadlineText = `Overdue by ${Math.abs(daysUntil)} days`;
                    deadlineColor = "text-red-500 font-medium";
                  } else if (daysUntil === 0) {
                    deadlineText = "Due Today";
                    deadlineColor = "text-amber-600 font-medium";
                  }

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
                        <p className={`text-xs ${deadlineColor}`}>
                          {deadlineText}
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

          {/* Recent Activity */}
          <section>
             <h3 className='text-lg font-bold text-slate-900 mb-4'>
               Recent Activity
             </h3>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                 {recentActivity.length > 0 ? (
                     recentActivity.map((attempt) => {
                         // Fix status check to handle potential casing mismatch, but prefer lowercase as per backend
                         const statusLower = attempt.status.toLowerCase();
                         const isSubmitted = ['submitted', 'scored'].includes(statusLower);
                         const isPastDue = !isSubmitted && attempt.deadline && new Date(attempt.deadline) < new Date();
                         
                         let statusLabel = attempt.status;
                         let badgeVariant: 'default' | 'outline' | 'secondary' | 'error' | 'success' | 'warning' | 'info' = 'info';
                         
                         if (isSubmitted) {
                             badgeVariant = 'success';
                             // statusLabel remains as is (e.g. SUBMITTED or SCORED)
                         } else if (isPastDue) {
                             badgeVariant = 'error';
                             statusLabel = 'PAST DUE';
                         } else {
                             badgeVariant = 'info';
                             statusLabel = 'IN PROGRESS';
                         }

                         return (
                         <div key={attempt.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                             <div className={`p-2 rounded-full ${isSubmitted ? 'bg-green-100 text-green-600' : isPastDue ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                 <Clock size={16} />
                             </div>
                             <div>
                                 <p className="text-sm font-bold text-slate-900 line-clamp-1">
                                    {attempt.title || "Untitled Task"}
                                 </p>
                                 <p className="text-xs text-slate-500 mb-1">
                                     {attempt.skillType === 'writing' ? 'Writing Task' : 'Speaking Task'}
                                 </p>
                                 <div className="flex items-center gap-2">
                                    <BadgeStatus variant={badgeVariant}>
                                        {statusLabel.toUpperCase().replace('_', ' ')}
                                    </BadgeStatus>
                                    <span className="text-xs text-slate-500">
                                        {new Date(attempt.updatedAt || attempt.submittedAt || attempt.createdAt).toLocaleDateString()}
                                    </span>
                                 </div>
                             </div>
                         </div>
                         );
                     })
                 ) : (
                     <p className="text-slate-500 text-sm text-center">No recent activity.</p>
                 )}
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
