const express = require('express');
const router = express.Router();
const Joi = require('joi');
const logger = require('../utils/logger');

// Message validation schema
const messageSchema = Joi.object({
  message: Joi.string().required().min(1).max(1000),
  sessionId: Joi.string().required(),
  userId: Joi.string().allow(null, ''),
});

// Helper function to get chat history from Redis
const getChatHistory = async (redis, sessionId, limit = 10) => {
  try {
    const historyKey = `chat:history:${sessionId}`;
    const history = await redis.lrange(historyKey, 0, limit - 1);
    return history.map(item => JSON.parse(item)).reverse();
  } catch (error) {
    logger.error(`Error retrieving chat history: ${error.message}`);
    return [];
  }
};

// Save message to chat history
const saveChatMessage = async (redis, sessionId, role, content) => {
  try {
    const historyKey = `chat:history:${sessionId}`;
    const message = JSON.stringify({
      role,
      content,
      timestamp: new Date().toISOString(),
    });
    
    await redis.lpush(historyKey, message);
    await redis.ltrim(historyKey, 0, 49); // Keep last 50 messages
    
    // Set TTL for session (24 hours)
    await redis.expire(historyKey, 86400);
    
    return true;
  } catch (error) {
    logger.error(`Error saving chat message: ${error.message}`);
    return false;
  }
};

// POST /api/chat/message - Send a message to the AI assistant
router.post('/message', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = messageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    
    const { message, sessionId } = value;
    const redis = req.app.locals.redis;
    const openai = req.app.locals.openai;
    
    // Save user message to history
    await saveChatMessage(redis, sessionId, 'user', message);
    
    // Get chat history
    const history = await getChatHistory(redis, sessionId);
    
    // Create messages for OpenAI
    const messages = history.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // Add system message if it's not already in the history
    if (!messages.some(msg => msg.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: 'You are a helpful assistant for a gaming community site similar to Majestic RP. You can provide information about the game, community features, and help with common questions. Be friendly and concise.'
      });
    }
    
    // Send request to OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages,
      max_tokens: 1000,
    });
    
    const aiResponse = completion.choices[0].message.content;
    
    // Save AI response to history
    await saveChatMessage(redis, sessionId, 'assistant', aiResponse);
    
    // Return response
    return res.json({
      success: true,
      message: aiResponse,
      sessionId,
    });
  } catch (error) {
    logger.error(`Chat error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error processing your request',
    });
  }
});

// GET /api/chat/history/:sessionId - Get chat history
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const redis = req.app.locals.redis;
    
    // Get chat history
    const history = await getChatHistory(redis, sessionId, 50);
    
    return res.json({
      success: true,
      history,
    });
  } catch (error) {
    logger.error(`Error retrieving chat history: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving chat history',
    });
  }
});

// DELETE /api/chat/history/:sessionId - Clear chat history
router.delete('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const redis = req.app.locals.redis;
    
    // Delete chat history
    await redis.del(`chat:history:${sessionId}`);
    
    return res.json({
      success: true,
      message: 'Chat history cleared',
    });
  } catch (error) {
    logger.error(`Error clearing chat history: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error clearing chat history',
    });
  }
});

module.exports = router;
