from .base import *

DEBUG = False

ALLOWED_HOSTS = [
    "brand-radar.onrender.com",
    "127.0.0.1",
    "localhost"
]


CORS_ALLOWED_ORIGINS = [
   "https://brand-radar-git-main-yash-bhaleraos-projects-dc235f42.vercel.app/",
    
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
