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
