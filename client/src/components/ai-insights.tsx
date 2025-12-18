import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Sparkles,
  Camera,
  DollarSign,
  Calendar,
  Lightbulb,
  Shield,
  Zap,
  RefreshCw
} from "lucide-react";
import {
  getAIInsightsSummary,
  generateBudgetForecast,
  getWeatherScheduleRecommendations,
  predictProjectProgress,
  type BudgetForecast,
  type WeatherRecommendation,
  type SchedulePrediction
} from "@/lib/ml-service";
import { useBudgetStore } from "@/store/budgetStore";
import { useScheduleStore } from "@/store/scheduleStore";
import { useProjectStore } from "@/store/projectStore";

// Default project location (can be extended to be configurable per project)
const DEFAULT_PROJECT_LOCATION = "Bhopal";

interface AIInsightsProps {
  compact?: boolean;
}

export function AIInsights({ compact = false }: AIInsightsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<{
    photoInsights: { analyzed: number; avgProgress: number; safetyScore: number };
    budgetInsights: { riskLevel: string; savings: number; anomalies: number };
    scheduleInsights: { onTrack: boolean; delayRisk: string; recommendations: number };
  } | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const data = await getAIInsightsSummary();
      setInsights(data);
    } catch (error) {
      console.error("Failed to load AI insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-[#242424] bg-gradient-to-br from-[#1a1a2e] to-[#0a0a15] p-4 rounded-2xl animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-[#2a2a3a]" />
          <div className="h-6 w-32 rounded bg-[#2a2a3a]" />
        </div>
        <div className="space-y-3">
          <div className="h-16 rounded-xl bg-[#2a2a3a]" />
          <div className="h-16 rounded-xl bg-[#2a2a3a]" />
          <div className="h-16 rounded-xl bg-[#2a2a3a]" />
        </div>
      </Card>
    );
  }

  if (!insights) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-400 bg-red-400/10";
      case "medium": return "text-yellow-400 bg-yellow-400/10";
      default: return "text-green-400 bg-green-400/10";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "high": return <AlertTriangle className="h-4 w-4" />;
      case "medium": return <TrendingUp className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  if (compact) {
    return (
      <Card className="border border-[#242424] bg-gradient-to-br from-[#1a1a2e] to-[#0a0a15] p-3 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10">
              <Sparkles className="h-4 w-4 text-purple-400" />
            </div>
            <span className="text-sm font-semibold text-white">AI Insights</span>
          </div>
          <button
            onClick={loadInsights}
            className="p-1.5 rounded-lg hover:bg-[#2a2a3a] transition"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#888]" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-[#1a1a2a]">
            <Camera className="h-4 w-4 mx-auto text-blue-400" />
            <p className="text-lg font-bold text-white mt-1">{insights.photoInsights.analyzed}</p>
            <p className="text-[0.6rem] text-[#888]">Photos Analyzed</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-[#1a1a2a]">
            <DollarSign className="h-4 w-4 mx-auto text-green-400" />
            <p className="text-lg font-bold text-white mt-1">₹{Math.round(insights.budgetInsights.savings / 1000)}K</p>
            <p className="text-[0.6rem] text-[#888]">Savings Found</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-[#1a1a2a]">
            <Calendar className="h-4 w-4 mx-auto text-orange-400" />
            <p className="text-lg font-bold text-white mt-1">{insights.scheduleInsights.recommendations}</p>
            <p className="text-[0.6rem] text-[#888]">Suggestions</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-[#242424] bg-gradient-to-br from-[#1a1a2e] to-[#0a0a15] p-4 xs:p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10">
            <Brain className="h-5 w-5 xs:h-6 xs:w-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-base xs:text-lg font-bold text-white">AI Insights</h3>
            <p className="text-[0.65rem] xs:text-xs text-[#888]">Powered by machine learning</p>
          </div>
        </div>
        <button
          onClick={loadInsights}
          className="p-2 rounded-lg hover:bg-[#2a2a3a] transition"
          title="Refresh insights"
        >
          <RefreshCw className="h-4 w-4 text-[#888]" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Photo Analysis Insights */}
        <div className="p-3 rounded-xl bg-[#1a1a2a] border border-[#2a2a3a]">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Photo Analysis</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xl font-bold text-white">{insights.photoInsights.analyzed}</p>
              <p className="text-[0.6rem] text-[#888]">Analyzed</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">{insights.photoInsights.avgProgress}%</p>
              <p className="text-[0.6rem] text-[#888]">Avg Progress</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">{Math.round(insights.photoInsights.safetyScore * 100)}%</p>
              <p className="text-[0.6rem] text-[#888]">Safety Score</p>
            </div>
          </div>
        </div>

        {/* Budget Insights */}
        <div className="p-3 rounded-xl bg-[#1a1a2a] border border-[#2a2a3a]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-sm font-semibold text-white">Budget Forecast</span>
            </div>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getRiskColor(insights.budgetInsights.riskLevel)}`}>
              {getRiskIcon(insights.budgetInsights.riskLevel)}
              {insights.budgetInsights.riskLevel} risk
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.6rem] text-[#888]">Potential Savings</p>
              <p className="text-lg font-bold text-green-400">₹{insights.budgetInsights.savings.toLocaleString()}</p>
            </div>
            {insights.budgetInsights.anomalies > 0 && (
              <div className="flex items-center gap-1 text-yellow-400 text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{insights.budgetInsights.anomalies} anomalies detected</span>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Insights */}
        <div className="p-3 rounded-xl bg-[#1a1a2a] border border-[#2a2a3a]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-semibold text-white">Schedule Prediction</span>
            </div>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              insights.scheduleInsights.onTrack
                ? "text-green-400 bg-green-400/10"
                : "text-yellow-400 bg-yellow-400/10"
            }`}>
              {insights.scheduleInsights.onTrack ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  On Track
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  At Risk
                </>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.6rem] text-[#888]">Delay Risk Level</p>
              <p className={`text-sm font-semibold capitalize ${getRiskColor(insights.scheduleInsights.delayRisk).split(' ')[0]}`}>
                {insights.scheduleInsights.delayRisk}
              </p>
            </div>
            <div className="flex items-center gap-1 text-purple-400 text-xs">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>{insights.scheduleInsights.recommendations} optimization tips</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Weather-based Task Recommendations Component
export function WeatherTaskRecommendations() {
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<WeatherRecommendation[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);

  // Get current project phase from schedule store
  const phases = useScheduleStore((state) => state.phases);
  const currentPhase = useMemo(() => {
    // Find the phase that's currently in progress (highest progress < 100%)
    const inProgressPhases = phases
      .filter((p) => p.progress > 0 && p.progress < 100)
      .sort((a, b) => b.progress - a.progress);
    return inProgressPhases[0]?.name.toLowerCase() || "structure";
  }, [phases]);

  useEffect(() => {
    loadRecommendations();
  }, [currentPhase]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const data = await getWeatherScheduleRecommendations(DEFAULT_PROJECT_LOCATION, currentPhase);
      setRecommendations(data);
    } catch (error) {
      console.error("Failed to load weather recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-[#242424] bg-gradient-to-br from-[#1a2a1a] to-[#0a150a] p-4 rounded-2xl animate-pulse">
        <div className="h-6 w-48 rounded bg-[#2a3a2a] mb-4" />
        <div className="h-32 rounded-xl bg-[#2a3a2a]" />
      </Card>
    );
  }

  const selected = recommendations[selectedDay];
  if (!selected) return null;

  const getWeatherIcon = (condition: string) => {
    if (condition.toLowerCase().includes("rain")) return "🌧️";
    if (condition.toLowerCase().includes("cloud")) return "☁️";
    if (condition.toLowerCase().includes("wind")) return "💨";
    return "☀️";
  };

  const getWorkabilityColor = (score: number) => {
    if (score >= 0.75) return "text-green-400";
    if (score >= 0.5) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <Card className="border border-[#242424] bg-gradient-to-br from-[#1a2a1a] to-[#0a150a] p-4 xs:p-5 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-blue-500/10">
          <Cloud className="h-5 w-5 xs:h-6 xs:w-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-base xs:text-lg font-bold text-white">Smart Weather Scheduling</h3>
          <p className="text-[0.65rem] xs:text-xs text-[#888]">AI-powered task recommendations</p>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {recommendations.slice(0, 7).map((day, idx) => (
          <button
            key={day.date}
            onClick={() => setSelectedDay(idx)}
            className={`flex flex-col items-center min-w-[60px] p-2 rounded-xl transition ${
              selectedDay === idx
                ? "bg-[#cfe0ad] text-black"
                : "bg-[#1a2a1a] text-white hover:bg-[#2a3a2a]"
            }`}
          >
            <span className="text-lg">{getWeatherIcon(day.weather.condition)}</span>
            <span className="text-xs font-semibold">{day.dayOfWeek}</span>
            <span className="text-[0.6rem]">{day.weather.temp}°C</span>
          </button>
        ))}
      </div>

      {/* Selected Day Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#1a2a1a] border border-[#2a3a2a]">
          <div>
            <p className="text-sm font-semibold text-white">{selected.weather.condition}</p>
            <p className="text-xs text-[#888]">
              {selected.weather.humidity}% humidity • {selected.weather.windSpeed} km/h wind
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#888]">Workability</p>
            <p className={`text-xl font-bold ${getWorkabilityColor(selected.workabilityScore)}`}>
              {Math.round(selected.workabilityScore * 100)}%
            </p>
          </div>
        </div>

        {/* Recommended Tasks */}
        {selected.recommendedTasks.length > 0 && (
          <div className="p-3 rounded-xl bg-[#1a2a1a] border border-[#2a3a2a]">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-sm font-semibold text-white">Recommended Tasks</span>
            </div>
            <div className="space-y-2">
              {selected.recommendedTasks.slice(0, 3).map((task, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-[#ccc]">{task.task}</span>
                  <span className="text-green-400 font-semibold">
                    {Math.round(task.suitabilityScore * 100)}% suitable
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avoid Tasks */}
        {selected.avoidTasks.length > 0 && (
          <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-semibold text-red-400">Avoid Today</span>
            </div>
            <p className="text-xs text-[#888]">{selected.avoidTasks.join(", ")}</p>
          </div>
        )}

        {/* Weather Alerts */}
        {selected.alerts.length > 0 && (
          <div className="space-y-2">
            {selected.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border ${
                  alert.severity === "high"
                    ? "bg-red-500/10 border-red-500/30"
                    : alert.severity === "medium"
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-blue-500/10 border-blue-500/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className={`h-3.5 w-3.5 ${
                    alert.severity === "high" ? "text-red-400" :
                    alert.severity === "medium" ? "text-yellow-400" : "text-blue-400"
                  }`} />
                  <span className="text-xs font-semibold text-white">{alert.message}</span>
                </div>
                <p className="text-[0.65rem] text-[#888]">{alert.recommendation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// Budget Forecast Component
export function BudgetForecastCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [forecast, setForecast] = useState<BudgetForecast | null>(null);

  // Get real budget data from store
  const totalSpent = useBudgetStore((state) => state.getTotalSpent());
  const totalAllocated = useBudgetStore((state) => state.getTotalAllocated());
  const spendingHistory = useBudgetStore((state) => state.spendingHistory);
  const expenses = useBudgetStore((state) => state.expenses);

  // Convert spending history to the format expected by ML service
  const historicalData = useMemo(() => {
    return expenses.map((exp) => ({
      date: exp.date,
      amount: exp.amount,
      category: exp.category
    }));
  }, [expenses]);

  useEffect(() => {
    loadForecast();
  }, [totalSpent, totalAllocated]);

  const loadForecast = async () => {
    setIsLoading(true);
    try {
      const data = await generateBudgetForecast(totalSpent, totalAllocated, historicalData);
      setForecast(data);
    } catch (error) {
      console.error("Failed to load budget forecast:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !forecast) {
    return (
      <Card className="border border-[#242424] bg-gradient-to-br from-[#2a1a1a] to-[#150a0a] p-4 rounded-2xl animate-pulse">
        <div className="h-6 w-48 rounded bg-[#3a2a2a] mb-4" />
        <div className="h-32 rounded-xl bg-[#3a2a2a]" />
      </Card>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-400 bg-red-400/10 border-red-400/30";
      case "medium": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
      default: return "text-green-400 bg-green-400/10 border-green-400/30";
    }
  };

  return (
    <Card className="border border-[#242424] bg-gradient-to-br from-[#2a1a1a] to-[#150a0a] p-4 xs:p-5 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-emerald-500/10">
          <TrendingUp className="h-5 w-5 xs:h-6 xs:w-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base xs:text-lg font-bold text-white">Budget Forecast</h3>
          <p className="text-[0.65rem] xs:text-xs text-[#888]">ML-powered spending prediction</p>
        </div>
      </div>

      {/* Overrun Risk */}
      <div className={`p-3 rounded-xl border mb-4 ${getRiskColor(forecast.overrunRisk)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {forecast.overrunRisk === "high" ? (
              <AlertTriangle className="h-5 w-5" />
            ) : forecast.overrunRisk === "medium" ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            <div>
              <p className="text-sm font-semibold capitalize">{forecast.overrunRisk} Overrun Risk</p>
              <p className="text-xs opacity-80">{Math.round(forecast.overrunProbability * 100)}% probability</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80">Predicted Total</p>
            <p className="text-lg font-bold">₹{Math.round(forecast.predictedTotal).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Spending Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-[#888]">Current Spending</span>
          <span className="text-white font-semibold">
            ₹{forecast.currentSpent.toLocaleString()} / ₹{forecast.totalBudget.toLocaleString()}
          </span>
        </div>
        <div className="h-3 rounded-full bg-[#2a2a2a] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
            style={{ width: `${(forecast.currentSpent / forecast.totalBudget) * 100}%` }}
          />
        </div>
      </div>

      {/* Anomalies */}
      {forecast.anomalies.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-400">Spending Anomaly Detected</span>
          </div>
          {forecast.anomalies.map((anomaly) => (
            <p key={anomaly.id} className="text-xs text-[#ccc]">
              {anomaly.description} ({anomaly.category})
            </p>
          ))}
        </div>
      )}

      {/* Savings Opportunities */}
      {forecast.savingsOpportunities.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">Savings Opportunities</span>
          </div>
          {forecast.savingsOpportunities.map((opp, idx) => (
            <div key={idx} className="p-2 rounded-lg bg-[#1a1a2a] text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#888]">{opp.category}</span>
                <span className="text-green-400 font-semibold">
                  Save ₹{Math.round(opp.potentialSavings).toLocaleString()}
                </span>
              </div>
              <p className="text-[#ccc]">{opp.recommendation}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// Schedule Prediction Component
export function SchedulePredictionCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [prediction, setPrediction] = useState<SchedulePrediction | null>(null);

  // Get real schedule data from stores
  const project = useProjectStore((state) => state.project);
  const phases = useScheduleStore((state) => state.phases);
  const getOverallProgress = useScheduleStore((state) => state.getOverallProgress);
  const getTasksByStatus = useScheduleStore((state) => state.getTasksByStatus);

  // Calculate schedule metrics from real data
  const scheduleMetrics = useMemo(() => {
    const taskStats = getTasksByStatus();
    const totalTasks = taskStats.completed + taskStats.in_progress + taskStats.pending;
    const completedTasks = taskStats.completed;
    const progress = getOverallProgress();

    return {
      currentProgress: progress,
      tasksCompleted: completedTasks,
      totalTasks,
      startDate: project.startDate,
      targetEndDate: project.targetEndDate
    };
  }, [phases, project, getOverallProgress, getTasksByStatus]);

  useEffect(() => {
    loadPrediction();
  }, [scheduleMetrics.currentProgress, scheduleMetrics.tasksCompleted]);

  const loadPrediction = async () => {
    setIsLoading(true);
    try {
      const data = await predictProjectProgress(
        scheduleMetrics.currentProgress,
        scheduleMetrics.tasksCompleted,
        scheduleMetrics.totalTasks,
        scheduleMetrics.startDate,
        scheduleMetrics.targetEndDate
      );
      setPrediction(data);
    } catch (error) {
      console.error("Failed to load schedule prediction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !prediction) {
    return (
      <Card className="border border-[#242424] bg-gradient-to-br from-[#1a1a2a] to-[#0a0a15] p-4 rounded-2xl animate-pulse">
        <div className="h-6 w-48 rounded bg-[#2a2a3a] mb-4" />
        <div className="h-32 rounded-xl bg-[#2a2a3a]" />
      </Card>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-400";
      case "medium": return "text-yellow-400";
      default: return "text-green-400";
    }
  };

  return (
    <Card className="border border-[#242424] bg-gradient-to-br from-[#1a1a2a] to-[#0a0a15] p-4 xs:p-5 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-orange-500/10">
          <Calendar className="h-5 w-5 xs:h-6 xs:w-6 text-orange-400" />
        </div>
        <div>
          <h3 className="text-base xs:text-lg font-bold text-white">Schedule Prediction</h3>
          <p className="text-[0.65rem] xs:text-xs text-[#888]">AI-powered timeline analysis</p>
        </div>
      </div>

      {/* Delay Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-[#1a1a2a] border border-[#2a2a3a]">
          <p className="text-[0.6rem] text-[#888] uppercase tracking-wider">Target End</p>
          <p className="text-lg font-bold text-white">{prediction.originalEndDate}</p>
        </div>
        <div className="p-3 rounded-xl bg-[#1a1a2a] border border-[#2a2a3a]">
          <p className="text-[0.6rem] text-[#888] uppercase tracking-wider">Predicted End</p>
          <p className={`text-lg font-bold ${
            prediction.delayDays > 0 ? "text-yellow-400" : "text-green-400"
          }`}>
            {prediction.predictedEndDate}
          </p>
        </div>
      </div>

      {prediction.delayDays > 0 && (
        <div className={`p-3 rounded-xl border mb-4 ${
          prediction.delayRisk === "high"
            ? "bg-red-500/10 border-red-500/30"
            : prediction.delayRisk === "medium"
            ? "bg-yellow-500/10 border-yellow-500/30"
            : "bg-green-500/10 border-green-500/30"
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${getRiskColor(prediction.delayRisk)}`} />
            <span className={`text-sm font-semibold ${getRiskColor(prediction.delayRisk)}`}>
              {prediction.delayDays} days delay predicted
            </span>
          </div>
        </div>
      )}

      {/* Critical Tasks */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">Critical Tasks</span>
        </div>
        <div className="space-y-2">
          {prediction.criticalTasks.map((task, idx) => (
            <div key={idx} className="p-2 rounded-lg bg-[#1a1a2a] border border-[#2a2a3a]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white">{task.name}</span>
                <span className={`text-xs font-semibold ${
                  task.impact === "high" ? "text-red-400" :
                  task.impact === "medium" ? "text-yellow-400" : "text-green-400"
                }`}>
                  {task.impact} impact
                </span>
              </div>
              <div className="flex items-center justify-between text-[0.6rem] text-[#888]">
                <span>Progress: {task.currentProgress}%</span>
                {task.predictedDelay > 0 && (
                  <span className="text-yellow-400">+{task.predictedDelay} days delay</span>
                )}
              </div>
              <p className="text-[0.65rem] text-[#aaa] mt-1">{task.suggestion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Optimization Suggestions */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-semibold text-white">AI Suggestions</span>
        </div>
        <ul className="space-y-1">
          {prediction.optimizationSuggestions.map((suggestion, idx) => (
            <li key={idx} className="text-xs text-[#aaa] flex items-start gap-2">
              <span className="text-[#cfe0ad] mt-0.5">•</span>
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
