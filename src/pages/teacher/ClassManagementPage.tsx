import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import {
  ClassCard,
  StudentListItem,
  AddStudentForm,
  CreateClassForm,
  EmptyClassState,
} from "@/components/class";
import {
  mockClasses,
  mockStudents,
  type ClassGroup,
  type Student,
} from "@/data";

export function ClassManagementPage() {
  const [classes, setClasses] = useState<ClassGroup[]>(mockClasses);
  const [users, setUsers] = useState<Student[]>(mockStudents);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const handleCreateClass = (name: string) => {
    const newClass: ClassGroup = {
      id: `c${Date.now()}`,
      name,
      studentIds: [],
    };
    setClasses([...classes, newClass]);
    setIsCreating(false);
  };

  const handleAddStudent = (name: string, email: string) => {
    if (!selectedClassId) return;

    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      const newUser: Student = {
        id: `s${Date.now()}`,
        name,
        email,
        avatar: null,
      };
      setUsers([...users, newUser]);
      user = newUser;
    }

    setClasses(
      classes.map((c) => {
        if (c.id === selectedClassId && !c.studentIds.includes(user.id)) {
          return { ...c, studentIds: [...c.studentIds, user.id] };
        }
        return c;
      })
    );
  };

  const handleRemoveStudent = (studentId: string) => {
    if (!selectedClassId) return;

    setClasses(
      classes.map((c) => {
        if (c.id === selectedClassId) {
          return {
            ...c,
            studentIds: c.studentIds.filter((id) => id !== studentId),
          };
        }
        return c;
      })
    );
  };

  // --- DETAIL VIEW ---
  if (selectedClassId && selectedClass) {
    const classStudents = users.filter((u) =>
      selectedClass.studentIds.includes(u.id)
    );

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
              {selectedClass.name}
            </h2>
            <p className='text-slate-500'>
              {classStudents.length} Students Enrolled
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Student List */}
          <Card className='lg:col-span-2 shadow-sm border-slate-200'>
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
                    name={student.name}
                    email={student.email}
                    onRemove={handleRemoveStudent}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Add Student Form */}
          <AddStudentForm onAddStudent={handleAddStudent} />
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className='space-y-6 animate-in fade-in duration-300 pb-12'>
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

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {classes.map((c) => (
          <ClassCard
            key={c.id}
            id={c.id}
            name={c.name}
            studentCount={c.studentIds.length}
            onManage={setSelectedClassId}
          />
        ))}
        {classes.length === 0 && <EmptyClassState />}
      </div>
    </div>
  );
}

export default ClassManagementPage;
