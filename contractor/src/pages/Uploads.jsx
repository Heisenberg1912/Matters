import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, Upload, CheckCircle, Clock,
  AlertCircle, Loader2, Plus
} from 'lucide-react'
import { contractorApi } from '../services/api'
import { Card, CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'

export default function Uploads() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'license',
    name: '',
    url: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await contractorApi.getProfile()
      if (response.success) {
        setProfile(response.data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.url) return

    try {
      setUploading(true)
      await contractorApi.uploadDocument(formData)
      await loadProfile()
      setShowUploadForm(false)
      setFormData({ type: 'license', name: '', url: '' })
    } catch (err) {
      alert(err.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const documentTypes = [
    { value: 'license', label: 'License' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'certification', label: 'Certification' },
    { value: 'id_proof', label: 'ID Proof' },
    { value: 'other', label: 'Other' },
  ]

  const getDocumentIcon = (type) => {
    const colors = {
      license: 'text-blue-600',
      insurance: 'text-green-600',
      certification: 'text-purple-600',
      id_proof: 'text-amber-600',
    }
    return <FileText className={`w-6 h-6 ${colors[type] || 'text-slate-600'}`} />
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

  const documents = profile?.contractor?.documents || []

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 pt-4 pb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-xl font-bold text-slate-900">Documents</h1>
          </div>
          {!showUploadForm && (
            <Button size="sm" onClick={() => setShowUploadForm(true)}>
              <Plus className="w-4 h-4" />
              Add
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {/* Upload Form */}
        {showUploadForm && (
          <Card className="mb-4">
            <CardHeader>
              <h3 className="font-semibold text-slate-900">Add Document</h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Document Type
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {documentTypes.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Document Name"
                  placeholder="e.g., Contractor License 2024"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Document URL"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                />
                <p className="text-slate-500 text-sm">
                  Upload your document to a cloud storage and paste the link here
                </p>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowUploadForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={uploading} className="flex-1">
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Document List */}
        {documents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">No documents yet</h3>
              <p className="text-slate-500 text-sm mb-4">
                Add your licenses and certifications to build trust with clients
              </p>
              {!showUploadForm && (
                <Button onClick={() => setShowUploadForm(true)}>
                  <Plus className="w-4 h-4" />
                  Add Document
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <Card key={doc._id || index}>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getDocumentIcon(doc.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-slate-900 truncate pr-2">
                          {doc.name}
                        </h4>
                        {doc.verified ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                            <Clock className="w-4 h-4" />
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-sm capitalize">
                        {doc.type?.replace('_', ' ')}
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Added {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {doc.url && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 text-sm font-medium hover:underline"
                      >
                        View Document
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tips */}
        <Card className="mt-6">
          <CardContent>
            <h4 className="font-semibold text-slate-900 mb-2">Tips</h4>
            <ul className="text-slate-600 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Upload clear, high-quality scans or photos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Keep licenses and certifications up to date</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Verified documents build trust with clients</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
