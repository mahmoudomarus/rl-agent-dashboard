import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
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
  Minus,
  Building,
  CheckCircle,
  XCircle
} from "lucide-react"
import { agentsApi, agenciesApi, type Agent } from "../../services/longTermRentalApi"

const getRoleColor = (role: string) => {
  switch (role) {
    case 'manager': return 'bg-purple-100 text-purple-800'
    case 'team_lead': return 'bg-indigo-100 text-indigo-800'
    case 'senior_agent': return 'bg-blue-100 text-blue-800'
    case 'agent': return 'bg-green-100 text-green-800'
    case 'admin': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800'
    case 'inactive': return 'bg-red-100 text-red-800'
    case 'suspended': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
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
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [agencyId, setAgencyId] = useState<string>('')
  const [formData, setFormData] = useState<Partial<Agent>>({})

  // Get current agency ID and fetch agents
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get current agency
        const agencyData = await agenciesApi.getCurrent()
        setAgencyId(agencyData.id)
        
        // Get agents for this agency
        const agentsData = await agentsApi.getAll(agencyData.id)
        setAgents(agentsData)
        
      } catch (err) {
        console.error('Failed to fetch agents:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch agents')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Filter agents based on search and filters
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.assigned_territories.some(territory => 
                           territory.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    
    const matchesRole = roleFilter === 'all' || agent.role === roleFilter
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  // Calculate team statistics from real data
  const teamStats = {
    totalAgents: agents.length,
    activeAgents: agents.filter(agent => agent.status === 'active').length,
    totalCommission: agents.reduce((acc, agent) => acc + (agent.total_commission_earned || 0), 0),
    totalDeals: agents.reduce((acc, agent) => acc + (agent.total_deals_closed || 0), 0),
    totalProperties: agents.reduce((acc, agent) => acc + (agent.total_properties_managed || 0), 0),
    topPerformer: agents.sort((a, b) => (b.total_commission_earned || 0) - (a.total_commission_earned || 0))[0]
  }

  const handleCreateAgent = async () => {
    if (!agencyId) return
    
    try {
      const newAgent = await agentsApi.create(agencyId, formData)
      setAgents(prev => [...prev, newAgent])
      setIsCreateModalOpen(false)
      setFormData({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent')
    }
  }

  const handleUpdateAgent = async () => {
    if (!selectedAgent || !agencyId) return
    
    try {
      const updatedAgent = await agentsApi.update(agencyId, selectedAgent.id, formData)
      setAgents(prev => prev.map(agent => 
        agent.id === selectedAgent.id ? updatedAgent : agent
      ))
      setIsEditModalOpen(false)
      setSelectedAgent(null)
      setFormData({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent')
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!agencyId || !confirm('Are you sure you want to delete this agent?')) return
    
    try {
      await agentsApi.delete(agencyId, agentId)
      setAgents(prev => prev.filter(agent => agent.id !== agentId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent')
    }
  }

  const openEditModal = (agent: Agent) => {
    setSelectedAgent(agent)
    setFormData({
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      role: agent.role,
      status: agent.status,
      commission_rate: agent.commission_rate,
      assigned_territories: agent.assigned_territories,
      specializations: agent.specializations,
      languages: agent.languages
    })
    setIsEditModalOpen(true)
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
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
          <p className="text-muted-foreground">Manage your real estate agents and track performance</p>
        </div>
        <Button onClick={() => {
          setFormData({})
          setIsCreateModalOpen(true)
        }}>
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
                <SelectItem value="admin">Admin</SelectItem>
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
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Team Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="territories">Territories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Team Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStats.totalAgents}</div>
                <p className="text-xs text-muted-foreground">
                  {teamStats.activeAgents} active
                </p>
              </CardContent>
            </Card>
            
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
                <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStats.totalDeals}</div>
                <p className="text-xs text-muted-foreground">Closed deals</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Properties</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStats.totalProperties}</div>
                <p className="text-xs text-muted-foreground">Under management</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                <Crown className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold truncate">
                  {teamStats.topPerformer?.name || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(teamStats.topPerformer?.total_commission_earned || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Agent Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Team Members ({filteredAgents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAgents.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
                    <p className="text-gray-500 mb-4">
                      {agents.length === 0 
                        ? "Get started by adding your first agent to the team."
                        : "Try adjusting your search or filter criteria."
                      }
                    </p>
                    {agents.length === 0 && (
                      <Button onClick={() => setIsCreateModalOpen(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add First Agent
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-6 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="text-lg">
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-lg">{agent.name}</h4>
                            <Badge className={getRoleColor(agent.role)}>
                              {agent.role.replace('_', ' ')}
                            </Badge>
                            <Badge className={getStatusColor(agent.status)}>
                              {agent.status}
                            </Badge>
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
                            {agent.languages && (
                              <span className="flex items-center">
                                <Globe className="h-3 w-3 mr-1" />
                                {agent.languages.join(', ')}
                              </span>
                            )}
                          </div>

                          {/* Territories */}
                          {agent.assigned_territories.length > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-gray-500">Territories:</span>
                              {agent.assigned_territories.slice(0, 3).map((territory, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {territory}
                                </Badge>
                              ))}
                              {agent.assigned_territories.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{agent.assigned_territories.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Specializations */}
                          {agent.specializations && agent.specializations.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Specializations:</span>
                              {agent.specializations.slice(0, 2).map((spec, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                              {agent.specializations.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{agent.specializations.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        {/* Performance Metrics */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-sm font-semibold">
                              {agent.total_properties_managed || 0}
                            </p>
                            <p className="text-xs text-gray-500">Properties</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              {agent.total_deals_closed || 0}
                            </p>
                            <p className="text-xs text-gray-500">Deals</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              {formatCurrency(agent.total_commission_earned || 0)}
                            </p>
                            <p className="text-xs text-gray-500">Commission</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(agent)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAgent(agent.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
                {filteredAgents.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No performance data available</p>
                  </div>
                ) : (
                  filteredAgents
                    .sort((a, b) => (b.total_commission_earned || 0) - (a.total_commission_earned || 0))
                    .map((agent, index) => (
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
                              <p className="text-sm text-gray-600">
                                Rank #{index + 1} • {agent.role.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              {formatCurrency(agent.total_commission_earned || 0)}
                            </p>
                            <p className="text-xs text-gray-500">Total Earnings</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-lg font-semibold">
                              {agent.total_deals_closed || 0}
                            </p>
                            <p className="text-xs text-gray-600">Deals Closed</p>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-lg font-semibold">
                              {agent.total_properties_managed || 0}
                            </p>
                            <p className="text-xs text-gray-600">Properties</p>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-lg font-semibold">
                              {agent.commission_rate || 0}%
                            </p>
                            <p className="text-xs text-gray-600">Commission Rate</p>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-lg font-semibold">
                              {agent.assigned_territories.length}
                            </p>
                            <p className="text-xs text-gray-600">Territories</p>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="territories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Territory Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {filteredAgents.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No territory assignments available</p>
                  </div>
                ) : (
                  filteredAgents.map((agent) => (
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
                            <p className="text-sm text-gray-600">
                              {agent.assigned_territories.length} territories assigned
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(agent)}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                      </div>
                      
                      {agent.assigned_territories.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {agent.assigned_territories.map((territory, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{territory}</h5>
                                <Badge variant="outline" className="text-xs">
                                  Active
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p>Assigned territory for {agent.role.replace('_', ' ')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No territories assigned</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Agent Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Agent</DialogTitle>
            <DialogDescription>
              Add a new agent to your real estate team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input 
                  value={formData.name || ''} 
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label>Role *</Label>
                <Select value={formData.role || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as any }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
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
                <Label>Email *</Label>
                <Input 
                  type="email"
                  value={formData.email || ''} 
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input 
                  value={formData.phone || ''} 
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label>Commission Rate (%)</Label>
                <Input 
                  type="number"
                  value={formData.commission_rate || ''} 
                  onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) }))}
                  placeholder="e.g., 2.5"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status || 'active'} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Territories (comma-separated)</Label>
              <Input 
                value={formData.assigned_territories?.join(', ') || ''} 
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  assigned_territories: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                }))}
                placeholder="e.g., Dubai Marina, JBR, Downtown Dubai"
              />
            </div>
            
            <div>
              <Label>Specializations (comma-separated)</Label>
              <Input 
                value={formData.specializations?.join(', ') || ''} 
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  specializations: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                }))}
                placeholder="e.g., Luxury Properties, Waterfront, Investment"
              />
            </div>
            
            <div>
              <Label>Languages (comma-separated)</Label>
              <Input 
                value={formData.languages?.join(', ') || ''} 
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  languages: e.target.value.split(',').map(l => l.trim()).filter(l => l)
                }))}
                placeholder="e.g., Arabic, English, French"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAgent}>
              Create Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Agent Profile</DialogTitle>
            <DialogDescription>
              Update agent information and settings.
            </DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={formData.role || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as any }))}>
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
                  <Input 
                    type="email"
                    value={formData.email || ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input 
                    value={formData.phone || ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Commission Rate (%)</Label>
                  <Input 
                    type="number"
                    value={formData.commission_rate || ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Territories (comma-separated)</Label>
                <Input 
                  value={formData.assigned_territories?.join(', ') || ''} 
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    assigned_territories: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                  }))}
                />
              </div>
              
              <div>
                <Label>Specializations (comma-separated)</Label>
                <Input 
                  value={formData.specializations?.join(', ') || ''} 
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    specializations: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  }))}
                />
              </div>
              
              <div>
                <Label>Languages (comma-separated)</Label>
                <Input 
                  value={formData.languages?.join(', ') || ''} 
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    languages: e.target.value.split(',').map(l => l.trim()).filter(l => l)
                  }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAgent}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}