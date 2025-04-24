import os
from dotenv import load_dotenv
load_dotenv()

# Kirjautuminen
EMAIL = os.getenv("EMAIL")
PASSWORD = os.getenv("PASSWORD")


# Rekisteröityminen
REGISTER_USERNAME = os.getenv("REGISTER_USERNAME")
REGISTER_EMAIL = os.getenv("REGISTER_EMAIL")
REGISTER_PASSWORD = os.getenv("REGISTER_PASSWORD")

BACKEND_URL = os.getenv("BACKEND_URL")

