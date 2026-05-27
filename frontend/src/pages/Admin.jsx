import React, { useState } from 'react';
import { Users, AlertTriangle, ShieldCheck, TrendingUp, Download, ShieldAlert } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/admin.css';

const Admin = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([
    { id: 1, name: 'Carlos Mendoza', email: 'carlos@mail.com', role: 'user', status: 'Activo', date: '2026-05-20' },
    { id: 2, name: 'Ana Rojas', email: 'ana@mail.com', role: 'supervisor', status: 'Activo', date: '2026-05-22' },
    { id: 3, name: 'Luis Vargas', email: 'luis@mail.com', role: 'user', status: 'Suspendido', date: '2026-05-25' },
    { id: 4, name: 'María Gómez', email: 'maria@mail.com', role: 'user', status: 'Activo', date: '2026-05-26' },
  ]);

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const toggleStatus = (id) => {
    setUsers(users.map(u => 
      u.id === id 
        ? { ...u, status: u.status === 'Activo' ? 'Suspendido' : 'Activo' } 
        : u
    ));
  };

  const changeRole = (id) => {
    setUsers(users.map(u => 
      u.id === id 
        ? { ...u, role: u.role === 'user' ? 'supervisor' : 'user' } 
        : u
    ));
  };

  return (
    <div className="admin-container fade-in">
      <div className="admin-header">
        <h2><ShieldAlert size={28} className="text-accent" /> Panel de Administración</h2>
        <p>Gestión global de la plataforma JusticIA Bolivia</p>
      </div>

      <div className="admin-stats">
        <div className="stat-card glass-panel">
          <div className="stat-icon bg-blue"><Users /></div>
          <div className="stat-info">
            <h4>Total Usuarios</h4>
            <span>1,248</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon bg-green"><TrendingUp /></div>
          <div className="stat-info">
            <h4>Consultas RAG (Mes)</h4>
            <span>5,430</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon bg-purple"><Download /></div>
          <div className="stat-info">
            <h4>PDFs Generados</h4>
            <span>892</span>
          </div>
        </div>
      </div>

      <div className="admin-table-section glass-panel">
        <div className="table-header">
          <h3>Gestión de Usuarios Registrados</h3>
          <input type="text" placeholder="Buscar usuario por correo o nombre..." className="search-input" />
        </div>
        
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Fecha Registro</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={u.status === 'Suspendido' ? 'row-suspended' : ''}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge ${u.role}`}>
                      {u.role === 'supervisor' ? <ShieldCheck size={14} /> : <Users size={14} />}
                      {u.role}
                    </span>
                  </td>
                  <td>{u.date}</td>
                  <td>
                    <span className={`status-badge ${u.status.toLowerCase()}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => changeRole(u.id)} className="btn-icon btn-role" title="Cambiar Rol">
                        <ShieldCheck size={18} />
                      </button>
                      <button onClick={() => toggleStatus(u.id)} className={`btn-icon ${u.status === 'Activo' ? 'btn-suspend' : 'btn-activate'}`} title={u.status === 'Activo' ? 'Suspender' : 'Activar'}>
                        <AlertTriangle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
