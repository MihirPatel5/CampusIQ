# School ERP Frontend

A modern, production-ready School ERP frontend built with React 18, TypeScript, and Tailwind CSS.

## 🚀 Tech Stack

- **Framework:** React 18 with Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + ShadCN UI
- **State Management:** Zustand
- **Data Fetching:** TanStack React Query
- **HTTP Client:** Axios
- **Routing:** React Router v6
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Form Handling:** React Hook Form + Zod
- **Notifications:** Sonner

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/           # Auth-related components
│   ├── layout/         # Layout components (Sidebar, Navbar, etc.)
│   └── ui/             # ShadCN UI components
├── config/             # App configuration
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── pages/
│   ├── auth/           # Login, Forgot Password
│   └── dashboard/      # Dashboard with components
├── providers/          # Context providers
├── services/           # API services
├── stores/             # Zustand stores
├── styles/             # Global styles
└── types/              # TypeScript types
```

## 🛠️ Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```
   
   Configure the environment variables:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   VITE_APP_NAME=School ERP
   VITE_APP_VERSION=1.0.0
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Features

### Milestone 1 (Complete) ✅

- [x] Project scaffolding with Vite + React + TypeScript
- [x] Tailwind CSS + ShadCN UI setup
- [x] Theme system (Light/Dark/System)
- [x] Responsive sidebar navigation
- [x] Top navbar with user menu
- [x] Authentication flow (Login, Protected routes)
- [x] Zustand state management
- [x] Dashboard with stats cards
- [x] Charts (Admissions, Fees, Attendance)
- [x] Quick actions
- [x] Recent activities feed
- [x] Upcoming events

### Upcoming Milestones

- [ ] Students module (CRUD, Profile)
- [ ] Teachers module (CRUD, Approval)
- [ ] Classes & Sections management
- [ ] Subjects management
- [ ] Attendance marking
- [ ] Exams & Results
- [ ] Fees & Payments
- [ ] Timetable
- [ ] Notices
- [ ] Library
- [ ] Transport
- [ ] Settings & Roles

## 🔐 Authentication

The app uses JWT authentication with:
- Access tokens stored in localStorage
- Automatic token refresh
- Protected route guards
- Role-based access control

### Demo Credentials

| Role    | Username | Password   |
|---------|----------|------------|
| Admin   | admin    | admin123   |
| Teacher | teacher  | teacher123 |

## 📱 Responsive Design

- Mobile-first approach
- Collapsible sidebar on desktop
- Bottom sheet sidebar on mobile
- Touch-friendly interactions
- Optimized for all screen sizes

## 🎨 Theming

The app supports three theme modes:
- **Light** - Clean white theme
- **Dark** - Elegant dark theme
- **System** - Follows OS preference

Theme can be changed via the navbar dropdown.

## 📦 Dependencies

### Production
- `react` + `react-dom` - UI library
- `react-router-dom` - Routing
- `@tanstack/react-query` - Data fetching
- `axios` - HTTP client
- `zustand` - State management
- `framer-motion` - Animations
- `recharts` - Charts
- `react-hook-form` + `zod` - Forms
- `sonner` - Toast notifications
- `lucide-react` - Icons
- `class-variance-authority` + `clsx` + `tailwind-merge` - Styling utilities
- Radix UI primitives for ShadCN components

### Development
- `typescript` - Type safety
- `vite` - Build tool
- `tailwindcss` - CSS framework
- `eslint` - Linting

## 🏗️ Architecture

### State Management
- **Zustand** for global state (auth, sidebar)
- **React Query** for server state
- **React Hook Form** for form state

### API Layer
- Centralized Axios instance with interceptors
- Automatic token injection
- Token refresh handling
- Error message extraction

### Component Design
- Feature-based folder structure
- Reusable UI components
- Type-safe props
- Loading skeletons
- Error boundaries

## 📄 License

This project is private and proprietary.

