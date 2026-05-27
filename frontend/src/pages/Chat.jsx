import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp, Bot, User as UserIcon, Plus, MessageSquare, MoreHorizontal, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/chat.css';

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: '¡Hola! Soy JusticIA, tu asistente legal especializado en la legislación boliviana. ¿En qué te puedo asesorar hoy?',
      laws: null
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const chatHistory = [
    { id: 'h1', title: 'Cálculo de Aguinaldo 2026', date: 'Hoy' },
    { id: 'h2', title: 'Renuncia voluntaria preaviso', date: 'Ayer' },
    { id: 'h3', title: 'Baja médica por maternidad', date: 'Hace 3 días' },
    { id: 'h4', title: 'Pago de horas extra nocturnas', date: 'La semana pasada' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      laws: null
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate RAG response
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'agent',
          text: 'De acuerdo con la jurisprudencia y la ley en Bolivia, el pago de beneficios sociales debe realizarse en un plazo máximo de 15 días calendario posteriores a la desvinculación. En caso de incumplimiento, corresponde el pago de una multa del 30% a favor del trabajador.',
          laws: [
            'Decreto Supremo 28699, Art. 9',
            'Resolución Ministerial 447/09'
          ]
        }
      ]);
    }, 2500);
  };

  const startNewChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'agent',
        text: 'He abierto una nueva conversación. ¿Sobre qué tema legal deseas consultar?',
        laws: null
      }
    ]);
  };

  return (
    <div className="gpt-chat-container glass-panel">
      
      {/* Sidebar Historial de Chats (Estilo ChatGPT / Gemini) */}
      <div className="gpt-sidebar">
        <button className="btn-new-chat" onClick={startNewChat}>
          <Plus size={18} /> Nuevo Chat
        </button>
        
        <div className="history-section">
          <h4 className="history-title">Recientes</h4>
          <ul className="history-list">
            {chatHistory.map(chat => (
              <li key={chat.id} className="history-item">
                <MessageSquare size={16} className="history-icon" />
                <span className="history-text">{chat.title}</span>
                <MoreHorizontal size={14} className="history-more" />
              </li>
            ))}
          </ul>
        </div>
        
        <div className="sidebar-footer-settings">
          <button className="btn-icon-text">
            <Settings size={18} /> Configurar Agente
          </button>
        </div>
      </div>

      {/* Área Principal del Chat */}
      <div className="gpt-main-chat">
        
        {/* Cabecera Móvil/Minimalista */}
        <div className="gpt-chat-header">
          <div className="gpt-model-selector">
            JusticIA Modelo RAG (Leyes BO) <ChevronDown size={14} />
          </div>
        </div>

        {/* Historial de Mensajes */}
        <div className="gpt-messages-area">
          {messages.length === 1 && (
            <div className="chat-empty-state">
              <img src="/logo.jpg" alt="JusticIA Logo" className="chat-big-logo" />
              <h2>¿Cómo puedo ayudarte con tus derechos laborales?</h2>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`gpt-message-row ${msg.sender === 'user' ? 'user-row' : 'agent-row'}`}>
              <div className="gpt-message-content-wrapper">
                
                {msg.sender === 'agent' && (
                  <div className="gpt-avatar agent-avatar">
                    <Bot size={20} />
                  </div>
                )}
                
                <div className={`gpt-bubble ${msg.sender === 'user' ? 'gpt-bubble-user' : 'gpt-bubble-agent'}`}>
                  <p>{msg.text}</p>
                  {msg.laws && <LawsAccordion laws={msg.laws} />}
                </div>

                {msg.sender === 'user' && (
                  <div className="gpt-avatar user-avatar">
                    {user?.avatar || <UserIcon size={20} />}
                  </div>
                )}

              </div>
            </div>
          ))}

          {isTyping && (
            <div className="gpt-message-row agent-row">
              <div className="gpt-message-content-wrapper">
                <div className="gpt-avatar agent-avatar"><Bot size={20} /></div>
                <div className="gpt-bubble gpt-bubble-agent typing-indicator-gpt">
                  <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de Mensaje al centro inferior */}
        <div className="gpt-input-container">
          <form className="gpt-input-box" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Pregúntale a JusticIA..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
            />
            <button type="submit" className="gpt-send-btn" disabled={!inputValue.trim() || isTyping}>
              <Send size={20} className={inputValue.trim() ? "active-icon" : "muted-icon"} />
            </button>
          </form>
          <p className="gpt-disclaimer">
            JusticIA puede cometer errores o no tener la legislación municipal específica. Verifica la información legal importante con un abogado.
          </p>
        </div>
      </div>

    </div>
  );
};

const LawsAccordion = ({ laws }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="laws-accordion-modern">
      <button 
        className="accordion-modern-toggle"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="shield-icon">⚖️ Referencias Jurídicas</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {isOpen && (
        <div className="accordion-modern-content fade-in">
          <ul>
            {laws.map((law, idx) => (
              <li key={idx}><strong>{law}</strong></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Chat;
