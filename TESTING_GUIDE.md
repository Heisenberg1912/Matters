# Matters App - Complete Testing Guide

## 🎉 What's Been Implemented

Your Matters app is now **fully functional** with the following features:

### ✅ Core Features
- **Real Authentication** - Username/password with JWT tokens
- **User Registration** - Separate flows for Customers and Contractors
- **File Uploads** - Photos and documents with 10MB limit
- **Real-time Notifications** - Pusher-powered instant updates
- **Admin Analytics** - Comprehensive dashboard with charts
- **Job Management** - Post jobs, receive bids, accept/reject
- **Progress Tracking** - Contractors submit updates with photos
- **All existing features** from your original codebase

---

## 🚀 Setup Instructions

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

**Required Variables (Minimum):**
```env
MONGODB_URI=mongodb://localhost:27017/matters
JWT_SECRET=your-secret-key-min-32-characters-long
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
PORT=4000
```

**Optional - Pusher (for real-time notifications):**
1. Sign up at https://pusher.com (free tier available)
2. Create a new app/channel
3. Add to `.env`:
```env
PUSHER_ENABLED=true
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=mt1
```

**Optional - Client Environment (for Pusher):**
Create `client/.env`:
```env
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=mt1
VITE_API_URL=http://localhost:4000
```

### 2. Install Dependencies

Already done, but if needed:
```bash
# Server
cd server
npm install

# Client
cd client
npm install
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Server will start on http://localhost:4000

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Client will start on http://localhost:5173

---

## 🧪 Testing Workflows

### Test 1: User Registration & Login

**Step 1.1 - Register as Customer**
1. Open http://localhost:5173
2. Click "Create Account"
3. Fill in the form:
   - Name: John Doe
   - Email: john@test.com
   - Password: password123 (min 8 chars)
   - Confirm Password: password123
   - Role: Select "Customer"
4. Click "Create Account"
5. ✅ You should be auto-logged in and redirected to /home

**Step 1.2 - Register as Contractor**
1. Logout (if logged in)
2. Go to /register
3. Fill in the form:
   - Name: Mike Builder
   - Email: mike@test.com
   - Password: password123
   - Role: Select "Contractor"
   - Company Name: Builder Co.
   - Specializations: Select at least 2 (e.g., "Residential", "Renovation")
4. Click "Create Account"
5. ✅ You should be redirected to /contractor/dashboard

**Step 1.3 - Login**
1. Logout
2. Go to /login
3. Enter: john@test.com / password123
4. ✅ Should login successfully

**Step 1.4 - Session Persistence**
1. While logged in, refresh the page
2. ✅ You should stay logged in

**Default Demo Accounts (still work):**
- customer@matters.com / customer123
- contractor@matters.com / contractor123
- admin@matters.com / admin123

---

### Test 2: Job Posting & Bidding Workflow

**Prerequisites:**
- Logged in as Customer (john@test.com)
- Have at least one project created

**Step 2.1 - Post a Job (Customer)**
1. Navigate to `/customer/post-job`
2. Fill in the form:
   - Select a project (or create one first)
   - Job Title: "Kitchen Renovation"
   - Description: "Need complete kitchen remodel"
   - Work Type: "Renovation"
   - Budget: Min 50000, Max 100000
   - Specializations: Select "Renovation", "Plumbing"
   - Timeline: Start date + 30 days duration
3. Click "Post Job"
4. ✅ Should redirect to /customer/bids
5. ✅ Job should appear in the list

**Step 2.2 - View & Bid on Job (Contractor)**
1. Logout and login as contractor (mike@test.com or contractor@matters.com)
2. Navigate to `/contractor/jobs`
3. ✅ Your posted job should appear in the list
4. Click on the job to view details
5. Fill in the bid form:
   - Amount: 75000
   - Proposal: "Experienced in kitchen renovation with 10+ years..."
   - Duration: 20 days
6. Click "Submit Bid"
7. ✅ Should show success message
8. ✅ **If Pusher configured:** Customer should receive notification

**Step 2.3 - View & Accept Bid (Customer)**
1. Logout and login as customer (john@test.com)
2. Navigate to `/customer/bids`
3. ✅ Should see the job with "1 Pending" badge
4. Click to expand and view bids
5. Click "Accept" on Mike's bid
6. ✅ Bid status should change to "Accepted"
7. ✅ Other bids (if any) should be rejected
8. ✅ **If Pusher configured:** Contractor receives "Bid Accepted" notification

**Step 2.4 - View Assignment (Contractor)**
1. Login as contractor
2. Navigate to `/contractor/assignments`
3. ✅ The accepted job should appear in your assignments

---

### Test 3: Progress Updates with File Upload

**Prerequisites:**
- Contractor has an assigned job (from Test 2)

**Step 3.1 - Submit Progress Update**
1. Login as contractor (mike@test.com)
2. Navigate to `/contractor/progress`
3. Fill in the form:
   - Select the assigned job
   - Update Type: "Daily Update"
   - Description: "Completed demolition of old cabinets"
   - Progress %: 25
   - Hours Worked: 8
   - Workers on Site: 3
4. (Optional) Upload photos:
   - Drag & drop or click to select images
   - Select 1-3 photos (max 10MB each)
5. Click "Submit Progress Update"
6. ✅ Should show success message
7. ✅ **If Pusher configured:** Customer receives notification

**Note:** File uploads are saved to `server/uploads/` directory and accessible at `http://localhost:4000/uploads/filename.jpg`

---

### Test 4: Real-time Notifications

**Prerequisites:**
- Pusher configured in both server and client `.env` files
- Two browser windows or incognito mode

