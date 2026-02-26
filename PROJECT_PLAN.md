# Project Plan: Collaborative Kanban Board (Trello Clone)

## 1. Project Overview

A production-grade collaborative Kanban board application similar to Trello. This project demonstrates senior-level engineering skills including real-time collaboration, optimistic updates, and complex state management.

---

## 2. Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| Framework | Next.js 14/15 (App Router) | Server Components, Server Actions, modern React patterns |
| Styling | Tailwind CSS + Shadcn/UI | Professional, accessible, production-ready components |
| Database | Supabase (PostgreSQL) | Auth, database, and native Realtime (WebSockets) |
| ORM | Prisma | Type-safe database operations |
| State Management | Zustand | Lightweight global state |
| Drag & Drop | @dnd-kit | Robust DnD implementation |

---

## 3. Database Architecture

### Entity Relationship Diagram

```
Workspaces
    ├── Projects/Boards
    │       ├── Columns
    │       │       ├── Tasks/Cards
    │       │       │       └── Comments
```

### Table Definitions

| Table | Responsibility | Key Fields |
|-------|----------------|------------|
| `Workspaces` | Top-level workspace container | id, name, ownerId, createdAt |
| `Projects/Boards` | Kanban boards within workspace | id, name, workspaceId, order |
| `Columns` | Lists within a board (To Do, In Progress, Done) | id, title, boardId, order |
| `Tasks/Cards` | Individual task items | id, title, description, columnId, order, tags, dueDate |
| `Comments` | Real-time feedback on tasks | id, content, taskId, authorId, createdAt |

### Prisma Schema (Draft)

```prisma
model Workspace {
  id        String    @id @default(cuid())
  name      String
  ownerId   String
  owner     User      @relation(fields: [ownerId], references: [id])
  boards    Board[]
  members   WorkspaceMember[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Board {
  id          String    @id @default(cuid())
  name        String
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  columns     Column[]
  order       Int
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Column {
  id        String    @id @default(cuid())
  title     String
  boardId   String
  board     Board     @relation(fields: [boardId], references: [id])
  tasks     Task[]
  order     Int
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  columnId    String
  column      Column    @relation(fields: [columnId], references: [id])
  comments    Comment[]
  tags        Tag[]
  order       String    // Lexical ranking for efficient reordering
  dueDate     DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Comment {
  id        String    @id @default(cuid())
  content   String
  taskId    String
  task      Task      @relation(fields: [taskId], references: [id])
  authorId  String
  author    User      @relation(fields: [authorId], references: [id])
  createdAt DateTime  @default(now())
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  workspaces    Workspace[]           @relation("WorkspaceOwner")
  memberships   WorkspaceMember[]
  comments      Comment[]
  createdAt     DateTime  @default(now())
}

model WorkspaceMember {
  workspaceId String
  userId      String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  user        User      @relation(fields: [userId], references: [id])
  role        Role      @default(MEMBER)

  @@id([workspaceId, userId])
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}
```

---

## 4. Key Technical Challenges

### 4.1 Optimistic Updates

**Problem:** UI should update instantly when users interact, without waiting for server response.

**Solution:** TBD during implementation

### 4.2 Complex Reordering Logic

**Problem:** Persisting task/column order efficiently without updating all records on each change.

**Solution:** TBD during implementation

### 4.3 Real-time Collaboration

**Problem:** Multiple users should see changes instantly across all connected clients.

**Solution:** TBD during implementation

---

## 5. Project Roadmap

### Phase 1: Foundation & Authentication
**Duration: 1-2 weeks**

- [ ] Initialize Next.js 14/15 project with TypeScript
- [ ] Configure Tailwind CSS + Shadcn/UI
- [ ] Set up Supabase project
- [ ] Configure Prisma with Supabase connection
- [ ] Implement authentication (Login/Register)
- [ ] Create auth middleware and protected routes
- [ ] Build basic layout components (Sidebar, Header, etc.)
- [ ] Set up Zustand store structure

**Deliverable:** Users can register, login, and see a dashboard

---

### Phase 2: CRUD Operations
**Duration: 1-2 weeks**

- [ ] Create Workspace CRUD (Server Actions)
- [ ] Create Board CRUD with workspace association
- [ ] Create Column CRUD within boards
- [ ] Create Task CRUD within columns
- [ ] Implement basic UI for all entities
- [ ] Add proper loading and error states
- [ ] Implement server-side validation with Zod

**Deliverable:** Full CRUD functionality for all entities

---

