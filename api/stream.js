const { Anthropic } = require('@anthropic-ai/sdk');

// Enable CORS
const enableCors = (req, res) => {
  // Get origin from request headers or use wildcard as fallback
  const origin = req.headers.origin || '*';
  
  // Set CORS headers for streaming
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
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
  
  // Send a message to the client
  const sendMessage = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  try {
    // Get message from request body or query parameters
  let message, conversation_id;
  
  if (req.method === 'POST') {
    // Extract from POST body
    ({ message, conversation_id } = req.body);
  } else if (req.method === 'GET') {
    // Extract from query parameters
    ({ message, conversation_id } = req.query);
  }
    
    if (!message) {
      res.statusCode = 400;
      sendMessage({ error: 'Message is required' });
      return res.end();
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
    
    // Define system instructions
    const systemInstruction = 'You are a helpful store assistant for an e-commerce shop. Answer the customer\'s questions in a friendly, helpful way about products, shipping, returns, or anything else about the store.';
    
    // Generate or use existing conversation ID
    const newConversationId = conversation_id || Date.now().toString();
    
    // Send the conversation ID to the client
    sendMessage({ type: 'id', conversation_id: newConversationId });
    
    let fullResponse = '';
    
    // Generate response from Claude using streaming
    const stream = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1000,
      system: systemInstruction,
      messages: conversationHistory,
      stream: true
    });
    
    // Process the stream
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const textChunk = chunk.delta.text;
        fullResponse += textChunk;
        
        // Send each chunk to the client
        sendMessage({ 
          type: 'chunk', 
          chunk: textChunk 
        });
      }
    }
    
    // Add assistant response to history
    conversationHistory.push({ role: 'assistant', content: fullResponse });
    
    // Store updated conversation history
    conversations.set(newConversationId, conversationHistory);
    
    // Send a completion message
    sendMessage({ type: 'done' });
    
    // End the response
    return res.end();
    
  } catch (error) {
    console.error('Error processing streaming request:', error);
    
    // Check for specific error types
    if (error.status === 401 || error.message.includes('auth') || error.message.includes('key')) {
      sendMessage({ 
        type: 'error',
        error: 'Authentication failed with Claude API',
        details: 'Please check your API key in Vercel environment variables',
        message: error.message 
      });
    } else {
      sendMessage({ 
        type: 'error',
        error: 'Failed to get response from Claude',
        details: error.message
      });
    }
    
    return res.end();
  }
};