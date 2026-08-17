# 🚚 FleetFlow — Smart Fleet Coordination & Logistics Management Platform

FleetFlow is an end-to-end smart fleet coordination and logistics management platform designed to optimize shipment allocation, route navigation, real-time vehicle tracking, and automated alert management.

---

## 🌟 Key Features

- 📦 **Complete Shipment Lifecycle Management**: Create, assign, track, delay-simulate, and deliver shipments.
- 🎯 **Smart Allocation & Optimization**: Automated vehicle-to-shipment allocation based on capacity, priority, and availability, with route distance/ETA optimization.
- 🗺️ **Real-Time GPS Tracking**: Interactive Leaflet maps powered by Socket.IO real-time telemetry streaming and trip simulation.
- 🚨 **Automated Exception Monitoring**: Real-time alerts for route deviations, delay risks, low progress, and vehicle offline events.
- 📊 **Analytics & Operations Dashboard**: High-level telemetry, driver performance ratings, vehicle utilization, and operational metrics.
- 👥 **Role-Based Access**: Specialized interfaces for Dispatchers and Drivers.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Lucide Icons
- **Mapping**: Leaflet + React-Leaflet
- **State & Data Fetching**: TanStack React Query + Axios
- **Real-time Updates**: Socket.io-client

### Backend
- **Runtime**: Node.js + Express.js (TypeScript)
- **Database & ORM**: PostgreSQL + Prisma ORM
- **Real-Time Engine**: Socket.IO
- **Auth**: JWT (JSON Web Tokens) + Bcrypt password hashing

---

## 📁 Repository Structure

```
fleetflow/
├── package.json               # Root scripts (runs client + server concurrently)
├── client/                    # Vite + React Frontend Application
│   ├── src/
│   │   ├── components/        # UI & Layout Components
│   │   ├── pages/             # Dashboard, Vehicles, Shipments, Analytics Pages
│   │   ├── services/          # Axios API client & Socket.IO client
│   │   └── types/             # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
└── server/                    # Express + Prisma Backend API
    ├── prisma/
    │   ├── schema.prisma      # PostgreSQL Schema Definitions
    │   └── seed.ts            # Seed Data (Demo users, vehicles, shipments)
    ├── src/
    │   ├── controllers/       # Route Logic
    │   ├── routes/            # REST API endpoints
    │   ├── services/          # Allocation & Optimization Algorithms
    │   ├── sockets/           # Socket.IO Real-time Tracking handlers
    │   └── server.ts          # Server Entry Point
    ├── package.json
    └── .env                   # Database Connection & Environment Config
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** running locally on port `5432`
- A database named `fleetflow` created in PostgreSQL

---

### 1. Installation

Clone the repository and install all dependencies:

```bash
git clone https://github.com/umeshchandra1306/FleetFlow.git
cd FleetFlow/fleetflow

# Install dependencies across root, server, and client
npm run install:all
```

---

### 2. Environment Configuration

Create a `.env` file in the `server/` directory (`server/.env`):

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/fleetflow?schema=public"
JWT_SECRET="fleetflow-secret-key-2026"
PORT=5000
```

> 💡 **Note for PostgreSQL Passwords**: If your PostgreSQL password contains special characters (like `@`, `#`, or `$`), ensure you URL-encode them in the `DATABASE_URL` string (e.g. `@` becomes `%40`).

---

### 3. Database Setup & Seeding

1. Create the `fleetflow` database in PostgreSQL (via pgAdmin or SQL shell):
   ```sql
   CREATE DATABASE fleetflow;
   ```

2. Run Prisma migrations and seed the database with demo data:
   ```bash
   npm run db:setup
   ```
   *(Or individually: `cd server && npx prisma migrate dev && npx prisma db seed`)*

---

### 4. Running the Application

Start both the backend API and frontend client concurrently with a single command:

```bash
npm run dev
```

- 💻 **Frontend**: [http://localhost:3000](http://localhost:3000)
- ⚙️ **Backend API**: [http://localhost:5000](http://localhost:5000)
- 🩺 **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Demo Access Credentials

| Role | Email | Password |
|------|-------|----------|
| **Dispatcher** | `demo@fleetflow.com` | `demo123` |
| **Driver** | `driver@fleetflow.com` | `demo123` |

---

## 📡 API Overview

| Prefix | Resource | Description |
|--------|----------|-------------|
| `/api/auth` | Authentication | Login, Register, User profile |
| `/api/dashboard` | Dashboard | Metrics summary, recent alerts |
| `/api/vehicles` | Vehicle Management | List, create, update status/location |
| `/api/drivers` | Driver Profiles | Driver assignments, ratings, status |
| `/api/shipments` | Shipment Lifecycle | Create, auto-allocate, optimize, dispatch, deliver |
| `/api/routes` | Route Navigation | Distance, ETA, optimized waypoints |
| `/api/tracking` | GPS Tracking | Live coordinates, location history |
| `/api/alerts` | Exception System | Deviation alerts, resolve notifications |
| `/api/analytics` | Fleet Intelligence | Fleet utilization, performance stats |
| `/api/notifications`| User Notifications | Real-time system notifications |

---

## 📄 License

This project is licensed under the ISC License.
