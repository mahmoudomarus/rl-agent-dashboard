"""
DocuSign Integration Service for Lease Agreement Management
"""

from docusign_esign import ApiClient, EnvelopesApi, EnvelopeDefinition, Document, Signer, SignHere, Tabs, Recipients
from docusign_esign.rest import ApiException
from typing import Dict, List, Optional, Any
import json
import base64
import logging
from datetime import datetime
import os

from app.core.config import settings
from app.core.supabase_client import supabase_client

logger = logging.getLogger(__name__)

class DocuSignService:
    def __init__(self):
        self.api_client = None
        self.base_url = settings.docusign_base_url
        self.integrator_key = settings.docusign_integrator_key
        self.user_id = settings.docusign_user_id
        self.account_id = settings.docusign_account_id
        
        if self.integrator_key and self.user_id and self.account_id:
            try:
                self.api_client = ApiClient(base_path=self.base_url + "/restapi")
                self.api_client.set_default_header("Authorization", f"Bearer {self._get_access_token()}")
                logger.info("DocuSign client initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize DocuSign client: {e}")
                self.api_client = None
        else:
            logger.warning("DocuSign configuration incomplete. DocuSign features will be disabled.")
    
    def _get_access_token(self) -> str:
        """
        Get DocuSign access token using JWT authentication
        In production, implement proper OAuth2 JWT authentication
        """
        # TODO: Implement proper JWT authentication for DocuSign
        # For now, return a placeholder token
        # In production, you would:
        # 1. Generate JWT token using private key
        # 2. Exchange JWT for access token
        # 3. Cache and refresh tokens as needed
        return "placeholder_token"
    
    async def create_lease_agreement_envelope(
        self,
        lease_id: str,
        lease_data: Dict[str, Any],
        contract_content: str
    ) -> Dict[str, Any]:
        """
        Create a DocuSign envelope for lease agreement signing
        """
        try:
            if not self.api_client:
                raise Exception("DocuSign client not initialized")
            
            # Create envelope definition
            envelope_definition = EnvelopeDefinition()
            envelope_definition.email_subject = f"Lease Agreement - {lease_data['property_title']}"
            envelope_definition.email_blurb = "Please review and sign the lease agreement"
            
            # Create document from contract content
            document = Document()
            document.document_base64 = base64.b64encode(contract_content.encode()).decode()
            document.name = f"Lease_Agreement_{lease_id}.pdf"
            document.file_extension = "pdf"
            document.document_id = "1"
            
            envelope_definition.documents = [document]
            
            # Create signers
            signers = self._create_signers(lease_data)
            
            # Create recipients
            recipients = Recipients()
            recipients.signers = signers
            envelope_definition.recipients = recipients
            
            # Set envelope status to 'sent' to send immediately
            envelope_definition.status = "sent"
            
            # Create envelope
            envelopes_api = EnvelopesApi(self.api_client)
            envelope_summary = envelopes_api.create_envelope(
                account_id=self.account_id,
                envelope_definition=envelope_definition
            )
            
            # Update lease agreement with DocuSign envelope ID
            await self._update_lease_with_envelope_id(lease_id, envelope_summary.envelope_id)
            
            return {
                "envelope_id": envelope_summary.envelope_id,
                "status": envelope_summary.status,
                "uri": envelope_summary.uri
            }
            
        except ApiException as e:
            logger.error(f"DocuSign API error: {e}")
            raise Exception(f"Failed to create DocuSign envelope: {e}")
        except Exception as e:
            logger.error(f"DocuSign service error: {e}")
            raise
    
    def _create_signers(self, lease_data: Dict[str, Any]) -> List[Signer]:
        """Create DocuSign signers for lease agreement"""
        signers = []
        
        # Landlord signer
        landlord = Signer()
        landlord.email = lease_data.get("landlord_email")
        landlord.name = lease_data.get("landlord_name")
        landlord.recipient_id = "1"
        landlord.routing_order = "1"
        
        # Add signature tabs for landlord
        landlord_sign_here = SignHere()
        landlord_sign_here.document_id = "1"
        landlord_sign_here.page_number = "1"
        landlord_sign_here.x_position = "100"
        landlord_sign_here.y_position = "100"
        landlord_sign_here.tab_label = "landlord_signature"
        
        landlord_tabs = Tabs()
        landlord_tabs.sign_here_tabs = [landlord_sign_here]
        landlord.tabs = landlord_tabs
        
        signers.append(landlord)
        
        # Tenant signer
        tenant = Signer()
        tenant.email = lease_data.get("tenant_email")
        tenant.name = lease_data.get("tenant_name")
        tenant.recipient_id = "2"
        tenant.routing_order = "2"
        
        # Add signature tabs for tenant
        tenant_sign_here = SignHere()
        tenant_sign_here.document_id = "1"
        tenant_sign_here.page_number = "1"
        tenant_sign_here.x_position = "100"
        tenant_sign_here.y_position = "200"
        tenant_sign_here.tab_label = "tenant_signature"
        
        tenant_tabs = Tabs()
        tenant_tabs.sign_here_tabs = [tenant_sign_here]
        tenant.tabs = tenant_tabs
        
        signers.append(tenant)
        
        # Witness signer (if required)
        if lease_data.get("witness_required", True):
            witness = Signer()
            witness.email = lease_data.get("witness_email", "witness@agency.com")
            witness.name = lease_data.get("witness_name", "Agency Witness")
            witness.recipient_id = "3"
            witness.routing_order = "3"
            
            # Add signature tabs for witness
            witness_sign_here = SignHere()
            witness_sign_here.document_id = "1"
            witness_sign_here.page_number = "1"
            witness_sign_here.x_position = "100"
            witness_sign_here.y_position = "300"
            witness_sign_here.tab_label = "witness_signature"
            
            witness_tabs = Tabs()
            witness_tabs.sign_here_tabs = [witness_sign_here]
            witness.tabs = witness_tabs
            
            signers.append(witness)
        
        return signers
    
    async def _update_lease_with_envelope_id(self, lease_id: str, envelope_id: str):
        """Update lease agreement with DocuSign envelope ID"""
        try:
            supabase_client.table("lease_agreements").update({
                "docusign_envelope_id": envelope_id,
                "status": "sent_for_signature",
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", lease_id).execute()
        except Exception as e:
            logger.error(f"Failed to update lease with envelope ID: {e}")
    
    async def get_envelope_status(self, envelope_id: str) -> Dict[str, Any]:
        """Get the status of a DocuSign envelope"""
        try:
            if not self.api_client:
                raise Exception("DocuSign client not initialized")
            
            envelopes_api = EnvelopesApi(self.api_client)
            envelope = envelopes_api.get_envelope(
                account_id=self.account_id,
                envelope_id=envelope_id
            )
            
            return {
                "envelope_id": envelope.envelope_id,
                "status": envelope.status,
                "created_date": envelope.created_date_time,
                "completed_date": envelope.completed_date_time,
                "voided_date": envelope.voided_date_time
            }
            
        except ApiException as e:
            logger.error(f"DocuSign API error getting envelope status: {e}")
            raise Exception(f"Failed to get envelope status: {e}")
        except Exception as e:
            logger.error(f"DocuSign service error: {e}")
            raise
    
    async def get_envelope_recipients(self, envelope_id: str) -> List[Dict[str, Any]]:
        """Get the recipients and their signing status for an envelope"""
        try:
            if not self.api_client:
                raise Exception("DocuSign client not initialized")
            
            envelopes_api = EnvelopesApi(self.api_client)
            recipients = envelopes_api.list_recipients(
                account_id=self.account_id,
                envelope_id=envelope_id
            )
            
            recipient_list = []
            
            # Process signers
            if recipients.signers:
                for signer in recipients.signers:
                    recipient_list.append({
                        "recipient_id": signer.recipient_id,
                        "name": signer.name,
                        "email": signer.email,
                        "status": signer.status,
                        "type": "signer",
                        "signed_date": signer.signed_date_time,
                        "delivered_date": signer.delivered_date_time
                    })
            
            return recipient_list
            
        except ApiException as e:
            logger.error(f"DocuSign API error getting recipients: {e}")
            raise Exception(f"Failed to get envelope recipients: {e}")
        except Exception as e:
            logger.error(f"DocuSign service error: {e}")
            raise
    
    async def download_completed_document(self, envelope_id: str) -> bytes:
        """Download the completed and signed document"""
        try:
            if not self.api_client:
                raise Exception("DocuSign client not initialized")
            
            envelopes_api = EnvelopesApi(self.api_client)
            
            # Download combined document (all documents in one PDF)
            document_bytes = envelopes_api.get_document(
                account_id=self.account_id,
                envelope_id=envelope_id,
                document_id="combined"
            )
            
            return document_bytes
            
        except ApiException as e:
            logger.error(f"DocuSign API error downloading document: {e}")
            raise Exception(f"Failed to download document: {e}")
        except Exception as e:
            logger.error(f"DocuSign service error: {e}")
            raise
    
    async def process_webhook_notification(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process DocuSign webhook notification"""
        try:
            envelope_id = webhook_data.get("data", {}).get("envelopeId")
            event_type = webhook_data.get("event")
            
            if not envelope_id:
                raise Exception("Envelope ID not found in webhook data")
            
            # Find lease agreement by envelope ID
            lease_result = supabase_client.table("lease_agreements").select("*").eq("docusign_envelope_id", envelope_id).execute()
            
            if not lease_result.data:
                logger.warning(f"Lease agreement not found for envelope ID: {envelope_id}")
                return {"status": "error", "message": "Lease agreement not found"}
            
            lease = lease_result.data[0]
            lease_id = lease["id"]
            
            # Process different event types
            update_data = {}
            
            if event_type == "envelope-completed":
                update_data.update({
                    "status": "fully_executed",
                    "landlord_signature_status": "signed",
                    "tenant_signature_status": "signed",
                    "execution_date": datetime.utcnow().date().isoformat()
                })
                
                # Download and store signed document
                try:
                    document_bytes = await self.download_completed_document(envelope_id)
                    signed_url = await self._store_signed_document(lease_id, document_bytes)
                    update_data["signed_contract_url"] = signed_url
                except Exception as e:
                    logger.error(f"Failed to download signed document: {e}")
            
            elif event_type == "envelope-declined":
                update_data.update({
                    "status": "cancelled",
                    "landlord_signature_status": "declined"
                })
            
            elif event_type == "envelope-voided":
                update_data.update({
                    "status": "cancelled"
                })
            
            elif event_type == "recipient-completed":
                # Update specific recipient status
                recipient_data = webhook_data.get("data", {})
                recipient_email = recipient_data.get("recipientEmail")
                
                if recipient_email == lease.get("landlord_email"):
                    update_data["landlord_signature_status"] = "signed"
                elif recipient_email == lease.get("tenant_email"):
                    update_data["tenant_signature_status"] = "signed"
            
            # Update lease agreement
            if update_data:
                update_data["updated_at"] = datetime.utcnow().isoformat()
                supabase_client.table("lease_agreements").update(update_data).eq("id", lease_id).execute()
            
            return {
                "status": "success",
                "lease_id": lease_id,
                "event_type": event_type,
                "updates_applied": list(update_data.keys())
            }
            
        except Exception as e:
            logger.error(f"Failed to process DocuSign webhook: {e}")
            return {"status": "error", "message": str(e)}
    
    async def _store_signed_document(self, lease_id: str, document_bytes: bytes) -> str:
        """Store signed document in storage and return URL"""
        try:
            # TODO: Implement document storage using Supabase Storage or S3
            # For now, return a placeholder URL
            filename = f"signed_lease_{lease_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            # In production, upload to storage service:
            # 1. Upload to Supabase Storage bucket
            # 2. Get public URL
            # 3. Return URL
            
            return f"https://storage.example.com/signed-contracts/{filename}"
            
        except Exception as e:
            logger.error(f"Failed to store signed document: {e}")
            raise
    
    async def create_contract_template(
        self,
        template_name: str,
        template_content: str,
        description: str = ""
    ) -> Dict[str, Any]:
        """Create a DocuSign template for lease agreements"""
        try:
            if not self.api_client:
                raise Exception("DocuSign client not initialized")
            
            # Create template definition
            envelope_template = EnvelopeDefinition()
            envelope_template.email_subject = f"Template: {template_name}"
            envelope_template.description = description
            
            # Create document from template content
            document = Document()
            document.document_base64 = base64.b64encode(template_content.encode()).decode()
            document.name = f"{template_name}.pdf"
            document.file_extension = "pdf"
            document.document_id = "1"
            
            envelope_template.documents = [document]
            
            # Create placeholder recipients for template
            recipients = Recipients()
            recipients.signers = self._create_template_signers()
            envelope_template.recipients = recipients
            
            # Set as template
            envelope_template.status = "created"
            
            # Create template
            envelopes_api = EnvelopesApi(self.api_client)
            template_summary = envelopes_api.create_envelope(
                account_id=self.account_id,
                envelope_definition=envelope_template
            )
            
            return {
                "template_id": template_summary.envelope_id,
                "status": template_summary.status,
                "uri": template_summary.uri
            }
            
        except ApiException as e:
            logger.error(f"DocuSign API error creating template: {e}")
            raise Exception(f"Failed to create DocuSign template: {e}")
        except Exception as e:
            logger.error(f"DocuSign service error: {e}")
            raise
    
    def _create_template_signers(self) -> List[Signer]:
        """Create template signers with placeholder information"""
        signers = []
        
        # Landlord template signer
        landlord = Signer()
        landlord.email = "landlord@example.com"
        landlord.name = "Landlord Name"
        landlord.recipient_id = "1"
        landlord.routing_order = "1"
        landlord.role_name = "Landlord"
        
        # Add signature tabs
        landlord_sign_here = SignHere()
        landlord_sign_here.document_id = "1"
        landlord_sign_here.page_number = "1"
        landlord_sign_here.x_position = "100"
        landlord_sign_here.y_position = "100"
        landlord_sign_here.tab_label = "landlord_signature"
        
        landlord_tabs = Tabs()
        landlord_tabs.sign_here_tabs = [landlord_sign_here]
        landlord.tabs = landlord_tabs
        
        signers.append(landlord)
        
        # Tenant template signer
        tenant = Signer()
        tenant.email = "tenant@example.com"
        tenant.name = "Tenant Name"
        tenant.recipient_id = "2"
        tenant.routing_order = "2"
        tenant.role_name = "Tenant"
        
        # Add signature tabs
        tenant_sign_here = SignHere()
        tenant_sign_here.document_id = "1"
        tenant_sign_here.page_number = "1"
        tenant_sign_here.x_position = "100"
        tenant_sign_here.y_position = "200"
        tenant_sign_here.tab_label = "tenant_signature"
        
        tenant_tabs = Tabs()
        tenant_tabs.sign_here_tabs = [tenant_sign_here]
        tenant.tabs = tenant_tabs
        
        signers.append(tenant)
        
        return signers


# Global DocuSign service instance
docusign_service = DocuSignService()
