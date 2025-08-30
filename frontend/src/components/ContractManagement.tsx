import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { FileText, Download, Send, Clock, CheckCircle, Plus, Search, AlertCircle } from "lucide-react"
import { Input } from "./ui/input"
import { leasesApi, LeaseAgreement } from "../../services/longTermRentalApi"





const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800'
    case 'sent_for_signature': return 'bg-blue-100 text-blue-800'
    case 'partially_signed': return 'bg-yellow-100 text-yellow-800'
    case 'fully_executed': return 'bg-green-100 text-green-800'
    case 'active': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'draft': return <FileText className="h-4 w-4" />
    case 'sent_for_signature': return <Send className="h-4 w-4" />
    case 'partially_signed': return <Clock className="h-4 w-4" />
    case 'fully_executed': return <CheckCircle className="h-4 w-4" />
    case 'active': return <CheckCircle className="h-4 w-4" />
    default: return <FileText className="h-4 w-4" />
  }
}

export function ContractManagement() {
  const [contracts, setContracts] = useState<LeaseAgreement[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch real lease agreements from API
        const data = await leasesApi.getLeases()
        setContracts(data)
      } catch (err) {
        console.error('Failed to fetch lease agreements:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch contracts')
      } finally {
        setLoading(false)
      }
    }
    fetchContracts()
  }, [])

  const filteredContracts = contracts.filter(contract =>
    (contract.tenant_name && contract.tenant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contract.property_id && contract.property_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contract.landlord_name && contract.landlord_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lease Contracts</h2>
          <p className="text-muted-foreground">Manage lease agreements and contracts</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Contract
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search contracts..."
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
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.length}</div>
            <p className="text-xs text-muted-foreground">All lease agreements</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Signature</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contracts.filter(c => c.status === 'sent_for_signature' || c.status === 'partially_signed').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting signatures</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leases</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contracts.filter(c => c.status === 'active' || c.status === 'fully_executed').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <div className="text-sm text-muted-foreground">AED</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(contracts.reduce((acc, contract) => acc + (contract.annual_rent || 0), 0) / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground">Annual rent value</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-krib-accent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading contracts...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-muted-foreground text-sm mt-2">Please try again later</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contracts List */}
      {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Lease Agreements</CardTitle>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No contracts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by creating your first lease agreement
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Contract
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredContracts.map((contract) => (
              <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                    {getStatusIcon(contract.status)}
                  </div>
                  <div>
                    <h4 className="font-semibold">Lease #{contract.lease_number || contract.property_id}</h4>
                    <p className="text-sm text-gray-600">
                      Tenant: {contract.tenant_name || 'N/A'} | Landlord: {contract.landlord_name || 'N/A'}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Lease: {contract.lease_start_date ? new Date(contract.lease_start_date).toLocaleDateString() : 'N/A'} to {contract.lease_end_date ? new Date(contract.lease_end_date).toLocaleDateString() : 'N/A'}</span>
                      <Badge variant="outline">{contract.contract_type || 'Residential'}</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold">AED {(contract.annual_rent || 0).toLocaleString()}/year</p>
                    <p className="text-sm text-gray-500">
                      Security: AED {(contract.security_deposit || 0).toLocaleString()}
                    </p>
                  </div>
                  
                  <Badge className={getStatusColor(contract.status)}>
                    {contract.status.replace('_', ' ')}
                  </Badge>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    
                    {contract.status === 'draft' && (
                      <Button size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
