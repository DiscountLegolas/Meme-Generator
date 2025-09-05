#!/usr/bin/env python3
"""
Database Initialization Script for AI Meme Generator
This script sets up the MongoDB database, collections, and indexes.
"""

import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from config import config

def init_database():
    """Initialize the database with collections and indexes"""
    
    # Get configuration
    current_config = config[os.environ.get('FLASK_ENV', 'default')]
    
    try:
        # Connect to MongoDB
        print(f"Connecting to MongoDB at {current_config.MONGODB_URI}...")
        client = MongoClient(current_config.MONGODB_URI)
        
        # Test connection
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB!")
        
        # Get or create database
        db = client[current_config.MONGODB_DB]
        print(f"✅ Using database: {current_config.MONGODB_DB}")
        
        # Get or create collections
        users_collection = db['users']
        memes_collection = db['memes']
        
        # Create indexes for better performance
        print("Creating indexes...")
        
        # Users collection indexes
        users_collection.create_index("email", unique=True)
        users_collection.create_index("username", unique=True)
        users_collection.create_index("created_at")
        
        # Memes collection indexes
        memes_collection.create_index("user_id")
        memes_collection.create_index("created_at")
        memes_collection.create_index("template")
        
        print("✅ Database setup completed successfully!")
        print("\n📋 Collections created:")
        print(f"   - {current_config.MONGODB_DB}.users")
        print(f"   - {current_config.MONGODB_DB}.memes")
        print("\n🔑 Indexes created:")
        print("   - users.email (unique)")
        print("   - users.username (unique)")
        print("   - users.created_at")
        print("   - memes.user_id")
        print("   - memes.created_at")
        print("   - memes.template")
        
        return True
        
    except ConnectionFailure:
        print("❌ Failed to connect to MongoDB!")
        print("   Make sure MongoDB is running and accessible.")
        print("   You can start MongoDB with: mongod")
        return False
        
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        return False

def check_database_status():
    """Check database connection and collection status"""
    
    current_config = config[os.environ.get('FLASK_ENV', 'default')]
    
    try:
        client = MongoClient(current_config.MONGODB_URI)
        client.admin.command('ping')
        print("✅ MongoDB is running and accessible!")
        
        # Check collections
        db = client[current_config.MONGODB_DB]
        collections = db.list_collection_names()
        
        print(f"📋 Collections in {current_config.MONGODB_DB}:")
        for collection in collections:
            count = db[collection].count_documents({})
            print(f"   - {collection}: {count} documents")
        
        return True
        
    except Exception as e:
        print(f"❌ Database check failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Database Initialization for AI Meme Generator")
    print("=" * 60)
    
    # Check database status
    if check_database_status():
        print("\n" + "=" * 60)
        # Initialize database
        init_database()
    else:
        print("\n💡 To get started with MongoDB:")
        print("   1. Install MongoDB: https://docs.mongodb.com/manual/installation/")
        print("   2. Start MongoDB service: mongod")
        print("   3. Run this script again")
        print("\n   Or use MongoDB Atlas (cloud):")
        print("   1. Go to https://www.mongodb.com/atlas")
        print("   2. Create a free cluster")
        print("   3. Get connection string and set MONGODB_URI environment variable")
