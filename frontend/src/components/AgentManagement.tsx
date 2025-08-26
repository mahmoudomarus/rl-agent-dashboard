import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Users, Phone, Mail, MapPin, TrendingUp, Plus, Search, UserPlus, AlertCircle } from "lucide-react"

interface Agent {
  id: string
  name: string
  email: string
  phone: string
  role: 'agent' | 'senior_agent' | 'manager'
  status: 'active' | 'inactive'
  territories: string[]
  propertiesManaged: number
  dealsThisMonth: number
  commissionEarned: number
  joinedDate: string
}

// Mock data for now
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Mohammed Al Zaabi',
    email: 'mohammed@kribrealestate.ae',
    phone: '+971-50-123-4567',
    role: 'senior_agent',
    status: 'active',
    territories: ['Dubai Marina', 'JBR'],
    propertiesManaged: 15,
    dealsThisMonth: 3,
    commissionEarned: 45000,
    joinedDate: '2023-06-15'
  },
  {
    id: '2',
    name: 'Fatima Al Mansouri',
    email: 'fatima@kribrealestate.ae',
    phone: '+971-55-987-6543',
    role: 'agent',
    status: 'active',
    territories: ['Downtown Dubai', 'Business Bay'],
    propertiesManaged: 12,
    dealsThisMonth: 2,
    commissionEarned: 32000,
    joinedDate: '2023-09-01'
  },
  {
    id: '3',
    name: 'Ahmed Hassan',
    email: 'ahmed@kribrealestate.ae',
    phone: '+971-56-456-7890',
    role: 'manager',
    status: 'active',
    territories: ['Dubai Marina', 'Downtown Dubai', 'Business Bay'],
    propertiesManaged: 8,
    dealsThisMonth: 1,
    commissionEarned: 28000,
    joinedDate: '2023-03-10'
  }
]

const getRoleColor = (role: string) => {
  switch (role) {
    case 'manager': return 'bg-purple-100 text-purple-800'
    case 'senior_agent': return 'bg-blue-100 text-blue-800'
    case 'agent': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800'
    case 'inactive': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function AgentManagement() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true)
        // TODO: Replace with real API call to fetch agents
        // const data = await agentsApi.getAll()
        // setAgents(data)
        
        // For now, show empty state to indicate real backend integration
        setAgents([])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch agents')
      } finally {
        setLoading(false)
      }
    }
    fetchAgents()
  }, [])

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.territories.some(territory => 
      territory.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const totalCommission = agents.reduce((acc, agent) => acc + agent.commissionEarned, 0)
  const totalDeals = agents.reduce((acc, agent) => acc + agent.dealsThisMonth, 0)
  const totalProperties = agents.reduce((acc, agent) => acc + agent.propertiesManaged, 0)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
          <p className="text-muted-foreground">Manage your real estate agents and team performance</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties Managed</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground">Across all agents</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeals}</div>
            <p className="text-xs text-muted-foreground">Team performance</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <div className="text-sm text-muted-foreground">AED</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalCommission / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAgents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{agent.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {agent.email}
                      </span>
                      <span className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {agent.phone}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-500">Territories:</span>
                      {agent.territories.map((territory, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {territory}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-semibold">{agent.propertiesManaged}</p>
                        <p className="text-gray-500">Properties</p>
                      </div>
                      <div>
                        <p className="font-semibold">{agent.dealsThisMonth}</p>
                        <p className="text-gray-500">Deals</p>
                      </div>
                      <div>
                        <p className="font-semibold">AED {(agent.commissionEarned / 1000).toFixed(0)}K</p>
                        <p className="text-gray-500">Commission</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Badge className={getRoleColor(agent.role)}>
                      {agent.role.replace('_', ' ')}
                    </Badge>
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
