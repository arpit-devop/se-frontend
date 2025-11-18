import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import api from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import { toast } from 'sonner';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: '👋 Hello! I\'m your Pharmacy Assistant. I can help you with:\n\n📦 Medicine information\n🔍 Inventory details\n📊 Basic queries\n\nAsk me anything! 😊' }
  ]);
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    if (!isAuthenticated()) {
      toast.error('Please login to use the chatbot');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.post('/chat', {
        message: userMessage,
        session_id: sessionId
      });
      
      setMessages(prev => [...prev, { role: 'bot', content: response.data.response }]);
      
      if (response.data.suggestions && response.data.suggestions.length > 0) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response');
      setMessages(prev => [...prev, { role: 'bot', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated()) return null;

  return (
    <>
      {/* Chat Button - Purple Theme */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            backgroundColor: '#9333ea', // Purple
            borderRadius: '50%',
            boxShadow: '0 10px 15px -3px rgba(147, 51, 234, 0.3), 0 4px 6px -2px rgba(147, 51, 234, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            zIndex: 9999,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#7e22ce'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#9333ea'}
          data-testid="chatbot-open-button"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window - Purple Theme */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '384px',
            height: '500px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(147, 51, 234, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            border: '1px solid #e9d5ff'
          }}
          data-testid="chatbot-window"
        >
          {/* Header - Purple */}
          <div style={{
            backgroundColor: '#9333ea',
            color: 'white',
            padding: '16px',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle className="h-5 w-5" />
              <span style={{ fontWeight: 600 }}>Pharmacy Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              data-testid="chatbot-close-button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div 
            style={{ 
              flex: 1, 
              padding: '16px', 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: '#faf5ff'
            }} 
            ref={scrollRef}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    backgroundColor: msg.role === 'user' ? '#9333ea' : '#e9d5ff',
                    color: msg.role === 'user' ? 'white' : '#581c87'
                  }}
                >
                  <p style={{ fontSize: '14px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  backgroundColor: '#e9d5ff',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#9333ea',
                    borderRadius: '50%',
                    animation: 'bounce 1s infinite'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#9333ea',
                    borderRadius: '50%',
                    animation: 'bounce 1s infinite 0.1s'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#9333ea',
                    borderRadius: '50%',
                    animation: 'bounce 1s infinite 0.2s'
                  }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div style={{ 
              padding: '8px 16px', 
              borderTop: '1px solid #e9d5ff',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              backgroundColor: '#faf5ff'
            }}>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(suggestion);
                    setTimeout(() => handleSend(), 100);
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #e9d5ff',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    color: '#9333ea',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#9333ea';
                    e.target.style.color = 'white';
                    e.target.style.borderColor = '#9333ea';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#9333ea';
                    e.target.style.borderColor = '#e9d5ff';
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '16px', borderTop: '1px solid #e9d5ff', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about medicines, inventory..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '2px solid #e9d5ff',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                onBlur={(e) => e.target.style.borderColor = '#e9d5ff'}
                data-testid="chatbot-input"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: loading || !input.trim() ? '#d8b4fe' : '#9333ea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                data-testid="chatbot-send-button"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
