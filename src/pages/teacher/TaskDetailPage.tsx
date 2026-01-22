import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Calendar, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { assignmentApi } from "@/services/api/assignments";
import type { Assignment } from "@/types";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function TaskDetailPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment(assignmentId);
      fetchSubmissions(assignmentId);
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

  const fetchSubmissions = async (id: string) => {
    try {
      const data = await assignmentApi.getStudentSubmissions(id);
      setSubmissions(data); // data is already an array of submission objects
      
      // Process analytics data
      processAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch submissions", error);
      toast.error("Failed to load submissions");
    }
  };

  const exportToCSV = () => {
    // Filter only scored submissions
    const scoredSubmissions = submissions.filter(s => s.status === 'scored');
    
    if (scoredSubmissions.length === 0) {
      toast.error("No scored submissions to export");
      return;
    }

    // Create CSV header
    const headers = ['Student Name', 'Email', 'Status', 'Submitted At', 'Score'];
    
    // Create CSV rows
    const rows = scoredSubmissions.map(sub => [
      sub.learnerName || 'Unknown',
      sub.learnerEmail || '',
      (sub.status || '').toUpperCase(),
      sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '-',
      sub.score || '-'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${assignment?.title || 'assignment'}_scored_submissions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${scoredSubmissions.length} scored submissions`);
  };

  const processAnalytics = (data: any[]) => {
      // 1. Score Distribution (Bands)
      const scoreDist = [
          { name: '0-4.0', count: 0 },
          { name: '4.5-5.5', count: 0 },
          { name: '6.0-7.0', count: 0 },
          { name: '7.5-8.5', count: 0 },
          { name: '9.0', count: 0 },
      ];

      // 2. Status Distribution
      let submitted = 0;
      let graded = 0;
      let totalScore = 0;
      let scoredCount = 0;
      
      data.forEach(sub => {
          if (sub.status === 'submitted') submitted++;
          if (sub.status === 'scored') graded++;

          const score = parseFloat(sub.score || 0);
          
          // Calculate average score for scored submissions
          if (sub.status === 'scored' && score > 0) {
              totalScore += score;
              scoredCount++;
          }
          
          if (score > 0) {
              if (score <= 4.0) scoreDist[0].count++;
              else if (score <= 5.5) scoreDist[1].count++;
              else if (score <= 7.0) scoreDist[2].count++;
              else if (score <= 8.5) scoreDist[3].count++;
              else if (score >= 9.0) scoreDist[4].count++;
          }
      });

      // Calculate real-time average score
      const averageScore = scoredCount > 0 ? totalScore / scoredCount : null;

      setAnalyticsData({
          scoreDistribution: scoreDist,
          counts: { submitted, graded },
          averageScore: averageScore
      });
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

  // Calculate status data for chart dynamically
  const statusData = analyticsData ? [
      { name: 'Graded', value: analyticsData.counts.graded, color: '#9333ea' }, // purple-600
      { name: 'Submitted (Pending)', value: analyticsData.counts.submitted, color: '#3b82f6' }, // blue-500
      { name: 'Not Submitted', value: Math.max(0, (assignment?.totalEnrolled || 0) - analyticsData.counts.submitted - analyticsData.counts.graded), color: '#e2e8f0' } // slate-200
  ] : [];

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
                      <div className="text-3xl font-black text-slate-900">
                        {assignment.totalSubmitted || 0}
                        <span className="text-lg text-slate-400 font-medium">/{assignment.totalEnrolled || 0}</span>
                      </div>
                      <div className="text-sm font-medium text-slate-500 mt-1">Students Submitted</div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 ring-4 ring-green-50">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                  
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-purple-600 rounded-full" 
                        style={{ width: `${Math.min(100, ((assignment.totalSubmitted || 0) / (assignment.totalEnrolled || 1)) * 100)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <div className="text-2xl font-bold text-slate-900">{analyticsData?.counts.graded || 0}</div>
                      <div className="text-xs font-medium text-slate-500">Graded</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">{analyticsData?.averageScore ? Number(analyticsData.averageScore).toFixed(1) : '-'}</div>
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
                    <span className="text-sm font-semibold text-slate-900">{assignment.allowLateSubmission ? 'Allowed' : 'Not Allowed'}</span>
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
                  <CardDescription className="text-slate-500 mt-1">
                    Review and grade {submissions.filter(s => s.status === 'scored').length} scored submissions.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-50" onClick={exportToCSV}>Export CSV</Button>
                   <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-50">Bulk Action</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Submitted At</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.filter(s => s.status === 'scored').length > 0 ? (
                        submissions.filter(s => s.status === 'scored').map((submission) => (
                            <tr key={submission.learnerId || submission.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm">
                                            {submission.learnerName?.[0]?.toUpperCase() || submission.learnerEmail?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900">{submission.learnerName || 'Unknown Student'}</div>
                                            <div className="text-slate-500 text-xs">{submission.learnerEmail}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        submission.status === 'scored' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' :
                                        submission.status === 'submitted' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {(submission.status || 'UNKNOWN').replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-medium">
                                    {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    {submission.score ? (
                                        <span className="font-bold text-slate-900">{submission.score}</span>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                        onClick={() => {
                                            if (submission.attemptId) {
                                                console.log("Debug Task Type:", assignment);
                                                const type = assignment?.type || assignment?.skillType || assignment?.prompt?.skillType;
                                                const isSpeaking = type?.toString().toUpperCase() === 'SPEAKING';
                                                
                                                if (isSpeaking) {
                                                     console.log("--> Navigating to SPEAKING graded page");
                                                     navigate(`/teacher/graded/speaking/${submission.attemptId}`);
                                                } else {
                                                     console.log("--> Navigating to WRITING graded page (Default)");
                                                     navigate(`/teacher/graded/${submission.attemptId}`);
                                                }
                                            } else {
                                                toast.error("Attempt ID not found");
                                            }
                                        }}
                                        disabled={!submission.attemptId}
                                    >
                                        View
                                    </Button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                No submissions found.
                            </td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-900">Score Distribution</CardTitle>
                        <CardDescription>Number of students per score band</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                         {analyticsData && analyticsData.scoreDistribution ? (
                             <ResponsiveContainer width="100%" height="100%">
                                 <BarChart data={analyticsData.scoreDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                    <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={40} />
                                 </BarChart>
                             </ResponsiveContainer>
                         ) : (
                             <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
                         )}
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-900">Submission Status</CardTitle>
                        <CardDescription>Visual breakdown of assignment progress</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                        {statusData && statusData.length > 0 ? (
                             <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                     <Pie
                                         data={statusData}
                                         cx="50%"
                                         cy="50%"
                                         innerRadius={60}
                                         outerRadius={100}
                                         paddingAngle={5}
                                         dataKey="value"
                                     >
                                         {statusData.map((entry: any, index: number) => (
                                             <Cell key={`cell-${index}`} fill={entry.color} />
                                         ))}
                                     </Pie>
                                     <Tooltip />
                                     <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                 </PieChart>
                             </ResponsiveContainer>
                         ) : (
                             <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
                         )}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
