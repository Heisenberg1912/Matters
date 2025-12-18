/**
 * Machine Learning Models for MATTERS Construction Platform
 * Uses TensorFlow.js for client-side predictions
 */

import * as tf from '@tensorflow/tfjs';

// Type definitions
export interface BudgetPredictionInput {
  spendingHistory: { date: string; amount: number }[];
  totalBudget: number;
  currentSpent: number;
  projectDurationDays: number;
  elapsedDays: number;
}

export interface BudgetPredictionOutput {
  predictedTotal: number;
  overrunProbability: number;
  trend: 'under' | 'on-track' | 'over';
  monthlyForecasts: { month: string; predicted: number; confidence: number }[];
}

export interface AnomalyResult {
  isAnomaly: boolean;
  zScore: number;
  severity: 'info' | 'warning' | 'critical';
  deviation: number;
}

export interface SchedulePredictionInput {
  tasksCompleted: number;
  totalTasks: number;
  startDate: Date;
  targetEndDate: Date;
  taskVelocity: number[]; // Tasks completed per week
}

export interface SchedulePredictionOutput {
  predictedEndDate: Date;
  delayDays: number;
  delayProbability: number;
  completionVelocity: number;
}

// Model cache to avoid retraining
let budgetModel: tf.LayersModel | null = null;

/**
 * Initialize TensorFlow.js
 */
export async function initializeTF(): Promise<void> {
  await tf.ready();
  console.log('TensorFlow.js initialized with backend:', tf.getBackend());
}

/**
 * Budget Forecasting using Linear Regression
 * Predicts future spending based on historical patterns
 */
export async function forecastBudget(input: BudgetPredictionInput): Promise<BudgetPredictionOutput> {
  await tf.ready();

  const { spendingHistory, totalBudget, currentSpent, projectDurationDays, elapsedDays } = input;

  // If not enough history, use simple projection
  if (spendingHistory.length < 3) {
    const dailyRate = currentSpent / Math.max(elapsedDays, 1);
    const predictedTotal = dailyRate * projectDurationDays;
    const ratio = predictedTotal / totalBudget;

    return {
      predictedTotal,
      overrunProbability: ratio > 1 ? Math.min(0.95, (ratio - 1) * 2) : Math.max(0.05, ratio * 0.3),
      trend: ratio < 0.95 ? 'under' : ratio > 1.05 ? 'over' : 'on-track',
      monthlyForecasts: generateSimpleForecasts(currentSpent, totalBudget, projectDurationDays, elapsedDays)
    };
  }

  // Prepare data for linear regression
  const amounts = spendingHistory.map(h => h.amount);
  const cumulative = amounts.reduce((acc: number[], val, i) => {
    acc.push((acc[i - 1] || 0) + val);
    return acc;
  }, []);

  // Normalize data
  const maxAmount = Math.max(...cumulative, 1);
  const normalizedY = cumulative.map(v => v / maxAmount);
  const normalizedX = cumulative.map((_, i) => i / cumulative.length);

  // Simple linear regression using TensorFlow.js
  const xs = tf.tensor1d(normalizedX);
  const ys = tf.tensor1d(normalizedY);

  // Calculate slope and intercept
  const xMean = xs.mean();
  const yMean = ys.mean();
  const xDiff = xs.sub(xMean);
  const yDiff = ys.sub(yMean);
  const slope = xDiff.mul(yDiff).sum().div(xDiff.square().sum());
  const intercept = yMean.sub(slope.mul(xMean));

  // Predict end value
  const slopeVal = (await slope.data())[0];
  const interceptVal = (await intercept.data())[0];

  // Project to end of project
  const projectionPoint = 1.0; // End of normalized timeline
  const predictedNormalized = slopeVal * projectionPoint + interceptVal;
  const predictedTotal = predictedNormalized * maxAmount * (projectDurationDays / elapsedDays);

  // Calculate overrun probability
  const ratio = predictedTotal / totalBudget;
  const variance = calculateVariance(amounts);
  const overrunProbability = calculateOverrunProbability(ratio, variance, totalBudget);

  // Cleanup tensors
  tf.dispose([xs, ys, xMean, yMean, xDiff, yDiff, slope, intercept]);

  return {
    predictedTotal,
    overrunProbability,
    trend: ratio < 0.95 ? 'under' : ratio > 1.05 ? 'over' : 'on-track',
    monthlyForecasts: generateMonthlyForecasts(slopeVal, interceptVal, maxAmount, projectDurationDays, elapsedDays)
  };
}

/**
 * Anomaly Detection using Z-Score
 * Detects unusual spending patterns
 */
