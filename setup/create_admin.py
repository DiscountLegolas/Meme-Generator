#!/usr/bin/env python3
"""
Create Admin User Script
This script creates an admin user for the admin panel.
"""

import os
from auth import create_user
from config import config

def create_admin_user():
    """Create an admin user"""
    
    print("🔧 Creating Admin User")
    print("=" * 40)
    
    # Get admin credentials from environment or use defaults
    admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@memegenerator.com')
    admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
    
    print(f"Username: {admin_username}")
    print(f"Email: {admin_email}")
    print(f"Password: {admin_password}")
    print()
    
    # Create admin user
    user_id, error = create_user(admin_username, admin_email, admin_password, role='admin')
    
    if error:
        if "already exists" in error:
            print(f"⚠️  {error}")
            print("Admin user already exists!")
        else:
            print(f"❌ Error creating admin user: {error}")
            return False
    else:
        print("✅ Admin user created successfully!")
        print(f"User ID: {user_id}")
    
    print()
    print("🎉 Admin panel is ready!")
    print("You can now log in with the admin credentials to access the admin panel.")
    
    return True

if __name__ == "__main__":
    create_admin_user()
