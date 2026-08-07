# 🚛 ELD Trip Planner

An end-to-end full-stack web application designed for property-carrying commercial drivers. This application takes trip details and generates a fully **FMCSA-compliant Hours of Service (HOS) schedule**, visualizes the route on an interactive map, and automatically draws pixel-perfect daily ELD (Electronic Logging Device) log sheets using HTML5 Canvas.

## ✨ Features

- **HOS Compliance Engine**: Automatically calculates driving hours based on FMCSA rules:
  - 11-hour driving limit
  - 14-hour on-duty window
  - 30-minute mandatory breaks (after 8 hours of driving)
  - 10-hour mandatory rest periods
  - 70-hour / 8-day cycle limits (with 34-hour restarts)
  - Pre-trip inspections & mandatory fuel stops (every 1,000 miles)
- **Free Route Planning**: Integrates with open-source mapping APIs (Nominatim for geocoding, OSRM for routing) meaning **no paid API keys are required**.
- **Interactive Route Map**: Beautiful dark-themed Leaflet map showing the exact route polyline, along with color-coded markers for pickups, drop-offs, fuel stops, breaks, and rests.
- **Automated ELD Log Sheets**: Generates FMCSA-compliant, downloadable daily log grids exactly as they appear in standard paper logs or ELD printouts.
- **Modern UI/UX**: Built with React, featuring a responsive, dynamic glassmorphism design, smooth micro-animations, and a premium dark mode aesthetic.

## 🛠️ Tech Stack

### Frontend (User Interface)
- **React 18** (Vite)
- **HTML5 Canvas API** (for drawing the ELD log grids)
- **Leaflet & React-Leaflet** (for interactive map rendering)
- **Vanilla CSS** (custom design system, glassmorphism)

### Backend (API & HOS Engine)
- **Python 3.12**
- **Django 6.0** & **Django REST Framework**
- **Gunicorn** & **WhiteNoise** (for production readiness)
- **Requests** (for external API communication)

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/eld-trip-planner.git
cd eld-trip-planner
```

### 2. Setup the Backend (Django)
```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the development server (runs on port 8888 for React proxy)
python manage.py runserver 8888
```

### 3. Setup the Frontend (React)
Open a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be running at `http://localhost:5173`.

---

## 🌍 Production Deployment

The project is fully configured for deployment on modern PaaS platforms.

### Backend (Render.com)
1. Create a new Web Service on Render and connect your GitHub repo.
2. Set Root Directory to `backend`.
3. Set Build Command to `./build.sh`.
4. Set Start Command to `gunicorn eld_project.wsgi:application`.
5. Add required Environment Variables:
   - `DJANGO_SECRET_KEY` (generate a random string)
   - `DJANGO_ALLOWED_HOSTS` (`.onrender.com`)
   - `CORS_ALLOWED_ORIGINS` (Your Vercel URL, e.g., `https://your-app.vercel.app`)
   - `CSRF_TRUSTED_ORIGINS` (Your Vercel URL, e.g., `https://your-app.vercel.app`)
   - `PYTHON_VERSION` (`3.12.10`)
   - `DJANGO_DEBUG` (`False`)

### Frontend (Vercel)
1. Import your GitHub repo into Vercel.
2. Set Root Directory to `frontend`.
3. Framework Preset: **Vite**.
4. Add Environment Variable:
   - `VITE_API_URL` (Your Render Backend URL, e.g., `https://your-backend.onrender.com`)
5. Click **Deploy**.

---

## 📂 Project Structure

```text
eld-trip-planner/
├── backend/                  # Django REST API
│   ├── eld_project/          # Django project settings
│   ├── trips/                # Main app containing logic
│   │   ├── hos_engine.py     # Core FMCSA HOS simulation logic
│   │   ├── route_service.py  # OSRM & Nominatim API integration
│   │   └── views.py          # API endpoints
│   ├── requirements.txt      # Python dependencies
│   └── build.sh              # Production build script
├── frontend/                 # React UI
│   ├── src/
│   │   ├── components/       # UI Components (Map, Forms, Canvas)
│   │   ├── utils/
│   │   │   └── eldDrawing.js # HTML5 Canvas drawing logic
│   │   ├── App.jsx           # Main application flow
│   │   └── index.css         # Global styles & design system
│   └── package.json          # Node dependencies
└── README.md
```

## 📜 Disclaimer
This tool is built for **educational and simulation purposes**. While it aims to strictly follow FMCSA guidelines, drivers should always rely on certified, registered Electronic Logging Devices (ELDs) when operating commercial motor vehicles.
