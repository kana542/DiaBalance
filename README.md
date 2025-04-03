# DiaBalance (dev build)

## Project Structure
```
frontend/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── css/
    │   ├── main.css
    │   ├── login.css
    │   ├── register.css
    │   └── dashboard.css
    ├── js/
    │   ├── main.js
    │   ├── auth.js
    │   └── dashboard.js
    └── pages/
        ├── login.html
        ├── register.html
        └── dashboard.html
```

## Authentication Implementation
- The frontend uses **JWT tokens** for authentication
- Tokens are stored in **localStorage** along with basic user info
- Protected routes check for valid tokens and redirect to login if missing
- Logout removes tokens from localStorage

## Required Backend API Endpoints

### 1. User Registration
- **Endpoint**: `/api/auth/register`
- **Method**: POST
- **Body**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Expected Response**:
  ```json
  {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "username": "username",
      "email": "user_email",
      "role": "user_role"
    }
  }
  ```
  
### 2. User Login
- **Endpoint**: `/api/auth/login`
- **Method**: POST
- **Body**:
  ```json
  {
    "email": "string", // Can be username or email
    "password": "string"
  }
  ```
- **Expected Response**:
  ```json
  {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "username": "username",
      "email": "user_email",
      "role": "user_role"
    }
  }
  ```

### 3. Token Validation
- **Endpoint**: `/api/auth/validate`
- **Method**: GET
- **Headers**:
  ```
  Authorization: Bearer jwt_token_here
  ```
- **Expected Response**:
  ```json
  {
    "valid": true,
    "user": {
      "id": "user_id",
      "username": "username",
      "email": "user_email",
      "role": "user_role"
    }
  }
  ```

## JWT Token Requirements
- Token should contain at minimum:
  - User ID
  - Username
  - User role (for role-based access control)
- Recommended expiration time: 24 hours

## LocalStorage Structure
The frontend stores the following in localStorage:
1. `token`: JWT authentication token
2. `user`: JSON string containing user info (id, username, email, role)

## Page Flow
1. **index.html**: Entry point that shows login/logout button based on auth status
2. **login.html**: Form for user login, redirects to dashboard on success
3. **register.html**: Form for new user registration
4. **dashboard.html**: Protected page that displays "OK" when authenticated

## Testing Notes
- All API endpoints should return appropriate HTTP status codes
- For failed authentication, return 401 Unauthorized
- For validation errors, return 400 Bad Request with a message
- CORS headers must be properly configured to allow frontend requests
