"""
Contract Template Management API routes for long-term rental platform
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date

from app.models.application_schemas import (
    ContractTemplateCreate, ContractTemplateUpdate, ContractTemplateResponse,
    ContractType, TemplateStatus
)
from app.core.supabase_client import supabase_client
from app.api.dependencies import get_current_user, get_current_agent
from app.services.cache_service import cache_service
from app.services.docusign_service import docusign_service
from app.models.schemas import SuccessResponse

router = APIRouter()

# =====================================================================
# CONTRACT TEMPLATE MANAGEMENT ROUTES
# =====================================================================

@router.post("/", response_model=ContractTemplateResponse)
async def create_contract_template(
    template_data: ContractTemplateCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Create a new contract template"""
    try:
        # Verify agent access and get agent info
        current_agent = await get_current_agent(current_user)
        agency_id = current_agent["agency_id"]
        
        # Generate unique template ID
        template_id = str(uuid.uuid4())
        
        # Prepare template data for database
        template_record = {
            "id": template_id,
            "agency_id": agency_id,
            "template_name": template_data.template_name,
            "template_version": template_data.template_version,
            "description": template_data.description,
            "property_type": template_data.property_type.value if template_data.property_type else None,
            "contract_language": template_data.contract_language,
            "emirates": template_data.emirates,
            "template_content": template_data.template_content,
            "rera_compliant": template_data.rera_compliant,
            "dubai_land_department_approved": template_data.dubai_land_department_approved,
            "municipality_approved": template_data.municipality_approved,
            "legal_review_date": template_data.legal_review_date.isoformat() if template_data.legal_review_date else None,
            "legal_reviewer_name": template_data.legal_reviewer_name,
            "usage_count": 0,
            "success_rate": 0,
            "status": TemplateStatus.draft.value,
            "is_default": template_data.is_default,
            "parent_template_id": template_data.parent_template_id,
            "changelog": template_data.changelog or [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert into database
        result = supabase_client.table("contract_templates").insert(template_record).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create contract template"
            )
        
        created_template = result.data[0]
        
        # If set as default, unset other default templates for this agency and property type
        if template_data.is_default:
            await _unset_other_default_templates(agency_id, template_data.property_type, template_id)
        
        # Schedule background task to create DocuSign template if content is provided
        if template_data.template_content:
            background_tasks.add_task(
                create_docusign_template_from_content,
                template_id,
                template_data.template_name,
                template_data.template_content
            )
        
        return ContractTemplateResponse(**created_template)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create contract template: {str(e)}"
        )


@router.get("", response_model=List[ContractTemplateResponse])
@router.get("/", response_model=List[ContractTemplateResponse])
async def get_contract_templates(
    property_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    contract_language: Optional[str] = None,
    emirates: Optional[str] = None,
    rera_compliant: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all contract templates for the current agent's agency"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agency_id = current_agent["agency_id"]
        
        # Query contract templates for the agent's agency
        query = supabase_client.table("contract_templates").select("*").eq("agency_id", agency_id)
        
        # Apply filters
        if property_type:
            query = query.eq("property_type", property_type)
        if status_filter:
            query = query.eq("status", status_filter)
        if contract_language:
            query = query.eq("contract_language", contract_language)
        if emirates:
            query = query.eq("emirates", emirates)
        if rera_compliant is not None:
            query = query.eq("rera_compliant", rera_compliant)
        
        result = query.order("created_at", desc=True).execute()
        
        return [ContractTemplateResponse(**template_data) for template_data in result.data]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch contract templates: {str(e)}"
        )


@router.get("/{template_id}", response_model=ContractTemplateResponse)
async def get_contract_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific contract template by ID"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agency_id = current_agent["agency_id"]
        
        # Query specific contract template
        result = supabase_client.table("contract_templates").select("*").eq("id", template_id).eq("agency_id", agency_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract template not found"
            )
        
        return ContractTemplateResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch contract template: {str(e)}"
        )


