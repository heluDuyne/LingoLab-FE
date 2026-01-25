import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Plus,
  Eye,
  Ban,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROUTES } from "@/constants";
import { userApi } from "@/services/api/users";
import type { User } from "@/types";

export function StudentManagementPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({ open: false, title: "", description: "", action: () => {} });

  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await userApi.getLearners();
      setStudents(response.data || []);
    } catch (error) {
      console.error("Failed to fetch students", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(
    (student) => {
        const name = student.firstName ? `${student.firstName} ${student.lastName}` : (student.name || student.email.split('@')[0]);
        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    }
  );

  // Helper functions
  const getStudentName = (student: User) => {
      if (student.firstName && student.lastName) return `${student.firstName} ${student.lastName}`;
      if (student.name) return student.name;
      return student.email.split('@')[0];
  }

  const handleSelectStudent = (studentId: string) => {
    navigate(ROUTES.TEACHER.STUDENT_DETAIL.replace(":studentId", studentId));
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
          fetchStudents();
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
          fetchStudents();
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
          fetchStudents();
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

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-300 pb-12'>
      {/* Header */}
      <div className='flex flex-wrap justify-between items-center gap-4'>
        <div className='flex flex-col gap-1'>
          <p className='text-3xl font-bold text-slate-900'>
            Student Management
          </p>
          <p className='text-base font-normal text-slate-500'>
            Oversee and manage all your learners.
          </p>
        </div>
        <Button
          onClick={() => navigate(ROUTES.TEACHER.ADD_STUDENT)}
          className='inline-flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-purple-600 text-white text-sm font-bold leading-normal tracking-wide hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200'
        >
          <Plus size={20} />
          <span className='truncate'>Add New Student</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className='flex flex-col md:flex-row gap-4 w-full'>
        <div className='flex-1'>
          <div className='flex w-full items-center rounded-lg h-14 bg-white border border-slate-200 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent transition-shadow shadow-sm'>
            <div className='text-slate-400 flex items-center justify-center pl-4'>
              <Search size={20} />
            </div>
            <input
              className='flex w-full min-w-0 flex-1 rounded-lg text-slate-900 focus:outline-none border-none bg-transparent h-full placeholder:text-slate-400 pl-3 pr-4 text-sm font-medium'
              placeholder='Search by name or email...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className='flex gap-3'>
            {/* Filters placeholder */}
        </div>
      </div>

      {/* Table */}
      <div className='w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm text-left text-slate-500'>
            <thead className='text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200'>
              <tr>
                <th className='p-4 w-10'>
                  <input
                    type='checkbox'
                    className='rounded border-slate-300 text-purple-600 focus:ring-purple-600 w-4 h-4'
                  />
                </th>
                <th className='px-6 py-3 font-medium tracking-wider'>
                  Student Name
                </th>
                <th className='px-6 py-3 font-medium tracking-wider'>
                  Enrolled Class
                </th>
                <th className='px-6 py-3 font-medium tracking-wider'>
                  Last Active
                </th>
                <th className='px-6 py-3 font-medium text-right tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-8">Loading students...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className='text-center py-8 text-slate-400 italic'
                  >
                    No students found.
                  </td>
                </tr>
              ) : (filteredStudents.map((student) => {
                const studentName = getStudentName(student);
                const isLocked = student.status === 'locked';
                
                return (
                  <tr
                    key={student.id}
                    className='bg-white hover:bg-slate-50 transition-colors group cursor-pointer'
                    onClick={() => handleSelectStudent(student.id)}
                  >
                    <td className='p-4' onClick={(e) => e.stopPropagation()}>
                      <input
                        type='checkbox'
                        className='rounded border-slate-300 text-purple-600 focus:ring-purple-600 w-4 h-4'
                      />
                    </td>
                    <th className='px-6 py-4 font-medium text-slate-900 whitespace-nowrap'>
                      <div className='flex items-center gap-3'>
                        <div className='relative'>
                          {student.avatar ? (
                            <img
                              className={`w-10 h-10 rounded-full object-cover border ${
                                isLocked ? "border-amber-300 opacity-60" : "border-slate-200"
                              }`}
                              src={student.avatar}
                              alt={studentName}
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border ${
                                isLocked
                                  ? "bg-slate-100 text-slate-400 border-amber-300"
                                  : "bg-purple-100 text-purple-600 border-purple-200"
                              }`}
                            >
                              {studentName[0]}
                            </div>
                          )}
                        </div>
                        <div className='flex flex-col'>
                          <div className='flex items-center gap-2'>
                            <span className={`text-sm font-semibold ${isLocked ? "text-slate-500" : ""}`}>
                              {studentName}
                            </span>
                            {isLocked && (
                              <span className='inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700'>
                                Locked
                              </span>
                            )}
                          </div>
                          <span className='text-xs text-slate-500 font-normal'>
                            {student.email}
                          </span>
                        </div>
                      </div>
                    </th>
                    <td className='px-6 py-4 text-slate-600'>
                      {(student as any).enrolledClass || "-"}
                    </td>
                    <td className='px-6 py-4 text-slate-600'>
                        {(student as any).lastActiveAt ? new Date((student as any).lastActiveAt).toLocaleDateString() : "-"}
                    </td>
                    <td className='px-6 py-4 text-right'>
                      <div className='flex justify-end items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity'>
                        <button
                          className='p-2 rounded-md hover:bg-slate-100 text-slate-400 hover:text-purple-600 transition-colors'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectStudent(student.id);
                          }}
                          title='View details'
                        >
                          <Eye size={18} />
                        </button>
                        
                        {isLocked ? (
                          <button
                            className='p-2 rounded-md transition-colors text-amber-500 hover:bg-amber-50 hover:text-amber-600'
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlockStudent(student.id, studentName);
                            }}
                            title="Unban Student"
                          >
                            <ShieldCheck size={18} />
                          </button>
                        ) : (
                          <button
                            className='p-2 rounded-md transition-colors text-slate-400 hover:bg-slate-100 hover:text-red-600'
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLockStudent(student.id, studentName);
                            }}
                            title="Ban Student"
                          >
                            <Ban size={18} />
                          </button>
                        )}

                        <button
                          className='p-2 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStudent(student.id, studentName);
                          }}
                          title="Delete Student"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Placeholder */}
      <div className='flex flex-col sm:flex-row justify-between items-center gap-4 py-2'>
        <span className='text-sm text-slate-500'>
          Showing <span className='font-semibold text-slate-900'>{filteredStudents.length}</span> students
        </span>
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

export default StudentManagementPage;
