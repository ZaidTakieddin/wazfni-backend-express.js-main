# 🚀 **Wazfni Backend API Routes Documentation**

## 📋 **Base URL**

```
http://localhost:3000/api/v1
```

## 🔐 **Authentication**

Most endpoints require authentication via Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

## 📚 **Table of Contents**

- [Authentication Routes](#authentication-routes)
- [User Management Routes](#user-management-routes)
- [Company Management Routes](#company-management-routes)
- [Job Management Routes](#job-management-routes)
- [Category Management Routes](#category-management-routes)
- [Application Management Routes](#application-management-routes)
- [Admin Approval Routes](#admin-approval-routes)
- [Firebase Notification Routes](#firebase-notification-routes)
- [Bookmark Routes](#bookmark-routes)
- [Profile Management Routes](#profile-management-routes)
- [User Behavior Tracking Routes](#user-behavior-tracking-routes)

---

## 🔑 **Authentication Routes**

**Base Path:** `/api/v1/auth`

### **Register User**

- **Method:** `POST`
- **Endpoint:** `/register`
- **Auth Required:** ❌ No
- **Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

### **Login User**

- **Method:** `POST`
- **Endpoint:** `/login`
- **Auth Required:** ❌ No
- **Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### **Google OAuth Login**

- **Method:** `POST`
- **Endpoint:** `/google`
- **Auth Required:** ❌ No
- **Body:**

```json
{
  "googleToken": "google_oauth_token_here"
}
```

### **Change Password**

- **Method:** `PATCH`
- **Endpoint:** `/change-password`
- **Auth Required:** ✅ Yes
- **Body:**

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

### **Logout**

- **Method:** `POST`
- **Endpoint:** `/logout`
- **Auth Required:** ✅ Yes
- **Body:** Empty

---

## 👤 **User Management Routes**

**Base Path:** `/api/v1/users`

### **Get My Profile**

- **Method:** `GET`
- **Endpoint:** `/profile/me`
- **Auth Required:** ✅ Yes
- **Body:** None

### **Update My Profile**

- **Method:** `PATCH`
- **Endpoint:** `/profile/me`
- **Auth Required:** ✅ Yes
- **Content-Type:** `multipart/form-data`
- **Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "jobTitle": "Software Engineer",
  "phone": "+1234567890",
  "city": "Cairo",
  "address": "123 Main St",
  "birthDate": "1990-01-01",
  "gender": "MALE"
}
```

- **Files:** `avatar` (optional), `cv` (optional)

### **Get User Profile by ID**

- **Method:** `GET`
- **Endpoint:** `/:userId/profile`
- **Auth Required:** ✅ Yes
- **Body:** None

### **Get User by ID**

- **Method:** `GET`
- **Endpoint:** `/:userId`
- **Auth Required:** ✅ Yes
- **Body:** None

---

## 🏢 **Company Management Routes**

**Base Path:** `/api/v1/company`

### **Create My Company**

- **Method:** `POST`
- **Endpoint:** `/`
- **Auth Required:** ✅ Yes
- **Content-Type:** `multipart/form-data`
- **Body:**

```json
{
  "name": "Tech Company Ltd",
  "workField": "Technology",
  "description": "Leading tech company",
  "location": "Cairo, Egypt",
  "size": "50-100",
  "website": "https://company.com",
  "city": "Cairo",
  "commercial_register": "12345",
  "tax_number": "67890"
}
```

- **Files:** `logo` (optional)

### **Get My Company**

- **Method:** `GET`
- **Endpoint:** `/`
- **Auth Required:** ✅ Yes
- **Body:** None

### **Update My Company**

- **Method:** `PATCH`
- **Endpoint:** `/`
- **Auth Required:** ✅ Yes
- **Content-Type:** `multipart/form-data`
- **Body:** Same as create (all fields optional)
- **Files:** `logo` (optional)

---

## 💼 **Job Management Routes**

**Base Path:** `/api/v1/jobs`

### **Get All Jobs (Public)**

- **Method:** `GET`
- **Endpoint:** `/`
- **Auth Required:** ✅ Yes
- **Query Parameters:**
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `subCategory` (optional): Filter by subcategory name
  - `subCategoryId` (optional): Filter by subcategory ID
  - `workType` (optional): FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP
  - `contractType` (optional): REMOTE, HYBRID, ON_SITE
  - `experienceLevel` (optional): ENTRY, JUNIOR, MID, SENIOR, LEAD, MANAGER, EXPERT

### **Search Jobs**

- **Method:** `GET`
- **Endpoint:** `/search`
- **Auth Required:** ❌ No
- **Query Parameters:**
  - `q` (optional): Search query
  - `subCategory` (optional): Filter by subcategory name (partial match)
  - `subCategoryId` (optional): Filter by specific subcategory ID (exact match)
  - `workType` (optional): Work type filter
  - `contractType` (optional): Contract type filter
  - `experienceLevel` (optional): Experience level filter
  - `minSalary` (optional): Minimum salary
  - `maxSalary` (optional): Maximum salary
  - `page` (optional): Page number
  - `limit` (optional): Items per page

### **Create Job Post**

- **Method:** `POST`
- **Endpoint:** `/company`
- **Auth Required:** ✅ Yes (Company required)
- **Body:**

```json
{
  "jobTitle": "Senior Developer",
  "subCategoryIds": ["subcategory_id_1", "subcategory_id_2"],
  "workType": "FULL_TIME",
  "contractType": "REMOTE",
  "experienceLevel": "SENIOR",
  "experienceYears": 5,
  "minSalary": 5000,
  "maxSalary": 8000,
  "currency": "USD",
  "salaryType": "RANGE",
  "jobFeatures": ["Health Insurance", "Remote Work"],
  "description": "Job description here",
  "requirements": "Job requirements here",
  "questions": ["Why do you want this job?", "What's your experience?"]
}
```

### **Get My Company Jobs**

- **Method:** `GET`
- **Endpoint:** `/company`
- **Auth Required:** ✅ Yes (Company required)
- **Body:** None

### **Get My Company Jobs by Status**

- **Method:** `GET`
- **Endpoint:** `/company/pending` | `/company/approved` | `/company/rejected` | `/company/archived`
- **Auth Required:** ✅ Yes (Company required)
- **Body:** None

### **Get Single Job**

- **Method:** `GET`
- **Endpoint:** `/:jobId`
- **Auth Required:** ✅ Yes
- **Body:** None

### **Update Job Post**

- **Method:** `PATCH`
- **Endpoint:** `/:jobId`
- **Auth Required:** ✅ Yes (Company required)
- **Body:** Same as create (all fields optional)

### **Delete Job Post**

- **Method:** `DELETE`
- **Endpoint:** `/:jobId`
- **Auth Required:** ✅ Yes (Company required)
- **Body:** None

### **Archive/Unarchive Job**

- **Method:** `PATCH`
- **Endpoint:** `/:jobId/archive` | `/:jobId/unarchive`
- **Auth Required:** ✅ Yes (Company required)
- **Body:** None

---

## 📂 **Category Management Routes**

**Base Path:** `/api/v1/categories`

### **Get All Categories**

- **Method:** `GET`
- **Endpoint:** `/`
- **Auth Required:** ❌ No
- **Body:** None

### **Create Category (Admin Only)**

- **Method:** `POST`
- **Endpoint:** `/`
- **Auth Required:** ✅ Yes (Admin only)
- **Body:**

```json
{
  "name": "تكنولوجيا المعلومات",
  "icon": "tech-icon"
}
```

### **Get Single Category**

- **Method:** `GET`
- **Endpoint:** `/:categoryId`
- **Auth Required:** ❌ No
- **Body:** None

### **Update Category (Admin Only)**

- **Method:** `PATCH`
- **Endpoint:** `/:categoryId`
- **Auth Required:** ✅ Yes (Admin only)
- **Body:** Same as create (all fields optional)

### **Delete Category (Admin Only)**

- **Method:** `DELETE`
- **Endpoint:** `/:categoryId`
- **Auth Required:** ✅ Yes (Admin only)
- **Body:** None

### **Get Subcategories by Category**

- **Method:** `GET`
- **Endpoint:** `/:categoryId/subcategories`
- **Auth Required:** ❌ No
- **Body:** None

### **Create Subcategory (Admin Only)**

- **Method:** `POST`
- **Endpoint:** `/:categoryId/subcategories`
- **Auth Required:** ✅ Yes (Admin only)
- **Body:**

```json
{
  "name": "تطوير الويب"
}
```

### **Subcategory Operations (Admin Only)**

- **Method:** `GET` | `PATCH` | `DELETE`
- **Endpoint:** `/subcategories/:subCategoryId`
- **Auth Required:** ✅ Yes (Admin only for PATCH/DELETE)
- **Body:** For PATCH:

```json
{
  "name": "تطوير التطبيقات"
}
```

---

## 📝 **Application Management Routes**

**Base Path:** `/api/v1/applications`

### **Apply for Job**

- **Method:** `POST`
- **Endpoint:** `/job/:jobId`
- **Auth Required:** ✅ Yes
- **Content-Type:** `multipart/form-data`
- **Body:**

```json
{
  "answers": ["Answer 1", "Answer 2"]
}
```

- **Files:** `cv` (optional)

### **Get Job Applications (Company)**

- **Method:** `GET`
- **Endpoint:** `/company/job/:jobId`
- **Auth Required:** ✅ Yes (Company required)
- **Body:** None

### **Get Single Application**

- **Method:** `GET`
- **Endpoint:** `/:applicationId`
- **Auth Required:** ✅ Yes
- **Body:** None

### **Get My Applications**

- **Method:** `GET`
- **Endpoint:** `/user/applications`
- **Auth Required:** ✅ Yes
- **Body:** None

### **Update Application Status**

- **Method:** `PATCH`
- **Endpoint:** `/:applicationId/status`
- **Auth Required:** ✅ Yes (Company required)
- **Body:**

```json
{
  "status": "ACCEPTED"
}
```

---

## 👨‍💼 **Admin Approval Routes**

**Base Path:** `/api/v1/admin/approval`
**Auth Required:** ✅ Yes (Admin only)

### **Company Approval**

- **Method:** `GET`
- **Endpoint:** `/companies/pending` | `/companies/all`
- **Body:** None

- **Method:** `GET`
- **Endpoint:** `/companies/:companyId`
- **Body:** None

- **Method:** `PATCH`
- **Endpoint:** `/companies/:companyId/approve` | `/companies/:companyId/reject`
- **Body:** For reject:

```json
{
  "rejectionReason": "Incomplete documentation"
}
```

### **Job Approval**

- **Method:** `GET`
- **Endpoint:** `/jobs/pending` | `/jobs/all`
- **Body:** None

- **Method:** `GET`
- **Endpoint:** `/jobs/:jobId`
- **Body:** None

- **Method:** `PATCH`
- **Endpoint:** `/jobs/:jobId/approve` | `/jobs/:jobId/reject`
- **Body:** For reject:

```json
{
  "rejectionReason": "Job description violates policy"
}
```

---

## 🔔 **Firebase Notification Routes**

**Base Path:** `/api/v1/fcm`
**Auth Required:** ✅ Yes

### **Register FCM Token**

- **Method:** `POST`
- **Endpoint:** `/register`
- **Body:**

```json
{
  "token": "fcm_token_here"
}
```

### **Remove FCM Token**

- **Method:** `POST`
- **Endpoint:** `/remove`
- **Body:**

```json
{
  "token": "fcm_token_here"
}
```

---

## 🔖 **Bookmark Routes**

**Base Path:** `/api/v1/bookmarks`
**Auth Required:** ✅ Yes

### **Bookmark Job**

- **Method:** `POST`
- **Endpoint:** `/jobs/:jobId`
- **Body:** None

### **Unbookmark Job**

- **Method:** `DELETE`
- **Endpoint:** `/jobs/:jobId`
- **Body:** None

### **Get Bookmarked Jobs**

- **Method:** `GET`
- **Endpoint:** `/jobs`
- **Body:** None

### **Check Bookmark Status**

- **Method:** `GET`
- **Endpoint:** `/jobs/:jobId/status`
- **Body:** None

---

## 👨‍🎓 **Profile Management Routes**

**Auth Required:** ✅ Yes

### **Work Experience**

**Base Path:** `/api/v1/profile/work-experience`

- **Method:** `POST` | `GET`
- **Endpoint:** `/`
- **Body:** For POST:

```json
{
  "jobTitle": "Software Engineer",
  "companyName": "Tech Corp",
  "startDate": "2020-01-01",
  "endDate": "2023-01-01",
  "description": "Developed web applications",
  "current": false
}
```

- **Method:** `GET` | `PATCH` | `DELETE`
- **Endpoint:** `/:experienceId`
- **Body:** For PATCH: Same as POST (all fields optional)

### **Education Certificates**

**Base Path:** `/api/v1/profile/education-certificates`

- **Method:** `POST` | `GET`
- **Endpoint:** `/`
- **Body:** For POST:

```json
{
  "degree": "Bachelor of Computer Science",
  "university": "Cairo University",
  "certificateName": "Computer Science Degree",
  "startDate": "2016-09-01",
  "endDate": "2020-06-01"
}
```

- **Method:** `GET` | `PATCH` | `DELETE`
- **Endpoint:** `/:certificateId`
- **Body:** For PATCH: Same as POST (all fields optional)

---

## 📊 **User Behavior Tracking Routes**

**Auth Required:** ✅ Yes

### **Category Clicks**

**Base Path:** `/api/v1/category-clicks`

- **Method:** `POST`
- **Endpoint:** `/:subCategoryId`
- **Body:** None

- **Method:** `GET`
- **Endpoint:** `/my-clicks`
- **Body:** None

### **Job View History**

**Base Path:** `/api/v1/job-views`

- **Method:** `POST`
- **Endpoint:** `/:jobId`
- **Body:** None

- **Method:** `GET`
- **Endpoint:** `/my-views`
- **Body:** None

- **Method:** `GET`
- **Endpoint:** `/recommended`
- **Body:** None

---

## 📋 **Response Format**

### **Success Response**

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### **Error Response**

```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

### **Validation Error Response**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 🔐 **Authorization Levels**

| Level          | Description                           |
| -------------- | ------------------------------------- |
| ❌ **Public**  | No authentication required            |
| ✅ **User**    | Requires valid JWT token              |
| 🏢 **Company** | Requires user with associated company |
| 👨‍💼 **Admin**   | Requires admin role                   |

---

## 📱 **File Upload Endpoints**

### **Supported File Types**

- **Images:** `.jpg`, `.jpeg`, `.png`, `.gif` (max 5MB)
- **Documents:** `.pdf`, `.doc`, `.docx` (max 10MB)

### **Upload Fields**

- `avatar`: User profile picture
- `cv`: User CV document
- `logo`: Company logo

---

## 🚀 **Getting Started**

1. **Register a new user:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

2. **Login to get token:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

3. **Use token for authenticated requests:**

```bash
curl -X GET http://localhost:3000/api/v1/users/profile/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📞 **Support**

For API support and questions, please contact the development team.

**Last Updated:** December 2024