@router.put("/{template_id}", response_model=ContractTemplateResponse)
async def update_contract_template(
    template_id: str,
    template_updates: ContractTemplateUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a contract template"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agency_id = current_agent["agency_id"]
        
        # Verify template exists and belongs to agent's agency
        existing_result = supabase_client.table("contract_templates").select("*").eq("id", template_id).eq("agency_id", agency_id).execute()
        
        if not existing_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract template not found"
            )
        
        existing_template = existing_result.data[0]
        
        # Prepare update data
        update_data = {}
        
        # Only update fields that are provided
        if template_updates.template_name:
            update_data["template_name"] = template_updates.template_name
        if template_updates.description:
            update_data["description"] = template_updates.description
        if template_updates.template_content:
            update_data["template_content"] = template_updates.template_content
        if template_updates.status:
            update_data["status"] = template_updates.status.value
        if template_updates.rera_compliant is not None:
            update_data["rera_compliant"] = template_updates.rera_compliant
        if template_updates.dubai_land_department_approved is not None:
            update_data["dubai_land_department_approved"] = template_updates.dubai_land_department_approved
        if template_updates.municipality_approved is not None:
            update_data["municipality_approved"] = template_updates.municipality_approved
        if template_updates.legal_review_date:
            update_data["legal_review_date"] = template_updates.legal_review_date.isoformat()
        if template_updates.legal_reviewer_name:
            update_data["legal_reviewer_name"] = template_updates.legal_reviewer_name
        if template_updates.is_default is not None:
            update_data["is_default"] = template_updates.is_default
        if template_updates.changelog:
            # Append to existing changelog
            existing_changelog = existing_template.get("changelog", [])
            update_data["changelog"] = existing_changelog + template_updates.changelog
        
        # Always update timestamp and increment version
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Auto-increment version if content changed
        if template_updates.template_content:
            current_version = existing_template.get("template_version", "1.0")
            try:
                version_parts = current_version.split(".")
                minor_version = int(version_parts[1]) + 1
                update_data["template_version"] = f"{version_parts[0]}.{minor_version}"
            except (IndexError, ValueError):
                update_data["template_version"] = "1.1"
        
        # Perform update
        result = supabase_client.table("contract_templates").update(update_data).eq("id", template_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update contract template"
            )
        
        # Handle default template logic
        if template_updates.is_default:
            await _unset_other_default_templates(agency_id, existing_template.get("property_type"), template_id)
        
        return ContractTemplateResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update contract template: {str(e)}"
        )


@router.delete("/{template_id}", response_model=SuccessResponse)
async def delete_contract_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a contract template (only if not used in any leases)"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agency_id = current_agent["agency_id"]
        
        # Verify template exists and belongs to agent's agency
        existing_result = supabase_client.table("contract_templates").select("*").eq("id", template_id).eq("agency_id", agency_id).execute()
        
        if not existing_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract template not found"
            )
        
        existing_template = existing_result.data[0]
        
        # Check if template is used in any lease agreements
        lease_usage = supabase_client.table("lease_agreements").select("id").eq("contract_template_id", template_id).execute()
        
        if lease_usage.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete template. It is used in {len(lease_usage.data)} lease agreement(s)"
            )
        
        # Delete template
        supabase_client.table("contract_templates").delete().eq("id", template_id).execute()
        
        return SuccessResponse(message="Contract template deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete contract template: {str(e)}"
        )


# =====================================================================
# TEMPLATE SPECIFIC OPERATIONS
# =====================================================================

@router.post("/{template_id}/duplicate", response_model=ContractTemplateResponse)
async def duplicate_contract_template(
    template_id: str,
    new_name: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Create a copy of an existing contract template"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agency_id = current_agent["agency_id"]
        
        # Get original template
        original_result = supabase_client.table("contract_templates").select("*").eq("id", template_id).eq("agency_id", agency_id).execute()
        
        if not original_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract template not found"
            )
        
        original_template = original_result.data[0]
        
        # Create duplicate
        new_template_id = str(uuid.uuid4())
        duplicate_name = new_name or f"{original_template['template_name']} (Copy)"
        
        duplicate_data = {
            **original_template,
            "id": new_template_id,
            "template_name": duplicate_name,
            "template_version": "1.0",
            "parent_template_id": template_id,
            "is_default": False,  # Copies are never default
            "usage_count": 0,
            "success_rate": 0,
            "status": TemplateStatus.draft.value,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "changelog": [f"Duplicated from template: {original_template['template_name']}"]
        }
        
        # Remove fields that shouldn't be copied
        duplicate_data.pop("docusign_template_id", None)
        
        # Insert duplicate
        result = supabase_client.table("contract_templates").insert(duplicate_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to duplicate contract template"
            )
        
        return ContractTemplateResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to duplicate contract template: {str(e)}"
        )


