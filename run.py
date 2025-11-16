from app import create_app
from config import Config
from network_config import NetworkConfig

app = create_app()

if __name__ == '__main__':
    print("🚀 Starting CurtainCall Backend Server...")
    print(f"📍 API Prefix: {Config.API_PREFIX}")
    NetworkConfig.print_config()
    
    app.run(
        host=NetworkConfig.FLASK_HOST,
        port=NetworkConfig.FLASK_PORT,
        debug=Config.DEBUG,
        threaded=True
    )