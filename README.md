# 📋 SHKKBoard - Collaborative Kanban Board

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Prisma-7.4-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Supabase-2.97-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
</p>

<p align="center">
  <strong>A production-grade collaborative Kanban board application built with modern web technologies</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#security">Security</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## ✨ Features

### 🎯 Core Functionality
- **🔐 Authentication** - Secure email/password authentication with Supabase Auth
- **🏢 Workspaces** - Organize your work into multiple workspaces
- **📊 Kanban Boards** - Create unlimited boards within workspaces
- **📋 Tasks & Cards** - Rich task management with descriptions, tags, and due dates
- **💬 Real-time Collaboration** - (Coming soon) See changes instantly across all connected clients
- **🔄 Drag & Drop** - (Coming soon) Intuitive drag and drop for tasks and columns
- **📱 Responsive Design** - Fully responsive UI that works on desktop, tablet, and mobile

### 🛡️ Security Features
- **🔒 End-to-End Security** - Comprehensive security implementation following OWASP guidelines
- **🚦 Rate Limiting** - Protection against brute force attacks (login/register)
- **👥 Role-Based Access Control (RBAC)** - Three-tier permission system (Owner, Admin, Member)
- **📝 Audit Logging** - Complete security event logging for accountability
- **🔍 Input Sanitization** - XSS and SQL injection prevention
- **🔐 Password Strength Validation** - Enforced strong password policies
- **🛡️ Secure Error Handling** - Generic error messages that don't leak sensitive information

### 🎨 UI/UX
- **🌙 Modern UI** - Built with Tailwind CSS and Shadcn/UI components
- **🎯 Optimistic Updates** - (Coming soon) Instant UI feedback for smooth experience
- **⌨️ Keyboard Shortcuts** - (Coming soon) Power user features
- **🔍 Search & Filters** - (Coming soon) Find tasks quickly with advanced filtering
- **🏷️ Tags & Labels** - Organize tasks with custom tags
- **📅 Due Dates** - Track task deadlines

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | [Next.js 15](https://nextjs.org/) | React framework with App Router |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS framework |
| **Components** | [Shadcn/UI](https://ui.shadcn.com/) | Accessible UI components |
| **Database** | [Supabase (PostgreSQL)](https://supabase.com/) | Database and real-time features |
| **ORM** | [Prisma](https://www.prisma.io/) | Type-safe database operations |
| **Auth** | [Supabase Auth](https://supabase.com/auth) | Authentication and user management |
| **State** | [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight state management |
| **Validation** | [Zod](https://zod.dev/) | Schema validation |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **pnpm**
- **Supabase Account** (free tier works great)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/shkkboard.git
cd shkkboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

1. Copy the example environment file:

```bash
cp .env.local.example .env.local
```

2. Create a new project on [Supabase](https://supabase.com/)

3. Get your project credentials from Supabase Dashboard → Settings → API:
   - Project URL
   - `anon` public API key
   - `service_role` secret key (keep this safe!)

4. Get your database connection string from Supabase Dashboard → Database → Connection String (Session Pooler)

5. Fill in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Security Note:** Never commit `.env.local` to version control. It's already in `.gitignore`.

### 4. Set Up the Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma migrate dev

# Optional: Open Prisma Studio to view data
npx prisma studio
```

### 5. Configure Supabase Auth

In your Supabase Dashboard:

1. **Authentication → Settings → Sessions**
   - Enable "Automatic refresh tokens"
   - Session duration: 86400 (24 hours)

2. **Authentication → Settings → Passwords**
   - Enable "Confirm email"
   - Minimum password length: 8

3. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: Add `http://localhost:3000/auth/callback`

4. **Database → Policies** (Optional but recommended)
   - Enable Row Level Security (RLS) on tables
   - See `SUPABASE_SECURITY_CONFIG.md` for SQL policies

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
shkkboard/
├── 📂 prisma/
│   └── schema.prisma          # Database schema
│
├── 📂 src/
│   ├── 📂 app/                # Next.js App Router
│   │   ├── (auth)/            # Auth routes group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── 📂 components/
│   │   ├── ui/                 # Shadcn/UI components
│   │   └── workspace/          # Workspace components
│   │
│   ├── 📂 lib/
│   │   ├── auth/
│   │   │   └── authorization.ts    # RBAC implementation
│   │   ├── security/
│   │   │   ├── audit-log.ts        # Security audit logging
│   │   │   ├── rate-limiter.ts     # Rate limiting
│   │   │   ├── password-validator.ts
│   │   │   ├── input-validator.ts  # XSS/SQL injection prevention
│   │   │   └── error-handler.ts    # Secure error handling
│   │   ├── supabase/
│   │   │   └── client.ts
│   │   └── prisma.ts
│   │
│   ├── 📂 hooks/
│   │   └── use-rate-limit.ts   # Rate limiting hook
│   │
│   ├── 📂 actions/
│   │   └── workspace.ts        # Server Actions
│   │
│   └── middleware.ts           # Auth middleware
│
├── 📄 .env.local.example       # Environment template
├── 📄 SECURITY_REQUIREMENTS.md   # Security documentation
└── 📄 README.md                # This file
```

---

## 🔐 Security

This project implements comprehensive security measures following OWASP guidelines:

### Implemented Security Features

✅ **Authentication & Authorization**
- Middleware-based route protection
- Session management with secure cookies
- RBAC with 3 permission levels (Owner, Admin, Member)
- Permission checks on all Server Actions

✅ **Data Protection**
- Input sanitization against XSS attacks
- SQL injection prevention
- Secure error handling (no sensitive data leakage)
- Password strength enforcement

✅ **Access Control**
- Rate limiting on authentication endpoints
- Workspace-level authorization
- Resource ownership verification

✅ **Audit & Monitoring**
- Comprehensive audit logging
- Security event tracking
- Failed login attempt monitoring

### Security Documentation
- 📄 [SUPABASE_SECURITY_CONFIG.md](./SUPABASE_SECURITY_CONFIG.md) - Supabase security configuration
---

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] Next.js setup with TypeScript
- [x] Supabase integration
- [x] Authentication system
- [x] Workspace CRUD
- [x] Security implementation

### Phase 2: Core Features 🚧
- [ ] Board CRUD operations
- [ ] Column management
- [ ] Task CRUD with rich text
- [ ] Drag and drop (@dnd-kit)
- [ ] Optimistic updates

### Phase 3: Real-time Collaboration 📡
- [ ] Supabase Realtime integration
- [ ] Live cursor presence
- [ ] Real-time task updates
- [ ] Conflict resolution

### Phase 4: Polish & Advanced Features ✨
- [ ] Search with debounce
- [ ] Filter by tags, dates, assignees
- [ ] File attachments
- [ ] Activity log
- [ ] Dark mode
- [ ] Mobile responsiveness optimization

### Phase 5: Production Ready 🚀
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] SEO improvements
- [ ] Documentation
- [ ] Deployment guide

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Shadcn/UI](https://ui.shadcn.com/) - Beautifully designed components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM

---

<p align="center">
  Built with ❤️ using modern web technologies
</p>

<p align="center">
  <a href="https://github.com/yourusername/shkkboard">⭐ Star us on GitHub</a>
</p>
