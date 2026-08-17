const express = require("express");
const connectDB = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// CORS — allow origins from env, fallback to localhost and vercel apps
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:3001", "https://v0-women-safety-portal.vercel.app"];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl) or matched origins
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      (typeof origin === "string" && origin.endsWith(".vercel.app"))
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Headers",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Rate limiter for auth endpoints — max 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

app.use(express.json());
app.use(cookieParser());

const policeRouter = require("./routes/Policeroute");
const reportRouter = require("./routes/ReportRoute");
const adminRouter = require("./routes/AdminRoute");
const trackingRouter = require("./routes/TrackingRoute");
const riskDetectionRouter = require("./routes/RiskDetectionRoute");

app.use("/api/police/login", authLimiter);
app.use("/api/police/signup", authLimiter);

app.use("/api/police", policeRouter);
app.use("/api/reports", reportRouter);
app.use("/api/admin", adminRouter);
app.use("/api/tracking", trackingRouter);
app.use("/api/risk-detection", riskDetectionRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});
connectDB()
  .then(() => {
    console.log("Database connected successfully");
    app.listen(process.env.PORT, () => {
      console.log("Server listening on port 7777");
    });
  })
  .catch((err) => {
    console.error("Database not connected", err);
  });
