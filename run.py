"""
Run wrapper for the CurtainCall NLP service.

This script starts the Flask app defined in `app.py` with sensible defaults
for development and testing from mobile devices (binds to 0.0.0.0).

By default it runs on port 5001 to avoid colliding with the main backend
which commonly runs on port 5000.
"""
import logging
import os
from app import app  # the Flask app in this folder

try:
    from flask_cors import CORS
    CORS(app)
except Exception:
    # flask_cors is optional; if it's not installed the app will still work
    app.logger.warning('flask_cors not available; CORS disabled')


def prepare_upload_dir():
    # Ensure uploads directory exists for debugging/saving incoming audio
    uploads = os.path.join(os.getcwd(), 'uploads')
    os.makedirs(uploads, exist_ok=True)
    return uploads


def main():
    uploads = prepare_upload_dir()
    app.logger.setLevel(logging.INFO)
    app.logger.info('Starting NLP service (CurtainCall)')
    app.logger.info('Uploads folder: %s', uploads)
    # Run on port 5001 to avoid conflict with main backend (5000)
    app.run(host='0.0.0.0', port=5001, debug=True)


if __name__ == '__main__':
    main()
