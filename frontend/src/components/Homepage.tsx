import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { ArrowRight, Bot, Building2, Search, BarChart3, Users, MapPin, Sparkles, CheckCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import kribLogo from "../assets/krib-logo.svg"

export function Homepage() {
  const navigate = useNavigate()

  const handleSignIn = () => {
    navigate('/auth')
  }

  const handleSignUp = () => {
    navigate('/auth')
  }

  const features = [
    {
      icon: Bot,
      title: "AI Property Matching",
      description: "Our intelligent AI agent analyzes customer preferences and matches them with perfect properties in real-time."
    },
    {
      icon: Search,
      title: "Smart Property Discovery",
      description: "Advanced algorithms search through thousands of listings to find properties that truly match your lifestyle and budget."
    },
    {
      icon: Building2,
      title: "Agent Dashboard",
      description: "Comprehensive management platform for real estate agents to list, track, and manage properties efficiently."
    },
    {
      icon: BarChart3,
      title: "Market Analytics",
      description: "Real-time UAE market insights and data-driven recommendations to help agents make informed decisions."
    },
    {
      icon: Users,
      title: "Client Management",
      description: "Streamlined tools for managing client relationships, viewings, and applications all in one place."
    },
    {
      icon: MapPin,
      title: "Dubai-Focused",
      description: "Deep understanding of Dubai's unique real estate market with localized insights and expertise."
    }
  ]

  const benefits = [
    "AI-powered property recommendations",
    "Automated client matching",
    "Real-time market analytics",
    "Streamlined property management",
    "Enhanced customer experience",
    "Data-driven insights"
  ]

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Dubai background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{
          backgroundImage: `url("https://images.unsplash.com/photo-1518684079-3c830dcef090?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2126&q=80")`
        }}
      />
      
      {/* Light overlay to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/75 via-gray-50/60 to-white/50" />
      
      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between p-6 lg:px-12">
        <div className="flex items-center space-x-3">
          <img 
            src={kribLogo} 
            alt="Krib Logo" 
            className="h-10 w-auto"
          />
          <div className="text-2xl font-bold text-gray-900">
            Krib
            <span className="text-green-600">AI</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            className="text-gray-700 hover:text-green-600 hover:bg-gray-100"
            onClick={handleSignIn}
          >
            Sign In
          </Button>
          <Button 
            className="bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold hover:from-green-700 hover:to-green-600 shadow-lg shadow-green-500/25"
            onClick={handleSignUp}
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-20 pb-32">
        <div className="text-center space-y-8">
          <Badge className="inline-flex items-center space-x-2 bg-green-100 text-green-700 border-green-200 px-4 py-2">
            <Sparkles className="h-4 w-4" />
            <span>Revolutionizing UAE Real Estate with AI</span>
          </Badge>
          
          <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
            Find Your Perfect
            <span className="block bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              Dubai Property
            </span>
            <span className="block text-4xl lg:text-5xl text-gray-700">
              with AI Intelligence
            </span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Krib combines cutting-edge AI technology with deep UAE market expertise to transform how customers find properties and how agents manage their business.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 pt-8">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold px-8 py-4 text-lg hover:from-green-700 hover:to-green-600 shadow-xl shadow-green-500/30"
              onClick={handleSignUp}
            >
              Start Your Property Search
              <Search className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-4 text-lg"
              onClick={handleSignIn}
            >
              Agent Dashboard
              <BarChart3 className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 bg-white/60 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Powered by
              <span className="text-green-600"> Artificial Intelligence</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI agents work 24/7 to match customers with their ideal properties while providing real estate agents with powerful tools to manage and grow their business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white/90 transition-all duration-300 group shadow-lg">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-400 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-black" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Transforming the
              <span className="block text-green-600">UAE Real Estate Market</span>
            </h2>
            
            <p className="text-xl text-gray-600 leading-relaxed">
              As a growing startup, we're on a mission to revolutionize how people discover and manage properties in the UAE. Our AI-driven approach eliminates inefficiencies and creates better experiences for everyone.
            </p>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-gray-900">Why this matters for Dubai:</h3>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center space-x-3 text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="pt-6">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold px-8 py-4 text-lg hover:from-green-700 hover:to-green-600 shadow-xl shadow-green-500/30"
                onClick={handleSignUp}
              >
                Join the Revolution
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-green-100 to-green-50 border-green-200 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8 text-center">
                <Bot className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">For Property Seekers</h3>
                <p className="text-gray-700 leading-relaxed">
                  Our AI agent learns your preferences, budget, and lifestyle to recommend properties that truly match your needs. No more endless scrolling through irrelevant listings.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 border-gray-200 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8 text-center">
                <Building2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">For Real Estate Agents</h3>
                <p className="text-gray-700 leading-relaxed">
                  Comprehensive dashboard with AI-powered insights, automated client matching, and streamlined property management tools to grow your business efficiently.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 bg-gradient-to-r from-green-100 to-green-50 border-t border-green-200">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-20 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Ready to Experience the Future?
          </h2>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Join thousands of users who are already discovering properties smarter and faster with Krib AI.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold px-10 py-4 text-lg hover:from-green-700 hover:to-green-600 shadow-xl shadow-green-500/30"
              onClick={handleSignUp}
            >
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-gray-400 text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-10 py-4 text-lg"
              onClick={handleSignIn}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 bg-white/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src={kribLogo} 
                alt="Krib Logo" 
                className="h-8 w-auto"
              />
              <div className="text-lg font-bold text-gray-900">
                Krib<span className="text-green-600">AI</span>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm">
              © 2024 KribAI. Transforming UAE real estate with artificial intelligence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
