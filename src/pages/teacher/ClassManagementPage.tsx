import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router"; 
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import { ROUTES } from "@/constants";
import {
  ClassCard,
  StudentListItem,
  AddStudentForm,
  CreateClassForm,
  EmptyClassState,
} from "@/components/class";
import { classApi } from "@/services/api/classes";
import { assignmentApi } from "@/services/api/assignments";
import { useAuthStore } from "@/stores";
import type { ClassList, ClassDetail, AssignmentList } from "@/types";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ClassManagementPage() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassList[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Check for navigation state on mount
  useEffect(() => {
    if (location.state?.classId) {
      setSelectedClassId(location.state.classId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
  }, [user?.id]);
  const [selectedClassDetail, setSelectedClassDetail] = useState<ClassDetail | null>(null);
  const [classAssignments, setClassAssignments] = useState<AssignmentList[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // Edit State
  const [editingClass, setEditingClass] = useState<ClassList | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
  }, [user?.id]);

  // Fetch detailed class info when selected
  useEffect(() => {
    if (selectedClassId) {
      fetchClassDetails(selectedClassId);
      fetchAssignments(selectedClassId);
    } else {
      setSelectedClassDetail(null);
      setClassAssignments([]);
    }
  }, [selectedClassId]);

  const fetchClasses = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const response = await classApi.getClassesByTeacher(user.id, 100);
      setClasses(response.data || []);
    } catch (error) {
      console.error("Failed to fetch classes", error);
      toast.error("Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClassDetails = async (id: string) => {
    try {
      const details = await classApi.getClassDetails(id);
      setSelectedClassDetail(details);
    } catch (error) {
      console.error("Failed to fetch class details", error);
      toast.error("Failed to load class details");
    }
  };

  const fetchAssignments = async (classId: string) => {
    try {
      setIsLoadingAssignments(true);
      const response = await assignmentApi.getAssignmentsByClass(classId, 20);
      setClassAssignments(response.data || []);
    } catch (error) {
      console.error("Failed to fetch assignments", error);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const handleCreateClass = async (name: string) => {
    if (!user?.id) return;
    try {
      await classApi.createClass({
        teacherId: user.id,
        name,
        description: "",
        code: `CLASS-${Date.now().toString().slice(-4)}`
      });
      toast.success("Class created successfully");
      setIsCreating(false);
      fetchClasses();
    } catch (error) {
      console.error("Failed to create class", error);
      toast.error("Failed to create class");
    }
  };

  const handleEditClick = (classItem: ClassList) => {
    setEditingClass(classItem);
    setEditForm({ name: classItem.name, description: "" }); 
  };

  const handleUpdateClass = async () => {
    if (!editingClass) return;
    try {
      await classApi.updateClass(editingClass.id, {
        name: editForm.name,
      });
      toast.success("Class updated successfully");
      setEditingClass(null);
      fetchClasses();
    } catch (error) {
       console.error("Failed to update class", error);
       toast.error("Failed to update class");
    }
  };

  const handleAddStudent = async (student: import("@/types").User) => {
    if (!selectedClassId) return;

    try {
      if (selectedClassDetail?.learners?.find(l => l.id === student.id)) {
          toast.warning(`Student ${student.firstName || student.email} is already enrolled.`);
          return;
      }

      await classApi.enrollLearner(selectedClassId, student.id);
      
      const name = (student.firstName && student.lastName) 
        ? `${student.firstName} ${student.lastName}` 
        : (student.name || student.email.split('@')[0]);

      toast.success(`Student ${name} enrolled successfully`);
      fetchClassDetails(selectedClassId);

    } catch (error) {
      console.error("Failed to add student", error);
      toast.error("Failed to add student.");
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClassId) return;
    try {
      await classApi.removeLearner(selectedClassId, studentId);
      toast.success("Student removed successfully");
      fetchClassDetails(selectedClassId);
    } catch (error) {
      console.error("Failed to remove student", error);
      toast.error("Failed to remove student");
    }
  };

  // --- DETAIL VIEW ---
  if (selectedClassId && selectedClassDetail) {
    const classStudents = selectedClassDetail.learners || [];

    return (
      <div className='space-y-6 animate-in fade-in duration-300 pb-12'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            onClick={() => setSelectedClassId(null)}
            className='pl-0 hover:bg-transparent hover:text-purple-600'
          >
            <ArrowLeft size={16} className='mr-2' /> Back to Classes
          </Button>
        </div>

        <div className='flex justify-between items-center'>
          <div>
            <h2 className='text-2xl font-bold text-slate-900'>
              {selectedClassDetail.name}
            </h2>
            <p className='text-slate-500'>
              {classStudents.length} Students Enrolled • Code: {selectedClassDetail.code}
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Student List */}
          <Card className='lg:col-span-2 shadow-sm border-slate-200 h-fit'>
            <CardHeader>
              <CardTitle>Class Roster</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {classStudents.length === 0 ? (
                <p className='text-center text-slate-500 py-8 italic'>
                  No students in this class yet.
                </p>
              ) : (
                classStudents.map((student) => (
                  <StudentListItem
                    key={student.id}
                    id={student.id}
                    name={student.firstName ? `${student.firstName} ${student.lastName}` : (student.name || student.email.split('@')[0])} 
                    email={student.email}
                    onRemove={handleRemoveStudent}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Add Student Form */}
          <div className="space-y-6">
            <AddStudentForm 
              onAddStudent={handleAddStudent} 
              currentClassStudents={classStudents}
            />

            {/* Assignments List */}
            <Card className='shadow-sm border-slate-200 h-fit'>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Assignments</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {isLoadingAssignments ? (
                  <p className="text-sm text-slate-500 italic">Loading tasks...</p>
                ) : classAssignments.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No assignments yet.</p>
                ) : (
                  classAssignments.map((task) => (
                    <div 
                      key={task.id} 
                      className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-purple-200 hover:shadow-sm cursor-pointer transition-all group"
                      onClick={() => {
                        const url = ROUTES.TEACHER.TASK_DETAIL
                          .replace(':classId', selectedClassId || '')
                          .replace(':assignmentId', task.id);
                        navigate(url);
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-slate-900 line-clamp-1 group-hover:text-purple-700 transition-colors" title={task.title}>{task.title}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          task.status === 'active' ? 'bg-green-100 text-green-700' : 
                          task.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {task.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                         <span>Submitted: {task.totalSubmitted}/{task.totalEnrolled}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className='space-y-6 animate-in fade-in duration-300 pb-12'>
      {/* ... Header ... */}
      <div className='flex flex-wrap justify-between items-center gap-4'>
        <div className='flex flex-col gap-1'>
          <h2 className='text-3xl font-bold text-slate-900'>My Classes</h2>
          <p className='text-base font-normal text-slate-500'>
            Manage your classes and student enrollments.
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className='bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200'
        >
          <Plus size={18} className='mr-2' /> Create Class
        </Button>
      </div>

      {isCreating && (
        <CreateClassForm
          onCreateClass={handleCreateClass}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {isLoading ? (
         <p className="text-slate-500">Loading classes...</p>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {classes.map((c) => (
            <ClassCard
              key={c.id}
              id={c.id}
              name={c.name}
              studentCount={c.learnerCount || 0} 
              onManage={(id) => setSelectedClassId(id)}
              onEdit={() => handleEditClick(c)}
            />
          ))}
          {classes.length === 0 && <EmptyClassState />}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingClass} onOpenChange={(open: boolean) => !open && setEditingClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Class Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="e.g. English 101"
              />
            </div>
            {/* Description could go here if we had it in the list or fetched it */}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingClass(null)}
              className="border-slate-200 hover:bg-purple-50 hover:text-purple-600"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateClass} disabled={!editForm.name}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ClassManagementPage;
