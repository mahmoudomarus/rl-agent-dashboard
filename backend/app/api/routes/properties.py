"""
Properties API routes with AI integration
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Optional
import uuid
from datetime import datetime

from app.models.schemas import (
    PropertyCreate, PropertyUpdate, PropertyResponse,
    LeaseType, FurnishedStatus, PropertyStatus,
    AIDescriptionRequest, AIDescriptionResponse,
    AmenitiesSuggestionRequest, AmenitiesSuggestionResponse,
    TitleOptimizationRequest, TitleOptimizationResponse,
    PricingStrategyRequest, PricingStrategyResponse,
    SuccessResponse
)
from app.core.supabase_client import supabase_client
from app.services.ai_service import ai_service
from app.api.dependencies import get_current_user, get_current_agent

router = APIRouter()


@router.post("/", response_model=PropertyResponse)
@router.post("", response_model=PropertyResponse)
async def create_property(
    property_data: PropertyCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Create a new property listing"""
    try:
        # Generate unique property ID
        property_id = str(uuid.uuid4())
        
        # Calculate nights for validation
        # (This will be used for booking calculations later)
        
        # Get agent's agency_id for assignment
        agent_result = None
        agency_id = None
        if property_data.agent_id:
            # Verify agent exists and get agency_id
            agent_result = supabase_client.table("agents").select("id, agency_id").eq("id", property_data.agent_id).execute()
            if agent_result.data:
                agency_id = agent_result.data[0]["agency_id"]
        else:
            # If no agent specified, try to get current user's agent record
            agent_result = supabase_client.table("agents").select("id, agency_id").eq("user_id", current_user["id"]).execute()
            if agent_result.data:
                property_data.agent_id = agent_result.data[0]["id"]
                agency_id = agent_result.data[0]["agency_id"]

        # Prepare long-term rental property data for database
        property_record = {
            "id": property_id,
            "user_id": current_user["id"],
            "title": property_data.title,
            "description": property_data.description,
            "address": property_data.address,
            "city": property_data.city,
            "state": property_data.state,
            "country": property_data.country,
            "latitude": property_data.latitude,
            "longitude": property_data.longitude,
            "property_type": property_data.property_type,
            "bedrooms": property_data.bedrooms,
            "bathrooms": property_data.bathrooms,
            "size_sqft": property_data.size_sqft,
            # Long-term rental specific fields
            "annual_rent": property_data.annual_rent,
            "monthly_rent": property_data.annual_rent / 12,  # Auto-calculate monthly rent
            "security_deposit": property_data.security_deposit or (property_data.annual_rent * 0.05),  # Default 5% of annual
            "commission_rate": property_data.commission_rate,
            "lease_type": property_data.lease_type,
            "furnished_status": property_data.furnished_status,
            "minimum_lease_duration": property_data.minimum_lease_duration,
            "maximum_lease_duration": property_data.maximum_lease_duration,
            # Assignment
            "agent_id": property_data.agent_id,
            "agency_id": agency_id,
            # Additional fields
            "amenities": property_data.amenities,
            "images": property_data.images,
            "status": "available",  # Long-term rentals start as available for lease
            # Initialize counters
            "applications_count": 0,
            "viewings_count": 0,
            "lease_agreements_count": 0,
            "total_commission_earned": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert into database
        result = supabase_client.table("properties").insert(property_record).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create property"
            )
        
        created_property = result.data[0]
        
        # Schedule background AI enhancement if description is not provided
        if not property_data.description:
            background_tasks.add_task(
                enhance_property_with_ai,
                property_id,
                property_data.dict()
            )
        
        return PropertyResponse(**created_property)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create property: {str(e)}"
        )


@router.get("", response_model=List[PropertyResponse])
@router.get("/", response_model=List[PropertyResponse])
async def get_agency_properties(
    status_filter: Optional[str] = None,
    property_type: Optional[str] = None,
    lease_type: Optional[str] = None,
    furnished_status: Optional[str] = None,
    agent_id: Optional[str] = None,
    min_rent: Optional[float] = None,
    max_rent: Optional[float] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all properties for the current agent's agency with long-term rental filters"""
    try:
        # Get current user's agent information
        agent_result = supabase_client.table("agents").select("id, agency_id").eq("user_id", current_user["id"]).execute()
        
        if not agent_result.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User must be an agent to access properties"
            )
        
        current_agent = agent_result.data[0]
        agency_id = current_agent["agency_id"]
        
        # Query properties for the agent's agency
        query = supabase_client.table("properties").select("*").eq("agency_id", agency_id)
        
        # Apply long-term rental specific filters
        if status_filter:
            query = query.eq("status", status_filter)
        if property_type:
            query = query.eq("property_type", property_type)
        if lease_type:
            query = query.eq("lease_type", lease_type)
        if furnished_status:
            query = query.eq("furnished_status", furnished_status)
        if agent_id:
            query = query.eq("agent_id", agent_id)
        if min_rent:
            query = query.gte("annual_rent", min_rent)
        if max_rent:
            query = query.lte("annual_rent", max_rent)
        
        result = query.order("created_at", desc=True).execute()
        
        return [PropertyResponse(**property_data) for property_data in result.data]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch properties: {str(e)}"
        )


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific property (agency-based access)"""
    try:
        # Get current user's agent information
        agent_result = supabase_client.table("agents").select("id, agency_id").eq("user_id", current_user["id"]).execute()
        
        if not agent_result.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User must be an agent to access properties"
            )
        
        current_agent = agent_result.data[0]
        agency_id = current_agent["agency_id"]
        
        # Query property with agency access control
        result = supabase_client.table("properties").select("*").eq("id", property_id).eq("agency_id", agency_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found or access denied"
            )
        
        return PropertyResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch property: {str(e)}"
        )


@router.put("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: str,
    property_updates: PropertyUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a property"""
    try:
        # Verify property ownership
        existing = supabase_client.table("properties").select("*").eq("id", property_id).eq("user_id", current_user["id"]).execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )
        
        # Prepare update data (only include non-None values)
        update_data = {k: v for k, v in property_updates.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Update in database
        result = supabase_client.table("properties").update(update_data).eq("id", property_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update property"
            )
        
        return PropertyResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update property: {str(e)}"
        )


