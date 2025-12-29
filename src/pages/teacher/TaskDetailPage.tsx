import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Clock, Calendar, Users, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added CardDescription import
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { assignmentApi } from "@/services/api/assignments";
import type { Assignment } from "@/types";
import { ROUTES } from "@/constants";
import { toast } from "sonner";

export default function TaskDetailPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment(assignmentId);
    }
  }, [assignmentId]);

  const fetchAssignment = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await assignmentApi.getAssignmentById(id);
      setAssignment(data);
    } catch (error) {
      console.error("Failed to fetch assignment", error);
      toast.error("Failed to load task details");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900">Task Not Found</h2>
        <Button 
          variant="link" 
          onClick={() => navigate(-1)}
          className="mt-4 text-purple-600"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="pl-0 hover:bg-transparent hover:text-purple-600 text-slate-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Class
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight lg:text-4xl mb-3">{assignment.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${
                assignment.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                assignment.status === 'draft' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' : 'bg-slate-50 text-slate-700 ring-slate-600/20'
              }`}>
                {assignment.status.toUpperCase()}
              </span>
              <div className="flex items-center text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                <Calendar className="h-3.5 w-3.5 mr-2 text-slate-400" />
                <span className="font-medium">Due {new Date(assignment.deadline).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 text-white font-semibold transition-all">
            Edit Task
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="submissions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm">Submissions</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-purple-600">
                    <p className="whitespace-pre-wrap text-slate-600 leading-relaxed text-base">
                      {assignment.description || "No instructions provided."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Submission Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-black text-slate-900">24<span className="text-lg text-slate-400 font-medium">/30</span></div>
                      <div className="text-sm font-medium text-slate-500 mt-1">Students Submitted</div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 ring-4 ring-green-50">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                  
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 w-[80%] rounded-full" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <div className="text-2xl font-bold text-slate-900">18</div>
                      <div className="text-xs font-medium text-slate-500">Graded</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">7.5</div>
                      <div className="text-xs font-medium text-slate-500">Avg. Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-slate-100">
                  <div className="flex justify-between py-3">
                    <span className="text-sm text-slate-600 font-medium">Late Submissions</span>
                    <span className="text-sm font-semibold text-slate-900">Allowed</span>
                  </div>
                  <div className="flex justify-between py-3">
                     <span className="text-sm text-slate-600 font-medium">AI Grading</span>
                     <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">Enabled</span>
                  </div>
                  <div className="flex justify-between py-3">
                     <span className="text-sm text-slate-600 font-medium">Max Score</span>
                     <span className="text-sm font-bold text-slate-900">100</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="submissions">
          <Card className="border-slate-200 shadow-sm">
             <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Student Submissions</CardTitle>
                  <CardDescription className="text-slate-500 mt-1">Review and grade 30 student submissions.</CardDescription>
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-50">Export CSV</Button>
                   <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-50">Bulk Action</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="min-h-[300px] flex flex-col items-center justify-center text-center py-12">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-medium mb-1">Submission List</h3>
                <p className="text-slate-500 max-w-sm">The student submission verification table will be implemented here next.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
