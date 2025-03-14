const express = require('express');
const router = express.Router();
const Joi = require('joi');
const logger = require('../utils/logger');
const crypto = require('crypto');

// User Schema Validation
const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Helper function to hash passwords
const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash: hashedPassword, salt };
};

// Helper function to verify passwords
const verifyPassword = (password, hash, salt) => {
  const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === hashedPassword;
};

// Helper function to generate token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Register a new user
router.post('/register', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    
    const { username, email, password } = value;
    const redis = req.app.locals.redis;
    
    // Check if email already exists
    const emailExists = await redis.exists(`user:email:${email}`);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }
    
    // Check if username already exists
    const usernameExists = await redis.exists(`user:username:${username}`);
    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: 'Username already taken',
      });
    }
    
    // Hash password
    const { hash, salt } = hashPassword(password);
    const userId = crypto.randomUUID();
    
    // Create user in Redis
    const user = {
      id: userId,
      username,
      email,
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Store user in Redis
    await redis.set(`user:${userId}`, JSON.stringify(user));
    await redis.set(`user:email:${email}`, userId);
    await redis.set(`user:username:${username}`, userId);
    
    // Generate token
    const token = generateToken();
    await redis.set(`token:${token}`, userId, 'EX', 86400); // 24 hours
    
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        username,
        email,
      },
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error during registration',
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    
    const { email, password } = value;
    const redis = req.app.locals.redis;
    
    // Get user ID by email
    const userId = await redis.get(`user:email:${email}`);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
    
    // Get user data
    const userData = await redis.get(`user:${userId}`);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    const user = JSON.parse(userData);
    
    // Verify password
    if (!verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
    
    // Generate token
    const token = generateToken();
    await redis.set(`token:${token}`, userId, 'EX', 86400); // 24 hours
    
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error during login',
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }
    
    const redis = req.app.locals.redis;
    
    // Get user ID from token
    const userId = await redis.get(`token:${token}`);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
    
    // Get user data
    const userData = await redis.get(`user:${userId}`);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    const user = JSON.parse(userData);
    
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error(`Profile retrieval error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving profile',
    });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }
    
    const redis = req.app.locals.redis;
    
    // Delete token
    await redis.del(`token:${token}`);
    
    return res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error during logout',
    });
  }
});

module.exports = router;
