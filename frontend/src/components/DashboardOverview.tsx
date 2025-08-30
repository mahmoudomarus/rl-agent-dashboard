import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { agenciesApi, applicationsApi, viewingsApi, leasesApi, agentsApi } from "../../services/longTermRentalApi"
import { Building2, Users, ClipboardList, Eye, DollarSign, FileText, TrendingUp, Calendar, MapPin, Plus, BarChart3, BookOpen, CreditCard, Settings, AlertCircle } from "lucide-react"
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agency, setAgency] = useState<any>(null)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [topPerformingAreas, setTopPerformingAreas] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get current agency first
      const agencyData = await agenciesApi.getCurrent()
      setAgency(agencyData)
      
      // Fetch all real data in parallel
      const [
        dashboardData,
        applications,
        viewings,
        leases,
        agents
      ] = await Promise.all([
        agenciesApi.getDashboardStats().catch(() => ({ 
          active_listings: 0, 
          monthly_commission: 0, 
          pending_applications: 0, 
          team_performance: 0 
        })),
        applicationsApi.getAll().catch(() => []),
        viewingsApi.getAll().catch(() => []),
        leasesApi.getLeases().catch(() => []),
        agentsApi.getAll(agencyData.id).catch(() => [])
      ])
      
      // Calculate real stats from actual data
      const pendingApplications = applications.filter((app: any) => 
        app.status === 'under_review' || app.status === 'pending'
      ).length
      
      const scheduledViewings = viewings.filter((viewing: any) => 
        viewing.status === 'scheduled' || viewing.status === 'confirmed'
      ).length
      
      const activeLeases = leases.filter((lease: any) => 
        lease.status === 'active' || lease.status === 'fully_executed'
      ).length
      
      const totalCommission = (leases as any[]).reduce((sum: number, lease: any) => 
        sum + (lease.total_commission || 0), 0
      )
      
      setAgencyStats({
        totalProperties: dashboardData.active_listings || 0,
        activeListings: dashboardData.active_listings || 0,
        pendingApplications,
        scheduledViewings,
        monthlyCommission: totalCommission,
        activeLeases,
        agentCount: agents.length,
        conversionRate: dashboardData.team_performance || 0
      })

      // Load recent activities from real data
      await loadRecentActivities(applications, viewings, leases)
      await loadTopPerformingAreas(leases, agents)
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadRecentActivities = async (applications: any[], viewings: any[], leases: any[]) => {
    try {
      const activities = []

      // Add recent applications
      const recentApps = applications
        .filter((app: any) => app.status === 'under_review' || app.status === 'pending')
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 2)
        .map((app: any) => ({
          id: app.id,
          type: 'application',
          title: 'New tenant application',
          description: app.property_title || `Application for property`,
          status: app.status,
          time: formatTimeAgo(app.created_at),
          icon: ClipboardList,
          color: 'text-orange-600'
        }))

      // Add recent viewings
      const recentViewings = viewings
        .filter((viewing: any) => viewing.status === 'scheduled' || viewing.status === 'confirmed')
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 2)
        .map((viewing: any) => ({
          id: viewing.id,
          type: 'viewing',
          title: 'Property viewing scheduled',
          description: viewing.property_title || `Property viewing`,
          status: viewing.status,
          time: formatTimeAgo(viewing.created_at),
          icon: Eye,
          color: 'text-blue-600'
        }))

      // Add recent leases
      const recentLeases = leases
        .filter((lease: any) => lease.status === 'fully_executed')
        .sort((a: any, b: any) => new Date(b.execution_date || b.created_at).getTime() - new Date(a.execution_date || a.created_at).getTime())
        .slice(0, 2)
        .map((lease: any) => ({
          id: lease.id,
          type: 'lease',
          title: 'Lease agreement signed',
          description: lease.property_title || `Lease agreement`,
          status: lease.status,
          time: formatTimeAgo(lease.execution_date || lease.created_at),
          icon: FileText,
          color: 'text-green-600'
        }))

      // Combine and sort by time
      const allActivities = [...recentApps, ...recentViewings, ...recentLeases]
        .sort((a, b) => {
          const timeA = new Date(a.time === 'Just now' ? Date.now() : Date.now() - parseTimeAgo(a.time))
          const timeB = new Date(b.time === 'Just now' ? Date.now() : Date.now() - parseTimeAgo(b.time))
          return timeB.getTime() - timeA.getTime()
        })
        .slice(0, 5)

      setRecentActivities(allActivities)
    } catch (error) {
      console.error('Failed to load recent activities:', error)
      setRecentActivities([])
    }
  }

  const loadTopPerformingAreas = async (leases: any[], agents: any[]) => {
    try {
      // Since leases don't have property location, use agent territories and commission data instead
      const territoryPerformance = new Map()
      
      // Group by agent territories and calculate performance
      agents.forEach((agent: any) => {
        const agentLeases = leases.filter((lease: any) => lease.agent_id === agent.id)
        const totalCommission = agentLeases.reduce((sum: number, lease: any) => sum + (lease.broker_commission || 0), 0)
        const avgRent = agentLeases.length > 0 ? 
          agentLeases.reduce((sum: number, lease: any) => sum + (lease.annual_rent || 0), 0) / agentLeases.length : 0
        
        // Use agent's assigned territories
        const territories = agent.assigned_territories || ['General']
        
        territories.forEach((territory: string) => {
          if (territoryPerformance.has(territory)) {
            const existing = territoryPerformance.get(territory)
            territoryPerformance.set(territory, {
              area: territory,
              properties: existing.properties + agentLeases.length,
              totalCommission: existing.totalCommission + totalCommission,
              avgRent: (existing.avgRent + avgRent) / 2,
              demand: existing.properties + agentLeases.length > 2 ? 'High' : 'Medium'
            })
          } else {
            territoryPerformance.set(territory, {
              area: territory,
              properties: agentLeases.length,
              totalCommission: totalCommission,
              avgRent: avgRent,
              demand: agentLeases.length > 2 ? 'High' : 'Medium'
            })
          }
        })
      })
      
      const topAreas = Array.from(territoryPerformance.values())
        .filter(area => area.properties > 0) // Only show areas with actual activity
        .sort((a, b) => b.totalCommission - a.totalCommission) // Sort by commission performance
        .slice(0, 3)
      
      setTopPerformingAreas(topAreas)
    } catch (error) {
      console.error('Failed to load top performing areas:', error)
      setTopPerformingAreas([])
    }
  }

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Unknown'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return '1 day ago'
    return `${diffInDays} days ago`
  }

  // Helper function to parse time ago string back to milliseconds
  const parseTimeAgo = (timeStr: string): number => {
    if (timeStr === 'Just now') return 0
    const match = timeStr.match(/(\d+)\s+(hours?|days?)\s+ago/)
    if (!match) return 0
    
    const num = parseInt(match[1])
    const unit = match[2]
    
    if (unit.startsWith('hour')) return num * 60 * 60 * 1000
    if (unit.startsWith('day')) return num * 24 * 60 * 60 * 1000
    return 0
  }

  const stats = [
    {
      title: "Active Listings",
      value: agencyStats.activeListings.toString(),
      change: `${Math.max(0, agencyStats.totalProperties - agencyStats.activeListings)} under review`,
      icon: Building2,
      color: "text-blue-600"
    },
    {
      title: "Monthly Commission",
      value: `AED ${Math.round(agencyStats.monthlyCommission).toLocaleString()}`,
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
      value: `${Math.round(agencyStats.conversionRate)}%`,
      change: "Conversion rate",
      icon: TrendingUp,
      color: "text-emerald-600"
    }
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Error: {error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => loadDashboardData()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-3xl font-bold tracking-tight">Agency Dashboard</h1>
        <p className="text-muted-foreground">
            Welcome back! Here's your real estate agency performance overview.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => navigate('/add-property')} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
          <Button onClick={() => navigate('/analytics')} className="btn-secondary">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Statistics Cards - Beautiful Branding */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const cardClasses = [
            'stats-card',
            'stats-card-teal', 
            'stats-card-gold',
            'stats-card-accent'
          ]
          return (
            <Card key={index} className={cardClasses[index % 4]}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${(index % 4 === 2 || index % 4 === 3) ? 'text-gray-800' : 'text-white'}`}>
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${(index % 4 === 2 || index % 4 === 3) ? 'text-gray-700' : 'text-white'} opacity-90`} />
            </CardHeader>
            <CardContent>
                <div className={`text-3xl font-bold ${(index % 4 === 2 || index % 4 === 3) ? 'text-gray-800' : 'text-white'}`}>
                  {stat.value}
                </div>
                <p className={`text-xs ${(index % 4 === 2 || index % 4 === 3) ? 'text-gray-600' : 'text-white'} opacity-80`}>
                  {stat.change}
                </p>
            </CardContent>
          </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest agency updates and actions</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/applications')}>
                View all activities
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activities</p>
                  <p className="text-sm">New applications and viewings will appear here</p>
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-full bg-gray-100`}>
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={
                          activity.status === 'completed' ? 'default' :
                          activity.status === 'confirmed' || activity.status === 'scheduled' ? 'secondary' :
                          'outline'
                        } className="text-xs">
                          {activity.status}
                      </Badge>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Areas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Top Performing Areas
                </CardTitle>
                <CardDescription>Best locations for rental demand</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/analytics')}>
                View market analytics
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformingAreas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No performance data available</p>
                  <p className="text-sm">Add properties to see area performance</p>
                </div>
              ) : (
                topPerformingAreas.map((area, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                      <h4 className="font-medium">{area.area}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{area.properties} properties</span>
                        <Badge variant="outline" className="text-xs">
                          {area.demand} demand
                        </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                      <p className="font-medium">AED {Math.round(area.totalCommission).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">commission earned</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to manage your properties</CardDescription>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col space-y-2" onClick={() => navigate('/add-property')}>
              <Plus className="h-5 w-5" />
              <span>Add Property</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2" onClick={() => navigate('/applications')}>
              <ClipboardList className="h-5 w-5" />
              <span>Review Applications</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2" onClick={() => navigate('/viewings')}>
              <Eye className="h-5 w-5" />
              <span>Schedule Viewings</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2" onClick={() => navigate('/leases')}>
              <FileText className="h-5 w-5" />
              <span>Manage Leases</span>
            </Button>
              </div>
          </CardContent>
        </Card>

      {/* Agency Performance */}
      <Card>
          <CardHeader>
          <CardTitle>Agency Performance</CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Leases</span>
                <span className="text-sm font-medium">{agencyStats.activeLeases}</span>
              </div>
              <Progress value={(agencyStats.activeLeases / Math.max(agencyStats.totalProperties, 1)) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Team Size</span>
                <span className="text-sm font-medium">{agencyStats.agentCount} agents</span>
              </div>
              <Progress value={Math.min((agencyStats.agentCount / 10) * 100, 100)} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Scheduled Viewings</span>
                <span className="text-sm font-medium">{agencyStats.scheduledViewings}</span>
              </div>
              <Progress value={Math.min((agencyStats.scheduledViewings / 20) * 100, 100)} className="h-2" />
            </div>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}