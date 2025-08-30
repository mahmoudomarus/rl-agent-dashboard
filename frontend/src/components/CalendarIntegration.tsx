import { useState, useEffect } from "react"
import { calendarApi, viewingsApi } from "../../services/longTermRentalApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Alert, AlertDescription } from "./ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Settings,
  Users,
  Video,
  MapPin,
  Plus,
  X,
  Link as LinkIcon,
  RotateCw
} from "lucide-react"

interface CalendarStatus {
  agent_id: string
  calendar_connected: boolean
  calendar_id?: string
  last_sync?: string
}

interface AvailabilitySlot {
  start_time: string
  end_time: string
  duration_minutes: number
  available: boolean
}

interface ViewingEvent {
  viewing_id: string
  property_title: string
  applicant_name: string
  scheduled_date: string
  scheduled_time: string
  viewing_type: 'in_person' | 'virtual'
  calendar_event_id?: string
  event_link?: string
  meeting_link?: string
}

export function CalendarIntegration() {
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null)
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [viewingEvents, setViewingEvents] = useState<ViewingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [authUrl, setAuthUrl] = useState<string>("")

  useEffect(() => {
    loadCalendarStatus()
    loadViewingEvents()
  }, [])

  useEffect(() => {
    if (calendarStatus?.calendar_connected) {
      loadAvailability()
    }
  }, [selectedDate, calendarStatus])

  const loadCalendarStatus = async () => {
    try {
      setLoading(true)
      const status = await calendarApi.getConnectionStatus()
      setCalendarStatus(status)
    } catch (error) {
      console.error('Failed to load calendar status:', error)
      // Set disconnected state on error
      setCalendarStatus({
        agent_id: "current-agent",
        calendar_connected: false
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAvailability = async () => {
    try {
      if (!calendarStatus?.calendar_connected) return
      
      const startDate = selectedDate
      const endDate = new Date(selectedDate)
      endDate.setDate(endDate.getDate() + 1)
      
      const response = await calendarApi.getAvailability(
        startDate,
        endDate.toISOString().split('T')[0]
      )
      
      setAvailability(response.available_slots)
    } catch (error) {
      console.error('Failed to load availability:', error)
      setAvailability([])
    }
  }

  const loadViewingEvents = async () => {
    try {
      // Load real viewing events from API
      const viewings = await viewingsApi.getAll()
      
      // Transform viewings to ViewingEvent format
      const events: ViewingEvent[] = viewings
        .filter(viewing => viewing.status === 'scheduled' || viewing.status === 'confirmed')
        .map(viewing => ({
          viewing_id: viewing.id,
          property_title: `Property ${viewing.property_id}`, // Note: property title would need to be resolved
          applicant_name: viewing.applicant_name,
          scheduled_date: viewing.scheduled_date,
          scheduled_time: viewing.scheduled_time,
          viewing_type: viewing.viewing_type,
          calendar_event_id: undefined, // Calendar integration would add these fields separately
          event_link: undefined,
          meeting_link: undefined
        }))
      
      setViewingEvents(events)
    } catch (error) {
      console.error('Failed to load viewing events:', error)
      setViewingEvents([])
    }
  }

  const handleConnectCalendar = async () => {
    try {
      const response = await calendarApi.getAuthorizationUrl()
      setAuthUrl(response.authorization_url)
      // Open OAuth URL in new window
      window.open(response.authorization_url, '_blank')
    } catch (error) {
      console.error('Failed to get authorization URL:', error)
    }
  }

  const handleDisconnectCalendar = async () => {
    if (window.confirm('Are you sure you want to disconnect Google Calendar? This will remove all calendar events and availability sync.')) {
      try {
        await calendarApi.disconnectCalendar()
        setCalendarStatus({
          agent_id: calendarStatus?.agent_id || "current-agent",
          calendar_connected: false
        })
        setAvailability([])
      } catch (error) {
        console.error('Failed to disconnect calendar:', error)
      }
    }
  }

  const handleSyncAvailability = async () => {
    try {
      setSyncing(true)
      await calendarApi.syncAvailability()
      await loadAvailability()
      setCalendarStatus(prev => prev ? {
        ...prev,
        last_sync: new Date().toISOString()
      } : null)
    } catch (error) {
      console.error('Failed to sync availability:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleCreateViewingEvent = async (viewingId: string) => {
    try {
      const response = await calendarApi.createViewingEvent(viewingId)
      
      // Update viewing event with calendar details
      setViewingEvents(prev => prev.map(event => 
        event.viewing_id === viewingId 
          ? {
              ...event,
              calendar_event_id: response.calendar_event_id,
              event_link: response.event_link,
              meeting_link: response.meeting_link
            }
          : event
      ))
      
      console.log('Calendar event created successfully')
    } catch (error) {
      console.error('Failed to create calendar event:', error)
    }
  }

  const handleCancelViewingEvent = async (viewingId: string) => {
    try {
      await calendarApi.cancelViewingEvent(viewingId)
      
      // Remove calendar details from viewing event
      setViewingEvents(prev => prev.map(event => 
        event.viewing_id === viewingId 
          ? {
              ...event,
              calendar_event_id: undefined,
              event_link: undefined,
              meeting_link: undefined
            }
          : event
      ))
      
      console.log('Calendar event cancelled successfully')
    } catch (error) {
      console.error('Failed to cancel calendar event:', error)
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(`2024-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Calendar Integration</h1>
          <p className="text-gray-600">Manage your Google Calendar and agent availability</p>
        </div>
        {calendarStatus?.calendar_connected && (
          <Button 
            onClick={handleSyncAvailability}
            disabled={syncing}
            className="btn-primary"
          >
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RotateCw className="h-4 w-4 mr-2" />
                Sync Calendar
              </>
            )}
          </Button>
        )}
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Google Calendar Connection
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to automatically sync availability and manage viewing appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {calendarStatus?.calendar_connected ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-lime-500" />
                  <div>
                    <p className="font-medium text-lime-700">Connected</p>
                    <p className="text-sm text-gray-600">
                      Calendar ID: {calendarStatus.calendar_id}
                    </p>
                    {calendarStatus.last_sync && (
                      <p className="text-xs text-gray-500">
                        Last sync: {new Date(calendarStatus.last_sync).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Not Connected</p>
                    <p className="text-sm text-gray-600">
                      Connect your Google Calendar to enable automatic scheduling
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              {calendarStatus?.calendar_connected ? (
                <Button 
                  variant="outline" 
                  onClick={handleDisconnectCalendar}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              ) : (
                <Button 
                  onClick={handleConnectCalendar}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Connect Google Calendar
                </Button>
              )}
            </div>
          </div>

          {!calendarStatus?.calendar_connected && authUrl && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                A new window has opened for Google Calendar authorization. 
                Complete the authorization process and return here to continue.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {calendarStatus?.calendar_connected && (
        <Tabs defaultValue="availability" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="viewings">Viewing Events</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="availability" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Agent Availability
                  </span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  />
                </CardTitle>
                <CardDescription>
                  Your available time slots for {new Date(selectedDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availability.length > 0 ? (
                  <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
                    {availability.map((slot, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 ${
                          slot.available 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {formatTime(slot.start_time.split('T')[1])} - {formatTime(slot.end_time.split('T')[1])}
                          </span>
                          <Badge 
                            className={slot.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {slot.available ? 'Available' : 'Busy'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {slot.duration_minutes} minutes
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No availability data for selected date.</p>
                    <Button 
                      onClick={handleSyncAvailability} 
                      className="mt-2"
                      disabled={syncing}
                    >
                      Sync Calendar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="viewings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Viewing Events
                </CardTitle>
                <CardDescription>
                  Manage property viewing appointments and calendar events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {viewingEvents.map((viewing) => (
                    <div key={viewing.viewing_id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{viewing.property_title}</h3>
                          <p className="text-gray-600">Applicant: {viewing.applicant_name}</p>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(viewing.scheduled_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatTime(viewing.scheduled_time)}
                            </span>
                            <span className="flex items-center">
                              {viewing.viewing_type === 'virtual' ? (
                                <>
                                  <Video className="h-4 w-4 mr-1" />
                                  Virtual
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-4 w-4 mr-1" />
                                  In-Person
                                </>
                              )}
                            </span>
                          </div>

                          {viewing.calendar_event_id && (
                            <div className="mt-3 flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Calendar Event Created
                              </Badge>
                              {viewing.event_link && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(viewing.event_link, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View in Calendar
                                </Button>
                              )}
                              {viewing.meeting_link && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(viewing.meeting_link, '_blank')}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  <Video className="h-3 w-3 mr-1" />
                                  Join Meeting
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {viewing.calendar_event_id ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelViewingEvent(viewing.viewing_id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel Event
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleCreateViewingEvent(viewing.viewing_id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Create Event
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {viewingEvents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No viewing appointments scheduled.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Calendar Settings
                </CardTitle>
                <CardDescription>
                  Configure your calendar integration preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Working Hours</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Your working hours are used to determine availability for property viewings.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Time</label>
                      <Select defaultValue="09:00">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="08:00">8:00 AM</SelectItem>
                          <SelectItem value="09:00">9:00 AM</SelectItem>
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Time</label>
                      <Select defaultValue="18:00">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="17:00">5:00 PM</SelectItem>
                          <SelectItem value="18:00">6:00 PM</SelectItem>
                          <SelectItem value="19:00">7:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Automatic Sync</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Automatically sync your calendar availability every hour.
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-sync"
                      defaultChecked
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="auto-sync" className="text-sm font-medium">
                      Enable automatic sync
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Notification Preferences</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure how you want to be notified about viewing appointments.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="email-notifications"
                        defaultChecked
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="email-notifications" className="text-sm font-medium">
                        Email notifications (24 hours before)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="popup-reminders"
                        defaultChecked
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="popup-reminders" className="text-sm font-medium">
                        Calendar popup reminders (1 hour before)
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
