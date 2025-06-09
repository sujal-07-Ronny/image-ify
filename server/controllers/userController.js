import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import razorpay from 'razorpay';
import transactionModel from "../models/transactionModel.js";

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Get User Credits
const userCredits = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    res.status(200).json({
      success: true,
      credits: req.user.creditBalance || 0,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error("Credits Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching credits",
    });
  }
};

// Get Current User Info
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.creditBalance || 0
      }
    });
  } catch (error) {
    console.error("Get Current User Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user info"
    });
  }
};
// Razorpay Payment Handler
const paymentRazorpay = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user._id;

    const plans = {
      'Basic': { credits: 100, amount: 10 },
      'Advanced': { credits: 500, amount: 50 },
      'Business': { credits: 5000, amount: 250 }
    };

    const plan = plans[planId];
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected",
      });
    }

    const transaction = await transactionModel.create({
      user: userId,
      plan: planId,
      amount: plan.amount,
      credits: plan.credits,
      status: 'pending'
    });

    const options = {
      amount: plan.amount * 100,
      currency: 'INR',
      receipt: transaction._id.toString(),
    };

    const order = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
    });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Payment processing failed",
    });
  }
};

// Verify Payment
const verifyPayment = async (req, res) => {
  try {
    const { response } = req.body;
    const userId = req.user._id;

    // Verify payment with Razorpay
    const payment = await razorpayInstance.payments.fetch(response.razorpay_payment_id);
    
    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: "Payment not captured",
      });
    }

    // Find and update transaction
    const transaction = await transactionModel.findOneAndUpdate(
      { _id: payment.receipt, user: userId },
      { status: 'completed' },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Update user credits
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $inc: { creditBalance: transaction.credits } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      credits: updatedUser.creditBalance,
    });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
};

export {
  registerUser,
  loginUser,
  userCredits,
  getCurrentUser, // Make sure this is exported
  paymentRazorpay,
  verifyPayment
};