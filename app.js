// Dados Iniciais e Mock
const servers = [
    { id: 1, nome: "João Silva", cargo: "Coroinha" },
    { id: 2, nome: "Maria Oliveira", cargo: "Acólito" },
    { id: 3, nome: "Pedro Santos", cargo: "Coroinha" },
    { id: 4, nome: "Ana Costa", cargo: "Acólito" },
    { id: 5, nome: "Lucas Lima", cargo: "Coroinha" },
];

// Lógica de Datas do Final de Semana
function getWeekendDates() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (Dom) a 6 (Sáb)
    
    // Calcula o próximo sábado (ou hoje se for sábado)
    const satOffset = (6 - dayOfWeek + 7) % 7;
    const satDate = new Date(now);
    satDate.setDate(now.getDate() + satOffset);
    
    // Domingo é o dia seguinte ao sábado
    const sunDate = new Date(satDate);
    sunDate.setDate(satDate.getDate() + 1);
    
    const format = (d) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    
    return {
        sab: format(satDate),
        dom: format(sunDate),
        weekendRange: `${format(satDate)} e ${format(sunDate)}`
    };
}

const dates = getWeekendDates();

const massSchedules = [
    { id: 'sab-17', dia: 'Sábado', data: dates.sab, hora: '17:00' },
    { id: 'dom-09', dia: 'Domingo', data: dates.dom, hora: '09:00' },
    { id: 'dom-11', dia: 'Domingo', data: dates.dom, hora: '11:00' },
    { id: 'dom-18', dia: 'Domingo', data: dates.dom, hora: '18:00' },
];

// Estado da Aplicação
let attendanceData = JSON.parse(localStorage.getItem('attendance_data')) || [];
let selectedMassId = 'sab-17';

// Elementos do DOM
const viewCoroinha = document.getElementById('view-coroinha');
const viewLuiggi = document.getElementById('view-luiggi');
const btnCoroinha = document.getElementById('btn-coroinha');
const btnLuiggi = document.getElementById('btn-luiggi');
const selectName = document.getElementById('select-name');
const massOptions = document.getElementById('mass-options');
const formEscala = document.getElementById('form-escala');
const massTabs = document.getElementById('mass-tabs');
const attendanceList = document.getElementById('attendance-list');
const toast = document.getElementById('toast');
const weekendLabel = document.getElementById('current-weekend-label');
const roleInputs = document.querySelectorAll('input[name="user-role"]');

// Inicialização
function init() {
    if (weekendLabel) weekendLabel.textContent = `Final de Semana: ${dates.weekendRange}`;
    renderServerSelect(); // Renderiza com o cargo padrão (Coroinha)
    renderMassOptions();
    renderMassTabs();
    setupNavigation();
    setupRoleFilter();
    updateAttendanceList();
}

// Navegação entre abas principais
function setupNavigation() {
    btnCoroinha.addEventListener('click', () => {
        viewCoroinha.classList.remove('hidden');
        viewLuiggi.classList.add('hidden');
        btnCoroinha.classList.add('active');
        btnLuiggi.classList.remove('active');
    });

    btnLuiggi.addEventListener('click', () => {
        viewLuiggi.classList.remove('hidden');
        viewCoroinha.classList.add('hidden');
        btnLuiggi.classList.add('active');
        btnCoroinha.classList.remove('active');
        updateAttendanceList();
    });
}

// Filtra a lista de nomes quando o cargo muda
function setupRoleFilter() {
    roleInputs.forEach(input => {
        input.addEventListener('change', () => {
            renderServerSelect(input.value);
        });
    });
}

// Renderiza a lista de nomes no formulário (filtrada por cargo)
function renderServerSelect(filterRole = "Coroinha") {
    selectName.innerHTML = '<option value="" disabled selected>Escolha seu nome...</option>';
    
    servers
        .filter(s => s.cargo === filterRole)
        .sort((a,b) => a.nome.localeCompare(b.nome))
        .forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.nome;
            selectName.appendChild(opt);
        });
}

// Renderiza os cards de seleção de missa com DATA
function renderMassOptions() {
    massOptions.innerHTML = '';
    massSchedules.forEach(m => {
        const div = document.createElement('div');
        div.className = 'mass-item';
        div.innerHTML = `
            <input type="checkbox" id="check-${m.id}" name="mass" value="${m.id}">
            <label for="check-${m.id}" class="mass-label">
                <span>${m.dia} (${m.data})</span>
                <span>${m.hora}</span>
            </label>
        `;
        massOptions.appendChild(div);
    });
}

// Lida com o envio do formulário
formEscala.addEventListener('submit', (e) => {
    e.preventDefault();
    const serverId = selectName.value;
    const selectedMasses = Array.from(document.querySelectorAll('input[name="mass"]:checked')).map(i => i.value);

    if (selectedMasses.length === 0) {
        showToast("Selecione pelo menos uma missa!");
        return;
    }

    attendanceData = attendanceData.filter(item => item.serverId != serverId);

    selectedMasses.forEach(mId => {
        attendanceData.push({
            serverId: parseInt(serverId),
            massId: mId,
            status: 'pretended',
            confirmed: false
        });
    });

    saveData();
    showToast("Escala salva com sucesso! ⛪");
    formEscala.reset();
});

// --- Lógica do Luiggi (Dashboard) ---

function renderMassTabs() {
    massTabs.innerHTML = '';
    massSchedules.forEach(m => {
        const tab = document.createElement('div');
        tab.className = `tab ${selectedMassId === m.id ? 'active' : ''}`;
        tab.innerHTML = `<div>${m.dia}</div><small>${m.data} - ${m.hora}</small>`;
        tab.onclick = () => {
            selectedMassId = m.id;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateAttendanceList();
        };
        massTabs.appendChild(tab);
    });
}

function updateAttendanceList() {
    const list = attendanceData.filter(a => a.massId === selectedMassId);
    attendanceList.innerHTML = '';

    if (list.length === 0) {
        attendanceList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">Ninguém escalado para esta missa ainda.</p>';
        return;
    }

    list.forEach(entry => {
        const server = servers.find(s => s.id === entry.serverId);
        const item = document.createElement('div');
        item.className = 'attendance-item';
        
        // Badge de Cargo
        const roleClass = server.cargo === 'Acólito' ? 'role-acolito' : 'role-coroinha';
        
        item.innerHTML = `
            <div class="person-info">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <h4>${server.nome}</h4>
                    <span class="badge ${roleClass}">${server.cargo}</span>
                </div>
                <p>Status: ${entry.confirmed ? 'Presente' : 'Aguardando'}</p>
            </div>
            <button class="check-btn ${entry.confirmed ? 'present' : ''}" onclick="togglePresence(${entry.serverId}, '${entry.massId}')">
                ${entry.confirmed ? '✅ Confirmado' : 'Confirmar'}
            </button>
        `;
        attendanceList.appendChild(item);
    });
}

window.togglePresence = function(serverId, massId) {
    const entry = attendanceData.find(a => a.serverId === serverId && a.massId === massId);
    if (entry) {
        entry.confirmed = !entry.confirmed;
        saveData();
        updateAttendanceList();
    }
};

function saveData() {
    localStorage.setItem('attendance_data', JSON.stringify(attendanceData));
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

init();