### Phase 3: Drag & Drop Implementation
**Duration: 1 week**

- [ ] Install and configure @dnd-kit
- [ ] Implement task drag within single column
- [ ] Implement task drag between columns
- [ ] Implement column reordering
- [ ] Add visual feedback during drag
- [ ] Handle keyboard accessibility
- [ ] Add touch support for mobile

**Deliverable:** Visual drag and drop working smoothly

---

### Phase 4: Persistence & Optimistic Updates
**Duration: 1-2 weeks**

- [ ] Implement Server Actions for task movements
- [ ] Add optimistic updates with `useOptimistic`
- [ ] Implement lexical ranking for task order
- [ ] Handle error states with rollback
- [ ] Add offline indicator
- [ ] Implement undo/redo functionality (optional)

**Deliverable:** Changes persist and UI feels instant

---

### Phase 5: Real-time Features
**Duration: 1 week**

- [ ] Set up Supabase Realtime channels
- [ ] Subscribe to task changes
- [ ] Subscribe to column changes
- [ ] Implement real-time comments
- [ ] Add user presence indicators
- [ ] Handle connection/reconnection states

**Deliverable:** Multiple users see changes in real-time

---

### Phase 6: Search & Filters (Polish)
**Duration: 1 week**

- [ ] Implement task search with debounce
- [ ] Add tag-based filtering
- [ ] Add due date filtering
- [ ] Implement board search
- [ ] Add recent/favorite boards
- [ ] Keyboard shortcuts

**Deliverable:** Searchable and filterable board

---

### Phase 7: Polish & Deployment
**Duration: 1 week**

- [ ] Responsive design optimization
- [ ] Dark mode support
- [ ] Performance optimization
- [ ] SEO basics
- [ ] Error boundaries
- [ ] Unit tests (critical paths)
- [ ] Deploy to Vercel
- [ ] Set up production Supabase

**Deliverable:** Production-ready application

---

## 6. Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── workspace/[id]/page.tsx
│   │   └── board/[id]/page.tsx
│   ├── api/
│   │   └── webhooks/stripe/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                    # Shadcn components
│   ├── board/
│   │   ├── board-view.tsx
│   │   ├── column.tsx
│   │   ├── task-card.tsx
│   │   └── task-modal.tsx
│   ├── workspace/
│   │   └── workspace-selector.tsx
│   └── shared/
│       ├── sidebar.tsx
│       └── header.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── prisma.ts
│   └── utils.ts
├── actions/
│   ├── workspace.ts
│   ├── board.ts
│   ├── column.ts
│   └── task.ts
├── stores/
│   ├── board-store.ts
│   └── ui-store.ts
├── hooks/
│   ├── use-realtime.ts
│   ├── use-optimistic-task.ts
│   └── use-debounce.ts
├── types/
│   └── index.ts
└── styles/
    └── globals.css
```

---

## 7. Key Features Checklist

### Core Features
- [ ] User authentication (email/password, OAuth)
- [ ] Workspace management
- [ ] Multiple boards per workspace
- [ ] Customizable columns
- [ ] Task creation, editing, deletion
- [ ] Task descriptions and rich text
- [ ] Tags and labels
- [ ] Due dates
- [ ] Comments with real-time updates

### Advanced Features
- [ ] Drag and drop (tasks and columns)
- [ ] Optimistic updates
- [ ] Real-time collaboration
- [ ] Search with debounce
- [ ] Filter by tags, due date, assignee
- [ ] Keyboard shortcuts
- [ ] Dark mode

### Nice to Have
- [ ] File attachments
- [ ] Task templates
- [ ] Activity log
- [ ] Notifications
- [ ] Mobile app (PWA)
- [ ] Analytics dashboard

---

## 8. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 9. Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run Prisma studio
npx prisma studio

# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Build for production
npm run build

# Start production server
npm start
```

---

## 10. Resources & Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn/UI Components](https://ui.shadcn.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [@dnd-kit Documentation](https://docs.dndkit.com)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)
- [Lexical Ranking / Fractional Indexing](https://www.figma.com/blog/realtime-editing-of-ordered-lists/)

---

## 11. Success Metrics

This project will be considered successful when it demonstrates:

1. **Performance:** Optimistic updates make the UI feel instant
2. **Collaboration:** Real-time sync works across multiple clients
3. **Code Quality:** TypeScript strict mode, no `any` types
4. **User Experience:** Accessible, responsive, keyboard-friendly
5. **Production Ready:** Deployed, tested, documented

---

*Plan Reset: February 2026*
