import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, Users, ClipboardList, Eye, DollarSign, FileText, TrendingUp, Calendar, MapPin, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { useApp } from "../contexts/AppContext"

export function DashboardOverview() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [agencyStats, setAgencyStats] = useState({
    totalProperties: 0,
    activeListings: 0,
    pendingApplications: 0,
    scheduledViewings: 0,
    monthlyCommission: 0,
    activeLeases: 0,
    agentCount: 0,
    conversionRate: 0
  })

  useEffect(() => {
    // TODO: Fetch real agency data from API
    // For now using placeholder data that represents real estate agency metrics
    setAgencyStats({
      totalProperties: 24,
      activeListings: 18,
      pendingApplications: 7,
      scheduledViewings: 12,
      monthlyCommission: 45200,
      activeLeases: 16,
      agentCount: 5,
      conversionRate: 68
    })
  }, [])

  const stats = [
    {
      title: "Active Listings",
      value: agencyStats.activeListings.toString(),
      change: `${agencyStats.totalProperties - agencyStats.activeListings} under review`,
      icon: Building2,
      color: "text-blue-600"
    },
    {
      title: "Monthly Commission",
      value: `AED ${agencyStats.monthlyCommission.toLocaleString()}`,
      change: "From closed deals",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Pending Applications",
      value: agencyStats.pendingApplications.toString(),
      change: "Require review",
      icon: ClipboardList,
      color: "text-orange-600"
    },
    {
      title: "Team Performance",
      value: `${agencyStats.conversionRate}%`,
      change: "Conversion rate",
      icon: TrendingUp,
      color: "text-emerald-600"
    }
  ]

  // Mock recent agency activities - TODO: Replace with real API data
  const recentActivities = [
    {
      id: '1',
      type: 'application',
      title: 'New tenant application',
      description: 'Dubai Marina - 2BR Apartment',
      time: '2 hours ago',
      status: 'pending'
    },
    {
      id: '2', 
      type: 'viewing',
      title: 'Property viewing scheduled',
      description: 'Downtown Dubai - 1BR Studio',
      time: '4 hours ago',
      status: 'confirmed'
    },
    {
      id: '3',
      type: 'lease',
      title: 'Lease agreement signed',
      description: 'JBR - 3BR Penthouse',
      time: '1 day ago',
      status: 'completed'
    }
  ]

  // Mock top performing properties - TODO: Replace with real API data
  const topPerformingAreas = [
    { area: 'Dubai Marina', properties: 8, avgRent: 85000, demand: 'High' },
    { area: 'Downtown Dubai', properties: 6, avgRent: 95000, demand: 'Very High' },
    { area: 'JBR', properties: 4, avgRent: 110000, demand: 'High' }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-krib-primary">Agency Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your real estate agency performance overview.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/add-property')}
          className="bg-krib-accent hover:bg-krib-secondary text-white"
        >
          <Building2 className="mr-2 h-4 w-4" />
          List New Property
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="krib-card krib-glow-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activities */}
        <Card className="krib-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-krib-accent" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest agency updates and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 border-b pb-3 last:border-b-0">
                  <div className="flex-shrink-0">
                    {activity.type === 'application' && <ClipboardList className="h-4 w-4 text-orange-500" />}
                    {activity.type === 'viewing' && <Eye className="h-4 w-4 text-blue-500" />}
                    {activity.type === 'lease' && <FileText className="h-4 w-4 text-green-500" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Badge 
                    variant={activity.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {activity.status}
                  </Badge>
                </div>
              ))}
              <Button 
                variant="ghost" 
                className="w-full justify-center text-sm"
                onClick={() => navigate('/applications')}
              >
                View all activities
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Areas */}
        <Card className="krib-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-krib-primary" />
              Top Performing Areas
            </CardTitle>
            <CardDescription>Best locations for rental demand</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformingAreas.map((area, index) => (
                <div key={area.area} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{area.area}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{area.properties} properties</span>
                        <span>•</span>
                        <Badge 
                          variant={area.demand === 'Very High' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {area.demand} demand
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">AED {area.avgRent.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">avg/year</p>
                    </div>
                  </div>
                  <Progress 
                    value={area.demand === 'Very High' ? 90 : area.demand === 'High' ? 75 : 50} 
                    className="h-2" 
                  />
                </div>
              ))}
              <Button 
                variant="ghost" 
                className="w-full justify-center text-sm"
                onClick={() => navigate('/analytics')}
              >
                View market analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="krib-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to manage your properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start h-auto p-4 text-left krib-button-primary group"
              onClick={() => navigate('/add-property')}
            >
              <div className="flex items-center w-full">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-krib-black/10 mr-3 group-hover:bg-krib-black/20 transition-colors">
                  <Plus className="h-5 w-5 text-krib-black" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Add New Property</div>
                  <div className="text-sm opacity-80">List a new rental property</div>
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4 text-left hover:bg-krib-lime-soft border-krib-lime/20 group"
              onClick={() => navigate('/analytics')}
            >
              <div className="flex items-center w-full">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-krib-lime/10 mr-3 group-hover:bg-krib-lime/20 transition-colors">
                  <BarChart3 className="h-5 w-5 text-krib-lime" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">View Analytics</div>
                  <div className="text-sm text-muted-foreground">Performance insights</div>
                </div>
              </div>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start h-auto p-4 text-left hover:bg-krib-lime-soft group"
              onClick={() => navigate('/bookings')}
            >
              <div className="flex items-center w-full">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-krib-lime/5 mr-3 group-hover:bg-krib-lime/10 transition-colors">
                  <BookOpen className="h-5 w-5 text-krib-lime" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Manage Bookings</div>
                  <div className="text-sm text-muted-foreground">Reservations & guests</div>
                </div>
              </div>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start h-auto p-4 text-left hover:bg-krib-lime-soft group"
              onClick={() => navigate('/financials')}
            >
              <div className="flex items-center w-full">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-krib-lime-light/5 mr-3 group-hover:bg-krib-lime-light/10 transition-colors">
                  <CreditCard className="h-5 w-5 text-krib-lime-light" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Financial Dashboard</div>
                  <div className="text-sm text-muted-foreground">Earnings & payouts</div>
                </div>
              </div>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start h-auto p-4 text-left hover:bg-krib-lime-soft group"
              onClick={() => navigate('/settings')}
            >
              <div className="flex items-center w-full">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-krib-black/5 mr-3 group-hover:bg-krib-black/10 transition-colors">
                  <Settings className="h-5 w-5 text-krib-black" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Settings</div>
                  <div className="text-sm text-muted-foreground">Account preferences</div>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>

        <Card className="krib-card">
          <CardHeader>
            <CardTitle>Property Performance</CardTitle>
            <CardDescription>Overall portfolio metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Portfolio Occupancy</span>
                <span>{occupancyRate}%</span>
              </div>
              <Progress value={occupancyRate} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Active Properties</span>
                <span>{properties.filter(p => p.status === 'active').length}</span>
              </div>
              <Progress value={properties.length > 0 ? (properties.filter(p => p.status === 'active').length / properties.length) * 100 : 0} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Average Rating</span>
                <span>{averageRating.toFixed(1)}/5.0</span>
              </div>
              <Progress value={(averageRating / 5) * 100} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}