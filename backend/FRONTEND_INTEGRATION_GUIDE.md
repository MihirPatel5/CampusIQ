# School ERP - Frontend Integration Guide

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Authentication Flow](#authentication-flow)
3. [API Base URL & Documentation](#api-base-url--documentation)
4. [Complete API Reference](#complete-api-reference)
5. [User Workflows](#user-workflows)
6. [Data Models](#data-models)
7. [Error Handling](#error-handling)
8. [Frontend Implementation Examples](#frontend-implementation-examples)

---

## System Overview

### Technology Stack
- **Backend**: Django REST Framework
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: PostgreSQL (SQLite for dev)
- **API Documentation**: OpenAPI 3.0 (Swagger)

### User Roles
1. **Admin** - Full system access
2. **Teacher** - Subject teaching, attendance, results
3. **Student** - View own records
4. **Parent** - View child's records

---

## Authentication Flow

### 1. Login Process

**Endpoint:** `POST /api/v1/auth/login/`

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@school.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin",
    "is_active": true,
    "date_joined": "2026-01-15T04:00:00Z"
  }
}
```

**Error Responses:**
- **401 Unauthorized**: Invalid credentials
- **403 Forbidden (Pending Teacher)**:
  ```json
  {
    "error": "Your account is pending admin approval"
  }
  ```
- **403 Forbidden (Rejected Teacher)**:
  ```json
  {
    "error": "Your registration was rejected",
    "reason": "Incomplete qualifications"
  }
  ```

### 2. Store Tokens

```javascript
// Store tokens in localStorage or secure cookie
localStorage.setItem('access_token', response.data.access);
localStorage.setItem('refresh_token', response.data.refresh);
localStorage.setItem('user', JSON.stringify(response.data.user));
```

### 3. Use Access Token

**All authenticated requests must include:**
```http
Authorization: Bearer {access_token}
```

**Example with Axios:**
```javascript
axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
```

### 4. Token Refresh

**When access token expires (15 mins default):**

**Endpoint:** `POST /api/v1/auth/refresh/`

**Request:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:**
```json
{
  "access": "new_access_token_here"
}
```

### 5. Teacher Self-Registration (Public)

**Endpoint:** `POST /api/v1/teachers/self-register/`

**Request:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "date_of_birth": "1990-05-15",
  "qualification": "M.Sc Mathematics",
  "specialization": "Algebra",
  "address": "123 Main St",
  "password": "secure123",
  "password_confirm": "secure123",
  "school_verification_code": "ABC123XYZ456"
}
```

**Response (201):**
```json
{
  "message": "Registration successful. Your account is pending admin approval.",
  "teacher": {
    "id": 5,
    "user": {...},
    "status": "pending",
    "self_registered": true
  }
}
```

---

## API Base URL & Documentation

### Base URL
```
Development: http://localhost:8000/api/v1/
Production: https://your-domain.com/api/v1/
```

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

---

## Complete API Reference

### 📌 Authentication

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/auth/login/` | Login & get tokens | No | Public |
| POST | `/auth/refresh/` | Refresh access token | No | Public |

### 👨‍🏫 Teacher Management

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/teachers/self-register/` | Teacher self-registration | No | Public |
| GET | `/teachers/` | List all teachers | Yes | Admin |
| POST | `/teachers/` | Create teacher (admin) | Yes | Admin |
| GET | `/teachers/{id}/` | Get teacher details | Yes | Admin |
| PATCH | `/teachers/{id}/` | Update teacher | Yes | Admin |
| DELETE | `/teachers/{id}/` | Delete teacher | Yes | Admin |
| GET | `/teachers/pending/` | List pending registrations | Yes | Admin |
| PATCH | `/teachers/{id}/approve/` | Approve teacher | Yes | Admin |
| PATCH | `/teachers/{id}/reject/` | Reject teacher | Yes | Admin |

**Query Parameters for List:**
- `?status=pending` - Filter by status
- `?self_registered=true` - Filter self-registered
- `?search=john` - Search by name/email

### 🏫 School Profile

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/school/profile/` | Get school info | Yes | All |
| PATCH | `/school/profile/` | Update school | Yes | Admin |
| GET | `/school/verification-code/` | Get verification code | Yes | Admin |
| POST | `/school/regenerate-code/` | Regenerate code | Yes | Admin |

### 📚 Academic Structure

**Classes:**

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/classes/` | List classes | Yes | All |
| POST | `/classes/` | Create class | Yes | Admin |
| GET | `/classes/{id}/` | Get class | Yes | All |
| PATCH | `/classes/{id}/` | Update class | Yes | Admin |
| DELETE | `/classes/{id}/` | Delete class | Yes | Admin |

**Query Parameters:**
- `?academic_year=2024-25`
- `?status=active`
- `?search=class 10`

**Sections:**

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/sections/` | List sections | Yes | All |
| POST | `/sections/` | Create section | Yes | Admin |
| GET | `/sections/{id}/` | Get section | Yes | All |
| PATCH | `/sections/{id}/` | Update section | Yes | Admin |
| DELETE | `/sections/{id}/` | Delete section | Yes | Admin |

**Query Parameters:**
- `?class_id=1`
- `?status=active`

**Subjects:**

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/subjects/` | List subjects | Yes | All |
| POST | `/subjects/` | Create subject | Yes | Admin |
| GET | `/subjects/{id}/` | Get subject | Yes | All |
| PATCH | `/subjects/{id}/` | Update subject | Yes | Admin |
| DELETE | `/subjects/{id}/` | Delete subject | Yes | Admin |

**Query Parameters:**
- `?type=core` (core, elective, optional)
- `?status=active`

**Subject Assignments:**

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/assignments/` | List assignments | Yes | All |
| POST | `/assignments/` | Create assignment | Yes | Admin |
| GET | `/assignments/{id}/` | Get assignment | Yes | All |
| PATCH | `/assignments/{id}/` | Update assignment | Yes | Admin |
| DELETE | `/assignments/{id}/` | Delete assignment | Yes | Admin |

**Query Parameters:**
- `?class_id=1`
- `?section_id=2`
- `?subject_id=3`
- `?teacher_id=4`
- `?academic_year=2024-25`

### 👨‍🎓 Student Management

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/students/` | List students | Yes | All |
| POST | `/students/` | Admit student | Yes | Admin |
| GET | `/students/{id}/` | Get student | Yes | All |
| PATCH | `/students/{id}/` | Update student | Yes | Admin |
| DELETE | `/students/{id}/` | Delete student | Yes | Admin |
| GET | `/students/{id}/parents/` | Get parents | Yes | All |

**Query Parameters:**
- `?class_id=1`
- `?section_id=2`
- `?status=active`
- `?search=john`

**Student Admission Request:**
```json
{
  "admission_number": "ADM2024001",
  "first_name": "Alice",
  "last_name": "Smith",
  "date_of_birth": "2010-06-15",
  "gender": "female",
  "blood_group": "O+",
  "email": "alice@example.com",
  "phone": "9876543210",
  "address": "123 Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "admission_date": "2024-04-01",
  "class_obj": 1,
  "section": 1,
  "parents": [
    {
      "relation": "father",
      "name": "Robert Smith",
      "phone": "9876543211",
      "email": "robert@example.com",
      "occupation": "Engineer",
      "is_primary": true
    }
  ],
  "password": "alice123"
}
```

### ✅ Attendance Management

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/attendance/mark/` | Bulk mark attendance | Yes | Teacher/Admin |
| GET | `/attendance/students/` | Get students for marking | Yes | All |
| GET | `/attendance/student/{id}/` | Student history + stats | Yes | All |
| GET | `/attendance/` | List attendance records | Yes | All |
| POST | `/attendance/` | Create attendance | Yes | Teacher/Admin |
| PATCH | `/attendance/{id}/` | Update attendance | Yes | Teacher/Admin |

**Bulk Mark Attendance:**

**Request:**
```json
{
  "date": "2026-01-15",
  "class_id": 1,
  "section_id": 1,
  "attendance": [
    {
      "student_id": 1,
      "status": "present",
      "remarks": ""
    },
    {
      "student_id": 2,
      "status": "absent",
      "remarks": "Sick leave"
    }
  ]
}
```

**Get Students for Marking:**

**Request:** `GET /attendance/students/?class_id=1&section_id=1&date=2026-01-15`

**Response:**
```json
[
  {
    "student_id": 1,
    "admission_number": "ADM2024001",
    "name": "Alice Smith",
    "status": "present",
    "remarks": "",
    "already_marked": true
  }
]
```

**Student Attendance History:**

**Request:** `GET /attendance/student/1/?date_from=2026-01-01&date_to=2026-01-31`

**Response:**
```json
{
  "records": [...],
  "summary": {
    "total_days": 20,
    "present_days": 18,
    "absent_days": 2,
    "late_days": 0,
    "leave_days": 0,
    "attendance_percentage": 90.0
  }
}
```

### 💰 Fee Management

**Fee Structures:**

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/fees/structures/` | List fee structures | Yes | All |
| POST | `/fees/structures/` | Create structure | Yes | Admin |
| GET | `/fees/structures/{id}/` | Get structure | Yes | All |
| PATCH | `/fees/structures/{id}/` | Update structure | Yes | Admin |

**Create Fee Structure:**
```json
{
  "name": "Class 10 Annual Fee 2024-25",
  "academic_year": "2024-25",
  "class_obj": 1,
  "total_amount": 50000,
  "status": "active",
  "fee_items": [
    {
      "name": "Tuition Fee",
      "amount": 30000,
      "due_date": "2024-06-01",
      "installment": 1
    },
    {
      "name": "Library Fee",
      "amount": 5000,
      "due_date": "2024-06-01",
      "installment": 1
    }
  ]
}
```

**Invoices:**

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/fees/invoices/generate/` | Generate invoices (bulk) | Yes | Admin |
| GET | `/fees/invoices/` | List invoices | Yes | All |
| GET | `/fees/invoices/{id}/` | Get invoice | Yes | All |

**Generate Invoices:**
```json
{
  "fee_structure_id": 1,
  "class_id": 1,
  "section_id": 1
}
```
OR
```json
{
  "fee_structure_id": 1,
  "student_ids": [1, 2, 3]
}
```

**Payments:**

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/fees/payments/` | Record payment | Yes | Admin |
| GET | `/fees/payments/` | List payments | Yes | All |
| GET | `/fees/payments/{id}/` | Get receipt | Yes | All |

**Record Payment:**
```json
{
  "invoice": 1,
  "amount": 10000,
  "payment_date": "2026-01-15",
  "payment_mode": "online",
  "transaction_reference": "TXN123456",
  "remarks": "Partial payment"
}
```

### 📝 Exam Management

**Exams:**

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/exams/` | List exams | Yes | All |
| POST | `/exams/` | Create exam | Yes | Admin |
| GET | `/exams/{id}/` | Get exam | Yes | All |
| PATCH | `/exams/{id}/` | Update exam | Yes | Admin |
| PATCH | `/exams/{id}/publish/` | Publish results | Yes | Admin |

**Create Exam:**
```json
{
  "name": "Mid-Term Exam 2024",
  "exam_type": "mid_term",
  "academic_year": "2024-25",
  "start_date": "2024-07-01",
  "end_date": "2024-07-10",
  "status": "draft"
}
```

**Exam Results:**

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/exams/results/bulk-entry/` | Enter results (bulk) | Yes | Teacher/Admin |
| GET | `/exams/{exam_id}/report-card/{student_id}/` | Get report card | Yes | All |
| GET | `/exams/results/` | List results | Yes | All |
| POST | `/exams/results/` | Create result | Yes | Teacher/Admin |

**Bulk Result Entry:**
```json
{
  "exam_id": 1,
  "subject_id": 1,
  "results": [
    {
      "student_id": 1,
      "marks_obtained": 85,
      "max_marks": 100,
      "remarks": "Excellent"
    },
    {
      "student_id": 2,
      "marks_obtained": 72,
      "max_marks": 100,
      "remarks": "Good"
    }
  ]
}
```

**Report Card Response:**
```json
{
  "exam": {
    "id": 1,
    "name": "Mid-Term Exam 2024"
  },
  "student": {
    "id": 1,
    "admission_number": "ADM2024001",
    "name": "Alice Smith",
    "class": "Class 10",
    "section": "A"
  },
  "results": [
    {
      "subject_name": "Mathematics",
      "marks_obtained": 85,
      "max_marks": 100,
      "percentage": 85.0,
      "grade": "A"
    }
  ],
  "total_marks": 500,
  "marks_obtained": 425,
  "percentage": 85.0,
  "overall_grade": "A"
}
```

---

## User Workflows

### Admin Workflow

1. **Login** → Get access token
2. **Setup School Profile** → Update school info, get verification code
3. **Review Pending Teachers** → Approve/reject registrations
4. **Manage Academic Structure**:
   - Create classes, sections, subjects
   - Assign subjects to teachers
5. **Student Admission** → Add students with parent details
6. **Fee Management**:
   - Create fee structures
   - Generate invoices
   - Record payments
7. **Exam Management**:
   - Create exams
   - Publish results

### Teacher Workflow

1. **Self-Register** → Using school verification code
2. **Wait for Approval** → Cannot login until approved
3. **Login** → After approval
4. **View Assigned Subjects** → Get assignments
5. **Mark Attendance**:
   - Get student list
   - Mark attendance (bulk)
6. **Enter Exam Results**:
   - Bulk result entry
   - View report cards

### Student/Parent Workflow

1. **Login** → Using credentials
2. **View Profile** → Personal information
3. **View Attendance** → History + statistics
4. **View Invoices** → Pending fees
5. **View Exam Results** → Report cards

---

## Data Models

### User
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  is_active: boolean;
  date_joined: string;
}
```

### Teacher Profile
```typescript
interface TeacherProfile {
  id: number;
  user: User;
  employee_id: string;
  phone: string;
  date_of_birth: string;
  joining_date: string;
  qualification: string;
  specialization: string;
  status: 'pending' | 'active' | 'inactive' | 'rejected';
  self_registered: boolean;
  rejection_reason?: string;
}
```

### Student Profile
```typescript
interface StudentProfile {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  email: string;
  phone: string;
  class_obj: number;
  section: number;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  parents: ParentProfile[];
}
```

### Attendance
```typescript
interface Attendance {
  id: number;
  student: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  remarks: string;
}
```

### Invoice
```typescript
interface Invoice {
  id: number;
  invoice_number: string;
  student: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  due_date: string;
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message here",
  "field_errors": {
    "email": ["This field must be unique."],
    "phone": ["Phone number already registered"]
  }
}
```

### HTTP Status Codes
- `200` OK - Success
- `201` Created - Resource created
- `400` Bad Request - Validation error
- `401` Unauthorized - Invalid/missing token
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource doesn't exist
- `500` Internal Server Error

### Token Expiry Handling
```javascript
// Interceptor to handle 401
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response.status === 401) {
      // Try refresh token
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Retry original request
        error.config.headers['Authorization'] = `Bearer ${newToken}`;
        return axios(error.config);
      } else {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## Frontend Implementation Examples

### React - Login Component

```jsx
import axios from 'axios';
import { useState } from 'react';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:8000/api/v1/auth/login/',
        credentials
      );
      
      // Store tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect based on role
      const role = response.data.user.role;
      if (role === 'admin') window.location.href = '/admin/dashboard';
      if (role === 'teacher') window.location.href = '/teacher/dashboard';
      
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="text" 
        placeholder="Username"
        onChange={(e) => setCredentials({...credentials, username: e.target.value})}
      />
      <input 
        type="password" 
        placeholder="Password"
        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
};
```

### React - Teacher Self-Registration

```jsx
const TeacherRegistration = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    qualification: '',
    specialization: '',
    address: '',
    password: '',
    password_confirm: '',
    school_verification_code: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:8000/api/v1/teachers/self-register/',
        formData
      );
      alert(response.data.message);
      window.location.href = '/registration-success';
    } catch (err) {
      console.error(err.response?.data);
    }
  };

  // Form JSX here
};
```

### Axios Setup with Authentication

```javascript
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1/',
});

// Add token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(
          'http://localhost:8000/api/v1/auth/refresh/',
          { refresh: refreshToken }
        );
        
        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### Vue.js - Attendance Marking

```vue
<template>
  <div>
    <h2>Mark Attendance - {{ selectedDate }}</h2>
    <select v-model="selectedClass">
      <option v-for="cls in classes" :value="cls.id">{{ cls.name }}</option>
    </select>
    
    <table v-if="students.length">
      <tr v-for="student in students">
        <td>{{ student.name }}</td>
        <td>
          <select v-model="student.status">
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="leave">Leave</option>
          </select>
        </td>
      </tr>
    </table>
    
    <button @click="submitAttendance">Submit</button>
  </div>
</template>

<script>
import api from './api';

export default {
  data() {
    return {
      selectedClass: null,
      selectedSection: null,
      selectedDate: new Date().toISOString().split('T')[0],
      students: []
    };
  },
  methods: {
    async loadStudents() {
      const response = await api.get('/attendance/students/', {
        params: {
          class_id: this.selectedClass,
          section_id: this.selectedSection,
          date: this.selectedDate
        }
      });
      this.students = response.data;
    },
    
    async submitAttendance() {
      const attendanceData = {
        date: this.selectedDate,
        class_id: this.selectedClass,
        section_id: this.selectedSection,
        attendance: this.students.map(s => ({
          student_id: s.student_id,
          status: s.status,
          remarks: s.remarks || ''
        }))
      };
      
      await api.post('/attendance/mark/', attendanceData);
      alert('Attendance marked successfully!');
    }
  }
};
</script>
```

---

## Quick Start Checklist

✅ **Backend Setup:**
1. Backend running on http://localhost:8000
2. Admin user created
3. School profile configured with verification code

✅ **Frontend Setup:**
1. Install axios or fetch for API calls
2. Set up base URL configuration
3. Implement token storage (localStorage/cookies)
4. Create authentication interceptor
5. Implement role-based routing

✅ **Test Flow:**
1. Login as admin
2. Create classes, sections, subjects
3. Test teacher self-registration
4. Approve teacher
5. Login as teacher
6. Mark attendance
7. Enter exam results

---

## Support & Resources

- **Swagger UI**: http://localhost:8000/api/docs/ - Interactive API testing
- **Backend Code**: All implementation in Django REST Framework
- **Authentication**: JWT with 15-min access, 7-day refresh tokens
- **Database**: PostgreSQL (recommended) or SQLite (dev)

---

**This guide provides everything needed for frontend development. All APIs are production-ready and fully tested.**
