import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  Mic,
  FileText,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Loader2,
  AlertTriangle,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { userApi } from "@/services/api/users";
import { attemptApi } from "@/services/api/attempts";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from "recharts";

export function StudentDetailPage() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState<"ALL" | "WRITING" | "SPEAKING">("ALL");
  const [stats, setStats] = useState({
      avgScore: "0.0",
      totalCompleted: 0,
      writingAvg: "0.0",
      speakingAvg: "0.0"
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [speakingData, setSpeakingData] = useState<any[]>([]);
  const [writingData, setWritingData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId) return;
      try {
        setLoading(true);
        // Parallel fetching
        const [learnersRes, attemptsRes] = await Promise.all([
             userApi.getLearners(), // In future, use getUserById if available
             attemptApi.getAttemptsByLearner(studentId)
        ]);

        const foundStudent = learnersRes.data?.find((u: any) => u.id === studentId);
        setStudent(foundStudent || null);

        const allAttempts = attemptsRes.data || [];
        setAttempts(allAttempts);

        // Process Stats
        const scoredAttempts = allAttempts.filter((a: any) =>
            ((a.status?.toUpperCase() === 'SCORED') || (a.status?.toUpperCase() === 'SUBMITTED')) && a.score?.overallBand != null
        ).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        const totalScore = scoredAttempts.reduce((sum: number, a: any) => sum + Number(a.score.overallBand || 0), 0);
        const overallAvg = scoredAttempts.length ? (totalScore / scoredAttempts.length).toFixed(1) : "0.0";

        const writingAttempts = scoredAttempts.filter((a: any) => (a.type?.toUpperCase() === 'WRITING' || a.skillType?.toUpperCase() === 'WRITING'));
        const speakingAttempts = scoredAttempts.filter((a: any) => (a.type?.toUpperCase() === 'SPEAKING' || a.skillType?.toUpperCase() === 'SPEAKING'));

        const wScore = writingAttempts.reduce((s: number, a: any) => s + Number(a.score.overallBand || 0), 0);
        const sScore = speakingAttempts.reduce((s: number, a: any) => s + Number(a.score.overallBand || 0), 0);

        setStats({
            avgScore: overallAvg,
            totalCompleted: scoredAttempts.length,
            writingAvg: writingAttempts.length ? (wScore / writingAttempts.length).toFixed(1) : "N/A",
            speakingAvg: speakingAttempts.length ? (sScore / speakingAttempts.length).toFixed(1) : "N/A"
        });

        // Chart Data
        const chart = scoredAttempts.map((a: any) => ({
             date: new Date(a.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
             score: Number(a.score.overallBand) || 0,
             title: a.title
        }));
        setChartData(chart);

        // --- Aggregation Logic ---
        const aggregateSkills = (skillAttempts: any[], type: 'speaking' | 'writing') => {
             const agg = {
                 cat1: 0, cat2: 0, cat3: 0, cat4: 0, count: 0
             };

             skillAttempts.forEach(a => {
                 if (!a.score) return;
                 const aiScores = a.score.detailedFeedback?.aiScores || {};
                 const rootScores = a.score;
                 const base = Number(rootScores.overallBand) || 0; 

                 let c1 = 0, c2 = 0, c3 = 0, c4 = 0;

                 if (type === 'speaking') {
                     // Fluency, Pronunciation, Lexical, Grammar
                     c1 = Number(aiScores.fluency || rootScores.fluency || base);
                     c2 = Number(aiScores.pronunciation || rootScores.pronunciation || base);
                     c3 = Number(aiScores.lexical || rootScores.lexical || base);
                     c4 = Number(aiScores.grammar || rootScores.grammar || base);
                 } else {
                     // Task Response, Coherence, Lexical, Grammar
                     c1 = Number(aiScores.taskResponse || rootScores.fluency || base); 
                     c2 = Number(aiScores.coherence || rootScores.pronunciation || base);
                     c3 = Number(aiScores.lexical || rootScores.lexical || base);
                     c4 = Number(aiScores.grammar || rootScores.grammar || base);
                 }

                 agg.cat1 += c1;
                 agg.cat2 += c2;
                 agg.cat3 += c3;
                 agg.cat4 += c4;
                 agg.count++;
             });

             if (agg.count === 0) return [];

             const labels = type === 'speaking' 
                ? ['Fluency', 'Pronunciation', 'Lexical', 'Grammar']
                : ['Task Response', 'Coherence', 'Lexical', 'Grammar'];
            
             return [
                 { subject: labels[0], A: (agg.cat1 / agg.count).toFixed(1), fullMark: 9 },
                 { subject: labels[1], A: (agg.cat2 / agg.count).toFixed(1), fullMark: 9 },
                 { subject: labels[2], A: (agg.cat3 / agg.count).toFixed(1), fullMark: 9 },
                 { subject: labels[3], A: (agg.cat4 / agg.count).toFixed(1), fullMark: 9 },
             ];
        };

        setSpeakingData(aggregateSkills(speakingAttempts, 'speaking'));
        setWritingData(aggregateSkills(writingAttempts, 'writing'));


      } catch (err) {
        console.error("Failed to fetch student details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  const getTaskIcon = (type?: string) => {
    if (type === "WRITING") return <FileText size={20} />;
    if (type === "SPEAKING") return <Mic size={20} />;
    return <BookOpen size={20} />;
  };

  const getTaskColorClass = (type?: string) => {
    if (type === "WRITING") return "bg-blue-50 text-blue-600 border-blue-100";
    if (type === "SPEAKING") return "bg-purple-50 text-purple-600 border-purple-100";
    return "bg-green-50 text-green-600 border-green-100";
  };

  const handleBack = () => {
    navigate(ROUTES.TEACHER.STUDENTS);
  };

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
      );
  }

  if (!student) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <p className='text-slate-500'>Student not found</p>
        <Button variant='ghost' onClick={handleBack} className='mt-4'>
          <ArrowLeft size={16} className='mr-2' />
          Back to Student List
        </Button>
      </div>
    );
  }

  // Filter logic for table
  const filteredAttempts = attempts.filter((a) => {
      const isScored = a.status?.toUpperCase() === 'SCORED';
      if (!isScored) return false;

      if (taskFilter === "ALL") return true;
      const type = (a.skillType || a.type || "").toUpperCase();
      return type === taskFilter;
  });

  return (
    <div className='flex flex-col gap-6 animate-in slide-in-from-right duration-300 pb-12'>
      {/* Top Header Navigation */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div className='flex flex-col gap-1'>
          <button
            onClick={handleBack}
            className='inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-2 transition-colors'
          >
            <ArrowLeft size={16} />
            Back to Learner List
          </button>
          <h1 className='text-3xl font-bold text-slate-900'>
              {student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : (student.name || student.email.split('@')[0])}
          </h1>
          <p className='text-base text-slate-500'>
            {student.email} • ID: #{student.id.slice(-6).toUpperCase()}
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2'>
        {/* Left Sidebar: Profile & Stats */}
        <div className='lg:col-span-4 flex flex-col gap-6'>
          {/* Profile Card */}
          <div className='bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm'>
            <div className='p-6 flex flex-col items-center border-b border-slate-100'>
                {student.avatar ? (
                     <img className='w-24 h-24 rounded-full mb-4 object-cover ring-4 ring-slate-50' src={student.avatar} alt="Avatar" />
                ) : (
                    <div className='w-24 h-24 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-3xl mb-4 ring-4 ring-slate-50'>
                    {(student.firstName?.[0] || student.name?.[0] || student.email[0]).toUpperCase()}
                    </div>
                )}
              <h2 className='text-xl font-bold text-slate-900'>
                {student.firstName || student.name || "Student"}
              </h2>
              <p className='text-sm text-slate-500'>Learner</p>
            </div>
            
             <div className='p-6 space-y-4'>
                 {/* Quick Score Summary */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600">Current Band</span>
                    <span className="text-xl font-bold text-purple-600">{stats.avgScore}</span>
                </div>
                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600">Completed Tasks</span>
                    <span className="text-xl font-bold text-slate-900">{stats.totalCompleted}</span>
                 </div>
            </div>
          </div>

          {/* Performance Summary (Detailed) */}
          <div className='bg-white rounded-xl border border-slate-200 p-6 shadow-sm'>
            <h3 className='text-lg font-bold text-slate-900 mb-4'>
              Performance Summary
            </h3>
            
            <div className='space-y-4'>
              <div>
                <div className='flex items-center justify-between text-sm mb-1'>
                  <span className='flex items-center gap-2 text-slate-700'>
                    <span className='w-2 h-2 bg-blue-500 rounded-full' />
                    Writing
                  </span>
                  <span className='font-medium text-slate-900'>{stats.writingAvg}</span>
                </div>
                 <div className='w-full bg-slate-100 rounded-full h-1.5'>
                  <div className='bg-blue-500 h-1.5 rounded-full' style={{ width: `${(Number(stats.writingAvg === "N/A" ? 0 : stats.writingAvg) / 9) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className='flex items-center justify-between text-sm mb-1'>
                  <span className='flex items-center gap-2 text-slate-700'>
                    <span className='w-2 h-2 bg-purple-500 rounded-full' />
                    Speaking
                  </span>
                  <span className='font-medium text-slate-900'>{stats.speakingAvg}</span>
                </div>
                <div className='w-full bg-slate-100 rounded-full h-1.5'>
                  <div className='bg-purple-500 h-1.5 rounded-full' style={{ width: `${(Number(stats.speakingAvg === "N/A" ? 0 : stats.speakingAvg) / 9) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

           {/* Speaking Skills Radar */}
           <div className='bg-white rounded-xl border border-slate-200 p-4 shadow-sm min-h-[300px] flex flex-col'>
             <h3 className='text-sm font-bold text-slate-900 mb-2 flex items-center gap-2'>
                <Mic size={16} className="text-purple-600"/>
                Speaking Skills
             </h3>
             <div className="flex-1 w-full flex items-center justify-center -ml-4">
                 {speakingData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={speakingData}>
                            <PolarGrid stroke="#E2E8F0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 9]} tickCount={4} tick={false} />
                            <Radar name="Student" dataKey="A" stroke="#9333ea" fill="#9333ea" fillOpacity={0.5} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                        </RadarChart>
                    </ResponsiveContainer>
                 ) : (
                    <p className="text-slate-400 text-sm">No speaking data available.</p>
                 )}
             </div>
           </div>

           {/* Writing Skills Radar */}
           <div className='bg-white rounded-xl border border-slate-200 p-4 shadow-sm min-h-[300px] flex flex-col'>
             <h3 className='text-sm font-bold text-slate-900 mb-2 flex items-center gap-2'>
                <FileText size={16} className="text-blue-600"/>
                Writing Skills
             </h3>
             <div className="flex-1 w-full flex items-center justify-center -ml-4">
                 {writingData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={writingData}>
                            <PolarGrid stroke="#E2E8F0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 9]} tickCount={4} tick={false} />
                            <Radar name="Student" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.5} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                        </RadarChart>
                    </ResponsiveContainer>
                 ) : (
                    <p className="text-slate-400 text-sm">No writing data available.</p>
                 )}
             </div>
           </div>

        </div>

        {/* Right Main: Charts & Task List */}
        <div className='lg:col-span-8 flex flex-col gap-6'>
          
           {/* Trend Chart */}
           <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[350px]'>
             <div className='flex justify-between items-center mb-6'>
                <h3 className='text-lg font-bold text-slate-900'>Score Progression</h3>
             </div>
             <div className="flex-1 w-full h-full">
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 9]} ticks={[0, 2, 4, 6, 8]} stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                return (
                                    <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg max-w-[250px]">
                                        <p className="text-xs text-slate-500 mb-2 border-b border-slate-100 pb-1">{label}</p>
                                        <div className="space-y-2">
                                            {payload.map((entry: any, index: number) => (
                                                <div key={index} className="flex flex-col">
                                                    <span className="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight">
                                                        {entry.payload.title}
                                                    </span>
                                                    <span className="text-xs font-bold text-purple-600">
                                                        Score: {entry.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                                }
                                return null;
                            }}
                        />
                        <Line type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                    </LineChart>
                </ResponsiveContainer>
             </div>
           </div>

          {/* Task History Table */}
          <div className='bg-white rounded-xl border border-slate-200 h-full flex flex-col shadow-sm overflow-hidden'>
            <div className='p-6 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between'>
              <div>
                <h3 className='text-lg font-bold text-slate-900'>
                  Task History
                </h3>
              </div>
              <div className='flex bg-slate-100 p-1 rounded-lg'>
                <button
                  onClick={() => setTaskFilter("ALL")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    taskFilter === "ALL"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTaskFilter("WRITING")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    taskFilter === "WRITING"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Writing
                </button>
                <button
                  onClick={() => setTaskFilter("SPEAKING")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    taskFilter === "SPEAKING"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Speaking
                </button>
              </div>
            </div>

            <div className='overflow-x-auto flex-1'>
              <table className='w-full text-sm text-left text-slate-500'>
                <thead className='text-xs text-slate-700 uppercase bg-slate-50'>
                  <tr>
                    <th className='px-6 py-3 font-medium'>Task Detail</th>
                    <th className='px-6 py-3 font-medium'>Status</th>
                    <th className='px-6 py-3 font-medium text-center'>Score</th>
                    <th className='px-6 py-3 font-medium text-right'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-200'>
                  {filteredAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className='text-center py-8 text-slate-400 italic'>
                         No history found.
                      </td>
                    </tr>
                  ) : (
                    filteredAttempts.map((attempt) => (
                        <tr 
                          key={attempt.id} 
                          className='hover:bg-slate-50 transition-colors cursor-pointer'
                          onClick={() => {
                              const isScored = attempt.status?.toUpperCase() === 'SCORED';
                              if (isScored) {
                                  // Determine type robustly
                                  const type = attempt.skillType || attempt.type || attempt.assignment?.type || attempt.assignment?.skillType;
                                  const isSpeaking = type?.toString().toUpperCase() === 'SPEAKING';
                                  
                                  if (isSpeaking) {
                                      console.log("--> StudentDetail: Navigating to SPEAKING graded page");
                                      navigate(`/teacher/graded/speaking/${attempt.id}`);
                                  } else {
                                      console.log("--> StudentDetail: Navigating to WRITING graded page (Default)");
                                      navigate(`/teacher/graded/${attempt.id}`);
                                  }
                              } else {
                                  navigate(`/teacher/grading/${attempt.id}`);
                              }
                          }}
                        >
                          <td className='px-6 py-4'>
                            <div className='flex items-start gap-3'>
                              <div className={`p-2 rounded-lg border ${getTaskColorClass(attempt.skillType || attempt.type)}`}>
                                {getTaskIcon(attempt.skillType || attempt.type)}
                              </div>
                              <div className='max-w-[180px]'>
                                <p className='font-medium text-slate-900 truncate' title={attempt.title || attempt.assignment?.title}>
                                  {attempt.title || attempt.assignment?.title || "Untitled Task"}
                                </p>
                                <p className='text-xs text-slate-500 truncate'>
                                  {new Date(attempt.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4'>
                             {attempt.status?.toUpperCase() === 'SCORED' ? (
                                 <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                                     <CheckCircle size={14} /> Scored
                                 </span>
                             ) : attempt.status?.toUpperCase() === 'SUBMITTED' ? (
                                 <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">
                                     <Clock size={14} /> Submitted
                                 </span>
                             ) : (
                                  <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-full text-xs font-medium">
                                     In Progress
                                 </span>
                             )}
                          </td>
                          <td className='px-6 py-4 text-center'>
                            {attempt.score?.overallBand ? (
                                <span className='font-bold text-slate-900'>{attempt.score.overallBand}</span>
                            ) : (
                                <span className='text-slate-400'>-</span>
                            )}
                          </td>
                          <td className='px-6 py-4 text-right'>
                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-purple-50 text-purple-600 hover:text-purple-700">
                                <ArrowRight size={16} />
                             </Button>
                          </td>
                        </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDetailPage;
