import { Loader2 } from 'lucide-react'

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-600 spinner" />
          </div>
        </div>
        <p className="text-slate-600 text-sm font-medium">{message}</p>
      </div>
    </div>
  )
}
