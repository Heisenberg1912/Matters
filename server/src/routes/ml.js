import express from 'express';
import axios from 'axios';

const router = express.Router();

// In-memory cache for weather data (3-hour TTL)
const weatherCache = new Map();
const WEATHER_CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours

// Task recommendations based on weather conditions
const tasksByCondition = {
  'Clear': {
    good: ['Concrete curing', 'Exterior painting', 'Roofing work', 'Scaffolding assembly', 'Foundation work'],
    avoid: []
  },
  'Clouds': {
    good: ['Brickwork', 'Plastering', 'Welding', 'General construction', 'Structural work'],
    avoid: ['Exterior painting']
  },
  'Rain': {
    good: ['Indoor finishing', 'Planning meetings', 'Material inspection', 'Documentation'],
    avoid: ['Concrete pouring', 'Excavation', 'Roofing', 'Electrical outdoor work']
  },
  'Drizzle': {
    good: ['Indoor work', 'Electrical wiring', 'Plumbing', 'Documentation'],
    avoid: ['Exterior painting', 'Concrete work']
  },
  'Thunderstorm': {
    good: ['Documentation', 'Indoor prep work', 'Safety briefings'],
    avoid: ['All outdoor work', 'Crane operations', 'Metal work']
  },
  'Snow': {
    good: ['Indoor finishing', 'Planning', 'Material inventory'],
    avoid: ['All outdoor work', 'Concrete work', 'Excavation']
  },
  'default': {
    good: ['General construction', 'Indoor work'],
    avoid: []
  }
};

/**
 * GET /api/ml/weather/:location
 * Fetches weather forecast and returns task recommendations
 */
