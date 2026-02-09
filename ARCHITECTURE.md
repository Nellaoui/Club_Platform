# Architecture Documentation

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User (Tablet)                         │
│                     Google OAuth Login                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Next.js 14 App Router                        │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐ │
│  │  Pages (RSC)  │  │ Server Actions│  │  Client Comps    │ │
│  │  Dashboard    │  │  Auth         │  │  Comment Form    │ │
│  │  Subject View │  │  Resources    │  │  Login Button    │ │
│  │  Resource     │  │  Attendance   │  │                  │ │
│  └───────────────┘  └───────────────┘  └──────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Backend                         │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐ │
│  │ Auth (Google) │  │  PostgreSQL   │  │  Storage         │ │
│  │   - OAuth     │  │  - RLS        │  │  - PDFs          │ │
│  │   - Sessions  │  │  - Users      │  │  - Images        │ │
│  │               │  │  - Resources  │  │                  │ │
│  └───────────────┘  └───────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

### Authentication Flow
```
User → Google OAuth → Supabase Auth → Create/Fetch User Profile → Redirect to Dashboard
```

### Resource Access Flow (Student)
```
Student → Dashboard → Subject → Week → Resource → View/Comment
                                                        ↓
                                         Check RLS (student can read)
```

### Resource Creation Flow (Admin)
```
Admin → Admin Panel → Create Resource → Upload File → Server Action
           ↓                                             ↓
   Check Role (admin)                    Store URL in Database + RLS Check
```

---

## Database Architecture

### Entity Relationship Diagram

```
┌──────────┐
│  users   │
│──────────│
│ id (PK)  │◄────────┐
│ email    │         │
│ role     │         │
└──────────┘         │
                     │
                     │ created_by
┌──────────────┐     │
│  subjects    │     │
│──────────────│     │
│ id (PK)      │     │
│ name         │     │
│ created_by   │─────┘
└───────┬──────┘
        │
        │ subject_id
        ▼
┌──────────────┐
│    weeks     │
│──────────────│
│ id (PK)      │
│ subject_id   │─────┐
│ week_number  │     │
└───────┬──────┘     │
        │            │
        │ week_id    │
        ▼            │
┌──────────────┐     │
│  resources   │     │
│──────────────│     │
│ id (PK)      │     │
│ week_id      │─────┘
│ type         │
│ file_url     │
└───────┬──────┘
        │
        │ resource_id
        ▼
┌──────────────┐
│   comments   │
│──────────────│
│ id (PK)      │
│ resource_id  │
│ user_id      │
│ content      │
└──────────────┘

┌──────────────┐
│  attendance  │
│──────────────│
│ id (PK)      │
│ user_id      │
│ event_date   │
│ attended     │
└──────────────┘
```

---

## Security Architecture

### Row Level Security (RLS) Policies

#### Admin Capabilities
- **users**: View all, update own profile
- **subjects**: Full CRUD
- **weeks**: Full CRUD
- **resources**: Create, Read, Delete
- **comments**: Create, Read, Delete any
- **attendance**: Full CRUD

#### Student Capabilities
- **users**: View all, update own profile
- **subjects**: Read only
- **weeks**: Read only
- **resources**: Read only
- **comments**: Create, Read, Delete own
- **attendance**: Read own only

### Authentication & Session
- **OAuth Provider**: Google
- **Session Storage**: HTTP-only cookies (Supabase)
- **Token Refresh**: Automatic via Supabase SDK
- **CSRF Protection**: Built into Next.js Server Actions

---

## Component Architecture

### Server Components (No JavaScript to client)
- Dashboard layout with sidebar
- Subject listing
- Week and resource listings
- User management tables
- Attendance tracker

### Client Components (Interactive)
- Login button (OAuth trigger)
- Comment form (form submission)
- Delete buttons (confirmation)

### Server Actions (Mutations)
- All create/update/delete operations
- Role validation before execution
- Direct database access with RLS

---

## File Organization

```
src/
├── app/                          # Next.js App Router
│   ├── actions/                  # Server Actions (mutations)
│   │   ├── auth.ts               # Sign out, role updates
│   │   ├── attendance.ts         # Record attendance
│   │   ├── resources.ts          # CRUD resources + comments
│   │   ├── subjects.ts           # CRUD subjects
│   │   └── weeks.ts              # CRUD weeks
│   │
│   ├── auth/callback/            # OAuth callback handler
│   │   └── route.ts
│   │
│   ├── dashboard/                # Protected routes
│   │   ├── layout.tsx            # Sidebar navigation
│   │   ├── page.tsx              # Home/subject list
│   │   │
│   │   ├── admin/                # Admin-only routes
│   │   │   ├── page.tsx          # Admin dashboard
│   │   │   ├── users/page.tsx    # User management
│   │   │   └── attendance/page.tsx # Attendance tracking
│   │   │
│   │   ├── subject/[id]/         # Subject view
│   │   │   └── page.tsx
│   │   │
│   │   └── resource/[id]/        # Resource + comments
│   │       └── page.tsx
│   │
│   ├── login/                    # Public login page
│   │   └── page.tsx
│   │
│   ├── layout.tsx                # Root layout (Header)
│   ├── page.tsx                  # Home (redirects)
│   └── globals.css               # Tailwind styles
│
├── components/                   # Reusable components
│   ├── Header.tsx                # Site header
│   └── CommentForm.tsx           # Comment input
│
└── lib/                          # Core utilities
    ├── supabase/
    │   ├── client.ts             # Browser Supabase client
    │   └── server.ts             # Server Supabase client
    │
    ├── auth.ts                   # getCurrentUser helper
    ├── db.ts                     # Database query functions
    └── types.ts                  # TypeScript types
```

