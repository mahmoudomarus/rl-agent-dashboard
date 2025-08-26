"""
Google Calendar Integration API routes for agent scheduling
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.core.supabase_client import supabase_client
from app.api.dependencies import get_current_user, get_current_agent
from app.services.google_calendar_service import google_calendar_service
from app.models.schemas import SuccessResponse

router = APIRouter()

# =====================================================================
# GOOGLE CALENDAR INTEGRATION ROUTES
# =====================================================================

@router.get("/connect")
async def connect_google_calendar(
    current_user: dict = Depends(get_current_user)
):
    """Get Google Calendar authorization URL for agent"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agent_id = current_agent["id"]
        
        # Get authorization URL
        auth_url = google_calendar_service.get_authorization_url(agent_id)
        
        return {
            "authorization_url": auth_url,
            "message": "Visit the authorization URL to connect your Google Calendar"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get authorization URL: {str(e)}"
        )


@router.post("/oauth/callback")
async def google_calendar_oauth_callback(
    code: str,
    state: str,
    current_user: dict = Depends(get_current_user)
):
    """Handle Google OAuth callback"""
    try:
        # Handle OAuth callback
        result = await google_calendar_service.handle_oauth_callback(code, state)
        
        return {
            "message": "Google Calendar connected successfully",
            "agent_id": result["agent_id"],
            "calendar_connected": result["calendar_connected"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect Google Calendar: {str(e)}"
        )


@router.get("/status")
async def get_calendar_connection_status(
    current_user: dict = Depends(get_current_user)
):
    """Get Google Calendar connection status for current agent"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        
        calendar_connected = bool(current_agent.get("google_calendar_id"))
        
        return {
            "agent_id": current_agent["id"],
            "calendar_connected": calendar_connected,
            "calendar_id": current_agent.get("google_calendar_id"),
            "last_sync": current_agent.get("updated_at")
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get calendar status: {str(e)}"
        )


@router.post("/sync-availability")
async def sync_agent_availability(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Sync agent availability with Google Calendar"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agent_id = current_agent["id"]
        
        # Schedule background sync
        background_tasks.add_task(
            google_calendar_service.sync_agent_availability,
            agent_id
        )
        
        return {
            "message": "Availability sync scheduled",
            "agent_id": agent_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync availability: {str(e)}"
        )


@router.get("/availability")
async def get_agent_availability(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: dict = Depends(get_current_user)
):
    """Get agent availability for date range"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agent_id = current_agent["id"]
        
        # Parse dates
        start_dt = datetime.fromisoformat(start_date)
        end_dt = datetime.fromisoformat(end_date)
        
        # Get availability from Google Calendar
        availability = await google_calendar_service.get_agent_availability(
            agent_id, start_dt, end_dt
        )
        
        return {
            "agent_id": agent_id,
            "start_date": start_date,
            "end_date": end_date,
            "available_slots": availability
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get availability: {str(e)}"
        )


@router.post("/create-viewing-event")
async def create_viewing_calendar_event(
    viewing_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Create Google Calendar event for a property viewing"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agent_id = current_agent["id"]
        
        # Get viewing details
        viewing_result = supabase_client.table("property_viewings").select("*").eq("id", viewing_id).execute()
        
        if not viewing_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Viewing not found"
            )
        
        viewing_data = viewing_result.data[0]
        
        # Verify agent can access this viewing
        if viewing_data["agent_id"] != agent_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Agent can only create calendar events for their own viewings"
            )
        
        # Create calendar event
        result = await google_calendar_service.create_viewing_event(agent_id, {
            **viewing_data,
            "viewing_id": viewing_id
        })
        
        return {
            "message": "Calendar event created successfully",
            "viewing_id": viewing_id,
            "calendar_event_id": result["calendar_event_id"],
            "event_link": result.get("event_link"),
            "meeting_link": result.get("meeting_link")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create calendar event: {str(e)}"
        )


@router.put("/update-viewing-event/{viewing_id}")
async def update_viewing_calendar_event(
    viewing_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Update Google Calendar event for a property viewing"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agent_id = current_agent["id"]
        
        # Get viewing details
        viewing_result = supabase_client.table("property_viewings").select("*").eq("id", viewing_id).execute()
        
        if not viewing_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Viewing not found"
            )
        
        viewing_data = viewing_result.data[0]
        
        # Verify agent can access this viewing
        if viewing_data["agent_id"] != agent_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Agent can only update calendar events for their own viewings"
            )
        
        # Update calendar event
        result = await google_calendar_service.update_viewing_event(
            agent_id, viewing_id, viewing_data
        )
        
        return {
            "message": "Calendar event updated successfully",
            "viewing_id": viewing_id,
            "calendar_event_id": result["calendar_event_id"],
            "event_link": result.get("event_link")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update calendar event: {str(e)}"
        )


@router.delete("/cancel-viewing-event/{viewing_id}")
async def cancel_viewing_calendar_event(
    viewing_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancel Google Calendar event for a property viewing"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agent_id = current_agent["id"]
        
        # Cancel calendar event
        result = await google_calendar_service.cancel_viewing_event(agent_id, viewing_id)
        
        return {
            "message": "Calendar event cancelled successfully",
            "viewing_id": viewing_id,
            "cancelled": result["cancelled"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel calendar event: {str(e)}"
        )


@router.post("/disconnect")
async def disconnect_google_calendar(
    current_user: dict = Depends(get_current_user)
):
    """Disconnect Google Calendar integration for agent"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agent_id = current_agent["id"]
        
        # Clear Google Calendar credentials
        supabase_client.table("agents").update({
            "google_calendar_id": None,
            "google_credentials": None,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", agent_id).execute()
        
        # Clear agent availability data
        supabase_client.table("agent_availability").delete().eq("agent_id", agent_id).execute()
        
        return {
            "message": "Google Calendar disconnected successfully",
            "agent_id": agent_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to disconnect Google Calendar: {str(e)}"
        )