**Setup:**
- Window 1: Logged in as Customer
- Window 2: Logged in as Contractor

**Test 4.1 - Bid Notification**
1. Customer window: Stay on any page
2. Contractor window: Submit a bid on customer's job
3. ✅ Customer should see toast notification: "New Bid Received"
4. ✅ Notification bell should show badge with count

**Test 4.2 - Bid Acceptance Notification**
1. Contractor window: Stay on any page
2. Customer window: Accept a bid
3. ✅ Contractor sees toast: "Bid Accepted! 🎉"

**Test 4.3 - Progress Update Notification**
1. Customer window: Stay on any page
2. Contractor window: Submit progress update
3. ✅ Customer sees toast: "New Progress Update"

**Test 4.4 - Notification Bell**
1. Click the bell icon in the navigation
2. ✅ Should show dropdown with all notifications
3. ✅ Unread notifications highlighted
4. Click "Mark all read"
5. ✅ Badge should disappear

---

### Test 5: Admin Analytics Dashboard

**Prerequisites:**
- Logged in as Admin (admin@matters.com / admin123)
- Some data exists (users, jobs, bids)

**Step 5.1 - View Analytics**
1. Navigate to `/admin/analytics`
2. ✅ Should see comprehensive dashboard with:
   - Overview cards (total users, jobs, projects)
   - User growth chart
   - Jobs by status pie chart
   - Revenue trends line chart
   - Top contractors table
   - Geographic distribution

**Step 5.2 - Filter by Date Range**
1. Change the date range filter (e.g., last 7 days, 30 days)
2. ✅ Charts should update with new data

---

### Test 6: File Upload System

**Test 6.1 - Upload Progress Photos**
1. Login as contractor
2. Go to Submit Progress page
3. Drag & drop an image file
4. ✅ Should see preview
5. ✅ Should show file name and size
6. Upload multiple files (up to 10)
7. ✅ All files should appear in list
8. Remove a file by clicking X
9. ✅ File should be removed from list

**Test 6.2 - File Validation**
1. Try uploading a file > 10MB
2. ✅ Should show error: "File size too large"
3. Try uploading an unsupported type (e.g., .exe)
4. ✅ Should show error: "Invalid file type"

**Test 6.3 - View Uploaded Files**
1. After submitting progress with photos
2. Files are saved to `server/uploads/` directory
3. Access at: `http://localhost:4000/uploads/[filename]`

---

## 🐛 Troubleshooting

### Issue: "Failed to connect to MongoDB"
**Solution:**
- Ensure MongoDB is running: `mongod` or start MongoDB service
- Check MONGODB_URI in `.env`

### Issue: "CORS error" or "Network Error"
**Solution:**
- Verify server is running on port 4000
- Check CORS_ORIGIN in server `.env` includes `http://localhost:5173`
- Verify VITE_API_URL in client `.env` (if exists)

### Issue: Notifications not working
**Solution:**
- Check Pusher credentials in both server and client `.env`
- Verify PUSHER_ENABLED=true
- Check browser console for Pusher connection errors
- Free tier works fine for testing

### Issue: File upload fails
**Solution:**
- Check `server/uploads` directory exists (created automatically)
- Verify file size < 10MB
- Check file type is supported (images, PDF, docs)

### Issue: Can't login after registration
**Solution:**
- Check server logs for errors
- Verify MongoDB is running
- Check JWT_SECRET is set in `.env`

---

## 📊 Expected Data Flow

### New User Registration:
```
Client Form → POST /api/session/register →
MongoDB creates user → JWT token generated →
Auto-login → Redirect to dashboard
```

### Job Bidding:
```
Contractor submits bid → POST /api/jobs/:id/bid →
Save to database → Pusher notification to customer →
Customer sees new bid → Accepts bid →
POST /api/jobs/:id/bid/:bidId/accept →
Update job status → Pusher notification to contractor
```

### Progress Update with Files:
```
Contractor selects files → POST /api/uploads/files →
Multer saves to server/uploads/ → Returns URLs →
POST /api/progress with URLs → Save to MongoDB →
Pusher notification to customer → Customer views update
```

---

## ✅ Feature Checklist

- [x] User Registration (Customer & Contractor)
- [x] Username/Password Login
- [x] JWT Authentication
- [x] Session Persistence
- [x] Role-based Access Control
- [x] Job Posting
- [x] Bid Submission
- [x] Bid Accept/Reject
- [x] Progress Updates
- [x] File Uploads (photos/documents)
- [x] Real-time Notifications (Pusher)
- [x] Notification Bell UI
- [x] Admin Analytics Dashboard
- [x] User Growth Charts
- [x] Revenue Trends
- [x] Top Contractors
- [x] Geographic Distribution

---

## 🎯 Next Steps

1. **Test all workflows above** ✓
2. **Configure Pusher** for real-time features (optional but recommended)
3. **Create demo data** for better analytics visualization
4. **Deploy to production** when ready
5. **Set up monitoring** and error tracking

---

## 💡 Tips

- Use incognito/private browsing for testing multiple users simultaneously
- Check browser DevTools Console for errors
- Check server terminal for backend logs
- MongoDB Compass is great for viewing database contents
- Pusher Dashboard shows real-time event logs

---

## 🆘 Need Help?

Common issues and their solutions are in the Troubleshooting section above. For the best testing experience:

1. Start with minimum setup (no Pusher) to test auth and core features
2. Add Pusher configuration to enable real-time notifications
3. Create multiple test users to test the complete workflow
4. Use demo accounts for quick testing

Happy Testing! 🚀
