import { useState } from "react";
import { useNavigate } from "react-router";
import {
  PlusCircle,
  UserPlus,
  Eye,
  Edit3,
  Trash2,
  Clock,
  Calendar,
  Upload,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";
import { ROUTES } from "@/constants";
import {
  mockClasses,
  mockStudents,
  mockPendingReviews,
  mockAssignments,
} from "@/data";

export function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classes] = useState(mockClasses);
  const [students] = useState(mockStudents);
  const [pendingReviews] = useState(mockPendingReviews);
  const [assignments] = useState(mockAssignments);

  const handleStartCreate = () => {
    navigate(ROUTES.TEACHER.CREATE_TASK);
  };

  const handleSelectStudent = (studentId: string) => {
    console.log("Select student:", studentId);
  };

  const handleViewFullFeedback = (submissionId: string) => {
    console.log("View feedback:", submissionId);
  };

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
              {classes.length > 0 ? (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className='shrink-0 w-64 flex flex-col gap-3 rounded-xl bg-white border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer'
                  >
                    <div
                      className='w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg'
                      style={{ backgroundImage: `url('${cls.image}')` }}
                    />
                    <div className='flex flex-col flex-1 justify-between gap-3'>
                      <div>
                        <p className='text-base font-medium leading-normal text-slate-900 truncate'>
                          {cls.name}
                        </p>
                        <p className='text-slate-500 text-sm font-normal'>
                          {cls.studentIds.length} Students
                        </p>
                      </div>
                      <div className='w-full bg-slate-100 rounded-full h-1.5'>
                        <div
                          className='bg-purple-600 h-1.5 rounded-full'
                          style={{ width: `${cls.progress}%` }}
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
              <Button className='flex items-center justify-center gap-2 rounded-lg h-9 px-3 bg-purple-600 text-white text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-purple-700 transition-colors'>
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
                    {students.map((student) => (
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
                              {!student.avatar && student.name[0]}
                            </div>
                            <span>{student.name}</span>
                          </div>
                        </td>
                        <td className='px-6 py-4 text-slate-500'>
                          {
                            classes.filter((c) =>
                              c.studentIds.includes(student.id)
                            ).length
                          }
                        </td>
                        <td className='px-6 py-4 text-right'>
                          <div className='flex justify-end items-center gap-2'>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectStudent(student.id);
                              }}
                              className='flex items-center justify-center size-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-purple-600'
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className='flex items-center justify-center size-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600'
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className='flex items-center justify-center size-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600'
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
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
              <div className='overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                  <thead className='bg-slate-50 text-xs uppercase text-slate-500'>
                    <tr>
                      <th className='px-6 py-3 font-medium'>Student Name</th>
                      <th className='px-6 py-3 font-medium'>Task Title</th>
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
                          <td className='px-6 py-4 font-medium text-slate-900'>
                            {sub.studentName}
                          </td>
                          <td className='px-6 py-4 text-slate-600'>
                            {sub.assignmentTitle}
                          </td>
                          <td className='px-6 py-4 text-slate-500'>
                            {new Date(sub.submittedAt).toLocaleDateString()}
                          </td>
                          <td className='px-6 py-4 text-right'>
                            <button
                              onClick={() => handleViewFullFeedback(sub.id)}
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
                          colSpan={4}
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
                  {/* Progress Circle */}
                  <div className='relative w-32 h-32 shrink-0'>
                    <svg
                      className='w-full h-full transform -rotate-90'
                      viewBox='0 0 36 36'
                    >
                      <circle
                        className='text-slate-100'
                        strokeWidth='3'
                        stroke='currentColor'
                        fill='none'
                        r='16'
                        cx='18'
                        cy='18'
                      />
                      <circle
                        className='text-purple-600'
                        strokeWidth='3'
                        strokeDasharray='100'
                        strokeDashoffset='15'
                        strokeLinecap='round'
                        stroke='currentColor'
                        fill='none'
                        r='16'
                        cx='18'
                        cy='18'
                      />
                    </svg>
                    <div className='absolute inset-0 flex flex-col items-center justify-center'>
                      <span className='text-2xl font-bold text-slate-900'>
                        85%
                      </span>
                      <span className='text-xs text-slate-500 font-medium'>
                        Complete
                      </span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className='flex-1 flex flex-col gap-3 text-sm w-full'>
                    <div className='flex items-center gap-3'>
                      <span className='w-2.5 h-2.5 rounded-full bg-purple-600' />
                      <span className='font-medium text-slate-700'>
                        Completed: 120
                      </span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <span className='w-2.5 h-2.5 rounded-full bg-amber-400' />
                      <span className='font-medium text-slate-700'>
                        In Progress: 15
                      </span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <span className='w-2.5 h-2.5 rounded-full bg-red-500' />
                      <span className='font-medium text-slate-700'>
                        Overdue: 6
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
                    {assignments.length}
                  </p>
                </CardContent>
              </Card>
              <Card className='col-span-2 border-slate-200 shadow-sm'>
                <CardContent className='p-4'>
                  <p className='text-sm text-slate-500 font-medium'>
                    Average Grade
                  </p>
                  <p className='text-2xl font-bold text-emerald-500 mt-1'>
                    88%
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
              <div className='flex items-start gap-3 rounded-lg p-3 bg-white border border-slate-200'>
                <div className='shrink-0 size-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center'>
                  <Clock size={16} />
                </div>
                <div>
                  <p className='text-sm font-medium text-slate-900'>
                    Final Paper Submission
                  </p>
                  <p className='text-xs text-slate-500'>Due in 2 days</p>
                </div>
              </div>
              <div className='flex items-start gap-3 rounded-lg p-3 bg-white border border-slate-200'>
                <div className='shrink-0 size-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center'>
                  <Calendar size={16} />
                </div>
                <div>
                  <p className='text-sm font-medium text-slate-900'>
                    Peer Review Session
                  </p>
                  <p className='text-xs text-slate-500'>Due in 5 days</p>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className='text-xl font-bold leading-tight tracking-tight mb-4 text-slate-900'>
              Recent Activity
            </h2>
            <div className='flex flex-col gap-4'>
              <div className='flex items-start gap-3'>
                <div className='shrink-0 size-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center'>
                  <Upload size={16} />
                </div>
                <div>
                  <p className='text-sm text-slate-800'>
                    <span className='font-semibold'>Jane Doe</span> submitted
                    'Essay 1'
                  </p>
                  <p className='text-xs text-slate-500 mt-0.5'>
                    15 minutes ago
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className='shrink-0 size-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center'>
                  <UserPlus size={16} />
                </div>
                <div>
                  <p className='text-sm text-slate-800'>
                    <span className='font-semibold'>New student</span> enrolled
                    in 'English 101'
                  </p>
                  <p className='text-xs text-slate-500 mt-0.5'>1 hour ago</p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className='shrink-0 size-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center'>
                  <Upload size={16} />
                </div>
                <div>
                  <p className='text-sm text-slate-800'>
                    <span className='font-semibold'>Carlos Ray</span> submitted
                    'Speaking Practice'
                  </p>
                  <p className='text-xs text-slate-500 mt-0.5'>3 hours ago</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
