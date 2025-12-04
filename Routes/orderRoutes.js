const express = require("express");
console.log("✅ Express module imported successfully");

const router = express.Router();
console.log("🚀 Express router instance created");

// ✅ CRITICAL FIX: Import authentication middleware
const { verifySeller, verifyBuyer, verifyToken } = require("../Middleware/authmiddleware");
console.log("🔐 Authentication middleware imported successfully");

const orderController = require("../Controllers/order.controller");
console.log("📦 Order controller imported successfully");
console.log("🔍 Available controller methods:", Object.keys(orderController));

// -------------------------------------------------------------------
// ROUTES WITH PROPER AUTHENTICATION
// -------------------------------------------------------------------

// Create new order (requires buyer authentication)
console.log("📝 Setting up POST / route with buyer auth...");
router.post("/", verifyBuyer, orderController.createOrder);
console.log("✅ POST / route registered successfully (🔐 buyer auth)");

// Get ALL orders (requires seller authentication to see seller's orders)
console.log("📝 Setting up GET / route with seller auth...");
router.get("/", verifySeller, orderController.getOrders);
console.log("✅ GET / route registered successfully (🔐 seller auth)");

// Get orders by buyer ID (requires buyer authentication)
console.log("📝 Setting up GET /buyer/:buyerId route with buyer auth...");
router.get("/buyer/:buyerId", verifyBuyer, orderController.getOrdersByBuyer);
console.log("✅ GET /buyer/:buyerId route registered successfully (🔐 buyer auth)");

// Get single order by ID (requires authentication)
console.log("📝 Setting up GET /:orderId route with auth...");
router.get("/:orderId", verifyToken, orderController.getOrderById);
console.log("✅ GET /:orderId route registered successfully (🔐 auth)");

// ✅ CRITICAL FIX: Seller respond to order (accept/reject) - REQUIRES SELLER AUTH
console.log("📝 Setting up PATCH /:orderId/respond route with seller auth...");
router.patch("/:orderId/respond", verifySeller, orderController.sellerRespondToOrder);
console.log("✅ PATCH /:orderId/respond route registered successfully (🔐 seller auth) ← FIXED!");

console.log("🎯 All order routes configured successfully with authentication");
console.log("📋 Route summary:");
console.log("   ┌─────────────────────────────────────────────────────────┐");
console.log("   │ POST   /                    (🔐 buyer auth)              │");
console.log("   │ GET    /                    (🔐 seller auth)             │");
console.log("   │ GET    /buyer/:buyerId      (🔐 buyer auth)             │");
console.log("   │ GET    /:orderId            (🔐 token auth)             │");
console.log("   │ PATCH  /:orderId/respond    (🔐 seller auth) ← FIXED!   │");
console.log("   └─────────────────────────────────────────────────────────┘");

module.exports = router;

console.log("📤 Order router exported successfully");
