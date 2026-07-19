/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, RefreshCw, AlertCircle, Bot, User, Trash2, 
  HelpCircle, ChevronRight, Sprout, ArrowRight, UserCheck
} from 'lucide-react';
import { ChatMessage } from '../types';

const AGRI_QUICK_QUESTIONS = [
  { text: 'How do I naturally treat tomato early blight?', label: 'Blight Solution' },
  { text: 'What is the optimal soil NPK ratio for leafy green crops?', label: 'Soil Nutrients' },
  { text: 'How do I implement effective crop rotation on a small loam field?', label: 'Crop Rotation' },
  { text: 'What are the organic pest control methods for common aphids?', label: 'Organic Aphid Pest' }
];

export default function AgronomistChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I am your AI Agronomist, specialized in plant pathology, soil chemistry, and sustainable crop optimization. Ask me any question about crop selection, pest control, organic fertilizing, or seasonal planning!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      // Send message history to preserve context
      const chatHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error occurred during chat.');
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'model',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Agronomist chat failed. Please check your Gemini API key in Secrets Settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: "Hello! I am your AI Agronomist, specialized in plant pathology, soil chemistry, and sustainable crop optimization. Ask me any question about crop selection, pest control, organic fertilizing, or seasonal planning!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setError(null);
  };

  // Helper to format text responses beautifully (basic markdown parser)
  const formatResponseText = (text: string) => {
    return text.split('\n').map((line, index) => {
      let content = line.trim();
      
      // Render bullet points
      if (content.startsWith('-') || content.startsWith('*')) {
        const cleaned = content.substring(1).trim();
        return (
          <li key={index} className="ml-4 list-disc text-xs text-editorial-dark leading-relaxed mb-1.5 font-serif">
            {renderBoldAndItalics(cleaned)}
          </li>
        );
      }

      // Render headings
      if (content.startsWith('###')) {
        return (
          <h5 key={index} className="font-sans font-bold text-xs text-editorial-dark mt-3 mb-1 uppercase tracking-wider">
            {renderBoldAndItalics(content.substring(3).trim())}
          </h5>
        );
      }
      if (content.startsWith('##')) {
        return (
          <h4 key={index} className="font-serif font-bold text-sm text-editorial-dark mt-4 mb-2">
            {renderBoldAndItalics(content.substring(2).trim())}
          </h4>
        );
      }

      // Standard paragraphs
      if (content === '') {
        return <div key={index} className="h-2" />;
      }

      return (
        <p key={index} className="text-xs text-editorial-dark leading-relaxed mb-2 font-serif">
          {renderBoldAndItalics(content)}
        </p>
      );
    });
  };

  const renderBoldAndItalics = (text: string) => {
    // Basic regex replacer for markdown bold (**text**)
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-editorial-dark">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div id="agronomist-chat-module" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full">
      
      {/* Left sidebar: Guidelines and Quick questions */}
      <div id="chat-guidelines-col" className="lg:col-span-4 space-y-6">
        <div id="agronomist-intro-card" className="bg-white border border-editorial-border rounded-none p-6 space-y-4">
          <div id="agronomist-avatar" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-none bg-editorial-dark text-white flex items-center justify-center shadow-xs flex-shrink-0 border border-editorial-border">
              <Bot className="w-5 h-5 text-editorial-cream" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-editorial-dark text-base">AI Agronomy Consultant</h3>
              <p className="text-[10px] text-editorial-sage font-sans uppercase tracking-wider font-bold">Active • Sustainable Specialist</p>
            </div>
          </div>

          <p className="text-xs text-editorial-dark font-serif leading-relaxed border-t border-editorial-border/60 pt-4">
            Consult our expert model regarding specialized agricultural issues. Trained in crop rotations, soil composition analytics, chemical dilutions, and biological pest defense.
          </p>

          <div className="space-y-2 pt-1.5">
            <h4 className="text-[9px] font-bold uppercase tracking-wider text-editorial-sage font-sans">Practice Core Guidelines</h4>
            <div className="space-y-2 text-xs text-editorial-dark">
              <div className="flex items-start gap-2 bg-editorial-sand/30 p-2.5 rounded-none border border-editorial-border">
                <Sprout className="w-4 h-4 text-editorial-sage flex-shrink-0 mt-0.5" />
                <span className="font-serif">Provides organic, soil-rebuilding alternatives before recommending hard sprays.</span>
              </div>
              <div className="flex items-start gap-2 bg-editorial-sand/30 p-2.5 rounded-none border border-editorial-border">
                <UserCheck className="w-4 h-4 text-editorial-sage flex-shrink-0 mt-0.5" />
                <span className="font-serif">Structured, high-efficiency recommendations for both home plots and commercial acreage.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick agricultural questions */}
        <div id="quick-prompts-card" className="bg-white border border-editorial-border rounded-none p-6 space-y-3.5">
          <h4 className="font-serif font-bold text-editorial-dark text-base flex items-center gap-1.5">
            <HelpCircle className="w-4.5 h-4.5 text-editorial-sage" /> Botanical Consult Presets
          </h4>
          <p className="text-xs text-editorial-sage font-serif italic">
            Click any of these sample consult requests to instantly ask the FarmAI pathology bot:
          </p>
          <div className="grid grid-cols-1 gap-2.5 pt-1">
            {AGRI_QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.text)}
                disabled={isLoading}
                className="flex items-center justify-between p-2.5 rounded-none border border-editorial-border hover:border-editorial-dark hover:bg-editorial-sand/40 text-left transition-all group disabled:opacity-50"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-sans font-bold text-editorial-dark text-xs truncate uppercase tracking-wide">
                    {q.label}
                  </div>
                  <div className="text-[10px] text-editorial-sage truncate mt-0.5 font-serif italic">
                    {q.text}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-editorial-sage/60 group-hover:text-editorial-dark group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right column: Interactive chat stream */}
      <div id="chat-stream-col" className="lg:col-span-8 h-full flex flex-col">
        <div id="chat-container-card" className="bg-white border border-editorial-border rounded-none shadow-xs flex flex-col h-[520px] overflow-hidden">
          
          {/* Chat Header */}
          <div id="chat-header" className="px-6 py-4 bg-editorial-sand/40 border-b border-editorial-border flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-4.5 h-4.5 text-editorial-forest" />
              <span className="font-serif font-bold text-sm text-editorial-dark uppercase tracking-wide">Agronomy Consultation Session</span>
            </div>
            <button 
              onClick={handleClearChat}
              id="clear-chat-btn"
              className="text-[10px] uppercase tracking-wider font-sans font-bold text-editorial-sage hover:text-editorial-dark hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Reset Chat
            </button>
          </div>

          {/* Message History Scroller */}
          <div id="chat-history-scroller" className="flex-1 overflow-y-auto p-6 space-y-5 bg-editorial-cream/10">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'model';
              return (
                <div 
                  key={msg.id} 
                  id={`msg-${msg.id}`}
                  className={`flex gap-3 max-w-[85%] ${isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  <div className={`w-8 h-8 rounded-none flex items-center justify-center flex-shrink-0 border ${
                    isAssistant ? 'bg-editorial-dark text-white border-editorial-dark' : 'bg-editorial-sand text-editorial-dark border-editorial-border'
                  }`}>
                    {isAssistant ? <Bot className="w-4 h-4 text-editorial-cream" /> : <User className="w-4 h-4 text-editorial-dark" />}
                  </div>

                  <div className="space-y-1">
                    <div className={`p-4 rounded-none ${
                      isAssistant 
                        ? 'bg-white border border-editorial-border text-editorial-dark shadow-xs' 
                        : 'bg-editorial-dark text-white shadow-xs'
                    }`}>
                      {isAssistant ? (
                        <div className="space-y-0.5">{formatResponseText(msg.text)}</div>
                      ) : (
                        <p className="text-xs leading-relaxed font-serif">{msg.text}</p>
                      )}
                    </div>
                    <div className={`text-[9px] text-editorial-sage font-mono ${isAssistant ? 'text-left pl-1' : 'text-right pr-1'}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Chat loading states */}
            {isLoading && (
              <div id="chat-loading-item" className="flex gap-3 max-w-[80%] mr-auto items-start">
                <div className="w-8 h-8 rounded-none bg-editorial-dark text-white flex items-center justify-center flex-shrink-0 border border-editorial-dark animate-pulse">
                  <Bot className="w-4 h-4 text-editorial-cream" />
                </div>
                <div className="p-4 bg-white border border-editorial-border rounded-none shadow-xs flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-editorial-dark rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-editorial-dark rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-editorial-dark rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-xs text-editorial-sage italic font-serif">Formulating pathology response...</span>
                </div>
              </div>
            )}

            {error && (
              <div id="chat-error-item" className="p-3.5 bg-rose-50 border border-rose-100 rounded-none text-xs text-rose-800 flex gap-2 items-start max-w-lg mx-auto">
                <AlertCircle className="w-4.5 h-4.5 text-rose-600 flex-shrink-0" />
                <span className="font-serif"><strong>API Error:</strong> {error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Text Input Footer */}
          <div id="chat-input-footer" className="p-4 bg-white border-t border-editorial-border flex-shrink-0">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex gap-3"
            >
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                placeholder="Ask our Agronomist... (e.g. How do I naturally adjust high soil pH?)"
                className="flex-1 text-xs px-4 py-3 border border-editorial-border rounded-none focus:outline-none focus:border-editorial-dark bg-editorial-cream/10 text-editorial-dark font-sans disabled:bg-zinc-100"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="px-5 py-3 bg-editorial-dark hover:bg-editorial-forest disabled:bg-zinc-300 text-white rounded-none shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </div>

    </div>
  );
}
