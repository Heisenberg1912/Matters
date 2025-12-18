/**
 * Mock ML/AI Service for MATTERS Construction Platform
 * Simulates machine learning predictions and analysis
 */

// Types for ML predictions
export interface PhotoAnalysisResult {
  id: string;
  phase: 'foundation' | 'structure' | 'electrical' | 'plumbing' | 'finishing';
  phaseConfidence: number;
  progressEstimate: number;
  progressConfidence: number;
  safetyScore: number;
  qualityScore: number;
  issues: SafetyIssue[];
  materials: DetectedMaterial[];
  timestamp: Date;
}

export interface SafetyIssue {
  type: 'helmet' | 'vest' | 'scaffolding' | 'debris' | 'equipment';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location?: string;
}

export interface DetectedMaterial {
  name: string;
  confidence: number;
  estimatedQuantity?: string;
}

export interface BudgetPrediction {
  month: string;
  predicted: number;
  actual?: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

export interface BudgetForecast {
  currentSpent: number;
  totalBudget: number;
  predictedTotal: number;
  overrunRisk: 'low' | 'medium' | 'high';
  overrunProbability: number;
  categoryForecasts: CategoryForecast[];
  monthlyPredictions: BudgetPrediction[];
  anomalies: SpendingAnomaly[];
  savingsOpportunities: SavingsOpportunity[];
}

export interface CategoryForecast {
  category: string;
  allocated: number;
  currentSpent: number;
  predictedFinal: number;
  trend: 'under' | 'on-track' | 'over';
  confidence: number;
}

export interface SpendingAnomaly {
  id: string;
  date: string;
  category: string;
  amount: number;
  expectedAmount: number;
  deviation: number;
  severity: 'info' | 'warning' | 'critical';
  description: string;
}

export interface SavingsOpportunity {
  category: string;
  potentialSavings: number;
  recommendation: string;
  confidence: number;
}

export interface WeatherRecommendation {
  date: string;
  dayOfWeek: string;
  weather: {
    condition: string;
    temp: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
  };
  workabilityScore: number;
  recommendedTasks: TaskRecommendation[];
  avoidTasks: string[];
  alerts: WeatherAlert[];
}

export interface TaskRecommendation {
  task: string;
  suitabilityScore: number;
  reasoning: string;
  optimalTimeSlot?: string;
}

export interface WeatherAlert {
  type: 'rain' | 'heat' | 'wind' | 'cold' | 'storm';
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
}

export interface SchedulePrediction {
  originalEndDate: string;
  predictedEndDate: string;
  delayDays: number;
  delayRisk: 'low' | 'medium' | 'high';
  criticalTasks: CriticalTask[];
  optimizationSuggestions: string[];
}

export interface CriticalTask {
  name: string;
  currentProgress: number;
  predictedDelay: number;
  impact: 'low' | 'medium' | 'high';
  suggestion: string;
}

// Simulated delay for API-like behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Random utility for generating mock data
const random = (min: number, max: number) => Math.random() * (max - min) + min;
const randomInt = (min: number, max: number) => Math.floor(random(min, max));

/**
 * Smart Photo Analysis Service
 * Simulates ML-based image classification for construction progress
 */
export async function analyzeConstructionPhoto(imageId: string): Promise<PhotoAnalysisResult> {
  await delay(random(800, 1500));

  const phases: PhotoAnalysisResult['phase'][] = ['foundation', 'structure', 'electrical', 'plumbing', 'finishing'];
  const phase = phases[randomInt(0, phases.length)];

  const safetyIssues: SafetyIssue[] = [];
  if (Math.random() > 0.6) {
    const issueTypes: SafetyIssue['type'][] = ['helmet', 'vest', 'scaffolding', 'debris', 'equipment'];
    safetyIssues.push({
      type: issueTypes[randomInt(0, issueTypes.length)],
      severity: ['low', 'medium', 'high'][randomInt(0, 3)] as SafetyIssue['severity'],
      description: 'Potential safety concern detected in work area',
      location: 'Zone ' + String.fromCharCode(65 + randomInt(0, 4))
    });
  }

  const materialNames = ['Concrete', 'Steel Rebar', 'Bricks', 'Cement Bags', 'PVC Pipes', 'Electrical Conduit', 'Sand', 'Aggregate'];
  const materials: DetectedMaterial[] = Array.from({ length: randomInt(2, 5) }, () => ({
    name: materialNames[randomInt(0, materialNames.length)],
    confidence: random(0.75, 0.98),
    estimatedQuantity: `${randomInt(10, 100)} units`
  }));

  return {
    id: imageId,
    phase,
    phaseConfidence: random(0.82, 0.97),
    progressEstimate: randomInt(15, 85),
    progressConfidence: random(0.78, 0.94),
    safetyScore: safetyIssues.length > 0 ? random(0.6, 0.85) : random(0.88, 0.98),
    qualityScore: random(0.75, 0.95),
    issues: safetyIssues,
    materials,
    timestamp: new Date()
  };
}

/**
 * Budget Forecasting Service
 * Uses time-series analysis simulation for spending predictions
 */
export async function generateBudgetForecast(
  currentSpent: number,
  totalBudget: number,
  historicalData: { date: string; amount: number; category: string }[]
): Promise<BudgetForecast> {
  await delay(random(1000, 2000));

  const spendRate = currentSpent / totalBudget;
  const predictedTotal = currentSpent + (currentSpent * random(0.4, 0.8));
  const overrunProbability = predictedTotal > totalBudget ? random(0.5, 0.85) : random(0.1, 0.3);

  const categories = ['Materials', 'Labor', 'Equipment', 'Permits', 'Contingency', 'Finishing'];
  const categoryForecasts: CategoryForecast[] = categories.map(category => {
    const allocated = totalBudget * random(0.1, 0.25);
    const currentSpent = allocated * random(0.3, 0.7);
    const predictedFinal = currentSpent + (currentSpent * random(0.3, 0.6));
    const ratio = predictedFinal / allocated;

    return {
      category,
      allocated,
      currentSpent,
      predictedFinal,
      trend: ratio < 0.9 ? 'under' : ratio > 1.1 ? 'over' : 'on-track',
      confidence: random(0.78, 0.92)
    };
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const monthlyPredictions: BudgetPrediction[] = months.slice(0, currentMonth + 4).map((month, idx) => {
    const baseAmount = (totalBudget / 12) * random(0.7, 1.3);
    const variance = baseAmount * 0.15;
    return {
      month,
      predicted: baseAmount,
      actual: idx <= currentMonth ? baseAmount * random(0.85, 1.15) : undefined,
      confidence: idx <= currentMonth ? 1 : random(0.7, 0.9) - (idx - currentMonth) * 0.05,
      upperBound: baseAmount + variance,
      lowerBound: Math.max(0, baseAmount - variance)
    };
  });

  const anomalies: SpendingAnomaly[] = [];
  if (Math.random() > 0.5) {
    anomalies.push({
      id: 'anomaly-1',
      date: new Date(Date.now() - randomInt(1, 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: categories[randomInt(0, categories.length)],
      amount: random(50000, 200000),
      expectedAmount: random(30000, 80000),
      deviation: random(1.5, 3.0),
      severity: ['info', 'warning', 'critical'][randomInt(0, 3)] as SpendingAnomaly['severity'],
      description: 'Spending significantly higher than historical average for this phase'
    });
  }

  const savingsOpportunities: SavingsOpportunity[] = [
    {
      category: 'Materials',
      potentialSavings: random(20000, 80000),
      recommendation: 'Bulk ordering from verified suppliers could reduce costs by 12-15%',
      confidence: random(0.75, 0.88)
    },
    {
      category: 'Labor',
      potentialSavings: random(15000, 50000),
      recommendation: 'Optimizing crew scheduling based on weather patterns can reduce idle time',
      confidence: random(0.70, 0.85)
    }
  ];

  return {
    currentSpent,
    totalBudget,
    predictedTotal,
    overrunRisk: overrunProbability > 0.6 ? 'high' : overrunProbability > 0.3 ? 'medium' : 'low',
    overrunProbability,
    categoryForecasts,
    monthlyPredictions,
    anomalies,
    savingsOpportunities
  };
}

/**
 * Weather-Based Scheduling Service
 * Provides AI-powered task recommendations based on weather conditions
 */
export async function getWeatherScheduleRecommendations(
  location: string,
  projectPhase: string
): Promise<WeatherRecommendation[]> {
  await delay(random(800, 1500));

  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Windy'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const tasksByCondition: Record<string, { good: string[]; avoid: string[] }> = {
    'Sunny': {
      good: ['Concrete curing', 'Exterior painting', 'Roofing work', 'Scaffolding assembly'],
      avoid: []
    },
    'Partly Cloudy': {
      good: ['Brickwork', 'Plastering', 'Welding', 'General construction'],
      avoid: []
    },
    'Cloudy': {
      good: ['Interior work', 'Electrical wiring', 'Plumbing', 'Tile work'],
      avoid: ['Exterior painting']
    },
    'Light Rain': {
      good: ['Indoor finishing', 'Planning meetings', 'Material inspection'],
      avoid: ['Concrete pouring', 'Excavation', 'Roofing']
    },
    'Heavy Rain': {
      good: ['Documentation', 'Indoor prep work'],
      avoid: ['All outdoor work', 'Concrete work', 'Electrical outdoor']
    },
    'Windy': {
      good: ['Ground level work', 'Foundation work', 'Indoor tasks'],
      avoid: ['High elevation work', 'Crane operations', 'Panel installation']
    }
  };

  return Array.from({ length: 7 }, (_, idx) => {
    const condition = conditions[randomInt(0, conditions.length)];
    const temp = randomInt(22, 38);
    const humidity = randomInt(30, 80);
    const precipitation = condition.includes('Rain') ? randomInt(20, 90) : randomInt(0, 15);
    const windSpeed = condition === 'Windy' ? randomInt(25, 45) : randomInt(5, 20);

    const taskConfig = tasksByCondition[condition];
    const workabilityScore = condition.includes('Heavy')
      ? random(0.2, 0.4)
      : condition.includes('Light Rain') || condition === 'Windy'
        ? random(0.5, 0.7)
        : random(0.75, 0.95);

    const recommendedTasks: TaskRecommendation[] = taskConfig.good.slice(0, randomInt(2, 4)).map(task => ({
      task,
      suitabilityScore: random(0.7, 0.95),
      reasoning: `Optimal conditions for ${task.toLowerCase()} given ${condition.toLowerCase()} weather`,
      optimalTimeSlot: `${randomInt(6, 9)}:00 AM - ${randomInt(3, 6)}:00 PM`
    }));

    const alerts: WeatherAlert[] = [];
    if (temp > 35) {
      alerts.push({
        type: 'heat',
        severity: temp > 40 ? 'high' : 'medium',
        message: `High temperature expected (${temp}°C)`,
        recommendation: 'Schedule frequent breaks, provide hydration, avoid peak hours'
      });
    }
    if (precipitation > 50) {
      alerts.push({
        type: 'rain',
        severity: precipitation > 70 ? 'high' : 'medium',
        message: `${precipitation}% chance of rain`,
        recommendation: 'Cover exposed materials, prepare drainage, postpone concrete work'
      });
    }
    if (windSpeed > 30) {
      alerts.push({
        type: 'wind',
        severity: windSpeed > 40 ? 'high' : 'medium',
        message: `Strong winds expected (${windSpeed} km/h)`,
        recommendation: 'Secure loose materials, avoid crane operations'
      });
    }

    const date = new Date();
    date.setDate(date.getDate() + idx);

    return {
      date: date.toISOString().split('T')[0],
      dayOfWeek: days[(date.getDay() + 6) % 7], // Adjust for Mon start
      weather: {
        condition,
        temp,
        humidity,
        precipitation,
        windSpeed
      },
      workabilityScore,
      recommendedTasks,
      avoidTasks: taskConfig.avoid,
      alerts
    };
  });
}

/**
 * Progress Prediction Service
 * ML-based project timeline and delay prediction
 */
export async function predictProjectProgress(
  currentProgress: number,
  tasksCompleted: number,
  totalTasks: number,
  startDate: string,
  targetEndDate: string
): Promise<SchedulePrediction> {
  await delay(random(1000, 1800));

  const start = new Date(startDate);
  const target = new Date(targetEndDate);
  const today = new Date();

  const totalDuration = target.getTime() - start.getTime();
  const elapsedDuration = today.getTime() - start.getTime();
  const expectedProgress = (elapsedDuration / totalDuration) * 100;

  const progressDelta = currentProgress - expectedProgress;
  const delayFactor = progressDelta < -10 ? random(1.1, 1.3) : progressDelta < 0 ? random(1.0, 1.1) : random(0.95, 1.0);

  const predictedEnd = new Date(target.getTime() * delayFactor);
  const delayDays = Math.floor((predictedEnd.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  const criticalTasks: CriticalTask[] = [
    {
      name: 'Foundation completion',
      currentProgress: randomInt(60, 90),
      predictedDelay: randomInt(0, 5),
      impact: 'high',
      suggestion: 'Add additional crew to accelerate remaining work'
    },
    {
      name: 'MEP installation',
      currentProgress: randomInt(30, 60),
      predictedDelay: randomInt(2, 8),
      impact: 'medium',
      suggestion: 'Coordinate with electrical and plumbing teams for parallel work'
    },
    {
      name: 'Finishing work',
      currentProgress: randomInt(10, 40),
      predictedDelay: randomInt(0, 10),
      impact: 'low',
      suggestion: 'Begin procurement of finishing materials early'
    }
  ];

  return {
    originalEndDate: targetEndDate,
    predictedEndDate: predictedEnd.toISOString().split('T')[0],
    delayDays: Math.max(0, delayDays),
    delayRisk: delayDays > 14 ? 'high' : delayDays > 7 ? 'medium' : 'low',
    criticalTasks,
    optimizationSuggestions: [
      'Consider fast-tracking finishing work to run parallel with MEP installation',
      'Weather conditions next week are favorable for outdoor concrete work',
      'Current material stock levels support uninterrupted work for 3 weeks'
    ]
  };
}

/**
 * Batch analyze multiple photos
 */
export async function batchAnalyzePhotos(imageIds: string[]): Promise<PhotoAnalysisResult[]> {
  const results = await Promise.all(imageIds.map(id => analyzeConstructionPhoto(id)));
  return results;
}

/**
 * Get AI-powered insights summary
 */
export async function getAIInsightsSummary(): Promise<{
  photoInsights: { analyzed: number; avgProgress: number; safetyScore: number };
  budgetInsights: { riskLevel: string; savings: number; anomalies: number };
  scheduleInsights: { onTrack: boolean; delayRisk: string; recommendations: number };
}> {
  await delay(random(500, 1000));

  return {
    photoInsights: {
      analyzed: randomInt(15, 50),
      avgProgress: randomInt(35, 65),
      safetyScore: random(0.85, 0.98)
    },
    budgetInsights: {
      riskLevel: ['low', 'medium', 'high'][randomInt(0, 3)],
      savings: randomInt(50000, 200000),
      anomalies: randomInt(0, 3)
    },
    scheduleInsights: {
      onTrack: Math.random() > 0.4,
      delayRisk: ['low', 'medium', 'high'][randomInt(0, 3)],
      recommendations: randomInt(3, 8)
    }
  };
}
