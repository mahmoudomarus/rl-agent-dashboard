import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { FileText, Download, Send, Clock, CheckCircle, Plus, Search } from "lucide-react"
import { Input } from "./ui/input"

interface LeaseContract {
  id: string
  propertyTitle: string
  tenantName: string
  landlordName: string
  annualRent: number
  securityDeposit: number
  leaseStartDate: string
  leaseEndDate: string
  status: 'draft' | 'sent_for_signature' | 'partially_signed' | 'fully_executed' | 'active'
  signedBy: string[]
  contractType: 'residential' | 'commercial'
}

// Mock data for now
const mockContracts: LeaseContract[] = [
  {
    id: '1',
    propertyTitle: 'Luxury 2BR in Dubai Marina',
    tenantName: 'Ahmed Al Mansouri',
    landlordName: 'Khalid Properties LLC',
    annualRent: 85000,
    securityDeposit: 8500,
    leaseStartDate: '2024-02-01',
    leaseEndDate: '2025-01-31',
    status: 'sent_for_signature',
    signedBy: [],
    contractType: 'residential'
  },
  {
    id: '2',
    propertyTitle: 'Modern 3BR in Downtown',
    tenantName: 'Sarah Johnson',
    landlordName: 'Emirates Real Estate',
    annualRent: 120000,
    securityDeposit: 12000,
    leaseStartDate: '2024-02-15',
    leaseEndDate: '2025-02-14',
    status: 'fully_executed',
    signedBy: ['tenant', 'landlord'],
    contractType: 'residential'
  }
]

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
  const [contracts] = useState<LeaseContract[]>(mockContracts)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredContracts = contracts.filter(contract =>
    contract.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.landlordName.toLowerCase().includes(searchTerm.toLowerCase())
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
              {(contracts.reduce((acc, contract) => acc + contract.annualRent, 0) / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground">Annual rent value</p>
          </CardContent>
        </Card>
      </div>

      {/* Contracts List */}
      <Card>
        <CardHeader>
          <CardTitle>Lease Agreements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredContracts.map((contract) => (
              <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                    {getStatusIcon(contract.status)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{contract.propertyTitle}</h4>
                    <p className="text-sm text-gray-600">
                      Tenant: {contract.tenantName} | Landlord: {contract.landlordName}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Lease: {contract.leaseStartDate} to {contract.leaseEndDate}</span>
                      <Badge variant="outline">{contract.contractType}</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold">AED {contract.annualRent.toLocaleString()}/year</p>
                    <p className="text-sm text-gray-500">
                      Security: AED {contract.securityDeposit.toLocaleString()}
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
        </CardContent>
      </Card>
    </div>
  )
}
