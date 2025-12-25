import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, Phone, Building2, MapPin, Star, Award,
  Briefcase, Edit2, Save, X, Camera, Loader2, AlertCircle,
  Settings, FileText, LogOut
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { contractorApi } from '../services/api'
import { Card, CardContent, CardHeader } from '../components/Card'
import { StatusBadge } from '../components/Badge'
import Button from '../components/Button'
import Input from '../components/Input'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await contractorApi.getProfile()
      if (response.success) {
        setProfile(response.data)
        setFormData({
          name: response.data.name || '',
          phone: response.data.phone || '',
          companyName: response.data.company?.name || '',
          companyAddress: response.data.company?.address || '',
          bio: response.data.contractor?.bio || '',
          yearsExperience: response.data.contractor?.yearsExperience || '',
          hourlyRate: response.data.contractor?.hourlyRate || '',
          dailyRate: response.data.contractor?.dailyRate || '',
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        company: {
          name: formData.companyName,
          address: formData.companyAddress,
        },
        bio: formData.bio,
        yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : undefined,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined,
      }

      const response = await contractorApi.updateProfile(updateData)
      if (response.success) {
        setProfile(response.data)
        updateUser(response.data)
        setEditing(false)
      }
    } catch (err) {
      alert(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout()
      navigate('/login', { replace: true })
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={loadProfile}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-primary-600 px-4 pt-4 pb-20 safe-top">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">Profile</h1>
          <div className="flex items-center gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              >
                <Edit2 className="w-5 h-5 text-white" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 text-primary-600 spinner" />
                  ) : (
                    <Save className="w-5 h-5 text-primary-600" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Avatar & Name */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            {editing && (
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Camera className="w-4 h-4 text-primary-600" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
              {profile?.contractor?.isVerified && (
                <Award className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <p className="text-primary-100">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={profile?.contractor?.availabilityStatus || 'available'} />
              {profile?.rating?.average > 0 && (
                <div className="flex items-center gap-1 text-primary-100">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm">{profile.rating.average.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-12">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="text-center py-3">
              <p className="text-2xl font-bold text-slate-900">
                {profile?.contractor?.completedProjects || 0}
              </p>
              <p className="text-slate-500 text-xs">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-3">
              <p className="text-2xl font-bold text-slate-900">
                {profile?.contractor?.yearsExperience || 0}
              </p>
              <p className="text-slate-500 text-xs">Years Exp.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-3">
              <p className="text-2xl font-bold text-slate-900">
                {profile?.rating?.count || 0}
              </p>
              <p className="text-slate-500 text-xs">Reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <Card className="mb-4">
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Contact Information</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-900">{profile?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-900">{profile.phone}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card className="mb-4">
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Company Details</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <Input
                  label="Company Name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
                <Input
                  label="Company Address"
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                />
              </>
            ) : (
              <>
                {profile?.company?.name && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-900">{profile.company.name}</span>
                  </div>
                )}
                {profile?.company?.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-900">{profile.company.address}</span>
                  </div>
                )}
                {!profile?.company?.name && !profile?.company?.address && (
                  <p className="text-slate-500 text-sm">No company details added</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card className="mb-4">
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Professional Details</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Bio</label>
                  <textarea
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                    placeholder="Write about yourself and your expertise..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Years of Experience"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                  />
                  <Input
                    type="number"
                    label="Hourly Rate (INR)"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  />
                </div>
                <Input
                  type="number"
                  label="Daily Rate (INR)"
                  value={formData.dailyRate}
                  onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                />
              </>
            ) : (
              <>
                {profile?.contractor?.bio && (
                  <div>
                    <p className="text-slate-500 text-sm mb-1">Bio</p>
                    <p className="text-slate-900">{profile.contractor.bio}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {profile?.contractor?.hourlyRate && (
                    <div>
                      <p className="text-slate-500 text-sm mb-1">Hourly Rate</p>
                      <p className="font-medium text-slate-900">
                        {formatCurrency(profile.contractor.hourlyRate)}/hr
                      </p>
                    </div>
                  )}
                  {profile?.contractor?.dailyRate && (
                    <div>
                      <p className="text-slate-500 text-sm mb-1">Daily Rate</p>
                      <p className="font-medium text-slate-900">
                        {formatCurrency(profile.contractor.dailyRate)}/day
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Specializations */}
        {profile?.specializations?.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <h3 className="font-semibold text-slate-900">Specializations</h3>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <Card className="mb-4">
          <div className="divide-y divide-slate-100">
            <button
              onClick={() => navigate('/uploads')}
              className="w-full p-4 flex items-center gap-3 hover:bg-slate-50"
            >
              <FileText className="w-5 h-5 text-slate-600" />
              <span className="flex-1 text-left text-slate-900">Documents & Certificates</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-full p-4 flex items-center gap-3 hover:bg-slate-50"
            >
              <Settings className="w-5 h-5 text-slate-600" />
              <span className="flex-1 text-left text-slate-900">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full p-4 flex items-center gap-3 hover:bg-slate-50"
            >
              <LogOut className="w-5 h-5 text-red-500" />
              <span className="flex-1 text-left text-red-500">Logout</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
