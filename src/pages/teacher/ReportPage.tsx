import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Download,
  Plus,
  ClipboardList,
  TrendingUp,
  BarChart3,
  Clock,
  Search,
  Mic,
  FileText,
  BookOpen,
  Bot,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { assignmentApi } from "@/services/api/assignments";

import { toast } from "sonner";



export function ReportPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, any[]>>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState<Record<string, boolean>>({});
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("All Types");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      // teacherId was unused, used generic teacher endpoint
      const res = await assignmentApi.getTeacherAssignments();
      setAssignments(res.data);
    } catch (error) {
      console.error("Failed to load reports", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (id: string) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
    
    // Fetch submissions if not already loaded and opening
    if (expandedTaskId !== id && !submissionsMap[id]) {
      try {
        setLoadingSubmissions(prev => ({ ...prev, [id]: true }));
        const res = await assignmentApi.getStudentSubmissions(id);
        setSubmissionsMap(prev => ({ ...prev, [id]: res }));
      } catch (error) {
        console.error("Failed to fetch submissions", error);
        toast.error("Failed to load submissions details");
      } finally {
        setLoadingSubmissions(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  // Filter assignments based on type and search
  const filteredAssignments = assignments.filter((assign) => {
    const matchesType =
      filterType === "All Types" ||
      (assign.type || "").toUpperCase() === filterType.toUpperCase();
    const matchesSearch = assign.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Helper to get stats
  const totalTasks = assignments.length;
  // Calculate average of averages (simplistic) or weighted? 
  // Ideally backend gives agg stats, but frontend calc is fine for now.
  const scoredAssignments = assignments.filter(a => a.averageScore && Number(a.averageScore) > 0);
  const avgScore = scoredAssignments.length > 0
    ? (scoredAssignments.reduce((acc, a) => acc + Number(a.averageScore), 0) / scoredAssignments.length).toFixed(1)
    : "0.0";

  // Pending reviews: Total Submitted - Total Scored
  const pendingCount = assignments.reduce((acc, a) => {
      const submitted = a.totalSubmitted || 0;
      const scored = a.totalScored || 0;
      return acc + Math.max(0, submitted - scored);
  }, 0);

  const getTaskIcon = (type: string) => {
    const t = (type || "").toUpperCase();
    switch (t) {
      case "SPEAKING":
        return <Mic size={14} />;
      case "WRITING":
        return <FileText size={14} />;
      default:
        return <BookOpen size={14} />;
    }
  };

  const getTaskColor = (type: string) => {
    const t = (type || "").toUpperCase();
    switch (t) {
      case "SPEAKING":
        return "bg-purple-50 text-purple-700 ring-purple-700/10";
      case "WRITING":
        return "bg-blue-50 text-blue-700 ring-blue-700/10";
      default:
        return "bg-green-50 text-green-700 ring-green-700/10";
    }
  };

  const handleAssignTask = () => {
    navigate(ROUTES.TEACHER.CREATE_TASK);
  };

  return (
    <div className='flex flex-col gap-8 animate-in fade-in duration-300 pb-12'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-end justify-between gap-4'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-3xl lg:text-4xl font-black leading-tight text-slate-900'>
            Task Performance & Grading
          </h1>
          <p className='text-slate-500 text-base max-w-2xl'>
            Review student submissions and AI-generated scores. Manage grades
            and feedback for all course tasks efficiently.
          </p>
        </div>
        <div className='flex gap-3'>
          <Button
            variant='outline'
            className='flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-50'
          >
            <Download size={18} />
            Export CSV
          </Button>
          <Button
            onClick={handleAssignTask}
            className='flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-200'
          >
            <Plus size={18} />
            Assign New Task
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='flex flex-col gap-1 rounded-xl p-6 bg-white shadow-sm border border-slate-200'>
          <div className='flex items-center justify-between'>
            <p className='text-slate-500 text-sm font-medium'>
              Total Tasks Assigned
            </p>
            <div className='text-blue-600 bg-blue-50 p-1.5 rounded-md'>
              <ClipboardList size={20} />
            </div>
          </div>
          <div className='flex items-end gap-2 mt-2'>
            <p className='text-slate-900 text-3xl font-bold leading-none'>
              {totalTasks}
            </p>
            <p className='text-emerald-600 text-xs font-medium mb-1 flex items-center gap-1'>
              <TrendingUp size={14} /> +2 this week
            </p>
          </div>
        </div>
        <div className='flex flex-col gap-1 rounded-xl p-6 bg-white shadow-sm border border-slate-200'>
          <div className='flex items-center justify-between'>
            <p className='text-slate-500 text-sm font-medium'>
              Class Avg Band Score
            </p>
            <div className='text-purple-600 bg-purple-50 p-1.5 rounded-md'>
              <BarChart3 size={20} />
            </div>
          </div>
          <div className='flex items-end gap-2 mt-2'>
            <p className='text-slate-900 text-3xl font-bold leading-none'>
              {avgScore}
            </p>
            <p className='text-emerald-600 text-xs font-medium mb-1 flex items-center gap-1'>
              <TrendingUp size={14} /> +0.5 band
            </p>
          </div>
        </div>
        <div className='flex flex-col gap-1 rounded-xl p-6 bg-white shadow-sm border border-slate-200'>
          <div className='flex items-center justify-between'>
            <p className='text-slate-500 text-sm font-medium'>Pending Reviews</p>
            <div className='text-orange-600 bg-orange-50 p-1.5 rounded-md'>
              <Clock size={20} />
            </div>
          </div>
          <div className='flex items-end gap-2 mt-2'>
            <p className='text-slate-900 text-3xl font-bold leading-none'>
              {pendingCount}
            </p>
            <p className='text-orange-600 text-xs font-medium mb-1 flex items-center'>
              Needs attention
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200'>
        <div className='relative w-full sm:max-w-md'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
            <Search className='text-slate-400' size={20} />
          </div>
          <input
            className='block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-600 focus:border-transparent sm:text-sm sm:leading-6'
            placeholder='Search by task name...'
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className='flex gap-3 w-full sm:w-auto'>
          <select
            className='block w-full sm:w-40 rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-10 text-slate-900 focus:ring-2 focus:ring-purple-600 focus:border-transparent sm:text-sm font-medium cursor-pointer'
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option>All Types</option>
            <option>Speaking</option>
            <option>Writing</option>
          </select>
          <select className='block w-full sm:w-40 rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-10 text-slate-900 focus:ring-2 focus:ring-purple-600 focus:border-transparent sm:text-sm font-medium cursor-pointer'>
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>This Semester</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm whitespace-nowrap'>
            <thead className='bg-slate-50 border-b border-slate-200'>
              <tr>
                <th className='px-6 py-4 font-semibold text-slate-500'>
                  Task Name
                </th>
                <th className='px-6 py-4 font-semibold text-slate-500'>Type</th>
                <th className='px-6 py-4 font-semibold text-slate-500'>
                  Due Date
                </th>
                <th className='px-6 py-4 font-semibold text-slate-500'>
                  Completion
                </th>
                <th className='px-6 py-4 font-semibold text-slate-500'>
                  Avg Score
                </th>
                <th className='px-6 py-4 font-semibold text-slate-500 text-right'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-200'>
              {loading ? (
                 <tr><td colSpan={6} className="text-center py-8">Loading reports...</td></tr>
              ) : filteredAssignments.length === 0 ? (
                 <tr>
                    <td colSpan={6} className='text-center py-8 text-slate-400 italic'>
                         No tasks found.
                    </td>
                 </tr>
              ) : (
                filteredAssignments.map((assign) => {

                  const completedCount = assign.totalSubmitted || 0;
                  const totalStudents = assign.totalEnrolled || 1; 
                  const percentComplete = totalStudents > 0 
                      ? Math.round((completedCount / totalStudents) * 100) 
                      : 0;
                  
                  const assignAvg = assign.averageScore && Number(assign.averageScore) > 0 
                      ? Number(assign.averageScore).toFixed(1) 
                      : "--";

                  const isExpanded = expandedTaskId === assign.id;
                  const assignSubs = submissionsMap[assign.id] || [];
                  const isLoadingSubs = loadingSubmissions[assign.id];

                  return (
                    <tr key={assign.id} className='contents'>
                    <tr
                      className={`group hover:bg-slate-50 transition-colors cursor-pointer ${
                        isExpanded ? "bg-slate-50" : ""
                      }`}
                      onClick={() => toggleExpand(assign.id)}
                    >
                      <td className='px-6 py-4'>
                        <div className='flex flex-col'>
                          <span className='font-medium text-slate-900 text-base'>
                            {assign.title}
                          </span>
                          <span className='text-xs text-slate-500'>
                            ID: TSK-{assign.id.slice(-4).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getTaskColor(
                            assign.type
                          )}`}
                        >
                          {getTaskIcon(assign.type)} {assign.type}
                        </span>
                      </td>
                      <td className='px-6 py-4 text-slate-900'>
                        {new Date(assign.deadline).toLocaleDateString()}
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-3'>
                          <div className='w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200'>
                            <div
                              className='h-full bg-emerald-500 rounded-full'
                              style={{ width: `${percentComplete}%` }}
                            />
                          </div>
                          <span className='text-xs font-medium text-slate-500'>
                            {completedCount}/{totalStudents}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-2'>
                          <div className='flex items-center justify-center size-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm'>
                            {assignAvg}
                          </div>
                          {assignAvg !== "--" && (
                            <span title='AI Scored'>
                              <Bot size={16} className='text-purple-600' />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4 text-right'>
                        <button className='text-slate-400 hover:text-purple-600 transition-colors'>
                          {isExpanded ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {isExpanded && (
                      <tr className='bg-slate-50/50 border-b border-slate-200'>
                        <td className='p-0' colSpan={6}>
                          <div className='p-6'>
                            <div className='flex justify-between items-center mb-4'>
                              <h3 className='text-sm font-bold text-slate-900 uppercase tracking-wider'>
                                Student Submissions
                              </h3>
                              <button className='text-sm text-purple-600 hover:underline font-medium'>
                                View Full Report
                              </button>
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                              {isLoadingSubs ? (
                                    <div className='col-span-3 text-center py-4 text-slate-400'>Loading details...</div>
                              ) : assignSubs.filter((s:any) => s.status?.toLowerCase() === 'scored' || s.score).length > 0 ? (
                                assignSubs
                                  .filter((s:any) => s.status?.toLowerCase() === 'scored' || s.score)
                                  .map((sub: any, idx: number) => {
                                  return (
                                    <div
                                      key={idx}
                                      className='flex items-center p-3 rounded-lg bg-white border border-slate-200 shadow-sm gap-3 cursor-pointer hover:border-purple-300 transition-colors'
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // handleViewFeedback(sub.id); // Id might not be in the lightweight DTO depending on backend
                                      }}
                                    >
                                      <div
                                        className='bg-purple-100 rounded-full size-10 flex-shrink-0 flex items-center justify-center text-purple-600 font-bold bg-cover bg-center'
                                      >
                                        {(sub.learnerName?.[0] || "?").toUpperCase()}
                                      </div>
                                      <div className='flex-1 min-w-0'>
                                        <p className='text-sm font-semibold text-slate-900 truncate hover:text-purple-600 transition-colors'>
                                          {sub.learnerName || sub.learnerEmail || "Unknown"}
                                        </p>
                                        <p className='text-xs text-slate-500'>
                                          Submitted:{" "}
                                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "Pending"}
                                        </p>
                                      </div>
                                      <div className='flex flex-col items-end gap-1'>
                                        {sub.score ? (
                                          <span className='inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20'>
                                            {sub.score}
                                          </span>
                                        ) : (
                                          <span className='inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600'>
                                            {sub.status || "Pending"}
                                          </span>
                                        )}
                                        {sub.score && (
                                          <span className='text-[10px] text-slate-500 flex items-center gap-0.5'>
                                            <Bot size={10} /> AI
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className='col-span-3 text-center py-4 text-slate-400 italic'>
                                  No submissions yet.
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>

        {/* Simple Pagination */}
        <div className='flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6'>
          <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
            <div>
              <p className='text-sm text-slate-700'>
                Showing <span className='font-medium'>1</span> to{" "}
                <span className='font-medium'>{filteredAssignments.length}</span>{" "}
                of{" "}
                <span className='font-medium'>{filteredAssignments.length}</span>{" "}
                results
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportPage;

