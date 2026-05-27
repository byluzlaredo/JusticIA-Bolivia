import React, { useState } from 'react';
import { Calculator, Calendar, DollarSign, Download, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import '../styles/calculadora.css';

const Calculadora = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fechaIngreso: '',
    fechaSalida: '',
    motivo: 'Retiro Voluntario',
    incluirDesahucio: false,
    sueldo1: '',
    sueldo2: '',
    sueldo3: '',
    diasVacacion: '0',
    mesesAguinaldo: '0',
    otrosBonos: '0'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const calcularPromedio = () => {
    const s1 = parseFloat(formData.sueldo1) || 0;
    const s2 = parseFloat(formData.sueldo2) || 0;
    const s3 = parseFloat(formData.sueldo3) || 0;
    return ((s1 + s2 + s3) / 3).toFixed(2);
  };

  const montoIndemnizacion = () => (calcularPromedio() * 2.3).toFixed(2); // Mockup simple formula
  const montoAguinaldo = () => ((calcularPromedio() / 12) * 4).toFixed(2); // Mockup
  const montoDesahucio = () => (formData.incluirDesahucio && formData.motivo === 'Despido Injustificado') ? (calcularPromedio() * 3).toFixed(2) : 0;
  
  // Nuevos montos
  const montoVacaciones = () => ((calcularPromedio() / 30) * (parseFloat(formData.diasVacacion) || 0)).toFixed(2);
  const montoAguinaldosAtrasados = () => ((calcularPromedio() / 12) * (parseFloat(formData.mesesAguinaldo) || 0)).toFixed(2);
  const montoOtros = () => (parseFloat(formData.otrosBonos) || 0).toFixed(2);

  const calcularTotal = () => {
    const total = parseFloat(montoIndemnizacion()) + 
                  parseFloat(montoAguinaldo()) + 
                  parseFloat(montoDesahucio()) +
                  parseFloat(montoVacaciones()) +
                  parseFloat(montoAguinaldosAtrasados()) +
                  parseFloat(montoOtros());
    return total.toFixed(2);
  };

  return (
    <div className="calculadora-container glass-panel">
      <div className="stepper-header">
        <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
          <div className="step-circle">1</div>
          <span>Datos Básicos</span>
        </div>
        <div className="step-line"></div>
        <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
          <div className="step-circle">2</div>
          <span>Sueldos y Bonos</span>
        </div>
        <div className="step-line"></div>
        <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
          <div className="step-circle">3</div>
          <span>Resultados</span>
        </div>
      </div>

      <div className="step-content">
        {step === 1 && (
          <div className="step-pane fade-in">
            <h3>Paso 1: Fechas y Motivo</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>Fecha de Ingreso</label>
                <div className="input-with-icon">
                  <Calendar size={18} className="input-icon" />
                  <input type="date" name="fechaIngreso" value={formData.fechaIngreso} onChange={handleChange} />
                </div>
              </div>
              <div className="input-group">
                <label>Fecha de Retiro</label>
                <div className="input-with-icon">
                  <Calendar size={18} className="input-icon" />
                  <input type="date" name="fechaSalida" value={formData.fechaSalida} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="input-group mt-2">
              <label>Motivo de Retiro</label>
              <select name="motivo" value={formData.motivo} onChange={handleChange}>
                <option value="Retiro Voluntario">Retiro Voluntario</option>
                <option value="Despido Injustificado">Despido Injustificado / Retiro Forzoso</option>
              </select>
            </div>

            {formData.motivo === 'Despido Injustificado' && (
              <div className="desahucio-box fade-in">
                <label className="checkbox-label">
                  <input type="checkbox" name="incluirDesahucio" checked={formData.incluirDesahucio} onChange={handleChange} />
                  <strong>Incluir Desahucio (3 salarios)</strong>
                </label>
                <p>Por ley, te corresponde este beneficio por despido intempestivo.</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="step-pane fade-in">
            <h3>Paso 2: Promedio y Derechos Pendientes</h3>
            <p className="text-muted mb-2">Ingresa tus últimos 3 sueldos y cualquier otro derecho laboral pendiente de pago.</p>
            
            <div className="sueldos-grid">
              <div className="input-group">
                <label>Último Sueldo</label>
                <div className="input-with-icon">
                  <span className="currency-prefix">Bs.</span>
                  <input type="number" name="sueldo1" value={formData.sueldo1} onChange={handleChange} />
                </div>
              </div>
              <div className="input-group">
                <label>Penúltimo Sueldo</label>
                <div className="input-with-icon">
                  <span className="currency-prefix">Bs.</span>
                  <input type="number" name="sueldo2" value={formData.sueldo2} onChange={handleChange} />
                </div>
              </div>
              <div className="input-group">
                <label>Antepenúltimo Sueldo</label>
                <div className="input-with-icon">
                  <span className="currency-prefix">Bs.</span>
                  <input type="number" name="sueldo3" value={formData.sueldo3} onChange={handleChange} />
                </div>
              </div>
            </div>

            <hr style={{ borderColor: 'var(--glass-border)', margin: '1.5rem 0' }} />
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Otros Derechos Adquiridos</h4>

            <div className="sueldos-grid">
              <div className="input-group">
                <label>Días de Vacación Pendientes</label>
                <input type="number" name="diasVacacion" value={formData.diasVacacion} onChange={handleChange} placeholder="Ej. 15" />
              </div>
              <div className="input-group">
                <label>Meses de Aguinaldo Atrasado</label>
                <input type="number" name="mesesAguinaldo" value={formData.mesesAguinaldo} onChange={handleChange} placeholder="Ej. 12" />
              </div>
              <div className="input-group">
                <label>Otros Bonos Pendientes</label>
                <div className="input-with-icon">
                  <span className="currency-prefix">Bs.</span>
                  <input type="number" name="otrosBonos" value={formData.otrosBonos} onChange={handleChange} placeholder="Ej. 500" />
                </div>
              </div>
            </div>

            <div className="promedio-box mt-2">
              <h4>Sueldo Promedio Indemnizable</h4>
              <div className="promedio-formula">
                <span className="formula-text">(S1 + S2 + S3) / 3 =</span>
                <span className="formula-result">Bs. {calcularPromedio()}</span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-pane fade-in">
            <h3>Paso 3: Tablero de Liquidación Final</h3>
            <div className="resultados-grid">
              
              <div className="resultado-card">
                <div className="rc-header">Indemnización por Tiempo</div>
                <div className="rc-body">
                  <p className="rc-formula">Calculada en base a los años de servicio</p>
                  <p className="rc-value highlighted">Bs. {montoIndemnizacion()}</p>
                </div>
              </div>

              <div className="resultado-card">
                <div className="rc-header">Aguinaldo Proporcional (Año en curso)</div>
                <div className="rc-body">
                  <p className="rc-formula">Días trabajados del año actual</p>
                  <p className="rc-value highlighted">Bs. {montoAguinaldo()}</p>
                </div>
              </div>

              {(parseFloat(formData.diasVacacion) > 0) && (
                <div className="resultado-card">
                  <div className="rc-header">Vacaciones no Gozadas</div>
                  <div className="rc-body">
                    <p className="rc-formula">(Promedio / 30 días) × {formData.diasVacacion} días</p>
                    <p className="rc-value highlighted">Bs. {montoVacaciones()}</p>
                  </div>
                </div>
              )}

              {(parseFloat(formData.mesesAguinaldo) > 0) && (
                <div className="resultado-card">
                  <div className="rc-header">Aguinaldos Atrasados</div>
                  <div className="rc-body">
                    <p className="rc-formula">Meses pendientes consolidados</p>
                    <p className="rc-value highlighted">Bs. {montoAguinaldosAtrasados()}</p>
                  </div>
                </div>
              )}

              {(parseFloat(formData.otrosBonos) > 0) && (
                <div className="resultado-card">
                  <div className="rc-header">Otros Ingresos/Bonos</div>
                  <div className="rc-body">
                    <p className="rc-formula">Sueldos o primas atrasadas</p>
                    <p className="rc-value highlighted">Bs. {montoOtros()}</p>
                  </div>
                </div>
              )}

              {formData.motivo === 'Despido Injustificado' && formData.incluirDesahucio && (
                <div className="resultado-card desahucio-card">
                  <div className="rc-header">Desahucio (Multa al empleador)</div>
                  <div className="rc-body">
                    <p className="rc-formula">Sueldo Promedio × 3</p>
                    <p className="rc-value highlighted">Bs. {montoDesahucio()}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="total-liquidacion-box">
              <h3>TOTAL LÍQUIDO PAGABLE</h3>
              <div className="total-amount">Bs. {calcularTotal()}</div>
            </div>

            <button className="btn-download mt-4">
              <Download size={20} />
              Descargar Detalle de Liquidación Oficial en PDF
            </button>
          </div>
        )}
      </div>

      <div className="stepper-footer">
        {step > 1 ? (
          <button className="btn-outline" onClick={prevStep}>
            <ArrowLeft size={18} /> Atrás
          </button>
        ) : <div></div>}

        {step < 3 ? (
          <button className="btn-primary" onClick={nextStep}>
            Siguiente <ArrowRight size={18} />
          </button>
        ) : (
          <button className="btn-success" onClick={() => alert('Generando cálculo completo y guardando en tu perfil...')}>
            <CheckCircle size={18} /> Guardar Finiquito
          </button>
        )}
      </div>
    </div>
  );
};

export default Calculadora;
