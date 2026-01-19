#!/bin/bash

# Wait for database if using external one (e.g. Postgres)
# For sqlite it's immediate

echo "Applying migrations..."
python manage.py migrate

echo "Creating superuser..."
# Using a python script to create superuser if not exists
python manage.py shell <<EOF
from accounts.models import User
import os

username = 'superadmin'
email = 'admin@campusiq.com'
password = 'Password123#'

if not User.objects.filter(username=username).exists():
    print(f"Creating superuser {username}...")
    User.objects.create_superuser(username=username, email=email, password=password)
    print("Superuser created successfully.")
else:
    print(f"Superuser {username} already exists.")
EOF

echo "Starting server..."
python manage.py runserver 0.0.0.0:8000
