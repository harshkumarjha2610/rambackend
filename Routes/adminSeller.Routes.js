const express = require("express");
console.log("✅ Express imported successfully in adminSeller routes");

const router = express.Router();
console.log("🚀 Express router instance created for adminSeller");

const adminController = require("../Controllers/admin.controller");
console.log("📦 Admin controller imported:", {
  registerSeller: typeof adminController.registerSeller,
  loginSeller: typeof adminController.loginSeller,
  getSellerProfile: typeof adminController.getSellerProfile,
  updateSellerProfile: typeof adminController.updateSellerProfile,
  getSellers: typeof adminController.getSellers,
  approveSeller: typeof adminController.approveSeller,
  rejectSeller: typeof adminController.rejectSeller,
  deleteSeller: typeof adminController.deleteSeller
});

const { verifySeller } = require('../Middleware/authmiddleware');
console.log("🔐 Auth middleware imported:", typeof verifySeller);

// Seller Routes (No authentication required)
console.log("📝 Setting up POST /register route...");
router.post("/register", adminController.registerSeller);
console.log("✅ POST /register route registered successfully");

console.log("📝 Setting up POST /login route...");
router.post("/login", adminController.loginSeller);
console.log("✅ POST /login route registered successfully");

console.log("📝 Setting up GET /profile route (protected)...");
router.get('/profile', verifySeller, adminController.getSellerProfile);
console.log("✅ GET /profile route registered successfully");

console.log("📝 Setting up PUT /profile route (protected)...");
router.put('/profile', verifySeller, adminController.updateSellerProfile);
console.log("✅ PUT /profile route registered successfully");

// Admin Routes (No authentication required)
console.log("📝 Setting up GET / route...");
router.get("/", adminController.getSellers);
console.log("✅ GET / route registered successfully");

console.log("📝 Setting up POST /approve-seller/:id route...");
router.post("/approve-seller/:id", (req, res, next) => {
  console.log("📩 Approve request received for seller ID:", req.params.id);
  next();
}, adminController.approveSeller);
console.log("✅ POST /approve-seller/:id route registered successfully");

console.log("📝 Setting up POST /reject-seller/:id route...");
router.post("/reject-seller/:id", (req, res, next) => {
  console.log("📩 Reject request received for seller ID:", req.params.id);
  next();
}, adminController.rejectSeller);
console.log("✅ POST /reject-seller/:id route registered successfully");

console.log("📝 Setting up DELETE /:id route...");
router.delete("/:id", (req, res, next) => {
  console.log("📩 Delete request received for seller ID:", req.params.id);
  next();
}, adminController.deleteSeller);
console.log("✅ DELETE /:id route registered successfully");

console.log("🎯 All adminSeller routes configured successfully");
console.log("📋 Route summary:");
console.log("   📍 Seller Routes:");
console.log("      - POST /register");
console.log("      - POST /login");
console.log("      - GET  /profile (protected)");
console.log("      - PUT  /profile (protected)");
console.log("   📍 Admin Routes:");
console.log("      - GET  /");
console.log("      - POST /approve-seller/:id");
console.log("      - POST /reject-seller/:id");
console.log("      - DELETE /:id");

console.log("📤 AdminSeller router exported successfully");
module.exports = router;