import { useState, useEffect } from 'react'
import {
  CloudSun, Cloud, CloudRain, Snowflake, Wind, Thermometer,
  Droplets, AlertTriangle, CheckCircle, XCircle, Loader2
} from 'lucide-react'
import { api } from '../services/api'
import { Card, CardContent } from './Card'

const weatherIcons = {
  clear: CloudSun,
  clouds: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  default: CloudSun,
}

const taskIcons = {
  suitable: CheckCircle,
  caution: AlertTriangle,
  unsuitable: XCircle,
}

export default function WeatherWidget({ projectId, location, compact = false }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (location?.city || location?.coordinates) {
      loadWeather()
    } else {
      setLoading(false)
    }
  }, [projectId, location])

  const loadWeather = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (location?.city) {
        params.set('city', location.city)
      }
      if (location?.coordinates?.lat && location?.coordinates?.lng) {
        params.set('lat', location.coordinates.lat)
        params.set('lon', location.coordinates.lng)
      }

      const response = await api.get(`/ml/weather-tasks?${params.toString()}`)

      if (response.success) {
        setData(response.data)
      } else {
        setError(response.error || 'Failed to load weather')
      }
    } catch (err) {
      setError(err.message || 'Failed to load weather')
    } finally {
      setLoading(false)
    }
  }

  if (!location?.city && !location?.coordinates) {
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-4">
          <CloudSun className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Weather unavailable</p>
        </CardContent>
      </Card>
    )
  }

  if (!data?.weather) {
    return null
  }

  const { weather, recommendations } = data
  const WeatherIcon = weatherIcons[weather.condition?.toLowerCase()] || weatherIcons.default

  if (compact) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <WeatherIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">{weather.location}</p>
            <p className="text-slate-500 text-sm">{weather.description}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{Math.round(weather.temperature)}°C</p>
            <p className="text-slate-500 text-xs">Feels {Math.round(weather.feelsLike)}°C</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current Weather */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">{weather.location}</h3>
              <p className="text-slate-500 text-sm capitalize">{weather.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <WeatherIcon className="w-10 h-10 text-blue-500" />
              <span className="text-3xl font-bold text-slate-900">
                {Math.round(weather.temperature)}°
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-50 rounded-lg p-2">
              <Thermometer className="w-4 h-4 text-orange-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Feels</p>
              <p className="text-sm font-semibold">{Math.round(weather.feelsLike)}°</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Humidity</p>
              <p className="text-sm font-semibold">{weather.humidity}%</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <Wind className="w-4 h-4 text-teal-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Wind</p>
              <p className="text-sm font-semibold">{weather.windSpeed} m/s</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <Cloud className="w-4 h-4 text-gray-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Clouds</p>
              <p className="text-sm font-semibold">{weather.clouds}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Recommendations */}
      {recommendations?.length > 0 && (
        <Card>
          <CardContent>
            <h3 className="font-semibold text-slate-900 mb-3">Work Recommendations</h3>
            <div className="space-y-2">
              {recommendations.slice(0, 5).map((rec, index) => {
                const Icon = taskIcons[rec.status] || CheckCircle
                const colors = {
                  suitable: 'text-green-600 bg-green-50',
                  caution: 'text-amber-600 bg-amber-50',
                  unsuitable: 'text-red-600 bg-red-50',
                }
                const color = colors[rec.status] || colors.suitable

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg ${color.split(' ')[1]}`}
                  >
                    <Icon className={`w-5 h-5 ${color.split(' ')[0]}`} />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{rec.task}</p>
                      <p className="text-slate-600 text-sm">{rec.reason}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {weather.alerts?.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800">Weather Alert</h4>
                {weather.alerts.map((alert, index) => (
                  <p key={index} className="text-amber-700 text-sm mt-1">
                    {alert}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
