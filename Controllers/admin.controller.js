const Seller = require("../Models/seller.model");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

console.log('🔧 Seller controller loaded at:', new Date().toISOString());

// Helper to generate JWT token
const generateToken = (sellerId, type = "seller") => {
  console.log('🎫 Generating JWT token for:', { sellerId, type });
  const token = jwt.sign({ sellerId, type }, process.env.JWT_SECRET, { expiresIn: "7d" });
  console.log('✅ Token generated successfully, length:', token.length);
  return token;
};

// ✅ Register Seller
exports.registerSeller = async (req, res) => {
  try {
    console.log('\n🚀 === SELLER REGISTRATION STARTED ===');
    console.log('📦 Request body received:', JSON.stringify(req.body, null, 2));
    console.log('📋 Request headers:', req.headers);
    
    const {
      ownerName,
      pharmacyName,
      email,
      mobile,
      password,
      gstNumber,
      drugLicense1,
      drugLicense2,
      location,
      discount,
    } = req.body;

    console.log('🔍 Validating required fields...');
    console.log('📝 Field check:', {
      ownerName: !!ownerName,
      pharmacyName: !!pharmacyName,
      email: !!email,
      mobile: !!mobile,
      password: !!password,
      gstNumber: !!gstNumber,
      drugLicense1: !!drugLicense1,
      drugLicense2: !!drugLicense2,
      location: !!location,
      discount: !!discount
    });

    // ✅ UPDATED: Only email and password are required
    if (!email || !password) {
      console.log('❌ Missing required fields: email or password');
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }
    console.log('✅ Required fields present (email and password)');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }

    // Validate password length
    if (password.length < 6) {
      console.log('❌ Password too short');
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Check for existing seller - build query dynamically
    console.log('🔍 Checking for existing seller...');
    const existingQuery = [];
    existingQuery.push({ email });
    if (mobile) existingQuery.push({ mobile });
    if (gstNumber) existingQuery.push({ gstNumber });
    
    console.log('🔍 Checking fields:', { 
      email, 
      mobile: mobile || 'not provided', 
      gstNumber: gstNumber || 'not provided' 
    });
    
    const existingSeller = await Seller.findOne({ $or: existingQuery });
    
    if (existingSeller) {
      console.log('❌ Existing seller found:', {
        existingEmail: existingSeller.email,
        existingMobile: existingSeller.mobile || 'N/A',
        existingGST: existingSeller.gstNumber || 'N/A'
      });
      
      // Provide specific error message
      let errorMessage = "An account already exists with this ";
      if (existingSeller.email === email) errorMessage += "email";
      else if (mobile && existingSeller.mobile === mobile) errorMessage += "mobile number";
      else if (gstNumber && existingSeller.gstNumber === gstNumber) errorMessage += "GST number";
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }
    console.log('✅ No existing seller found - all fields are unique');

    // Hash password
    console.log('🔐 Hashing password...');
    console.log('📝 Original password length:', password.length);
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully, hash length:', hashedPassword.length);
    console.log('🔐 Hash starts with:', hashedPassword.substring(0, 10));

    // Create new seller with only provided fields
    console.log('📝 Creating new seller document with provided fields...');
    const sellerData = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      verificationStatus: "pending",
      isVerified: false,
    };

    // Add optional fields only if they were provided
    if (ownerName) {
      sellerData.ownerName = ownerName.trim();
      console.log('✅ Owner name provided:', ownerName);
    }
    if (pharmacyName) {
      sellerData.pharmacyName = pharmacyName.trim();
      console.log('✅ Pharmacy name provided:', pharmacyName);
    }
    if (mobile) {
      sellerData.mobile = mobile.trim();
      console.log('✅ Mobile provided:', mobile);
    }
    if (gstNumber) {
      sellerData.gstNumber = gstNumber.toUpperCase().trim();
      console.log('✅ GST number provided:', gstNumber);
    }
    if (drugLicense1) {
      sellerData.drugLicense1 = drugLicense1.trim();
      console.log('✅ Drug License 1 provided');
    }
    if (drugLicense2) {
      sellerData.drugLicense2 = drugLicense2.trim();
      console.log('✅ Drug License 2 provided');
    }
    if (location) {
      sellerData.location = location.trim();
      console.log('✅ Location provided:', location);
    }
    if (discount) {
      sellerData.discount = discount;
      console.log('✅ Discount provided:', discount + '%');
    }

    console.log('📝 Final seller data:', {
      email: sellerData.email,
      ownerName: sellerData.ownerName || 'Not provided',
      pharmacyName: sellerData.pharmacyName || 'Not provided',
      mobile: sellerData.mobile || 'Not provided',
      gstNumber: sellerData.gstNumber || 'Not provided',
      drugLicense1: sellerData.drugLicense1 || 'Not provided',
      drugLicense2: sellerData.drugLicense2 || 'Not provided',
      location: sellerData.location || 'Not provided',
      discount: sellerData.discount || 'Not provided',
      hasPassword: !!sellerData.password
    });

    const seller = new Seller(sellerData);

    console.log('💾 Saving seller to database...');
    await seller.save();
    console.log("✅ Seller registered successfully:", { 
      id: seller._id, 
      pharmacyName: seller.pharmacyName || 'Not provided',
      email: seller.email,
      verificationStatus: seller.verificationStatus 
    });

    res.status(201).json({
      success: true,
      message: "Seller registered successfully. Awaiting admin approval.",
      seller: { ...seller._doc, password: undefined },
    });
    console.log('📤 Registration response sent successfully');

  } catch (err) {
    console.error("🔥 ERROR in registerSeller:", err.message);
    console.error("📋 Error stack:", err.stack);
    console.error("📦 Error details:", {
      name: err.name,
      code: err.code,
      keyPattern: err.keyPattern,
      keyValue: err.keyValue
    });
    
    // Handle duplicate key errors from MongoDB
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        message: `This ${field} is already registered` 
      });
    }
    
    res.status(500).json({ success: false, message: err.message });
  }
};


