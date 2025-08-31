# Forgot Password Implementation

## Overview

This document outlines the forgot password functionality that has been implemented in the wazfni backend system.

## Features Implemented

### 1. Database Schema

- **PasswordResetToken Model**: Added to Prisma schema with the following fields:
  - `id`: Unique identifier
  - `userId`: Foreign key to User
  - `token`: Secure random token
  - `expiresAt`: Token expiration timestamp
  - `used`: Boolean flag to prevent token reuse
  - `createdAt`: Creation timestamp

### 2. Email Service

- **EmailService Class**: New service for handling email functionality
  - Configurable SMTP settings via environment variables
  - Graceful fallback when email configuration is missing
  - Arabic-styled HTML email templates for password reset
  - Includes both HTML and plain text versions

### 3. Authentication Service Extensions

- **forgotPassword()**: Generates secure reset tokens and sends email
  - Security-conscious: doesn't reveal if email exists
  - Handles Google-only users appropriately
  - Cleans up old unused tokens
  - One-hour token expiration
- **resetPassword()**: Validates token and updates password
  - Validates token existence, expiration, and usage
  - Uses database transactions for consistency
  - Automatic cleanup of expired tokens

### 4. API Endpoints

- **POST /auth/forgot-password**: Initiates password reset
- **POST /auth/reset-password**: Completes password reset

## Environment Variables Required

Add these to your `.env` file:

```env
# Email Configuration (Optional - feature will be disabled if missing)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@wazfni.com

# Frontend URL for reset links
FRONTEND_URL=http://localhost:3000
```

## API Usage

### Forgot Password

```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### Reset Password

```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "abc123...",
  "newPassword": "newSecurePassword123"
}
```

**Response:**

```json
{
  "message": "Password has been reset successfully"
}
```

## Security Features

1. **Token Security**:

   - Cryptographically secure random tokens (32 bytes)
   - One-hour expiration
   - Single-use tokens
   - Automatic cleanup

2. **Email Privacy**:

   - Same response regardless of email existence
   - Prevents user enumeration attacks

3. **Google User Handling**:

   - Proper error messages for Google-only accounts
   - Prevents password reset for OAuth users

4. **Database Consistency**:
   - Transaction-based password updates
   - Proper foreign key constraints

## Database Migration

Run the following command to apply the database schema changes:

```bash
npx prisma migrate dev --name add_password_reset_tokens
```

## Frontend Integration

The reset URL format is:

```
${FRONTEND_URL}/reset-password?token=${resetToken}
```

Your frontend should:

1. Extract the token from the URL query parameter
2. Present a password reset form
3. Submit the token and new password to `/auth/reset-password`

## Email Templates

The email service includes a professionally designed Arabic email template with:

- RTL (right-to-left) layout
- Responsive design
- Security warnings
- Clear call-to-action button
- Fallback plain text version

## Error Handling

The implementation includes comprehensive error handling for:

- Invalid/expired tokens
- Missing email configuration
- Database connection issues
- Email delivery failures
- Google-only user accounts

## Testing

To test the functionality:

1. **Setup email configuration** in your `.env` file
2. **Run the migration** to update your database
3. **Test forgot password endpoint** with a valid email
4. **Check email delivery** (check spam folder if needed)
5. **Test reset password endpoint** with the received token

## Dependencies Added

- `nodemailer`: Email sending functionality
- `@types/nodemailer`: TypeScript definitions
- `crypto`: Secure token generation (Node.js built-in)
