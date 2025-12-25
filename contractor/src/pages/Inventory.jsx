import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  Plus,
  Search,
  AlertCircle,
  Edit2,
  Trash2,
  Filter,
  X,
} from 'lucide-react'
import { Card, CardContent } from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'
import { api } from '../services/api'

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'cement', label: 'Cement' },
  { value: 'steel', label: 'Steel' },
  { value: 'sand', label: 'Sand' },
  { value: 'bricks', label: 'Bricks' },
  { value: 'tiles', label: 'Tiles' },
  { value: 'paint', label: 'Paint' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'wood', label: 'Wood' },
  { value: 'glass', label: 'Glass' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'tools', label: 'Tools' },
  { value: 'safety', label: 'Safety' },
  { value: 'other', label: 'Other' },
]

function AddItemModal({ isOpen, onClose, projectId, onSuccess, editItem = null }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: 'other',
    quantity: { current: 0, minimum: 0 },
    unit: 'units',
    price: { perUnit: 0 },
    supplier: { name: '', contact: '' },
    location: 'Main Storage',
    notes: '',
  })

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || '',
        category: editItem.category || 'other',
        quantity: editItem.quantity || { current: 0, minimum: 0 },
        unit: editItem.unit || 'units',
        price: editItem.price || { perUnit: 0 },
        supplier: editItem.supplier || { name: '', contact: '' },
        location: editItem.location || 'Main Storage',
        notes: editItem.notes || '',
      })
    } else {
      setForm({
        name: '',
        category: 'other',
        quantity: { current: 0, minimum: 0 },
        unit: 'units',
        price: { perUnit: 0 },
        supplier: { name: '', contact: '' },
        location: 'Main Storage',
        notes: '',
      })
    }
  }, [editItem, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setLoading(true)
    try {
      if (editItem) {
        await api.patch(`/inventory/${editItem._id}`, form)
      } else {
        await api.post('/inventory', { ...form, project: projectId })
      }
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to save item:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editItem ? 'Edit Item' : 'Add Inventory Item'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <Input
            label="Item Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Portland Cement"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Current Quantity"
              type="number"
              min="0"
              value={form.quantity.current}
              onChange={(e) =>
                setForm({
                  ...form,
                  quantity: { ...form.quantity, current: parseInt(e.target.value) || 0 },
                })
              }
            />
            <Input
              label="Minimum Stock"
              type="number"
              min="0"
              value={form.quantity.minimum}
              onChange={(e) =>
                setForm({
                  ...form,
                  quantity: { ...form.quantity, minimum: parseInt(e.target.value) || 0 },
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unit"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="e.g., bags, kg, pcs"
            />
            <Input
              label="Price per Unit (₹)"
              type="number"
              min="0"
              value={form.price.perUnit}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: { ...form.price, perUnit: parseFloat(e.target.value) || 0 },
                })
              }
            />
          </div>

          <Input
            label="Storage Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g., Main Storage, Site A"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Supplier Name"
              value={form.supplier.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  supplier: { ...form.supplier, name: e.target.value },
                })
              }
              placeholder="Supplier name"
            />
            <Input
              label="Supplier Contact"
              value={form.supplier.contact}
              onChange={(e) =>
                setForm({
                  ...form,
                  supplier: { ...form.supplier, contact: e.target.value },
                })
              }
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.name.trim()} className="flex-1">
              {loading ? 'Saving...' : editItem ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdjustQuantityModal({ isOpen, onClose, item, onSuccess }) {
  const [adjustment, setAdjustment] = useState(0)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (adjustment === 0) return

    setLoading(true)
    try {
      await api.post(`/inventory/${item._id}/adjust`, { adjustment, reason })
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to adjust quantity:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !item) return null

  const newQuantity = (item.quantity?.current || 0) + adjustment

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl">
        <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Adjust Quantity</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="text-center">
            <p className="text-slate-600">{item.name}</p>
            <p className="text-sm text-slate-500">
              Current: {item.quantity?.current || 0} {item.unit}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Adjustment (+/-)
            </label>
            <input
              type="number"
              value={adjustment}
              onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center text-lg font-semibold focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className={`text-center mt-2 text-sm ${newQuantity < 0 ? 'text-red-600' : 'text-slate-600'}`}>
              New quantity: {newQuantity} {item.unit}
            </p>
          </div>

          <Input
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Used for Site A foundation"
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || adjustment === 0 || newQuantity < 0}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Confirm'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Inventory() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [adjustItem, setAdjustItem] = useState(null)

  useEffect(() => {
    if (projectId) {
      loadInventory()
    }
  }, [projectId, category])

  const loadInventory = async () => {
    try {
      setLoading(true)
      const params = category !== 'all' ? `?category=${category}` : ''
      const [itemsRes, summaryRes] = await Promise.all([
        api.get(`/inventory/project/${projectId}${params}`),
        api.get(`/inventory/project/${projectId}/summary`),
      ])

      if (itemsRes.success) {
        setItems(itemsRes.data.items)
      }
      if (summaryRes.success) {
        setSummary(summaryRes.data)
      }
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await api.delete(`/inventory/${itemId}`)
      loadInventory()
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (item) => {
    if (item.status === 'out_of_stock' || item.quantity?.current <= 0) {
      return <Badge variant="danger">Out of Stock</Badge>
    }
    if (item.status === 'low_stock' || item.quantity?.current <= item.quantity?.minimum) {
      return <Badge variant="warning">Low Stock</Badge>
    }
    return <Badge variant="success">In Stock</Badge>
  }

  if (!projectId) {
    return (
      <div className="pb-4">
        <div className="bg-white border-b border-slate-200 px-4 pt-4 pb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-xl font-bold text-slate-900">Inventory</h1>
          </div>
        </div>
        <div className="px-4 pt-8">
          <Card>
            <CardContent className="text-center py-12">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Select a Project</h3>
              <p className="text-slate-500 text-sm">
                Please select a project to view its inventory
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 pt-4 pb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-xl font-bold text-slate-900">Inventory</h1>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                category === cat.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="px-4 pt-4 grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="text-center py-3">
              <p className="text-2xl font-bold text-slate-900">
                {summary.overview?.totalItems || 0}
              </p>
              <p className="text-xs text-slate-500">Total Items</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-3">
              <p className="text-2xl font-bold text-amber-600">
                {summary.overview?.lowStockCount || 0}
              </p>
              <p className="text-xs text-slate-500">Low Stock</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-3">
              <p className="text-lg font-bold text-primary-600">
                ₹{((summary.overview?.totalValue || 0) / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-slate-500">Total Value</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Items List */}
      <div className="px-4 pt-4">
        {loading ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-slate-500 text-sm mt-4">Loading inventory...</p>
            </CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">No items found</h3>
              <p className="text-slate-500 text-sm mb-4">
                {items.length === 0
                  ? 'Start by adding inventory items'
                  : 'No items match your search'}
              </p>
              {items.length === 0 && (
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add First Item
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <Card key={item._id}>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {item.name}
                        </h3>
                        {getStatusBadge(item)}
                      </div>
                      <p className="text-sm text-slate-500 capitalize mb-2">
                        {item.category}
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div>
                          <span className="text-slate-400">Qty:</span>{' '}
                          <span className="font-medium">
                            {item.quantity?.current || 0} {item.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Min:</span>{' '}
                          <span className="font-medium">
                            {item.quantity?.minimum || 0} {item.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Price:</span>{' '}
                          <span className="font-medium">
                            ₹{item.price?.perUnit || 0}/{item.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Value:</span>{' '}
                          <span className="font-medium text-primary-600">
                            ₹{((item.quantity?.current || 0) * (item.price?.perUnit || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {item.location && (
                        <p className="text-xs text-slate-400 mt-2">
                          Location: {item.location}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setAdjustItem(item)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg text-xs font-medium"
                      >
                        +/-
                      </button>
                      <button
                        onClick={() => {
                          setEditItem(item)
                          setShowAddModal(true)
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteItem(item._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddItemModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditItem(null)
        }}
        projectId={projectId}
        editItem={editItem}
        onSuccess={loadInventory}
      />

      <AdjustQuantityModal
        isOpen={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        item={adjustItem}
        onSuccess={loadInventory}
      />
    </div>
  )
}
