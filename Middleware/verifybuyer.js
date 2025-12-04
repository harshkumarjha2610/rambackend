// Import the jsonwebtoken library for JWT operations
const jwt = require("jsonwebtoken");
// Import the Buyer model to interact with buyer data in database
const Buyer = require("../Models/buyer.model");

// Define an async middleware function to verify buyer authentication
const verifyBuyer = async (req, res, next) => {
  console.log("🔍 [JWT Middleware] Starting buyer verification process");
  console.log("📋 [JWT Middleware] Request headers:", req.headers);
  
  try {
    // Extract the Authorization header from the incoming request
    const authHeader = req.headers.authorization;
    console.log("🔑 [JWT Middleware] Authorization header:", authHeader);
    
    // Check if Authorization header exists and starts with 'Bearer '
    // This is the standard format: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("❌ [JWT Middleware] Missing or invalid authorization header format");
      return res.status(401).json({ 
        success: false,
        message: "Access denied. No token provided or invalid format." 
      });
    }
    console.log("✅ [JWT Middleware] Authorization header format is valid");

    // Split the authorization header by space and get the token part
    // "Bearer abc123token" becomes ["Bearer", "abc123token"]
    // We take index [1] to get just the token
    const token = authHeader.split(' ')[1];
    console.log("🎫 [JWT Middleware] Extracted token:", token ? `${token.substring(0, 20)}...` : 'null');
    
    // Double-check if token exists after splitting
    // (This is somewhat redundant but adds extra safety)
    if (!token) {
      console.log("❌ [JWT Middleware] Token is empty after splitting");
      return res.status(401).json({ 
        success: false,
        message: "Access denied. No token provided." 
      });
    }
    console.log("✅ [JWT Middleware] Token extracted successfully");

    // Verify the JWT token using the secret key from environment variables
    // This will throw an error if token is invalid, expired, or tampered with
    console.log("🔐 [JWT Middleware] Starting JWT verification...");
    console.log("🔑 [JWT Middleware] JWT_SECRET exists:", !!process.env.JWT_SECRET);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ [JWT Middleware] JWT verification successful");
    console.log("📄 [JWT Middleware] Decoded token payload:", {
      id: decoded.id,
      type: decoded.type,
      iat: decoded.iat,
      exp: decoded.exp
    });
    
    // Check if the token type is specifically for 'buyer'
    // This prevents sellers or other user types from accessing buyer routes
    console.log("🏷️ [JWT Middleware] Checking token type:", decoded.type);
    if (decoded.type !== 'buyer') {
      console.log("❌ [JWT Middleware] Invalid token type. Expected 'buyer', got:", decoded.type);
      return res.status(401).json({ 
        success: false,
        message: "Invalid token type." 
      });
    }
    console.log("✅ [JWT Middleware] Token type validation passed");

    // Find the buyer in database using the ID from decoded token
    // .select("-password") excludes the password field from the result
    console.log("🔍 [JWT Middleware] Searching for buyer with ID:", decoded.id);
    const buyer = await Buyer.findById(decoded.id).select("-password");
    console.log("👤 [JWT Middleware] Database query result:", buyer ? "Buyer found" : "Buyer not found");
    
    // Check if buyer actually exists in database
    // Token might be valid but buyer could have been deleted
    if (!buyer) {
      console.log("❌ [JWT Middleware] Buyer not found in database");
      return res.status(401).json({ 
        success: false,
        message: "Invalid token. Buyer not found." 
      });
    }
    console.log("✅ [JWT Middleware] Buyer found in database");
    console.log("👤 [JWT Middleware] Buyer details:", {
      id: buyer._id,
      email: buyer.email,
      isActive: buyer.isActive
    });

    // Check if the buyer account is still active
    // Prevents deactivated accounts from accessing protected routes
    console.log("🔄 [JWT Middleware] Checking buyer account status:", buyer.isActive);
    if (!buyer.isActive) {
      console.log("❌ [JWT Middleware] Buyer account is deactivated");
      return res.status(401).json({ 
        success: false,
        message: "Account has been deactivated." 
      });
    }
    console.log("✅ [JWT Middleware] Buyer account is active");

    // Attach buyer information to request object
    // This makes buyer data available in subsequent middleware/route handlers
    req.buyer = buyer;
    // Also attach the token to request object for potential future use
    req.token = token;
    console.log("📝 [JWT Middleware] Attached buyer and token to request object");
    console.log("🎯 [JWT Middleware] Verification completed successfully, proceeding to next middleware");
    
    // Call next() to proceed to the next middleware or route handler
    next();
    
  } catch (err) {
    // Log the error for debugging purposes
    console.error("💥 [JWT Middleware] Error occurred during verification:");
    console.error("📋 [JWT Middleware] Error name:", err.name);
    console.error("📋 [JWT Middleware] Error message:", err.message);
    console.error("📋 [JWT Middleware] Full error:", err);
    
    // Handle specific JWT error: token has expired
    if (err.name === 'TokenExpiredError') {
      console.log("⏰ [JWT Middleware] Token has expired");
      console.log("📅 [JWT Middleware] Token expired at:", new Date(err.expiredAt));
      return res.status(401).json({ 
        success: false,
        message: "Token has expired." 
      });
    }
    
    // Handle specific JWT error: token is malformed or invalid
    if (err.name === 'JsonWebTokenError') {
      console.log("🚫 [JWT Middleware] Invalid JWT token format or signature");
      return res.status(401).json({ 
        success: false,
        message: "Invalid token." 
      });
    }
    
    // Handle any other unexpected errors during token verification
    console.log("❓ [JWT Middleware] Unknown error during token verification");
    return res.status(401).json({ 
      success: false,
      message: "Token verification failed." 
    });
  }
};

// Export the middleware function to be used in other files
module.exports = verifyBuyer;
