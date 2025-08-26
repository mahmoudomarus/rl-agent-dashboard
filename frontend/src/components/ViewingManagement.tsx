import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"
import { Eye, Calendar as CalendarIcon, Clock, MapPin, Phone, Plus, AlertCircle } from "lucide-react"
import { viewingsApi, PropertyViewing } from "../../services/longTermRentalApi"

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800'
    case 'confirmed': return 'bg-green-100 text-green-800'
    case 'completed': return 'bg-gray-100 text-gray-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function ViewingManagement() {
  const [viewings, setViewings] = useState<PropertyViewing[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch viewings on component mount
  useEffect(() => {
    const fetchViewings = async () => {
      try {
        setLoading(true)
        const data = await viewingsApi.getAll()
        setViewings(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch viewings')
      } finally {
        setLoading(false)
      }
    }

    fetchViewings()
  }, [])

  const todaysViewings = viewings.filter(viewing => {
    const viewingDate = new Date(viewing.scheduled_date)
    const today = new Date()
    return viewingDate.toDateString() === today.toDateString()
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading viewings...</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Property Viewings</h2>
          <p className="text-muted-foreground">Schedule and manage property viewings</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Viewing
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Viewings</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysViewings.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viewings.length}</div>
            <p className="text-xs text-muted-foreground">Total scheduled</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {viewings.filter(v => v.status === 'confirmed').length}
            </div>
            <p className="text-xs text-muted-foreground">Ready to proceed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <div className="text-sm text-muted-foreground">%</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Viewing to application</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Viewings List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Viewings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {viewings.length === 0 ? (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No viewings scheduled</h3>
                  <p className="text-gray-500">No property viewings have been scheduled yet.</p>
                </div>
              ) : (
                viewings.map((viewing) => (
                  <div key={viewing.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                        {viewing.viewing_type === 'virtual' ? (
                          <Eye className="h-4 w-4 text-blue-600" />
                        ) : (
                          <MapPin className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">Viewing #{viewing.viewing_number}</h4>
                        <p className="text-sm text-gray-600">{viewing.applicant_name}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {new Date(viewing.scheduled_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {viewing.scheduled_time}
                          </span>
                          <span className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {viewing.applicant_phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(viewing.status)}>
                        {viewing.status}
                      </Badge>
                      
                      <Badge variant="outline">
                        {viewing.viewing_type === 'virtual' ? 'Virtual' : 'In-Person'}
                      </Badge>
                      
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
