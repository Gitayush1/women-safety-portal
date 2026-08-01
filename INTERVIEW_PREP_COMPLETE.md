# Women Safety Portal — Complete Interview Preparation Guide

---

# TABLE OF CONTENTS

1. [Bunch 1: The Big Picture](#bunch-1-the-big-picture)
2. [Bunch 2: Tech Stack Deep Dive](#bunch-2-tech-stack-deep-dive)
3. [Bunch 3: Backend Architecture](#bunch-3-backend-architecture)
4. [Bunch 4: Authentication System](#bunch-4-authentication-system)
5. [Bunch 5: Data Models](#bunch-5-data-models)
6. [Bunch 6: AI Risk Detection Pipeline](#bunch-6-ai-risk-detection-pipeline)
7. [Bunch 7: Real-Time Tracking System](#bunch-7-real-time-tracking-system)
8. [Bunch 8: Frontend Architecture](#bunch-8-frontend-architecture)
9. [Bunch 9: Multi-Station Data Isolation](#bunch-9-multi-station-data-isolation)
10. [Bunch 10: Deployment & DevOps](#bunch-10-deployment--devops)
11. [Bunch 11: Interview Questions & Answers](#bunch-11-interview-questions--answers)
12. [Bunch 12: UI/UX Design Patterns](#bunch-12-uiux-design-patterns)
13. [Concepts Glossary](#concepts-glossary)

---

# BUNCH 1: THE BIG PICTURE

## What is this project?

A **Police Command Center** for women's safety. It is a full-stack web application where police officers can:

1. **Monitor** women in real-time on a live GPS map
2. **Receive & manage** emergency reports (harassment, domestic violence, SOS)
3. **AI-powered risk detection** — automatically classifies SOS messages as high/medium/low risk
4. **Admin operations** — manage officers, view stats, configure system

## One-Line Elevator Pitch

> "I built a real-time Police Command Center for women's safety with AI-powered risk detection that automatically classifies SOS emergencies using LLMs with heuristic fallback."

## Who are the users?

| User Type | What They Do |
|-----------|-------------|
| **Police Officers** | Login, view dashboard, manage reports, track women in real-time |
| **Admin (senior officers)** | Everything above + create/edit/delete officers, view stats |
| **Women (indirect)** | They use a separate mobile app that sends GPS + SOS data to MongoDB |

**IMPORTANT**: Women do NOT use this portal directly. Their SOS data comes from an external mobile app that writes to a MongoDB collection called `emergency_locations`. This portal is the **police-side dashboard** that reads and processes that data.

## Architecture Overview

```
Frontend (Next.js 15) ←→ Backend (Express.js) ←→ Database (MongoDB Atlas)
    Vercel                    Render.com              Cloud hosted
```

- **Frontend** makes REST API calls to backend with JWT cookies
- **Backend** processes requests, runs AI risk detection, talks to database
- **Database** stores officers, reports, and emergency location data

## Key Architectural Decisions

**Q: Why REST API instead of GraphQL?**
A: REST is simpler for well-defined CRUD operations. GraphQL is better when frontend needs flexible, nested queries. Our data needs are predictable.

**Q: Why cookie-based auth instead of Bearer tokens?**
A: HttpOnly cookies are invisible to JavaScript — protects against XSS attacks. Bearer tokens in localStorage can be stolen by malicious scripts.

**Q: Why monorepo (frontend + backend in same repo)?**
A: Simpler deployment for a project of this size. For larger teams, separate repos with OpenAPI/Swagger contract would be better.

**Q: Why not microservices?**
A: Only 5 route files and 2 models — microservices would add unnecessary complexity. Would only split if scaling to thousands of stations.

---

# BUNCH 2: TECH STACK DEEP DIVE

## Frontend Technologies

| Technology | What It Is | Why Chosen | Alternative |
|-----------|-----------|-----------|-------------|
| **Next.js 15** | React framework with SSR and file-based routing | Auto routing, SEO-ready, easy Vercel deployment | Vite + React (simpler, no SSR) |
| **TypeScript** | JavaScript with static types | Catch bugs before runtime, better autocomplete | Plain JavaScript |
| **Tailwind CSS v4** | Utility-first CSS framework | Rapid styling with classes like `p-4 font-bold` | CSS Modules, Styled Components |
| **Radix UI** | Headless accessible components | Handles accessibility (keyboard nav, ARIA, focus trap) | Headless UI |
| **shadcn/ui** | Pre-styled Radix components | Copy-paste into project, full ownership of code | Material UI, Chakra UI |
| **Leaflet** | Free open-source map library | No API key needed, uses OpenStreetMap | Google Maps (paid), Mapbox (paid) |
| **Recharts** | Chart library for React | Simple declarative API for dashboard charts | Chart.js, D3.js |
| **Lucide React** | Icon library | Modern, lightweight, tree-shakeable | Heroicons, Font Awesome |
| **Zod** | Runtime schema validation | Validates data shapes at runtime | Yup, Joi |
| **react-hook-form** | Form management | Minimal re-renders, great performance | Formik |

## Backend Technologies

| Technology | What It Is | Why Chosen | Alternative |
|-----------|-----------|-----------|-------------|
| **Express.js** | Minimal Node.js web framework | Simple, flexible, huge ecosystem | Fastify (faster), NestJS (enterprise) |
| **MongoDB** | NoSQL document database | Flexible schema for unpredictable data | PostgreSQL (relational, better for complex queries) |
| **Mongoose** | MongoDB ODM (Object-Document Mapper) | Adds schemas, validation, helper methods | Native MongoDB driver |
| **JWT** | JSON Web Tokens for auth | Stateless, scalable authentication | Session-based auth with Redis |
| **bcrypt** | Password hashing | Industry standard, intentionally slow | Argon2 (newer, more secure) |
| **OpenAI SDK** | LLM API client | GPT-4o-mini for risk classification | Hugging Face, self-hosted models |
| **express-rate-limit** | Brute-force protection | Limits login attempts per IP | Redis-based rate limiting |
| **cookie-parser** | Extracts cookies from requests | Needed to read JWT cookie | Built into newer frameworks |
| **cors** | Cross-origin request handling | Frontend and backend on different domains | Reverse proxy (same origin) |

## Why MongoDB over PostgreSQL?

Three specific reasons for THIS project:

1. **Flexible schema** — The `emergency_locations` collection receives data from external mobile apps with unpredictable field names. MongoDB handles this; PostgreSQL needs rigid schemas.

2. **Nested subdocuments** — Reports have embedded notes arrays and evidence arrays. In MongoDB, these are just embedded documents. In PostgreSQL, you'd need separate tables with JOINs.

3. **JSON-native** — API sends/receives JSON, MongoDB stores BSON (binary JSON). No conversion layer needed.

**When PostgreSQL would be better**: Complex analytical queries like "average response time per station grouped by report type" — SQL is far easier for this.

---

# BUNCH 3: BACKEND ARCHITECTURE

## Entry Point: app.js

The middleware pipeline order MATTERS. Here's the exact order and why:

```
1. CORS middleware          → Must be FIRST to block unauthorized origins
2. Rate limiter (auth only) → Applied before login route to catch brute-force
3. express.json()           → Parses JSON body into req.body
4. cookieParser()           → Parses cookies into req.cookies
5. Route handlers           → Your actual API logic
6. Global error handler     → Must be LAST (catches unhandled errors)
7. Database connect → Listen → Server starts only after DB connects
```

### Why order matters:

- **CORS before routes**: Without this, a cross-origin request would execute your route logic, potentially write to the database, and THEN get blocked. The damage is done.

- **Rate limiter before routes**: The limiter must reject excessive requests BEFORE the login handler runs (before password checking and database queries).

- **express.json() before routes**: Without this, `req.body` is `undefined`. Login would fail because it can't read badge number and password.

- **Error handler LAST with 4 parameters**: Express identifies error handlers by having exactly 4 parameters: `(err, req, res, next)`. It must be after all routes to catch their errors.

## CORS Configuration Explained

**What is CORS?** When your frontend (vercel.app) calls your backend (render.com), the browser blocks it by default because they're different domains. CORS tells the browser: "It's OK, I allow this specific frontend to call me."

```javascript
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);    // Allow
    } else {
      callback(new Error("Not allowed"));  // Block
    }
  },
  credentials: true,  // MUST be true for cookies to work cross-origin
}));
```

**Why not `origin: "*"` (allow everyone)?**
- Wildcard `*` does NOT work with `credentials: true`. Browser spec forbids this combination.
- Security risk — any website could make authenticated requests to your API.

**What is a Preflight request?**
Before the actual API call, the browser sends an OPTIONS request asking: "Am I allowed to do this?" The server responds with allowed origins, methods, and headers. Only then does the browser send the actual request.

## Rate Limiting

```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15-minute window
  max: 20,                    // Max 20 requests per IP
});

app.use("/api/police/login", authLimiter);
app.use("/api/police/signup", authLimiter);
```

**Why only on auth endpoints?** Login/signup are brute-force targets (try thousands of passwords). Other endpoints already need a valid JWT — can't brute-force them.

**Limitation**: Uses in-memory storage — resets on server restart, doesn't work across multiple server instances. Production fix: use `rate-limit-redis`.

## All API Endpoints

### Police Routes (/api/police)

| Method | Endpoint | Auth? | Purpose |
|--------|----------|-------|---------|
| POST | /signup | No (rate-limited) | Create officer account |
| POST | /login | No (rate-limited) | Login, get JWT cookie |
| GET | /me | Yes | Verify current session |
| GET | /stations | No (public) | List all stations |
| POST | /logout | Yes | Clear JWT cookie |

### Report Routes (/api/reports)

| Method | Endpoint | Auth? | Purpose |
|--------|----------|-------|---------|
| GET | / | Yes | Get all reports (filtered by station) |
| GET | /:id | Yes | Get single report details |
| POST | / | Yes | Create new report (runs AI risk) |
| PATCH | /:id/status | Yes | Update status (active→investigating→resolved) |
| PATCH | /:id/assign | Yes | Assign officer to report |
| POST | /:id/notes | Yes | Add investigation note |

### Admin Routes (/api/admin)

| Method | Endpoint | Auth? | Purpose |
|--------|----------|-------|---------|
| GET | /stats | Yes | Dashboard statistics |
| GET | /officers | Yes | List officers at this station |
| POST | /officers | Yes | Create new officer |
| PATCH | /officers/:id | Yes | Update officer |
| DELETE | /officers/:id | Yes | Delete officer |
| GET | /activity | Yes | Recent activity feed |

### Tracking Routes (/api/tracking)

| Method | Endpoint | Auth? | Purpose |
|--------|----------|-------|---------|
| GET | /users | Yes | All tracked women (with AI risk) |
| GET | /emergency | Yes | Emergency-only users |
| PATCH | /emergency/:id/resolve | Yes | Mark emergency resolved |

### Risk Detection Routes (/api/risk-detection)

| Method | Endpoint | Auth? | Purpose |
|--------|----------|-------|---------|
| POST | /analyze | Yes | Standalone risk analysis |

## Auth Middleware — The Gatekeeper

```javascript
const userAuth = async (req, res, next) => {
  // 1. Extract token from HttpOnly cookie
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Please Login!" });

  // 2. Verify JWT signature + check expiration
  const decode = jwt.verify(token, process.env.JWT_SECRET);

  // 3. Find user in database
  const user = await User.findById(decode._id).lean();
  if (!user) throw new Error("User not found");

  // 4. Attach user to request — available in route handler as req.user
  req.user = user;
  next();  // Continue to route handler
};
```

**How routes use auth**: `userAuth` is placed between the path and the handler function:

```javascript
reportRouter.get("/", userAuth, async (req, res) => { ... });
//                     ^^^^^^^^ runs first, checks JWT, sets req.user
```

If `userAuth` fails → returns error, handler NEVER runs.
If `userAuth` succeeds → calls `next()`, handler runs with `req.user` available.

---

# BUNCH 4: AUTHENTICATION SYSTEM

## Complete Auth Flow (4 Stages)

### Stage 1: SIGNUP

```
User fills form → POST /api/police/signup
    → Validate input (all fields required, password ≥ 8 chars)
    → Create Police document (password still plaintext)
    → .save() triggers pre-save hook → bcrypt.hash(password, 12)
    → Password is now "$2b$12$KIX..." (irreversible hash)
    → Generate JWT: jwt.sign({_id: officer._id}, secret, {expiresIn: "7d"})
    → Set JWT as HttpOnly cookie
    → Return officer data (WITHOUT password)
```

### Stage 2: LOGIN

```
User enters badge + password → POST /api/police/login
    → Find officer by badge number
    → If not found: "Invalid credentials" (generic message!)
    → bcrypt.compare(inputPassword, storedHash)
    → If doesn't match: "Invalid credentials" (same generic message!)
    → Generate JWT → Set cookie → Return officer data
```

**Why same error message for "user not found" AND "wrong password"?**
If "User not found" was a separate error, an attacker could try random badge numbers until they get "Wrong password" — now they know that badge number exists. Same message prevents this **user enumeration** attack.

### Stage 3: SESSION VERIFICATION (Every Page Load)

```
User navigates to any protected page
    → AuthGuard component mounts
    → Calls GET /api/police/me (cookie sent automatically by browser)
    → Backend: extract cookie → verify JWT → find user → return user data
    → 200 OK → Show the page
    → 401/400 → Redirect to /login
    → Network error → Check localStorage fallback
```

**Three states of AuthGuard:**
- `null` → Still checking → Show loading spinner
- `true` → Authenticated → Show the page
- `false` → Not authenticated → Redirect to login

### Stage 4: LOGOUT

```
User clicks Sign Out
    → POST /api/police/logout
    → Backend: clearCookie("token") → tells browser to delete the cookie
    → Frontend: ALWAYS clears localStorage (even if API call fails)
    → Redirect to /login
```

## Password Hashing — bcrypt Explained

```javascript
// What happens inside bcrypt.hash("haroli12345", 12):
// 1. Generate random salt: "$2b$12$KIXzq8..."
// 2. Hash password+salt: Run 2^12 = 4096 rounds of hashing
// 3. Final: "$2b$12$KIXzq8eG5Q3w2j5h..." (60 chars, irreversible)
```

**Salt rounds = 12** means 2^12 = 4096 iterations. Higher = slower = more secure. 12 is the industry standard balance.

**Why salt?** Without it, two users with password "hello123" would have identical hashes. An attacker with a pre-computed "rainbow table" could look up common passwords. Salt makes every hash unique.

| Algorithm | Speed | Security | Use For |
|-----------|-------|----------|---------|
| bcrypt (used here) | Intentionally slow | Very good | Passwords |
| Argon2 | Configurable | Best | New projects |
| SHA-256 | Fast | Bad for passwords | File checksums |
| MD5 | Very fast | Broken | Never use for security |

## JWT Cookie Configuration

```javascript
const COOKIE_OPTIONS = {
  httpOnly: true,     // JavaScript CANNOT access this cookie (XSS protection)
  secure: true,       // Only sent over HTTPS (not HTTP)
  sameSite: "none",   // Allows cross-origin sending (frontend ≠ backend domain)
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days in milliseconds
};
```

**Why HttpOnly cookie instead of localStorage?**
localStorage is accessible via JavaScript → XSS attack can steal the token. HttpOnly cookies are invisible to JavaScript — only the browser manages them.

**Why `sameSite: "none"`?**
Frontend (Vercel) and backend (Render) are on different domains. Without `sameSite: "none"`, the browser won't send the cookie to a different domain. But this requires `secure: true` (HTTPS only).

---

# BUNCH 5: DATA MODELS

## Model 1: Police (Officers/Stations)

```javascript
{
  policeStationName: String,    // "Sadar Police Station"
  badgeNumber: String (unique), // "BG121" — login identifier
  password: String,             // bcrypt hash
  latitude: Number,             // Station GPS
  longitude: Number,            // Station GPS
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Plus 3 methods:**
- `pre("save")` hook → auto-hashes password before saving
- `getJWT()` → generates JWT token
- `validatePassword()` → compares input with stored hash

**Design improvements for production:**
- Add `role: enum['admin', 'supervisor', 'officer']` for access control
- Use GeoJSON for location → enables MongoDB geospatial queries like "find nearest station"
- Create a separate Station model → avoids denormalized station names

## Model 2: Report (Core Data — 22+ Fields)

### Core Info
```javascript
reportId: "RPT-001"        // Human-readable sequential ID
type: "Emergency"           // Emergency|Harassment|Domestic Violence|Suspicious Activity|Other
location: "Main Street"     // Text description
description: "Someone following me"  // The actual report content
```

### Voice Support
```javascript
voiceTranscript: "please help"   // Transcription of voice SOS
voiceUrl: "https://..."          // Audio file URL
```

### AI Risk Analysis (Auto-filled — NEVER from client)
```javascript
priority: "high"            // AI-determined: high|medium|low
riskConfidence: 0.87        // AI confidence score (0 to 1)
riskReason: "Rule-based..." // Why this risk level
riskSource: "llm"           // "llm" or "heuristic"
status: "active"            // active → investigating → resolved
```

**CRITICAL**: Priority is NEVER accepted from the client request. It's always computed by the AI risk engine server-side. This prevents someone from manipulating priority.

### Source Tracking
```javascript
source: "manual" | "emergency_locations"  // How report was created
sourceEmergencyLocationId: String         // Links to emergency_locations doc
// sparse: true + unique: true → unique only when field exists
```

### Assignment & Multi-Station Visibility
```javascript
assignedOfficer: ObjectId → Police      // Which officer is assigned
assignedStationId: ObjectId → Police    // Primary station
linkedStationIds: [ObjectId → Police]   // ALL stations that can see this report
assignedStation: "Station Name"         // String fallback
```

### Nested Documents
```javascript
evidence: [String]          // URLs to evidence files
notes: [{
  note: String,
  addedBy: ObjectId → Police,
  timestamp: Date
}]
```

## Model 3: emergency_locations (NO Schema!)

This collection has NO Mongoose model. Accessed directly:

```javascript
const db = mongoose.connection.db;
await db.collection("emergency_locations").find({}).toArray();
```

**Why no schema?** Data comes from an external mobile app with unpredictable formats. Different documents might store the name as `name`, `username`, `userName`, or `reporterName`. A rigid Mongoose schema would reject valid documents.

The backend handles this with **defensive normalization** — trying every possible field name:

```javascript
name: doc?.name || doc?.username || doc?.userName || doc?.reporterName || "Unknown"
phone: doc?.reporterPhone || doc?.phone || doc?.phoneNumber || "N/A"
```

This is called the **Tolerant Reader pattern**.

---

# BUNCH 6: AI RISK DETECTION PIPELINE

This is the **most impressive feature** of the project. When asked "What's the most technically challenging part?", talk about THIS.

## The 5-Stage Pipeline

```
Input: "please help, someone is chasing me"
    ↓
Stage 1: PREPROCESS
    Merge text + voice, lowercase, clean whitespace
    Output: "please help someone is chasing me"
    ↓
Stage 2: EMBED
    Convert text → 16-dimensional number vector
    Output: [0.23, 0.67, 0.12, ...]
    ↓
Stage 3: RETRIEVE
    Find most similar past incidents using cosine similarity
    Output: topSimilarity = 0.87
    ↓
Stage 4: CLASSIFY
    Send to LLM (Gemini/OpenAI) OR run heuristic
    Output: { level: "high", confidence: 0.91 }
    ↓
Stage 5: RULE OVERRIDE
    Check critical keywords like "chasing me"
    Final Output: HIGH risk, P1 priority, 0.91 confidence
```

## Stage 1: Preprocessing

Merges typed text AND voice transcript into one string, then normalizes:
- Lowercase: "HELP ME" → "help me"
- Remove apostrophes: "don't" → "don t"
- Collapse whitespace: "help    me" → "help me"

**Why merge both?** A person might type "help" AND say "someone is following me" — both are danger signals.

## Stage 2: Embedding (Vectorization)

Converts text to a 16-number array using character codes. This is a **prototype** — not real ML embeddings.

**What are embeddings?** A way to represent text as numbers so you can mathematically compare similarity between texts. Real embeddings (OpenAI, Sentence-BERT) understand meaning — "king" and "queen" would be close. The prototype just uses character codes.

**Production replacement:** OpenAI `text-embedding-3-small` or self-hosted Sentence-BERT.

## Stage 3: Retrieval (Mini-RAG System)

Compares the input against 5 historical incidents using **cosine similarity**:

```
Historical incidents:
- "I am being followed near the bus stop" (high risk)
- "A person is verbally harassing me" (medium risk)
- "Street feels dark but no immediate threat" (low risk)
- "Unknown bike rider circling around me" (high risk)
- "I'm in danger" (medium risk)
```

**Cosine similarity** measures how similar two vectors are — 1.0 = identical direction, 0 = unrelated. The top similarity score is passed to the classifier as context.

**This is a RAG pattern**: Retrieval-Augmented Generation — retrieve relevant context, then feed it to the classifier for better decisions.

## Stage 4: Classification (The Brain)

Supports **3 LLM providers + 1 heuristic fallback**:

| Provider | When Used | Model | Cost |
|----------|-----------|-------|------|
| Google Gemini | `RISK_LLM_PROVIDER=gemini` | gemini-2.5-flash | Paid |
| OpenAI | `RISK_LLM_PROVIDER=openai` | gpt-4o-mini | Paid |
| Ollama (local) | `RISK_LLM_PROVIDER=ollama` | llama3.2 | Free |
| Heuristic | No API key or LLM fails | Keyword scoring | Free |

### The Heuristic Classifier (Fallback)

```javascript
const severityHints = ["danger", "followed", "chasing", "attack", "threat", "help"];
const hintMatches = severityHints.filter(hint => text.includes(hint)).length;
const baseScore = 0.25 + hintMatches * 0.12 + similarityScore * 0.45;

// Score ≥ 0.8 → HIGH
// Score ≥ 0.55 → MEDIUM
// Score < 0.55 → LOW
```

Example: "someone is chasing me, help" with similarity 0.85:
- hintMatches = 2 ("chasing", "help")
- baseScore = 0.25 + 0.24 + 0.3825 = **0.87 → HIGH**

### The LLM Classifier

Sends a structured prompt to the LLM:

```
System: "You are an emergency risk classifier. Return JSON: {level, confidence}"
User: "Classify: 'someone is following me'. Similarity to past incidents: 0.85"
```

Key settings:
- **temperature: 0** → Deterministic output (same input = same result every time)
- **max_tokens: 80** → Short response (just JSON), saves cost
- **json_schema** → Forces valid JSON response

### What is Temperature?

Controls how random the AI's response is:
- **0** = Always picks the most likely word. Same input → same output. Used for classification.
- **0.7** = Some randomness. Good for conversation (ChatGPT default).
- **1.5+** = Very creative/random. Good for brainstorming.

We use 0 because "someone is chasing me" MUST always be classified as "high". Randomness is dangerous in a safety system.

### The Fallback Chain

```
Try LLM (Gemini/OpenAI/Ollama)
├── API key missing → Use heuristic
├── API call fails (network/timeout) → Use heuristic
├── LLM returns invalid JSON → Use heuristic
└── RISK_LLM_REQUIRED=true? → THROW ERROR instead of fallback
```

`RISK_LLM_REQUIRED` is a production flag:
- `false` → Silent fallback to heuristic (never go down)
- `true` → Throw error (alert ops team when AI quality degrades)

## Stage 5: Rule Engine Override

Hard-coded keyword rules that OVERRIDE the AI:

```
"being followed"       → Force HIGH (score +40)
"in danger"            → Force HIGH (score +45)
"help me"              → Force HIGH (score +35)
"someone is chasing me" → Force HIGH (score +50)
"harassment"           → Force MEDIUM (score +20)
"unsafe"               → Force MEDIUM (score +15)
```

**Why override AI?** Certain phrases are unambiguously dangerous. Even if the AI says "medium" with low confidence, "someone is chasing me" should ALWAYS be high. This is standard in production ML — business rules on top of models.

## Confidence Thresholding

If AI confidence < 55%:
- Default to MEDIUM (not low — safety-first)
- Flag for human review
- Reason: "Ambiguous confidence; routed to medium priority review"

**Philosophy**: False negatives (missing a real emergency) are far worse than false positives (over-classifying). Uncertain cases always get escalated.

## Caching for Performance

The tracking page polls every 5 seconds, running AI for every user. Without caching = dozens of LLM calls per 5 seconds = expensive and slow.

**Solution**: In-memory cache with 2-minute TTL. Cache key = docId + content hash. Re-analysis only when data actually changes.

**Production upgrade**: Redis (shared across server instances, persistent).

---

# BUNCH 7: REAL-TIME TRACKING SYSTEM

## How It Works End-to-End

```
1. Woman presses SOS → mobile app writes GPS + message to emergency_locations
2. Dashboard polls GET /api/tracking/users every 5 seconds
3. Backend reads emergency_locations, filters by station, normalizes data
4. Backend runs AI risk detection on each user (with caching)
5. Backend auto-creates/updates a Report document for each emergency
6. Frontend displays users on map + list with status/AI risk/battery
7. Officer clicks "Resolve" → marks both emergency_locations and Report as resolved
```

## Station Scoping — Who Sees What

The `isAssignedToStation()` function checks if a tracked user is assigned to the current station. It checks MULTIPLE possible field names because the mobile app's format is unpredictable:

- `doc.stationId`
- `doc.assignedStationId`
- `doc.dedicatedStationId`
- `doc.linkedStationIds`
- `doc.assignedStation` (by name)
- `doc.policeStationName` (by name)

**Fallback**: If NO documents match the current station → show ALL documents. Better to show too much than to miss a real emergency.

## Data Normalization

The `normalizeUserDoc()` function transforms any document format into a consistent shape:

```javascript
{
  _id: "683f...",
  name: "Priya",          // tries: name, username, userName, reporterName
  phone: "9876543210",    // tries: reporterPhone, phone, phoneNumber
  status: "emergency",    // normalizes: "SOS"→"emergency", "alert"→"warning"
  lastLocation: {lat, lng, timestamp},  // tries 4 different location formats
  batteryLevel: 67,       // real value or deterministic fake from doc ID
}
```

## Auto-Generated Reports (Upsert Pattern)

```javascript
Report.findOneAndUpdate(
  { sourceEmergencyLocationId },              // Find existing report for this emergency
  { $set: update, $setOnInsert: { status: "active" } },
  { new: true, upsert: true }                // Create if not found, update if found
);
```

**What is upsert?** UPDATE + INSERT. If a report exists for this emergency → update it. If not → create a new one. This prevents duplicate reports on each 5-second poll.

**`$setOnInsert`**: Only set `status: "active"` on first creation. If an officer already changed it to "investigating", the update won't reset it.

## Frontend Auto-Refresh

```javascript
useEffect(() => {
  fetchData();                                    // Fetch immediately
  const interval = setInterval(fetchData, 5000);  // Then every 5 seconds
  return () => clearInterval(interval);           // Cleanup on unmount
}, [viewMode, refreshKey]);
```

**Why polling instead of WebSockets?**
Polling is simpler to implement. WebSockets (via Socket.io which is already in package.json) would be better:
- Lower latency (instant push vs 5-second delay)
- Less bandwidth (no repeated HTTP headers)
- Fewer server requests

**Upgrade path**: Use MongoDB Change Streams to detect new emergencies → emit Socket.io event → frontend updates instantly.

## Emergency Resolution

When officer clicks "Resolve":
1. Frontend: `PATCH /api/tracking/emergency/:id/resolve`
2. Backend: Update `emergency_locations` status → "safe"
3. Backend: Update linked Report → status "resolved", priority "low"
4. Frontend: Remove user from list immediately (optimistic UI)

---

# BUNCH 8: FRONTEND ARCHITECTURE

## Next.js App Router — File-Based Routing

```
app/
├── layout.tsx          → Wraps ALL pages (fonts, CSS)
├── page.tsx            → URL: / (Dashboard)
├── login/page.tsx      → URL: /login
├── register/page.tsx   → URL: /register
├── admin/page.tsx      → URL: /admin
├── tracking/page.tsx   → URL: /tracking
```

Every folder inside `app/` = a URL route. No manual routing configuration needed.

## Server Components vs Client Components

```
"use client" at the top of a file = Client Component
No directive = Server Component (default)
```

| | Server Component | Client Component |
|---|---|---|
| Runs on | Server only | Browser + server |
| Can use | async/await, database access | useState, useEffect, onClick |
| JS sent to browser | Zero | Yes (increases bundle) |
| Example | layout.tsx, login/page.tsx | sidebar.tsx, login-form.tsx |

**Best practice**: Push `"use client"` as far DOWN the tree as possible. Static wrappers = Server Components. Interactive forms/maps = Client Components.

## DashboardLayout — Composition Pattern

Every protected page uses the same layout:

```javascript
<DashboardLayout>
  <AuthGuard>        ← Checks authentication
    <Sidebar />      ← Navigation
    <Header />       ← Clock, notifications, profile
    {children}       ← Page-specific content
  </AuthGuard>
</DashboardLayout>
```

## Key React Patterns

### 1. Controlled Forms
React state drives the input value. Every keystroke updates state:
```javascript
const [formData, setFormData] = useState({ badgeNumber: "", password: "" });
<Input value={formData.badgeNumber} onChange={e => setFormData(...)} />
```

### 2. Three-State Loading
Every data component has three states:
- Loading: Show "Loading..."
- Empty: Show "No data found"
- Data: Show actual content

### 3. Optimistic UI
Update the UI immediately after API success, without waiting for next data refresh:
```javascript
// After resolving an emergency:
setAllUsers(prev => prev.filter(u => u._id !== userId));  // Remove immediately
// Don't wait 5 seconds for the next poll
```

### 4. Callback Props (Child → Parent)
Data flows DOWN via props. Events flow UP via callback functions:
```javascript
// Parent passes callback to child:
<ActiveTracking onCountsUpdate={(total, emergency) => { ... }} />

// Child calls the callback:
onCountsUpdate?.(users.length, emergencyUsers.length);
```

### 5. useMemo for Performance
Memoize expensive computations so they only recalculate when dependencies change:
```javascript
const markers = useMemo(() => [
  ...trackedUsers.map(...),
  ...policeStations.map(...)
], [trackedUsers, policeStations]);  // Only recalculate when these change
```

### 6. Dynamic Import (SSR Avoidance)
Leaflet requires `window` which doesn't exist on the server:
```javascript
const DynamicMap = dynamic(() => import("./leaflet-map"), { ssr: false });
```
`ssr: false` = only render this component in the browser, never on the server.

### 7. The `cn()` Utility
Combines conditional CSS classes with Tailwind conflict resolution:
```javascript
cn("text-red-500", isActive && "text-primary")
// isActive=true → "text-primary" (red removed by tailwind-merge)
// isActive=false → "text-red-500"
```

## The `@/` Import Alias
```javascript
import { Button } from "@/components/ui/button"  // Clean
// Instead of: import { Button } from "../../../../components/ui/button"  // Ugly
```
Defined in tsconfig.json — `@/` maps to project root.

---

# BUNCH 9: MULTI-STATION DATA ISOLATION

## The Problem
Authentication = "Are you logged in?"
Authorization = "What are you allowed to see?"

Station A should NOT see Station B's reports. But boundary reports should be visible to BOTH stations.

## The Solution: buildStationReportFilter

```javascript
const buildStationReportFilter = (station) => ({
  $or: [
    { linkedStationIds: { $in: [stationId] } },    // In linked array
    { assignedStationId: { $in: [stationId] } },   // Primary assignment
    { assignedStation: stationName },                // Name-based fallback
  ]
});
```

This filter is applied to EVERY report operation (read, update, assign, add notes). If Station B tries to access Station A's report, `findOne` returns `null` → 404.

## Admin Data Isolation

Officers CRUD is filtered by station name:
```javascript
Police.find({ policeStationName: currentStationName })
```

An admin at Station A can only manage officers at Station A.

---

# BUNCH 10: DEPLOYMENT & DEVOPS

## Architecture

| Component | Platform | How Deployed |
|-----------|----------|-------------|
| Frontend | Vercel | Auto-deploy on git push, runs `next build` |
| Backend | Render.com | Configured via render.yaml, runs `node src/app.js` |
| Database | MongoDB Atlas | Cloud-hosted, connected via connection string |

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | Vercel (frontend) | Backend URL. `NEXT_PUBLIC_` prefix = available in browser |
| `DB_CONNECTION_SECRET` | Render (backend) | MongoDB connection string |
| `JWT_SECRET` | Render (backend) | JWT signing key |
| `OPENAI_API_KEY` | Render (backend) | OpenAI API access |
| `GEMINI_API_KEY` | Render (backend) | Gemini API access |
| `RISK_LLM_PROVIDER` | Render (backend) | Which LLM: openai/gemini/ollama |

## Security Concern

The `.env` file with real API keys was committed to Git — this is a security issue. In production:
- Store secrets in hosting platform's dashboard (not in code)
- Rotate all exposed keys immediately
- Use a secret manager (AWS Secrets Manager, HashiCorp Vault)

## Production Improvements

| Area | Current | Production |
|------|---------|-----------|
| Real-time | HTTP polling (5s) | WebSocket via Socket.io |
| Caching | In-memory Map | Redis |
| Auth | Single JWT | Refresh token rotation |
| Logging | console.log | Winston/Pino + Datadog |
| Testing | None | Jest + Supertest + Playwright |
| Monitoring | None | Sentry (errors), Prometheus (metrics) |
| RBAC | None | Admin/supervisor/officer roles |
| Rate limiting | In-memory | Redis-backed |

---

# BUNCH 11: INTERVIEW QUESTIONS & ANSWERS

## Q1: "Tell me about your project" (60-second pitch)

> "I built a Women Safety Command Center — a full-stack real-time dashboard for police officers. The frontend is Next.js 15 on Vercel, the backend is Express.js on Render, and the database is MongoDB Atlas.
>
> The standout feature is an AI-powered risk detection pipeline that automatically classifies incoming SOS messages using a hybrid approach — it tries an LLM first (Gemini/OpenAI), falls back to a heuristic classifier if the API is down, and applies hard-coded keyword rules for critical phrases like 'being followed'.
>
> It also has real-time GPS tracking with Leaflet maps, auto-refreshing every 5 seconds, and a multi-station data isolation pattern so each police station only sees their own reports.
>
> The auth system uses HttpOnly JWT cookies for XSS protection, bcrypt for password hashing, and rate limiting on auth endpoints."

## Q2: "What's the most technically challenging part?"

> "The AI risk detection pipeline. The challenge wasn't just calling an API — it was building a production-grade system with 5 layers:
>
> 1. Preprocessing: merge text + voice, normalize
> 2. Retrieval: mini-RAG system with cosine similarity against historical incidents
> 3. Classification: supports 3 LLM providers (Gemini, OpenAI, Ollama) with heuristic fallback
> 4. Rule engine: keyword overrides for unambiguous danger phrases
> 5. Confidence thresholding: uncertain cases default to medium + flagged for review
>
> The fallback chain ensures 100% uptime — if any LLM fails, the heuristic takes over. Plus, risk assessments are cached for 2 minutes since the tracking page polls every 5 seconds."

## Q3: "Walk me through what happens when a woman sends an SOS"

> "Her mobile app writes to the emergency_locations collection in MongoDB. The police dashboard polls every 5 seconds via GET /api/tracking/users. The backend reads the raw data, filters by the officer's station, normalizes inconsistent field names, runs the 5-stage AI risk pipeline, and auto-creates a Report document. The frontend displays the user on the map as a red pulsing dot with the AI risk level. The officer can click 'Resolve' which updates both the emergency_locations document and the linked Report."

## Q4: "How do you handle if the LLM API goes down?"

> "Three-level fallback: (1) Try the configured LLM. (2) If API key is missing or call fails, fall back to a heuristic keyword-based classifier that runs in microseconds. (3) If there's no text content at all, default to medium priority with a 'flagged for review' marker. The RISK_LLM_REQUIRED env flag lets us toggle between silent fallback (never go down) and throw-on-failure (alert ops team)."

## Q5: "Why MongoDB over PostgreSQL?"

> "Three reasons: (1) The emergency_locations collection has unpredictable schemas — MongoDB handles this natively. (2) Reports have embedded subdocuments like notes arrays — fits MongoDB's document model without JOIN tables. (3) Data is primarily accessed by document, not by complex analytical queries. PostgreSQL would be better if we needed complex analytics like 'average response time per station grouped by report type'."

## Q6: "Explain your authentication approach"

> "JWT tokens stored in HttpOnly cookies. On signup, bcrypt hashes the password with 12 salt rounds. On login, bcrypt.compare verifies the input. The JWT contains only the officer's _id, signed with a secret, expiring in 7 days. HttpOnly prevents JavaScript access (XSS protection), secure flag ensures HTTPS-only, and sameSite: none allows cross-origin cookie sending between Vercel frontend and Render backend."

## Q7: "What security measures are in your application?"

> "1. Password hashing: bcrypt with 12 salt rounds
> 2. HttpOnly cookies: JWT invisible to JavaScript (XSS-proof)
> 3. CORS whitelist: only allowed origins can make requests
> 4. Rate limiting: 20 requests per 15 minutes on auth endpoints
> 5. Password never returned: destructured out before API response
> 6. Generic error messages: 'Invalid credentials' prevents user enumeration
> 7. Data isolation: each station only sees its own reports via query filters
> 8. AI priority: never accepted from client — always computed server-side"

## Q8: "How would you handle 1000 simultaneous SOS messages?"

> "Current bottleneck is Promise.all() running AI for all users in parallel — 1000 LLM calls would hit rate limits. Solutions: (1) Cache prevents re-analysis on subsequent polls. (2) Use a job queue (BullMQ + Redis) for background processing. (3) Use heuristic classifier for bulk processing, LLM only for individual deep analysis. (4) Implement pagination — show 50 most recent, not all 1000."

## Q9: "What would you change for production?"

> "WebSockets instead of polling, Redis instead of in-memory cache, refresh token rotation, role-based access control, proper logging with Winston/Pino, error tracking with Sentry, automated testing with Jest/Supertest, CI/CD with GitHub Actions, GeoJSON for location fields enabling $near queries, and a separate Station model to avoid denormalized names."

## Q10: "Why not use WebSockets?"

> "Socket.io is already in the dependencies but not fully implemented. Polling was chosen for faster prototyping — it's simpler to debug. WebSockets would be better: server watches MongoDB Change Streams on emergency_locations, emits events to connected clients on changes. This gives sub-second latency vs 5-second polling delay, and eliminates unnecessary requests when nothing has changed."

## Q11: "Explain the multi-station assignment"

> "Reports have assignedStationId (primary) and linkedStationIds (array of all stations that should see the report). If an emergency happens near a boundary, both nearby stations' IDs go into linkedStationIds. The buildStationReportFilter function uses $or to match any of these fields, ensuring officers at linked stations can view, update, and add notes to the report."

## Q12: "What's wrong with your current schema?"

> "1. reportId generation using countDocuments() has a race condition under concurrency — two simultaneous creates could get the same ID.
> 2. No index on assignedStation — filter queries do full collection scans at scale.
> 3. Station names are denormalized strings — renaming requires updating multiple collections.
> 4. No TTL index on resolved reports — collection grows forever.
> 5. No role field — all officers can access admin endpoints."

## Q13: "How would you test the AI risk detection?"

> "Three levels: (1) Unit tests — test each service independently (does preprocessing normalize correctly? Does heuristic return 'high' for 3+ danger keywords?). (2) Integration tests — test the full pipeline end-to-end with mocked LLM responses. (3) Regression dataset — 200+ labeled SOS messages, run through pipeline on every code change, alert if results change unexpectedly. Most important metric: recall on 'high' risk — never miss a real emergency."

## Q14: "What's the Tolerant Reader pattern you mentioned?"

> "It means the system accepts multiple data formats gracefully instead of rejecting anything that doesn't match an exact schema. For example, location might be in doc.lastLocation.lat, doc.latitude, doc.lat, or doc.location.lat — the extractLocation function tries all four. This is critical when consuming data from external systems whose format you can't control."

## Q15: "Controlled vs uncontrolled components?"

> "Controlled: React state drives the input value. Every keystroke calls setState, which updates the input. More predictable, enables real-time validation. Uncontrolled: input manages its own value, use useRef to read it on submit. Less re-renders, simpler. This project uses controlled because we clear error messages when the user starts typing — that requires knowing the input value in state."

## Q16: "What is `populate()` in Mongoose?"

> "It resolves ObjectId references to actual documents. Without it, assignedOfficer would be just '683f2a...' (an ID). With .populate('assignedOfficer', 'badgeNumber'), it becomes {_id: '...', badgeNumber: 'BG121'}. Mongoose makes TWO separate queries internally — it's not a database-level JOIN. For heavy use, I'd embed the data or use MongoDB's $lookup aggregation."

## Q17: "What is upsert?"

> "UPDATE + INSERT. If a document matching the filter exists, update it. If not, create a new one. Used in the tracking system to avoid duplicate reports: first poll creates the report, every subsequent poll updates the same report. The $setOnInsert option only sets fields on creation (like status: 'active') — won't overwrite if an officer already changed it."

## Q18: "What are you most proud of in this project?"

> "The AI risk detection pipeline's resilience. It's not just a cool feature — it's built to handle every failure mode. LLM down? Heuristic fallback. Low confidence? Flag for review. Critical phrase? Rule override. Same text hitting the API 100 times? Cached. The system degrades gracefully instead of failing completely — which is exactly what a safety-critical system needs."

---

# BUNCH 12: UI/UX DESIGN PATTERNS

| Pattern | Where | Why |
|---------|-------|-----|
| Pulsing red dots | Emergency map markers | Draws officer's eye to danger instantly |
| Live clock | Header (updates every second) | Police ops are time-critical |
| Collapsible sidebar | Navigation panel | More space for map on smaller screens |
| Demo credentials | Login form (BG121/haroli12345) | Interviewers can access immediately |
| Glassmorphism | User list overlay on map | Readable text over dynamic background |
| Color-coded status | Green/Amber/Red | Universal traffic-light triage |
| AI confidence bar | Report detail modal | Officers judge AI trustworthiness |
| "LIVE" indicator | Header green dot | Reassures system is actively connected |
| Resolve button | Only on emergency users | Prevents accidental clicks (progressive disclosure) |
| Relative timestamps | "5m ago" not "2026-06-29 10:15" | Faster to understand |

---

# CONCEPTS GLOSSARY

| Term | Simple Explanation |
|------|-------------------|
| **REST API** | A way to communicate between frontend and backend using URLs and HTTP methods (GET, POST, PATCH, DELETE) |
| **JWT** | A digitally signed token containing user ID. Server can verify it without checking a database every time |
| **bcrypt** | Converts passwords into irreversible hashes. Even if the database is stolen, passwords can't be recovered |
| **CORS** | Browser security that blocks requests from one website to another. Must be explicitly allowed |
| **Middleware** | Functions that run BETWEEN receiving a request and sending a response. Like security checkpoints |
| **HttpOnly Cookie** | A cookie that JavaScript cannot read. The browser sends it automatically with requests |
| **SSR** | Server-Side Rendering. The server generates HTML before sending to browser. Better SEO |
| **ODM** | Object-Document Mapper. Mongoose converts MongoDB documents to JavaScript objects with validation |
| **Upsert** | Update if exists, Insert if not. Prevents duplicates |
| **ObjectId** | MongoDB's auto-generated unique ID for every document (like a primary key) |
| **populate()** | Mongoose method to resolve ID references into actual documents (like a JOIN) |
| **GeoJSON** | Standard format for geographic data. Enables MongoDB spatial queries |
| **Rate Limiting** | Restricting how many requests a user can make in a time window |
| **XSS** | Cross-Site Scripting. Injecting malicious JavaScript into a webpage |
| **CSRF** | Cross-Site Request Forgery. Making a user's browser send unauthorized requests |
| **RAG** | Retrieval-Augmented Generation. Fetching relevant context before making an AI decision |
| **Cosine Similarity** | Mathematical measure of how similar two vectors are (0 = unrelated, 1 = identical) |
| **Temperature** | LLM setting controlling randomness. 0 = deterministic, 1+ = creative |
| **Embedding** | Converting text/data into a vector (array of numbers) for mathematical comparison |
| **Heuristic** | A rule-based approach that gives a good-enough answer without AI/ML |
| **Fallback** | A backup system that activates when the primary system fails |
| **Polling** | Repeatedly asking the server for new data at fixed intervals |
| **WebSocket** | A persistent connection where the server can push data to clients instantly |
| **Optimistic UI** | Updating the UI immediately before confirming with the server |
| **useMemo** | React hook that caches expensive calculations, recalculating only when inputs change |
| **useEffect** | React hook that runs side effects (API calls, timers) when component mounts or dependencies change |
| **Dynamic Import** | Loading a component only when needed, not upfront. Reduces initial page load |
| **Sparse Index** | MongoDB index that only indexes documents where the field exists |
| **Tolerant Reader** | Pattern where the consumer accepts multiple data formats gracefully |
| **Composition** | Building complex UIs by combining smaller, reusable components |
| **Progressive Disclosure** | Showing information/controls only when relevant (e.g., Resolve button only on emergencies) |

---

# YOUR 5 INTERVIEW PILLARS

| Pillar | One-Line Pitch |
|--------|---------------|
| 🏗️ **Architecture** | Full-stack Next.js + Express + MongoDB with REST API and cookie-based JWT auth |
| 🤖 **AI Feature** | Hybrid risk detection: LLM with heuristic fallback and keyword rule override |
| 📍 **Real-Time** | Live GPS tracking with 5-second polling, auto-generated reports via upsert |
| 🔒 **Security** | HttpOnly cookies, bcrypt, CORS whitelist, rate limiting, station data isolation |
| 📐 **Design** | Defensive data normalization, multi-station visibility, optimistic UI updates |

---

*Good luck with your interview! Lead with the AI Risk Detection Pipeline — it's your strongest differentiator.*
