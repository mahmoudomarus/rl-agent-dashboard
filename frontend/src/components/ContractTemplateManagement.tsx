import { useState, useEffect } from "react"
import { contractTemplatesApi, type ContractTemplate } from "../../services/longTermRentalApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Checkbox } from "./ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { 
  FileText, 
  Edit, 
  Eye, 
  Upload, 
  Download,
  Copy,
  Trash2,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Settings,
  FileCheck,
  Star,
  BarChart3,
  Calendar
} from "lucide-react"

// ContractTemplate interface is imported from the API service

interface TemplateStats {
  total_templates: number
  active_templates: number
  pending_approval: number
  total_usage: number
  average_success_rate: number
}

export function ContractTemplateManagement() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [stats, setStats] = useState<TemplateStats>({
    total_templates: 0,
    active_templates: 0,
    pending_approval: 0,
    total_usage: 0,
    average_success_rate: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  
  // Create form state
  const [newTemplate, setNewTemplate] = useState({
    template_name: "",
    description: "",
    property_type: "",
    contract_language: "en",
    emirates: "",
    template_content: "",
    rera_compliant: false,
    dubai_land_department_approved: false,
    municipality_approved: false,
    legal_reviewer_name: "",
    is_default: false
  })
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("all")
  const [complianceFilter, setComplianceFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadTemplates()
    loadStats()
  }, [])

  // Reload templates when filters change
  useEffect(() => {
    loadTemplates()
  }, [statusFilter, propertyTypeFilter, complianceFilter])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      
      // Build filters based on current filter state
      const filters: any = {}
      if (statusFilter !== "all") filters.status_filter = statusFilter
      if (propertyTypeFilter !== "all") filters.property_type = propertyTypeFilter
      if (complianceFilter === "compliant") filters.rera_compliant = true
      if (complianceFilter === "non-compliant") filters.rera_compliant = false
      
      // Call real API
      const templateData = await contractTemplatesApi.getTemplates(filters)
      setTemplates(templateData)
    } catch (error) {
      console.error('Failed to load templates:', error)
      // On error, show empty state but don't crash
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // TODO: Replace with actual API call to /api/contract-templates/stats
      setStats({
        total_templates: 12,
        active_templates: 8,
        pending_approval: 2,
        total_usage: 156,
        average_success_rate: 89.4
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'deprecated': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getComplianceScore = (template: ContractTemplate) => {
    let score = 0
    if (template.rera_compliant) score += 33.33
    if (template.dubai_land_department_approved) score += 33.33
    if (template.municipality_approved) score += 33.34
    return Math.round(score)
  }

  const handleCreateTemplate = async () => {
    try {
      // Call real API to create template
      await contractTemplatesApi.createTemplate({
        ...newTemplate,
        template_content: newTemplate.template_content ? { content: newTemplate.template_content } : {}
      })
      
      // Refresh templates
      await loadTemplates()
      await loadStats()
      
      // Close modal and reset form
      setIsCreateModalOpen(false)
      setNewTemplate({
        template_name: "",
        description: "",
        property_type: "",
        contract_language: "en",
        emirates: "",
        template_content: "",
        rera_compliant: false,
        dubai_land_department_approved: false,
        municipality_approved: false,
        legal_reviewer_name: "",
        is_default: false
      })
      
      console.log('Template created successfully')
    } catch (error) {
      console.error('Failed to create template:', error)
    }
  }

  const handleDuplicateTemplate = async (templateId: string, newName: string) => {
    try {
      // Call real API to duplicate template
      await contractTemplatesApi.duplicateTemplate(templateId, newName)
      await loadTemplates() // Refresh data
      await loadStats()
      console.log('Template duplicated successfully')
    } catch (error) {
      console.error('Failed to duplicate template:', error)
    }
  }

  const handleActivateTemplate = async (templateId: string) => {
    try {
      // Call real API to activate template
      await contractTemplatesApi.activateTemplate(templateId)
      await loadTemplates() // Refresh data
      await loadStats()
      console.log('Template activated successfully')
    } catch (error) {
      console.error('Failed to activate template:', error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      try {
        // Call real API to delete template
        await contractTemplatesApi.deleteTemplate(templateId)
        await loadTemplates() // Refresh data
        await loadStats()
        console.log('Template deleted successfully')
      } catch (error) {
        console.error('Failed to delete template:', error)
      }
    }
  }

  const handleUploadTemplate = async (file: File) => {
    try {
      // Call real API to upload template
      const templateName = file.name.split('.')[0]
      await contractTemplatesApi.uploadTemplate(file, templateName)
      
      await loadTemplates() // Refresh data
      await loadStats()
      setIsUploadModalOpen(false)
      console.log('Template uploaded successfully')
    } catch (error) {
      console.error('Failed to upload template:', error)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesStatus = statusFilter === "all" || template.status === statusFilter
    const matchesPropertyType = propertyTypeFilter === "all" || template.property_type === propertyTypeFilter
    const matchesCompliance = complianceFilter === "all" || 
      (complianceFilter === "compliant" && template.rera_compliant) ||
      (complianceFilter === "non-compliant" && !template.rera_compliant)
    const matchesSearch = searchTerm === "" || 
      template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesPropertyType && matchesCompliance && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-krib-accent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contract Templates</h1>
          <p className="text-gray-600">Manage legal-compliant lease agreement templates</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Template
          </Button>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-krib-accent hover:bg-krib-accent/90 text-krib-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_templates}</div>
            <p className="text-xs text-muted-foreground">
              +2 this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_templates}</div>
            <p className="text-xs text-muted-foreground">
              Ready for use
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_approval}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting legal review
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_usage}</div>
            <p className="text-xs text-muted-foreground">
              Across all templates
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Star className="h-4 w-4 text-krib-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.average_success_rate}%</div>
            <p className="text-xs text-muted-foreground">
              Average completion rate
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
              placeholder="Search templates..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="mixed_use">Mixed Use</SelectItem>
          </SelectContent>
        </Select>

        <Select value={complianceFilter} onValueChange={setComplianceFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by compliance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Compliance</SelectItem>
            <SelectItem value="compliant">RERA Compliant</SelectItem>
            <SelectItem value="non-compliant">Non-Compliant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    {template.is_default && (
                      <Star className="h-4 w-4 text-krib-accent fill-current" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(template.status)}>
                      {template.status.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      v{template.template_version}
                    </Badge>
                    {template.property_type && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {template.property_type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Compliance Score */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">Legal Compliance</span>
                  <span>{getComplianceScore(template)}%</span>
                </div>
                <Progress value={getComplianceScore(template)} className="h-2" />
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className={`flex items-center gap-1 ${template.rera_compliant ? 'text-green-600' : 'text-gray-400'}`}>
                    {template.rera_compliant ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    RERA
                  </span>
                  <span className={`flex items-center gap-1 ${template.dubai_land_department_approved ? 'text-green-600' : 'text-gray-400'}`}>
                    {template.dubai_land_department_approved ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    DLD
                  </span>
                  <span className={`flex items-center gap-1 ${template.municipality_approved ? 'text-green-600' : 'text-gray-400'}`}>
                    {template.municipality_approved ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    Municipality
                  </span>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Usage Count</p>
                  <p className="font-semibold">{template.usage_count}</p>
                </div>
                <div>
                  <p className="text-gray-500">Success Rate</p>
                  <p className="font-semibold text-green-600">{template.success_rate}%</p>
                </div>
              </div>

              {/* Legal Review Info */}
              {template.legal_review_date && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <p><strong>Legal Review:</strong> {template.legal_reviewer_name}</p>
                  <p><strong>Date:</strong> {new Date(template.legal_review_date).toLocaleDateString()}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTemplate(template)
                    setIsViewModalOpen(true)
                  }}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicateTemplate(template.id, `${template.template_name} (Copy)`)}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </Button>
                
                {template.status !== 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleActivateTemplate(template.id)}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredTemplates.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No contract templates found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Contract Template</DialogTitle>
            <DialogDescription>
              Create a new legal-compliant lease agreement template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="template_name">Template Name</Label>
                <Input
                  id="template_name"
                  value={newTemplate.template_name}
                  onChange={(e) => setNewTemplate({...newTemplate, template_name: e.target.value})}
                  placeholder="e.g., Standard Residential Lease - Dubai"
                />
              </div>
              <div>
                <Label htmlFor="property_type">Property Type</Label>
                <Select 
                  value={newTemplate.property_type} 
                  onValueChange={(value) => setNewTemplate({...newTemplate, property_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="mixed_use">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                placeholder="Brief description of the template..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="contract_language">Language</Label>
                <Select 
                  value={newTemplate.contract_language} 
                  onValueChange={(value) => setNewTemplate({...newTemplate, contract_language: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="both">Bilingual (EN/AR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="emirates">Emirates</Label>
                <Select 
                  value={newTemplate.emirates} 
                  onValueChange={(value) => setNewTemplate({...newTemplate, emirates: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select emirate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dubai">Dubai</SelectItem>
                    <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                    <SelectItem value="Sharjah">Sharjah</SelectItem>
                    <SelectItem value="Ajman">Ajman</SelectItem>
                    <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                    <SelectItem value="Fujairah">Fujairah</SelectItem>
                    <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="template_content">Template Content</Label>
              <Textarea
                id="template_content"
                value={newTemplate.template_content}
                onChange={(e) => setNewTemplate({...newTemplate, template_content: e.target.value})}
                placeholder="Enter the lease agreement template content..."
                rows={8}
              />
            </div>

            <div>
              <Label htmlFor="legal_reviewer_name">Legal Reviewer</Label>
              <Input
                id="legal_reviewer_name"
                value={newTemplate.legal_reviewer_name}
                onChange={(e) => setNewTemplate({...newTemplate, legal_reviewer_name: e.target.value})}
                placeholder="e.g., Legal Counsel LLC"
              />
            </div>

            {/* Compliance Checkboxes */}
            <div className="space-y-3">
              <Label>Legal Compliance</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rera_compliant"
                    checked={newTemplate.rera_compliant}
                    onCheckedChange={(checked) => setNewTemplate({...newTemplate, rera_compliant: checked as boolean})}
                  />
                  <Label htmlFor="rera_compliant" className="text-sm">RERA Compliant</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dubai_land_department_approved"
                    checked={newTemplate.dubai_land_department_approved}
                    onCheckedChange={(checked) => setNewTemplate({...newTemplate, dubai_land_department_approved: checked as boolean})}
                  />
                  <Label htmlFor="dubai_land_department_approved" className="text-sm">Dubai Land Department Approved</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="municipality_approved"
                    checked={newTemplate.municipality_approved}
                    onCheckedChange={(checked) => setNewTemplate({...newTemplate, municipality_approved: checked as boolean})}
                  />
                  <Label htmlFor="municipality_approved" className="text-sm">Municipality Approved</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default"
                    checked={newTemplate.is_default}
                    onCheckedChange={(checked) => setNewTemplate({...newTemplate, is_default: checked as boolean})}
                  />
                  <Label htmlFor="is_default" className="text-sm">Set as Default Template</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTemplate}
                className="bg-krib-accent hover:bg-krib-accent/90 text-krib-black"
              >
                Create Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Template Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Contract Template</DialogTitle>
            <DialogDescription>
              Upload a PDF or DOCX file to create a new contract template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supported formats: PDF, DOCX (Max 10MB)
              </p>
              <Input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleUploadTemplate(file)
                  }
                }}
                className="mt-4"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Template Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.template_name}</DialogTitle>
            <DialogDescription>
              Template version {selectedTemplate?.template_version} - {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                {/* Template details content would go here */}
                <p className="text-center text-gray-500 py-8">
                  Template details view with metadata, version history, and usage information.
                </p>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4">
                {/* Template content editor would go here */}
                <p className="text-center text-gray-500 py-8">
                  Template content editor with rich text formatting and legal clause management.
                </p>
              </TabsContent>
              
              <TabsContent value="compliance" className="space-y-4">
                {/* Legal compliance tracking would go here */}
                <p className="text-center text-gray-500 py-8">
                  Legal compliance tracking with approval status and review history.
                </p>
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-4">
                {/* Usage analytics would go here */}
                <p className="text-center text-gray-500 py-8">
                  Usage analytics with success rates, completion times, and performance metrics.
                </p>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
