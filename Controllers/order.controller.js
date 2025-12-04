// ===================================================================
// Order Controller (order.controller.js)
// ===================================================================
const Order = require("../Models/order.js");
const Seller = require("../Models/seller.model.js");

// -------------------------------------------------------------------
// Create a new order
// -------------------------------------------------------------------
exports.createOrder = async (req, res) => {
  console.log("🚀 Starting createOrder function");
  console.log("📨 Request body:", JSON.stringify(req.body, null, 2));

  try {
    const { buyerId, items, totalAmount, prescriptionImage, location } = req.body;
    const io = req.app.get("io"); // ✅ get io instance

    // Extract coordinates
    let longitude, latitude;
    if (location?.coordinates && Array.isArray(location.coordinates)) {
      [longitude, latitude] = location.coordinates;
    } else if (location?.longitude && location?.latitude) {
      longitude = location.longitude;
      latitude = location.latitude;
    } else {
      throw new Error("Invalid location format: must be [lon, lat] or object {longitude, latitude}");
    }

    if (typeof longitude !== "number" || typeof latitude !== "number") {
      throw new Error("Invalid coordinates: longitude and latitude must be numbers");
    }

    // Find nearby sellers
    const allSellers = await Seller.find({
      isAcceptingOrders: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: 100000, // 1 km radius
        },
      },
    });

    console.log(`🏪 Found ${allSellers.length} sellers nearby`);

    // Create order
    const newOrder = new Order({
      buyerId,
      items,
      totalAmount,
      prescriptionImage,
      location,
      status: "pending",
    });
    await newOrder.save();
    console.log("✅ Order saved to DB:", newOrder._id);

    // Notify sellers
    if (allSellers.length > 0) {
      allSellers.forEach((seller) => {
        console.log(`📤 Sending newOrder to seller_${seller._id}`);
        io.to(`seller_${seller._id}`).emit("newOrder", newOrder);
      });
    } else {
      console.log("⚠️ No nearby sellers found to notify");
    }

    res.status(201).json({
      message: "Order placed successfully",
      order: newOrder,
      sellersFound: allSellers.length,
    });
  } catch (error) {
    console.error("❌ Error in createOrder:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------------------------------------------------------
// Get all orders (for debugging / admin use)
// -------------------------------------------------------------------
exports.getOrders = async (req, res) => {
  try {
    console.log("📥 Fetching all orders...");
    const orders = await Order.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${orders.length} orders`);
    res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Error in getOrders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------------------------------------------------------
// Get all orders by buyer
// -------------------------------------------------------------------
exports.getOrdersByBuyer = async (req, res) => {
  try {
    const buyerId = req.params.buyerId;
    console.log(`📥 Fetching orders for buyer: ${buyerId}`);
    const orders = await Order.find({ buyerId }).sort({ createdAt: -1 });
    console.log(`✅ Found ${orders.length} orders for buyer`);
    res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Error in getOrdersByBuyer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------------------------------------------------------
// Get single order
// -------------------------------------------------------------------
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log(`📥 Fetching order by ID: ${orderId}`);
    const order = await Order.findById(orderId);

    if (!order) {
      console.log("⚠️ Order not found");
      return res.status(404).json({ message: "Order not found" });
    }
    console.log("✅ Order found:", order._id);
    res.status(200).json(order);
  } catch (error) {
    console.error("❌ Error in getOrderById:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------------------------------------------------------
// Seller responds to order (accept/reject)
// -------------------------------------------------------------------
exports.sellerRespondToOrder = async (req, res) => {
  try {
    console.log('\n📦 ========================================');
    console.log('📦 SELLER RESPOND TO ORDER');
    console.log('📦 ========================================');
    console.log('⏰ Request time:', new Date().toISOString());
    console.log('🆔 Order ID from params:', req.params.orderId);
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔐 Authenticated seller from middleware:', req.seller);
    console.log('📋 Request headers:', Object.keys(req.headers));

    const { orderId } = req.params;
    const { action, status } = req.body; // Accept both 'action' and 'status'
    const io = req.app.get("io");

    // ✅ Get seller ID from authenticated middleware (not from body)
    const sellerId = req.seller?.sellerId || req.seller?.id || req.body.sellerId;
    
    console.log('🔍 Seller ID resolved to:', sellerId);

    // Validate seller authentication
    if (!sellerId) {
      console.log('❌ No seller ID found in request');
      return res.status(401).json({ 
        success: false,
        message: "Authentication required - no seller ID" 
      });
    }

    // Validate action
    const finalAction = action || (status === 'accepted' ? 'accept' : status === 'rejected' ? 'reject' : null);
    
    console.log('🔍 Action validation:', {
      receivedAction: action,
      receivedStatus: status,
      finalAction: finalAction
    });

    if (!finalAction || !["accept", "reject"].includes(finalAction)) {
      console.log('❌ Invalid action:', { action, status, finalAction });
      return res.status(400).json({ 
        success: false,
        message: "Invalid action. Expected 'accept' or 'reject'" 
      });
    }

    console.log(`📥 Seller ${sellerId} responding to order ${orderId} with action: ${finalAction}`);

    // Find order
    console.log('🔍 Finding order...');
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('❌ Order not found');
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    console.log('✅ Order found:', {
      orderId: order._id,
      currentStatus: order.status,
      buyer: order.buyerId || order.buyer,
      currentSeller: order.sellerId || order.seller
    });

    // Check if order is still pending
    if (order.status !== 'pending') {
      console.log('❌ Order already processed:', order.status);
      return res.status(400).json({
        success: false,
        message: `Order is already ${order.status}. Cannot modify.`
      });
    }

    // Update order
    const newStatus = finalAction === "accept" ? "accepted" : "rejected";
    order.status = newStatus;
    order.sellerId = sellerId;
    order.seller = sellerId;
    order.respondedAt = new Date();
    
    await order.save();

    console.log(`✅ Order ${orderId} updated to ${order.status}`);

    // Notify buyer about decision via Socket.IO (if available)
    if (io) {
      const buyerId = order.buyerId || order.buyer;
      console.log('📡 Emitting socket event to buyer:', buyerId);
      
      io.to(`buyer_${buyerId}`).emit("orderResponse", {
        orderId,
        status: order.status,
        sellerId: sellerId,
        timestamp: new Date()
      });
      
      console.log('✅ Socket notification sent');
    } else {
      console.log('⚠️ Socket.IO not available, skipping real-time notification');
    }

    console.log('📤 Sending success response');
    res.status(200).json({ 
      success: true,
      message: `Order ${newStatus} successfully`, 
      order: order,
      orderId: order._id,
      status: order.status
    });

    console.log('📦 ========================================\n');

  } catch (error) {
    console.error('❌ ========================================');
    console.error('❌ ERROR IN SELLER RESPOND TO ORDER');
    console.error('❌ ========================================');
    console.error('💥 Error name:', error.name);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};
