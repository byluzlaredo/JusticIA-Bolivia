const API_BASE = '/api';

async function parseJsonOrText(res) {
    try {
        return await res.json();
    } catch {
        return { detail: await res.text() };
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        verifyToken(token);
    }
});

// UI Utils
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
    document.getElementById(viewId).classList.add('active-view');
}

function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active-form'));
    
    if (tab === 'login') {
        document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('login-form').classList.add('active-form');
    } else {
        document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('register-form').classList.add('active-form');
    }
}

function switchMainTab(tab) {
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    document.querySelectorAll('.dashboard-tab').forEach(t => t.classList.remove('active-tab'));
    
    const indexMap = { 'chat': 0, 'calc': 1, 'docs': 2, 'config': 3 };
    document.querySelectorAll('.nav-links li')[indexMap[tab]].classList.add('active');
    document.getElementById(`${tab}-tab`).classList.add('active-tab');
}

// Módulo 5.1: Autenticación
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: email, contrasena: password })
        });
        const data = await parseJsonOrText(res);
        
        if (res.ok) {
            localStorage.setItem('token', data.access_token);
            document.getElementById('user-name-display').innerHTML = `<i class="fas fa-user-circle"></i> ${data.user.nombre}`;
            switchView('dashboard-view');
        } else {
            alert(data.detail || 'Error en login');
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const payload = {
        nombre: document.getElementById('reg-nombre').value,
        apellido: document.getElementById('reg-apellido').value,
        correo: document.getElementById('reg-email').value,
        contrasena: document.getElementById('reg-password').value
    };
    
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    const data = await parseJsonOrText(res);
    alert(data.detail || data.message);
    if (res.ok) switchAuthTab('login');
}

async function verifyToken(token) {
    const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
        const user = await res.json();
        document.getElementById('user-name-display').innerHTML = `<i class="fas fa-user-circle"></i> ${user.nombre}`;
        switchView('dashboard-view');
    } else {
        localStorage.removeItem('token');
    }
}

function logout() {
    localStorage.removeItem('token');
    switchView('auth-view');
}

async function handleRecover() {
    const email = prompt("Ingresa tu correo para recuperar la contraseña:");
    if (!email) return;
    const res = await fetch(`${API_BASE}/auth/recover?correo=${email}`, { method: 'POST' });
    const data = await res.json();
    alert(data.message);
}

// Módulo 5.5: Chat RAG
function handleChatEnter(e) {
    if (e.key === 'Enter') sendChatMessage();
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    
    // Add user message
    const chatContainer = document.getElementById('chat-messages');
    chatContainer.innerHTML += `
        <div class="message user">
            <div class="msg-avatar"><i class="fas fa-user"></i></div>
            <div class="msg-content">${msg}</div>
        </div>
    `;
    input.value = '';
    
    // Add loading
    const loadingId = 'load-' + Date.now();
    chatContainer.innerHTML += `
        <div class="message system" id="${loadingId}">
            <div class="msg-avatar"><i class="fas fa-robot"></i></div>
            <div class="msg-content">Analizando la normativa laboral... <i class="fas fa-spinner fa-spin"></i></div>
        </div>
    `;
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/chat/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ pregunta: msg })
        });
        
        const data = await res.json();
        document.getElementById(loadingId).remove();
        
        let responseHTML = data.respuesta.replace(/\n/g, '<br>');
        if (data.fuentes && data.fuentes.length > 0) {
            responseHTML += `<br><br><small style="color:var(--secondary)"><i class="fas fa-book"></i> Fuentes: ${data.fuentes.join(', ')}</small>`;
        }
        
        chatContainer.innerHTML += `
            <div class="message system">
                <div class="msg-avatar"><i class="fas fa-robot"></i></div>
                <div class="msg-content">${responseHTML}</div>
            </div>
        `;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    } catch (e) {
        document.getElementById(loadingId).remove();
        alert('Error en el asistente');
    }
}

// Módulo 5.6: Documentos
async function handleDocGen(e) {
    e.preventDefault();
    const payload = {
        tipo: document.getElementById('doc-tipo').value,
        nombre_completo: document.getElementById('doc-nombre').value,
        ci: document.getElementById('doc-ci').value,
        cargo: document.getElementById('doc-cargo').value,
        motivo: document.getElementById('doc-motivo').value
    };
    
    const res = await fetch(`${API_BASE}/documents/generate`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    
    if (res.ok) {
        const resultArea = document.getElementById('doc-result');
        resultArea.classList.remove('hidden');
        resultArea.innerHTML = `
            <h3><i class="fas fa-check-circle"></i> Documento Listo</h3>
            <p>Se ha generado el documento correctamente.</p>
            <a href="${data.download_url}" target="_blank" class="btn primary-btn mt-2" style="display:inline-block; text-decoration:none;">Descargar PDF</a>
        `;
    }
}

// Módulo 5.7: Cálculos
async function handleCalc(e) {
    e.preventDefault();
    const payload = {
        salario_base: parseFloat(document.getElementById('calc-salario').value),
        fecha_ingreso: document.getElementById('calc-ingreso').value,
        fecha_salida: document.getElementById('calc-salida').value,
        motivo_salida: document.getElementById('calc-motivo').value
    };
    
    const res = await fetch(`${API_BASE}/calculators/benefits`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    
    if (res.ok) {
        if(data.error) {
            alert(data.error);
            return;
        }
        const resultArea = document.getElementById('calc-result');
        resultArea.classList.remove('hidden');
        resultArea.innerHTML = `
            <h3>Resultados del Cálculo</h3>
            <div class="result-row"><span>Tiempo Computable:</span> <span>${data.tiempo_trabajado}</span></div>
            <div class="result-row"><span>Indemnización:</span> <span>Bs. ${data.indemnizacion.toFixed(2)}</span></div>
            <div class="result-row"><span>Aguinaldo Proporcional:</span> <span>Bs. ${data.aguinaldo.toFixed(2)}</span></div>
            <div class="result-row"><span>Vacaciones Pendientes:</span> <span>Bs. ${data.pago_vacaciones.toFixed(2)}</span></div>
            <div class="result-row"><span>Total a Recibir:</span> <span>Bs. ${data.total_beneficios.toFixed(2)}</span></div>
        `;
    }
}

// Módulo 5.4: Config
async function handleConfig(e) {
    e.preventDefault();
    const payload = {
        model: document.getElementById('conf-model').value,
        temperature: parseFloat(document.getElementById('conf-temp').value),
        max_tokens: parseInt(document.getElementById('conf-tokens').value)
    };
    
    const res = await fetch(`${API_BASE}/config/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (res.ok) {
        const data = await res.json();
        document.getElementById('config-msg').innerText = "Configuración guardada en memoria.";
        setTimeout(() => document.getElementById('config-msg').innerText = "", 3000);
    }
}
