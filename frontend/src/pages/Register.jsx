import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, ShieldAlert, CheckCircle } from 'lucide-react';
import '../styles/auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Real-time security validation for password
  useEffect(() => {
    if (!formData.password) {
      setSecurityError('');
      return;
    }

    const { nombre, apellido, correo, password } = formData;
    const lowerPass = password.toLowerCase();
    
    let hasError = false;
    let errorMsg = '';

    if (nombre && nombre.length > 2 && lowerPass.includes(nombre.toLowerCase())) {
      hasError = true;
      errorMsg = 'Error: Por motivos de seguridad, tu contraseña no puede contener fragmentos de tu nombre.';
    } else if (apellido && apellido.length > 2 && lowerPass.includes(apellido.toLowerCase())) {
      hasError = true;
      errorMsg = 'Error: Por motivos de seguridad, tu contraseña no puede contener fragmentos de tu apellido.';
    } else if (correo) {
      const emailPrefix = correo.split('@')[0];
      if (emailPrefix && emailPrefix.length > 2 && lowerPass.includes(emailPrefix.toLowerCase())) {
        hasError = true;
        errorMsg = 'Error: Tu contraseña no puede contener partes de tu correo electrónico.';
      }
    }

    if (hasError) {
      setSecurityError(errorMsg);
    } else {
      setSecurityError('');
    }
  }, [formData.password, formData.nombre, formData.apellido, formData.correo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.nombre || !formData.apellido || !formData.correo || !formData.password || !formData.confirmPassword) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (securityError) {
      setError('Por favor, resuelve el error de seguridad en la contraseña.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError('Error al registrar cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel" style={{ maxWidth: '600px' }}>
        <div className="auth-header">
          <img src="/logo.jpg" alt="Logo JusticIA" className="real-logo-large" />
          <h2>Crear Cuenta</h2>
          <p>Únete a JusticIA Bolivia</p>
        </div>

        {error && (
          <div className="error-alert">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Nombre</label>
              <div className="input-with-icon">
                <User size={20} className="input-icon" />
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ej. Luz"
                  value={formData.nombre}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Apellido</label>
              <div className="input-with-icon">
                <User size={20} className="input-icon" />
                <input
                  type="text"
                  name="apellido"
                  placeholder="Ej. Esmeralda"
                  value={formData.apellido}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label>Correo Electrónico</label>
            <div className="input-with-icon">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                name="correo"
                placeholder="ejemplo@correo.com"
                value={formData.correo}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <div className="input-with-icon">
              <Lock size={20} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Crea una contraseña segura"
                value={formData.password}
                onChange={handleChange}
                className={securityError ? 'input-error' : ''}
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {/* Dynamic Security Requirements Box */}
            <div className={`security-box ${formData.password ? (securityError ? 'security-error' : 'security-success') : ''}`}>
              {formData.password ? (
                securityError ? (
                  <><ShieldAlert size={16} /> <span style={{color: 'var(--error)'}}>{securityError}</span></>
                ) : (
                  <><CheckCircle size={16} /> <span style={{color: 'var(--success)'}}>Contraseña válida y segura</span></>
                )
              ) : (
                <span>Requisitos: No usar fragmentos de nombre o correo</span>
              )}
            </div>
          </div>

          <div className="input-group">
            <label>Confirmar Contraseña</label>
            <div className="input-with-icon">
              <Lock size={20} className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Repite la contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={isSubmitting || !!securityError}
          >
            {isSubmitting ? <span className="spinner"></span> : 'Registrarse'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión aquí</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
