const express = require("express");
const rateLimit = require("express-rate-limit");

// Import statements ke baad console log
console.log("📦 [Buyer Routes] Dependencies imported successfully");
console.log("   - express: loaded");
console.log("   - express-rate-limit: loaded");

const {
  registerBuyer,
  loginBuyer,
  getBuyerProfile,
  updateBuyerProfile,
  refreshToken,
  logoutBuyer
} = require("../Controllers/user.controller");
const verifyBuyer = require("../Middleware/verifybuyer");

console.log("🎯 [Buyer Routes] Controller functions imported:", {
  registerBuyer: typeof registerBuyer,
  loginBuyer: typeof loginBuyer,
  getBuyerProfile: typeof getBuyerProfile,
  updateBuyerProfile: typeof updateBuyerProfile,
  refreshToken: typeof refreshToken,
  logoutBuyer: typeof logoutBuyer
});
console.log("🔐 [Buyer Routes] verifyBuyer middleware imported successfully");

const router = express.Router();
console.log("🔗 [Buyer Routes] Express router initialized");

// Rate limiting for auth routes
console.log("⚡ [Buyer Routes] Setting up rate limiting configuration...");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs (increased from 5)
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    console.log("🛡️ [Auth Rate Limiter] Checking request from IP:", req.ip);
    console.log("🛡️ [Auth Rate Limiter] Request path:", req.path);
    console.log("🛡️ [Auth Rate Limiter] User-Agent:", req.get('User-Agent'));
    return false; // Don't skip any requests
  },
  onLimitReached: (req, res) => {
    console.log("🚨 [Auth Rate Limiter] LIMIT REACHED!");
    console.log("   - IP Address:", req.ip);
    console.log("   - Path:", req.path);
    console.log("   - Time:", new Date().toISOString());
    console.log("   - User-Agent:", req.get('User-Agent'));
  }
});

console.log("🛡️ [Buyer Routes] Auth rate limiter configured:");
console.log("   - Window: 15 minutes");
console.log("   - Max requests: 50 per IP");
console.log("   - Applied to: /register, /login, /refresh-token");

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    console.log("🌐 [General Rate Limiter] Processing request from IP:", req.ip);
    console.log("🌐 [General Rate Limiter] Method:", req.method);
    console.log("🌐 [General Rate Limiter] Path:", req.path);
    return false; // Don't skip any requests
  },
  onLimitReached: (req, res) => {
    console.log("🚨 [General Rate Limiter] LIMIT REACHED!");
    console.log("   - IP Address:", req.ip);
    console.log("   - Method:", req.method);
    console.log("   - Path:", req.path);
    console.log("   - Time:", new Date().toISOString());
  }
});

console.log("🌐 [Buyer Routes] General rate limiter configured:");
console.log("   - Window: 15 minutes");
console.log("   - Max requests: 100 per IP");
console.log("   - Applied to: ALL routes");

// Apply general rate limiting to all routes
router.use((req, res, next) => {
  console.log("📥 [Buyer Routes] Incoming request:");
  console.log("   - Method:", req.method);
  console.log("   - Path:", req.path);
  console.log("   - IP:", req.ip);
  console.log("   - Timestamp:", new Date().toISOString());
  console.log("   - User-Agent:", req.get('User-Agent'));
  console.log("   - Authorization:", req.headers.authorization ? "Present" : "Not present");
  next();
});

router.use(generalLimiter);
console.log("🌐 [Buyer Routes] General rate limiter applied to all routes");

// ===================================================================
// Public Routes with stricter rate limiting
// ===================================================================
console.log("🔓 [Buyer Routes] Setting up public routes...");

router.post("/register", 
  (req, res, next) => {
    console.log("📝 [Register Route] Registration request received");
    console.log("   - IP Address:", req.ip);
    console.log("   - Request body keys:", Object.keys(req.body));
    console.log("   - Email:", req.body.email);
    console.log("   - Name:", req.body.name);
    console.log("   - Mobile:", req.body.mobile);
    next();
  },
  authLimiter, 
  (req, res, next) => {
    console.log("✅ [Register Route] Auth rate limiter passed");
    console.log("🎯 [Register Route] Proceeding to registerBuyer controller");
    next();
  },
  registerBuyer
);

console.log("✅ [Buyer Routes] POST /register route registered with auth rate limiting");

