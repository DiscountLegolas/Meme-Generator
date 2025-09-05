import os

class Config:
    """Base configuration class"""
    
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'V~DoV0Q!=3C:+AF')
    
    # JWT configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'q=?-B79D*knuoBc')
    JWT_ACCESS_TOKEN_EXPIRES = 24  # hours
    
    # MongoDB configuration
    MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb+srv://myAtlasDBUser:2wykn2MlvYdaylfH@myatlasclusteredu.60y3r.mongodb.net/?retryWrites=true&w=majority&appName=myAtlasClusterEDU')
    MONGODB_DB = 'meme_generator'
    
    # File paths
    MEMES_FOLDER = 'Memes'
    GENERATED_MEMES_FOLDER = 'GeneratedMemes'
    TEMPLATES_FILE = 'Generate/templates.json'
    
    # API configuration
    API_TIMEOUT = 30  # seconds
    MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    
class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    
    # Override with production values
    SECRET_KEY = os.environ.get('SECRET_KEY','V~DoV0Q!=3C:+AF')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY','q=?-B79D*knuoBc')
    MONGODB_URI = os.environ.get('MONGODB_URI')

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    MONGODB_DB = 'meme_generator_test'

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
