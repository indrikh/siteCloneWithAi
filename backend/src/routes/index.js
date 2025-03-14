const express = require('express');
const router = express.Router();

// Import route modules
const chatRoutes = require('./chat');
const contentRoutes = require('./content');
const userRoutes = require('./user');

// Middleware to check API health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register route modules
router.use('/chat', chatRoutes);
router.use('/content', contentRoutes);
router.use('/user', userRoutes);

// Handle 404 for API routes
router.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

module.exports = router;
