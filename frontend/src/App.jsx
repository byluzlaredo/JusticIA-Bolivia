import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './layouts/Layout';
import ToastProvider from './components/Toast';
// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Calculadora from './pages/Calculadora';
import Documentos from './pages/Documentos';
import Admin from './pages/Admin';
import Perfil from './pages/Perfil';

function App() {
  return (
    <AuthProvider>
      <ToastProvider />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dashboard/chat" element={<Chat />} />
            <Route path="dashboard/calculos" element={<Calculadora />} />
            <Route path="dashboard/documentos" element={<Documentos />} />
            <Route path="dashboard/perfil" element={<Perfil />} />
            <Route path="admin/dashboard" element={<Admin />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
