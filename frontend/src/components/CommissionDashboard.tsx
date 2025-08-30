import { useState, useEffect } from "react"
import { leasesApi, analyticsApi } from "../../services/longTermRentalApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Target,
  Award,
  BarChart3,
  Calculator,
  PieChart,
  Download,
  Filter,
  Clock
} from "lucide-react"

interface CommissionData {
  id: string
  propertyId: string
  propertyTitle: string
  agentId: string
  agentName: string
  annual_rent: number
  commission_rate: number
  commission_amount: number
  status: 'pending' | 'earned' | 'paid'
  earned_date?: string
  paid_date?: string
  lease_start_date: string
  lease_end_date: string
}

interface CommissionSummary {
  totalEarned: number
  totalPending: number
  totalPaid: number
  monthlyProjection: number
  averageCommissionRate: number
  topAgent: { name: string; amount: number }
  bestProperty: { title: string; amount: number }
}

export function CommissionDashboard() {
  const [commissions, setCommissions] = useState<CommissionData[]>([])
  const [summary, setSummary] = useState<CommissionSummary>({
    totalEarned: 0,
    totalPending: 0,
    totalPaid: 0,
    monthlyProjection: 0,
    averageCommissionRate: 0,
    topAgent: { name: '', amount: 0 },
    bestProperty: { title: '', amount: 0 }
  })
  const [selectedPeriod, setSelectedPeriod] = useState("this_month")
  const [selectedAgent, setSelectedAgent] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCommissionData()
  }, [selectedPeriod, selectedAgent])

  const loadCommissionData = async () => {
    try {
      setLoading(true)
      
      // Load real lease agreements and commission analytics
      const [leases, commissionAnalytics] = await Promise.all([
        leasesApi.getLeases(),
        analyticsApi.getCommissionAnalytics().catch(() => ({
          total_earned: 0,
          pending_commission: 0,
          paid_commission: 0,
          monthly_projection: 0,
          commission_breakdown: []
        }))
      ])

      // Transform leases to commission format
      const commissionData: CommissionData[] = leases
        .filter(lease => lease.broker_commission > 0)
        .map(lease => ({
          id: lease.id,
          propertyId: lease.property_id,
          propertyTitle: `Lease #${lease.lease_number}`,
          agentId: lease.agent_id,
          agentName: 'Agent', // Would need to resolve from agent data
          annual_rent: lease.annual_rent,
          commission_rate: (lease.broker_commission / lease.annual_rent) * 100,
          commission_amount: lease.broker_commission,
          status: lease.commission_status === 'paid' ? 'paid' : 
                  lease.status === 'fully_executed' ? 'earned' : 'pending',
          earned_date: lease.execution_date,
          paid_date: lease.commission_paid_date,
          lease_start_date: lease.lease_start_date,
          lease_end_date: lease.lease_end_date
        }))

      setCommissions(commissionData)

      // Calculate summary from real data
      const earned = commissionData.filter(c => c.status === 'earned').reduce((sum, c) => sum + c.commission_amount, 0)
      const pending = commissionData.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0)
      const paid = commissionData.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0)

      // Calculate averages
      const avgRate = commissionData.length > 0 
        ? commissionData.reduce((sum, c) => sum + c.commission_rate, 0) / commissionData.length
        : 0

      // Find top performers
      const agentCommissions = new Map()
      commissionData.forEach(c => {
        const current = agentCommissions.get(c.agentName) || 0
        agentCommissions.set(c.agentName, current + c.commission_amount)
      })
      
      const topAgent = Array.from(agentCommissions.entries())
        .sort((a, b) => b[1] - a[1])[0] || ['No agent', 0]

      const bestProperty = commissionData
        .sort((a, b) => b.commission_amount - a.commission_amount)[0]

      setSummary({
        totalEarned: earned,
        totalPending: pending,
        totalPaid: paid,
        monthlyProjection: commissionAnalytics.monthly_projection || (earned + pending),
        averageCommissionRate: avgRate,
        topAgent: { name: topAgent[0], amount: topAgent[1] },
        bestProperty: { 
          title: bestProperty?.propertyTitle || 'No properties', 
          amount: bestProperty?.commission_amount || 0 
        }
      })

    } catch (error) {
      console.error('Failed to load commission data:', error)
      // Set empty state on error
      setCommissions([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'earned': return 'badge-primary'
      case 'pending': return 'bg-gray-100 text-gray-800'  
      case 'paid': return 'badge-primary'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => `AED ${amount.toLocaleString()}`

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Tracking</h1>
          <p className="text-gray-600">Monitor earnings, track payments, and analyze performance</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Total Earned</CardTitle>
            <DollarSign className="h-5 w-5 text-gray-700 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{formatCurrency(summary.totalEarned)}</div>
            <p className="text-xs text-gray-600 opacity-80">Ready to collect</p>
          </CardContent>
        </Card>

        <Card className="stats-card-dark">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-lime-400">Pending</CardTitle>
            <Clock className="h-5 w-5 text-lime-400 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-lime-400">{formatCurrency(summary.totalPending)}</div>
            <p className="text-xs text-lime-300 opacity-80">Awaiting lease completion</p>
          </CardContent>
        </Card>

        <Card className="stats-card-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Paid</CardTitle>
            <Award className="h-5 w-5 text-gray-700 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{formatCurrency(summary.totalPaid)}</div>
            <p className="text-xs text-gray-600 opacity-80">Successfully collected</p>
          </CardContent>
        </Card>

        <Card className="stats-card-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Monthly Projection</CardTitle>
            <TrendingUp className="h-5 w-5 text-gray-700 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{formatCurrency(summary.monthlyProjection)}</div>
            <p className="text-xs text-gray-600 opacity-80">Based on current pipeline</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Commissions</TabsTrigger>
          <TabsTrigger value="earned">Earned</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission Details</CardTitle>
              <CardDescription>Track all commission transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{commission.propertyTitle}</h4>
                        <Badge className={getStatusColor(commission.status)}>
                          {commission.status.charAt(0).toUpperCase() + commission.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Agent: {commission.agentName} • Rate: {commission.commission_rate}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Lease: {commission.lease_start_date} to {commission.lease_end_date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(commission.commission_amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        from {formatCurrency(commission.annual_rent)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earned">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Earned Commissions</h3>
                <p className="text-gray-600">Ready for collection</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Pending Commissions</h3>
                <p className="text-gray-600">Awaiting lease completion</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Paid Commissions</h3>
                <p className="text-gray-600">Successfully collected</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