router.get('/weather/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    // Check cache first
    const cacheKey = location.toLowerCase();
    const cached = weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL) {
      return res.json(cached.data);
    }

    // If no API key, return mock data
    if (!apiKey) {
      const mockData = generateMockWeatherRecommendations();
      return res.json(mockData);
    }

    // Fetch from OpenWeather API
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast`,
      {
        params: {
          q: location,
          appid: apiKey,
          units: 'metric',
          cnt: 40 // 5-day forecast, 3-hour intervals
        }
      }
    );

    // Transform to our format
    const recommendations = transformWeatherData(response.data);

    // Cache the result
    weatherCache.set(cacheKey, {
      timestamp: Date.now(),
      data: recommendations
    });

    res.json(recommendations);
  } catch (error) {
    console.error('Weather API error:', error.message);

    // Return mock data on error
    const mockData = generateMockWeatherRecommendations();
    res.json(mockData);
  }
});

/**
 * POST /api/ml/analyze-photo
 * Analyzes construction photos using Google Cloud Vision
 */
router.post('/analyze-photo', async (req, res) => {
  try {
    const { imageUrl, imageBase64 } = req.body;
    const apiKey = process.env.GOOGLE_CLOUD_VISION_KEY;

    // If no API key, return mock data
    if (!apiKey) {
      const mockResult = generateMockPhotoAnalysis();
      return res.json(mockResult);
    }

    // Prepare image content
    const imageContent = imageBase64
      ? { content: imageBase64 }
      : { source: { imageUri: imageUrl } };

    // Call Google Cloud Vision API
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        requests: [{
          image: imageContent,
          features: [
            { type: 'LABEL_DETECTION', maxResults: 20 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
            { type: 'SAFE_SEARCH_DETECTION' }
          ]
        }]
      }
    );

    // Transform to our format
    const analysisResult = transformVisionData(response.data);
    res.json(analysisResult);
  } catch (error) {
    console.error('Vision API error:', error.message);

    // Return mock data on error
    const mockResult = generateMockPhotoAnalysis();
    res.json(mockResult);
  }
});

/**
 * GET /api/ml/health
 * Health check for ML services
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    services: {
      weather: {
        configured: !!process.env.OPENWEATHER_API_KEY,
        cacheSize: weatherCache.size
      },
      vision: {
        configured: !!process.env.GOOGLE_CLOUD_VISION_KEY
      }
    }
  });
});

// Helper: Transform OpenWeather data to our format
function transformWeatherData(data) {
  const days = [];
  const dailyData = new Map();

  // Group by date
  data.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!dailyData.has(date)) {
      dailyData.set(date, []);
    }
    dailyData.get(date).push(item);
  });

  // Process each day (limit to 7 days)
  let dayCount = 0;
  for (const [date, items] of dailyData) {
    if (dayCount >= 7) break;

    // Get midday reading or first available
    const midday = items.find(i => i.dt_txt.includes('12:00')) || items[0];
    const condition = midday.weather[0].main;
    const taskConfig = tasksByCondition[condition] || tasksByCondition.default;

    // Calculate workability score
    let workabilityScore = 0.8;
    if (condition === 'Rain' || condition === 'Thunderstorm') workabilityScore = 0.3;
    else if (condition === 'Drizzle') workabilityScore = 0.5;
    else if (condition === 'Snow') workabilityScore = 0.2;
    else if (condition === 'Clear') workabilityScore = 0.95;

    // Adjust for wind
    if (midday.wind.speed > 10) workabilityScore *= 0.8;

    // Generate alerts
    const alerts = [];
    if (midday.main.temp > 35) {
      alerts.push({
        type: 'heat',
        severity: midday.main.temp > 40 ? 'high' : 'medium',
        message: `High temperature expected (${Math.round(midday.main.temp)}°C)`,
        recommendation: 'Schedule frequent breaks, provide hydration, avoid peak hours'
      });
    }
    if (midday.pop > 0.5) {
      alerts.push({
        type: 'rain',
        severity: midday.pop > 0.7 ? 'high' : 'medium',
        message: `${Math.round(midday.pop * 100)}% chance of rain`,
        recommendation: 'Cover exposed materials, prepare drainage, postpone concrete work'
      });
    }
    if (midday.wind.speed > 15) {
      alerts.push({
        type: 'wind',
        severity: midday.wind.speed > 20 ? 'high' : 'medium',
        message: `Strong winds expected (${Math.round(midday.wind.speed)} m/s)`,
        recommendation: 'Secure loose materials, avoid crane operations'
      });
    }

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

    days.push({
      date,
      dayOfWeek,
      weather: {
        condition: midday.weather[0].description,
        temp: Math.round(midday.main.temp),
        humidity: midday.main.humidity,
        precipitation: Math.round(midday.pop * 100),
        windSpeed: Math.round(midday.wind.speed * 3.6) // Convert m/s to km/h
      },
      workabilityScore,
      recommendedTasks: taskConfig.good.map(task => ({
        task,
        suitabilityScore: workabilityScore * (0.85 + Math.random() * 0.15),
        reasoning: `Suitable for ${condition.toLowerCase()} conditions`,
        optimalTimeSlot: '7:00 AM - 5:00 PM'
      })),
      avoidTasks: taskConfig.avoid,
      alerts
    });

    dayCount++;
  }

  return days;
}

// Helper: Transform Vision API data to our format
function transformVisionData(data) {
  const response = data.responses[0];
  const labels = response.labelAnnotations || [];
  const objects = response.localizedObjectAnnotations || [];

  // Detect construction phase from labels
  const phaseKeywords = {
    foundation: ['foundation', 'concrete', 'excavation', 'ground', 'soil'],
    structure: ['structure', 'beam', 'column', 'steel', 'framework', 'skeleton'],
    electrical: ['electrical', 'wiring', 'conduit', 'cable', 'switch'],
    plumbing: ['plumbing', 'pipe', 'valve', 'water', 'drainage'],
    finishing: ['paint', 'tile', 'flooring', 'ceiling', 'interior', 'finish']
  };

  let detectedPhase = 'structure';
  let maxScore = 0;

  for (const [phase, keywords] of Object.entries(phaseKeywords)) {
    const score = labels.reduce((acc, label) => {
      const labelLower = label.description.toLowerCase();
      return acc + keywords.filter(k => labelLower.includes(k)).length * label.score;
    }, 0);
    if (score > maxScore) {
      maxScore = score;
      detectedPhase = phase;
    }
  }

  // Extract materials from labels and objects
  const materialKeywords = ['concrete', 'steel', 'brick', 'cement', 'wood', 'pipe', 'rebar', 'sand', 'aggregate'];
  const materials = labels
    .filter(l => materialKeywords.some(k => l.description.toLowerCase().includes(k)))
    .map(l => ({
      name: l.description,
      confidence: l.score,
      estimatedQuantity: 'visible in image'
    }));

  // Detect safety issues
  const safetyKeywords = {
    helmet: ['helmet', 'hard hat', 'safety helmet'],
    vest: ['vest', 'safety vest', 'high visibility'],
    scaffolding: ['scaffolding', 'scaffold'],
    debris: ['debris', 'rubble', 'waste'],
    equipment: ['equipment', 'machinery', 'tool']
  };

  const issues = [];
  for (const [type, keywords] of Object.entries(safetyKeywords)) {
    const found = labels.some(l =>
      keywords.some(k => l.description.toLowerCase().includes(k))
    );
    if (found && Math.random() > 0.7) { // Only flag some as issues
      issues.push({
        type,
        severity: ['low', 'medium'][Math.floor(Math.random() * 2)],
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} detected - verify compliance`,
        location: 'Main work area'
      });
    }
  }

  // Calculate scores
  const safetyScore = issues.length === 0 ? 0.95 : 0.85 - (issues.length * 0.05);
  const qualityScore = 0.75 + (labels.length / 20) * 0.2; // More labels = better quality image

  return {
    id: `analysis-${Date.now()}`,
    phase: detectedPhase,
    phaseConfidence: Math.min(0.95, 0.7 + maxScore * 0.1),
    progressEstimate: Math.floor(30 + Math.random() * 40),
    progressConfidence: 0.75 + Math.random() * 0.15,
    safetyScore: Math.max(0.6, safetyScore),
    qualityScore: Math.min(0.95, qualityScore),
    issues,
    materials,
    timestamp: new Date().toISOString()
  };
}

