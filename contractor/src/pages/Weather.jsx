import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CloudSun, Cloud, CloudRain, Snowflake, Wind,
  Thermometer, Droplets, MapPin, RefreshCw, Loader2,
  CheckCircle, AlertTriangle, XCircle, Calendar
} from 'lucide-react'
import { Card, CardContent } from '../components/Card'
import Button from '../components/Button'
import { api, contractorApi } from '../services/api'

const weatherIcons = {
  clear: CloudSun,
  clouds: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  default: CloudSun,
}

export default function Weather() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [weatherData, setWeatherData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadWeather(selectedProject)
    }
  }, [selectedProject])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await contractorApi.getProjects({ status: 'in_progress' })
      if (response.success) {
        const projectsWithLocation = (response.data.projects || []).filter(
          (p) => p.location?.city || p.location?.coordinates
        )
        setProjects(projectsWithLocation)
        if (projectsWithLocation.length > 0) {
          setSelectedProject(projectsWithLocation[0])
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadWeather = async (project) => {
    if (!project?.location) return

    try {
      setWeatherLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (project.location.city) {
        params.set('city', project.location.city)
      }
      if (project.location.coordinates?.lat && project.location.coordinates?.lng) {
        params.set('lat', project.location.coordinates.lat)
        params.set('lon', project.location.coordinates.lng)
      }

      const response = await api.get(`/ml/weather-tasks?${params.toString()}`)

      if (response.success) {
        setWeatherData(response.data)
      } else {
        setError(response.error || 'Failed to load weather')
      }
    } catch (err) {
      setError(err.message || 'Failed to load weather')
    } finally {
      setWeatherLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'suitable':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'caution':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />
      case 'unsuitable':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <CheckCircle className="w-5 h-5 text-green-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'suitable':
        return 'bg-green-50 border-green-200'
      case 'caution':
        return 'bg-amber-50 border-amber-200'
      case 'unsuitable':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-green-50 border-green-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  const weather = weatherData?.weather
  const recommendations = weatherData?.recommendations || []
  const forecast = weatherData?.forecast || []
  const WeatherIcon = weather
    ? weatherIcons[weather.condition?.toLowerCase()] || weatherIcons.default
    : CloudSun

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 px-4 pt-4 pb-8 safe-top">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Weather & Tasks</h1>
        </div>

        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {projects.map((project) => (
              <button
                key={project._id}
                onClick={() => setSelectedProject(project)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  selectedProject?._id === project._id
                    ? 'bg-white text-blue-700'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <MapPin className="w-4 h-4" />
                {project.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 -mt-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CloudSun className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">No Projects with Location</h3>
              <p className="text-slate-500 text-sm mb-4">
                Add location details to your projects to see weather-based work recommendations
              </p>
              <Button onClick={() => navigate('/projects')}>View Projects</Button>
            </CardContent>
          </Card>
        ) : weatherLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-8">
              <CloudSun className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">{error}</p>
              <Button onClick={() => loadWeather(selectedProject)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : weather ? (
          <div className="space-y-4">
            {/* Current Weather Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-white">
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{weather.location}</span>
                    </div>
                    <p className="text-slate-700 capitalize">{weather.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <WeatherIcon className="w-14 h-14 text-blue-500" />
                    <div className="text-right">
                      <p className="text-4xl font-bold text-slate-900">
                        {Math.round(weather.temperature)}°
                      </p>
                      <p className="text-slate-500 text-sm">
                        Feels {Math.round(weather.feelsLike)}°
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                    <Thermometer className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">High/Low</p>
                    <p className="text-sm font-semibold">
                      {Math.round(weather.tempMax || weather.temperature)}° / {Math.round(weather.tempMin || weather.temperature - 5)}°
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                    <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Humidity</p>
                    <p className="text-sm font-semibold">{weather.humidity}%</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                    <Wind className="w-5 h-5 text-teal-500 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Wind</p>
                    <p className="text-sm font-semibold">{weather.windSpeed} m/s</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                    <Cloud className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Clouds</p>
                    <p className="text-sm font-semibold">{weather.clouds}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            {weather.alerts?.length > 0 && (
              <Card className="border-amber-300 bg-amber-50">
                <CardContent>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-amber-800">Weather Alert</h3>
                      {weather.alerts.map((alert, index) => (
                        <p key={index} className="text-amber-700 mt-1">
                          {alert}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Task Recommendations */}
            {recommendations.length > 0 && (
              <div>
                <h2 className="font-semibold text-slate-900 mb-3">
                  Today's Work Recommendations
                </h2>
                <div className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <Card
                      key={index}
                      className={`border ${getStatusColor(rec.status)}`}
                    >
                      <CardContent className="flex items-center gap-3">
                        {getStatusIcon(rec.status)}
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{rec.task}</p>
                          <p className="text-slate-600 text-sm">{rec.reason}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Forecast */}
            {forecast.length > 0 && (
              <div>
                <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  5-Day Forecast
                </h2>
                <Card>
                  <div className="divide-y divide-slate-100">
                    {forecast.slice(0, 5).map((day, index) => {
                      const DayIcon =
                        weatherIcons[day.condition?.toLowerCase()] || weatherIcons.default
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4"
                        >
                          <div className="flex items-center gap-3">
                            <DayIcon className="w-8 h-8 text-blue-500" />
                            <div>
                              <p className="font-medium text-slate-900">{day.day}</p>
                              <p className="text-slate-500 text-sm capitalize">
                                {day.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">
                              {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
                            </p>
                            <p className="text-slate-500 text-xs">
                              {day.precipitation}% rain
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </div>
            )}

            {/* Refresh Button */}
            <div className="text-center pt-4">
              <Button
                variant="secondary"
                onClick={() => loadWeather(selectedProject)}
                disabled={weatherLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${weatherLoading ? 'animate-spin' : ''}`}
                />
                Refresh Weather
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <CloudSun className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No weather data available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
