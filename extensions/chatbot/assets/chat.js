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
      // Get your deployed Vercel URL (replace with your actual URL)
      const apiUrl = 'https://shop-ai-agent.vercel.app/api/chat';
      
      // First check if the API is reachable
      try {
        const healthCheck = await fetch('https://shop-ai-agent.vercel.app/api/health');
        if (!healthCheck.ok) {
          console.warn('Health check failed, API may be down');
        }
      } catch (healthError) {
        console.error('Health check error:', healthError);
      }
      
      const response = await fetch(apiUrl, {
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
    } catch (error) {
      console.error('Error communicating with Claude API:', error);
      removeTypingIndicator();
      addMessage("Sorry, I couldn't process your request at the moment. Please try again later.", 'assistant');
    }
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