---

## Performance Considerations

### Server-Side Rendering (SSR)
- All dashboard pages are Server Components
- Data fetched on server, HTML sent to client
- Minimal JavaScript shipped (only interactive components)

### Database Optimization
- Indexes on foreign keys (subject_id, week_id, etc.)
- RLS policies use indexed columns
- Supabase connection pooling

### Caching Strategy
- Static asset caching (Vercel CDN)
- Supabase query caching (automatic)
- Server Component caching (Next.js)

---

## Deployment Architecture

### Vercel (Recommended)
```
GitHub Repo → Vercel Build → Serverless Functions
                 ↓
           Static Assets (CDN)
                 ↓
           Edge Network (Global)
```

### Environment Variables (Production)
```env
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon_key_here
SUPABASE_SERVICE_ROLE_KEY=service_role_key_here
```

### OAuth Redirect URLs
- **Development**: `http://localhost:3000/auth/callback`
- **Production**: `https://yourapp.vercel.app/auth/callback`

---

## Scalability Considerations

### Current Capacity (10-30 users)
- **Supabase Free Tier**: 500MB database, 1GB file storage
- **Vercel Free Tier**: 100GB bandwidth/month
- **Performance**: Sub-200ms page loads

### Future Scaling (50-100 users)
- Upgrade Supabase to Pro ($25/month)
- Add database read replicas
- Implement Redis caching for sessions

### Potential Bottlenecks
- **File Storage**: Large PDFs (solution: compress or CDN)
- **Database Connections**: Many concurrent users (solution: connection pooling)
- **API Rate Limits**: Supabase has limits (solution: caching)

---

## Technology Decisions & Rationale

### Why Next.js 14 App Router?
- Server Components reduce client-side JavaScript
- Server Actions eliminate API routes
- Built-in TypeScript support
- Excellent Vercel integration

### Why Supabase?
- PostgreSQL with RLS (database-level security)
- Built-in Google OAuth
- File storage included
- Generous free tier
- No backend code needed

### Why Tailwind CSS?
- Minimal bundle size (only used classes)
- Utility-first (fast development)
- Responsive by default
- No CSS conflicts

### Why Server Actions over API Routes?
- Type-safe end-to-end
- No API routes to maintain
- Automatic revalidation
- Simpler error handling

---

## Error Handling Strategy

### Authentication Errors
- Redirect to `/login` with error message
- Clear invalid sessions
- Log errors to console (dev) or service (prod)

### Database Errors
- RLS violations: Return 403 Forbidden
- Not found: Render 404 page
- Server errors: Show generic error message

### File Upload Errors
- Size limit: Show validation message
- Type validation: Only allow PDF/images
- Network errors: Retry upload

---

## Maintenance & Monitoring

### Health Checks
- Monitor Supabase dashboard for errors
- Check Vercel deployment logs
- Review user reports

### Backup Strategy
- **Database**: Supabase automatic daily backups
- **Files**: Manual backup via Supabase dashboard
- **Code**: GitHub repository

### Updates
- **Dependencies**: Monthly `npm audit` + updates
- **Next.js**: Update quarterly (stable releases)
- **Supabase**: Auto-updated (managed service)

---

## Extension Points

### Easy Additions
1. **Search**: Add full-text search to resources
2. **Tags**: Add tags table + many-to-many relation
3. **Favorites**: Add bookmarks for students
4. **Notifications**: Email/push for new resources

### Moderate Additions
1. **Analytics**: Track resource views/downloads
2. **Quiz System**: Add quiz resources + submissions
3. **Discussion Forums**: Extend comments to threads
4. **Mobile App**: React Native with same Supabase backend

---

## Security Checklist

- [x] RLS policies on all tables
- [x] No client-side secrets
- [x] HTTPS only (Vercel enforced)
- [x] Google OAuth only (no passwords)
- [x] Server Actions validate roles
- [x] File upload size limits
- [x] XSS prevention (React escaping)
- [x] CSRF protection (Server Actions)
- [ ] Rate limiting (future: add middleware)
- [ ] Audit logging (future: track admin actions)

---

**This architecture supports a small club (10-30 users) with room to scale as needed.**
