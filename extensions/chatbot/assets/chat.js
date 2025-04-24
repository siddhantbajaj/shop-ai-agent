document.addEventListener('DOMContentLoaded', function() {
  const shopAiChatContainer = document.querySelector('.shop-ai-chat-container');
  if (!shopAiChatContainer) return;

  const chatBubble = shopAiChatContainer.querySelector('.shop-ai-chat-bubble');
  const chatWindow = shopAiChatContainer.querySelector('.shop-ai-chat-window');
  const closeButton = shopAiChatContainer.querySelector('.shop-ai-chat-close');
  const chatInput = shopAiChatContainer.querySelector('.shop-ai-chat-input input');
  const sendButton = shopAiChatContainer.querySelector('.shop-ai-chat-send');
  const messagesContainer = shopAiChatContainer.querySelector('.shop-ai-chat-messages');

  // Toggle chat window visibility
  chatBubble.addEventListener('click', function() {
    chatWindow.classList.toggle('active');
    if (chatWindow.classList.contains('active')) {
      chatInput.focus();
    }
  });

  // Close chat window
  closeButton.addEventListener('click', function() {
    chatWindow.classList.remove('active');
  });

  // Send message when pressing Enter in input
  chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && chatInput.value.trim() !== '') {
      sendMessage();
    }
  });

  // Send message when clicking send button
  sendButton.addEventListener('click', function() {
    if (chatInput.value.trim() !== '') {
      sendMessage();
    }
  });

  // Store conversation ID in sessionStorage
  let conversationId = sessionStorage.getItem('shopAiConversationId');
  
  async function sendMessage() {
    const userMessage = chatInput.value.trim();
    
    // Add user message to chat
    addMessage(userMessage, 'user');
    
    // Clear input
    chatInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
      // Use either streaming or regular API endpoint
      const useStreaming = true; // Set to false to use non-streaming API
      
      if (useStreaming) {
        // Streaming implementation
        streamResponse(userMessage);
      } else {
        // Regular API implementation (non-streaming)
        await regularResponse(userMessage);
      }
    } catch (error) {
      console.error('Error communicating with Claude API:', error);
      removeTypingIndicator();
      addMessage("Sorry, I couldn't process your request at the moment. Please try again later.", 'assistant');
    }
  }
  
  // Stream the response from the API
  async function streamResponse(userMessage) {
    try {
      // Base API URL from environment config
      const baseUrl = window.SHOP_AI_CONFIG?.baseUrl || '';
      
      // Log the base URL for debugging
      console.log('Using API base URL:', baseUrl);
      
      // Create message element for the assistant's response
      const messageElement = document.createElement('div');
      messageElement.classList.add('shop-ai-message', 'assistant');
      messageElement.textContent = '';
      
      // Add empty message element that will be populated during streaming
      removeTypingIndicator();
      messagesContainer.appendChild(messageElement);
      
      // Prepare the request body
      const requestBody = JSON.stringify({
        message: userMessage,
        conversation_id: conversationId
      });
      
      // Set up event source for streaming
      const streamUrl = `${baseUrl}/api/stream`;
      
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody
      });
      
      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let buffer = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process line by line (SSE format)
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'id' && data.conversation_id) {
                // Save conversation ID
                conversationId = data.conversation_id;
                sessionStorage.setItem('shopAiConversationId', conversationId);
              } 
              else if (data.type === 'chunk') {
                // Append text chunk to message
                messageElement.textContent += data.chunk;
                
                // Scroll to bottom as new content arrives
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }
              else if (data.type === 'error') {
                // Handle error
                console.error('Stream error:', data.error);
                messageElement.textContent = "Sorry, I couldn't process your request. Please try again later.";
              }
            } catch (e) {
              console.error('Error parsing event data:', e, line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in streaming:', error);
      removeTypingIndicator();
      addMessage("Sorry, I couldn't process your request. Please try again later.", 'assistant');
    }
  }
  
  // Regular non-streaming API response
  async function regularResponse(userMessage) {
    // Get base URL from environment config
    const baseUrl = window.SHOP_AI_CONFIG?.baseUrl || '';
    
    // Log the base URL for debugging
    console.log('Using API base URL (regular):', baseUrl);
    
    // First check if the API is reachable
    try {
      const healthCheck = await fetch(`${baseUrl}/api/health`);
      if (!healthCheck.ok) {
        console.warn('Health check failed, API may be down');
      }
    } catch (healthError) {
      console.error('Health check error:', healthError);
    }
    
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        conversation_id: conversationId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API request failed: ${response.status} ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Save conversation ID for future messages
    if (data.conversation_id) {
      conversationId = data.conversation_id;
      sessionStorage.setItem('shopAiConversationId', conversationId);
    }
    
    removeTypingIndicator();
    addMessage(data.response, 'assistant');
  }

  function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('shop-ai-message', sender);
    messageElement.textContent = text;
    messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.classList.add('shop-ai-typing-indicator');
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typingIndicator);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTypingIndicator() {
    const typingIndicator = messagesContainer.querySelector('.shop-ai-typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Get welcome message from block settings or use default
  let welcomeMessage = "👋 Hi there! How can I help you today?";
  const blockElement = document.querySelector('[data-shopify-editor-block]');
  if (blockElement && blockElement.dataset.welcomeMessage) {
    welcomeMessage = blockElement.dataset.welcomeMessage;
  }
  
  // Add the welcome message
  addMessage(welcomeMessage, 'assistant');
});