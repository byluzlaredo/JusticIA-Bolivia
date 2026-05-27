import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Calculator, FileText, ChevronRight, Clock, Star, Bell, Send, Activity } from 'lucide-react';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quickQuery, setQuickQuery] = useState('');
  const [greeting, setGreeting] = useState('Buenos días');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 19) setGreeting('Buenas tardes');
    else if (hour >= 19 || hour < 5) setGreeting('Buenas noches');
  }, []);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      // In a real app, pass state to chat
      navigate('/dashboard/chat');
    }
  };

  const currentDate = new Date().toLocaleDateString('es-BO', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="dashboard-container fade-in">
      {/* Hero Header Section */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="date-badge">
            <Clock size={14} /> <span>{currentDate.charAt(0).toUpperCase() + currentDate.slice(1)}</span>
          </div>
          <h1>{greeting}, <span className="text-gradient">{user.name.split(' ')[0]}</span></h1>
          <p>Tu ecosistema legal inteligente. ¿Qué necesitas resolver hoy?</p>
          
          <form className="quick-search-bar" onSubmit={handleQuickSearch}>
            <input 
              type="text" 
              placeholder="Ej. ¿Cuántos días me tocan de vacación?" 
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
            />
            <button type="submit" className="btn-search">
              <Send size={18} />
            </button>
          </form>
        </div>
        <div className="hero-illustration">
          <div className="glow-circle"></div>
          <div className="floating-card c1">⚖️ Ley LGT</div>
          <div className="floating-card c2">📄 Contratos</div>
          <img src="/logo.jpg" alt="Logo" className="hero-logo-img" />
        </div>
      </div>

      {/* Main Modules Grid */}
      <h3 className="section-title">Herramientas Principales</h3>
      <div className="modules-grid">
        <Link to="/dashboard/chat" className="module-card glass-panel group">
          <div className="module-bg-blur bg-blue-blur"></div>
          <div className="module-header">
            <div className="module-icon bg-blue"><MessageSquare size={24} /></div>
            <span className="badge badge-blue">Popular</span>
          </div>
          <div className="module-body">
            <h3>Agente Inteligente RAG</h3>
            <p>Consulta tus dudas laborales. La IA analizará la legislación boliviana para darte respuestas precisas.</p>
          </div>
          <div className="module-footer">
            <span>Iniciar chat</span> <ChevronRight size={18} className="arrow-icon" />
          </div>
        </Link>

        <Link to="/dashboard/calculos" className="module-card glass-panel group">
          <div className="module-bg-blur bg-green-blur"></div>
          <div className="module-header">
            <div className="module-icon bg-green"><Calculator size={24} /></div>
          </div>
          <div className="module-body">
            <h3>Calculadora de Liquidación</h3>
            <p>Calcula finiquitos, aguinaldos, vacaciones y desahucios con fórmulas actualizadas al ministerio.</p>
          </div>
          <div className="module-footer">
            <span>Ir a calculadora</span> <ChevronRight size={18} className="arrow-icon" />
          </div>
        </Link>

        <Link to="/dashboard/documentos" className="module-card glass-panel group">
          <div className="module-bg-blur bg-purple-blur"></div>
          <div className="module-header">
            <div className="module-icon bg-purple"><FileText size={24} /></div>
          </div>
          <div className="module-body">
            <h3>Redactor de Documentos</h3>
            <p>Genera cartas de renuncia, solicitudes de vacación y memorándums listos para imprimir y firmar.</p>
          </div>
          <div className="module-footer">
            <span>Crear documento</span> <ChevronRight size={18} className="arrow-icon" />
          </div>
        </Link>
      </div>

      {/* Secondary Section: Activity & Tips */}
      <div className="dashboard-bottom-grid">
        <div className="activity-panel glass-panel">
          <div className="panel-header">
            <h3 className="flex items-center gap-2"><Activity size={20} className="text-accent" /> Actividad Reciente</h3>
            <button className="btn-text">Ver todo</button>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon bg-blue-light"><MessageSquare size={16} /></div>
              <div className="activity-details">
                <h4>Consulta sobre "Aguinaldo proporcional"</h4>
                <span>Hace 2 horas</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon bg-green-light"><Calculator size={16} /></div>
              <div className="activity-details">
                <h4>Cálculo de Liquidación guardado</h4>
                <span>Ayer, 14:30</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon bg-purple-light"><FileText size={16} /></div>
              <div className="activity-details">
                <h4>Generaste "Carta de Renuncia"</h4>
                <span>Hace 3 días</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tip-panel glass-panel">
          <div className="tip-badge"><Star size={14} /> Tip Legal del Día</div>
          <h3>¿Sabías qué?</h3>
          <p>En Bolivia, si cumples más de 90 días (3 meses) de trabajo continuo, ya tienes derecho a cobrar la indemnización por tiempo de servicios equivalente a un sueldo por año o sus duodécimas.</p>
          <div className="tip-footer">
            <div className="law-reference">Art. 13 - Ley General del Trabajo</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
