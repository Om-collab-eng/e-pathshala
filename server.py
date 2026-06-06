from waitress import serve
from app import app, init_db

if __name__ == '__main__':
    # Initialize the database
    init_db()
    
    print("Starting School Library System on http://0.0.0.0:5000")
    # Serve the app using Waitress
    serve(app, host='0.0.0.0', port=5000)
