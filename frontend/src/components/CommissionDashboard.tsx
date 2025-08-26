import { useState, useEffect } from "react"
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
      // TODO: Replace with real API call
      const mockCommissions: CommissionData[] = [
        {
          id: "c1",
          propertyId: "p1",
          propertyTitle: "Marina View Apartment - 2BR",
          agentId: "agent-1",
          agentName: "Ahmed Al Rashid",
          annual_rent: 85000,
          commission_rate: 2.5,
          commission_amount: 2125,
          status: 'earned',
          earned_date: '2024-01-15',
          lease_start_date: '2024-01-15',
          lease_end_date: '2025-01-14'
        },
        {
          id: "c2",
          propertyId: "p2",
          propertyTitle: "Downtown Dubai Studio",
          agentId: "agent-2",
          agentName: "Sara Al Maktoum",
          annual_rent: 65000,
          commission_rate: 3.0,
          commission_amount: 1950,
          status: 'pending',
          lease_start_date: '2024-02-01',
          lease_end_date: '2025-01-31'
        },
        {
          id: "c3",
          propertyId: "p3",
          propertyTitle: "Business Bay - 1BR",
          agentId: "agent-1",
          agentName: "Ahmed Al Rashid",
          annual_rent: 75000,
          commission_rate: 2.5,
          commission_amount: 1875,
          status: 'paid',
          earned_date: '2024-01-10',
          paid_date: '2024-01-25',
          lease_start_date: '2024-01-10',
          lease_end_date: '2025-01-09'
        }
      ]

      setCommissions(mockCommissions)

      // Calculate summary
      const earned = mockCommissions.filter(c => c.status === 'earned').reduce((sum, c) => sum + c.commission_amount, 0)
      const pending = mockCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0)
      const paid = mockCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0)

      setSummary({
        totalEarned: earned,
        totalPending: pending,
        totalPaid: paid,
        monthlyProjection: (earned + pending) * 1.2, // Projected growth
        averageCommissionRate: 2.7,
        topAgent: { name: "Ahmed Al Rashid", amount: 4000 },
        bestProperty: { title: "Marina View Apartment", amount: 2125 }
      })

    } catch (error) {
      console.error('Failed to load commission data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'earned': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'  
      case 'paid': return 'bg-blue-100 text-blue-800'
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalEarned)}</div>
            <p className="text-xs text-muted-foreground">Ready to collect</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.totalPending)}</div>
            <p className="text-xs text-muted-foreground">Awaiting lease completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalPaid)}</div>
            <p className="text-xs text-muted-foreground">Successfully collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Projection</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.monthlyProjection)}</div>
            <p className="text-xs text-muted-foreground">Based on current pipeline</p>
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
