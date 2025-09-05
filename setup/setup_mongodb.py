#!/usr/bin/env python3
"""
MongoDB Setup Script for AI Meme Generator
This script helps set up the MongoDB database and collections.
"""

import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

def setup_mongodb():
    """Set up MongoDB database and collections"""
    
    # MongoDB connection string
    mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
    database_name = 'meme_generator'
    
    try:
        # Connect to MongoDB
        client = MongoClient(mongodb_uri)
        
        # Test connection
        client.admin.command('ping')
        
        # Get or create database
        db = client[database_name]
        
        # Get or create collections
        users_collection = db['users']
        memes_collection = db['memes']
        
        # Create indexes for better performance
        users_collection.create_index("email", unique=True)
        users_collection.create_index("username", unique=True)
        memes_collection.create_index("user_id")
        memes_collection.create_index("created_at")
        

        
        return True
        
    except ConnectionFailure:

        return False
        
    except Exception as e:
        return False

def check_mongodb_status():
    """Check MongoDB connection status"""
    
    mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
    
    try:
        client = MongoClient(mongodb_uri)
        client.admin.command('ping')
        return True
    except Exception as e:
        return False

if __name__ == "__main__":

    
    # Check MongoDB status
    if check_mongodb_status():
        # Setup database
        setup_mongodb()
    else:
        print("\n💡 To get started with MongoDB:")
        print("   1. Install MongoDB: https://docs.mongodb.com/manual/installation/")
        print("   2. Start MongoDB service: mongod")
        print("   3. Run this script again")
        print("\n   Or use MongoDB Atlas (cloud):")
        print("   1. Go to https://www.mongodb.com/atlas")
        print("   2. Create a free cluster")
        print("   3. Get connection string and set MONGODB_URI environment variable")
