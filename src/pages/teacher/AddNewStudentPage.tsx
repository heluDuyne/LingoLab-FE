import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/constants";
import { toast } from "sonner";
import { classApi } from "@/services/api/classes";
import { userApi } from "@/services/api/users";
import { useAuthStore } from "@/stores";
import type { ClassList, User } from "@/types";

export function AddNewStudentPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // State
  const [activeTab, setActiveTab] = useState("create");
  const [classes, setClasses] = useState<ClassList[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Student@123"); // Default temporary password
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Common State
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
  }>({});

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      if (user?.id) {
        try {
          setIsLoadingClasses(true);
          const response = await classApi.getClassesByTeacher(user.id, 100); // Fetch enough classes
          setClasses(response.data || []);
        } catch (error) {
          console.error("Failed to fetch classes", error);
          toast.error("Failed to load your classes.");
        } finally {
          setIsLoadingClasses(false);
        }
      }
    };
    fetchClasses();
  }, [user?.id]);

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      const results = await userApi.searchUsers({ query: searchQuery });
      // Filter out only learners if needed, backend search usually generic
      setSearchResults(results);
      // setSearchResults(results.filter(u => u.role === 'learner'));
    } catch (error) {
      console.error("Search failed", error);
      toast.error("Failed to search users.");
    } finally {
      setIsSearching(false);
    }
  };

  const validateCreateForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    if (password.length < 6) newErrors.password = "Password must be at least 6 chars";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const enrollStudentInClasses = async (studentId: string, courseIds: string[]) => {
    let successCount = 0;
    for (const courseId of courseIds) {
      try {
        await classApi.enrollLearner(courseId, studentId);
        successCount++;
      } catch (error) {
        console.error(`Failed to enroll in course ${courseId}`, error);
      }
    }
    return successCount;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    try {
      setIsSubmitting(true);
      // 1. Create User
      const newUser = await userApi.createUser({
        email,
        password,
        confirmPassword: password,
        firstName,
        lastName,
        role: "learner",
      });

      // 2. Enroll in selected classes
      if (selectedCourses.length > 0 && newUser?.id) {
         await enrollStudentInClasses(newUser.id, selectedCourses);
      }

      toast.success("Student created successfully!");
      navigate(ROUTES.TEACHER.STUDENTS);
    } catch (error: any) {
      console.error("Creation failed", error);
      const msg = error.response?.data?.message || "Failed to create student";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExistingSubmit = async () => {
    if (!selectedStudentId) {
      toast.error("Please select a student first.");
      return;
    }
    if (selectedCourses.length === 0) {
      toast.error("Please select at least one course.");
      return;
    }

    try {
      setIsSubmitting(true);
      const count = await enrollStudentInClasses(selectedStudentId, selectedCourses);
      toast.success(`Enrolled student in ${count} class(es).`);
      navigate(ROUTES.TEACHER.STUDENTS);
    } catch (error) {
      toast.error("Enrollment failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.TEACHER.STUDENTS);
  };

  return (
    <div className='max-w-4xl mx-auto pb-12 animate-in fade-in duration-300'>
      <div className='flex flex-col gap-2 mb-8'>
        <button
          onClick={handleCancel}
          className='inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-2 transition-colors w-fit'
        >
          <ArrowLeft size={16} />
          Back to Students
        </button>
        <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>
          Add / Enroll Student
        </h1>
        <p className='text-slate-500 text-base'>
          Create a new student account or enroll an existing one.
        </p>
      </div>

      <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8'>
        <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="create">Create New Account</TabsTrigger>
            <TabsTrigger value="existing">Add Existing Student</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <form onSubmit={handleCreateSubmit} className='flex flex-col gap-8'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='firstName'>First Name <span className='text-red-500'>*</span></Label>
                  <Input 
                    id='firstName' 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && <p className='text-red-500 text-sm'>{errors.firstName}</p>}
                </div>
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='lastName'>Last Name <span className='text-red-500'>*</span></Label>
                  <Input 
                    id='lastName' 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && <p className='text-red-500 text-sm'>{errors.lastName}</p>}
                </div>
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='email'>Email <span className='text-red-500'>*</span></Label>
                  <Input 
                    id='email' 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className='text-red-500 text-sm'>{errors.email}</p>}
                </div>
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='password'>Values.Password (Default: Student@123)</Label>
                  <Input 
                    id='password' 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

               {/* Course Selection (Reused) */}
              <div className='flex flex-col gap-4'>
                 <h3 className='text-lg font-bold text-slate-900'>Enroll in Courses (Optional)</h3>
                 {isLoadingClasses ? <p>Loading classes...</p> : (
                   <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                     {classes.map((cls) => (
                       <label
                         key={cls.id}
                         className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                           selectedCourses.includes(cls.id)
                             ? "bg-purple-50 border-purple-600 ring-2 ring-purple-600/20"
                             : "border-slate-300 hover:bg-slate-50"
                         }`}
                       >
                         <input
                           type='checkbox'
                           checked={selectedCourses.includes(cls.id)}
                           onChange={() => handleCourseToggle(cls.id)}
                           className='w-4 h-4 text-purple-600 rounded'
                         />
                         <span className='text-slate-700 text-sm font-medium truncate'>{cls.name}</span>
                       </label>
                     ))}
                   </div>
                 )}
              </div>

              <div className='flex justify-end gap-4'>
                <Button type='button' variant='ghost' onClick={handleCancel}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting} className='bg-purple-600 hover:bg-purple-700 text-white'>
                   {isSubmitting ? "Creating..." : "Create & Enroll"}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="existing">
             <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                   <Label>Search Student by Email or Name</Label>
                   <div className="flex gap-2">
                      <Input 
                        placeholder="Search..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Button onClick={handleSearch} disabled={isSearching} variant="outline">
                        {isSearching ? "Searching..." : <Search size={18} />}
                      </Button>
                   </div>
                   
                   {/* Search Results */}
                   <div className="border rounded-md divide-y max-h-60 overflow-y-auto">

                      {searchResults.length === 0 && !isSearching && searchQuery && (
                         <p className="p-4 text-slate-500 text-sm text-center">No students found.</p>
                      )}
                      {searchResults.map(student => (
                         <div 
                           key={student.id} 
                           className={`p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${selectedStudentId === student.id ? 'bg-purple-50' : ''}`}
                           onClick={() => setSelectedStudentId(student.id)}
                         >
                            <div>
                               <p className="font-medium text-slate-900">{student.name || student.email}</p>
                               <p className="text-sm text-slate-500">{student.email}</p>
                            </div>
                            {selectedStudentId === student.id && <CheckCircle className="text-purple-600" size={18} />}
                         </div>
                      ))}
                   </div>
                </div>

                {/* Course Selection (Reused) */}
                <div className='flex flex-col gap-4'>
                  <h3 className='text-lg font-bold text-slate-900'>Select Courses to Enroll</h3>
                   {isLoadingClasses ? <p>Loading classes...</p> : (
                     <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                       {classes.map((cls) => (
                         <label
                           key={cls.id}
                           className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                             selectedCourses.includes(cls.id)
                               ? "bg-purple-50 border-purple-600 ring-2 ring-purple-600/20"
                               : "border-slate-300 hover:bg-slate-50"
                           }`}
                         >
                           <input
                             type='checkbox'
                             checked={selectedCourses.includes(cls.id)}
                             onChange={() => handleCourseToggle(cls.id)}
                             className='w-4 h-4 text-purple-600 rounded'
                           />
                           <span className='text-slate-700 text-sm font-medium truncate'>{cls.name}</span>
                         </label>
                       ))}
                     </div>
                   )}
                </div>

                <div className='flex justify-end gap-4'>
                  <Button type='button' variant='ghost' onClick={handleCancel}>Cancel</Button>
                  <Button 
                    onClick={handleExistingSubmit} 
                    disabled={isSubmitting || !selectedStudentId} 
                    className='bg-purple-600 hover:bg-purple-700 text-white'
                  >
                     {isSubmitting ? "Enrolling..." : "Enroll Selected Student"}
                  </Button>
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AddNewStudentPage;

