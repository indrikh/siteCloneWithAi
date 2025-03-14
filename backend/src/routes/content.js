const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Site content sections based on the Majestic RP reference
const CONTENT_SECTIONS = {
  home: {
    hero: {
      title: 'Explore the World of Role Play',
      subtitle: 'Join the exciting world of roleplay gaming with a thriving community',
      ctaText: 'Start Playing Now',
      ctaLink: '/download',
      backgroundImage: '/assets/images/hero-bg.jpg'
    },
    quests: [
      {
        id: 'gang',
        title: 'Path of the Gangster',
        description: 'Start from the bottom of the criminal world and build your empire',
        image: '/assets/images/quest-gang.jpg',
        link: '/quests/gang'
      },
      {
        id: 'cop',
        title: 'Path of the Law Enforcer',
        description: 'Serve and protect as a member of law enforcement',
        image: '/assets/images/quest-cop.jpg',
        link: '/quests/cop'
      }
    ],
    showcase: {
      title: 'Discover Our World',
      items: [
        {
          id: 'showcase-1',
          title: 'Dynamic Economy',
          description: 'Engage in a player-driven economy with various business opportunities',
          image: '/assets/images/showcase-economy.jpg'
        },
        {
          id: 'showcase-2',
          title: 'Multiplayer Experience',
          description: 'Join thousands of players in an immersive online world',
          image: '/assets/images/showcase-multiplayer.jpg'
        },
        {
          id: 'showcase-3',
          title: 'Realistic Roleplay',
          description: 'Experience life in a virtual world with detailed roleplay mechanics',
          image: '/assets/images/showcase-roleplay.jpg'
        }
      ]
    },
    guide: {
      title: 'How to Start Playing',
      steps: [
        {
          id: 'step-1',
          title: 'Purchase Access',
          description: 'Get your access key to join the game',
          icon: 'shopping-cart',
          action: {
            text: 'Buy for 1200₽',
            link: '/keys'
          }
        },
        {
          id: 'step-2',
          title: 'Download the Launcher',
          description: 'Install our custom launcher to play',
          icon: 'download',
          action: {
            text: 'Download',
            link: '/download'
          }
        },
        {
          id: 'step-3',
          title: 'Join the Community',
          description: 'Connect with other players on our social platforms',
          icon: 'users',
          action: {
            text: 'Join Discord',
            link: 'https://discord.example.com'
          }
        }
      ]
    },
    faq: {
      title: 'Frequently Asked Questions',
      items: [
        {
          question: 'What are the system requirements?',
          answer: 'The game requires a minimum of 8GB RAM, 4-core CPU, and a dedicated graphics card with at least 2GB VRAM. Windows 10 or newer is recommended.'
        },
        {
          question: 'Is there a refund policy?',
          answer: 'Yes, we offer refunds within 24 hours of purchase if you haven\'t accessed the game servers.'
        },
        {
          question: 'How do I report a player?',
          answer: 'You can report players through the in-game menu or by contacting an administrator on our Discord server.'
        },
        {
          question: 'Can I transfer my character between servers?',
          answer: 'Character transfers are not supported between different servers.'
        },
        {
          question: 'Where can I find more information?',
          answer: 'Check our Wiki for detailed guides and information about the game mechanics and rules.'
        }
      ]
    }
  }
};

// Helper function to get content from Redis or return default
const getContent = async (redis, section, defaultContent) => {
  try {
    const contentKey = `content:${section}`;
    const content = await redis.get(contentKey);
    
    if (content) {
      return JSON.parse(content);
    }
    
    // Store default content if not found
    await redis.set(contentKey, JSON.stringify(defaultContent));
    return defaultContent;
  } catch (error) {
    logger.error(`Error retrieving content: ${error.message}`);
    return defaultContent;
  }
};

// GET /api/content/:section - Get content for a specific section
router.get('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const redis = req.app.locals.redis;
    
    // Check if section exists in default content
    if (!CONTENT_SECTIONS[section]) {
      return res.status(404).json({
        success: false,
        message: 'Content section not found'
      });
    }
    
    // Get content
    const content = await getContent(redis, section, CONTENT_SECTIONS[section]);
    
    return res.json({
      success: true,
      content
    });
  } catch (error) {
    logger.error(`Error retrieving content: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving content'
    });
  }
});

// Admin-only routes would be added here with proper authentication

module.exports = router;
