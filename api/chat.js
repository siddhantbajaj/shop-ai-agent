const { Anthropic } = require('@anthropic-ai/sdk');

// Enable CORS
const enableCors = (req, res) => {
  // Get origin from request headers or use wildcard as fallback
  const origin = req.headers.origin || '*';
  
  // Set CORS headers - allow the specific origin that made the request
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
};

// Simple memory store for conversations (in production, use a database)
const conversations = new Map();

module.exports = async (req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    enableCors(req, res);
    return res.status(200).end();
  }
  
  enableCors(req, res);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get message from request body
    const { message, conversation_id } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Initialize Claude client
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY
    });
    
    // Get or create conversation history
    let conversationHistory = [];
    if (conversation_id && conversations.has(conversation_id)) {
      conversationHistory = conversations.get(conversation_id);
    }
    
    // Add user message to history
    conversationHistory.push({ role: 'user', content: message });
    
    console.log("Attempting to use Claude API with model claude-3-5-sonnet-latest");
    
    // Define system instructions
    const systemInstruction = 'You are a helpful store assistant for an e-commerce shop. Answer the customer\'s questions in a friendly, helpful way about products, shipping, returns, or anything else about the store.';
    
    // Generate response from Claude using messages API with system parameter
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1000,
      system: systemInstruction,
      messages: conversationHistory
    });
    
    // Extract assistant's response
    // Content is an array of objects, we need to extract the text
    const assistantMessage = response.content[0].text;
    
    // Add assistant response to history
    conversationHistory.push({ role: 'assistant', content: assistantMessage });
    
    // Generate or use existing conversation ID
    const newConversationId = conversation_id || Date.now().toString();
    
    // Store updated conversation history
    conversations.set(newConversationId, conversationHistory);
    
    // Return response
    return res.status(200).json({
      response: assistantMessage,
      conversation_id: newConversationId
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Check for specific error types
    if (error.status === 401 || error.message.includes('auth') || error.message.includes('key')) {
      return res.status(401).json({
        error: 'Authentication failed with Claude API',
        details: 'Please check your API key in Vercel environment variables',
        message: error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to get response from Claude',
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};