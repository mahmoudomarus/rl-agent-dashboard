// Long-Term Rental API Services
// This file contains API calls for the long-term rental management system

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://krib-real-estate-agent-dahaboard-backend.onrender.com/api'

// Helper function to get auth token
const getAuthHeaders = async () => {
  // Get token from Supabase auth session
  const { data: { session } } = await (await import('../src/utils/supabase/client')).supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
  }
}

// Helper function to make API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = await getAuthHeaders()
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// =====================================================================
// LEASE AGREEMENTS API
// =====================================================================

export interface LeaseAgreement {
  id: string
  property_id: string
  tenant_application_id?: string
  agent_id: string
  agency_id: string
  lease_number: string
  contract_type: string
  
  // Parties Information
  landlord_name: string
  landlord_email?: string
  landlord_phone?: string
  landlord_emirates_id?: string
  
  tenant_name: string
  tenant_email: string
  tenant_phone: string
  tenant_emirates_id?: string
  tenant_passport?: string
  
  // Lease Terms
  lease_start_date: string
  lease_end_date: string
  
  // Financial Terms
  annual_rent: number
  security_deposit: number
  broker_commission: number
  
  // Payment Terms
  payment_schedule: string
  payment_method: string
  payment_due_day: number
  late_payment_penalty_percentage: number
  
  // Additional Charges
  service_charges_annual: number
  dewa_included: boolean
  internet_included: boolean
  maintenance_included: boolean
  parking_included: boolean
  
  // Contract Terms
  auto_renewal: boolean
  renewal_notice_period_days: number
  early_termination_allowed: boolean
  early_termination_penalty?: number
  
  // Property Condition
  furnished_status?: string
  inventory_list_url?: string
  property_condition_report_url?: string
  
  // Legal Compliance
  rera_permit_number?: string
  ejari_registration_number?: string
  municipality_approval: boolean
  
  // Document Management
  contract_template_id?: string
  docusign_envelope_id?: string
  signed_contract_url?: string
  
  // Signature Status
  landlord_signature_status: string
  tenant_signature_status: string
  witness_signature_status: string
  
  // Agreement Status
  status: string
  execution_date?: string
  registration_date?: string
  
  // Commission Tracking
  commission_status: string
  commission_invoice_number?: string
  commission_paid_date?: string
  commission_payment_reference?: string
  
  // Timestamps
  created_at: string
  updated_at: string
}

