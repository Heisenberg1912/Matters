/**
 * API Client for MATTERS ML Backend
 * Handles communication with the Express server for ML operations
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Types
export interface WeatherData {
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
  recommendedTasks: {
    task: string;
    suitabilityScore: number;
    reasoning: string;
    optimalTimeSlot?: string;
  }[];
  avoidTasks: string[];
  alerts: {
    type: 'rain' | 'heat' | 'wind' | 'cold' | 'storm';
    severity: 'low' | 'medium' | 'high';
    message: string;
    recommendation: string;
  }[];
}

export interface PhotoAnalysisResponse {
  id: string;
  phase: 'foundation' | 'structure' | 'electrical' | 'plumbing' | 'finishing';
  phaseConfidence: number;
  progressEstimate: number;
  progressConfidence: number;
  safetyScore: number;
  qualityScore: number;
  issues: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    location?: string;
  }[];
  materials: {
    name: string;
    confidence: number;
    estimatedQuantity?: string;
  }[];
  timestamp: string;
  mock?: boolean;
}

export interface HealthCheckResponse {
  status: string;
  timestamp?: string;
  services: {
    weather: boolean | { configured: boolean; cacheSize?: number };
    vision: boolean | { configured: boolean };
  };
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for ML operations
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.warn('[API] Backend not available, will use mock data');
    } else {
      console.error('[API] Response error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Check if the ML backend is available
 */
export async function checkHealth(): Promise<HealthCheckResponse | null> {
  try {
    const response = await apiClient.get<HealthCheckResponse>('/api/health');
    return response.data;
  } catch (error) {
    console.warn('[API] Health check failed, backend may be offline');
    return null;
  }
}

/**
 * Check if backend is available (quick check)
 */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    await apiClient.get('/api/health', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch weather recommendations for a location
 */
export async function fetchWeatherRecommendations(location: string): Promise<WeatherData[] | null> {
  try {
    const response = await apiClient.get<WeatherData[]>(`/api/ml/weather/${encodeURIComponent(location)}`);
    return response.data;
  } catch (error) {
    console.warn('[API] Weather fetch failed:', error);
    return null;
  }
}

/**
 * Analyze a construction photo
 */
export async function analyzePhoto(imageUrl?: string, imageBase64?: string): Promise<PhotoAnalysisResponse | null> {
  try {
    const response = await apiClient.post<PhotoAnalysisResponse>('/api/ml/analyze-photo', {
      imageUrl,
      imageBase64
    });
    return response.data;
  } catch (error) {
    console.warn('[API] Photo analysis failed:', error);
    return null;
  }
}

/**
 * Analyze multiple photos in batch
 */
export async function analyzePhotosBatch(
  images: Array<{ url?: string; base64?: string }>
): Promise<PhotoAnalysisResponse[]> {
  const results: PhotoAnalysisResponse[] = [];

  for (const image of images) {
    const result = await analyzePhoto(image.url, image.base64);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Get ML service health status
 */
export async function getMLHealth(): Promise<{
  weather: { configured: boolean; cacheSize: number };
  vision: { configured: boolean };
} | null> {
  try {
    const response = await apiClient.get('/api/ml/health');
    return response.data.services;
  } catch (error) {
    console.warn('[API] ML health check failed:', error);
    return null;
  }
}

// Export configured client for direct use if needed
export { apiClient };

export default {
  checkHealth,
  isBackendAvailable,
  fetchWeatherRecommendations,
  analyzePhoto,
  analyzePhotosBatch,
  getMLHealth
};
