"""
Google Calendar Integration Service for Property Viewing Scheduling
"""

from typing import Dict, List, Optional, Any
import json
import logging
from datetime import datetime, timedelta, timezone
import uuid

from app.core.config import settings
from app.core.supabase_client import supabase_client

# Try to import Google libraries, but continue if they're not available
try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from google_auth_oauthlib.flow import Flow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GOOGLE_CALENDAR_AVAILABLE = True
except ImportError:
    # Create mock classes if Google Calendar is not available
    Credentials = None
    Request = None
    Flow = None
    HttpError = Exception
    GOOGLE_CALENDAR_AVAILABLE = False
    
    def build(*args, **kwargs):
        return None

logger = logging.getLogger(__name__)

class GoogleCalendarService:
    def __init__(self):
        self.google_calendar_available = GOOGLE_CALENDAR_AVAILABLE
        
        if not self.google_calendar_available:
            logger.warning("Google Calendar library not available. Calendar features will be disabled.")
            return
            
        self.client_id = getattr(settings, 'google_client_id', None)
        self.client_secret = getattr(settings, 'google_client_secret', None)
        self.redirect_uri = "http://localhost:8000/api/auth/google/callback"
        self.scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ]
        
        if self.client_id and self.client_secret:
            logger.info("Google Calendar service initialized successfully")
        else:
            logger.warning("Google Calendar configuration incomplete. Calendar features will be disabled.")
    
    def get_authorization_url(self, agent_id: str) -> str:
        """
        Get Google OAuth authorization URL for agent calendar integration
        """
        try:
            if not self.google_calendar_available:
                logger.warning("Google Calendar not available, returning mock URL")
                return "https://mock-calendar-auth.example.com"
            
            if not self.client_id or not self.client_secret:
                raise Exception("Google Calendar credentials not configured")
            
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.scopes
            )
            flow.redirect_uri = self.redirect_uri
            
            authorization_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                state=agent_id  # Pass agent_id as state parameter
            )
            
            return authorization_url
            
        except Exception as e:
            logger.error(f"Failed to get authorization URL: {e}")
            raise
    
    async def handle_oauth_callback(self, code: str, state: str) -> Dict[str, Any]:
        """
        Handle OAuth callback and store agent credentials
        """
        try:
            agent_id = state  # agent_id was passed as state parameter
            
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.scopes
            )
            flow.redirect_uri = self.redirect_uri
            
            # Exchange authorization code for tokens
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            # Store credentials for agent
            await self._store_agent_credentials(agent_id, credentials)
            
            return {
                "agent_id": agent_id,
                "calendar_connected": True,
                "calendar_id": "primary"
            }
            
        except Exception as e:
            logger.error(f"Failed to handle OAuth callback: {e}")
            raise
    
    async def _store_agent_credentials(self, agent_id: str, credentials: Credentials):
        """Store encrypted Google credentials for agent"""
        try:
            # In production, encrypt credentials before storing
            credentials_data = {
                "token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": credentials.scopes
            }
            
            # Update agent with Google Calendar credentials
            supabase_client.table("agents").update({
                "google_calendar_id": "primary",
                "google_credentials": json.dumps(credentials_data),  # In production: encrypt this
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", agent_id).execute()
            
        except Exception as e:
            logger.error(f"Failed to store agent credentials: {e}")
            raise
    
    async def _get_agent_credentials(self, agent_id: str) -> Optional[Credentials]:
        """Get and refresh agent's Google credentials"""
        try:
            # Get agent's stored credentials
            agent_result = supabase_client.table("agents").select("google_credentials").eq("id", agent_id).execute()
            
            if not agent_result.data or not agent_result.data[0].get("google_credentials"):
                return None
            
            credentials_data = json.loads(agent_result.data[0]["google_credentials"])
            
            # Recreate credentials object
            credentials = Credentials.from_authorized_user_info(credentials_data, self.scopes)
            
            # Refresh token if needed
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
                # Update stored credentials
                await self._store_agent_credentials(agent_id, credentials)
            
            return credentials
            
        except Exception as e:
            logger.error(f"Failed to get agent credentials: {e}")
            return None
    
    async def create_viewing_event(
        self,
        agent_id: str,
        viewing_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a Google Calendar event for property viewing
        """
        try:
            credentials = await self._get_agent_credentials(agent_id)
            if not credentials:
                raise Exception("Agent Google Calendar not connected")
            
            service = build('calendar', 'v3', credentials=credentials)
            
            # Parse viewing date and time
            viewing_date = viewing_data["scheduled_date"]
            viewing_time = viewing_data["scheduled_time"]
            duration_minutes = viewing_data.get("duration_minutes", 30)
            
            # Create datetime objects
            start_datetime = datetime.fromisoformat(f"{viewing_date}T{viewing_time}")
            end_datetime = start_datetime + timedelta(minutes=duration_minutes)
            
            # Get property information for event details
            property_result = supabase_client.table("properties").select("title, address").eq("id", viewing_data["property_id"]).execute()
            property_info = property_result.data[0] if property_result.data else {}
            
            # Create event
            event = {
                'summary': f'Property Viewing - {property_info.get("title", "Property")}',
                'description': (
                    f"Property Viewing\n\n"
                    f"Property: {property_info.get('title', 'N/A')}\n"
                    f"Address: {property_info.get('address', 'N/A')}\n"
                    f"Applicant: {viewing_data.get('applicant_name', 'N/A')}\n"
                    f"Phone: {viewing_data.get('applicant_phone', 'N/A')}\n"
                    f"Email: {viewing_data.get('applicant_email', 'N/A')}\n"
                    f"Attendees: {viewing_data.get('number_of_attendees', 1)}\n"
                    f"Type: {viewing_data.get('viewing_type', 'in_person').replace('_', ' ').title()}"
                ),
                'start': {
                    'dateTime': start_datetime.isoformat(),
                    'timeZone': 'Asia/Dubai',
                },
                'end': {
                    'dateTime': end_datetime.isoformat(),
                    'timeZone': 'Asia/Dubai',
                },
                'location': property_info.get('address', ''),
                'attendees': [
                    {'email': viewing_data.get('applicant_email')},
                ],
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                        {'method': 'popup', 'minutes': 60},       # 1 hour before
                    ],
                },
                'conferenceData': self._create_meeting_link(viewing_data) if viewing_data.get('viewing_type') == 'virtual' else None
            }
            
            # Create event in Google Calendar
            created_event = service.events().insert(calendarId='primary', body=event).execute()
            
            # Update viewing record with calendar event ID
            await self._update_viewing_with_calendar_event(viewing_data["viewing_id"], created_event['id'])
            
            return {
                "calendar_event_id": created_event['id'],
                "event_link": created_event.get('htmlLink'),
                "meeting_link": created_event.get('conferenceData', {}).get('entryPoints', [{}])[0].get('uri') if viewing_data.get('viewing_type') == 'virtual' else None
            }
            
        except HttpError as e:
            logger.error(f"Google Calendar API error: {e}")
            raise Exception(f"Failed to create calendar event: {e}")
        except Exception as e:
            logger.error(f"Calendar service error: {e}")
            raise
    
    def _create_meeting_link(self, viewing_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create Google Meet conference data for virtual viewings"""
        return {
            'createRequest': {
                'requestId': str(uuid.uuid4()),
                'conferenceSolutionKey': {
                    'type': 'hangoutsMeet'
                }
            }
        }
    
    async def _update_viewing_with_calendar_event(self, viewing_id: str, calendar_event_id: str):
        """Update viewing record with Google Calendar event ID"""
        try:
            supabase_client.table("property_viewings").update({
                "google_calendar_event_id": calendar_event_id,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", viewing_id).execute()
        except Exception as e:
            logger.error(f"Failed to update viewing with calendar event: {e}")
    
    async def update_viewing_event(
        self,
        agent_id: str,
        viewing_id: str,
        viewing_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update an existing Google Calendar event for property viewing
        """
        try:
            # Get viewing record with calendar event ID
            viewing_result = supabase_client.table("property_viewings").select("google_calendar_event_id").eq("id", viewing_id).execute()
            
            if not viewing_result.data or not viewing_result.data[0].get("google_calendar_event_id"):
                # No calendar event exists, create new one
                return await self.create_viewing_event(agent_id, {**viewing_data, "viewing_id": viewing_id})
            
            calendar_event_id = viewing_result.data[0]["google_calendar_event_id"]
            
            credentials = await self._get_agent_credentials(agent_id)
            if not credentials:
                raise Exception("Agent Google Calendar not connected")
            
            service = build('calendar', 'v3', credentials=credentials)
            
            # Get existing event
            existing_event = service.events().get(calendarId='primary', eventId=calendar_event_id).execute()
            
            # Update event with new data
            if "scheduled_date" in viewing_data or "scheduled_time" in viewing_data:
                viewing_date = viewing_data.get("scheduled_date", existing_event['start']['dateTime'][:10])
                viewing_time = viewing_data.get("scheduled_time", existing_event['start']['dateTime'][11:19])
                duration_minutes = viewing_data.get("duration_minutes", 30)
                
                start_datetime = datetime.fromisoformat(f"{viewing_date}T{viewing_time}")
                end_datetime = start_datetime + timedelta(minutes=duration_minutes)
                
                existing_event['start']['dateTime'] = start_datetime.isoformat()
                existing_event['end']['dateTime'] = end_datetime.isoformat()
            
            # Update event
            updated_event = service.events().update(calendarId='primary', eventId=calendar_event_id, body=existing_event).execute()
            
            return {
                "calendar_event_id": updated_event['id'],
                "event_link": updated_event.get('htmlLink'),
                "updated": True
            }
            
        except HttpError as e:
            logger.error(f"Google Calendar API error: {e}")
            raise Exception(f"Failed to update calendar event: {e}")
        except Exception as e:
            logger.error(f"Calendar service error: {e}")
            raise
    
    async def cancel_viewing_event(
        self,
        agent_id: str,
        viewing_id: str
    ) -> Dict[str, Any]:
        """
        Cancel a Google Calendar event for property viewing
        """
        try:
            # Get viewing record with calendar event ID
            viewing_result = supabase_client.table("property_viewings").select("google_calendar_event_id").eq("id", viewing_id).execute()
            
            if not viewing_result.data or not viewing_result.data[0].get("google_calendar_event_id"):
                return {"message": "No calendar event to cancel"}
            
            calendar_event_id = viewing_result.data[0]["google_calendar_event_id"]
            
            credentials = await self._get_agent_credentials(agent_id)
            if not credentials:
                raise Exception("Agent Google Calendar not connected")
            
            service = build('calendar', 'v3', credentials=credentials)
            
            # Delete event from Google Calendar
            service.events().delete(calendarId='primary', eventId=calendar_event_id).execute()
            
            # Clear calendar event ID from viewing record
            supabase_client.table("property_viewings").update({
                "google_calendar_event_id": None,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", viewing_id).execute()
            
            return {
                "cancelled": True,
                "calendar_event_id": calendar_event_id
            }
            
        except HttpError as e:
            logger.error(f"Google Calendar API error: {e}")
            raise Exception(f"Failed to cancel calendar event: {e}")
        except Exception as e:
            logger.error(f"Calendar service error: {e}")
            raise
    
    async def get_agent_availability(
        self,
        agent_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """
        Get agent availability from Google Calendar
        """
        try:
            credentials = await self._get_agent_credentials(agent_id)
            if not credentials:
                return []  # Return empty if calendar not connected
            
            service = build('calendar', 'v3', credentials=credentials)
            
            # Get busy times from Google Calendar
            freebusy_request = {
                'timeMin': start_date.isoformat(),
                'timeMax': end_date.isoformat(),
                'timeZone': 'Asia/Dubai',
                'items': [{'id': 'primary'}]
            }
            
            freebusy_result = service.freebusy().query(body=freebusy_request).execute()
            busy_times = freebusy_result['calendars']['primary']['busy']
            
            # Get agent's working hours
            agent_result = supabase_client.table("agents").select("working_hours").eq("id", agent_id).execute()
            working_hours = agent_result.data[0]['working_hours'] if agent_result.data else {}
            
            # Generate available slots
            available_slots = self._generate_available_slots(
                start_date, 
                end_date, 
                busy_times, 
                working_hours
            )
            
            return available_slots
            
        except HttpError as e:
            logger.error(f"Google Calendar API error: {e}")
            return []
        except Exception as e:
            logger.error(f"Calendar service error: {e}")
            return []
    
    def _generate_available_slots(
        self,
        start_date: datetime,
        end_date: datetime,
        busy_times: List[Dict[str, str]],
        working_hours: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate available time slots based on working hours and busy times
        """
        available_slots = []
        
        # Default working hours if not specified
        default_working_hours = {
            "start": "09:00",
            "end": "18:00",
            "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        }
        
        working_hours = {**default_working_hours, **working_hours}
        
        current_date = start_date.date()
        end_date_only = end_date.date()
        
        while current_date <= end_date_only:
            day_name = current_date.strftime('%A').lower()
            
            if day_name in working_hours.get("days", []):
                # Create time slots for this day
                work_start = datetime.combine(current_date, datetime.strptime(working_hours["start"], "%H:%M").time())
                work_end = datetime.combine(current_date, datetime.strptime(working_hours["end"], "%H:%M").time())
                
                # Generate 30-minute slots
                current_slot = work_start
                while current_slot + timedelta(minutes=30) <= work_end:
                    slot_end = current_slot + timedelta(minutes=30)
                    
                    # Check if slot conflicts with busy times
                    is_available = not self._slot_conflicts_with_busy_times(
                        current_slot, 
                        slot_end, 
                        busy_times
                    )
                    
                    if is_available:
                        available_slots.append({
                            "start_time": current_slot.isoformat(),
                            "end_time": slot_end.isoformat(),
                            "duration_minutes": 30,
                            "available": True
                        })
                    
                    current_slot = slot_end
            
            current_date += timedelta(days=1)
        
        return available_slots
    
    def _slot_conflicts_with_busy_times(
        self,
        slot_start: datetime,
        slot_end: datetime,
        busy_times: List[Dict[str, str]]
    ) -> bool:
        """Check if a time slot conflicts with busy times"""
        for busy_period in busy_times:
            busy_start = datetime.fromisoformat(busy_period['start'].replace('Z', '+00:00'))
            busy_end = datetime.fromisoformat(busy_period['end'].replace('Z', '+00:00'))
            
            # Check for overlap
            if (slot_start < busy_end and slot_end > busy_start):
                return True
        
        return False
    
    async def sync_agent_availability(self, agent_id: str) -> Dict[str, Any]:
        """
        Sync agent's availability with Google Calendar and update database
        """
        try:
            # Get next 30 days availability
            start_date = datetime.now()
            end_date = start_date + timedelta(days=30)
            
            available_slots = await self.get_agent_availability(agent_id, start_date, end_date)
            
            # Clear existing availability
            supabase_client.table("agent_availability").delete().eq("agent_id", agent_id).gte("date", start_date.date().isoformat()).execute()
            
            # Insert new availability slots
            availability_records = []
            for slot in available_slots:
                slot_start = datetime.fromisoformat(slot['start_time'])
                slot_end = datetime.fromisoformat(slot['end_time'])
                
                availability_records.append({
                    "agent_id": agent_id,
                    "date": slot_start.date().isoformat(),
                    "start_time": slot_start.time().isoformat(),
                    "end_time": slot_end.time().isoformat(),
                    "is_available": True,
                    "max_viewings": 3,
                    "current_bookings": 0,
                    "slot_type": "regular",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                })
            
            if availability_records:
                supabase_client.table("agent_availability").insert(availability_records).execute()
            
            return {
                "agent_id": agent_id,
                "synced_slots": len(availability_records),
                "sync_date": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to sync agent availability: {e}")
            raise


# Global Google Calendar service instance
google_calendar_service = GoogleCalendarService()
