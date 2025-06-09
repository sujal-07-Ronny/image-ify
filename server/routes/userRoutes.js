import express from "express";
import { 
  registerUser, 
  loginUser, 
  userCredits, 
  paymentRazorpay,
  verifyPayment,
  getCurrentUser // Add this import
} from "../controllers/userController.js";
import userAuth from "../middlewares/auth.js";

const router = express.Router();

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected Routes
router.get('/credits', userAuth, userCredits);
router.get('/me', userAuth, getCurrentUser);
router.post('/pay-razor', userAuth, paymentRazorpay);
router.post('/verify-payment', userAuth, verifyPayment);

export default router;