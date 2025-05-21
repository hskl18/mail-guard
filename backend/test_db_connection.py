#!/usr/bin/env python3
import os
import sys
import mysql.connector
import dotenv
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
dotenv.load_dotenv()

def test_connection():
    # Get connection parameters
    host = os.getenv("MYSQL_HOST")
    port = int(os.getenv("MYSQL_PORT") or 3306)
    user = os.getenv("MYSQL_USER")
    password = os.getenv("MYSQL_PASSWORD")
    database = os.getenv("MYSQL_DATABASE")
    ssl_ca = os.getenv("MYSQL_SSL_CA")
    
    # Log configuration (excluding password)
    logger.info(f"Testing connection to {host}:{port} as {user}")
    logger.info(f"Database: {database}")
    logger.info(f"SSL CA path: {ssl_ca}")
    
    if ssl_ca:
        logger.info(f"SSL CA file exists: {os.path.exists(ssl_ca)}")
        if not os.path.exists(ssl_ca):
            logger.error(f"SSL certificate file does not exist at path: {ssl_ca}")
            logger.info("Current working directory: " + os.getcwd())
            logger.info("Files in current directory: " + str(os.listdir('.')))
            if os.path.dirname(ssl_ca):
                cert_dir = os.path.dirname(ssl_ca)
                if os.path.exists(cert_dir):
                    logger.info(f"Files in cert directory: {str(os.listdir(cert_dir))}")
                else:
                    logger.error(f"Certificate directory does not exist: {cert_dir}")
    
    # Prepare connection config
    config = {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
    }
    
    # Add SSL config if certificate path is provided
    if ssl_ca and os.path.exists(ssl_ca):
        config["ssl_ca"] = ssl_ca
        config["ssl_verify_cert"] = True
        logger.info("Using SSL certificate for connection")
    else:
        logger.warning("Not using SSL certificate verification")
    
    # Test connection without database first
    try:
        logger.info("Connecting to server...")
        conn = mysql.connector.connect(**config)
        logger.info("Server connection successful!")
        
        # Now try with database
        if database:
            logger.info(f"Testing connection to database: {database}")
            config["database"] = database
            conn.close()
            conn = mysql.connector.connect(**config)
            logger.info(f"Database connection successful!")
            
            # Test a simple query
            cursor = conn.cursor()
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            logger.info(f"MySQL version: {version[0]}")
            cursor.close()
            
        conn.close()
        logger.info("All connection tests passed!")
        return True
    except mysql.connector.Error as err:
        logger.error(f"Connection failed: {err}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1) 