export const leasesApi = {
  // Get all lease agreements
  getLeases: async (filters?: {
    status_filter?: string
    agent_id?: string
    property_id?: string
    contract_type?: string
  }): Promise<LeaseAgreement[]> => {
    const queryParams = new URLSearchParams(filters as any).toString()
    return apiCall(`/leases${queryParams ? `?${queryParams}` : ''}`)
  },

  // Get specific lease agreement
  getLease: async (leaseId: string): Promise<LeaseAgreement> => {
    return apiCall(`/leases/${leaseId}`)
  },

  // Create new lease agreement
  createLease: async (leaseData: Partial<LeaseAgreement>): Promise<LeaseAgreement> => {
    return apiCall('/leases', {
      method: 'POST',
      body: JSON.stringify(leaseData)
    })
  },

  // Update lease agreement
  updateLease: async (leaseId: string, updates: Partial<LeaseAgreement>): Promise<LeaseAgreement> => {
    return apiCall(`/leases/${leaseId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  },

  // Send lease for signature
  sendForSignature: async (leaseId: string): Promise<{ message: string, lease_id: string }> => {
    return apiCall(`/leases/${leaseId}/send-for-signature`, {
      method: 'POST'
    })
  },

  // Get signature status
  getSignatureStatus: async (leaseId: string): Promise<{
    lease_id: string
    status: string
    landlord_signed: boolean
    tenant_signed: boolean
    witness_signed: boolean
    docusign_envelope_id?: string
    fully_executed: boolean
  }> => {
    return apiCall(`/leases/${leaseId}/signature-status`)
  },

  // Delete lease agreement
  deleteLease: async (leaseId: string): Promise<{ message: string }> => {
    return apiCall(`/leases/${leaseId}`, {
      method: 'DELETE'
    })
  }
}

// =====================================================================
// CONTRACT TEMPLATES API
// =====================================================================

export interface ContractTemplate {
  id: string
  agency_id: string
  template_name: string
  template_version: string
  description?: string
  property_type?: string
  contract_language: string
  emirates?: string
  template_content: any
  docusign_template_id?: string
  rera_compliant: boolean
  dubai_land_department_approved: boolean
  municipality_approved: boolean
  legal_review_date?: string
  legal_reviewer_name?: string
  usage_count: number
  success_rate: number
  status: string
  is_default: boolean
  parent_template_id?: string
  changelog: string[]
  created_at: string
  updated_at: string
}

export const contractTemplatesApi = {
  // Get all contract templates
  getTemplates: async (filters?: {
    property_type?: string
    status_filter?: string
    contract_language?: string
    emirates?: string
    rera_compliant?: boolean
  }): Promise<ContractTemplate[]> => {
    const queryParams = new URLSearchParams(filters as any).toString()
    return apiCall(`/contract-templates${queryParams ? `?${queryParams}` : ''}`)
  },

  // Get specific contract template
  getTemplate: async (templateId: string): Promise<ContractTemplate> => {
    return apiCall(`/contract-templates/${templateId}`)
  },

  // Create new contract template
  createTemplate: async (templateData: Partial<ContractTemplate>): Promise<ContractTemplate> => {
    return apiCall('/contract-templates', {
      method: 'POST',
      body: JSON.stringify(templateData)
    })
  },

  // Update contract template
  updateTemplate: async (templateId: string, updates: Partial<ContractTemplate>): Promise<ContractTemplate> => {
    return apiCall(`/contract-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  },

  // Duplicate template
  duplicateTemplate: async (templateId: string, newName?: string): Promise<ContractTemplate> => {
    return apiCall(`/contract-templates/${templateId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ new_name: newName })
    })
  },

  // Activate template
  activateTemplate: async (templateId: string): Promise<ContractTemplate> => {
    return apiCall(`/contract-templates/${templateId}/activate`, {
      method: 'POST'
    })
  },

  // Get template usage stats
  getTemplateStats: async (templateId: string): Promise<{
    template_id: string
    template_name: string
    total_uses: number
    success_rate: number
    completed_leases: number
    monthly_usage: Record<string, number>
    last_used?: string
  }> => {
    return apiCall(`/contract-templates/${templateId}/usage-stats`)
  },

  // Upload template file
  uploadTemplate: async (file: File, templateName?: string, propertyType?: string): Promise<ContractTemplate> => {
    const formData = new FormData()
    formData.append('file', file)
    if (templateName) formData.append('template_name', templateName)
    if (propertyType) formData.append('property_type', propertyType)

    const headers = await getAuthHeaders()
    delete (headers as any)['Content-Type'] // Let browser set it for FormData

    const response = await fetch(`${API_BASE_URL}/contract-templates/upload-template`, {
      method: 'POST',
      headers,
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },

  // Delete template
  deleteTemplate: async (templateId: string): Promise<{ message: string }> => {
    return apiCall(`/contract-templates/${templateId}`, {
      method: 'DELETE'
    })
  }
}

// =====================================================================
// GOOGLE CALENDAR INTEGRATION API
// =====================================================================

export const calendarApi = {
  // Get Google Calendar connection status
  getConnectionStatus: async (): Promise<{
    agent_id: string
    calendar_connected: boolean
    calendar_id?: string
    last_sync?: string
  }> => {
    return apiCall('/calendar/status')
  },

  // Get authorization URL for Google Calendar
  getAuthorizationUrl: async (): Promise<{
    authorization_url: string
    message: string
  }> => {
    return apiCall('/calendar/connect')
  },

  // Handle OAuth callback
  handleOAuthCallback: async (code: string, state: string): Promise<{
    message: string
    agent_id: string
    calendar_connected: boolean
  }> => {
    return apiCall('/calendar/oauth/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state })
    })
  },

  // Sync agent availability
  syncAvailability: async (): Promise<{
    message: string
    agent_id: string
  }> => {
    return apiCall('/calendar/sync-availability', {
      method: 'POST'
    })
  },

  // Get agent availability
  getAvailability: async (startDate: string, endDate: string): Promise<{
    agent_id: string
    start_date: string
    end_date: string
    available_slots: Array<{
      start_time: string
      end_time: string
      duration_minutes: number
      available: boolean
    }>
  }> => {
    return apiCall(`/calendar/availability?start_date=${startDate}&end_date=${endDate}`)
  },

  // Create viewing calendar event
  createViewingEvent: async (viewingId: string): Promise<{
    message: string
    viewing_id: string
    calendar_event_id: string
    event_link?: string
    meeting_link?: string
  }> => {
    return apiCall('/calendar/create-viewing-event', {
      method: 'POST',
      body: JSON.stringify({ viewing_id: viewingId })
    })
  },

  // Update viewing calendar event
  updateViewingEvent: async (viewingId: string): Promise<{
    message: string
    viewing_id: string
    calendar_event_id: string
    event_link?: string
  }> => {
    return apiCall(`/calendar/update-viewing-event/${viewingId}`, {
      method: 'PUT'
    })
  },

  // Cancel viewing calendar event
  cancelViewingEvent: async (viewingId: string): Promise<{
    message: string
    viewing_id: string
    cancelled: boolean
  }> => {
    return apiCall(`/calendar/cancel-viewing-event/${viewingId}`, {
      method: 'DELETE'
    })
  },

  // Disconnect Google Calendar
  disconnectCalendar: async (): Promise<{
    message: string
    agent_id: string
  }> => {
    return apiCall('/calendar/disconnect', {
      method: 'POST'
    })
  }
}

// =====================================================================
// ANALYTICS & DASHBOARD API
// =====================================================================

export const analyticsApi = {
  // Get agency dashboard stats
  getDashboardStats: async (): Promise<{
    active_listings: number
    monthly_commission: number
    pending_applications: number
    team_performance: number
    recent_activity: Array<{
      id: string
      type: string
      title: string
      description: string
      status: string
      timestamp: string
    }>
    top_performing_areas: Array<{
      area: string
      properties_count: number
      demand_level: string
      avg_rent: number
    }>
  }> => {
    return apiCall('/analytics/dashboard')
  },

  // Get commission analytics
  getCommissionAnalytics: async (): Promise<{
    total_earned: number
    pending_commission: number
    paid_commission: number
    monthly_projection: number
    commission_breakdown: Array<{
      agent_id: string
      agent_name: string
      total_commission: number
      properties_count: number
      success_rate: number
    }>
  }> => {
    return apiCall('/analytics/commissions')
  },

  // Get property performance analytics
  getPropertyAnalytics: async (): Promise<{
    total_properties: number
    active_properties: number
    leased_properties: number
    avg_time_to_lease: number
    top_performing_properties: Array<{
      property_id: string
      property_title: string
      location: string
      lease_speed: number
      commission_earned: number
    }>
  }> => {
    return apiCall('/analytics/properties')
  }
}

// =====================================================================
// APPLICATIONS API
// =====================================================================

export interface TenantApplication {
  id: string
  property_id: string
  agent_id?: string
  application_number: string
  status: 'submitted' | 'documents_pending' | 'under_review' | 'credit_check' | 'approved' | 'rejected' | 'withdrawn'
  primary_applicant_name: string
  primary_applicant_email: string
  primary_applicant_phone: string
  monthly_income?: number
  desired_move_in_date: string
  lease_duration_months: number
  maximum_budget: number
  created_at: string
  updated_at: string
}

export const applicationsApi = {
  // Get all applications
  getAll: async (): Promise<TenantApplication[]> => {
    return apiCall('/applications')
  },

  // Get application by ID
  getById: async (id: string): Promise<TenantApplication> => {
    return apiCall(`/applications/${id}`)
  },

  // Create new application
  create: async (applicationData: Partial<TenantApplication>): Promise<TenantApplication> => {
    return apiCall('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    })
  },

  // Update application
  update: async (id: string, updates: Partial<TenantApplication>): Promise<TenantApplication> => {
    return apiCall(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Get application statistics
  getStats: async () => {
    return apiCall('/applications/stats')
  }
}

// =====================================================================
// VIEWINGS API
// =====================================================================

export interface PropertyViewing {
  id: string
  property_id: string
  agent_id?: string
  viewing_number: string
  scheduled_date: string
  scheduled_time: string
  applicant_name: string
  applicant_email: string
  applicant_phone: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  viewing_type: 'in_person' | 'virtual'
  created_at: string
  updated_at: string
}

export const viewingsApi = {
  // Get all viewings
  getAll: async (): Promise<PropertyViewing[]> => {
    return apiCall('/viewings')
  },

  // Get viewing by ID
  getById: async (id: string): Promise<PropertyViewing> => {
    return apiCall(`/viewings/${id}`)
  },

  // Create new viewing
  create: async (viewingData: Partial<PropertyViewing>): Promise<PropertyViewing> => {
    return apiCall('/viewings', {
      method: 'POST',
      body: JSON.stringify(viewingData),
    })
  },

  // Update viewing
  update: async (id: string, updates: Partial<PropertyViewing>): Promise<PropertyViewing> => {
    return apiCall(`/viewings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Get today's viewings
  getToday: async (): Promise<PropertyViewing[]> => {
    const today = new Date().toISOString().split('T')[0]
    return apiCall(`/viewings?date=${today}`)
  },

  // Get viewing statistics
  getStats: async () => {
    return apiCall('/viewings/stats')
  }
}

// =====================================================================
// AGENTS API
// =====================================================================

export interface Agent {
  id: string
  agency_id: string
  name: string
  email: string
  phone: string
  role: 'agent' | 'senior_agent' | 'team_lead' | 'manager' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  assigned_territories: string[]
  commission_rate: number
  total_deals_closed: number
  total_commission_earned: number
  created_at: string
  updated_at: string
}

export const agentsApi = {
  // Get all agents
  getAll: async (): Promise<Agent[]> => {
    return apiCall('/agencies/agents')
  },

  // Get agent by ID
  getById: async (id: string): Promise<Agent> => {
    return apiCall(`/agencies/agents/${id}`)
  },

  // Create new agent
  create: async (agentData: Partial<Agent>): Promise<Agent> => {
    return apiCall('/agencies/agents', {
      method: 'POST',
      body: JSON.stringify(agentData),
    })
  },

  // Update agent
  update: async (id: string, updates: Partial<Agent>): Promise<Agent> => {
    return apiCall(`/agencies/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Get agent performance stats
  getPerformance: async (id: string) => {
    return apiCall(`/agencies/agents/${id}/performance`)
  }
}

// =====================================================================
// AGENCIES API
// =====================================================================

export interface Agency {
  id: string
  name: string
  license_number: string
  head_office_address: string
  emirates: string
  phone: string
  email: string
  total_agents: number
  created_at: string
  updated_at: string
}

export const agenciesApi = {
  // Get current user's agency
  getCurrent: async (): Promise<Agency> => {
    return apiCall('/agencies/current')
  },

  // Update agency
  update: async (updates: Partial<Agency>): Promise<Agency> => {
    return apiCall('/agencies/current', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Get agency dashboard stats
  getDashboardStats: async () => {
    return apiCall('/agencies/dashboard')
  }
}

// =====================================================================
// LEASE CONTRACTS API
// =====================================================================

export interface LeaseContract {
  id: string
  property_id: string
  tenant_application_id?: string
  lease_number: string
  tenant_name: string
  landlord_name: string
  annual_rent: number
  security_deposit: number
  lease_start_date: string
  lease_end_date: string
  status: 'draft' | 'sent_for_signature' | 'partially_signed' | 'fully_executed' | 'active'
  contract_type: 'residential' | 'commercial'
  created_at: string
  updated_at: string
}

export const contractsApi = {
  // Get all contracts
  getAll: async (): Promise<LeaseContract[]> => {
    return apiCall('/contracts')
  },

  // Get contract by ID
  getById: async (id: string): Promise<LeaseContract> => {
    return apiCall(`/contracts/${id}`)
  },

  // Create new contract
  create: async (contractData: Partial<LeaseContract>): Promise<LeaseContract> => {
    return apiCall('/contracts', {
      method: 'POST',
      body: JSON.stringify(contractData),
    })
  },

  // Update contract
  update: async (id: string, updates: Partial<LeaseContract>): Promise<LeaseContract> => {
    return apiCall(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Send contract for signature
  sendForSignature: async (id: string) => {
    return apiCall(`/contracts/${id}/send-signature`, {
      method: 'POST',
    })
  }
}