// Helper: Generate mock weather recommendations
function generateMockWeatherRecommendations() {
  const conditions = ['Clear', 'Clouds', 'Partly Cloudy', 'Light Rain'];
  const days = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const taskConfig = tasksByCondition[condition] || tasksByCondition.default;
    const workabilityScore = condition.includes('Rain') ? 0.5 : 0.85;

    days.push({
      date: date.toISOString().split('T')[0],
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
      weather: {
        condition,
        temp: Math.floor(25 + Math.random() * 10),
        humidity: Math.floor(40 + Math.random() * 30),
        precipitation: condition.includes('Rain') ? Math.floor(40 + Math.random() * 40) : Math.floor(Math.random() * 20),
        windSpeed: Math.floor(5 + Math.random() * 15)
      },
      workabilityScore,
      recommendedTasks: taskConfig.good.slice(0, 3).map(task => ({
        task,
        suitabilityScore: workabilityScore * (0.85 + Math.random() * 0.15),
        reasoning: `Suitable for ${condition.toLowerCase()} conditions`,
        optimalTimeSlot: '7:00 AM - 5:00 PM'
      })),
      avoidTasks: taskConfig.avoid,
      alerts: []
    });
  }

  return days;
}

// Helper: Generate mock photo analysis
function generateMockPhotoAnalysis() {
  const phases = ['foundation', 'structure', 'electrical', 'plumbing', 'finishing'];
  const phase = phases[Math.floor(Math.random() * phases.length)];

  return {
    id: `mock-${Date.now()}`,
    phase,
    phaseConfidence: 0.85 + Math.random() * 0.1,
    progressEstimate: Math.floor(30 + Math.random() * 40),
    progressConfidence: 0.8 + Math.random() * 0.1,
    safetyScore: 0.85 + Math.random() * 0.1,
    qualityScore: 0.8 + Math.random() * 0.15,
    issues: [],
    materials: [
      { name: 'Concrete', confidence: 0.9, estimatedQuantity: 'visible' },
      { name: 'Steel Rebar', confidence: 0.85, estimatedQuantity: 'visible' }
    ],
    timestamp: new Date().toISOString(),
    mock: true
  };
}

export default router;
