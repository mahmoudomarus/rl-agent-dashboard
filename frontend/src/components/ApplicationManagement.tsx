import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { ClipboardList, Search, Filter, Eye, Check, X, Clock, AlertCircle } from "lucide-react"
import { applicationsApi, TenantApplication } from "../../services/longTermRentalApi"

const getStatusColor = (status: string) => {
  switch (status) {
    case 'submitted': return 'bg-blue-100 text-blue-800'
    case 'documents_pending': return 'bg-orange-100 text-orange-800'
    case 'under_review': return 'bg-yellow-100 text-yellow-800'
    case 'credit_check': return 'bg-purple-100 text-purple-800'
    case 'approved': return 'bg-green-100 text-green-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    case 'withdrawn': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'submitted': return <ClipboardList className="h-4 w-4" />
    case 'documents_pending': return <AlertCircle className="h-4 w-4" />
    case 'under_review': return <Clock className="h-4 w-4" />
    case 'credit_check': return <Search className="h-4 w-4" />
    case 'approved': return <Check className="h-4 w-4" />
    case 'rejected': return <X className="h-4 w-4" />
    case 'withdrawn': return <X className="h-4 w-4" />
    default: return <ClipboardList className="h-4 w-4" />
  }
}

export function ApplicationManagement() {
  const [applications, setApplications] = useState<TenantApplication[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch applications on component mount
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        const data = await applicationsApi.getAll()
        setApplications(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch applications')
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  const filteredApplications = applications.filter(app =>
    app.primary_applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.primary_applicant_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading applications...</p>
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tenant Applications</h2>
          <p className="text-muted-foreground">Manage and review rental applications</p>
        </div>
        <Button>
          <Filter className="h-4 w-4 mr-2" />
          Filter Applications
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Statistics Cards - Krib Lime & Black Theme */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Total Applications</CardTitle>
            <ClipboardList className="h-5 w-5 text-gray-700 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{applications.length}</div>
            <p className="text-xs text-gray-600 opacity-80">All submissions</p>
          </CardContent>
        </Card>
        
        <Card className="stats-card-dark">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-lime-400">Under Review</CardTitle>
            <Clock className="h-5 w-5 text-lime-400 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-lime-400">
              {applications.filter(a => a.status === 'under_review').length}
            </div>
            <p className="text-xs text-lime-300 opacity-80">Awaiting decision</p>
          </CardContent>
        </Card>
        
        <Card className="stats-card-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Approved</CardTitle>
            <Check className="h-5 w-5 text-gray-700 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">
              {applications.filter(a => a.status === 'approved').length}
            </div>
            <p className="text-xs text-gray-600 opacity-80">Ready for lease</p>
          </CardContent>
        </Card>
        
        <Card className="stats-card-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Avg. Budget</CardTitle>
            <div className="text-sm text-gray-700 opacity-90">AED</div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">
              {applications.length > 0 
                ? Math.round(applications.reduce((acc, app) => acc + app.maximum_budget, 0) / applications.length).toLocaleString()
                : '0'
              }
            </div>
            <p className="text-xs text-gray-600 opacity-80">Monthly budget</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'No applications match your search criteria.' : 'No tenant applications have been submitted yet.'}
                </p>
              </div>
            ) : (
              filteredApplications.map((application) => (
                <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      {getStatusIcon(application.status)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{application.primary_applicant_name}</h4>
                      <p className="text-sm text-gray-600">{application.primary_applicant_email}</p>
                      <p className="text-sm text-gray-500">Application #{application.application_number}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">AED {application.maximum_budget.toLocaleString()}/mo</p>
                      <p className="text-sm text-gray-500">Move-in: {new Date(application.desired_move_in_date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">{application.lease_duration_months} month lease</p>
                    </div>
                    
                    <Badge className={getStatusColor(application.status)}>
                      {application.status.replace('_', ' ')}
                    </Badge>
                    
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
