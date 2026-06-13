# Tasker ⚡️

A modern, full-stack, AI-powered Task Management application featuring a high-contrast Brutalist aesthetic. Built with React (Next.js), Hono, Prisma, and PostgreSQL.

![Brutalist UI Concept]<img width="1913" height="947" alt="image" src="https://github.com/user-attachments/assets/c46f59bb-91ef-49bf-924c-7216b5b86e51" />
 *(Placeholder)*

## 🚀 Core Features

- **🎨 High-End Brutalist UI/UX:** Strict monochrome palette, rigid 2px solid borders, and sharp pixel drop-shadows with butter-smooth Framer Motion animations.
- **📱 Responsive Layout:** Seamlessly toggle between Kanban board, List, and Table views on desktop, with a unified scrolling experience on mobile.
- **🛡 Role-Based Access Control:** Secure JWT authentication with dedicated dashboards for standard users and a System Admin directory for user management.
- **📎 Task Attachments:** Upload, view, and manage file attachments directly inside your task cards.
- **⚡ Real-Time Filtering & Sorting:** Instantly organize your workflow by due date, priority, or creation date.
- **🌗 First-Class Dark Mode:** Full light and dark theme support with persistent local storage.
- **🧠 AI-Powered "Magic" Tasks:** Paste unstructured meeting notes, and the integrated AI (powered by **Groq** and `llama-3.3-70b-versatile`) will automatically parse and generate actionable tasks.
- **🎙 Hands-Free Voice Commands:** Built-in speech recognition lets you say "Add task buy groceries" or "Complete task update timeline" to manage your workspace purely with your voice.
---

## 💻 Technology Stack

**Frontend:**
- [Next.js](https://nextjs.org/) (React Framework)
- [Tailwind CSS](https://tailwindcss.com/) (Styling)
- [Framer Motion](https://www.framer.com/motion/) (Animations)
- Lucide React (Icons)

**Backend:**
- [Hono](https://hono.dev/) (Ultrafast Web Framework)
- [Prisma](https://www.prisma.io/) (Next-generation ORM)
- [PostgreSQL](https://www.postgresql.org/) (Hosted via Neon)
- [Groq SDK](https://console.groq.com/) (AI Inference)

**Infrastructure:**
- [Nginx](https://nginx.org/) (Reverse Proxy)
- Docker & Docker Compose

---

## ⚙️ Local Development Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/) and Docker Compose
- A PostgreSQL database (e.g., [Neon](https://neon.tech/))
- A [Groq](https://console.groq.com/) API Key

### 2. Clone the repository
```bash
git clone https://github.com/shashwat558/tasker.git
cd tasker
```

### 3. Environment Variables
Create a `.env` file in the `backend/` directory:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# Security
JWT_SECRET="your-super-secret-jwt-key"

# AI Integration
GROQ_API_KEY="gsk_your_groq_api_key_here"
```

### 4. Running with Docker Compose
The easiest way to get the entire stack (Frontend + Backend) running locally is using Docker.

```bash
docker compose up --build
```
- **Main Application**: `http://localhost:80` (Served via Nginx)
- **API Endpoints**: `http://localhost:80/api/*` (Routed to Backend via Nginx)

*Note: Nginx acts as an API gateway and reverse proxy, cleanly routing standard traffic to the Next.js frontend and `/api` paths to the Hono backend under a single unified domain/port.*

### 5. Running Manually (Without Docker)

**Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📂 Project Structure

```text
.
├── backend/                  # Hono REST API
│   ├── prisma/               # Database schema and migrations
│   ├── src/
│   │   ├── middleware/       # JWT and error handling
│   │   ├── routes/           # Auth, Tasks, Admin, AI endpoints
│   │   └── index.ts          # Server entry point
│   └── Dockerfile.dev
├── frontend/                 # Next.js Application
│   ├── app/                  # Next.js App Router (Pages & Layouts)
│   ├── components/           # Reusable UI Components (TaskBoard, VoiceCommand, etc.)
│   ├── context/              # React Context (Auth)
│   └── Dockerfile.dev
├── nginx/                    # Reverse Proxy Configuration
│   └── nginx.conf            # Routes /api to backend and / to frontend
└── docker-compose.yml        # Multi-container orchestration
```

---

## 🤖 AI "Magic" Integration Notes
The `/api/tasks/magic` endpoint utilizes the Groq SDK to execute lightning-fast LLM inference. Ensure your `GROQ_API_KEY` is properly configured, otherwise the magic task generation and meeting notes parsing will gracefully fail back to manual entry.