export function detectAnomaly(value: number, history: number[]): AnomalyResult {
  if (history.length < 3) {
    return { isAnomaly: false, zScore: 0, severity: 'info', deviation: 0 };
  }

  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return { isAnomaly: false, zScore: 0, severity: 'info', deviation: 0 };
  }

  const zScore = (value - mean) / stdDev;
  const absZScore = Math.abs(zScore);
  const deviation = ((value - mean) / mean) * 100;

  return {
    isAnomaly: absZScore > 2,
    zScore,
    severity: absZScore > 3 ? 'critical' : absZScore > 2.5 ? 'warning' : 'info',
    deviation
  };
}

/**
 * Batch Anomaly Detection
 * Detects anomalies in an array of values
 */
export function detectAnomalies(values: { amount: number; category: string; date: string }[]): {
  anomalies: { index: number; value: number; category: string; date: string; result: AnomalyResult }[];
} {
  const byCategory = new Map<string, number[]>();

  // Group by category
  values.forEach(v => {
    if (!byCategory.has(v.category)) {
      byCategory.set(v.category, []);
    }
    byCategory.get(v.category)!.push(v.amount);
  });

  // Detect anomalies
  const anomalies: { index: number; value: number; category: string; date: string; result: AnomalyResult }[] = [];

  values.forEach((v, index) => {
    const categoryHistory = byCategory.get(v.category) || [];
    const result = detectAnomaly(v.amount, categoryHistory);
    if (result.isAnomaly) {
      anomalies.push({ index, value: v.amount, category: v.category, date: v.date, result });
    }
  });

  return { anomalies };
}

/**
 * Schedule Prediction
 * Predicts project completion based on task velocity
 */
export async function predictSchedule(input: SchedulePredictionInput): Promise<SchedulePredictionOutput> {
  const { tasksCompleted, totalTasks, startDate, targetEndDate, taskVelocity } = input;

  const now = new Date();
  const elapsedMs = now.getTime() - startDate.getTime();
  const totalMs = targetEndDate.getTime() - startDate.getTime();
  const elapsedWeeks = elapsedMs / (7 * 24 * 60 * 60 * 1000);

  // Calculate average velocity
  const avgVelocity = taskVelocity.length > 0
    ? taskVelocity.reduce((a, b) => a + b, 0) / taskVelocity.length
    : tasksCompleted / Math.max(elapsedWeeks, 1);

  // Calculate remaining work
  const remainingTasks = totalTasks - tasksCompleted;
  const weeksToComplete = remainingTasks / Math.max(avgVelocity, 0.1);

  // Predict end date
  const predictedEndDate = new Date(now.getTime() + weeksToComplete * 7 * 24 * 60 * 60 * 1000);

  // Calculate delay
  const delayMs = predictedEndDate.getTime() - targetEndDate.getTime();
  const delayDays = Math.max(0, Math.ceil(delayMs / (24 * 60 * 60 * 1000)));

  // Calculate delay probability based on velocity variance
  const velocityVariance = taskVelocity.length > 1
    ? calculateVariance(taskVelocity)
    : 0;
  const delayProbability = calculateDelayProbability(delayDays, velocityVariance, remainingTasks);

  return {
    predictedEndDate,
    delayDays,
    delayProbability,
    completionVelocity: avgVelocity
  };
}

/**
 * Contractor Matching Score
 * Calculates match score between task requirements and contractor capabilities
 */
export function calculateContractorScore(
  contractor: {
    specialties: string[];
    performanceMetrics: {
      quality: number;
      timeliness: number;
      communication: number;
      costEffectiveness: number;
    };
    cost: number;
  },
  taskRequirements: {
    requiredSpecialties: string[];
    priorityWeights?: {
      quality?: number;
      timeliness?: number;
      communication?: number;
      cost?: number;
    };
    maxBudget?: number;
  }
): { score: number; breakdown: Record<string, number> } {
  const weights = {
    quality: taskRequirements.priorityWeights?.quality ?? 0.3,
    timeliness: taskRequirements.priorityWeights?.timeliness ?? 0.25,
    communication: taskRequirements.priorityWeights?.communication ?? 0.15,
    cost: taskRequirements.priorityWeights?.cost ?? 0.3
  };

  // Specialty match score (0-100)
  const matchingSpecialties = contractor.specialties.filter(s =>
    taskRequirements.requiredSpecialties.some(req =>
      s.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(s.toLowerCase())
    )
  );
  const specialtyScore = (matchingSpecialties.length / Math.max(taskRequirements.requiredSpecialties.length, 1)) * 100;

  // Performance scores are already 0-100
  const qualityScore = contractor.performanceMetrics.quality;
  const timelinessScore = contractor.performanceMetrics.timeliness;
  const communicationScore = contractor.performanceMetrics.communication;

  // Cost score (inverse - lower cost = higher score)
  const costScore = taskRequirements.maxBudget
    ? Math.max(0, 100 - ((contractor.cost / taskRequirements.maxBudget) * 100))
    : contractor.performanceMetrics.costEffectiveness;

  // Weighted final score
  const breakdown = {
    specialty: specialtyScore,
    quality: qualityScore,
    timeliness: timelinessScore,
    communication: communicationScore,
    cost: costScore
  };

  const score =
    specialtyScore * 0.25 + // Specialty match is important
    qualityScore * weights.quality +
    timelinessScore * weights.timeliness +
    communicationScore * weights.communication +
    costScore * weights.cost;

  return { score, breakdown };
}

