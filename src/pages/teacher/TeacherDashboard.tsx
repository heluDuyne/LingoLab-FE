
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  PlusCircle,
  UserPlus,
  Eye,
  Ban,
  ShieldCheck,
  Trash2,
  Clock,
  Upload,
} from "lucide-react";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores";
import { ROUTES } from "@/constants";
import { classApi } from "@/services/api/classes";
import { userApi } from "@/services/api/users";
import { assignmentApi } from "@/services/api/assignments";
import { attemptApi } from "@/services/api/attempts"; // 1. Import attemptApi
import type { ClassList, User } from "@/types";


export function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<ClassList[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]); // 3. Change pendingReviews state type
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({ open: false, title: "", description: "", action: () => {} });

  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);

  const [assignmentStats, setAssignmentStats] = useState({
    completed: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0,
    totalExpected: 0,
    speakingAvg: 0,
    writingAvg: 0
  });

  const fetchData = async () => {
    if (user?.id) {
      try {
        setIsLoadingClasses(true);
        const classRes = await classApi.getClassesByTeacher(user.id);
        setClasses(classRes.data || []);
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      } finally {
        setIsLoadingClasses(false);
      }

      // Fetch assignments for deadlines and stats
      try {
        const assignmentRes = await assignmentApi.getTeacherAssignments(50, 0); // Fetch top 50
        const allAssignments = assignmentRes.data || [];

        // Stats Calculation
        let completed = 0;
        let pending = 0;
        let overdue = 0;
        let totalExpected = 0;
        const now = new Date();

        allAssignments.forEach((a) => {
            const enrolled = a.totalEnrolled || 0;
            const submitted = a.totalSubmitted || 0;
            const remaining = Math.max(0, enrolled - submitted);
            // Check if assignment is past due
            const isPastDue = new Date(a.deadline) < now;

            totalExpected += enrolled;
            completed += submitted;

            if (remaining > 0) {
                if (isPastDue) {
                    overdue += remaining;
                } else {
                    pending += remaining;
                }
            }
        });

        // Calculate Average Grades by Skill
        const speakingTasks = allAssignments.filter(a => (a.type || "").toUpperCase() === 'SPEAKING' && a.totalScored > 0);
        const writingTasks = allAssignments.filter(a => (a.type || "").toUpperCase() === 'WRITING' && a.totalScored > 0);

        const calculateWeightedAvg = (tasks: any[]) => {
             if (tasks.length === 0) return 0;
             const totalScoreSum = tasks.reduce((sum, t) => sum + (Number(t.averageScore) * t.totalScored), 0);
             const totalWeight = tasks.reduce((sum, t) => sum + t.totalScored, 0);
             return totalWeight > 0 ? (totalScoreSum / totalWeight).toFixed(1) : 0;
        };

        const speakingAvg = calculateWeightedAvg(speakingTasks);
        const writingAvg = calculateWeightedAvg(writingTasks);

        const rate = totalExpected > 0 ? Math.round((completed / totalExpected) * 100) : 0;
        setAssignmentStats({
            completed,
            pending,
            overdue,
            completionRate: rate,
            totalExpected,
            speakingAvg: Number(speakingAvg),
            writingAvg: Number(writingAvg)
        });
        
        // Filter for upcoming deadlines (future dates)
        const futureAssignments = allAssignments.filter(a => new Date(a.deadline) > now);
        // Sort by deadline asc
        futureAssignments.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
        setUpcomingDeadlines(futureAssignments.slice(0, 5));

      } catch (error) {
          console.error("Failed to fetch assignments:", error);
      }

      try {
          setIsLoadingStudents(true);
          const studentRes = await userApi.getLearners();
          setStudents((studentRes.data || []).slice(0, 5)); 
      } catch (error) {
          console.error("Failed to fetch students:", error);
      } finally {
          setIsLoadingStudents(false);
      }
      
      try {
        // Fetch pending reviews
        const attemptsRes = await attemptApi.getPendingTeacherAttempts(50, 0);
        setPendingReviews(attemptsRes.data || [])
      } catch (error) {
        console.error("Failed to fetch pending reviews:", error);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleStartCreate = () => {
    navigate(ROUTES.TEACHER.CREATE_TASK);
  };

  const handleSelectStudent = (studentId: string) => {
    navigate(ROUTES.TEACHER.STUDENT_DETAIL.replace(":studentId", studentId));
  };

  
  const handleViewFullFeedback = (attemptId: string, skillType?: string) => {
    console.log("Navigating to grade:", attemptId, "Skill:", skillType); // Debug log
    if (!attemptId) {
        console.error("Missing attemptId for navigation");
        return;
    }
    
    if (skillType?.toUpperCase() === "SPEAKING") {
        navigate(`/teacher/grading/speaking/${attemptId}`);
    } else {
        navigate(ROUTES.TEACHER.GRADING.replace(":attemptId", attemptId));
    }
  };

  const handleLockStudent = async (studentId: string, studentName: string) => {
    setConfirmDialog({
      open: true,
      title: "Ban Student Account",
      description: `Are you sure you want to ban ${studentName}? They will be signed out immediately and unable to access the system until unbanned.`,
      action: async () => {
        try {
          await userApi.lockUser(studentId);
          alert(`${studentName} has been banned successfully.`);
          fetchData();
        } catch (error: any) {
          const message = error.response?.data?.message || "Failed to ban student";
          if (error.response?.status === 403) {
            alert("Permission denied. You are not authorized to ban students.");
          } else {
            alert(message);
          }
        }
      },
    });
  };

  const handleUnlockStudent = async (studentId: string, studentName: string) => {
    setConfirmDialog({
      open: true,
      title: "Unban Student Account",
      description: `Are you sure you want to unban ${studentName}? They will be able to access the system again.`,
      action: async () => {
        try {
          await userApi.unlockUser(studentId);
          alert(`${studentName} has been unbanned successfully.`);
          fetchData();
        } catch (error: any) {
          const message = error.response?.data?.message || "Failed to unban student";
          if (error.response?.status === 403) {
            alert("Permission denied. You are not authorized to unban students.");
          } else {
            alert(message);
          }
        }
      },
    });
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Student Account",
      description: `Are you sure you want to permanently delete ${studentName}? This action cannot be undone and will remove all their data, including attempts and scores.`,
      action: async () => {
        try {
          await userApi.deleteUser(studentId);
          alert(`${studentName} has been deleted successfully.`);
          fetchData();
        } catch (error: any) {
          const message = error.response?.data?.message || "Failed to delete student";
          if (error.response?.status === 403) {
            alert("Permission denied. You are not authorized to delete students.");
          } else if (error.response?.data?.error === "Foreign key constraint failed") {
             alert("Cannot delete student because they have related data (feedbacks, etc) that cannot be automatically removed. Please contact admin.");
          } else {
            alert(message);
          }
        }
      },
    });
  };
  
  const getStudentName = (student: User) => {
      if (student.firstName && student.lastName) return `${student.firstName} ${student.lastName}`;
      if (student.name) return student.name;
      return student.email.split('@')[0];
  }

  const getDueText = (dateStr: string) => {
      const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 3600 * 24));
      if (days < 0) return `Overdue by ${Math.abs(days)} days`;
      if (days === 0) return "Due today";
      return `Due in ${days} days`;
  };

  const getSubmittedText = (dateStr: string) => {
      const date = new Date(dateStr);
      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHours > 0) return `${diffHours}h ago`;
      return "Just now";
  };

  // Pie Chart Data
  const pieData = [
    { name: 'Completed', value: assignmentStats.completed, color: '#9333ea' }, // purple-600
    { name: 'In Progress', value: assignmentStats.pending, color: '#fbbf24' }, // amber-400
    { name: 'Overdue', value: assignmentStats.overdue, color: '#ef4444' },     // red-500
  ].filter(d => d.value > 0);

  return (
    <div className='flex flex-col animate-in fade-in duration-300'>
      {/* Header */}
      <div className='flex flex-wrap justify-between gap-4 items-center mb-8'>
        <div className='flex flex-col gap-1'>
          <p className='text-3xl font-bold leading-tight tracking-tight text-slate-900'>
            Welcome back, {user?.name?.split(" ")[0] || "Teacher"}!
          </p>
          <p className='text-slate-500 text-base font-normal leading-normal'>
            Here's a summary of your courses and tasks.
          </p>
        </div>
        <Button
          onClick={handleStartCreate}
          className='flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-purple-600 text-white text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-purple-700 transition-colors shadow-purple-200'
        >
          <PlusCircle size={18} />
          <span className='truncate'>Create New Task</span>
        </Button>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
        {/* Main Content Column */}
        <div className='col-span-1 xl:col-span-2 space-y-8'>
          {/* My Courses */}
          <section>
            <h2 className='text-xl font-bold leading-tight tracking-tight mb-4 text-slate-900'>
              My Courses
            </h2>
            <div
              className='flex overflow-x-auto pb-4 gap-4 scrollbar-none'
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {isLoadingClasses ? (
                <p className='text-slate-400 italic'>Loading courses...</p>
              ) : classes.length > 0 ? (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className='shrink-0 w-64 flex flex-col gap-3 rounded-xl bg-white border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer'
                    onClick={() => navigate(ROUTES.TEACHER.CLASSES, { state: { classId: cls.id } })}
                  >
                    <div
                      className='w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg bg-slate-100 flex items-center justify-center'
                    >
                        <span className="text-3xl">📚</span>
                    </div>
                    <div className='flex flex-col flex-1 justify-between gap-3'>
                      <div>
                        <p className='text-base font-medium leading-normal text-slate-900 truncate'>
                          {cls.name}
                        </p>
                        <p className='text-slate-500 text-sm font-normal'>
                          {cls.code || "No Code"}
                        </p>
                      </div>
                      <div className='w-full bg-slate-100 rounded-full h-1.5'>
                        <div
                          className='bg-purple-600 h-1.5 rounded-full'
                          style={{ width: `0%` }} 
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className='text-slate-400 italic'>No courses created yet.</p>
              )}
            </div>
          </section>

          {/* Student Management Preview */}
          <section>
            <div className='flex flex-wrap justify-between items-center gap-4 mb-4'>
              <h2 className='text-xl font-bold leading-tight tracking-tight text-slate-900'>
                Student Management
              </h2>
              <Button 
                onClick={() => navigate(ROUTES.TEACHER.ADD_STUDENT)}
                className='flex items-center justify-center gap-2 rounded-lg h-9 px-3 bg-purple-600 text-white text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-purple-700 transition-colors'
              >
                <UserPlus size={18} />
                <span>Add Student</span>
              </Button>
            </div>
            <div className='w-full rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden'>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                  <thead className='bg-slate-50 text-xs uppercase text-slate-500'>
                    <tr>
                      <th className='px-6 py-3 font-medium'>Student Name</th>
                      <th className='px-6 py-3 font-medium'>
                        Courses Enrolled
                      </th>
                      <th className='px-6 py-3 font-medium text-right'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100'>
                    {isLoadingStudents ? (
                         <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">Loading students...</td></tr>
                    ) : students.length > 0 ? (
                    students.map((student) => {
                        const studentName = getStudentName(student);
                        return (
                      <tr
                        key={student.id}
                        className='hover:bg-slate-50 transition-colors cursor-pointer'
                        onClick={() => handleSelectStudent(student.id)}
                      >
                        <td className='px-6 py-4 font-medium whitespace-nowrap text-slate-900'>
                          <div className='flex items-center gap-3'>
                            <div
                              className='size-8 rounded-full bg-cover bg-center bg-purple-100 flex items-center justify-center text-purple-600 font-bold'
                              style={{
                                backgroundImage: student.avatar
                                  ? `url('${student.avatar}')`
                                  : undefined,
                              }}
                            >
                              {!student.avatar && studentName[0]}
                            </div>
                            <span>{studentName}</span>
                          </div>
                        </td>
                        <td className='px-6 py-4 text-slate-500'>
                          {student.enrolledClass || "Not enrolled yet"}
                        </td>
                        <td className='px-6 py-4 text-right'>
                          <div className='flex justify-end items-center gap-2'>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectStudent(student.id);
                              }}
                              className='flex items-center justify-center size-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-purple-600'
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            {student.status === 'locked' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnlockStudent(student.id, studentName);
                                }}
                                className='flex items-center justify-center size-8 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600'
                                title="Unban Student"
                              >
                                <ShieldCheck size={18} />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLockStudent(student.id, studentName);
                                }}
                                className='flex items-center justify-center size-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600'
                                title="Ban Student"
                              >
                                <Ban size={18} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStudent(student.id, studentName);
                              }}
                              className='flex items-center justify-center size-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600'
                              title="Delete Student"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})) : (
                      <tr>
                        <td
                          colSpan={3}
                          className='px-6 py-8 text-center text-slate-400'
                        >
                          No students found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Pending Reviews */}
          <section>
            <h2 className='text-xl font-bold leading-tight tracking-tight mb-4 text-slate-900'>
              Pending Reviews
            </h2>
            <div className='w-full rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden'>
              <div className='overflow-x-auto max-h-96 overflow-y-auto'>
                <table className='w-full text-sm text-left relative'>
                  <thead className='bg-slate-50 text-xs uppercase text-slate-500 sticky top-0 z-10 shadow-sm'>
                    <tr>
                      <th className='px-6 py-3 font-medium'>Student</th>
                      <th className='px-6 py-3 font-medium'>Class</th>
                      <th className='px-6 py-3 font-medium'>Task Name</th>
                      <th className='px-6 py-3 font-medium'>Submitted</th>
                      <th className='px-6 py-3 font-medium'></th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100'>
                    {pendingReviews.length > 0 ? (
                      pendingReviews.map((sub) => (
                        <tr
                          key={sub.id}
                          className='hover:bg-slate-50 transition-colors'
                        >
                          <td className='px-6 py-4'>
                             <div className="flex flex-col">
                                <span className="font-medium text-slate-900">{sub.studentName}</span>
                                <span className="text-xs text-slate-500">{sub.studentEmail}</span>
                             </div>
                          </td>
                          <td className='px-6 py-4 text-slate-600'>
                            {sub.className}
                          </td>
                          <td className='px-6 py-4 text-slate-600 font-medium'>
                            {sub.assignmentTitle}
                          </td>
                          <td className='px-6 py-4 text-slate-500'>
                            {getSubmittedText(sub.submittedAt)}
                          </td>
                          <td className='px-6 py-4 text-right'>
                            <button
                              onClick={() => handleViewFullFeedback(sub.id, sub.skillType)}
                              className='rounded-lg h-8 px-3 bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors'
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className='px-6 py-8 text-center text-slate-400'
                        >
                          No pending reviews.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Student Progress Overview */}
          <section>
            <h2 className='text-xl font-bold leading-tight tracking-tight mb-4 text-slate-900'>
              Student Progress Overview
            </h2>
            <Card className='border-slate-200 shadow-sm'>
              <CardContent className='p-6'>
                <h3 className='font-semibold mb-1 text-slate-900'>
                  Overall Task Completion Rate
                </h3>
                <p className='text-sm text-slate-500 mb-6'>
                  Across all active courses
                </p>
                <div className='flex flex-col sm:flex-row items-center gap-8'>
                  {/* Progress Circle (Recharts) */}
                  <div className='w-40 h-40 shrink-0'>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className='text-center -mt-24 pointer-events-none relative z-10'>
                          <span className='block text-xl font-bold text-slate-900'>{assignmentStats.completionRate}%</span>
                      </div>
                  </div>
                  
                  {/* Legend */}
                  <div className='flex-1 flex flex-col gap-3 text-sm w-full'>
                    <div className='flex items-center gap-3'>
                      <span className='w-2.5 h-2.5 rounded-full bg-purple-600' />
                      <span className='font-medium text-slate-700'>
                        Completed: {assignmentStats.completed}
                      </span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <span className='w-2.5 h-2.5 rounded-full bg-amber-400' />
                      <span className='font-medium text-slate-700'>
                        In Progress: {assignmentStats.pending}
                      </span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <span className='w-2.5 h-2.5 rounded-full bg-red-500' />
                      <span className='font-medium text-slate-700'>
                        Overdue: {assignmentStats.overdue}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className='col-span-1 space-y-8'>
          {/* Quick Stats */}
          <section>
            <h2 className='text-xl font-bold leading-tight tracking-tight mb-4 text-slate-900'>
              Quick Stats
            </h2>
            <div className='grid grid-cols-2 gap-4'>
              <Card className='border-slate-200 shadow-sm'>
                <CardContent className='p-4'>
                  <p className='text-sm text-slate-500 font-medium'>
                    Total Students
                  </p>
                  <p className='text-2xl font-bold text-slate-900 mt-1'>
                    {students.length}
                  </p>
                </CardContent>
              </Card>
              <Card className='border-slate-200 shadow-sm'>
                <CardContent className='p-4'>
                  <p className='text-sm text-slate-500 font-medium'>
                    Active Tasks
                  </p>
                  <p className='text-2xl font-bold text-slate-900 mt-1'>
                    {upcomingDeadlines.length}
                  </p>
                </CardContent>
              </Card>
              <Card className='border-slate-200 shadow-sm'>
                <CardContent className='p-4'>
                  <p className='text-sm text-slate-500 font-medium'>
                    Speaking Avg
                  </p>
                  <p className='text-2xl font-bold text-purple-600 mt-1'>
                    {assignmentStats.speakingAvg > 0 ? assignmentStats.speakingAvg : '--'}
                  </p>
                </CardContent>
              </Card>
              <Card className='border-slate-200 shadow-sm'>
                <CardContent className='p-4'>
                  <p className='text-sm text-slate-500 font-medium'>
                    Writing Avg
                  </p>
                  <p className='text-2xl font-bold text-blue-600 mt-1'>
                    {assignmentStats.writingAvg > 0 ? assignmentStats.writingAvg : '--'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Upcoming Deadlines */}
          <section>
            <h2 className='text-xl font-bold leading-tight tracking-tight mb-4 text-slate-900'>
              Upcoming Deadlines
            </h2>
            <div className='flex flex-col gap-3'>
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((item: any) => (
                  <div key={item.id} className='flex items-start gap-4 rounded-xl p-4 bg-white border border-slate-200 shadow-sm'>
                    <div className='shrink-0 size-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center'>
                      <Clock size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className='text-sm font-semibold text-slate-900 truncate'>
                        {item.title}
                      </p>
                      <p className='text-xs text-slate-500 mt-0.5'>{item.className || 'Class'}</p>
                    </div>
                    <div className="shrink-0 text-right">
                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            {getDueText(item.deadline)}
                        </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500 italic p-4 text-center bg-slate-50 rounded-lg">
                    No upcoming deadlines.
                </div>
              )}
            </div>
          </section>


        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open: boolean) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              className="text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                confirmDialog.action();
                setConfirmDialog({ ...confirmDialog, open: false });
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TeacherDashboard;
