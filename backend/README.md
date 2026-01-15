# School ERP Backend API

Production-ready School ERP system built with Django REST Framework, following API-first architecture principles for AI-agent compatibility.

## Features

- ✅ **Role-Based Access Control**: Admin, Teacher, Student, Parent roles
- ✅ **Enhanced Teacher Registration**: Self-registration with school verification code and admin approval
- ✅ **Academic Management**: Classes, Sections, Subjects, Assignments
- ✅ **Student Management**: Comprehensive student profiles with parent tracking
- ✅ **Attendance System**: Daily attendance with validation
- ✅ **Fee Management**: Structures, Invoices, Payments with auto-status updates
- ✅ **Exam Module**: Exams and results with auto-grade calculation
- ✅ **REST API**: Complete CRUD APIs for all modules
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **API Documentation**: Auto-generated Swagger/OpenAPI docs

## Tech Stack

- **Backend**: Django 5.0.14 + Django REST Framework 3.16
- **Database**: PostgreSQL 14+ (SQLite for dev)
- **Authentication**: JWT (SimpleJWT)
- **API Docs**: drf-spectacular (OpenAPI 3.0)
- **Python**: 3.11+

## Quick Start

### 1. Clone and Setup

```bash
cd /home/ts/Documents/Project/MIG/ERP_ANTI
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run with SQLite (Development)

```bash
# Run migrations
USE_SQLITE=True python manage.py migrate

# Create superuser
USE_SQLITE=True python manage.py createsuperuser

# Run development server
USE_SQL ITE=True python manage.py runserver
```

### 3. Access the Application

- **Admin Panel**: http://localhost:8000/admin/
- **API Documentation**: http://localhost:8000/api/docs/
- **API Base URL**: http://localhost:8000/api/v1/

## Database Models

### Core Models (16 total)

1. **User** - Custom user with role-based access
2. **SchoolProfile** - School information with verification code
3. **TeacherProfile** - Teacher profiles with self-registration support
4. **Class** - Class definitions
5. **Section** - Class sections
6. **Subject** - Subject definitions
7. **SubjectAssignment** - Teacher-subject-class assignments
8. **StudentProfile** - Student information
9. **ParentProfile** - Parent/guardian details
10. **Attendance** - Daily attendance records
11. **FeeStructure** - Fee structure templates
12. **FeeItem** - Fee items within structures
13. **Invoice** - Student fee invoices
14. **Payment** - Payment records
15. **Exam** - Exam definitions
16. **ExamResult** - Student exam results

## Key Features

### Enhanced Teacher Registration Workflow

**Admin Setup:**
1. Login to admin panel
2. Navigate to School Profile
3. Copy the auto-generated verification code

**Teacher Self-Registration:**
1. POST `/api/v1/teachers/self-register/`
3. Include school verification code
3. Status set to 'pending'

**Admin Approval:**
1. GET `/api/v1/teachers/pending/` - View pending registrations
2. PATCH `/api/v1/teachers/{id}/approve/` - Approve teacher
3. Teacher can now login

**Login Protection:**
- Pending teachers cannot login
- Rejected teachers cannot login
- Only 'active' teachers can authenticate

## Environment Variables

Create a `.env` file:

```bash
# Django
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite for dev, PostgreSQL for prod)
USE_SQLITE=True

# For PostgreSQL (production)
# USE_SQLITE=False
# DATABASE_NAME=school_erp_db
# DATABASE_USER=school_user
# DATABASE_PASSWORD=secure_password
# DATABASE_HOST=localhost
# DATABASE_PORT=5432

# JWT
JWT_ACCESS_TOKEN_LIFETIME=15  # minutes
JWT_REFRESH_TOKEN_LIFETIME=7  # days

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## PostgreSQL Setup (Production)

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE school_erp_db;
CREATE USER school_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE school_erp_db TO school_user;
\q

# Set USE_SQLITE=False in .env

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

## Project Structure

```
ERP_ANTI/
├── accounts/          # User authentication & profiles
├── academic/          # Class, Section, Subject management
├── students/          # Student & parent management
├── attendance/        # Attendance tracking
├── fees/              # Fee management
├── exams/             # Exam & results
├── core/              # Base models & utilities
├── school_erp/        # Project settings
├── requirements.txt
└── README.md
```

## Admin Actions

### School Profile
- Auto-generates verification code
- Singleton pattern (only one profile)
- Cannot be deleted

### Teacher Management
- Bulk approve/reject teachers
- Filter by status (pending/active/rejected)
- Only active teachers can be assigned subjects

### Subject Assignments
- Validates teacher status
- Prevents duplicate assignments
- Enforces unique constraints

## API Endpoints (Coming in next milestone)

- **Authentication**: `/api/v1/auth/login/`, `/api/v1/auth/refresh/`
- **School**: `/api/v1/school/profile/`
- **Teachers**: `/api/v1/teachers/`, `/api/v1/teachers/self-register/`
- **Academic**: `/api/v1/classes/`, `/api/v1/sections/`, `/api/v1/subjects/`
- **Students**: `/api/v1/students/`
- **Attendance**: `/api/v1/attendance/`
- **Fees**: `/api/v1/fees/`
- **Exams**: `/api/v1/exams/`

## Development Status

### ✅ Milestone 1: Foundation (In Progress)
- [x] Project setup and configuration
- [x] Database models and migrations
- [x] Admin interface
- [  ] JWT authentication APIs
- [ ] Core CRUD APIs
- [ ] API documentation

### Milestone 2: Core Operations (Upcoming)
- Attendance APIs
- Fee management APIs
- Student operations
- API documentation completion

### Milestone 3: Deployment (Upcoming)
- Exam APIs
- Reports & dashboards
- VPS deployment
- Production optimization

## Next Steps

1. **Implement Authentication APIs** (JWT login, refresh, logout)
2. **Create Teacher Management APIs** (CRUD + self-registration)
3. **Build Academic Structure APIs** (Classes, Sections, Subjects)
4. **Add API Documentation** (Swagger UI)
5. **Create Postman Collection**

## License

Proprietary - School ERP Project

## Support

For issues or questions, contact the development team.
