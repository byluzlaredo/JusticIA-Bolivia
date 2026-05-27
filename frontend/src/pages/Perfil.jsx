import React, { useState } from 'react';
import { User, Mail, Shield, Save, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/perfil.css';

const Perfil = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+591 71234567',
    profession: 'Asistente Administrativo'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setIsEditing(false);
    alert('Perfil actualizado correctamente (Mockup)');
  };

  return (
    <div className="perfil-container fade-in">
      <div className="perfil-header glass-panel">
        <div className="perfil-avatar-wrapper">
          <div className="perfil-avatar-large">
            {user?.avatar || <User size={40} />}
          </div>
          {isEditing && (
            <button className="btn-camera">
              <Camera size={16} />
            </button>
          )}
        </div>
        <div className="perfil-title">
          <h2>{user?.name}</h2>
          <p className="role-text"><Shield size={16} /> {user?.role === 'admin' ? 'Administrador del Sistema' : 'Usuario Padrón'}</p>
        </div>
      </div>

      <div className="perfil-body glass-panel">
        <div className="body-header">
          <h3>Información Personal</h3>
          {!isEditing ? (
            <button className="btn-outline" onClick={() => setIsEditing(true)}>Editar Perfil</button>
          ) : (
            <button className="btn-primary btn-save" onClick={handleSave}>
              <Save size={18} /> Guardar Cambios
            </button>
          )}
        </div>

        <div className="perfil-grid">
          <div className="input-group">
            <label>Nombre Completo</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                disabled={!isEditing} 
              />
            </div>
          </div>
          
          <div className="input-group">
            <label>Correo Electrónico</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                disabled={!isEditing} 
              />
            </div>
          </div>

          <div className="input-group">
            <label>Teléfono (Bolivia)</label>
            <input 
              type="text" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              disabled={!isEditing} 
            />
          </div>

          <div className="input-group">
            <label>Ocupación / Cargo Actual</label>
            <input 
              type="text" 
              name="profession" 
              value={formData.profession} 
              onChange={handleChange} 
              disabled={!isEditing} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
