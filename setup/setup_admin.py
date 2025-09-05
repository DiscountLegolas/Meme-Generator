#!/usr/bin/env python3
"""
Setup Admin Panel Script
This script sets up the database and creates an admin user for the admin panel.
"""

import os
import sys
from init_db import init_database, check_database_status
from create_admin import create_admin_user

def main():
    print("🚀 Setting up Admin Panel for AI Meme Generator")
    print("=" * 60)
    
    # Step 1: Check database status
    print("\n📊 Step 1: Checking database status...")
    if not check_database_status():
        print("❌ Database check failed!")
        print("Please make sure MongoDB is running and accessible.")
        return False
    
    # Step 2: Initialize database
    print("\n🗄️  Step 2: Initializing database...")
    if not init_database():
        print("❌ Database initialization failed!")
        return False
    
    # Step 3: Create admin user
    print("\n👤 Step 3: Creating admin user...")
    if not create_admin_user():
        print("❌ Admin user creation failed!")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 Admin panel setup completed successfully!")
    print("\n📋 Next steps:")
    print("   1. Start the Flask server: python app.py")
    print("   2. Start the React frontend: cd frontend && npm start")
    print("   3. Log in with admin credentials")
    print("   4. Navigate to /admin to access the admin panel")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
