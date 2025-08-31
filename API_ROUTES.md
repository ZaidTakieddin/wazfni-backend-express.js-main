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
- [Pagination](#pagination)

---

## 📄 **Pagination (Optional)**

All list endpoints support **optional pagination**. You can choose between:

- **Paginated**: Include `page` and/or `limit` parameters to get paginated results
- **Unpaginated**: Omit pagination parameters to get all results at once

### **Pagination Parameters**

- `page` (optional): Page number (default: 1, minimum: 1)
- `limit` (optional): Items per page (default: 10, minimum: 1, maximum: 100)
- `sortBy` (optional): Sort field (varies by endpoint, see specific endpoint documentation)
- `sortOrder` (optional): Sort direction - `asc` or `desc` (default: desc)

### **Response Formats**

**Paginated Response** (when pagination parameters are provided):

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Unpaginated Response** (when no pagination parameters are provided):

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...]
}
```

### **Examples**

**Get paginated jobs:**

```
GET /api/v1/jobs?page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

**Get all jobs (no pagination):**

```
GET /api/v1/jobs
```

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

### **Forgot Password**

- **Method:** `POST`
- **Endpoint:** `/forgot-password`
- **Auth Required:** ❌ No
- **Body:**

```json
{
  "email": "user@example.com"
}
```

- **Response:**

