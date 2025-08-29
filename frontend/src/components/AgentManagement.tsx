import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Progress } from "./ui/progress"
import { 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  TrendingUp, 
  Plus, 
  Search, 
  UserPlus, 
  AlertCircle,
  Award,
  Target,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Crown,
  Star,
  Trophy,
  BarChart3,
  Settings,
  Globe,
  Clock,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react"

interface Agent {
  id: string
  name: string
  email: string
  phone: string
  role: 'agent' | 'senior_agent' | 'manager' | 'team_lead'
  status: 'active' | 'inactive' | 'on_leave'
  territories: Territory[]
  propertiesManaged: number
  dealsThisMonth: number
  commissionEarned: number
  joinedDate: string
  performance: AgentPerformance
  hierarchy: AgentHierarchy
  avatar?: string
  specializations: string[]
  languages: string[]
}

interface Territory {
  id: string
  name: string
  area_type: 'district' | 'building' | 'community'
  priority: 'primary' | 'secondary'
  assigned_date: string
  performance_score: number
  properties_count: number
  avg_deal_value: number
}

interface AgentPerformance {
  monthly_target: number
  monthly_achieved: number
  yearly_target: number
  yearly_achieved: number
  conversion_rate: number
  avg_deal_size: number
  client_satisfaction: number
  response_time_hours: number
  deals_last_30_days: number
  leads_generated: number
  ranking: number
  total_commission_ytd: number
  performance_trend: 'up' | 'down' | 'stable'
}

interface AgentHierarchy {
  reports_to?: string
  team_members?: string[]
  direct_reports: number
  team_size: number
  management_level: number
}

// Enhanced mock data with performance and territory details
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Mohammed Al Zaabi',
    email: 'mohammed@kribrealestate.ae',
    phone: '+971-50-123-4567',
    role: 'senior_agent',
    status: 'active',
    territories: [
      {
        id: 'ter-1',
        name: 'Dubai Marina',
        area_type: 'district',
        priority: 'primary',
        assigned_date: '2023-06-15',
        performance_score: 92,
        properties_count: 15,
        avg_deal_value: 2800000
      },
      {
        id: 'ter-2',
        name: 'JBR',
        area_type: 'district',
        priority: 'secondary',
        assigned_date: '2023-08-01',
        performance_score: 87,
        properties_count: 8,
        avg_deal_value: 3200000
      }
    ],
    propertiesManaged: 15,
    dealsThisMonth: 3,
    commissionEarned: 45000,
    joinedDate: '2023-06-15',
    specializations: ['Luxury Properties', 'Marina Views'],
    languages: ['Arabic', 'English', 'French'],
    performance: {
      monthly_target: 150000,
      monthly_achieved: 135000,
      yearly_target: 1800000,
      yearly_achieved: 1620000,
      conversion_rate: 78,
      avg_deal_size: 2950000,
      client_satisfaction: 4.8,
      response_time_hours: 2.3,
      deals_last_30_days: 5,
      leads_generated: 23,
      ranking: 2,
      total_commission_ytd: 540000,
      performance_trend: 'up'
    },
    hierarchy: {
      reports_to: '3',
      direct_reports: 2,
      team_size: 3,
      management_level: 2,
      team_members: ['4', '5']
    }
  },
  {
    id: '2',
    name: 'Fatima Al Mansouri',
    email: 'fatima@kribrealestate.ae',
    phone: '+971-55-987-6543',
    role: 'agent',
    status: 'active',
    territories: [
      {
        id: 'ter-3',
        name: 'Downtown Dubai',
        area_type: 'district',
        priority: 'primary',
        assigned_date: '2023-09-01',
        performance_score: 89,
        properties_count: 12,
        avg_deal_value: 3500000
      }
    ],
    propertiesManaged: 12,
    dealsThisMonth: 2,
    commissionEarned: 32000,
    joinedDate: '2023-09-01',
    specializations: ['Commercial', 'High-rise'],
    languages: ['Arabic', 'English'],
    performance: {
      monthly_target: 120000,
      monthly_achieved: 98000,
      yearly_target: 1440000,
      yearly_achieved: 1176000,
      conversion_rate: 72,
      avg_deal_size: 3200000,
      client_satisfaction: 4.6,
      response_time_hours: 1.8,
      deals_last_30_days: 3,
      leads_generated: 18,
      ranking: 4,
      total_commission_ytd: 384000,
      performance_trend: 'stable'
    },
    hierarchy: {
      reports_to: '1',
      direct_reports: 0,
      team_size: 1,
      management_level: 1
    }
  },
  {
    id: '3',
    name: 'Ahmed Hassan',
    email: 'ahmed@kribrealestate.ae',
    phone: '+971-52-456-7890',
    role: 'manager',
    status: 'active',
    territories: [
      {
        id: 'ter-4',
        name: 'Palm Jumeirah',
        area_type: 'district',
        priority: 'primary',
        assigned_date: '2022-03-10',
        performance_score: 95,
        properties_count: 25,
        avg_deal_value: 8500000
      }
    ],
    propertiesManaged: 25,
    dealsThisMonth: 5,
    commissionEarned: 78000,
    joinedDate: '2022-03-10',
    specializations: ['Ultra-Luxury', 'Waterfront', 'Investment'],
    languages: ['Arabic', 'English', 'Russian'],
    performance: {
      monthly_target: 300000,
      monthly_achieved: 280000,
      yearly_target: 3600000,
      yearly_achieved: 3360000,
      conversion_rate: 85,
      avg_deal_size: 7800000,
      client_satisfaction: 4.9,
      response_time_hours: 1.2,
      deals_last_30_days: 7,
      leads_generated: 45,
      ranking: 1,
      total_commission_ytd: 936000,
      performance_trend: 'up'
    },
    hierarchy: {
      direct_reports: 8,
      team_size: 15,
      management_level: 3,
      team_members: ['1', '2', '4', '5', '6', '7', '8']
    }
  },
  {
    id: '4',
    name: 'Sarah Williams',
    email: 'sarah@kribrealestate.ae',
    phone: '+971-56-789-0123',
    role: 'agent',
    status: 'active',
    territories: [
      {
        id: 'ter-5',
        name: 'DIFC',
        area_type: 'district',
        priority: 'primary',
        assigned_date: '2024-01-15',
        performance_score: 76,
        properties_count: 8,
        avg_deal_value: 2200000
      }
    ],
    propertiesManaged: 8,
    dealsThisMonth: 1,
    commissionEarned: 18000,
    joinedDate: '2024-01-15',
    specializations: ['First-time Buyers', 'Studio Apartments'],
    languages: ['English', 'Hindi'],
    performance: {
      monthly_target: 80000,
      monthly_achieved: 65000,
      yearly_target: 960000,
      yearly_achieved: 195000,
      conversion_rate: 68,
      avg_deal_size: 1950000,
      client_satisfaction: 4.4,
      response_time_hours: 3.1,
      deals_last_30_days: 2,
      leads_generated: 12,
      ranking: 6,
      total_commission_ytd: 54000,
      performance_trend: 'up'
    },
    hierarchy: {
      reports_to: '1',
      direct_reports: 0,
      team_size: 1,
      management_level: 1
    }
  }
]