@router.post("/{template_id}/activate", response_model=ContractTemplateResponse)
async def activate_contract_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Activate a contract template for use"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agency_id = current_agent["agency_id"]
        
        # Update template status to active
        result = supabase_client.table("contract_templates").update({
            "status": TemplateStatus.active.value,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", template_id).eq("agency_id", agency_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract template not found"
            )
        
        return ContractTemplateResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to activate contract template: {str(e)}"
        )


@router.get("/{template_id}/usage-stats")
async def get_template_usage_stats(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get usage statistics for a contract template"""
    try:
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agency_id = current_agent["agency_id"]
        
        # Verify template exists and belongs to agent's agency
        template_result = supabase_client.table("contract_templates").select("*").eq("id", template_id).eq("agency_id", agency_id).execute()
        
        if not template_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract template not found"
            )
        
        template = template_result.data[0]
        
        # Get lease agreements that used this template
        leases_result = supabase_client.table("lease_agreements").select("id, status, created_at").eq("contract_template_id", template_id).execute()
        
        leases = leases_result.data
        total_uses = len(leases)
        
        # Calculate success rate
        completed_leases = [lease for lease in leases if lease["status"] in ["fully_executed", "active"]]
        success_rate = (len(completed_leases) / total_uses * 100) if total_uses > 0 else 0
        
        # Monthly usage stats
        monthly_usage = {}
        for lease in leases:
            month_key = lease["created_at"][:7]  # YYYY-MM
            monthly_usage[month_key] = monthly_usage.get(month_key, 0) + 1
        
        return {
            "template_id": template_id,
            "template_name": template["template_name"],
            "total_uses": total_uses,
            "success_rate": round(success_rate, 2),
            "completed_leases": len(completed_leases),
            "monthly_usage": monthly_usage,
            "last_used": max([lease["created_at"] for lease in leases]) if leases else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get template usage stats: {str(e)}"
        )


@router.post("/upload-template", response_model=ContractTemplateResponse)
async def upload_contract_template_file(
    file: UploadFile = File(...),
    template_name: str = None,
    property_type: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Upload a contract template file (PDF/DOCX)"""
    try:
        # Validate file type
        allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF and DOCX files are allowed"
            )
        
        # Get current user's agent information
        current_agent = await get_current_agent(current_user)
        agency_id = current_agent["agency_id"]
        
        # Read file content
        file_content = await file.read()
        
        # TODO: Process file content (extract text, convert to template format)
        # For now, store as base64 encoded content
        import base64
        template_content = {
            "file_name": file.filename,
            "content_type": file.content_type,
            "content": base64.b64encode(file_content).decode(),
            "uploaded_at": datetime.utcnow().isoformat()
        }
        
        # Create template record
        template_id = str(uuid.uuid4())
        template_record = {
            "id": template_id,
            "agency_id": agency_id,
            "template_name": template_name or file.filename.split('.')[0],
            "template_version": "1.0",
            "description": f"Uploaded template: {file.filename}",
            "property_type": property_type,
            "contract_language": "en",
            "template_content": template_content,
            "status": TemplateStatus.draft.value,
            "is_default": False,
            "usage_count": 0,
            "success_rate": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert into database
        result = supabase_client.table("contract_templates").insert(template_record).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload contract template"
            )
        
        return ContractTemplateResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload contract template: {str(e)}"
        )


# =====================================================================
# HELPER FUNCTIONS
# =====================================================================

async def _unset_other_default_templates(agency_id: str, property_type: Optional[str], current_template_id: str):
    """Unset default flag for other templates of the same property type"""
    try:
        query = supabase_client.table("contract_templates").update({
            "is_default": False,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("agency_id", agency_id).eq("is_default", True).neq("id", current_template_id)
        
        if property_type:
            query = query.eq("property_type", property_type)
        
        query.execute()
        
    except Exception as e:
        logger.error(f"Failed to unset other default templates: {e}")


# =====================================================================
# BACKGROUND TASK FUNCTIONS
# =====================================================================

async def create_docusign_template_from_content(template_id: str, template_name: str, template_content: Dict[str, Any]):
    """Create DocuSign template from contract content"""
    try:
        # TODO: Convert template content to DocuSign format
        # This will integrate with the DocuSign service once it's fully implemented
        
        # For now, just log the action
        logger.info(f"Creating DocuSign template for {template_id}: {template_name}")
        
        # In the future, this will:
        # 1. Convert template content to proper format
        # 2. Create DocuSign template
        # 3. Update template record with DocuSign template ID
        
    except Exception as e:
        logger.error(f"Failed to create DocuSign template for {template_id}: {e}")


import logging
logger = logging.getLogger(__name__)
