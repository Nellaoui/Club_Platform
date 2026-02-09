# Club Connect - Full-Stack Platform

A minimalist, production-quality resource sharing platform built for school clubs (10-30 users) optimized for tablet usage.

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js Server Components + Server Actions
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Auth**: Supabase Auth + Google OAuth
- **Storage**: Supabase Storage (PDFs, Images)
- **Deployment**: Vercel (recommended)

### Design Principles
1. **Tablet-First**: Responsive design optimized for 8-12" screens
2. **Minimal UI**: No visual clutter, focus on content
3. **Security by Default**: RLS policies enforce access control at database level
4. **Server-Side Logic**: Business logic in Server Actions, not client-side
5. **Type Safety**: Full TypeScript coverage

---

## Database Schema

### Tables

#### `users`
- Core user profiles synced from Supabase Auth
- Roles: `admin` or `student`
- RLS: Users can view all profiles; can update own

#### `subjects`
- Organize club content hierarchically
- Multiple subjects per club
- Example: "Mathematics", "Physics", "Computer Science"

#### `weeks`
- Organize content within subjects
- Week numbers sequential per subject
- Example: Week 1-15 for a term

#### `resources`
- Actual learning materials
- Types: `pdf`, `image`, `link`
- Each week can have multiple resources
- Supports external URLs and file storage

#### `comments`
- Per-resource discussion
- Students can comment; admins can moderate
- RLS: Anyone can view; students/admins can create; users can delete own

#### `attendance`
- Track club attendance by date
- RLS: Only admins can create/view all; students can view own

### RLS Policies Summary

| Table | Admin | Student |
|-------|-------|---------|
| users | - | View all, update own |
| subjects | CRUD | Read |
| weeks | CRUD | Read |
| resources | CRD | Read |
| comments | CRD + delete all | Create, delete own, read |
| attendance | CRUD | Read own |

---

## Routes & Pages

### Public Routes
- `/login` - Google OAuth sign-in

### Protected Routes (All require authentication)

#### Student Views
- `/dashboard` - Home; browse subjects
- `/dashboard/subject/[subjectId]` - View weeks and resources
- `/dashboard/resource/[resourceId]` - Full resource page + comments

#### Admin Routes
- `/dashboard/admin` - Admin dashboard with quick stats
- `/dashboard/admin/users` - Manage user roles
- `/dashboard/admin/subjects` - Create/edit subjects (future)
- `/dashboard/admin/weeks` - Create/edit weeks (future)
- `/dashboard/admin/resources` - Create/edit resources (future)
- `/dashboard/admin/attendance` - Mark attendance

---

## Server Actions

All mutations are Server Actions (zero client-side business logic):

### Auth (`src/app/actions/auth.ts`)
- `signOut()` - Logout user
- `updateUserRole(userId, role)` - Admin: promote/demote users

### Subjects (`src/app/actions/subjects.ts`)
- `createSubjectAction()` - Admin only
- `updateSubjectAction()` - Admin only
- `deleteSubjectAction()` - Admin only

### Weeks (`src/app/actions/weeks.ts`)
- `createWeekAction()` - Admin only
- `updateWeekAction()` - Admin only
- `deleteWeekAction()` - Admin only

### Resources & Comments (`src/app/actions/resources.ts`)
- `createResourceAction()` - Admin only
- `deleteResourceAction()` - Admin only
- `addCommentAction()` - Authenticated users
- `deleteCommentAction()` - Owner or admin

### Attendance (`src/app/actions/attendance.ts`)
- `recordAttendanceAction()` - Admin only

---

## Authentication Flow

1. User visits `/login`
2. Clicks "Sign in with Google"
3. Redirected to Supabase OAuth
4. Callback to `/auth/callback`
5. Exchange code for session
6. Auto-create user profile if new (default role: student)
7. Redirect to `/dashboard`

---

## File Storage Strategy

### Supabase Storage Buckets (Create via Dashboard)

#### 1. `pdfs` (Public)
```
pdfs/
  ├── resources/
  │   ├── {subjectId}/
  │   │   ├── {resourceId}/
  │   │   │   └── filename.pdf
```

#### 2. `images` (Public)
```
images/
  ├── resources/
  │   ├── {subjectId}/
  │   │   ├── {resourceId}/
  │   │   │   └── filename.jpg
```

### Upload Process
1. Admin uploads file via form
2. Generate signed/public URL
3. Store URL in `resources.file_url`
4. User can download/view directly

---

## Security Model

### RLS (Row Level Security)
- **Database-enforced**: No client-side bypasses
- **Role-based**: Admin vs Student
- **User-scoped**: Users restricted to their own records where applicable

