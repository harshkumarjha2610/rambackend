const Buyer = require("../Models/buyer.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const rateLimit = require("express-rate-limit");

// Input validation helper
const validateRegistrationInput = (name, email, password, mobile) => {
  const errors = [];
  
  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }
  
  if (!email || !validator.isEmail(email)) {
    errors.push("Please provide a valid email address");
  }
  
  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)) {
    errors.push("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
  }
  
  if (mobile && !validator.isMobilePhone(mobile, 'en-IN')) {
    errors.push("Please provide a valid mobile number");
  }
  
  return errors;
};

const validateLoginInput = (email, password) => {
  const errors = [];
  
  if (!email || !validator.isEmail(email)) {
    errors.push("Please provide a valid email address");
  }
  
  if (!password) {
    errors.push("Password is required");
  }
  
  return errors;
};

// Register Buyer
exports.registerBuyer = async (req, res) => {
  try {
    const { name, email, password, mobile, address, pincode } = req.body;

    // Validate input
    const validationErrors = validateRegistrationInput(name, email, password, mobile);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationErrors 
      });
    }

    // Check if buyer already exists
    const existingBuyer = await Buyer.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        ...(mobile ? [{ mobile }] : [])
      ]
    });

    if (existingBuyer) {
      if (existingBuyer.email === email.toLowerCase()) {
        return res.status(409).json({ message: "Email already registered" });
      }
      if (existingBuyer.mobile === mobile) {
        return res.status(409).json({ message: "Mobile number already registered" });
      }
    }

    // Hash password with higher salt rounds
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new buyer
    const buyer = new Buyer({
      name: name.trim(),
      email: email.toLowerCase(),
      mobile: mobile || null,
      password: hashedPassword,
      address: address || null,
      pincode: pincode || null,
    });

    // Save buyer to DB
    await buyer.save();

    // Generate JWT with shorter expiry for security
    const token = jwt.sign(
      { 
        id: buyer._id,
        email: buyer.email,
        type: 'buyer'
      }, 
      process.env.JWT_SECRET, 
      {
        expiresIn: "24h",
      }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: buyer._id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send response (exclude password)
    res.status(201).json({
      success: true,
      message: "Buyer registered successfully",
      data: {
        buyer: {
          id: buyer._id,
          name: buyer.name,
          email: buyer.email,
          mobile: buyer.mobile,
          address: buyer.address,
          pincode: buyer.pincode,
          createdAt: buyer.createdAt
        },
        token,
        refreshToken
      }
    });

  } catch (err) {
    console.error("Error in registerBuyer:", err);
    
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ 
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Internal server error", 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Login Buyer
exports.loginBuyer = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Validate input
    const validationErrors = validateLoginInput(email, password);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationErrors 
      });
    }

    // Find buyer by email (case-insensitive)
    const buyer = await Buyer.findOne({ 
      email: email.toLowerCase() 
    }).select('+password');

    if (!buyer) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, buyer.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Update last login
    buyer.lastLogin = new Date();
    await buyer.save();

    // Generate JWT
    const tokenExpiry = rememberMe ? "7d" : "24h";
    const token = jwt.sign(
      { 
        id: buyer._id,
        email: buyer.email,
        type: 'buyer'
      }, 
      process.env.JWT_SECRET, 
      {
        expiresIn: tokenExpiry,
      }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: buyer._id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Send response (exclude password)
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        buyer: {
          id: buyer._id,
          name: buyer.name,
          email: buyer.email,
          mobile: buyer.mobile,
          address: buyer.address,
          pincode: buyer.pincode,
          lastLogin: buyer.lastLogin
        },
        token,
        refreshToken,
        expiresIn: tokenExpiry
      }
    });

  } catch (err) {
    console.error("Error in loginBuyer:", err);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get Buyer Profile
exports.getBuyerProfile = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.buyer.id).select("-password");
    
    if (!buyer) {
      return res.status(404).json({ 
        success: false,
        message: "Buyer not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      data: { buyer } 
    });
  } catch (err) {
    console.error("Error in getBuyerProfile:", err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching profile", 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Update Buyer Profile
exports.updateBuyerProfile = async (req, res) => {
  try {
    const { name, mobile, address, pincode } = req.body;
    const buyerId = req.buyer.id;

    // Validate input
    const updates = {};
    
    if (name) {
      if (name.trim().length < 2) {
        return res.status(400).json({ 
          success: false,
          message: "Name must be at least 2 characters long" 
        });
      }
      updates.name = name.trim();
    }
    
    if (mobile) {
      if (!validator.isMobilePhone(mobile, 'en-IN')) {
        return res.status(400).json({ 
          success: false,
          message: "Please provide a valid mobile number" 
        });
      }
      
      // Check if mobile is already taken by another buyer
      const existingBuyer = await Buyer.findOne({ 
        mobile, 
        _id: { $ne: buyerId } 
      });
      
      if (existingBuyer) {
        return res.status(409).json({ 
          success: false,
          message: "Mobile number already registered" 
        });
      }
      
      updates.mobile = mobile;
    }
    
    if (address) updates.address = address.trim();
    if (pincode) updates.pincode = pincode.trim();

    updates.updatedAt = new Date();

    const buyer = await Buyer.findByIdAndUpdate(
      buyerId,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!buyer) {
      return res.status(404).json({ 
        success: false,
        message: "Buyer not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { buyer }
    });

  } catch (err) {
    console.error("Error in updateBuyerProfile:", err);
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ 
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error updating profile",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        success: false,
        message: "Refresh token required" 
      });
    }

    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ 
        success: false,
        message: "Invalid refresh token" 
      });
    }

    const buyer = await Buyer.findById(decoded.id).select("-password");
    if (!buyer) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid refresh token" 
      });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { 
        id: buyer._id,
        email: buyer.email,
        type: 'buyer'
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        buyer: {
          id: buyer._id,
          name: buyer.name,
          email: buyer.email,
          mobile: buyer.mobile
        }
      }
    });

  } catch (err) {
    console.error("Error in refreshToken:", err);
    res.status(401).json({ 
      success: false,
      message: "Invalid or expired refresh token" 
    });
  }
};

// Logout (optional - for token blacklisting)
exports.logoutBuyer = async (req, res) => {
  try {
    // Here you could implement token blacklisting if needed
    // For now, we'll just send a success response
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    console.error("Error in logoutBuyer:", err);
    res.status(500).json({ 
      success: false,
      message: "Error logging out" 
    });
  }
};
