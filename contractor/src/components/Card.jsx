export function Card({ children, className = '', onClick, hover = false }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-100 ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-4 py-3 border-b border-slate-100 ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-4 py-3 border-t border-slate-100 ${className}`}>
      {children}
    </div>
  )
}
