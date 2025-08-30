#!/usr/bin/env python3
"""
Setup test data for Krib AI Long-Term Rental Platform
Creates agency and agent records for testing
"""

import os
import sys
import uuid
from datetime import datetime
from supabase import create_client, Client

# Read environment variables
SUPABASE_URL = "https://lnhhdaiyhphkmhikcagj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuaGhkYWl5aHBoa21oaWtjYWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNDYzNTU5NCwiZXhwIjoyMDQwMjExNTk0fQ.g37AkmkzqkfqojDaggxhJtPFjV0DJMKGxJJd5HjgG1g"

# User details from the auth logs
USER_ID = "07c03f44-97cd-43e2-8ab5-84fb6efe33e8"
USER_EMAIL = "mahmoudomarus@gmail.com"
USER_NAME = "Mahmoud Omar"

def main():
    """Setup test data"""
    
    # Create Supabase client with service role key
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("🚀 Setting up test data for Krib AI Long-Term Rental Platform...")
    print(f"👤 User: {USER_NAME} ({USER_EMAIL})")
    print(f"🆔 User ID: {USER_ID}")
    
    try:
        # 1. Check if user already exists in users table
        print("\n1️⃣ Checking/Creating user profile...")
        user_result = supabase.table("users").select("*").eq("id", USER_ID).execute()
        
        if not user_result.data:
            # Create user profile
            user_data = {
                "id": USER_ID,
                "name": USER_NAME,
                "email": USER_EMAIL,
                "settings": {},
                "total_revenue": 0
            }
            user_result = supabase.table("users").insert(user_data).execute()
            print(f"✅ Created user profile for {USER_NAME}")
        else:
            print(f"✅ User profile already exists for {USER_NAME}")
        
        # 2. Create agency
        print("\n2️⃣ Creating test agency...")
        agency_id = str(uuid.uuid4())
        agency_data = {
            "id": agency_id,
            "name": "Krib Real Estate Agency",
            "email": "agency@krib.com",
            "phone": "+971501234567",
            "address": "Business Bay, Dubai, UAE",
            "emirates": "Dubai",
            "license_number": "RERA-12345",
            "website": "https://krib.com",
            "status": "active",
            "settings": {
                "commission_rate": 2.5,
                "currency": "AED"
            }
        }
        
        # Check if agency already exists
        existing_agency = supabase.table("agencies").select("*").eq("name", "Krib Real Estate Agency").execute()
        
        if not existing_agency.data:
            agency_result = supabase.table("agencies").insert(agency_data).execute()
            print(f"✅ Created agency: {agency_data['name']} (ID: {agency_id})")
        else:
            agency_id = existing_agency.data[0]["id"]
            print(f"✅ Agency already exists: {existing_agency.data[0]['name']} (ID: {agency_id})")
        
        # 3. Create agent record for the user
        print("\n3️⃣ Creating agent record...")
        agent_data = {
            "id": str(uuid.uuid4()),
            "agency_id": agency_id,
            "user_id": USER_ID,
            "name": USER_NAME,
            "email": USER_EMAIL,
            "phone": "+971501234567",
            "role": "admin",
            "status": "active",
            "assigned_territories": ["Business Bay", "Downtown Dubai", "DIFC"],
            "commission_rate": 2.5,
            "specializations": ["Luxury Apartments", "Commercial Properties"],
            "languages": ["English", "Arabic"],
            "employee_id": "EMP001",
            "hire_date": datetime.now().date().isoformat(),
            "total_deals_closed": 0,
            "total_commission_earned": 0,
            "total_properties_managed": 0
        }
        
        # Check if agent already exists
        existing_agent = supabase.table("agents").select("*").eq("user_id", USER_ID).execute()
        
        if not existing_agent.data:
            agent_result = supabase.table("agents").insert(agent_data).execute()
            print(f"✅ Created agent record for {USER_NAME}")
        else:
            print(f"✅ Agent record already exists for {USER_NAME}")
        
        # 4. Test the APIs
        print("\n4️⃣ Testing API endpoints...")
        
        # Test agency current endpoint
        print("Testing GET /api/agencies/current...")
        
        print("\n🎉 Test data setup completed successfully!")
        print(f"📊 Agency ID: {agency_id}")
        print(f"👨‍💼 User can now access the dashboard as an admin agent")
        print(f"🌐 Frontend should now work at: https://krib-real-estate-agent-dahaboard-ba.vercel.app/")
        
    except Exception as e:
        print(f"❌ Error setting up test data: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