/**
 * Rank Contractors for a Task
 */
export function rankContractors(
  contractors: Array<{
    id: string;
    name: string;
    specialties: string[];
    performanceMetrics: {
      quality: number;
      timeliness: number;
      communication: number;
      costEffectiveness: number;
    };
    cost: number;
    availability: string;
  }>,
  taskRequirements: {
    requiredSpecialties: string[];
    priorityWeights?: {
      quality?: number;
      timeliness?: number;
      communication?: number;
      cost?: number;
    };
    maxBudget?: number;
  }
): Array<{ contractor: typeof contractors[0]; score: number; breakdown: Record<string, number> }> {
  return contractors
    .filter(c => c.availability !== 'busy')
    .map(contractor => {
      const { score, breakdown } = calculateContractorScore(contractor, taskRequirements);
      return { contractor, score, breakdown };
    })
    .sort((a, b) => b.score - a.score);
}

// Helper functions

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

function calculateOverrunProbability(ratio: number, variance: number, budget: number): number {
  // Base probability from ratio
  let prob = 0;
  if (ratio > 1.2) prob = 0.85;
  else if (ratio > 1.1) prob = 0.65;
  else if (ratio > 1.0) prob = 0.45;
  else if (ratio > 0.95) prob = 0.25;
  else prob = 0.1;

  // Adjust for variance (higher variance = more uncertainty)
  const normalizedVariance = Math.sqrt(variance) / budget;
  prob += normalizedVariance * 0.2;

  return Math.min(0.95, Math.max(0.05, prob));
}

function calculateDelayProbability(delayDays: number, velocityVariance: number, remainingTasks: number): number {
  // Base probability from delay
  let prob = 0;
  if (delayDays > 30) prob = 0.85;
  else if (delayDays > 14) prob = 0.65;
  else if (delayDays > 7) prob = 0.45;
  else if (delayDays > 0) prob = 0.25;
  else prob = 0.1;

  // Adjust for velocity variance
  const varianceAdjustment = Math.sqrt(velocityVariance) * 0.1;
  prob += varianceAdjustment;

  // Adjust for remaining work
  if (remainingTasks > 20) prob += 0.1;

  return Math.min(0.95, Math.max(0.05, prob));
}

function generateSimpleForecasts(
  currentSpent: number,
  totalBudget: number,
  projectDurationDays: number,
  elapsedDays: number
): { month: string; predicted: number; confidence: number }[] {
  const dailyRate = currentSpent / Math.max(elapsedDays, 1);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const forecasts = [];

  for (let i = 0; i < 6; i++) {
    const monthIndex = (currentMonth + i) % 12;
    const daysIntoFuture = i * 30;
    const predicted = currentSpent + (dailyRate * daysIntoFuture);
    const confidence = Math.max(0.5, 0.9 - (i * 0.08));

    forecasts.push({
      month: months[monthIndex],
      predicted: Math.min(predicted, totalBudget * 1.5),
      confidence
    });
  }

  return forecasts;
}

function generateMonthlyForecasts(
  slope: number,
  intercept: number,
  maxAmount: number,
  projectDurationDays: number,
  elapsedDays: number
): { month: string; predicted: number; confidence: number }[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const forecasts = [];

  for (let i = 0; i < 6; i++) {
    const monthIndex = (currentMonth + i) % 12;
    const normalizedTime = (elapsedDays + i * 30) / projectDurationDays;
    const predictedNormalized = slope * normalizedTime + intercept;
    const predicted = predictedNormalized * maxAmount;
    const confidence = Math.max(0.5, 0.9 - (i * 0.08));

    forecasts.push({
      month: months[monthIndex],
      predicted: Math.max(0, predicted),
      confidence
    });
  }

  return forecasts;
}

export default {
  initializeTF,
  forecastBudget,
  detectAnomaly,
  detectAnomalies,
  predictSchedule,
  calculateContractorScore,
  rankContractors
};
