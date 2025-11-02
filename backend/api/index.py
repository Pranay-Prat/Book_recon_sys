import sys
import os

# Ensure we can import from backend itself
sys.path.append(os.path.dirname(__file__))

from app import app as fastapi_app

# Vercel expects this callable
handler = fastapi_app
