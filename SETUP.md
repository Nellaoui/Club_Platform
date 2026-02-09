# Quick Start Guide

## Overview
This is a complete, production-ready full-stack platform for school club resource sharing. Built with Next.js 14, Supabase, and TypeScript.

---

## ✅ What's Built

### Authentication & Authorization
- ✅ Google OAuth via Supabase
- ✅ Auto-profile creation on first login
- ✅ Role-based access (admin/student)
- ✅ Secure session management

### Core Features
- ✅ Subject organization (hierarchical)
- ✅ Week-based content structuring
- ✅ Resource sharing (PDFs, images, links)
- ✅ Per-resource commenting
- ✅ Attendance tracking (admin only)
- ✅ User role management (admin only)

### UI/UX
- ✅ Tablet-first responsive design
- ✅ Minimal, clean interface
- ✅ Dashboard with sidebar navigation
- ✅ Breadcrumb navigation
- ✅ Color-coded roles

### Security
- ✅ Row Level Security (RLS) on all tables
- ✅ Server-side validation in all Server Actions
- ✅ No client-side business logic
- ✅ Database-enforced permissions

---

## 🚀 Setup Instructions

### Step 1: Supabase Setup (10 minutes)

#### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization, name, password, region
4. Wait 2 minutes for provisioning

#### 1.2 Run Database Schema
1. In Supabase Dashboard → SQL Editor
2. Copy entire contents of `schema.sql`
3. Click "Run"
4. Verify: Should see "Success. No rows returned"

#### 1.3 Configure Google OAuth
1. Supabase Dashboard → Authentication → Providers
2. Enable "Google"
3. **Get Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project
   - Enable Google+ API
   - Create OAuth 2.0 Client ID (Web application)
   - Add authorized redirect URI: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret
4. Paste credentials into Supabase
5. Save

#### 1.4 Create Storage Buckets
1. Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `pdfs`, Public: ✅
4. Click "Create Bucket"
5. Repeat for `images` bucket

#### 1.5 Get API Keys
1. Supabase Dashboard → Settings → API
2. Copy:
   - `Project URL`
   - `anon` `public` key
   - `service_role` `secret` key

### Step 2: Local Setup (5 minutes)

#### 2.1 Install Dependencies
```bash
cd club-platform
npm install
```

#### 2.2 Configure Environment
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 2.3 Run Development Server
```bash
npm run dev
```
Visit: http://localhost:3000

### Step 3: Create First Admin (2 minutes)

#### 3.1 Sign In
1. Go to http://localhost:3000
2. Click "Sign in with Google"
3. Complete OAuth flow

#### 3.2 Promote to Admin
1. Open Supabase Dashboard → SQL Editor
2. Run:
```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@gmail.com';
```
3. Refresh your browser

If your project already exists and you need to add a `grade` column (grades 1–8), run this migration in Supabase SQL Editor:

```sql
ALTER TABLE users
ADD COLUMN grade smallint CHECK (grade >= 1 AND grade <= 8);
```

After adding the column, set grades with:

```sql
UPDATE users
SET grade = 1
WHERE email = 'student1@example.com';
```

---

## 🎯 Testing the Platform

### As Admin
1. **Dashboard**: See all subjects
2. **Admin Panel**: Click "Admin Panel" button
3. **View Stats**: Quick overview of users, attendance
4. **Manage Users**: Promote/demote users
5. **Mark Attendance**: Select present/absent for today

### As Student (Use Incognito Window)
1. Sign in with different Google account
2. View subjects and resources
3. Add comment on a resource
4. Try to access `/dashboard/admin` → should redirect

---

## 📦 Deployment to Vercel (5 minutes)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Connect Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repo
4. Click "Import"

### Step 3: Add Environment Variables
In Vercel project settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 4: Deploy
1. Click "Deploy"
2. Wait 2 minutes
3. Visit your live site!

### Step 5: Update OAuth Redirect
1. Supabase Dashboard → Authentication → URL Configuration
2. Add Site URL: `https://yourapp.vercel.app`
3. Add Redirect URL: `https://yourapp.vercel.app/auth/callback`

---

## 📝 Next Steps

### Add Content (Admin)
Currently, you need to add subjects, weeks, and resources manually via SQL or build the admin UI pages.

**Quick SQL to add test data:**
```sql
-- Add a subject
INSERT INTO subjects (name, description, created_by)
VALUES (
  'Mathematics',
  'Advanced calculus and algebra',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);

-- Add weeks (get subject_id from previous insert)
INSERT INTO weeks (subject_id, week_number, title, description)
VALUES
  ('subject-id-here', 1, 'Introduction', 'Course overview'),
  ('subject-id-here', 2, 'Calculus Basics', 'Derivatives and integrals');

-- Add a resource (get week_id from previous insert)
INSERT INTO resources (week_id, title, type, external_url, created_by)
VALUES (
  'week-id-here',
  'Calculus Tutorial',
  'link',
  'https://www.khanacademy.org/math/calculus-1',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);
```

### Build Admin UI Pages (Optional)
The codebase includes Server Actions for:
- Creating subjects
- Creating weeks
- Creating resources
- File uploads

You can build admin forms that call these actions.

---

## 🛠️ Common Issues

### Issue: "Failed to fetch session"
**Solution**: Check `.env.local` has correct Supabase URL and anon key

### Issue: Google OAuth fails
**Solution**: 
1. Verify redirect URI in Google Console matches Supabase callback
2. Check Google OAuth is enabled in Supabase

### Issue: Permission denied errors
**Solution**: 
1. Verify RLS policies ran successfully (check `schema.sql`)
2. Check user role in database: `SELECT * FROM users WHERE email = 'your-email'`

### Issue: Build errors
**Solution**: 
```bash
rm -rf .next
npm install
npm run build
```

---

## 📚 File Reference

| File | Purpose |
|------|---------|
| `schema.sql` | Complete database schema + RLS policies |
| `README.md` | Comprehensive documentation |
| `ARCHITECTURE.md` | System architecture details |
| `.env.local` | Environment variables (create manually) |
| `src/app/actions/` | All server-side mutations |
| `src/lib/auth.ts` | Authentication helpers |
| `src/lib/db.ts` | Database query functions |

---

## ✅ Checklist

Before going live:
- [ ] Run `npm run build` successfully
- [ ] Test Google OAuth login
- [ ] Create first admin user
- [ ] Add at least one subject + week + resource
- [ ] Test as student (different Google account)
- [ ] Verify attendance tracking works
- [ ] Test comments (create + delete)
- [ ] Check mobile/tablet responsiveness
- [ ] Update OAuth redirect URLs for production
- [ ] Deploy to Vercel
- [ ] Test production deployment

---

## 🎓 For Club Admins

### Daily Workflow
1. Mark attendance for today
2. Upload new resources (via SQL or future admin UI)
3. Moderate comments if needed

### Weekly Tasks
1. Create new week entries
2. Check user activity
3. Review attendance statistics

---

## 💡 Tips

- **Tablet Testing**: Use Chrome DevTools (F12) → Device Toolbar → iPad
- **Database Queries**: Use Supabase Table Editor for quick edits
- **Logs**: Check Vercel deployment logs for production errors
- **Backups**: Supabase automatically backs up daily

---

**You're all set! 🎉**

The platform is ready to use. Add your content and invite club members to sign in with their Google accounts.