@router.delete("/{property_id}", response_model=SuccessResponse)
async def delete_property(
    property_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a property"""
    try:
        # Verify property ownership
        existing = supabase_client.table("properties").select("*").eq("id", property_id).eq("user_id", current_user["id"]).execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )
        
        # Check if property has active bookings
        bookings = supabase_client.table("bookings").select("*").eq("property_id", property_id).in_("status", ["pending", "confirmed"]).execute()
        
        if bookings.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete property with active bookings"
            )
        
        # Delete property
        supabase_client.table("properties").delete().eq("id", property_id).execute()
        
        return SuccessResponse(message="Property deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete property: {str(e)}"
        )


# AI Enhancement Endpoints

@router.post("/ai/generate-description", response_model=AIDescriptionResponse)
async def generate_property_description(
    request: AIDescriptionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate AI-powered property description"""
    try:
        result = await ai_service.generate_property_description(
            property_data=request.property_data,
            use_anthropic=request.use_anthropic
        )
        
        return AIDescriptionResponse(
            description=result.get("description", ""),
            summary=result.get("summary", ""),
            highlights=result.get("highlights", [])
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate description: {str(e)}"
        )


@router.post("/ai/suggest-amenities", response_model=AmenitiesSuggestionResponse)
async def suggest_amenities(
    request: AmenitiesSuggestionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get AI-powered amenities suggestions"""
    try:
        suggestions = await ai_service.generate_amenities_suggestions(
            property_data=request.property_data,
            existing_amenities=request.existing_amenities
        )
        
        return AmenitiesSuggestionResponse(suggested_amenities=suggestions)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to suggest amenities: {str(e)}"
        )


@router.post("/ai/optimize-title", response_model=TitleOptimizationResponse)
async def optimize_title(
    request: TitleOptimizationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get AI-optimized title suggestions"""
    try:
        optimized_titles = await ai_service.optimize_listing_title(
            original_title=request.original_title,
            property_data=request.property_data
        )
        
        return TitleOptimizationResponse(optimized_titles=optimized_titles)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to optimize title: {str(e)}"
        )


@router.post("/ai/pricing-strategy", response_model=PricingStrategyResponse)
async def generate_pricing_strategy(
    request: PricingStrategyRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get AI-powered pricing strategy"""
    try:
        strategy = await ai_service.generate_pricing_strategy(
            property_data=request.property_data,
            market_data=request.market_data
        )
        
        return PricingStrategyResponse(**strategy)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate pricing strategy: {str(e)}"
        )


@router.post("/{property_id}/enhance-with-ai", response_model=SuccessResponse)
async def enhance_property_with_ai_endpoint(
    property_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Enhance property listing with AI-generated content"""
    try:
        # Verify property ownership
        result = supabase_client.table("properties").select("*").eq("id", property_id).eq("user_id", current_user["id"]).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )
        
        property_data = result.data[0]
        
        # Schedule AI enhancement
        background_tasks.add_task(
            enhance_property_with_ai,
            property_id,
            property_data
        )
        
        return SuccessResponse(message="AI enhancement started. Your property will be updated shortly.")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start AI enhancement: {str(e)}"
        )


# Background Tasks

async def enhance_property_with_ai(property_id: str, property_data: dict):
    """Background task to enhance property with AI-generated content"""
    try:
        updates = {}
        
        # Generate description if missing
        if not property_data.get("description"):
            description_result = await ai_service.generate_property_description(property_data)
            if description_result.get("description"):
                updates["description"] = description_result["description"]
        
        # Suggest additional amenities
        if len(property_data.get("amenities", [])) < 5:
            suggested_amenities = await ai_service.generate_amenities_suggestions(
                property_data=property_data,
                existing_amenities=property_data.get("amenities", [])
            )
            
            # Add up to 3 suggested amenities
            current_amenities = property_data.get("amenities", [])
            new_amenities = current_amenities + suggested_amenities[:3]
            updates["amenities"] = new_amenities
        
        # Update property if we have enhancements
        if updates:
            updates["updated_at"] = datetime.utcnow().isoformat()
            supabase_client.table("properties").update(updates).eq("id", property_id).execute()
            
    except Exception as e:
        # Log error but don't raise - this is a background task
        print(f"AI enhancement failed for property {property_id}: {e}")


@router.post("/{property_id}/publish", response_model=PropertyResponse)
async def publish_property(
    property_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Publish a property (change status from draft to active)"""
    try:
        # Verify property ownership
        result = supabase_client.table("properties").select("*").eq("id", property_id).eq("user_id", current_user["id"]).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )
        
        property_data = result.data[0]
        
        # Validate property is ready for publishing
        if not property_data.get("description"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Property needs a description before publishing"
            )
        
        if not property_data.get("images"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Property needs at least one image before publishing"
            )
        
        # Update status to active
        update_result = supabase_client.table("properties").update({
            "status": "active",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", property_id).execute()
        
        return PropertyResponse(**update_result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to publish property: {str(e)}"
        )