router.post("/login", 
  (req, res, next) => {
    console.log("🔐 [Login Route] Login request received");
    console.log("   - IP Address:", req.ip);
    console.log("   - Email:", req.body.email);
    console.log("   - Password provided:", !!req.body.password);
    console.log("   - Remember me:", req.body.rememberMe);
    next();
  },
  authLimiter, 
  (req, res, next) => {
    console.log("✅ [Login Route] Auth rate limiter passed");
    console.log("🎯 [Login Route] Proceeding to loginBuyer controller");
    next();
  },
  loginBuyer
);

console.log("✅ [Buyer Routes] POST /login route registered with auth rate limiting");

router.post("/refresh-token", 
  (req, res, next) => {
    console.log("🔄 [Refresh Token Route] Token refresh request received");
    console.log("   - IP Address:", req.ip);
    console.log("   - Refresh token provided:", !!req.body.refreshToken);
    next();
  },
  authLimiter, 
  (req, res, next) => {
    console.log("✅ [Refresh Token Route] Auth rate limiter passed");
    console.log("🎯 [Refresh Token Route] Proceeding to refreshToken controller");
    next();
  },
  refreshToken
);

console.log("✅ [Buyer Routes] POST /refresh-token route registered with auth rate limiting");

// ===================================================================
// Protected Routes
// ===================================================================
console.log("🔒 [Buyer Routes] Setting up protected routes...");

router.get("/profile", 
  (req, res, next) => {
    console.log("👤 [Get Profile Route] Profile request received");
    console.log("   - IP Address:", req.ip);
    console.log("   - Authorization header:", req.headers.authorization ? "Present" : "Missing");
    next();
  },
  verifyBuyer, 
  (req, res, next) => {
    console.log("✅ [Get Profile Route] Authentication successful");
    console.log("   - Buyer ID:", req.buyer?.id);
    console.log("   - Buyer email:", req.buyer?.email);
    console.log("🎯 [Get Profile Route] Proceeding to getBuyerProfile controller");
    next();
  },
  getBuyerProfile
);

console.log("✅ [Buyer Routes] GET /profile route registered (protected)");

router.put("/profile", 
  (req, res, next) => {
    console.log("✏️ [Update Profile Route] Profile update request received");
    console.log("   - IP Address:", req.ip);
    console.log("   - Authorization header:", req.headers.authorization ? "Present" : "Missing");
    console.log("   - Update fields:", Object.keys(req.body));
    next();
  },
  verifyBuyer, 
  (req, res, next) => {
    console.log("✅ [Update Profile Route] Authentication successful");
    console.log("   - Buyer ID:", req.buyer?.id);
    console.log("   - Fields to update:", Object.keys(req.body));
    console.log("🎯 [Update Profile Route] Proceeding to updateBuyerProfile controller");
    next();
  },
  updateBuyerProfile
);

console.log("✅ [Buyer Routes] PUT /profile route registered (protected)");

router.post("/logout", 
  (req, res, next) => {
    console.log("🚪 [Logout Route] Logout request received");
    console.log("   - IP Address:", req.ip);
    console.log("   - Authorization header:", req.headers.authorization ? "Present" : "Missing");
    next();
  },
  verifyBuyer, 
  (req, res, next) => {
    console.log("✅ [Logout Route] Authentication successful");
    console.log("   - Buyer ID:", req.buyer?.id);
    console.log("   - Buyer email:", req.buyer?.email);
    console.log("🎯 [Logout Route] Proceeding to logoutBuyer controller");
    next();
  },
  logoutBuyer
);

console.log("✅ [Buyer Routes] POST /logout route registered (protected)");

console.log("🎉 [Buyer Routes] All routes setup completed successfully");
console.log("📊 [Buyer Routes] Route summary:");
console.log("   📍 Public Routes (with auth rate limiting):");
console.log("      - POST /register");
console.log("      - POST /login");
console.log("      - POST /refresh-token");
console.log("   📍 Protected Routes (with authentication):");
console.log("      - GET  /profile");
console.log("      - PUT  /profile");
console.log("      - POST /logout");

console.log("🛡️ [Buyer Routes] Security features active:");
console.log("   - General rate limiting: 100 requests/15min per IP");
console.log("   - Auth rate limiting: 50 requests/15min per IP");
console.log("   - JWT authentication on protected routes");

module.exports = router;

console.log("📤 [Buyer Routes] Router exported successfully");
console.log("🚀 [Buyer Routes] Buyer routes module ready for use");
