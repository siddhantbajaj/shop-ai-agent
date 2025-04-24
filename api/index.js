// Root handler
module.exports = (req, res) => {
  // List all files in the API directory for debugging
  const fs = require('fs');
  const path = require('path');
  
  // Get all files in the current directory
  const apiDirectory = path.join(__dirname);
  let files = [];
  
  try {
    files = fs.readdirSync(apiDirectory).map(file => ({
      name: file,
      path: `/api/${file.replace('.js', '')}`
    }));
  } catch (error) {
    files = [{ error: error.message }];
  }
  
  res.status(200).json({
    message: 'Claude Chat API is running',
    endpoints: {
      health: '/api/health - GET - Check API health',
      chat: '/api/chat - POST - Send messages to Claude'
    },
    files: files,
    currentDirectory: __dirname,
    docs: 'See README.md for API usage'
  });
};