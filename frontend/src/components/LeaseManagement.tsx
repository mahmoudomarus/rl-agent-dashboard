import { useState, useEffect } from "react"
import { leasesApi, analyticsApi, agentsApi, agenciesApi, type LeaseAgreement } from "../../services/longTermRentalApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { 
  FileText, 
  Edit, 
  Eye, 
  Send, 
  Check, 
  Clock, 
  AlertCircle,
  Download,
  Calendar,
  User,
  Building2,
  DollarSign,
  FileCheck,
  Plus,
  Search,
  Filter
} from "lucide-react"

// LeaseAgreement interface is imported from the API service

interface Property {
  id: string
  title: string
  address: string
  city: string
  property_type: string
  bedrooms: number
  bathrooms: number
  annual_rent: number
}

interface Agent {
  id: string
  name: string
  email: string
  specializations: string[]
}

export function LeaseManagement() {
  const [leases, setLeases] = useState<LeaseAgreement[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLease, setSelectedLease] = useState<LeaseAgreement | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [agentFilter, setAgentFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadLeases()
    loadProperties()
    loadAgents()
  }, [])

  // Reload leases when filters change
  useEffect(() => {
    loadLeases()
  }, [statusFilter, agentFilter])

  const loadLeases = async () => {
    try {
      setLoading(true)
      
      // Build filters based on current filter state
      const filters: any = {}
      if (statusFilter !== "all") filters.status_filter = statusFilter
      if (agentFilter !== "all") filters.agent_id = agentFilter
      
      // Call real API
      const leaseData = await leasesApi.getLeases(filters)
      setLeases(leaseData)
    } catch (error) {
      console.error('Failed to load leases:', error)
      // On error, show empty state but don't crash
      setLeases([])
    } finally {
      setLoading(false)
    }
  }

  const loadProperties = async () => {
    try {
      // Load properties from context or API
      // Note: Properties are typically loaded from AppContext in PropertyList
      // For lease management, we'll set empty array as properties are not critical here
      setProperties([])
    } catch (error) {
      console.error('Failed to load properties:', error)
      setProperties([])
    }
  }

  const loadAgents = async () => {
    try {
      // Get current agency first
      const agency = await agenciesApi.getCurrent()
      
      // Load real agents from API
      const agentData = await agentsApi.getAll(agency.id)
      
      // Transform to local Agent interface
      const transformedAgents: Agent[] = agentData.map(agent => ({
        id: agent.id,
        name: agent.name,
        email: agent.email,
        specializations: agent.specializations || []
      }))
      
      setAgents(transformedAgents)
    } catch (error) {
      console.error('Failed to load agents:', error)
      setAgents([])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'sent_for_signature': return 'bg-blue-100 text-blue-800'
      case 'partially_signed': return 'bg-yellow-100 text-yellow-800'
      case 'fully_executed': return 'bg-green-100 text-green-800'
      case 'active': return 'bg-emerald-100 text-emerald-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'terminated': return 'bg-orange-100 text-orange-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCommissionStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'earned': return 'bg-green-100 text-green-800'
      case 'invoiced': return 'bg-blue-100 text-blue-800'
      case 'paid': return 'bg-emerald-100 text-emerald-800'
      case 'disputed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSignatureProgress = (lease: LeaseAgreement) => {
    let completed = 0
    let total = 3 // landlord, tenant, witness
    
    if (lease.landlord_signature_status === 'signed') completed++
    if (lease.tenant_signature_status === 'signed') completed++
    if (lease.witness_signature_status === 'signed' || lease.witness_signature_status === 'not_required') completed++
    
    return (completed / total) * 100
  }

  const handleViewLease = (lease: LeaseAgreement) => {
    setSelectedLease(lease)
    setIsViewModalOpen(true)
  }

  const handleSendForSignature = async (leaseId: string) => {
    try {
      // Call real API to send lease for signature
      await leasesApi.sendForSignature(leaseId)
      
      // Refresh lease data to show updated status
      await loadLeases()
      
      // Show success message (you can add a toast notification here)
      console.log('Lease sent for signature successfully')
    } catch (error) {
      console.error('Failed to send for signature:', error)
      // Show error message (you can add error handling UI here)
    }
  }

  const filteredLeases = leases.filter(lease => {
    const matchesStatus = statusFilter === "all" || lease.status === statusFilter
    const matchesAgent = agentFilter === "all" || lease.agent_id === agentFilter
    const matchesSearch = searchTerm === "" || 
      lease.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.landlord_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.lease_number.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesAgent && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-krib-accent"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lease Management</h1>
          <p className="text-gray-600">Manage lease agreements, signatures, and documentation</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-krib-accent hover:bg-krib-accent/90 text-krib-black"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Lease
        </Button>
      </div>

      {/* Stats Cards - Krib Lime & Black Theme */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Total Leases</CardTitle>
            <FileText className="h-5 w-5 text-gray-700 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{leases.length}</div>
            <p className="text-xs text-gray-600 opacity-80">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="stats-card-dark">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-lime-400">Active Leases</CardTitle>
            <Check className="h-5 w-5 text-lime-400 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-lime-400">
              {leases.filter(l => l.status === 'fully_executed' || l.status === 'active').length}
            </div>
            <p className="text-xs text-lime-300 opacity-80">
              Currently active
            </p>
          </CardContent>
        </Card>
        
        <Card className="stats-card-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Pending Signatures</CardTitle>
            <Clock className="h-5 w-5 text-gray-700 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">
              {leases.filter(l => l.status === 'sent_for_signature' || l.status === 'partially_signed').length}
            </div>
            <p className="text-xs text-gray-600 opacity-80">
              Awaiting signatures
            </p>
          </CardContent>
        </Card>
        
        <Card className="stats-card-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Commission Earned</CardTitle>
            <DollarSign className="h-5 w-5 text-gray-700 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">
              AED {leases.filter(l => l.commission_status === 'earned' || l.commission_status === 'paid')
                .reduce((sum, l) => sum + l.broker_commission, 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 opacity-80">
              Total earned commission
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by tenant, landlord, or lease number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent_for_signature">Sent for Signature</SelectItem>
            <SelectItem value="partially_signed">Partially Signed</SelectItem>
            <SelectItem value="fully_executed">Fully Executed</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lease Agreements</CardTitle>
          <CardDescription>
            Manage and track all lease agreements and their signing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLeases.map((lease) => (
              <div key={lease.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{lease.lease_number}</h3>
                        <p className="text-sm text-gray-600">
                          {lease.tenant_name} → {lease.landlord_name}
                        </p>
                      </div>
                      <Badge className={getStatusColor(lease.status)}>
                        {lease.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getCommissionStatusColor(lease.commission_status)}>
                        Commission: {lease.commission_status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Term:</span> {new Date(lease.lease_start_date).toLocaleDateString()} - {new Date(lease.lease_end_date).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Rent:</span> AED {lease.annual_rent.toLocaleString()}/year
                      </div>
                      <div>
                        <span className="font-medium">Deposit:</span> AED {lease.security_deposit.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Commission:</span> AED {lease.broker_commission.toLocaleString()}
                      </div>
                    </div>

                    {/* Signature Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Signature Progress</span>
                        <span>{Math.round(getSignatureProgress(lease))}% Complete</span>
                      </div>
                      <Progress value={getSignatureProgress(lease)} className="h-2" />
                      <div className="flex items-center gap-4 mt-1 text-xs">
                        <span className={`flex items-center gap-1 ${lease.landlord_signature_status === 'signed' ? 'text-green-600' : 'text-gray-500'}`}>
                          {lease.landlord_signature_status === 'signed' ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          Landlord
                        </span>
                        <span className={`flex items-center gap-1 ${lease.tenant_signature_status === 'signed' ? 'text-green-600' : 'text-gray-500'}`}>
                          {lease.tenant_signature_status === 'signed' ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          Tenant
                        </span>
                        <span className={`flex items-center gap-1 ${lease.witness_signature_status === 'signed' ? 'text-green-600' : 'text-gray-500'}`}>
                          {lease.witness_signature_status === 'signed' ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          Witness
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewLease(lease)}
                      className="h-8"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                    {lease.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendForSignature(lease.id)}
                        className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send for Signature
                      </Button>
                    )}
                    
                    {lease.signed_contract_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(lease.signed_contract_url, '_blank')}
                        className="h-8 text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredLeases.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No lease agreements found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Lease Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lease Agreement Details</DialogTitle>
            <DialogDescription>
              Complete information for lease agreement {selectedLease?.lease_number}
            </DialogDescription>
          </DialogHeader>
          {selectedLease && (
            <div className="space-y-6">
              {/* Status and Actions */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(selectedLease.status)}>
                    {selectedLease.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge className={getCommissionStatusColor(selectedLease.commission_status)}>
                    Commission: {selectedLease.commission_status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {selectedLease.status === 'draft' && (
                    <Button 
                      size="sm"
                      onClick={() => handleSendForSignature(selectedLease.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Send for Signature
                    </Button>
                  )}
                  {selectedLease.signed_contract_url && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(selectedLease.signed_contract_url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download Contract
                    </Button>
                  )}
                </div>
              </div>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="signatures">Signatures</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Lease Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Lease Number</Label>
                          <p className="text-sm text-gray-600">{selectedLease.lease_number}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Contract Type</Label>
                          <p className="text-sm text-gray-600 capitalize">{selectedLease.contract_type}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Lease Term</Label>
                          <p className="text-sm text-gray-600">
                            {new Date(selectedLease.lease_start_date).toLocaleDateString()} - {new Date(selectedLease.lease_end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Auto Renewal</Label>
                          <p className="text-sm text-gray-600">{selectedLease.auto_renewal ? 'Yes' : 'No'}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Parties</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Landlord</Label>
                          <p className="text-sm text-gray-600">{selectedLease.landlord_name}</p>
                          <p className="text-xs text-gray-500">{selectedLease.landlord_email}</p>
                          <p className="text-xs text-gray-500">{selectedLease.landlord_phone}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Tenant</Label>
                          <p className="text-sm text-gray-600">{selectedLease.tenant_name}</p>
                          <p className="text-xs text-gray-500">{selectedLease.tenant_email}</p>
                          <p className="text-xs text-gray-500">{selectedLease.tenant_phone}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Financial Terms</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <Label className="text-sm font-medium">Annual Rent</Label>
                          <p className="text-lg font-semibold text-green-600">
                            AED {selectedLease.annual_rent.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Security Deposit</Label>
                          <p className="text-lg font-semibold">
                            AED {selectedLease.security_deposit.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Broker Commission</Label>
                          <p className="text-lg font-semibold text-blue-600">
                            AED {selectedLease.broker_commission.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Payment Schedule</Label>
                          <p className="text-sm text-gray-600 capitalize">{selectedLease.payment_schedule.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Payment Method</Label>
                          <p className="text-sm text-gray-600 capitalize">{selectedLease.payment_method.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Service Charges</Label>
                          <p className="text-sm text-gray-600">AED {selectedLease.service_charges_annual.toLocaleString()}/year</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="signatures" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Signature Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${selectedLease.landlord_signature_status === 'signed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div>
                              <p className="font-medium">Landlord Signature</p>
                              <p className="text-sm text-gray-600">{selectedLease.landlord_name}</p>
                            </div>
                          </div>
                          <Badge className={selectedLease.landlord_signature_status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {selectedLease.landlord_signature_status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${selectedLease.tenant_signature_status === 'signed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div>
                              <p className="font-medium">Tenant Signature</p>
                              <p className="text-sm text-gray-600">{selectedLease.tenant_name}</p>
                            </div>
                          </div>
                          <Badge className={selectedLease.tenant_signature_status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {selectedLease.tenant_signature_status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${selectedLease.witness_signature_status === 'signed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div>
                              <p className="font-medium">Witness Signature</p>
                              <p className="text-sm text-gray-600">Agency Representative</p>
                            </div>
                          </div>
                          <Badge className={selectedLease.witness_signature_status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {selectedLease.witness_signature_status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>

                        {selectedLease.execution_date && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">
                              <strong>Fully Executed:</strong> {new Date(selectedLease.execution_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Legal Compliance & Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium">RERA Permit</Label>
                          <p className="text-sm text-gray-600">{selectedLease.rera_permit_number || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Ejari Registration</Label>
                          <p className="text-sm text-gray-600">{selectedLease.ejari_registration_number || 'Pending'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Municipality Approval</Label>
                          <Badge className={selectedLease.municipality_approval ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {selectedLease.municipality_approval ? 'Approved' : 'Pending'}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">DocuSign Envelope</Label>
                          <p className="text-sm text-gray-600">{selectedLease.docusign_envelope_id || 'Not created'}</p>
                        </div>
                      </div>

                      {selectedLease.signed_contract_url && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-blue-900">Signed Contract Available</p>
                              <p className="text-sm text-blue-700">Fully executed lease agreement</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => window.open(selectedLease.signed_contract_url, '_blank')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Lease Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Lease Agreement</DialogTitle>
            <DialogDescription>
              Create a new lease agreement from an approved application or manually
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* TODO: Implement lease creation form */}
            <p className="text-center text-gray-500 py-8">
              Lease creation form will be implemented with property selection, tenant information, and lease terms.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-krib-accent hover:bg-krib-accent/90 text-krib-black">
                Create Lease
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
