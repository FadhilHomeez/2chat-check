const express = require('express');
const ChatController = require('../controllers/chatController');

const router = express.Router();
const chatController = new ChatController();

// Route to list all WhatsApp groups for a phone number
router.get('/groups/:phoneNumber', chatController.listGroups.bind(chatController));

// Route to get chat history for a specific group
router.get('/groups/:groupUuid/messages', chatController.getChatHistory.bind(chatController));

// Route to search groups by title and get chat history
router.post('/search', chatController.searchGroupsByTitle.bind(chatController));

// Route to search all predefined numbers
router.post('/search-all', chatController.searchAllNumbers.bind(chatController));

// Route to get demo data for UI testing
router.get('/demo', chatController.getDemoData.bind(chatController));

module.exports = router; 