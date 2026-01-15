# School ERP - Complete API Endpoints Reference

**Base URL:** `http://localhost:8000/api/v1/`
**Total Endpoints:** 50+
**Authentication:** JWT Bearer Token

---

## Quick Reference

### Authentication (Public)
```
POST   /auth/login/                              Login & get tokens
POST   /auth/refresh/                            Refresh access token
POST   /teachers/self-register/                  Teacher registration (public)
```

### School Profile
```
GET    /school/profile/                          Get school info
PATCH  /school/profile/                          Update school (Admin)
GET    /school/verification-code/                Get code (Admin)
POST   /school/regenerate-code/                  Regenerate code (Admin)
```

### Teachers
```
GET    /teachers/                                List teachers
POST   /teachers/                                Create teacher (Admin)
GET    /teachers/{id}/                           Get teacher details
PATCH  /teachers/{id}/                           Update teacher (Admin)
DELETE /teachers/{id}/                           Delete teacher (Admin)
GET    /teachers/pending/                        Pending registrations (Admin)
PATCH  /teachers/{id}/approve/                   Approve teacher (Admin)
PATCH  /teachers/{id}/reject/                    Reject teacher (Admin)
```

### Academic - Classes
```
GET    /classes/                                 List classes
POST   /classes/                                 Create class (Admin)
GET    /classes/{id}/                            Get class
PATCH  /classes/{id}/                            Update class (Admin)
DELETE /classes/{id}/                            Delete class (Admin)
```

### Academic - Sections
```
GET    /sections/                                List sections
POST   /sections/                                Create section (Admin)
GET    /sections/{id}/                           Get section
PATCH  /sections/{id}/                           Update section (Admin)
DELETE /sections/{id}/                           Delete section (Admin)
```

### Academic - Subjects
```
GET    /subjects/                                List subjects
POST   /subjects/                                Create subject (Admin)
GET    /subjects/{id}/                           Get subject
PATCH  /subjects/{id}/                           Update subject (Admin)
DELETE /subjects/{id}/                           Delete subject (Admin)
```

### Academic - Assignments
```
GET    /assignments/                             List assignments
POST   /assignments/                             Create assignment (Admin)
GET    /assignments/{id}/                        Get assignment
PATCH  /assignments/{id}/                        Update assignment (Admin)
DELETE /assignments/{id}/                        Delete assignment (Admin)
```

### Students
```
GET    /students/                                List students
POST   /students/                                Admit student (Admin)
GET    /students/{id}/                           Get student
PATCH  /students/{id}/                           Update student (Admin)
DELETE /students/{id}/                           Delete student (Admin)
GET    /students/{id}/parents/                   Get parents
```

### Attendance
```
POST   /attendance/mark/                         Bulk mark  (Teacher/Admin)
GET    /attendance/students/                     Get students for marking
GET    /attendance/student/{id}/                 History + stats
GET    /attendance/                              List records
POST   /attendance/                              Create record (Teacher/Admin)
PATCH  /attendance/{id}/                         Update record (Teacher/Admin)
DELETE /attendance/{id}/                         Delete record (Admin)
```

### Fees - Structures
```
GET    /fees/structures/                         List structures
POST   /fees/structures/                         Create structure (Admin)
GET    /fees/structures/{id}/                    Get structure
PATCH  /fees/structures/{id}/                    Update structure (Admin)
DELETE /fees/structures/{id}/                    Delete structure (Admin)
```

### Fees - Invoices
```
POST   /fees/invoices/generate/                  Generate invoices (Admin)
GET    /fees/invoices/                           List invoices
GET    /fees/invoices/{id}/                      Get invoice
PATCH  /fees/invoices/{id}/                      Update invoice (Admin)
DELETE /fees/invoices/{id}/                      Delete invoice (Admin)
```

### Fees - Payments
```
POST   /fees/payments/                           Record payment (Admin)
GET    /fees/payments/                           List payments
GET    /fees/payments/{id}/                      Get receipt
```

### Exams
```
GET    /exams/                                   List exams
POST   /exams/                                   Create exam (Admin)
GET    /exams/{id}/                              Get exam
PATCH  /exams/{id}/                              Update exam (Admin)
DELETE /exams/{id}/                              Delete exam (Admin)
PATCH  /exams/{id}/publish/                      Publish results (Admin)
```

### Exam Results
```
POST   /exams/results/bulk-entry/                Bulk entry (Teacher/Admin)
GET    /exams/{exam_id}/report-card/{student_id}/ Report card
GET    /exams/results/                           List results
POST   /exams/results/                           Create result (Teacher/Admin)
PATCH  /exams/results/{id}/                      Update result (Teacher/Admin)
DELETE /exams/results/{id}/                      Delete result (Admin)
```

---

## Common Query Parameters

**Filtering:**
- `?status=active` - Filter by status
- `?class_id=1` - Filter by class
- `?section_id=1` - Filter by section
- `?academic_year=2024-25` - Filter by year
- `?search=keyword` - Search

**Pagination (automatic):**
- Default: 25 items per page
- Returns: `count`, `next`, `previous`, `results`

**Ordering:**
- Most lists ordered by `-created_at` (newest first)

---

**All endpoints return JSON. See FRONTEND_INTEGRATION_GUIDE.md for detailed examples.**
