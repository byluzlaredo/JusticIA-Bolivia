import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, MessageSquare, Calculator, FileText, Settings, LogOut, ShieldAlert } from 'lucide-react';
import '../styles/layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: '/dashboard', name: 'Panel de Control', icon: <LayoutDashboard size={20} /> },
    { path: '/dashboard/chat', name: 'Agente Virtual', icon: <MessageSquare size={20} /> },
    { path: '/dashboard/calculos', name: 'Calculadora Laboral', icon: <Calculator size={20} /> },
    { path: '/dashboard/documentos', name: 'Documentos', icon: <FileText size={20} /> },
    { path: '/dashboard/perfil', name: 'Editar Perfil', icon: <Settings size={20} /> },
  ];

  if (user.role === 'admin') {
    navItems.push({ path: '/admin/dashboard', name: 'Admin Panel', icon: <ShieldAlert size={20} /> });
  }

  return (
    <div className="layout-container">
      <aside className="sidebar glass-panel">
        <div className="brand">
          <img src="/logo.jpg" alt="JusticIA Bolivia" className="real-logo" />
          <h2>JusticIA Bolivia</h2>
        </div>
        
        <div className="user-info">
          <div className="avatar">{user.avatar}</div>
          <div>
            <p className="user-name">{user.name}</p>
            <p className="user-role">{user.role === 'admin' ? 'Administrador' : 'Usuario Padrón'}</p>
          </div>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={logout} className="logout-btn">
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="navbar glass-panel">
          <h1 className="page-title">
            {navItems.find((item) => item.path === location.pathname)?.name || 'JusticIA Bolivia'}
          </h1>
          <div className="nav-actions">
            <div className="status-indicator">
              <span className="dot online"></span> Conectado
            </div>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
