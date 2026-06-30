# CiviQ — Eco-Civic & Municipal Resilience Platform
## Comprehensive System Documentation

CiviQ is a fully integrated, high-fidelity full-stack civic engagement and environmental portal designed to bridge the gap between active citizens and municipal ward officers. 

---

## 🗺️ System Overview

CiviQ enables community-led environmental auditing, proactive public safety reports, and localized green actions. The application uses a multi-tiered architecture with server-side AI-assisted verification, automatic geolocation routing, and persistent database tracking.

### Core Philosophy
* **Localized Impact**: Action is centered at the **Municipal Ward** level.
* **Environmental Stewardship**: Blends municipal report-tracking (e.g., waste, street damage) with active carbon auditing and green campaigns.
* **Citizen-Authority Trust Loop**: Enables citizens to report issues with live GPS data and lets verified officers resolve them transparently with automated SLA tracking.

---

## 🚀 Key Modules & Feature Set

### 1. 🌿 Lush Greenery Banner & Environmental Inspiration
* **Aesthetic Backdrop**: Styled with dark glassmorphic overlays and high-contrast ambient forest imagery to reinforce planetary care.
* **Environmental Inspiration**: Displays daily wisdom quotes (such as Lady Bird Johnson's famous call to action: *"The environment is where we all meet..."*).
* **Live Action Target**: Includes real-time indicators showcasing local carbon neutrality models and active daily citizen XP targets.

### 2. 📍 Smart Geolocation Ward Routing
* **Automatic GPS Detection**: Queries the browser's `navigator.geolocation` API instantly upon arrival.
* **Intelligent Proximity Mapping**: Computes Euclidean distance between the user's GPS coordinates and major Delhi ward coordinates:
  * **Ward 7 (Rajouri Garden)**
  * **Ward 3 (Pitampura)**
  * **Ward 11 (Dwarka)**
  * **Ward 5 (Malviya Nagar)**
* **Graceful Fallbacks**: If GPS is blocked or times out, defaults gracefully to the local default while reminding the user with an intuitive inline status indicator.

### 3. 📸 Rich Issue Reporting Platform
* **Visual File Upload**: Drag-and-drop or select-to-upload files for municipal evidence tracking.
* **Voice Transcription**: Built-in voice message recording and manual transcription options.
* **AI Smart Tagging & Validation**: Automatically matches reports to their respective departments (e.g., Roads & Footpaths, Waste Management, Public Sanitation) based on details provided.
* **SLA Escalation**: Tracks resolution speed and raises notifications if a critical ticket stays unaddressed.

### 4. 📊 Ward Incident Tracker & Budget Radar
* **Live Incident Feeds**: Interactive panels to browse, filter, or audit active ward-level grievances.
* **SLA Breaches**: High-visibility safety flags for tickets nearing violation.
* **Ward Budget Overview**: Illustrates sanctioned civic-green budgets and actual allocations.

### 5. ☘️ Carbon Footprint & Waste Tracker
* **Household Footprint Calculator**: Multi-factor calculations for transport fuel, electricity usage, and food consumption.
* **Dynamic Visualization**: Integrated tracking metrics displaying offsets and daily sustainability targets.

### 6. 🏆 Green Leaderboard & Citizen Credits
* **Engaged XP Engine**: Earn XP and civic status ranks (Bronze, Silver, Gold, Platinum).
* **Weekly Leaderboards**: Highlighting top performing citizens and community champions helping to clean municipal parks.

### 7. 👮 Secured Municipal Authority Terminal
* **Officer View**: Verifiably log in as a ward engineer or waste management manager.
* **Interactive Radar**: GPS-mapped radar pins of grievances reported in the logged-in ward.
* **Ticket Management**: Assign tickets to field teams, change statuses, and update citizen stakeholders directly.

---

## 🛠️ Technical Architecture

### Tech Stack
* **Frontend**: React 18+ with Vite, structured using modern functional components, hooks, and clean TypeScript.
* **Styling**: Tailwind CSS utility classes, glassmorphic filters, customized CSS variables (`--leaf`, `--muted`, `--gold`), and responsive design matrices.
* **Persistence & Database**: Cloud Firestore integrations paired with local storage fallbacks for offline-ready workflows.
* **Animations**: Elegant state transitions and smooth loading overlays powered by `motion` (`motion/react`).
* **Icons**: Standardized vector sets rendered directly through `lucide-react` or Font Awesome.

---

## 📂 Codebase & Directories

* `/src/App.tsx`: Central application shell, managing the global navigation frame, user profile state, active tabs, and main backdrop renderers.
* `/src/components/CiviQHome.tsx`: Dynamic home screen featuring the greenery canopy banner, live quote system, auto-detecting GPS locator, and quick preference selectors.
* `/src/components/CiviQReport.tsx`: Interactive issue reporting wizard with voice transcripts, geo-tagging, and file upload fields.
* `/src/components/CiviQTrack.tsx`: Detailed tracking portal for active ward issues and public civic projects.
* `/src/components/CiviQDashboard.tsx`: Live public dashboard charting environmental progress, SLA statistics, and civic health metrics.
* `/src/components/CiviQCampaigns.tsx`: Citizens enlist in tree-plantation drives, cleanliness marches, and sorting competitions.
* `/src/components/CiviQCarbonTracker.tsx`: Personalized carbon impact calculator.
* `/src/components/CiviQAuthorityDashboard.tsx`: Closed-portal suite for municipal officials to manage resources and complete tasks.
* `/src/components/InsightsCredits.tsx`: Live civic status tracking, badges, and the regional ward leaderboards.
