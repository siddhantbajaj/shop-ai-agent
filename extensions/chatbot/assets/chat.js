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

  function sendMessage() {
    const userMessage = chatInput.value.trim();
    
    // Add user message to chat
    addMessage(userMessage, 'user');
    
    // Clear input
    chatInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // For UI demo purposes only - simulate response
    // This will be replaced with actual Claude API integration
    setTimeout(() => {
      removeTypingIndicator();
      addMessage("Thanks for your message! This is a placeholder response. In the final implementation, this will be powered by Claude.", 'assistant');
    }, 1500);
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