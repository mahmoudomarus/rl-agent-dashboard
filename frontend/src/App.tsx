import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./components/ui/sidebar"
import { AppProvider, useApp } from "./contexts/AppContext"
import { AuthForm } from "./components/AuthForm"
import { DashboardSidebar } from "./components/DashboardSidebar"
import { DashboardOverview } from "./components/DashboardOverview"
import { PropertyList } from "./components/PropertyList"
import { AddPropertyWizard } from "./components/AddPropertyWizard"
import { AnalyticsDashboard } from "./components/AnalyticsDashboard"
import { BookingManagement } from "./components/BookingManagement"
import { FinancialDashboard } from "./components/FinancialDashboard"
import { SettingsPage } from "./components/SettingsPage"
import { ApplicationManagement } from "./components/ApplicationManagement"
import { ViewingManagement } from "./components/ViewingManagement"
import { ContractManagement } from "./components/ContractManagement"
import { ContractTemplateManagement } from "./components/ContractTemplateManagement"
import { AgentManagement } from "./components/AgentManagement"
import { CommissionDashboard } from "./components/CommissionDashboard"
import { LeaseManagement } from "./components/LeaseManagement"
import { CalendarIntegration } from "./components/CalendarIntegration"
import { AuthCallback } from "./components/AuthCallback"
import { Homepage } from "./components/Homepage"

export type NavigationItem = 'overview' | 'properties' | 'add-property' | 'applications' | 'viewings' | 'contracts' | 'templates' | 'leases' | 'calendar' | 'agents' | 'commissions' | 'analytics' | 'financials' | 'settings'

function DashboardContent() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Map URL paths to navigation items
  const getActiveSection = (pathname: string): NavigationItem => {
    const path = pathname.replace('/', '') || 'overview'
    return ['overview', 'properties', 'add-property', 'applications', 'viewings', 'contracts', 'templates', 'leases', 'calendar', 'agents', 'commissions', 'analytics', 'financials', 'settings'].includes(path) 
      ? path as NavigationItem 
      : 'overview'
  }
  
  const [activeSection, setActiveSection] = useState<NavigationItem>(getActiveSection(location.pathname))
  
  // Update active section when URL changes
  useEffect(() => {
    setActiveSection(getActiveSection(location.pathname))
  }, [location.pathname])
  
  // Handle section changes with navigation
  const handleSectionChange = (section: NavigationItem) => {
    setActiveSection(section)
    navigate(section === 'overview' ? '/' : `/${section}`)
  }



  return (
    <SidebarProvider>
      <DashboardSidebar 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange} 
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <div className="flex-1 overflow-auto krib-dashboard-background-enhanced">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/overview" element={<DashboardOverview />} />
            <Route path="/properties" element={<PropertyList />} />
            <Route path="/add-property" element={<AddPropertyWizard />} />
            <Route path="/applications" element={<ApplicationManagement />} />
            <Route path="/viewings" element={<ViewingManagement />} />
            <Route path="/contracts" element={<ContractManagement />} />
            <Route path="/templates" element={<ContractTemplateManagement />} />
            <Route path="/agents" element={<AgentManagement />} />
            <Route path="/leases" element={<LeaseManagement />} />
            <Route path="/calendar" element={<CalendarIntegration />} />
            <Route path="/commissions" element={<CommissionDashboard />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/financials" element={<FinancialDashboard />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/auth" element={<AuthForm />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/callback/*" element={<AuthCallback />} />
    </Routes>
  )
}

function DashboardApp() {
  const { user, isLoading } = useApp()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      {!user ? (
        <PublicRoutes />
      ) : (
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/callback/*" element={<AuthCallback />} />
          <Route path="/*" element={<DashboardContent />} />
        </Routes>
      )}
    </Router>
  )
}

export default function App() {
  return (
    <AppProvider>
      <DashboardApp />
    </AppProvider>
  )
}