import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import { saveDocuments, loadDocuments } from '../api/mockDocumentApi';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import '../styles/documentos.css';

// Helper: simple CI validation (bolivian format: 6‑12 digits, optional checksum)
const validateCi = (value) => {
  const regex = /^[0-9]{6,12}$/;
  return regex.test(value);
};

const categories = ['Contrato', 'Finiquito', 'Certificado', 'Otro'];

const Documentos = () => {
  const { user } = useAuth();
  const [ci, setCi] = useState('');
  const [ciError, setCiError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [files, setFiles] = useState([]); // {file, category, previewUrl}
  const [storedData, setStoredData] = useState(null);

  // Load persisted data on mount
  useEffect(() => {
    const data = loadDocuments();
    if (data) {
      setCi(data.ci);
      setFiles(data.documents.map(d => ({
        file: d.file,
        category: d.category,
        previewUrl: d.previewUrl
      })));
      setStoredData(data);
    }
  }, []);

  const handleCiChange = (e) => {
    const val = e.target.value;
    setCi(val);
    if (!validateCi(val)) {
      setCiError('CI debe contener solo números y entre 6‑12 dígitos');
    } else {
      setCiError('');
    }
  };

  const handleCategoryChange = (cat) => setSelectedCategory(cat);

  const handleFileSelect = (e) => {
    const uploaded = Array.from(e.target.files);
    const newFiles = uploaded.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      return { file, category: selectedCategory, previewUrl };
    });
    setFiles((prev) => [...prev, ...newFiles]);
    toast.success(`${uploaded.length} archivo(s) agregado(s)`);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    toast.success('Archivo eliminado');
  };

  const generatePdf = () => {
    if (!ci) {
      toast.error('Ingresa tu CI antes de generar el PDF');
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Resumen de Documentos - JusticIA Bolivia', 14, 22);
    doc.setFontSize(12);
    doc.text(`CI: ${ci}`, 14, 32);
    const tableBody = files.map((f, i) => [
      i + 1,
      f.file.name,
      f.category,
      `${(f.file.size / 1024).toFixed(2)} KB`
    ]);
    doc.autoTable({
      startY: 40,
      head: [['#', 'Nombre', 'Categoría', 'Tamaño']],
      body: tableBody,
    });
    doc.save('Resumen_Documentos.pdf');
    toast.success('PDF generado y descargado');
  };

  const downloadZip = async () => {
    if (files.length === 0) {
      toast.error('No hay archivos para descargar');
      return;
    }
    const zip = new JSZip();
    files.forEach((f) => {
      zip.file(f.file.name, f.file);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'Documentos.zip');
    toast.success('ZIP descargado');
  };

  const handleSave = () => {
    if (!ci || ciError) {
      toast.error('CI inválido o vacío');
      return;
    }
    const data = {
      ci,
      documents: files.map((f) => ({
        file: f.file,
        category: f.category,
        previewUrl: f.previewUrl,
      })),
    };
    saveDocuments(data);
    setStoredData(data);
    toast.success('Datos guardados en el navegador');
  };

  // If not logged in, redirect (or show message)
  if (!user) {
    return (
      <div className="documentos-container">
        <h2>Inicia sesión para gestionar documentos</h2>
      </div>
    );
  }

  return (
    <div className="documentos-container glass-panel">
      <h2 className="page-title">Gestión de Documentos</h2>

      {/* CI Input */}
      <div className="ci-section">
        <label htmlFor="ciInput" className="input-label">Cédula de Identidad (CI)</label>
        <input
          id="ciInput"
          type="text"
          value={ci}
          onChange={handleCiChange}
          placeholder="Ej.: 12345678"
          className={`ci-input ${ciError ? 'input-error' : ''}`}
        />
        {ciError && <span className="error-msg">{ciError}</span>}
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={cat === selectedCategory ? 'tab active' : 'tab'}
            onClick={() => handleCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* File Uploader */}
      <div className="uploader-section">
        <label className="upload-label" htmlFor="fileInput">
          Arrastra archivos aquí o haz clic para seleccionar
        </label>
        <input
          id="fileInput"
          type="file"
          multiple
          onChange={handleFileSelect}
          className="file-input"
        />
      </div>

      {/* File List */}
      <div className="files-list">
        {files.map((f, idx) => (
          <div key={idx} className="file-card glass-card">
            {f.file.type.startsWith('image/') ? (
              <img src={f.previewUrl} alt={f.file.name} className="preview-img" />
            ) : (
              <div className="preview-pdf">
                <span className="file-icon">📄</span>
                <span className="file-name">{f.file.name}</span>
              </div>
            )}
            <div className="file-meta">
              <span className="category-badge">{f.category}</span>
              <span className="file-size">{(f.file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button className="remove-btn" onClick={() => removeFile(idx)}>
              ✕
            </button>
          </div>
        ))}
        {files.length === 0 && <p className="empty-msg">Aún no has cargado documentos.</p>}
      </div>

      {/* Action Buttons */}
      <div className="actions-row">
        <button className="btn-primary" onClick={handleSave}>Guardar</button>
        <button className="btn-secondary" onClick={generatePdf}>Generar PDF</button>
        <button className="btn-secondary" onClick={downloadZip}>Descargar ZIP</button>
      </div>
    </div>
  );
};

export default Documentos;
