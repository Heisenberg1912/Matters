import { useNavigate } from 'react-router-dom'
import { HardHat, ArrowRight, Briefcase, TrendingUp, Shield, ShieldCheck } from 'lucide-react'
import Button from '../components/Button'

export default function Splash() {
  const navigate = useNavigate()

  const features = [
    { icon: Briefcase, title: 'Find Jobs', desc: 'Browse and bid on construction projects' },
    { icon: TrendingUp, title: 'Grow Business', desc: 'Track earnings and build reputation' },
    { icon: Shield, title: 'Verified Profile', desc: 'Get verified to win more clients' },
  ]

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-primary-600 to-primary-800 flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
          <HardHat className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Matters</h1>
        <p className="text-primary-100 text-lg mb-8">Contractor Portal</p>

        {/* Features */}
        <div className="w-full max-w-sm space-y-4 mb-8">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">{title}</h3>
                <p className="text-primary-100 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-8 safe-bottom">
        <Button
          fullWidth
          size="lg"
          variant="secondary"
          onClick={() => navigate('/login')}
          className="bg-white text-primary-700 hover:bg-primary-50"
        >
          Get Started
          <ArrowRight className="w-5 h-5" />
        </Button>

        <p className="text-center text-primary-200 text-sm mt-4">
          Built for construction professionals
        </p>

        {/* Admin Login Link */}
        <button
          onClick={() => navigate('/admin/login')}
          className="mt-4 flex items-center justify-center gap-2 text-primary-200 hover:text-white text-sm transition"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Admin Portal</span>
        </button>
      </div>
    </div>
  )
}
