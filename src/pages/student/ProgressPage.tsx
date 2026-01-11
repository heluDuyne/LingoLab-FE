import { useState, useEffect } from "react";
import {
  TrendingUp,
  ClipboardCheck,
  Sparkles,
  Brain,
  CheckCircle,
  AlertTriangle,
  Eye,
  Loader2,
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

export function ProgressPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageScore: 0,
    totalTasks: 0,
    completedTasks: 0,
    trend: 0,
    projectedScore: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [skillData, setSkillData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const response = await attemptApi.getAttemptsByLearner(user.id);
        const attempts = response.data || [];

        // Process data for charts and stats
        const scoredAttempts = attempts.filter((a: any) => 
            (a.status === 'SCORED' || a.status === 'SUBMITTED') && a.score
        ).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        // Calculate Stats
        const totalScore = scoredAttempts.reduce((sum: number, a: any) => sum + (Number(a.score.overallBand) || 0), 0);
        const avgScore = scoredAttempts.length > 0 ? (totalScore / scoredAttempts.length) : 0;
        
        // Calculate Trend (vs last 3 attempts)
        const last3 = scoredAttempts.slice(-3);
        const prev3 = scoredAttempts.slice(-6, -3);
        const last3Avg = last3.length ? last3.reduce((s: number, a: any) => s + Number(a.score.overallBand || 0), 0) / last3.length : 0;
        const prev3Avg = prev3.length ? prev3.reduce((s: number, a: any) => s + Number(a.score.overallBand || 0), 0) / prev3.length : 0;
        const trend = last3Avg - prev3Avg;

        setStats({
            averageScore: Number(avgScore.toFixed(1)),
            totalTasks: attempts.length,
            completedTasks: scoredAttempts.length,
            trend: Number(trend.toFixed(1)),
            projectedScore: Math.min(9.0, Number((avgScore + (trend > 0 ? 0.5 : 0)).toFixed(1))) // Simple projection
        });

        // Chart Data
        const chart = scoredAttempts.map((a: any) => ({
            date: new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            score: Number(a.score.overallBand) || 0,
            fullDate: new Date(a.createdAt).toLocaleDateString()
        }));
        setChartData(chart);

        // Skill Radar Data (Mocked logic based on aggregated scores if available, else random for demo if detail missing)
        // Ideally we'd aggregate specific skill scores from attempts
        const skillAgg = {
            fluency: 0, pronunciation: 0, lexical: 0, grammar: 0, coherence: 0, count: 0
        };
        
        scoredAttempts.forEach((a: any) => {
             // Mock extraction if detailed scores aren't in the list view (they might be in detail view only)
             // Assuming list view has basic core. checking logic..
             // If data isn't deep enough, we use overall or mock distribution centered around overall
             const base = Number(a.score.overallBand) || 6.0;
             skillAgg.fluency += (a.score.fluency || base);
             skillAgg.pronunciation += (a.score.pronunciation || base);
             skillAgg.lexical += (a.score.lexical || base);
             skillAgg.grammar += (a.score.grammar || base);
             skillAgg.count++;
        });

        if (skillAgg.count > 0) {
            setSkillData([
                { subject: 'Fluency', A: (skillAgg.fluency / skillAgg.count).toFixed(1), fullMark: 9 },
                { subject: 'Pronunciation', A: (skillAgg.pronunciation / skillAgg.count).toFixed(1), fullMark: 9 },
                { subject: 'Lexical', A: (skillAgg.lexical / skillAgg.count).toFixed(1), fullMark: 9 },
                { subject: 'Grammar', A: (skillAgg.grammar / skillAgg.count).toFixed(1), fullMark: 9 },
            ]);
        } else {
             // Default if no data
             setSkillData([
                { subject: 'Fluency', A: 0, fullMark: 9 },
                { subject: 'Pronunciation', A: 0, fullMark: 9 },
                { subject: 'Lexical', A: 0, fullMark: 9 },
                { subject: 'Grammar', A: 0, fullMark: 9 },
            ]);
        }

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

      {/* Main Chart & Skill Radar */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Trend Chart */}
        <div className='lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[400px]'>
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

        {/* Skill Radar */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[400px]'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-lg font-bold text-slate-900 flex items-center gap-2'>
              <Brain className='text-purple-600' size={24} />
              Skill Breakdown
            </h3>
          </div>
          <div className="flex-1 w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 9]} tickCount={6} />
                    <Radar name="Performance" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses + Recent Activity */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Strengths & Weaknesses - Placeholder for now until AI feedback analysis logic is better */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full'>
          <h3 className='text-lg font-bold text-slate-900 mb-6'>
            Performance Summary
          </h3>
          <div className='flex flex-col gap-6'>
            <div className='flex-1'>
               <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2'>
                <span className='w-2 h-2 rounded-full bg-green-500' />
                Top Strengths
              </h4>
               {stats.averageScore >= 6.5 ? (
                   <ul className='space-y-3'>
                        <li className='flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100'>
                        <CheckCircle size={18} className='text-green-600 mt-0.5' />
                        <span className='text-sm text-slate-800'>Consistent performance in recent tasks.</span>
                        </li>
                   </ul>
               ) : (
                   <p className="text-sm text-slate-500">Keep practicing to identify your core strengths!</p>
               )}
            </div>
             <div className='flex-1'>
               <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2'>
                <span className='w-2 h-2 rounded-full bg-orange-500' />
                Focus Areas
              </h4>
                <ul className='space-y-3'>
                    <li className='flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100'>
                    <AlertTriangle size={18} className='text-orange-600 mt-0.5' />
                    <span className='text-sm text-slate-800'>Continue working on improving your overall band score.</span>
                    </li>
                </ul>
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-lg font-bold text-slate-900'>
              Recent Submissions
            </h3>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse'>
              <thead>
                <tr className='border-b border-slate-100'>
                  <th className='py-3 px-2 text-xs font-medium text-slate-500 uppercase'>Task</th>
                  <th className='py-3 px-2 text-xs font-medium text-slate-500 uppercase'>Date</th>
                  <th className='py-3 px-2 text-xs font-medium text-slate-500 uppercase text-center'>Score</th>
                  <th className='py-3 px-2 text-xs font-medium text-slate-500 uppercase text-right'>Action</th>
                </tr>
              </thead>
              <tbody className='text-sm'>
                {recentAttempts.length > 0 ? (
                    recentAttempts.map((attempt) => (
                        <tr key={attempt.id} className='group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0'>
                        <td className='py-3 px-2 font-medium text-slate-900'>
                            {attempt.title || "Untitled Task"}
                            <div className='text-xs font-normal text-slate-500 capitalize'>
                            {attempt.skillType}
                            </div>
                        </td>
                        <td className='py-3 px-2 text-slate-500 whitespace-nowrap'>
                            {new Date(attempt.createdAt).toLocaleDateString()}
                        </td>
                        <td className='py-3 px-2 text-center'>
                            <span className={`inline-flex items-center justify-center w-8 h-8 font-bold rounded-full text-xs ${Number(attempt.score?.overallBand || 0) >= 6.5 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {attempt.score?.overallBand || '-'}
                            </span>
                        </td>
                        <td className='py-3 px-2 text-right'>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-purple-600" onClick={() => window.location.href = `/learner/report/${attempt.id}`}>
                                <Eye size={18} />
                            </Button>
                        </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">No submissions yet.</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressPage;
