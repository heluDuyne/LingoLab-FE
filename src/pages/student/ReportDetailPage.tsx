import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  FileText,
  Mic,
  Download,
  Bot,
  CheckCircle,
  Lightbulb,
  Clock,
  BookOpen,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeStatus } from "@/components/ui/badge-status";
import { ROUTES } from "@/constants";

// Types
interface AIFeedback {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  detailedAnalysis?: {
    taskAchievement: { score: number; feedback: string };
    coherenceCohesion: { score: number; feedback: string };
    lexicalResource: { score: number; feedback: string };
    grammaticalRange: { score: number; feedback: string };
  };
  suggestions?: string[];
}

interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  assignmentClassName: string;
  studentId: string;
  status: "PENDING" | "SUBMITTED" | "GRADED";
  submittedAt?: string;
  mediaType?: string;
  content?: string;
  aiFeedback?: AIFeedback;
}

// Mock data
const mockSubmission: Submission = {
  id: "s1",
  assignmentId: "a3",
  assignmentTitle: "IELTS Writing Task 2 - Environment Essay",
  assignmentClassName: "IELTS Writing",
  studentId: "student-001",
  status: "GRADED",
  submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  mediaType: "text",
  content: `Climate change is one of the most pressing issues facing our planet today. Many scientists argue that human activities, particularly the burning of fossil fuels, have significantly contributed to global warming. This essay will discuss the causes of climate change and propose some solutions to address this critical problem.

The primary cause of climate change is the emission of greenhouse gases, mainly carbon dioxide, from industrial activities and transportation. As economies grow and more people rely on cars and factories, the concentration of these gases in the atmosphere continues to rise. Additionally, deforestation has reduced the Earth's capacity to absorb carbon dioxide, exacerbating the problem.

To combat climate change, governments and individuals must take action. Firstly, investing in renewable energy sources such as solar and wind power can reduce our dependence on fossil fuels. Secondly, implementing stricter regulations on industrial emissions and promoting sustainable practices can help lower greenhouse gas output. Finally, raising awareness about environmental issues can encourage individuals to make more eco-friendly choices in their daily lives.

In conclusion, while climate change poses a significant threat to our planet, collective action from governments, businesses, and individuals can help mitigate its effects and create a more sustainable future for generations to come.`,
  aiFeedback: {
    score: 7.5,
    summary:
      "This is a well-structured essay that effectively addresses the topic of climate change. The writer demonstrates good control of language and presents ideas in a logical manner. However, there is room for improvement in vocabulary range and the development of supporting ideas.",
    strengths: [
      "Clear introduction with a well-defined thesis statement that outlines the essay structure",
      "Good use of linking words and cohesive devices throughout the essay",
      "Logical paragraph organization with clear topic sentences",
      "Effective conclusion that summarizes main points and provides a forward-looking statement",
    ],
    weaknesses: [
      "Some subject-verb agreement errors in complex sentences",
      "Limited range of vocabulary - some words are repeated (e.g., 'climate change', 'greenhouse gases')",
      "Supporting examples could be more specific and detailed",
      "Some ideas need further development to fully support the argument",
    ],
    detailedAnalysis: {
      taskAchievement: {
        score: 7.5,
        feedback:
          "The essay addresses all parts of the task. Main ideas are relevant and well-supported, though some points could be developed further with more specific examples.",
      },
      coherenceCohesion: {
        score: 8.0,
        feedback:
          "The essay is well-organized with clear progression throughout. Paragraphs are well-linked, and cohesive devices are used effectively without being overused.",
      },
      lexicalResource: {
        score: 7.0,
        feedback:
          "Good vocabulary range with some less common items. However, there is some repetition of key terms. Consider using more synonyms and academic vocabulary.",
      },
      grammaticalRange: {
        score: 7.5,
        feedback:
          "Good variety of complex structures with generally accurate grammar. Some minor errors occur but do not impede communication.",
      },
    },
    suggestions: [
      "Use more specific statistics or research findings to support your arguments",
      "Expand your vocabulary by learning synonyms for common environmental terms",
      "Practice using a wider variety of complex sentence structures",
      "Include more concrete examples from real-world situations",
      "Review subject-verb agreement rules for complex sentences",
    ],
  },
};

