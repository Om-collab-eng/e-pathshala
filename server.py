import os
from waitress import serve
from app import app, init_db

if __name__ == '__main__':
    # Initialize the database
    init_db()
    
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting School Library System on http://0.0.0.0:{port}")
    # Serve the app using Waitress
    serve(app, host='0.0.0.0', port=port)