const getRoleColor = (role: string) => {
  switch (role) {
    case 'manager': return 'bg-purple-100 text-purple-800'
    case 'team_lead': return 'bg-indigo-100 text-indigo-800'
    case 'senior_agent': return 'bg-blue-100 text-blue-800'
    case 'agent': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800'
    case 'inactive': return 'bg-red-100 text-red-800'
    case 'on_leave': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up': return <ArrowUp className="h-3 w-3 text-green-600" />
    case 'down': return <ArrowDown className="h-3 w-3 text-red-600" />
    case 'stable': return <Minus className="h-3 w-3 text-gray-600" />
  }
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `AED ${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `AED ${(amount / 1000).toFixed(0)}K`
  } else {
    return `AED ${amount}`
  }
}

export function AgentManagement() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isTerritoryModalOpen, setIsTerritoryModalOpen] = useState(false)

  useEffect(() => {
    // In a real app, this would fetch agents from the API
    const fetchAgents = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setAgents(mockAgents)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch agents')
      } finally {
        setLoading(false)
      }
    }
    fetchAgents()
  }, [])

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.territories.some(territory => 
                           territory.name.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    
    const matchesRole = roleFilter === 'all' || agent.role === roleFilter
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  // Sort agents by performance ranking
  const sortedAgents = filteredAgents.sort((a, b) => a.performance.ranking - b.performance.ranking)

  const teamStats = {
    totalCommission: agents.reduce((acc, agent) => acc + agent.performance.total_commission_ytd, 0),
    totalDeals: agents.reduce((acc, agent) => acc + agent.performance.deals_last_30_days, 0),
    totalProperties: agents.reduce((acc, agent) => acc + agent.propertiesManaged, 0),
    avgConversion: agents.reduce((acc, agent) => acc + agent.performance.conversion_rate, 0) / agents.length,
    topPerformer: agents.find(agent => agent.performance.ranking === 1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading team data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Enhanced Team Management</h2>
          <p className="text-muted-foreground">Manage agents, territories, and performance tracking</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search agents, territories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="team_lead">Team Lead</SelectItem>
                <SelectItem value="senior_agent">Senior Agent</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Team Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="territories">Territories</TabsTrigger>
          <TabsTrigger value="hierarchy">Team Structure</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Team Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(teamStats.totalCommission)}</div>
                <p className="text-xs text-muted-foreground">Year to date</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStats.totalDeals}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Properties</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStats.totalProperties}</div>
                <p className="text-xs text-muted-foreground">Under management</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStats.avgConversion.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Team average</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                <Crown className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{teamStats.topPerformer?.name}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(teamStats.topPerformer?.performance.total_commission_ytd || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Agent Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Team Members ({sortedAgents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-6 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="text-lg">
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {agent.performance.ranking <= 3 && (
                          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                            <Trophy className="h-3 w-3 text-yellow-800" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg">{agent.name}</h4>
                          <Badge className={getRoleColor(agent.role)}>
                            {agent.role.replace('_', ' ')}
                          </Badge>
                          <Badge className={getStatusColor(agent.status)}>
                            {agent.status.replace('_', ' ')}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500">#{agent.performance.ranking}</span>
                            {getTrendIcon(agent.performance.performance_trend)}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-2">
                          <span className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {agent.email}
                          </span>
                          <span className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {agent.phone}
                          </span>
                          <span className="flex items-center">
                            <Globe className="h-3 w-3 mr-1" />
                            {agent.languages.join(', ')}
                          </span>
                        </div>

                        {/* Territories */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-500">Territories:</span>
                          {agent.territories.map((territory, index) => (
                            <Badge 
                              key={index} 
                              variant={territory.priority === 'primary' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              {territory.name} ({territory.performance_score}%)
                            </Badge>
                          ))}
                        </div>

                        {/* Specializations */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Specializations:</span>
                          {agent.specializations.map((spec, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      {/* Performance Metrics */}
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-sm font-semibold">{agent.propertiesManaged}</p>
                          <p className="text-xs text-gray-500">Properties</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{agent.performance.deals_last_30_days}</p>
                          <p className="text-xs text-gray-500">Deals (30d)</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{formatCurrency(agent.performance.total_commission_ytd)}</p>
                          <p className="text-xs text-gray-500">Commission YTD</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{agent.performance.conversion_rate}%</p>
                          <p className="text-xs text-gray-500">Conversion</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAgent(agent)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAgent(agent)
                            setIsTerritoryModalOpen(true)
                          }}
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Territories
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Performance Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sortedAgents.map((agent) => (
                  <div key={agent.id} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{agent.name}</h4>
                          <p className="text-sm text-gray-600">Rank #{agent.performance.ranking}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < Math.floor(agent.performance.client_satisfaction) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">({agent.performance.client_satisfaction}/5.0)</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Monthly Progress</p>
                        <Progress 
                          value={(agent.performance.monthly_achieved / agent.performance.monthly_target) * 100} 
                          className="mt-1"
                        />
                        <p className="text-xs mt-1">
                          {formatCurrency(agent.performance.monthly_achieved)} / {formatCurrency(agent.performance.monthly_target)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Yearly Progress</p>
                        <Progress 
                          value={(agent.performance.yearly_achieved / agent.performance.yearly_target) * 100} 
                          className="mt-1"
                        />
                        <p className="text-xs mt-1">
                          {formatCurrency(agent.performance.yearly_achieved)} / {formatCurrency(agent.performance.yearly_target)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Response Time</p>
                        <p className="text-lg font-semibold">{agent.performance.response_time_hours}h</p>
                        <p className="text-xs text-gray-600">Average response</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Leads Generated</p>
                        <p className="text-lg font-semibold">{agent.performance.leads_generated}</p>
                        <p className="text-xs text-gray-600">This month</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="territories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Territory Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {agents.map((agent) => (
                  <div key={agent.id} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{agent.name}</h4>
                          <p className="text-sm text-gray-600">{agent.territories.length} territories assigned</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAgent(agent)
                          setIsTerritoryModalOpen(true)
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Manage Territories
                      </Button>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {agent.territories.map((territory) => (
                        <div key={territory.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{territory.name}</h5>
                            <Badge 
                              variant={territory.priority === 'primary' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {territory.priority}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500">Performance</p>
                              <p className="font-semibold">{territory.performance_score}%</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Properties</p>
                              <p className="font-semibold">{territory.properties_count}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-500">Avg Deal Value</p>
                              <p className="font-semibold">{formatCurrency(territory.avg_deal_value)}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <Progress value={territory.performance_score} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Team Structure & Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Manager Level */}
                {agents.filter(agent => agent.role === 'manager').map((manager) => (
                  <div key={manager.id} className="border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {manager.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <Crown className="h-4 w-4 text-purple-600" />
                          {manager.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Manager • {manager.hierarchy.direct_reports} direct reports • Team of {manager.hierarchy.team_size}
                        </p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-sm font-semibold">{formatCurrency(manager.performance.total_commission_ytd)}</p>
                        <p className="text-xs text-gray-500">Team commission YTD</p>
                      </div>
                    </div>
                    
                    {/* Team Members */}
                    <div className="ml-6 space-y-3">
                      {agents.filter(agent => agent.hierarchy.reports_to === manager.id).map((teamMember) => (
                        <div key={teamMember.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Avatar>
                            <AvatarFallback>
                              {teamMember.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h5 className="font-medium">{teamMember.name}</h5>
                            <p className="text-sm text-gray-600">
                              {teamMember.role.replace('_', ' ')} • Rank #{teamMember.performance.ranking}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatCurrency(teamMember.performance.total_commission_ytd)}</p>
                            <p className="text-xs text-gray-500">{teamMember.territories.length} territories</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Agent Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Agent Profile</DialogTitle>
            <DialogDescription>
              Update agent information, performance targets, and settings.
            </DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input defaultValue={selectedAgent.name} />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select defaultValue={selectedAgent.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="senior_agent">Senior Agent</SelectItem>
                      <SelectItem value="team_lead">Team Lead</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input defaultValue={selectedAgent.email} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input defaultValue={selectedAgent.phone} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Monthly Target (AED)</Label>
                  <Input defaultValue={selectedAgent.performance.monthly_target} />
                </div>
                <div>
                  <Label>Yearly Target (AED)</Label>
                  <Input defaultValue={selectedAgent.performance.yearly_target} />
                </div>
              </div>
              
              <div>
                <Label>Specializations</Label>
                <Input defaultValue={selectedAgent.specializations.join(', ')} placeholder="Luxury Properties, Marina Views" />
              </div>
              
              <div>
                <Label>Languages</Label>
                <Input defaultValue={selectedAgent.languages.join(', ')} placeholder="Arabic, English, French" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsEditModalOpen(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Territory Management Modal */}
      <Dialog open={isTerritoryModalOpen} onOpenChange={setIsTerritoryModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Territory Management</DialogTitle>
            <DialogDescription>
              Assign and manage territories for {selectedAgent?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {selectedAgent.territories.map((territory) => (
                  <div key={territory.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium">{territory.name}</h5>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Priority</Label>
                        <Select defaultValue={territory.priority}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Area Type</Label>
                        <Select defaultValue={territory.area_type}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="district">District</SelectItem>
                            <SelectItem value="building">Building</SelectItem>
                            <SelectItem value="community">Community</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Performance</p>
                          <p className="font-semibold">{territory.performance_score}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Properties</p>
                          <p className="font-semibold">{territory.properties_count}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Add New Territory */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
                  <Button variant="ghost" className="flex-col h-auto py-4">
                    <Plus className="h-6 w-6 mb-2" />
                    <span>Add Territory</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTerritoryModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsTerritoryModalOpen(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}