# Testing & Validation Guide

## 🧪 Local Testing Before Deployment

### 1. Security Fix Validation

#### Test: Password Not Exposed

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Test user profile endpoint
curl -X GET http://localhost:5000/api/users/[USER_ID] \
  -H "Authorization: Bearer [TOKEN]"

# Verify response does NOT contain 'password' field
# Expected response: { name, email, avatar, posts, _id }
```

#### Test: No Console Credential Logging

```bash
# Start backend and register new user
npm run dev

# Check backend console output
# Should NOT see:
#   - console.log(email)
#   - console.log(password)
#   - console.log(req.body)
```

#### Test: HTML Sanitization Works

```bash
# Via the UI, try to create a post with HTML/script content:
# Title: Test Post
# Content: <script>alert('XSS')</script><p>Real content</p>

# Verify that when viewing the post, no alert appears
# The script tag should be removed by DOMPurify
```

#### Test: CORS Works with Environment Variable

```bash
# Verify CORS accepts your frontend origin
# Set in server/.env:
# ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Test by making request from both origins
# Should work for allowed origins
# Should fail for non-allowed origins
```

### 2. Reliability Fix Validation

#### Test: Edit Post with File Upload

```bash
# 1. Create a new post (with file)
# 2. Edit that post and upload a new thumbnail
# 3. Verify edit succeeds (should not crash with oldPsot error)
```

#### Test: Frontend Navigation

```bash
# 1. Log in successfully
# 2. Click on your profile name in header
# 3. Should navigate to your profile page (not a broken link)
# 4. Resize browser window to mobile size
# 5. Verify hamburger menu opens/closes correctly
```

#### Test: Post Rendering

```bash
# 1. Create a post with rich HTML content (via React Quill)
# 2. View the post detail page
# 3. Content should render correctly without XSS warnings
# 4. Open browser console - no security warnings
```

### 3. Build Validation

#### Production Build

```bash
cd client
npm run build

# Check build folder size is reasonable
# Verify no critical build errors
# Build output should be < 500KB (gzipped)
```

#### Backend Ready Check

```bash
cd server

# Verify all syntax is valid
node --check index.js
node --check controllers/postControllers.js
node --check controllers/userControllers.js
node --check middleware/authMiddleware.js
node --check routes/userRoutes.js
node --check routes/postsRoutes.js

# All should finish silently (no errors)
```

### 4. Configuration Validation

#### Check Environment Files Exist

```bash
ls -la server/.env.example    # Should exist
ls -la client/.env.example    # Should exist

# Verify they have all required variables documented
```

#### Test With Production Settings

```bash
# In server/.env, set:
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3000

# Start server and verify it starts correctly
npm run dev  # or npm start for production

# Check logs for any warnings about missing env vars
```

---

## 📋 Pre-Deployment Checklist

### Code Quality

- [ ] Run `npm run build` in client - completes without errors
- [ ] Backend syntax check passes for all main files
- [ ] No console.log statements with sensitive data remain
- [ ] All `==` comparisons converted to `===`
- [ ] DOMPurify sanitization applied to all HTML renders

### Security

- [ ] Password field removed from user profile endpoints
- [ ] CORS whitelist environment variable configured
- [ ] .env.example files present with all required variables
- [ ] Node environment set to 'production' or 'staging' as appropriate

### Functionality

- [ ] Post creation works end-to-end
- [ ] Post editing with file upload succeeds
- [ ] Post deletion works correctly
- [ ] User profile editing works
- [ ] Avatar upload works
- [ ] User can login/logout
- [ ] User can register
- [ ] Navigation links work (especially profile link)
- [ ] Mobile responsive layout works

### Database

- [ ] MongoDB connection string correct in .env
- [ ] Can create users and posts successfully
- [ ] No database indexing issues (queries perform well)

### API

- [ ] All API endpoints respond correctly
- [ ] Authorization middleware blocks unauthorized requests
- [ ] Error responses use appropriate HTTP status codes

---

## 🔍 Verification Script

Run this to verify all fixes are in place:

```bash
# Check 1: Password not selected in user controller
grep -n "select.*password" server/controllers/userControllers.js
# Expected: NO matches (password not selected)

# Check 2: No credential logging
grep -n "console\.log.*password\|console\.log.*req\.body" server/controllers/userControllers.js
# Expected: NO matches

# Check 3: DOMPurify imported
grep -n "import.*DOMPurify\|require.*DOMPurify" client/src/pages/PostDetail.jsx
# Expected: 1 match

# Check 4: Sanitization applied
grep -n "DOMPurify.sanitize" client/src/pages/PostDetail.jsx
# Expected: 1+ matches

# Check 5: oldPsot typo fixed
grep -n "oldPsot" server/controllers/postControllers.js
# Expected: NO matches (oldPost should be spelled correctly)

# Check 6: CORS environment-driven
grep -n "ALLOWED_ORIGINS" server/index.js
# Expected: 1+ matches

# Check 7: Start script exists
grep -n '"start"' server/package.json
# Expected: 1 match
```

---

## 🚀 Deployment Steps

1. **Prepare Environment**

   ```bash
   # Copy templates
   cp server/.env.example server/.env
   cp client/.env.example client/.env

   # Edit both .env files with production values
   ```

2. **Install & Build**

   ```bash
   # Backend
   cd server
   npm install
   # npm run build (if you have a build step)

   # Frontend
   cd client
   npm install
   npm run build
   ```

3. **Test Locally**

   ```bash
   # Terminal 1: Start backend
   cd server
   npm start

   # Terminal 2: Serve frontend build or start dev server
   cd client
   npm start
   ```

4. **Deploy**
   - Push server to your hosting (Heroku, AWS, DigitalOcean, etc.)
   - Deploy client build to CDN or static hosting (Vercel, Netlify, AWS S3, etc.)
   - Update .env variables in production environment
   - Verify health checks pass
   - Monitor logs for errors

---

## 📞 Support

If you encounter issues:

1. Check PRODUCTION_FIXES_SUMMARY.md for complete list of changes
2. Verify all .env variables are set correctly
3. Check browser console for errors (frontend)
4. Check server logs for errors (backend)
5. Ensure MongoDB connection is working
6. Verify CORS origins match your deployment domain
