# JalDrishti (जलदृष्टि) 🌊
### Autonomous Municipal Water Intelligence & Rapid Infrastructure Response Platform

An end-to-end civic-tech platform designed to eliminate urban water loss and accelerate distribution repair cycles. **JalDrishti** integrates zero-barrier citizen reporting, computer vision (Google Gemini Multimodal Vision), mathematical nearest-crew dispatch (Haversine GPS formula), interactive GIS mapping, and human-in-the-loop repair verification.

---

## 📌 Problem Statement & Overview
Urban water distribution utilities face significant challenges with **Non-Revenue Water (NRW)** losses—where an estimated 30% to 45% of treated potable water is lost due to undetected leaks, delayed response times, and unverified repairs. Additionally, citizens lack real-time visibility into grievance redressal.

**JalDrishti** addresses this through an autonomous operations pipeline:
1. **Instant Citizen Reporting:** Zero-barrier reporting with automated GPS detection, reverse-geocoding, and photo capture.
2. **AI-Powered Optical Triage:** Multimodal vision models evaluate defect severity, detect spam or non-water uploads, and route complaints to specific municipal departments.
3. **Automated Team Dispatch:** Real-time Haversine distance calculations identify and assign the geographically closest available municipal repair van.
4. **Dual-Image AI Verification:** Before & After comparative analysis ensures pipeline repairs are completed and dry before closing work orders.
5. **Human-in-the-Loop Supervision:** Ambiguous or low-confidence repairs (<70%) are flagged for manual municipal officer review, enabling **Approve & Close** or **Order Re-Work** actions.
6. **Public Transparency Portal:** Open tracking via unique reference IDs (`JD-XXXXX`) and a public showcase with interactive Before/After sliders.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CITIZEN & PUBLIC WEB                            │
│  • Instant Camera Capture & Geotagging   • Step-by-Step Ticket Tracking     │
│  • Reverse Geocoded Address (OSM)       • Public Solved Cases Showcase      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP REST API (Axios / Fetch)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    NODE.JS + EXPRESS BACKEND (PORT 5000)                    │
│                                                                             │
│   ┌──────────────────────────┐             ┌───────────────────────────┐    │
│   │     AI Intelligence      │             │     Smart Dispatch Engine │    │
│   │   (Google Gemini Vision) │             │    (Haversine GPS Dist)   │    │
│   │ • Defect Classification  │             │ • Nearest Field Van Match │    │
│   │ • Before/After QA Check  │             │ • Delhi, Ghaziabad, Noida │    │
│   └──────────────────────────┘             └───────────────────────────┘    │
│                                                                             │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │       Prisma ORM Layer (SQLite for Local / PostgreSQL for Cloud)   │    │
│   │       • Complaints  • Municipal Teams  • Notifications             │    │
│   └────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┴─────────────────────────────┐
         ▼                                                           ▼
┌──────────────────────────────────┐        ┌──────────────────────────────────┐
│     MUNICIPAL COMMAND HUB        │        │      FIELD CREW WORKSPACE        │
│  • Interactive Leaflet GIS Map   │        │  • Mobile-first Work Orders      │
│  • Urgency Triage & Filters      │        │  • GPS Directions & Landmarks    │
│  • Human Officer Verification    │        │  • 1-Click After-Photo Upload    │
│    (Approve / Enforce Re-Work)   │        │  • Real-Time Closure Feedback    │
└──────────────────────────────────┘        └──────────────────────────────────┘
```

---

## ⚡ Key Features

### 1. 📷 Citizen Grievance Redressal
* **Zero Barrier Access:** No mandatory account creation or password friction; reports can be lodged in under 15 seconds.
* **Geospatial Precision:** Built-in GPS detection with automated reverse-geocoding via OpenStreetMap Nominatim for exact street-level addresses.
* **Live Ticket Tracking:** Public lookup via ticket reference code (`JD-...`) displaying a 4-stage operational progress stepper.

### 2. 🧠 Multimodal AI Vision Engine (Gemini 1.5 / 2.0 Flash)
* **Pre-Scan Validation:** Analyzes uploaded photos to verify that an actual water infrastructure problem exists, rejecting spam or irrelevant images.
* **Defect Categorization & Priority:** Determines urgency (`Critical`, `High`, `Medium`, `Low`) and routes tickets to appropriate departments (`Leak Repair`, `Water Quality`, `Water Supply`, `Sewage-Drainage`).
* **Before vs. After Repair Verification:** Compares the citizen's initial report photo against the field crew's completed repair photo, validating clamp integrity, surface dryness, and water transparency with a sub-second response timeout.

### 3. 🚒 Automated Nearest-Van Dispatch (Haversine Formula)
* Computes real-time spherical distances:
  $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
* Automatically pairs each verified incident with the nearest available municipal van stationed across Delhi, Ghaziabad, and Noida.

### 4. 🛡️ Human-in-the-Loop Municipal Governance
* In cases where AI confidence falls below 70% (due to extreme perspective shifts, shadows, or ambiguous surface dampness), the incident is flagged as **`Needs Hub Verification`**.
* Municipal officers can inspect Before & After photos side-by-side:
  * **Approve Work & Close Complaint:** Overrides the flag, marks ticket `Resolved`, and notifies the citizen via SMS.
  * **Order Crew Re-Work:** Reverts ticket to `In Progress` and dispatches immediate instructions to the field crew.

### 5. 🗺️ High-Precision GIS Command Center (Leaflet)
* Interactive map displaying color-coded markers (Red: Critical, Orange: High, Yellow: Medium, Green: Solved).
* Real-time field crew van locations and status indicators.
* Optimized for deep zooming up to level 22 without viewport resets.

### 6. 🏆 Public Transparency Gallery
* Open citizen showcase featuring an interactive Before/After drag slider (`BeforeAfterSlider.jsx`) providing visual proof of public works completion.

---

## 💻 Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Leaflet GIS, React Portal |
| **Backend** | Node.js, Express.js, Prisma ORM, CORS, Dotenv |
| **AI / Vision** | Google Gemini Vision API (Multimodal Flash models with 3.5s timeout) |
| **Database** | SQLite (Local development) / PostgreSQL (Cloud production ready) |
| **Geocoding** | OpenStreetMap Nominatim (Open-source reverse-geocoding) |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or newer installed)
* **Git**

### 1. Installation & Environment
Clone the repository:
```bash
git clone https://github.com/vanshhh01/JalDrishti.git
cd JalDrishti
```

Ensure `backend/.env` is configured:
```env
PORT=5000
GEMINI_API_KEY=your_google_gemini_api_key_here
DATABASE_URL="file:./dev.db"
```

### 2. Running Locally
Launch the application with the included batch script:
```cmd
start.bat
```
This script will:
* Verify and install dependencies for both backend and frontend.
* Start the Node.js REST API on `http://localhost:5000`.
* Start the Vite development server on `http://localhost:5173`.
* Automatically launch your default browser.

---

## 🏛️ Policy & Domain Alignment
* **Jal Jeevan Mission (JJM):** Infrastructure tracking for sustainable, clean tap-water delivery.
* **AMRUT 2.0:** Reducing urban Non-Revenue Water (NRW) loss through targeted, automated maintenance.
* **Smart Cities Mission:** Transparent civic governance powered by open geospatial mapping and AI.

---

**JalDrishti — Autonomous Municipal Water Infrastructure Management**
