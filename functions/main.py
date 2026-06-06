from firebase_functions import https_fn
from firebase_admin import initialize_app
import os
import sys

# Ensure the parent directory is in the path to import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app as flask_app

initialize_app()

@https_fn.on_request()
def library_api(req: https_fn.Request) -> https_fn.Response:
    with flask_app.request_context(req.environ):
        return flask_app.full_dispatch_request()