### Authentication
- Google OAuth only (no passwords)
- Secure cookies managed by Supabase
- Session-based (can be extended)

### Data Access
- All queries filtered by RLS policies
- Server Actions validate role before mutations
- Public read on subjects/weeks/resources/comments
- Private write restricted to admins or resource owners

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- Supabase account (free tier sufficient)
- Google OAuth credentials

### 1. Clone & Install
```bash
cd club-platform
npm install
```

### 2. Supabase Setup

#### A. Create Project
1. Go to https://supabase.com
2. Create new project
3. Wait for setup

#### B. Configure Google OAuth
1. Dashboard → Authentication → Providers
2. Enable Google
3. Add Google OAuth credentials:
   - Redirect: `https://localhost:3000/auth/callback` (dev)
   - Redirect: `https://yourapp.vercel.app/auth/callback` (production)
   - Required scopes: email, profile

#### C. Create Storage Buckets
1. Dashboard → Storage
2. Create bucket: `pdfs` (public)
3. Create bucket: `images` (public)

#### D. Run Database Schema
1. Dashboard → SQL Editor
2. Paste contents of [schema.sql](./schema.sql)
3. Execute

### 3. Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. First Admin User
```sql
-- In Supabase SQL Editor
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### 5. Run Locally
```bash
npm run dev
```
Visit http://localhost:3000

---

## Deployment (Vercel)

### 1. Push to GitHub
```bash
git remote add origin https://github.com/yourname/club-platform
git push -u origin main
```

### 2. Connect to Vercel
1. Go to vercel.com
2. Import GitHub repo
3. Add environment variables (same as `.env.local`)
4. Deploy

### 3. Update Supabase OAuth Redirect
```
https://yourapp.vercel.app/auth/callback
```

---

## Extensibility

### Adding Features
1. **New Resource Type**: Add to `type` enum in schema + UI components
2. **Admin Bulk Operations**: Create Server Actions + admin pages
3. **Analytics**: Query attendance/resource metrics
4. **Notifications**: Integrate Supabase webhooks
5. **Export**: Generate attendance CSVs for reports

### Future Enhancements
- Admin bulk file upload (ZIP import)
- Resource tags/search
- Student analytics (who viewed what)
- Mobile app (React Native with same backend)
- Advanced attendance reports
- Resource versioning

---

## Troubleshooting

### Auth Issues
- Check Google OAuth credentials
- Verify redirect URLs in Supabase
- Clear browser cookies

### Permission Denied Errors
- Check RLS policies: `Dashboard → SQL Editor → Find and Read Policies`
- Verify user role: `SELECT role FROM users WHERE id = current_user_id()`

### File Upload Fails
- Verify bucket exists and is public
- Check bucket permissions
- Ensure file size < 100MB

### Database Connection
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify anon key has RLS policies enabled
- Test with Supabase dashboard

---

## Project Structure

```
src/
├── app/
│   ├── auth/callback/route.ts    # OAuth callback
│   ├── login/page.tsx             # Login page
│   ├── dashboard/                 # Protected routes
│   │   ├── layout.tsx             # Sidebar nav
│   │   ├── page.tsx               # Home
│   │   ├── subject/[id]/page.tsx  # Subject view
│   │   ├── resource/[id]/page.tsx # Resource + comments
│   │   └── admin/                 # Admin pages
│   └── actions/                   # Server Actions
│       ├── auth.ts
│       ├── subjects.ts
│       ├── weeks.ts
│       ├── resources.ts
│       └── attendance.ts
├── components/
│   ├── Header.tsx                 # Site header
│   └── CommentForm.tsx            # Comment input
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Client config
│   │   └── server.ts              # Server config
│   ├── auth.ts                    # Auth helpers
│   ├── db.ts                      # Database queries
│   └── types.ts                   # TypeScript types
└── app/
    ├── globals.css                # Tailwind CSS
    ├── layout.tsx                 # Root layout
    └── page.tsx                   # Home (redirect to /dashboard)

schema.sql                          # PostgreSQL schema + RLS
```

---

## Performance Considerations

- Server Components for SSR (reduced JS)
- RLS at database level (no N+1 queries)
- Supabase caching for public data
- Image optimization via Next.js Image (future)
- Lazy loading for comments (pagination future)

---

## Testing Checklist

- [ ] Google OAuth login flow
- [ ] Create subject as admin
- [ ] Create week and resources
- [ ] View as student (no edit buttons)
- [ ] Add comment as student
- [ ] Delete own comment
- [ ] Admin delete comment
- [ ] Promote student to admin
- [ ] Mark attendance
- [ ] File upload (PDF/image)
- [ ] Mobile responsiveness (iPad view)

---

## License

MIT

---

**Built with ❤️ for school clubs**
