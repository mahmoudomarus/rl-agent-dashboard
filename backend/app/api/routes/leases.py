"""
Lease Agreement Management API routes for long-term rental platform
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Optional
import uuid
from datetime import datetime, date

from app.models.application_schemas import (
    LeaseAgreementCreate, LeaseAgreementUpdate, LeaseAgreementResponse,
    CommissionStatus, ContractType, PaymentSchedule, PaymentMethod,
    FurnishedStatus
)
from app.core.supabase_client import supabase_client
from app.api.dependencies import get_current_user, get_current_agent, verify_property_agent_access
from app.services.cache_service import cache_service
from app.models.schemas import SuccessResponse

router = APIRouter()

# =====================================================================
# LEASE AGREEMENT MANAGEMENT ROUTES
# =====================================================================

@router.post("/", response_model=LeaseAgreementResponse)
async def create_lease_agreement(
    lease_data: LeaseAgreementCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Create a new lease agreement"""
    try:
        # Verify agent access and get agent info
        current_agent = await get_current_agent(current_user)
        
        # Verify property exists and belongs to agent's agency
        property_result = supabase_client.table("properties").select("*").eq("id", lease_data.property_id).execute()
        
        if not property_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )
        
        property_info = property_result.data[0]
        
        # Verify agent can manage this property
        if property_info["agency_id"] != current_agent["agency_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Agent can only create leases for properties in their agency"
            )
        
        # Verify tenant application exists if provided
        if lease_data.tenant_application_id:
            app_result = supabase_client.table("tenant_applications").select("*").eq("id", lease_data.tenant_application_id).execute()
            
            if not app_result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tenant application not found"
                )
            
            application_info = app_result.data[0]
            
            # Verify application is for the same property
            if application_info["property_id"] != lease_data.property_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Application is not for the specified property"
                )
        
        # Generate unique lease ID
        lease_id = str(uuid.uuid4())
        
        # Calculate derived fields
        lease_duration_months = ((lease_data.lease_end_date.year - lease_data.lease_start_date.year) * 12 + 
                                (lease_data.lease_end_date.month - lease_data.lease_start_date.month))
        monthly_rent = float(lease_data.annual_rent) / 12
        commission_percentage = (float(lease_data.broker_commission) / float(lease_data.annual_rent)) * 100 if lease_data.annual_rent > 0 else 0
        
        # Prepare lease agreement data for database
        lease_record = {
            "id": lease_id,
            "property_id": lease_data.property_id,
            "tenant_application_id": lease_data.tenant_application_id,
            "agent_id": lease_data.agent_id,
            "agency_id": lease_data.agency_id,
            "contract_type": lease_data.contract_type.value,
            
            # Parties Information
            "landlord_name": lease_data.landlord_name,
            "landlord_email": lease_data.landlord_email,
            "landlord_phone": lease_data.landlord_phone,
            "landlord_emirates_id": lease_data.landlord_emirates_id,
            
            "tenant_name": lease_data.tenant_name,
            "tenant_email": lease_data.tenant_email,
            "tenant_phone": lease_data.tenant_phone,
            "tenant_emirates_id": lease_data.tenant_emirates_id,
            "tenant_passport": lease_data.tenant_passport,
            
            # Lease Terms
            "lease_start_date": lease_data.lease_start_date.isoformat(),
            "lease_end_date": lease_data.lease_end_date.isoformat(),
            
            # Financial Terms
            "annual_rent": float(lease_data.annual_rent),
            "security_deposit": float(lease_data.security_deposit),
            "broker_commission": float(lease_data.broker_commission),
            
            # Payment Terms
            "payment_schedule": lease_data.payment_schedule.value,
            "payment_method": lease_data.payment_method.value,
            "payment_due_day": lease_data.payment_due_day,
            "late_payment_penalty_percentage": float(lease_data.late_payment_penalty_percentage),
            
            # Additional Charges
            "service_charges_annual": float(lease_data.service_charges_annual),
            "dewa_included": lease_data.dewa_included,
            "internet_included": lease_data.internet_included,
            "maintenance_included": lease_data.maintenance_included,
            "parking_included": lease_data.parking_included,
            "additional_charges": lease_data.additional_charges,
            
            # Contract Terms
            "auto_renewal": lease_data.auto_renewal,
            "renewal_notice_period_days": lease_data.renewal_notice_period_days,
            "early_termination_allowed": lease_data.early_termination_allowed,
            "early_termination_penalty": float(lease_data.early_termination_penalty) if lease_data.early_termination_penalty else None,
            
            # Property Condition
            "furnished_status": lease_data.furnished_status.value if lease_data.furnished_status else None,
            "inventory_list_url": lease_data.inventory_list_url,
            "property_condition_report_url": lease_data.property_condition_report_url,
            
            # Legal Compliance
            "rera_permit_number": lease_data.rera_permit_number,
            "ejari_registration_number": lease_data.ejari_registration_number,
            "municipality_approval": lease_data.municipality_approval,
            
            # Document Management - will be populated by DocuSign integration
            "contract_template_id": None,
            "docusign_envelope_id": None,
            "signed_contract_url": None,
            
            # Signature Status - default to pending
            "landlord_signature_status": "pending",
            "tenant_signature_status": "pending",
            "witness_required": True,
            "witness_signature_status": "pending",
            
            # Agreement Status
            "status": "draft",
            "renewal_eligibility": True,
            
            # Commission Tracking
            "commission_status": CommissionStatus.pending.value,
            
            # Timestamps
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert into database
        result = supabase_client.table("lease_agreements").insert(lease_record).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create lease agreement"
            )
        
        created_lease = result.data[0]
        
        # Update property status to 'leased' if lease is created
        supabase_client.table("properties").update({
            "status": "leased",
            "current_tenant_name": lease_data.tenant_name,
            "lease_expiry_date": lease_data.lease_end_date.isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", lease_data.property_id).execute()
        
        # Update application status if linked
        if lease_data.tenant_application_id:
            supabase_client.table("tenant_applications").update({
                "status": "approved",
                "approved_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", lease_data.tenant_application_id).execute()
        
        # Schedule background tasks
        background_tasks.add_task(
            generate_lease_agreement_document,
            lease_id,
            created_lease
        )
        
        return LeaseAgreementResponse(**created_lease)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create lease agreement: {str(e)}"
        )


@router.get("", response_model=List[LeaseAgreementResponse])
@router.get("/", response_model=List[LeaseAgreementResponse])
async def get_lease_agreements(
    status_filter: Optional[str] = None,
    agent_id: Optional[str] = None,
    property_id: Optional[str] = None,
    contract_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all lease agreements for the current agent's agency"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agency_id = current_agent["agency_id"]
        
        # Query lease agreements for the agent's agency
        query = supabase_client.table("lease_agreements").select("*").eq("agency_id", agency_id)
        
        # Apply filters
        if status_filter:
            query = query.eq("status", status_filter)
        if agent_id:
            query = query.eq("agent_id", agent_id)
        if property_id:
            query = query.eq("property_id", property_id)
        if contract_type:
            query = query.eq("contract_type", contract_type)
        
        result = query.order("created_at", desc=True).execute()
        
        return [LeaseAgreementResponse(**lease_data) for lease_data in result.data]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch lease agreements: {str(e)}"
        )


@router.get("/{lease_id}", response_model=LeaseAgreementResponse)
async def get_lease_agreement(
    lease_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific lease agreement by ID"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agency_id = current_agent["agency_id"]
        
        # Query specific lease agreement
        result = supabase_client.table("lease_agreements").select("*").eq("id", lease_id).eq("agency_id", agency_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lease agreement not found"
            )
        
        return LeaseAgreementResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch lease agreement: {str(e)}"
        )


@router.put("/{lease_id}", response_model=LeaseAgreementResponse)
async def update_lease_agreement(
    lease_id: str,
    lease_updates: LeaseAgreementUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a lease agreement"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agency_id = current_agent["agency_id"]
        
        # Verify lease exists and belongs to agent's agency
        existing_result = supabase_client.table("lease_agreements").select("*").eq("id", lease_id).eq("agency_id", agency_id).execute()
        
        if not existing_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lease agreement not found"
            )
        
        existing_lease = existing_result.data[0]
        
        # Prepare update data
        update_data = {}
        
        # Only update fields that are provided
        if lease_updates.status:
            update_data["status"] = lease_updates.status.value
        if lease_updates.landlord_signature_status:
            update_data["landlord_signature_status"] = lease_updates.landlord_signature_status.value
        if lease_updates.tenant_signature_status:
            update_data["tenant_signature_status"] = lease_updates.tenant_signature_status.value
        if lease_updates.witness_signature_status:
            update_data["witness_signature_status"] = lease_updates.witness_signature_status.value
        if lease_updates.commission_status:
            update_data["commission_status"] = lease_updates.commission_status.value
        if lease_updates.docusign_envelope_id:
            update_data["docusign_envelope_id"] = lease_updates.docusign_envelope_id
        if lease_updates.signed_contract_url:
            update_data["signed_contract_url"] = lease_updates.signed_contract_url
        if lease_updates.rera_permit_number:
            update_data["rera_permit_number"] = lease_updates.rera_permit_number
        if lease_updates.ejari_registration_number:
            update_data["ejari_registration_number"] = lease_updates.ejari_registration_number
        
        # Always update timestamp
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Perform update
        result = supabase_client.table("lease_agreements").update(update_data).eq("id", lease_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update lease agreement"
            )
        
        return LeaseAgreementResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update lease agreement: {str(e)}"
        )


@router.delete("/{lease_id}", response_model=SuccessResponse)
async def delete_lease_agreement(
    lease_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a lease agreement (only if in draft status)"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agency_id = current_agent["agency_id"]
        
        # Verify lease exists and belongs to agent's agency
        existing_result = supabase_client.table("lease_agreements").select("*").eq("id", lease_id).eq("agency_id", agency_id).execute()
        
        if not existing_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lease agreement not found"
            )
        
        existing_lease = existing_result.data[0]
        
        # Only allow deletion of draft leases
        if existing_lease["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only delete lease agreements in draft status"
            )
        
        # Delete lease agreement
        supabase_client.table("lease_agreements").delete().eq("id", lease_id).execute()
        
        # Update property status back to available
        supabase_client.table("properties").update({
            "status": "available",
            "current_tenant_name": None,
            "lease_expiry_date": None,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", existing_lease["property_id"]).execute()
        
        return SuccessResponse(message="Lease agreement deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete lease agreement: {str(e)}"
        )


# =====================================================================
# LEASE AGREEMENT SPECIFIC OPERATIONS
# =====================================================================

@router.post("/{lease_id}/send-for-signature")
async def send_lease_for_signature(
    lease_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Send lease agreement to DocuSign for signatures"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agency_id = current_agent["agency_id"]
        
        # Verify lease exists and belongs to agent's agency
        lease_result = supabase_client.table("lease_agreements").select("*").eq("id", lease_id).eq("agency_id", agency_id).execute()
        
        if not lease_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lease agreement not found"
            )
        
        lease = lease_result.data[0]
        
        # Verify lease is in draft status
        if lease["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only send draft lease agreements for signature"
            )
        
        # Schedule DocuSign envelope creation
        background_tasks.add_task(
            create_docusign_envelope,
            lease_id,
            lease
        )
        
        # Update lease status
        supabase_client.table("lease_agreements").update({
            "status": "sent_for_signature",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", lease_id).execute()
        
        return {"message": "Lease agreement sent for signature", "lease_id": lease_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send lease for signature: {str(e)}"
        )


@router.get("/{lease_id}/signature-status")
async def get_lease_signature_status(
    lease_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get signature status of a lease agreement"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agency_id = current_agent["agency_id"]
        
        # Query lease agreement
        result = supabase_client.table("lease_agreements").select(
            "id, status, landlord_signature_status, tenant_signature_status, witness_signature_status, docusign_envelope_id"
        ).eq("id", lease_id).eq("agency_id", agency_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lease agreement not found"
            )
        
        lease = result.data[0]
        
        return {
            "lease_id": lease_id,
            "status": lease["status"],
            "landlord_signed": lease["landlord_signature_status"] == "signed",
            "tenant_signed": lease["tenant_signature_status"] == "signed",
            "witness_signed": lease["witness_signature_status"] == "signed",
            "docusign_envelope_id": lease["docusign_envelope_id"],
            "fully_executed": (
                lease["landlord_signature_status"] == "signed" and 
                lease["tenant_signature_status"] == "signed" and 
                (lease["witness_signature_status"] == "signed" or lease["witness_signature_status"] == "not_required")
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get signature status: {str(e)}"
        )


@router.post("/{lease_id}/webhook")
async def docusign_webhook_handler(
    lease_id: str,
    webhook_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Handle DocuSign webhook notifications"""
    try:
        # TODO: Implement DocuSign webhook signature verification
        
        envelope_id = webhook_data.get("envelopeId")
        event_type = webhook_data.get("event")
        
        if event_type == "envelope-completed":
            # Update lease agreement status
            supabase_client.table("lease_agreements").update({
                "status": "fully_executed",
                "landlord_signature_status": "signed",
                "tenant_signature_status": "signed",
                "execution_date": datetime.utcnow().date().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", lease_id).eq("docusign_envelope_id", envelope_id).execute()
            
        elif event_type == "envelope-declined":
            # Handle declined signature
            supabase_client.table("lease_agreements").update({
                "status": "cancelled",
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", lease_id).eq("docusign_envelope_id", envelope_id).execute()
        
        return {"message": "Webhook processed successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process webhook: {str(e)}"
        )


# =====================================================================
# BACKGROUND TASK FUNCTIONS
# =====================================================================

async def generate_lease_agreement_document(lease_id: str, lease_data: dict):
    """Generate lease agreement document using template"""
    try:
        # TODO: Implement lease document generation using contract template
        # This will be completed when we implement contract template management
        pass
    except Exception as e:
        print(f"Failed to generate lease document for {lease_id}: {e}")


async def create_docusign_envelope(lease_id: str, lease_data: dict):
    """Create DocuSign envelope for lease agreement"""
    try:
        # TODO: Implement DocuSign envelope creation
        # This will be completed when we implement DocuSign service
        pass
    except Exception as e:
        print(f"Failed to create DocuSign envelope for {lease_id}: {e}")