// ✅ Login Seller (Enhanced Debug Version)
exports.loginSeller = async (req, res) => {
  try {
    console.log('\n🚀 === SELLER LOGIN CONTROLLER DEBUG ===');
    console.log('⏰ Login attempt at:', new Date().toISOString());
    console.log('📧 Request body:', req.body);
    console.log('📧 Requested email:', req.body.email);
    console.log('📧 Email type:', typeof req.body.email);
    console.log('🔐 Password provided:', !!req.body.password);
    console.log('🔐 Password length:', req.body.password?.length || 0);
    console.log('🌐 Request IP:', req.ip);
    console.log('📋 Request headers:', req.headers);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Missing email or password');
      console.log('📧 Email present:', !!email);
      console.log('🔐 Password present:', !!password);
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const searchEmail = email.toLowerCase().trim();
    console.log('🔍 Normalized search email:', searchEmail);
    
    // Add multiple search attempts to debug
    console.log('📊 Database search attempts starting...');
    
    // Search 1: Exact match
    console.log('🔍 Search 1: Exact match...');
    const seller1 = await Seller.findOne({ email: searchEmail }).select("+password");
    console.log('🔍 Search 1 (exact):', seller1 ? 'FOUND' : 'NOT FOUND');
    if (seller1) {
      console.log('📋 Seller 1 details:', {
        id: seller1._id,
        email: seller1.email,
        hasPassword: !!seller1.password
      });
    }
    
    // Search 2: Case insensitive regex
    console.log('🔍 Search 2: Case insensitive regex...');
    const seller2 = await Seller.findOne({ 
      email: { $regex: new RegExp(`^${searchEmail}$`, 'i') } 
    }).select("+password");
    console.log('🔍 Search 2 (regex):', seller2 ? 'FOUND' : 'NOT FOUND');
    if (seller2) {
      console.log('📋 Seller 2 details:', {
        id: seller2._id,
        email: seller2.email,
        hasPassword: !!seller2.password
      });
    }
    
    // Search 3: All sellers with similar email (for debugging)
    console.log('🔍 Search 3: Finding similar emails for debugging...');
    const similarSellers = await Seller.find({ 
      email: { $regex: new RegExp(searchEmail.split('@')[0], 'i') } 
    }).select('email');
    console.log('🔍 Similar emails found:', similarSellers.length);
    console.log('📧 Similar email addresses:', similarSellers.map(s => s.email));
    
    const seller = seller1 || seller2;
    
    if (!seller) {
      console.log('❌ Seller not found in database with any search method');
      console.log('📊 Total sellers in database:', await Seller.countDocuments());
      
      // List first few sellers for debugging (be careful in production)
      const allSellers = await Seller.find({}).select('email').limit(5);
      console.log('📊 Sample sellers (first 5):', allSellers.map(s => s.email));
      
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    console.log('✅ Seller found successfully!');
    console.log('📋 Seller details:', {
      id: seller._id,
      email: seller.email,
      pharmacyName: seller.pharmacyName,
      ownerName: seller.ownerName,
      hasPassword: !!seller.password,
      passwordLength: seller.password?.length || 0,
      isVerified: seller.isVerified,
      verificationStatus: seller.verificationStatus,
      createdAt: seller.createdAt
    });
    
    // Password comparison debug
    console.log('🔐 Starting password comparison...');
    console.log('🔐 Provided password length:', password.length);
    console.log('🔐 Stored password hash length:', seller.password?.length || 0);
    console.log('🔐 Stored password starts with:', seller.password?.substring(0, 10) || 'None');
    console.log('🔐 Stored password ends with:', seller.password?.substring(seller.password.length - 10) || 'None');
    
    console.log('🔐 Calling bcrypt.compare...');
    const isValidPassword = await bcrypt.compare(password, seller.password);
    console.log('🔐 Password comparison result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password - bcrypt comparison failed');
      // Test with plain text (DON'T DO THIS IN PRODUCTION)
      if (password === seller.password) {
        console.log('⚠️  WARNING: Password stored as plain text!');
      }
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    console.log('✅ Password validation successful');

    // Check verification status
    console.log('🔍 Checking seller verification status...');
    console.log('📋 Verification details:', {
      isVerified: seller.isVerified,
      verificationStatus: seller.verificationStatus
    });
    
    if (!seller.isVerified || seller.verificationStatus !== "approved") {
      console.log('❌ Account not verified/approved');
      return res.status(403).json({
        success: false,
        message: `Account is ${seller.verificationStatus}. Please wait for admin approval.`,
      });
    }
    console.log('✅ Account verification check passed');
    
    // Continue with token creation...
    console.log('🎫 Creating JWT token...');
    
    const tokenPayload = {
      sellerId: seller._id,
      type: 'seller',
      email: seller.email,
      pharmacyName: seller.pharmacyName
    };
    console.log('📋 Token payload:', tokenPayload);
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✅ Token created successfully');
    console.log('🔑 Token length:', token.length);
    console.log('🔑 Token starts with:', token.substring(0, 20) + '...');
    
    const responseData = {
      success: true,
      message: "Login successful",
      token,
      seller: {
        _id: seller._id,
        ownerName: seller.ownerName,
        pharmacyName: seller.pharmacyName,
        email: seller.email,
        mobile: seller.mobile,
        isVerified: seller.isVerified,
        verificationStatus: seller.verificationStatus
      }
    };
    
    console.log('📤 Sending login response...');
    console.log('📋 Response structure:', {
      success: responseData.success,
      message: responseData.message,
      tokenLength: responseData.token.length,
      sellerId: responseData.seller._id
    });
    
    res.json(responseData);
    console.log('✅ Login process completed successfully');
    
  } catch (error) {
    console.error('❌ LOGIN CONTROLLER ERROR:');
    console.error('📋 Error name:', error.name);
    console.error('📋 Error message:', error.message);
    console.error('📋 Error stack:', error.stack);
    console.error('📋 Error code:', error.code);
    
    if (error.name === 'MongoError') {
      console.error('🗄️ MongoDB Error details:', {
        code: error.code,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login process',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ✅ Get Seller Profile
exports.getSellerProfile = async (req, res) => {
  try {
    console.log('\n👤 ========================================');
    console.log('👤 GET SELLER PROFILE STARTED');
    console.log('👤 ========================================');
    console.log('⏰ Request time:', new Date().toISOString());
    console.log('🔐 req.seller object:', JSON.stringify(req.seller, null, 2));
    console.log('🔐 Authenticated seller ID from token:', req.seller?.sellerId);
    console.log('🔐 Seller type from token:', req.seller?.type);
    console.log('🔐 Seller email from token:', req.seller?.email);
    console.log('🌐 Request IP:', req.ip);
    console.log('📋 Request method:', req.method);
    console.log('📋 Request URL:', req.originalUrl);
    console.log('🔑 Authorization header:', req.headers.authorization ? 'Present' : 'Missing');

    // ✅ FIXED: Check if req.seller exists and has sellerId
    if (!req.seller) {
      console.log('❌ req.seller is null or undefined');
      return res.status(401).json({
        success: false,
        message: "Authentication required - no seller data in request"
      });
    }

    if (!req.seller.sellerId) {
      console.log('❌ req.seller.sellerId is null or undefined');
      console.log('📋 Available properties on req.seller:', Object.keys(req.seller));
      return res.status(401).json({
        success: false,
        message: "Authentication required - no seller ID in token"
      });
    }

    const sellerId = req.seller.sellerId;
    console.log("🔍 Fetching seller from database for ID:", sellerId);
    console.log("🔍 Seller ID type:", typeof sellerId);
    console.log("🔍 Seller ID length:", sellerId?.length);

    // ✅ FIXED: Add try-catch for database query
    let seller;
    try {
      seller = await Seller.findById(sellerId)
        .select('-password')
        .lean(); // Convert to plain JavaScript object
      
      console.log("📊 Database query completed");
      console.log("📊 Query result:", seller ? 'Seller found' : 'Seller not found');
    } catch (dbError) {
      console.error('❌ Database query error:', dbError.message);
      console.error('❌ Query error name:', dbError.name);
      console.error('❌ Seller ID causing error:', sellerId);
      throw dbError; // Re-throw to be caught by outer catch
    }

    if (!seller) {
      console.log("❌ Seller not found with ID:", sellerId);
      console.log("🔍 Checking if any sellers exist in database...");
      
      const totalSellers = await Seller.countDocuments();
      console.log("📊 Total sellers in database:", totalSellers);
      
      // Check if seller was deleted
      console.log("🔍 Checking deleted sellers...");
      const deletedSeller = await Seller.findOne({ 
        _id: sellerId, 
        isDeleted: true 
      });
      
      if (deletedSeller) {
        console.log("⚠️ Seller account was deleted");
        return res.status(410).json({
          success: false,
          message: "Seller account has been deleted"
        });
      }
      
      return res.status(404).json({
        success: false,
        message: "Seller not found. Account may have been removed."
      });
    }

    console.log("✅ Seller profile retrieved successfully");
    console.log("📋 Seller profile details:", {
      id: seller._id,
      ownerName: seller.ownerName || 'Not provided',
      pharmacyName: seller.pharmacyName || 'Not provided',
      email: seller.email,
      mobile: seller.mobile || 'Not provided',
      isVerified: seller.isVerified,
      verificationStatus: seller.verificationStatus,
      hasGST: !!seller.gstNumber,
      hasDrugLicense1: !!seller.drugLicense1,
      hasDrugLicense2: !!seller.drugLicense2,
      hasLocation: !!seller.location,
      shopPhotosCount: seller.shopPhotos?.length || 0,
      createdAt: seller.createdAt,
      updatedAt: seller.updatedAt
    });

    res.status(200).json({
      success: true,
      message: "Seller profile retrieved successfully",
      seller: seller
    });
    
    console.log('📤 Profile response sent successfully');
    console.log('👤 ========================================\n');

  } catch (error) {
    console.error("❌ ========================================");
    console.error("❌ ERROR in getSellerProfile");
    console.error("❌ ========================================");
    console.error("💥 Error name:", error.name);
    console.error("💥 Error message:", error.message);
    console.error("💥 Error stack:", error.stack);
    console.error("💥 Error code:", error.code);
    
    // Handle specific error types
    if (error.name === 'CastError') {
      console.error('🗄️ CastError - Invalid seller ID format');
      console.error('🗄️ Invalid ID value:', error.value);
      console.error('🗄️ Expected type:', error.kind);
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID format"
      });
    }
    
    if (error.name === 'ValidationError') {
      console.error('🗄️ ValidationError:', error.errors);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    }

    if (error.name === 'MongooseError') {
      console.error('🗄️ Mongoose error:', error.message);
      return res.status(500).json({
        success: false,
        message: "Database error"
      });
    }
    
    // Generic error response
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${error.message}` 
        : 'Internal server error while fetching profile'
    });
    
    console.error("❌ ========================================\n");
  }
};


// ✅ Update Seller Profile
exports.updateSellerProfile = async (req, res) => {
  try {
    console.log('\n🚀 === UPDATE SELLER PROFILE STARTED ===');
    console.log('⏰ Update request time:', new Date().toISOString());
    console.log("📝 Updating seller profile for ID:", req.seller.sellerId);
    console.log("📦 Update data received:", JSON.stringify(req.body, null, 2));
    console.log('🔐 Authenticated seller:', req.seller);
    
    const { 
      ownerName, 
      pharmacyName, 
      email, 
      mobile, 
      gstNumber, 
      drugLicense1, 
      drugLicense2, 
      location 
    } = req.body;
    
    console.log('📋 Fields to update:', {
      ownerName: !!ownerName,
      pharmacyName: !!pharmacyName,
      email: !!email,
      mobile: !!mobile,
      gstNumber: !!gstNumber,
      drugLicense1: !!drugLicense1,
      drugLicense2: !!drugLicense2,
      location: !!location
    });
    
    // Check if email or mobile already exists for other sellers
    if (email || mobile) {
      console.log('🔍 Checking for duplicate email/mobile...');
      const existingSeller = await Seller.findOne({
        $and: [
          { _id: { $ne: req.seller.sellerId } },
          { $or: [{ email }, { mobile }] }
        ]
      });
      
      if (existingSeller) {
        console.log('❌ Duplicate found:', {
          existingId: existingSeller._id,
          existingEmail: existingSeller.email,
          existingMobile: existingSeller.mobile
        });
        return res.status(400).json({
          success: false,
          message: "Email or mobile number already exists for another seller"
        });
      }
      console.log('✅ No duplicates found');
    }
    
    const updateData = {};
    if (ownerName) updateData.ownerName = ownerName;
    if (pharmacyName) updateData.pharmacyName = pharmacyName;
    if (email) updateData.email = email;
    if (mobile) updateData.mobile = mobile;
    if (gstNumber) updateData.gstNumber = gstNumber;
    if (drugLicense1) updateData.drugLicense1 = drugLicense1;
    if (drugLicense2) updateData.drugLicense2 = drugLicense2;
    if (location) updateData.location = location;
    updateData.updatedAt = new Date();

    console.log('📝 Final update data:', updateData);
    
    console.log('💾 Saving updates to database...');
    const seller = await Seller.findByIdAndUpdate(
      req.seller.sellerId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!seller) {
      console.log("❌ Seller not found with ID:", req.seller.sellerId);
      return res.status(404).json({
        success: false,
        message: "Seller not found"
      });
    }

    console.log("✅ Seller profile updated successfully");
    console.log("📋 Updated seller details:", {
      id: seller._id,
      pharmacyName: seller.pharmacyName,
      email: seller.email,
      mobile: seller.mobile,
      updatedAt: seller.updatedAt
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      seller: seller
    });
    console.log('📤 Update response sent successfully');

  } catch (error) {
    console.error("🔥 ERROR in updateSellerProfile:");
    console.error("📋 Error message:", error.message);
    console.error("📋 Error stack:", error.stack);
    console.error("📋 Error name:", error.name);
    
    if (error.name === 'ValidationError') {
      console.error('📋 Validation errors:', error.errors);
    }
    
    res.status(500).json({
      success: false,
      message: "Internal server error while updating profile",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ✅ Fetch All Sellers
exports.getSellers = async (req, res) => {
  try {
    console.log('\n🚀 === GET ALL SELLERS STARTED ===');
    console.log('⏰ Request time:', new Date().toISOString());
    console.log('📋 Query parameters:', req.query);
    
    const { page = 1, limit = 10, status } = req.query;
    console.log('🔍 Search criteria:', { page, limit, status });
    
    const query = status ? { verificationStatus: status } : {};
    console.log('📝 MongoDB query:', query);
    
    console.log('🗄️ Executing database query...');
    const sellers = await Seller.find(query)
      .select("-password")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Seller.countDocuments(query);
    
    console.log(`✅ Fetched ${sellers.length} sellers (page ${page})`);
    console.log('📊 Total sellers in database:', total);
    console.log('📋 Sellers retrieved:', sellers.map(s => ({
      id: s._id,
      pharmacy: s.pharmacyName,
      status: s.verificationStatus
    })));

    res.json({ 
      success: true, 
      sellers, 
      total, 
      page: parseInt(page), 
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
    console.log('📤 Sellers list response sent');

  } catch (err) {
    console.error("🔥 ERROR in getSellers:");
    console.error("📋 Error message:", err.message);
    console.error("📋 Error stack:", err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Approve Seller
exports.approveSeller = async (req, res) => {
  try {
    console.log('\n🚀 === APPROVE SELLER STARTED ===');
    console.log('⏰ Approval request time:', new Date().toISOString());
    const { id } = req.params;
    console.log("📩 Approve request received for seller ID:", id);
    console.log('👤 Approved by admin (from token):', req.seller?.sellerId);
    console.log('📋 Request params:', req.params);
    console.log('📦 Request body:', req.body);

    // Validate seller ID format
    console.log('🔍 Validating seller ID format...');
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ Invalid seller ID format');
      return res.status(400).json({ 
        success: false, 
        message: "Invalid seller ID format" 
      });
    }
    console.log('✅ Seller ID format valid');

    console.log('🔍 Finding seller in database...');
    const seller = await Seller.findById(id);
    
    if (!seller) {
      console.log("❌ Seller not found with ID:", id);
      return res.status(404).json({ 
        success: false, 
        message: "Seller not found" 
      });
    }
    
    console.log('✅ Seller found:', {
      id: seller._id,
      email: seller.email,
      ownerName: seller.ownerName || 'Not provided',
      pharmacyName: seller.pharmacyName || 'Not provided',
      currentStatus: seller.verificationStatus,
      hasGST: !!seller.gstNumber,
      hasDrugLicense1: !!seller.drugLicense1,
      hasDrugLicense2: !!seller.drugLicense2,
      hasLocation: !!seller.location,
      hasMobile: !!seller.mobile,
    });

    // Check if already approved
    if (seller.verificationStatus === "approved") {
      console.log('⚠️ Seller already approved');
      return res.status(400).json({ 
        success: false, 
        message: "Seller is already approved" 
      });
    }

    // ✅ IMPROVED: Check for missing information but don't block approval
    console.log('📋 Checking seller information completeness...');
    const missingInfo = [];
    if (!seller.ownerName) missingInfo.push('Owner Name');
    if (!seller.pharmacyName) missingInfo.push('Pharmacy Name');
    if (!seller.mobile) missingInfo.push('Mobile Number');
    if (!seller.gstNumber) missingInfo.push('GST Number');
    if (!seller.drugLicense1) missingInfo.push('Drug License 1');
    if (!seller.drugLicense2) missingInfo.push('Drug License 2');
    if (!seller.location) missingInfo.push('Location');
    if (!seller.discount) missingInfo.push('Discount Offer');

    if (missingInfo.length > 0) {
      console.log('⚠️ Warning: Seller has incomplete information:', missingInfo);
      console.log('⚠️ Proceeding with approval anyway (fields are optional)');
    } else {
      console.log('✅ Seller has complete information');
    }

    // ❌ REMOVED: Document verification check
    // Previously blocked approval if documents weren't verified
    // Now allowing approval regardless of document status since fields are optional

    console.log('📝 Updating seller verification status to APPROVED...');
    seller.verificationStatus = "approved";
    seller.isVerified = true;
    seller.verifiedAt = new Date();
    
    // Only set verifiedBy if admin info is available
    if (req.seller?.sellerId) {
      seller.verifiedBy = req.seller.sellerId;
      console.log('👤 Approval recorded by admin:', req.seller.sellerId);
    }
    
    console.log('💾 Saving approved seller to database...');
    await seller.save();

    console.log("✅ Seller approved successfully:", {
      id: seller._id, 
      email: seller.email,
      pharmacyName: seller.pharmacyName || 'Not provided',
      verificationStatus: seller.verificationStatus,
      verifiedAt: seller.verifiedAt,
      missingInfoCount: missingInfo.length,
    });

    // Prepare success response
    const responseData = {
      success: true, 
      message: "Seller approved successfully",
      seller: {
        _id: seller._id,
        email: seller.email,
        ownerName: seller.ownerName || 'Not provided',
        pharmacyName: seller.pharmacyName || 'Not provided',
        mobile: seller.mobile || 'Not provided',
        gstNumber: seller.gstNumber || 'Not provided',
        verificationStatus: seller.verificationStatus,
        isVerified: seller.isVerified,
        verifiedAt: seller.verifiedAt,
      }
    };

    // Add warning if information is incomplete
    if (missingInfo.length > 0) {
      responseData.warning = {
        message: `Seller approved with incomplete information. Missing: ${missingInfo.join(', ')}`,
        missingFields: missingInfo,
      };
      console.log('⚠️ Adding warning to response about missing information');
    }

    res.json(responseData);
    console.log('📤 Approval response sent successfully');
    console.log('🚀 === APPROVE SELLER COMPLETED ===\n');

  } catch (err) {
    console.error("🔥 ERROR in approveSeller:");
    console.error("📋 Error message:", err.message);
    console.error("📋 Error stack:", err.stack);
    console.error("📋 Error name:", err.name);
    console.error("📋 Error code:", err.code);
    
    // Handle specific error types
    if (err.name === 'CastError') {
      console.error("❌ Invalid ID format error");
      return res.status(400).json({ 
        success: false, 
        message: "Invalid seller ID format" 
      });
    }
    
    if (err.name === 'ValidationError') {
      console.error("❌ Mongoose validation error");
      return res.status(400).json({ 
        success: false, 
        message: "Validation error: " + err.message 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: "Failed to approve seller: " + err.message 
    });
    console.log('🚀 === APPROVE SELLER FAILED ===\n');
  }
};


// ✅ Reject Seller
exports.rejectSeller = async (req, res) => {
  try {
    console.log('\n🚀 === REJECT SELLER STARTED ===');
    console.log('⏰ Rejection request time:', new Date().toISOString());
    const { id } = req.params;
    const { notes } = req.body;
    console.log("📩 Reject request received for seller ID:", id);
    console.log('📋 Rejection notes:', notes);
    console.log('👤 Rejected by admin (from token):', req.seller?.sellerId);

    console.log('🔍 Finding seller in database...');
    const seller = await Seller.findById(id);
    if (!seller) {
      console.log("❌ Seller not found with ID:", id);
      return res.status(404).json({ success: false, message: "Seller not found" });
    }
    console.log('✅ Seller found:', {
      id: seller._id,
      pharmacyName: seller.pharmacyName,
      currentStatus: seller.verificationStatus
    });

    console.log('📝 Updating seller verification status to rejected...');
    seller.verificationStatus = "rejected";
    seller.isVerified = false;
    seller.verificationNotes = notes || "Rejected by admin";
    seller.verifiedBy = req.seller?.sellerId;
    
    console.log('💾 Saving rejected seller...');
    await seller.save();

    console.log("🚫 Seller rejected successfully:", {
      id: seller._id, 
      pharmacyName: seller.pharmacyName,
      notes: seller.verificationNotes
    });

    res.json({ 
      success: true, 
      message: "Seller rejected", 
      seller: {
        _id: seller._id,
        pharmacyName: seller.pharmacyName,
        verificationStatus: seller.verificationStatus,
        verificationNotes: seller.verificationNotes
      }
    });
    console.log('📤 Rejection response sent');

  } catch (err) {
    console.error("🔥 ERROR in rejectSeller:");
    console.error("📋 Error message:", err.message);
    console.error("📋 Error stack:", err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Delete Seller
exports.deleteSeller = async (req, res) => {
  try {
    console.log('\n🚀 === DELETE SELLER STARTED ===');
    console.log('⏰ Delete request time:', new Date().toISOString());
    const { id } = req.params;
    console.log("📩 Delete request received for seller ID:", id);
    console.log('👤 Deleted by admin (from token):', req.seller?.sellerId);

    console.log('🔍 Finding and deleting seller...');
    const seller = await Seller.findByIdAndDelete(id);
    if (!seller) {
      console.log("❌ Seller not found with ID:", id);
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    console.log("🗑️ Seller deleted successfully:", {
      id: seller._id, 
      pharmacyName: seller.pharmacyName,
      email: seller.email
    });

    res.json({ 
      success: true, 
      message: "Seller deleted successfully",
      deletedSeller: {
        id: seller._id,
        pharmacyName: seller.pharmacyName,
        email: seller.email
      }
    });
    console.log('📤 Delete response sent');

  } catch (err) {
    console.error("🔥 ERROR in deleteSeller:");
    console.error("📋 Error message:", err.message);
    console.error("📋 Error stack:", err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

console.log('✅ Seller controller with enhanced logging ready at:', new Date().toISOString());