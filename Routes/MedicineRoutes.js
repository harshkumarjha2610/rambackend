const express = require('express');
const router = express.Router();
const { getAllMedicines, searchMedicines } = require('../Controllers/medicine.controller');

console.log('📋 MedicineRoutes.js - Starting route file initialization');
console.log('✅ Express router created');
console.log('✅ Medicine controller functions imported:', { getAllMedicines, searchMedicines });

// Middleware to log all requests to medicine routes
router.use((req, res, next) => {
  console.log('🔍 Medicine Route Middleware - Request received');
  console.log('Request details:', {
    method: req.method,
    originalUrl: req.originalUrl,
    path: req.path,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString()
  });
  console.log('Headers:', req.headers);
  next();
});

// Get all medicines route
router.get('/medicines', (req, res, next) => {
  console.log('📍 GET /medicines route hit');
  console.log('Route parameters:', req.params);
  console.log('Query parameters:', req.query);
  console.log('Calling getAllMedicines controller...');
  
  // Call the controller and log the result
  getAllMedicines(req, res).then(() => {
    console.log('✅ getAllMedicines controller completed successfully');
  }).catch((error) => {
    console.error('❌ getAllMedicines controller failed:', error);
    next(error);
  });
});

// Search medicines route
router.get('/medicines/search', (req, res, next) => {
  console.log('📍 GET /medicines/search route hit');
  console.log('Route parameters:', req.params);
  console.log('Query parameters:', req.query);
  console.log('Search query value:', req.query.query);
  console.log('Calling searchMedicines controller...');
  
  // Call the controller and log the result
  searchMedicines(req, res).then(() => {
    console.log('✅ searchMedicines controller completed successfully');
  }).catch((error) => {
    console.error('❌ searchMedicines controller failed:', error);
    next(error);
  });
});

// Error handling middleware for medicine routes
router.use((error, req, res, next) => {
  console.error('🚨 Medicine Routes Error Handler triggered');
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error in medicine routes',
    message: error.message
  });
});

console.log('📋 Medicine routes configured:');
console.log('  - GET /medicines (getAllMedicines)');
console.log('  - GET /medicines/search (searchMedicines)');
console.log('✅ MedicineRoutes.js - Route file initialization completed');

module.exports = router;
