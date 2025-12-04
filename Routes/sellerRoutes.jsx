const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/seller.controller');
const authSeller = require('../middlewares/authSeller');

// Existing routes for admin


// New routes for sellers to manage their own profile
router.get('/profile', authSeller, sellerController.getSellerProfile);
router.put('/profile', authSeller, sellerController.updateSellerProfile);

// Registration and login (no auth needed)
router.post('/register', sellerController.registerSeller);
router.post('/login', sellerController.loginSeller);

module.exports = router;