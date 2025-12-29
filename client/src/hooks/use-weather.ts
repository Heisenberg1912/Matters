import { useState, useEffect, useCallback } from 'react';

export interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  icon: string;
  isRainy: boolean;
  isHot: boolean;
  isCold: boolean;
  isWindy: boolean;
  isHumid: boolean;
  timestamp: Date;
}

export interface WeatherInsight {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

const WEATHER_CACHE_KEY = 'matters-weather-cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedWeather {
  data: WeatherData;
  timestamp: number;
}

const getCachedWeather = (location: string): WeatherData | null => {
  try {
    const cached = localStorage.getItem(`${WEATHER_CACHE_KEY}-${location}`);
    if (!cached) return null;
    const parsed: CachedWeather = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(`${WEATHER_CACHE_KEY}-${location}`);
      return null;
    }
    return { ...parsed.data, timestamp: new Date(parsed.data.timestamp) };
  } catch {
    return null;
  }
};

const setCachedWeather = (location: string, data: WeatherData) => {
  try {
    const cached: CachedWeather = { data, timestamp: Date.now() };
    localStorage.setItem(`${WEATHER_CACHE_KEY}-${location}`, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
};

// Generate construction-relevant weather insights
export const generateWeatherInsights = (weather: WeatherData): WeatherInsight[] => {
  const insights: WeatherInsight[] = [];

  // Rain-related insights
  if (weather.isRainy) {
    insights.push({
      title: 'Avoid concrete pouring today',
      description: 'Rain can weaken concrete mix and affect curing. Reschedule if possible.',
      priority: 'high',
    });
    insights.push({
      title: 'Protect exposed materials',
      description: 'Cover steel, cement bags, and electrical components from rain damage.',
      priority: 'high',
    });
  }

  // Hot weather insights
  if (weather.isHot) {
    insights.push({
      title: 'Optimal curing conditions',
      description: `With ${weather.temperature}°C, slab curing should be done in early morning for optimal sunlight exposure.`,
      priority: 'medium',
    });
    insights.push({
      title: 'Hydration reminder',
      description: 'Ensure workers have adequate water breaks. Heat above 35°C increases fatigue risk.',
      priority: 'high',
    });
  }

  // Cold weather insights
  if (weather.isCold) {
    insights.push({
      title: 'Concrete curing caution',
      description: 'Low temperatures slow cement hydration. Consider using warm water in mix.',
      priority: 'high',
    });
  }

  // Windy conditions
  if (weather.isWindy) {
    insights.push({
      title: 'Scaffolding safety check',
      description: `Wind speed ${weather.windSpeed} km/h - verify all scaffolding is secured.`,
      priority: 'high',
    });
    insights.push({
      title: 'Dust control needed',
      description: 'High winds can spread dust. Use water spraying to control particulates.',
      priority: 'medium',
    });
  }

  // Humidity insights
  if (weather.isHumid) {
    insights.push({
      title: 'Paint work not recommended',
      description: `Humidity at ${weather.humidity}% - exterior painting may not dry properly.`,
      priority: 'medium',
    });
  }

  // Good weather
  if (!weather.isRainy && !weather.isWindy && weather.temperature >= 15 && weather.temperature <= 30) {
    insights.push({
      title: 'Ideal construction weather',
      description: 'Perfect conditions for concrete work, painting, and exterior finishing.',
      priority: 'low',
    });
  }

  return insights;
};

// Fallback weather data when API is unavailable
const getFallbackWeather = (location: string): WeatherData => {
  const now = new Date();
  const month = now.getMonth();

  // Estimate temperature based on month (Northern Hemisphere bias for India)
  let baseTemp = 25;
  if (month >= 3 && month <= 5) baseTemp = 35; // Summer
  else if (month >= 6 && month <= 8) baseTemp = 28; // Monsoon
  else if (month >= 9 && month <= 10) baseTemp = 26; // Post-monsoon
  else baseTemp = 20; // Winter

  return {
    location,
    temperature: baseTemp,
    feelsLike: baseTemp + 2,
    humidity: 60,
    windSpeed: 10,
    condition: 'Clear',
    description: 'Weather data unavailable - using estimates',
    icon: '01d',
    isRainy: month >= 6 && month <= 8, // Monsoon season estimate
    isHot: baseTemp > 32,
    isCold: baseTemp < 15,
    isWindy: false,
    isHumid: month >= 6 && month <= 8,
    timestamp: now,
  };
};

export function useWeather(location?: string) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [insights, setInsights] = useState<WeatherInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (loc: string) => {
    // Check cache first
    const cached = getCachedWeather(loc);
    if (cached) {
      setWeather(cached);
      setInsights(generateWeatherInsights(cached));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use Open-Meteo API (free, no API key required)
      // First geocode the location
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=en&format=json`
      );

      if (!geoResponse.ok) throw new Error('Geocoding failed');

      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('Location not found');
      }

      const { latitude, longitude, name } = geoData.results[0];

      // Fetch weather data
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m,weather_code&timezone=auto`
      );

      if (!weatherResponse.ok) throw new Error('Weather fetch failed');

      const weatherData = await weatherResponse.json();
      const current = weatherData.current;

      // Map weather code to condition
      const weatherCodeMap: Record<number, { condition: string; icon: string }> = {
        0: { condition: 'Clear', icon: '01d' },
        1: { condition: 'Mainly Clear', icon: '02d' },
        2: { condition: 'Partly Cloudy', icon: '03d' },
        3: { condition: 'Overcast', icon: '04d' },
        45: { condition: 'Foggy', icon: '50d' },
        48: { condition: 'Foggy', icon: '50d' },
        51: { condition: 'Light Drizzle', icon: '09d' },
        53: { condition: 'Drizzle', icon: '09d' },
        55: { condition: 'Heavy Drizzle', icon: '09d' },
        61: { condition: 'Light Rain', icon: '10d' },
        63: { condition: 'Rain', icon: '10d' },
        65: { condition: 'Heavy Rain', icon: '10d' },
        71: { condition: 'Light Snow', icon: '13d' },
        73: { condition: 'Snow', icon: '13d' },
        75: { condition: 'Heavy Snow', icon: '13d' },
        80: { condition: 'Rain Showers', icon: '09d' },
        81: { condition: 'Rain Showers', icon: '09d' },
        82: { condition: 'Heavy Showers', icon: '09d' },
        95: { condition: 'Thunderstorm', icon: '11d' },
        96: { condition: 'Thunderstorm', icon: '11d' },
        99: { condition: 'Thunderstorm', icon: '11d' },
      };

      const weatherInfo = weatherCodeMap[current.weather_code] || { condition: 'Unknown', icon: '01d' };
      const temp = Math.round(current.temperature_2m);
      const humidity = current.relative_humidity_2m;
      const windSpeed = Math.round(current.wind_speed_10m);
      const isRainy = current.rain > 0 || current.precipitation > 0;

      const data: WeatherData = {
        location: name,
        temperature: temp,
        feelsLike: Math.round(current.apparent_temperature),
        humidity,
        windSpeed,
        condition: weatherInfo.condition,
        description: weatherInfo.condition,
        icon: weatherInfo.icon,
        isRainy,
        isHot: temp > 32,
        isCold: temp < 15,
        isWindy: windSpeed > 25,
        isHumid: humidity > 75,
        timestamp: new Date(),
      };

      setCachedWeather(loc, data);
      setWeather(data);
      setInsights(generateWeatherInsights(data));
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');

      // Use fallback data
      const fallback = getFallbackWeather(loc);
      setWeather(fallback);
      setInsights(generateWeatherInsights(fallback));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeather(location);
    }
  }, [location, fetchWeather]);

  const refresh = useCallback(() => {
    if (location) {
      // Clear cache and refetch
      localStorage.removeItem(`${WEATHER_CACHE_KEY}-${location}`);
      fetchWeather(location);
    }
  }, [location, fetchWeather]);

  return {
    weather,
    insights,
    isLoading,
    error,
    refresh,
  };
}
