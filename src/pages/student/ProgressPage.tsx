import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  TrendingUp,
  ClipboardCheck,
  Sparkles,
  Brain,
  CheckCircle,
  AlertTriangle,
  Eye,
  Loader2,
  Mic,
  PenTool
} from "lucide-react";
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
import { attemptApi } from "@/services/api/attempts";
import { useAuthStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { type AttemptList } from "@/types";

export function ProgressPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageScore: 0,
    totalTasks: 0,
    completedTasks: 0,
    trend: 0,
    projectedScore: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<AttemptList[]>([]);
  
  // Separate stats for charts
  const [speakingData, setSpeakingData] = useState<any[]>([]);
  const [writingData, setWritingData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        const response = await attemptApi.getAttemptsByLearner(user.id);
        const attempts = response.data || [];

        // Process data for charts and stats
        const scoredAttempts: AttemptList[] = attempts.filter((a: AttemptList) => 
            (a.status === 'scored' || a.status === 'submitted' || a.status === 'grad') && a.score
        ).sort((a: AttemptList, b: AttemptList) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        // Calculate Stats
        const totalScore = scoredAttempts.reduce((sum: number, a: AttemptList) => sum + (Number(a.score?.overallBand) || 0), 0);
        const avgScore = scoredAttempts.length > 0 ? (totalScore / scoredAttempts.length) : 0;
        
        // Calculate Trend (vs last 3 attempts)
        const last3 = scoredAttempts.slice(-3);
        const prev3 = scoredAttempts.slice(-6, -3);
        const last3Avg = last3.length ? last3.reduce((s: number, a: AttemptList) => s + Number(a.score?.overallBand || 0), 0) / last3.length : 0;
        const prev3Avg = prev3.length ? prev3.reduce((s: number, a: AttemptList) => s + Number(a.score?.overallBand || 0), 0) / prev3.length : 0;
        const trend = last3Avg - prev3Avg;

        setStats({
            averageScore: Number(avgScore.toFixed(1)),
            totalTasks: attempts.length,
            completedTasks: scoredAttempts.length,
            trend: Number(trend.toFixed(1)),
            projectedScore: Math.min(9.0, Number((avgScore + (trend > 0 ? 0.5 : 0)).toFixed(1))) // Simple projection
        });


        // Trend Chart Data
        const chart = scoredAttempts.map((a: AttemptList) => ({
            date: new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            score: Number(a.score?.overallBand) || 0,
            fullDate: new Date(a.createdAt).toLocaleDateString()
        }));
        setChartData(chart);

        // --- Aggregation Logic ---

        // Helper to aggregate data
        const aggregateSkills = (skillAttempts: AttemptList[], type: 'speaking' | 'writing') => {
             const agg = {
                 cat1: 0, cat2: 0, cat3: 0, cat4: 0, count: 0
             };

             skillAttempts.forEach(a => {
                 if (!a.score) return;
                 // Try deep path first (from detailedFeedback.aiScores), then root score props, then default
                 const aiScores = a.score.detailedFeedback?.aiScores || {};
                 const rootScores = a.score;

                 let c1 = 0, c2 = 0, c3 = 0, c4 = 0;
                 const base = Number(rootScores.overallBand) || 0; 
                 // If detailed scores are missing, we might use overallBand as a placeholder or 0. 
                 // Using overallBand prevents charts from looking broken if detail is missing.

                 if (type === 'speaking') {
                     // Fluency, Pronunciation, Lexical, Grammar
                     c1 = Number(aiScores.fluency || rootScores.fluency || base);
                     c2 = Number(aiScores.pronunciation || rootScores.pronunciation || base);
                     c3 = Number(aiScores.lexical || rootScores.lexical || base);
                     c4 = Number(aiScores.grammar || rootScores.grammar || base);
                 } else {
                     // Task Response, Coherence, Lexical, Grammar
                     c1 = Number(aiScores.taskResponse || rootScores.fluency || base); // Assuming fallback might map closely or just use base
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

        const speakingAttempts = scoredAttempts.filter(a => a.skillType?.toLowerCase() === 'speaking');
        const writingAttempts = scoredAttempts.filter(a => a.skillType?.toLowerCase() === 'writing');

        setSpeakingData(aggregateSkills(speakingAttempts, 'speaking'));
        setWritingData(aggregateSkills(writingAttempts, 'writing'));

        setRecentAttempts(scoredAttempts.reverse().slice(0, 5));

      } catch (err) {
        console.error("Failed to load progress data", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
        fetchData();
    }
  }, [user?.id]);

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
      );
  }

  return (
    <div className='w-full max-w-[1280px] mx-auto flex flex-col gap-8 pb-12 animate-in fade-in duration-300'>
      {/* Page Heading */}
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900'>
          Your Progress Analytics
        </h1>
        <p className='text-slate-500 text-base font-normal'>
          Track your IELTS band score improvements and AI insights.
        </p>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* KPI 1 */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-40'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-sm font-medium text-slate-500'>
                Current Band Score
              </p>
              <h3 className='text-4xl font-bold mt-2 text-slate-900'>{stats.averageScore}</h3>
            </div>
            {stats.trend !== 0 && (
                <div className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${stats.trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <TrendingUp size={14} className={stats.trend < 0 ? "rotate-90" : ""} />
                {stats.trend > 0 ? '+' : ''}{stats.trend}
                </div>
            )}
          </div>
          <p className='text-sm text-slate-500'>Average across all tasks</p>
        </div>

        {/* KPI 2 */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-40'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-sm font-medium text-slate-500'>
                Tasks Completed
              </p>
              <h3 className='text-4xl font-bold mt-2 text-slate-900'>{stats.completedTasks}</h3>
            </div>
            <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600'>
              <ClipboardCheck size={24} />
            </div>
          </div>
          <p className='text-sm text-slate-500'>Total evaluated submissions</p>
        </div>

        {/* KPI 3 */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-40'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-sm font-medium text-slate-500'>
                Projected Score
              </p>
              <h3 className='text-4xl font-bold mt-2 text-purple-600'>{stats.projectedScore}</h3>
            </div>
            <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600'>
              <Sparkles size={24} />
            </div>
          </div>
          <p className='text-sm text-slate-500'>Based on current trajectory</p>
        </div>
      </div>

      {/* Main Trend Chart */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='col-span-1 md:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[400px]'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-lg font-bold text-slate-900'>
              Score History Trend
            </h3>
          </div>
          <div className="flex-1 w-full h-full">
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 9]} ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]} stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#0F172A', fontWeight: 600 }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={3} activeDot={{ r: 8, fill: "#7C3AED" }} dot={{ fill: "#7C3AED", strokeWidth: 0, r: 4 }} />
                </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Skill Radar Charts Row */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Speaking Chart */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[400px]'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-lg font-bold text-slate-900 flex items-center gap-2'>
              <Mic className='text-purple-600' size={24} />
              Speaking Skills
            </h3>
          </div>
          <div className="flex-1 w-full h-full flex items-center justify-center">
             {speakingData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={speakingData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 9]} tick={false} axisLine={false} />
                        <Radar
                            name="Avg Score"
                            dataKey="A"
                            stroke="#9333ea"
                            fill="#9333ea"
                            fillOpacity={0.3}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
             ) : (
                <div className="text-center text-slate-400">
                    <p>No speaking tasks evaluated yet.</p>
                </div>
             )}
          </div>
        </div>

        {/* Writing Chart */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[400px]'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-lg font-bold text-slate-900 flex items-center gap-2'>
              <PenTool className='text-blue-600' size={24} />
              Writing Skills
            </h3>
          </div>
          <div className="flex-1 w-full h-full flex items-center justify-center">
             {writingData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={writingData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 9]} tick={false} axisLine={false} />
                        <Radar
                            name="Avg Score"
                            dataKey="A"
                            stroke="#2563eb"
                            fill="#2563eb"
                            fillOpacity={0.3}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
             ) : (
                <div className="text-center text-slate-400">
                    <p>No writing tasks evaluated yet.</p>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200'>
        <div className='flex justify-between items-center mb-6'>
            <h3 className='text-lg font-bold text-slate-900'>Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left order-collapse">
                <thead>
                    <tr className="border-b border-slate-100">
                        <th className="p-4 font-semibold text-slate-500 text-sm">Assignment</th>
                        <th className="p-4 font-semibold text-slate-500 text-sm">Date</th>
                        <th className="p-4 font-semibold text-slate-500 text-sm">Type</th>
                        <th className="p-4 font-semibold text-slate-500 text-sm">Score</th>
                        <th className="p-4 font-semibold text-slate-500 text-sm">Status</th>
                        <th className="p-4 font-semibold text-slate-500 text-sm">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {recentAttempts.map((attempt) => (
                        <tr key={attempt.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-slate-900 font-medium">{attempt.title || 'Untitled Task'}</td>
                            <td className="p-4 text-slate-500 text-sm">
                                {new Date(attempt.createdAt).toLocaleDateString()}
                            </td>
                                <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    attempt.skillType?.toLowerCase() === 'speaking' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {attempt.skillType?.toLowerCase() === 'speaking' ? <Mic size={12}/> : <PenTool size={12}/>}
                                    {attempt.skillType || 'Unknown'}
                                </span>
                            </td>
                            <td className="p-4">
                                <span className="font-bold text-slate-900">{attempt.score?.overallBand || '-'}</span>
                                <span className="text-slate-400 text-xs">/9</span>
                            </td>
                            <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    attempt.status === 'scored' || attempt.status === 'grad'
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {attempt.status.toUpperCase()}
                                </span>
                            </td>
                                <td className="p-4">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-xs border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-600"
                                    onClick={() => navigate(`/learner/report/${attempt.id}`)}
                                >
                                    <Eye size={14} className="mr-1.5" />
                                    View Report
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {recentAttempts.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                    No recent activity found.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
