import { useState } from 'react'
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { 
  Building, 
  Users, 
  TrendingUp, 
  Shield, 
  Clock, 
  Award,
  ChevronRight,
  MapPin,
  Star,
  BarChart3,
  Handshake
} from 'lucide-react'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  highlight?: boolean
}

function FeatureCard({ icon, title, description, highlight = false }: FeatureCardProps) {
  return (
    <Card className={`swiss-feature-card ${highlight ? 'stats-card' : 'stats-card-light'} h-full`}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${highlight ? 'bg-black/10' : 'bg-lime-500/10'}`}>
            {icon}
          </div>
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed opacity-90">{description}</p>
      </CardContent>
    </Card>
  )
}

interface StatsCardProps {
  value: string
  label: string
  icon: React.ReactNode
}

function StatsCard({ value, label, icon }: StatsCardProps) {
  return (
    <div className="stats-card-accent text-center p-6 rounded-lg">
      <div className="flex justify-center mb-3">
        {icon}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium uppercase tracking-wide opacity-80">{label}</div>
    </div>
  )
}

export function KribLandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen bg-swiss-gray-50">
      {/* Dubai Background Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Dubai Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(26, 26, 26, 0.7), rgba(26, 26, 26, 0.5)), url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80')`
          }}
        />
        
        {/* Swiss Grid Overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full" style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(184, 255, 0, 0.1) 0px, transparent 1px),
              linear-gradient(rgba(184, 255, 0, 0.1) 0px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
          {/* Swiss Typography Header */}
          <div className="mb-6">
            <Badge className="badge-primary mb-4 text-sm px-4 py-2">
              DUBAI'S PREMIER REAL ESTATE PLATFORM
            </Badge>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight tracking-tight">
            KRIB
          </h1>
          
          <div className="w-24 h-1 bg-lime-500 mx-auto mb-8" />
          
          <h2 className="text-2xl md:text-4xl font-light mb-8 leading-relaxed max-w-3xl mx-auto">
            The <span className="font-bold text-lime-500">Swiss-Engineered</span> Real Estate Agent Dashboard
            <br />
            Built for <span className="font-bold">Dubai's Elite Market</span>
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Button 
              onClick={onGetStarted}
              className="btn-primary text-lg px-8 py-4 h-auto"
            >
              GET STARTED
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              className="btn-outline text-lg px-8 py-4 h-auto border-white text-white hover:bg-white hover:text-black"
            >
              WATCH DEMO
            </Button>
          </div>
        </div>

        {/* Geometric Accent */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-swiss-gray-50 to-transparent" />
      </section>

      {/* Swiss Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-swiss-gray-800">
              TRUSTED BY DUBAI'S TOP AGENCIES
            </h2>
            <div className="w-16 h-1 bg-lime-500 mx-auto" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatsCard 
              value="250+" 
              label="Active Agents" 
              icon={<Users className="h-8 w-8" />} 
            />
            <StatsCard 
              value="50K+" 
              label="Properties Listed" 
              icon={<Building className="h-8 w-8" />} 
            />
            <StatsCard 
              value="AED 2.5B+" 
              label="Transactions Managed" 
              icon={<TrendingUp className="h-8 w-8" />} 
            />
            <StatsCard 
              value="99.2%" 
              label="Uptime Guarantee" 
              icon={<Shield className="h-8 w-8" />} 
            />
          </div>
        </div>
      </section>

      {/* Why Krib Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-swiss-gray-800">
              WHY CHOOSE KRIB?
            </h2>
            <p className="text-xl text-swiss-gray-600 max-w-3xl mx-auto leading-relaxed">
              We combine Swiss precision engineering with deep understanding of Dubai's unique real estate landscape
            </p>
            <div className="w-16 h-1 bg-lime-500 mx-auto mt-6" />
          </div>

          <div className="swiss-grid mb-16">
            <FeatureCard 
              icon={<MapPin className="h-6 w-6" />}
              title="Dubai Market Expertise"
              description="Built specifically for Dubai's regulatory environment, currency requirements, and market dynamics. Integrated RERA compliance and Emirates ID verification."
              highlight
            />
            
            <FeatureCard 
              icon={<Clock className="h-6 w-6" />}
              title="Swiss Precision"
              description="Every feature engineered with Swiss attention to detail. Reliable, efficient, and built to handle high-volume transactions with zero downtime."
            />
            
            <FeatureCard 
              icon={<BarChart3 className="h-6 w-6" />}
              title="Advanced Analytics"
              description="Real-time market insights, performance tracking, and predictive analytics specifically calibrated for Dubai's luxury real estate market."
            />
            
            <FeatureCard 
              icon={<Handshake className="h-6 w-6" />}
              title="Integrated Workflow"
              description="From lead generation to contract signing - streamlined workflow with DocuSign integration, Google Calendar sync, and automated commission tracking."
              highlight
            />
            
            <FeatureCard 
              icon={<Shield className="h-6 w-6" />}
              title="Bank-Grade Security"
              description="Swiss-level security standards with end-to-end encryption, secure document storage, and compliance with UAE data protection regulations."
            />
            
            <FeatureCard 
              icon={<Award className="h-6 w-6" />}
              title="Proven Results"
              description="Used by Dubai's top-performing agents. 300% average increase in productivity and 40% reduction in administrative overhead."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-krib-black text-white relative overflow-hidden">
        {/* Geometric Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: `
              linear-gradient(45deg, rgba(184, 255, 0, 0.1) 25%, transparent 25%),
              linear-gradient(-45deg, rgba(184, 255, 0, 0.1) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, rgba(184, 255, 0, 0.1) 75%),
              linear-gradient(-45deg, transparent 75%, rgba(184, 255, 0, 0.1) 75%)
            `,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            READY TO TRANSFORM YOUR 
            <span className="text-lime-500"> REAL ESTATE BUSINESS?</span>
          </h2>
          
          <p className="text-xl mb-12 opacity-90 leading-relaxed">
            Join Dubai's leading real estate professionals using Swiss-engineered technology
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="flex space-x-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-6 py-4 rounded-lg bg-white text-black text-lg min-w-80 focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
              <Button 
                onClick={onGetStarted}
                className="btn-primary text-lg px-8 py-4 h-auto"
              >
                START FREE TRIAL
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center items-center space-x-6 mt-8 text-sm opacity-80">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 fill-lime-500 text-lime-500" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>RERA Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Setup in 5 Minutes</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
