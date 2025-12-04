const jwt = require("jsonwebtoken");
const Seller = require("../Models/seller.model");
const Buyer = require("../Models/buyer.model"); // ✅ Add this

console.log('🔧 Auth Middleware loaded at:', new Date().toISOString());

// Helper to extract JWT token from Authorization header
const extractToken = (req) => {
  console.log('   🔍 [extractToken] Starting token extraction...');
  const authHeader = req.header("Authorization");
  console.log("   📋 [extractToken] Raw Authorization Header:", authHeader);
  
  if (!authHeader) {
    console.log("   ❌ [extractToken] No Authorization header found");
    return null;
  }
  
  if (!authHeader.startsWith("Bearer ")) {
    console.log("   ❌ [extractToken] Authorization header doesn't start with 'Bearer '");
    return null;
  }
  
  const token = authHeader.replace("Bearer ", "").trim();
  console.log("   ✅ [extractToken] Token extracted successfully");
  console.log("   📋 [extractToken] Token length:", token.length);
  
  return token;
};

// ✅ Seller Authentication Middleware
const verifySeller = async (req, res, next) => {
  const requestId = Math.random().toString(36).substring(2, 8);
  console.log(`\n🚀 === SELLER AUTH MIDDLEWARE [${requestId}] ===`);
  
  try {
    const token = extractToken(req);
    
    if (!token) {
      console.log(`❌ [${requestId}] No token found`);
      return res.status(401).json({ 
        success: false, 
        message: "No token provided"
      });
    }

    if (!process.env.JWT_SECRET) {
      console.log(`❌ [${requestId}] JWT_SECRET not configured`);
      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ [${requestId}] Token verified - Type: ${decoded.type}`);
    
    if (decoded.type !== "seller") {
      console.log(`❌ [${requestId}] Invalid token type`);
      return res.status(403).json({ 
        success: false, 
        message: "Invalid token type: Not a seller token"
      });
    }

    const seller = await Seller.findById(decoded.sellerId).select("-password");
    
    if (!seller) {
      console.log(`❌ [${requestId}] Seller not found`);
      return res.status(404).json({ 
        success: false, 
        message: "Seller account not found"
      });
    }
    
    console.log(`✅ [${requestId}] Seller authenticated: ${seller.email}`);

    // Allow all sellers except rejected ones
    if (seller.verificationStatus === "rejected") {
      console.log(`❌ [${requestId}] Seller account rejected`);
      return res.status(403).json({
        success: false,
        message: "Your account has been rejected. Please contact support."
      });
    }

    req.seller = {
      sellerId: seller._id.toString(),
      id: seller._id.toString(),
      email: seller.email,
      type: 'seller',
      ownerName: seller.ownerName,
      pharmacyName: seller.pharmacyName,
      isVerified: seller.isVerified,
      verificationStatus: seller.verificationStatus
    };
    
    req.sellerDocument = seller;
    req.token = token;
    req.requestId = requestId;
    
    console.log(`✅ [${requestId}] Seller auth complete\n`);
    next();
    
  } catch (err) {
    console.log(`❌ [${requestId}] Auth error: ${err.message}`);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token"
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again."
      });
    }
    
    res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Authentication error'
    });
  }
};

// ✅ NEW: Buyer Authentication Middleware
const verifyBuyer = async (req, res, next) => {
  const requestId = Math.random().toString(36).substring(2, 8);
  console.log(`\n🚀 === BUYER AUTH MIDDLEWARE [${requestId}] ===`);
  
  try {
    const token = extractToken(req);
    
    if (!token) {
      console.log(`❌ [${requestId}] No token found`);
      return res.status(401).json({ 
        success: false, 
        message: "No token provided"
      });
    }

    if (!process.env.JWT_SECRET) {
      console.log(`❌ [${requestId}] JWT_SECRET not configured`);
      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ [${requestId}] Token verified - Type: ${decoded.type}`);
    
    if (decoded.type !== "buyer") {
      console.log(`❌ [${requestId}] Invalid token type`);
      return res.status(403).json({ 
        success: false, 
        message: "Invalid token type: Not a buyer token"
      });
    }

    const buyer = await Buyer.findById(decoded.buyerId || decoded.id).select("-password");
    
    if (!buyer) {
      console.log(`❌ [${requestId}] Buyer not found`);
      return res.status(404).json({ 
        success: false, 
        message: "Buyer account not found"
      });
    }
    
    console.log(`✅ [${requestId}] Buyer authenticated: ${buyer.email}`);

    req.buyer = {
      buyerId: buyer._id.toString(),
      id: buyer._id.toString(),
      email: buyer.email,
      type: 'buyer',
      name: buyer.name
    };
    
    req.buyerDocument = buyer;
    req.token = token;
    req.requestId = requestId;
    
    console.log(`✅ [${requestId}] Buyer auth complete\n`);
    next();
    
  } catch (err) {
    console.log(`❌ [${requestId}] Auth error: ${err.message}`);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token"
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again."
      });
    }
    
    res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Authentication error'
    });
  }
};

// ✅ NEW: Generic Token Verification (works for both buyer and seller)
const verifyToken = async (req, res, next) => {
  const requestId = Math.random().toString(36).substring(2, 8);
  console.log(`\n🚀 === TOKEN AUTH MIDDLEWARE [${requestId}] ===`);
  
  try {
    const token = extractToken(req);
    
    if (!token) {
      console.log(`❌ [${requestId}] No token found`);
      return res.status(401).json({ 
        success: false, 
        message: "No token provided"
      });
    }

    if (!process.env.JWT_SECRET) {
      console.log(`❌ [${requestId}] JWT_SECRET not configured`);
      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ [${requestId}] Token verified - Type: ${decoded.type}`);
    
    req.user = decoded;
    req.token = token;
    req.requestId = requestId;
    
    // Set specific properties based on type
    if (decoded.type === 'seller') {
      req.seller = {
        sellerId: decoded.sellerId || decoded.id,
        type: 'seller'
      };
    } else if (decoded.type === 'buyer') {
      req.buyer = {
        buyerId: decoded.buyerId || decoded.id,
        type: 'buyer'
      };
    }
    
    console.log(`✅ [${requestId}] Token auth complete\n`);
    next();
    
  } catch (err) {
    console.log(`❌ [${requestId}] Auth error: ${err.message}`);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token"
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again."
      });
    }
    
    res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Authentication error'
    });
  }
};

console.log('✅ Auth Middleware ready at:', new Date().toISOString());

// ✅ CRITICAL FIX: Export all three middleware functions
module.exports = { 
  verifySeller, 
  verifyBuyer, 
  verifyToken 
};
