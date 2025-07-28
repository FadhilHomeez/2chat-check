const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./src/config/config');
const chatRoutes = require('./src/routes/chatRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '2Chat Chat Checker API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint - serve the UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '2Chat Chat Checker API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      listGroups: 'GET /api/chat/groups/:phoneNumber',
      getChatHistory: 'GET /api/chat/groups/:groupUuid/messages',
      searchGroups: 'POST /api/chat/search',
      searchAllNumbers: 'POST /api/chat/search-all'
    },
    documentation: {
      listGroups: 'List all WhatsApp groups for a phone number',
      getChatHistory: 'Get chat history for a specific group (use ?export=true to save to file)',
      searchGroups: 'Search groups by title and get chat history (use export: true in body to save to file)',
      searchAllNumbers: 'Search all predefined numbers for groups and chat history'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
          availableEndpoints: [
        'GET /health',
        'GET /api/chat/groups/:phoneNumber',
        'GET /api/chat/groups/:groupUuid/messages',
        'POST /api/chat/search',
        'POST /api/chat/search-all'
      ]
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`🚀 2Chat Chat Checker is running on port ${PORT}`);
  console.log(`🌐 Web UI: http://localhost:${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app; 