export function ReportDetailPage() {
  const navigate = useNavigate();
  const { submissionId } = useParams();

  // In a real app, fetch submission by ID
  const submission = mockSubmission;

  const handleBack = () => {
    navigate(ROUTES.STUDENT.DASHBOARD);
  };

  if (!submission) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Report not found</p>
      </div>
    );
  }

  const { aiFeedback } = submission;

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-sm text-slate-400">{submission.assignmentClassName}</p>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              {submission.assignmentTitle}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <BadgeStatus
                variant={submission.status === "GRADED" ? "success" : "warning"}
              >
                {submission.status}
              </BadgeStatus>
              {submission.submittedAt && (
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <Clock size={14} />
                  Submitted on{" "}
                  {new Date(submission.submittedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            className="gap-2 border-slate-300"
            onClick={() => window.print()}
          >
            <Download size={16} />
            Download Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overall Score Card */}
          {aiFeedback && (
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot size={32} />
                  <div>
                    <h2 className="text-lg font-bold">AI Assessment</h2>
                    <p className="text-purple-200 text-sm">Overall Band Score</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-5xl font-bold">{aiFeedback.score}</p>
                  <p className="text-purple-200 text-sm">/9.0</p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Scores */}
          {aiFeedback?.detailedAnalysis && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-purple-600" />
                Detailed Band Scores
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Task Achievement */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Task Achievement
                    </span>
                    <span className="text-lg font-bold text-purple-600">
                      {aiFeedback.detailedAnalysis.taskAchievement.score}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${(aiFeedback.detailedAnalysis.taskAchievement.score / 9) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {aiFeedback.detailedAnalysis.taskAchievement.feedback}
                  </p>
                </div>

                {/* Coherence & Cohesion */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Coherence & Cohesion
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {aiFeedback.detailedAnalysis.coherenceCohesion.score}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(aiFeedback.detailedAnalysis.coherenceCohesion.score / 9) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {aiFeedback.detailedAnalysis.coherenceCohesion.feedback}
                  </p>
                </div>

                {/* Lexical Resource */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Lexical Resource
                    </span>
                    <span className="text-lg font-bold text-emerald-600">
                      {aiFeedback.detailedAnalysis.lexicalResource.score}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{
                        width: `${(aiFeedback.detailedAnalysis.lexicalResource.score / 9) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {aiFeedback.detailedAnalysis.lexicalResource.feedback}
                  </p>
                </div>

                {/* Grammatical Range */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Grammatical Range
                    </span>
                    <span className="text-lg font-bold text-amber-600">
                      {aiFeedback.detailedAnalysis.grammaticalRange.score}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-amber-600 h-2 rounded-full"
                      style={{
                        width: `${(aiFeedback.detailedAnalysis.grammaticalRange.score / 9) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {aiFeedback.detailedAnalysis.grammaticalRange.feedback}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Your Submission */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              {submission.mediaType?.startsWith("audio") ? (
                <Mic size={20} className="text-purple-600" />
              ) : (
                <FileText size={20} className="text-purple-600" />
              )}
              Your Submission
            </h3>
            {submission.content && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                  {submission.content}
                </p>
              </div>
            )}
          </div>

          {/* AI Summary */}
          {aiFeedback && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Bot size={20} className="text-purple-600" />
                AI Summary
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {aiFeedback.summary}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Strengths */}
          {aiFeedback && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                Strengths
              </h3>
              <div className="space-y-3">
                {aiFeedback.strengths.map((strength, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
                  >
                    <CheckCircle
                      size={16}
                      className="text-green-600 mt-0.5 shrink-0"
                    />
                    <p className="text-sm text-slate-700">{strength}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Areas for Improvement */}
          {aiFeedback && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-600" />
                Areas for Improvement
              </h3>
              <div className="space-y-3">
                {aiFeedback.weaknesses.map((weakness, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100"
                  >
                    <Lightbulb
                      size={16}
                      className="text-amber-600 mt-0.5 shrink-0"
                    />
                    <p className="text-sm text-slate-700">{weakness}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {aiFeedback?.suggestions && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-blue-600" />
                Suggestions for Improvement
              </h3>
              <ul className="space-y-2">
                {aiFeedback.suggestions.map((suggestion, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <span className="text-purple-600 font-bold">{i + 1}.</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportDetailPage;