```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

**Note:** For security reasons, the same message is returned regardless of whether the email exists or not.

### **Reset Password**

- **Method:** `POST`
- **Endpoint:** `/reset-password`
- **Auth Required:** ❌ No
- **Body:**

```json
{
  "token": "reset_token_from_email",
  "newPassword": "newPassword123"
}
```

- **Response:**

```json
{
  "message": "Password has been reset successfully"
}
```

**Note:** The reset token is provided in the email sent by the forgot password endpoint. Tokens expire after 1 hour and can only be used once.

---

## 👤 **User Management Routes**

**Base Path:** `/api/v1/users`

### **🔹 Regular User Profile Routes**

#### **Get My Profile**

- **Method:** `GET`
- **Endpoint:** `/profile/me`
- **Auth Required:** ✅ Yes
- **Body:** None

#### **Update My Profile**

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

#### **Get User Profile by ID**

- **Method:** `GET`
- **Endpoint:** `/:userId/profile`
- **Auth Required:** ✅ Yes
- **Body:** None

#### **Get User by ID**

- **Method:** `GET`
- **Endpoint:** `/:userId`
- **Auth Required:** ✅ Yes
- **Body:** None

### **👨‍💼 Admin User Management Routes**

#### **Get User Statistics**

- **Method:** `GET`
- **Endpoint:** `/admin/statistics`
- **Auth Required:** ✅ Yes (Admin only)
- **Body:** None
- **Response:**

```json
{
  "totalUsers": 150,
  "verifiedUsers": 120,
  "unverifiedUsers": 30,
  "adminUsers": 3,
  "regularUsers": 147,
  "usersWithCompanies": 45,
  "usersWithoutCompanies": 105,
  "recentUsers": 15
}
```

#### **Get All Users**

- **Method:** `GET`
- **Endpoint:** `/admin/users`
- **Auth Required:** ✅ Yes (Admin only)
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `createdAt`, `updatedAt`, `email`, `role`, `isVerified`, `lastLogin` (default: createdAt)
  - `role` (optional): Filter by role - `USER` or `ADMIN`
  - `isVerified` (optional): Filter by verification status - `true` or `false`
  - `search` (optional): Search by email, firstName, or lastName
- **Response:**

```json
{
  "data": [
    {
      "id": "user_id",
      "email": "user@example.com",
      "role": "USER",
      "isVerified": true,
      "lastLogin": "2024-01-01T00:00:00Z",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+1234567890",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "jobTitle": "Software Engineer",
        "city": "Cairo",
        "avatar": "path/to/avatar.jpg"
      },
      "company": {
        "id": "company_id",
        "name": "Tech Corp",
        "workField": "Technology",
        "approvalStatus": "APPROVED"
      },
      "_count": {
        "applications": 5,
        "bookmarks": 10
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### **Create New User**

- **Method:** `POST`
- **Endpoint:** `/admin/users`
- **Auth Required:** ✅ Yes (Admin only)
- **Body:**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "role": "USER",
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "isVerified": true
}
```

- **Response:**

```json
{
  "message": "User created successfully",
  "user": {
    "id": "user_id",
    "email": "newuser@example.com",
    "role": "USER",
    "firstName": "Jane",
    "lastName": "Smith",
    "phoneNumber": "+1234567890",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### **Get User Details**

- **Method:** `GET`
- **Endpoint:** `/admin/users/:userId`
- **Auth Required:** ✅ Yes (Admin only)
- **Body:** None
- **Response:**

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "USER",
    "isVerified": true,
    "lastLogin": "2024-01-01T00:00:00Z",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "profile": {
    "id": "profile_id",
    "firstName": "John",
    "lastName": "Doe",
    "jobTitle": "Software Engineer",
    "city": "Cairo",
    "address": "123 Main St",
    "birthDate": "1990-01-01T00:00:00Z",
    "gender": "MALE",
    "cv": "path/to/cv.pdf",
    "avatar": "path/to/avatar.jpg",
    "workExperiences": [...],
    "educationCertificates": [...]
  }
}
```

#### **Update User**

- **Method:** `PATCH`
- **Endpoint:** `/admin/users/:userId`
- **Auth Required:** ✅ Yes (Admin only)
- **Body:**

```json
{
  "email": "updated@example.com",
  "password": "newpassword123",
  "role": "ADMIN",
  "firstName": "Updated",
  "lastName": "Name",
  "phoneNumber": "+9876543210",
  "isVerified": false
}
```

- **Response:**

```json
{
  "message": "User updated successfully",
  "user": {
    "id": "user_id",
    "email": "updated@example.com",
    "role": "ADMIN",
    "firstName": "Updated",
    "lastName": "Name",
    "phoneNumber": "+9876543210",
    "isVerified": false,
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### **Delete User**

- **Method:** `DELETE`
- **Endpoint:** `/admin/users/:userId`
- **Auth Required:** ✅ Yes (Admin only)
- **Body:** None
- **Response:** `204 No Content`
- **Note:** This will permanently delete the user and all associated data including:
  - User profile and uploaded files (CV, avatar)
  - Company data and logo (if user owns a company)
  - All applications, bookmarks, and activity history

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
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `createdAt`, `updatedAt`, `jobTitle`, `workType`, `contractType`, `experienceLevel`, `minSalary`, `maxSalary` (default: createdAt)
  - `subCategory` (optional): Filter by subcategory name
  - `subCategoryId` (optional): Filter by subcategory ID
  - `workType` (optional): FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP
  - `contractType` (optional): REMOTE, HYBRID, ON_SITE
  - `experienceLevel` (optional): ENTRY, JUNIOR, MID, SENIOR, LEAD, MANAGER, EXPERT
- **Response:**

```json
{
  "data": [
    {
      "id": "job_id",
      "jobTitle": "Senior Developer",
      "company": {
        "name": "Tech Corp",
        "logo": "path/to/logo.jpg"
      },
      "workType": "FULL_TIME",
      "contractType": "REMOTE",
      "experienceLevel": "SENIOR",
      "minSalary": 5000,
      "maxSalary": 8000,
      "currency": "USD",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **Search Jobs**

- **Method:** `GET`
- **Endpoint:** `/search`
- **Auth Required:** ❌ No (Optional: Include auth token to get bookmark status)
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `createdAt`, `updatedAt`, `jobTitle`, `workType`, `contractType`, `experienceLevel`, `minSalary`, `maxSalary` (default: createdAt)
  - `searchTerm` (optional): Search query across job title, description, requirements, and company name
  - `title` (optional): Filter by job title (partial match)
  - `city` (optional): Filter by company city (partial match)
  - `subCategory` (optional): Filter by subcategory name (partial match)
  - `subCategoryId` (optional): Filter by specific subcategory ID (exact match)
  - `categoryId` (optional): Filter by category ID (exact match)
  - `companyName` (optional): Filter by company name (partial match)
  - `workType` (optional): Work type filter (comma-separated for multiple values, e.g., "FULL_TIME,PART_TIME")

**Examples:**

```
# Search for software jobs in Cairo
GET /api/v1/jobs/search?searchTerm=software&city=cairo

# Filter by category
GET /api/v1/jobs/search?categoryId=tech_category_id

# Filter by subcategory
GET /api/v1/jobs/search?subCategoryId=web_dev_subcategory_id

# Filter by work type
GET /api/v1/jobs/search?workType=FULL_TIME,REMOTE

# Search with pagination
GET /api/v1/jobs/search?page=1&limit=10&sortBy=createdAt&sortOrder=desc

# Search with authentication (includes bookmark status)
GET /api/v1/jobs/search?searchTerm=developer
Authorization: Bearer <your_token>
```

**Response:**

```json
[
  {
    "id": "job_id",
    "jobTitle": "Senior Software Engineer",
    "description": "We are looking for a senior developer...",
    "requirements": "5+ years of experience...",
    "workType": "FULL_TIME",
    "contractType": "REMOTE",
    "experienceLevel": "SENIOR",
    "minSalary": 5000,
    "maxSalary": 8000,
    "currency": "USD",
    "salaryType": "RANGE",
    "isBookmarked": true, // Only included if user is authenticated
    "company": {
      "id": "company_id",
      "name": "Tech Company",
      "city": "Cairo"
    },
    "subCategories": [
      {
        "id": "subcategory_id",
        "name": "Web Development",
        "category": {
          "id": "category_id",
          "name": "Technology"
        }
      }
    ],
    "_count": {
      "applications": 15
    }
  }
]
```

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
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `createdAt`, `updatedAt`, `jobTitle`, `workType`, `contractType`, `experienceLevel`, `minSalary`, `maxSalary` (default: createdAt)
- **Response:** Paginated list of company's jobs

### **Get My Company Jobs by Status**

- **Method:** `GET`
- **Endpoint:** `/company/pending` | `/company/approved` | `/company/rejected` | `/company/archived`
- **Auth Required:** ✅ Yes (Company required)
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `createdAt`, `updatedAt`, `jobTitle`, `workType`, `contractType`, `experienceLevel`, `minSalary`, `maxSalary` (default: createdAt)
- **Response:** Paginated list of company's jobs filtered by status

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
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `name`, `createdAt`, `updatedAt` (default: name)
- **Response:**

```json
{
  "data": [
    {
      "id": "category_id",
      "name": "تكنولوجيا المعلومات",
      "icon": "tech-icon",
      "subCategories": [
        {
          "id": "subcategory_id",
          "name": "تطوير الويب"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

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
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `name`, `createdAt`, `updatedAt` (default: name)
- **Response:**

```json
{
  "data": [
    {
      "id": "subcategory_id",
      "name": "تطوير الويب",
      "category": {
        "id": "category_id",
        "name": "تكنولوجيا المعلومات"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

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
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `appliedAt`, `updatedAt`, `status` (default: appliedAt)
- **Response:**

```json
{
  "data": [
    {
      "id": "application_id",
      "applicant": {
        "id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "status": "PENDING",
      "appliedAt": "2024-01-01T00:00:00Z",
      "answers": ["Answer 1", "Answer 2"],
      "cvPath": "path/to/cv.pdf"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **Get Single Application**

- **Method:** `GET`
- **Endpoint:** `/:applicationId`
- **Auth Required:** ✅ Yes
- **Body:** None

### **Get My Applications**

- **Method:** `GET`
- **Endpoint:** `/user/applications`
- **Auth Required:** ✅ Yes
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `appliedAt`, `updatedAt`, `status` (default: appliedAt)
- **Response:** Paginated list of user's applications

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

#### **Get Pending Companies**

- **Method:** `GET`
- **Endpoint:** `/companies/pending`
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `createdAt`, `updatedAt`, `name`, `workField`, `city`, `approvalStatus` (default: createdAt)
- **Response:** Paginated list of pending companies

#### **Get All Companies**

- **Method:** `GET`
- **Endpoint:** `/companies/all`
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `createdAt`, `updatedAt`, `name`, `workField`, `city`, `approvalStatus` (default: createdAt)
- **Response:** Paginated list of all companies

#### **Get Company Details**

- **Method:** `GET`
- **Endpoint:** `/companies/:companyId`
- **Body:** None

#### **Approve/Reject Company**

- **Method:** `PATCH`
- **Endpoint:** `/companies/:companyId/approve` | `/companies/:companyId/reject`
- **Body:** For reject:

```json
{
  "rejectionReason": "Incomplete documentation"
}
```

### **Job Approval**

#### **Get Pending Jobs**

- **Method:** `GET`
- **Endpoint:** `/jobs/pending`
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `createdAt`, `updatedAt`, `jobTitle`, `workType`, `contractType`, `experienceLevel`, `minSalary`, `maxSalary` (default: createdAt)
- **Response:** Paginated list of pending jobs

#### **Get All Jobs**

- **Method:** `GET`
- **Endpoint:** `/jobs/all`
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `createdAt`, `updatedAt`, `jobTitle`, `workType`, `contractType`, `experienceLevel`, `minSalary`, `maxSalary` (default: createdAt)
- **Response:** Paginated list of all jobs

#### **Get Job Details**

- **Method:** `GET`
- **Endpoint:** `/jobs/:jobId`
- **Body:** None

#### **Approve/Reject Job**

- **Method:** `PATCH`
- **Endpoint:** `/jobs/:jobId/approve` | `/jobs/:jobId/reject`
- **Body:** For reject:

```json
{
  "rejectionReason": "Job description violates policy"
}
```

---

## 🔔 **Push Notification Routes (Expo)**

**Base Path:** `/api/v1/fcm`
**Auth Required:** ✅ Yes

### **Register Expo Push Token**

- **Method:** `POST`
- **Endpoint:** `/register`
- **Body:**

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

- **Response:**

```json
{
  "success": true,
  "message": "تم تسجيل رمز الإشعارات بنجاح"
}
```

### **Remove Expo Push Token**

- **Method:** `POST`
- **Endpoint:** `/remove`
- **Body:**

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

- **Response:**

```json
{
  "success": true,
  "message": "تم حذف رمز الإشعارات بنجاح"
}
```

### **Test Push Notification (Development)**

- **Method:** `POST`
- **Endpoint:** `/test`
- **Body:** None

- **Response:**

```json
{
  "success": true,
  "message": "تم إرسال الإشعار التجريبي بنجاح"
}
```

**Note:** This endpoint sends a test notification to the authenticated user. It requires the user to have a registered Expo push token.

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
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `createdAt`, `updatedAt`, `jobTitle`, `workType`, `contractType`, `experienceLevel`, `minSalary`, `maxSalary` (default: createdAt)
- **Response:**

```json
{
  "data": [
    {
      "id": "job_id",
      "jobTitle": "Senior Developer",
      "company": {
        "name": "Tech Corp",
        "logo": "path/to/logo.jpg"
      },
      "workType": "FULL_TIME",
      "contractType": "REMOTE",
      "experienceLevel": "SENIOR",
      "minSalary": 5000,
      "maxSalary": 8000,
      "currency": "USD",
      "bookmarkedAt": "2024-01-01T00:00:00Z",
      "isBookmarked": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 20,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **Check Bookmark Status**

- **Method:** `GET`
- **Endpoint:** `/jobs/:jobId/status`
- **Body:** None

---

## 👨‍🎓 **Profile Management Routes**

**Auth Required:** ✅ Yes

### **Work Experience**

**Base Path:** `/api/v1/profile/work-experience`

#### **Create Work Experience**

- **Method:** `POST`
- **Endpoint:** `/`
- **Body:**

```json
{
  "jobTitle": "Software Engineer",
  "companyName": "Tech Corp",
  "startDate": "2020-01-01T00:00:00Z",
  "endDate": "2023-01-01T00:00:00Z",
  "description": "Developed web applications",
  "current": false
}
```

#### **Get My Work Experiences**

- **Method:** `GET`
- **Endpoint:** `/`
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `startDate`, `createdAt`, `updatedAt`, `name` (default: startDate)
- **Response:**

```json
{
  "data": [
    {
      "id": "experience_id",
      "jobTitle": "Software Engineer",
      "companyName": "Tech Corp",
      "startDate": "2020-01-01T00:00:00Z",
      "endDate": "2023-01-01T00:00:00Z",
      "description": "Developed web applications",
      "current": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### **Work Experience Operations**

- **Method:** `GET` | `PATCH` | `DELETE`
- **Endpoint:** `/:workExperienceId`
- **Body:** For PATCH: Same as POST (all fields optional)

### **Education Certificates**

**Base Path:** `/api/v1/profile/education-certificates`

#### **Create Education Certificate**

- **Method:** `POST`
- **Endpoint:** `/`
- **Body:**

```json
{
  "degree": "Bachelor of Computer Science",
  "university": "Cairo University",
  "certificateName": "Computer Science Degree",
  "startDate": "2016-09-01T00:00:00Z",
  "endDate": "2020-06-01T00:00:00Z"
}
```

#### **Get My Education Certificates**

- **Method:** `GET`
- **Endpoint:** `/`
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `startDate`, `createdAt`, `updatedAt`, `name` (default: startDate)
- **Response:**

```json
{
  "data": [
    {
      "id": "certificate_id",
      "degree": "Bachelor of Computer Science",
      "university": "Cairo University",
      "certificateName": "Computer Science Degree",
      "startDate": "2016-09-01T00:00:00Z",
      "endDate": "2020-06-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### **Education Certificate Operations**

- **Method:** `GET` | `PATCH` | `DELETE`
- **Endpoint:** `/:certificateId`
- **Body:** For PATCH: Same as POST (all fields optional)

---

## 📊 **User Behavior Tracking Routes**

**Auth Required:** ✅ Yes

### **Category Clicks**

**Base Path:** `/api/v1/category-clicks`

#### **Record Category Click**

- **Method:** `POST`
- **Endpoint:** `/:subCategoryId`
- **Body:** None

#### **Get My Category Clicks**

- **Method:** `GET`
- **Endpoint:** `/my-clicks`
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `lastClickedAt`, `createdAt`, `updatedAt`, `name` (default: lastClickedAt)
- **Response:**

```json
{
  "data": [
    {
      "id": "click_id",
      "clickCount": 5,
      "lastClickedAt": "2024-01-01T00:00:00Z",
      "subCategory": {
        "name": "تطوير الويب",
        "category": {
          "name": "تكنولوجيا المعلومات"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 12,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **Job View History**

**Base Path:** `/api/v1/job-views`

#### **Record Job View**

- **Method:** `POST`
- **Endpoint:** `/:jobId`
- **Body:** None

#### **Get My Job Views**

- **Method:** `GET`
- **Endpoint:** `/my-views`
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `lastViewedAt`, `createdAt`, `updatedAt`, `name` (default: lastViewedAt)
- **Response:**

```json
{
  "data": [
    {
      "id": "view_id",
      "viewCount": 3,
      "lastViewedAt": "2024-01-01T00:00:00Z",
      "job": {
        "id": "job_id",
        "jobTitle": "Senior Developer",
        "company": {
          "name": "Tech Corp"
        },
        "workType": "FULL_TIME",
        "contractType": "REMOTE",
        "experienceLevel": "SENIOR",
        "subCategories": [
          {
            "name": "تطوير الويب",
            "category": {
              "name": "تكنولوجيا المعلومات"
            }
          }
        ],
        "_count": {
          "applications": 15
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### **Get Recommended Jobs**

- **Method:** `GET`
- **Endpoint:** `/recommended`
- **Query Parameters:**
  - **Pagination:** `page`, `limit`, `sortOrder`
  - `sortBy` (optional): `createdAt`, `updatedAt`, `jobTitle`, `workType`, `contractType`, `experienceLevel`, `minSalary`, `maxSalary` (default: createdAt)
- **Response:**

```json
{
  "data": [
    {
      "id": "job_id",
      "jobTitle": "Frontend Developer",
      "company": {
        "name": "Web Solutions Inc"
      },
      "workType": "FULL_TIME",
      "contractType": "HYBRID",
      "experienceLevel": "MID",
      "minSalary": 4000,
      "maxSalary": 6000,
      "currency": "USD",
      "subCategories": [
        {
          "name": "تطوير الويب",
          "category": {
            "name": "تكنولوجيا المعلومات"
          }
        }
      ],
      "_count": {
        "applications": 8
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 30,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

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

### **Paginated Success Response**

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
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

4. **Get paginated data:**

```bash
curl -X GET "http://localhost:3000/api/v1/jobs?page=1&limit=20&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📞 **Support**

For API support and questions, please contact the development team.

**Last Updated:** December 2024
