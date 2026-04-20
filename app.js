// --- CONFIGURAÇÃO DO SUPABASE ---
// COLE AQUI A URL E A CHAVE ANON DO SEU PROJETO SUPABASE
const supabaseUrl = 'https://uokmwzqqwpojfxrdiuzg.supabase.co';
const supabaseKey = 'sb_publishable_SQd6xVIZnFqAbqwgFel_cw_J-cOIsPO';

// IMPORTANTE: usamos 'supabaseClient' para não dar conflito com a variável global
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Dados dinâmicos
let servers = [];
let attendanceData = [];

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
async function init() {
    try {
        if (weekendLabel) weekendLabel.textContent = `Final de Semana: ${dates.weekendRange}`;
        
        await fetchData();

        renderServerSelect(); // Renderiza com o cargo padrão (Coroinha)
        renderMassOptions();
        renderMassTabs();
        setupNavigation();
        setupRoleFilter();
        updateAttendanceList();
    } catch (error) {
        console.error("Erro na inicialização:", error);
    }
}

// Buscar Dados do Supabase
async function fetchData() {
    try {
        const { data: sData, error: sErr } = await supabaseClient.from('servers').select('*');
        if (sErr) throw sErr;
        if (sData) servers = sData;

        const { data: aData, error: aErr } = await supabaseClient.from('attendance').select('*');
        if (aErr) throw aErr;
        if (aData) attendanceData = aData;
    } catch (e) {
        console.error("Erro ao buscar dados:", e);
        showToast("Erro ao conectar ao banco de dados.");
    }
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
        fetchData().then(() => updateAttendanceList()); // Recarrega dados ao abrir painel
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
formEscala.addEventListener('submit', async (e) => {
    e.preventDefault();
    const serverId = selectName.value;
    const selectedMasses = Array.from(document.querySelectorAll('input[name="mass"]:checked')).map(i => i.value);

    if (selectedMasses.length === 0) {
        showToast("Selecione pelo menos uma missa!");
        return;
    }

    const btnSubmit = formEscala.querySelector('button[type="submit"]');
    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = "Salvando...";
    btnSubmit.disabled = true;

    try {
        // Remover escalas anteriores do usuário
        await supabaseClient.from('attendance').delete().eq('server_id', serverId);

        attendanceData = attendanceData.filter(item => item.server_id != serverId);

        const newEntries = selectedMasses.map(mId => ({
            server_id: parseInt(serverId),
            mass_id: mId,
            status: 'pretended',
            confirmed: false
        }));

        const { data, error } = await supabaseClient.from('attendance').insert(newEntries).select();
        
        if (error) throw error;
        
        if (data) {
             attendanceData.push(...data);
        }

        showToast("Escala salva com sucesso! ⛪");
        formEscala.reset();
    } catch (err) {
        console.error("Erro ao salvar escala:", err);
        showToast("Erro ao salvar. Tente novamente.");
    } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
    }
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
    const list = attendanceData.filter(a => a.mass_id === selectedMassId);
    attendanceList.innerHTML = '';

    if (list.length === 0) {
        attendanceList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">Ninguém escalado para esta missa ainda.</p>';
        return;
    }

    list.forEach(entry => {
        const server = servers.find(s => s.id === entry.server_id);
        if (!server) return; // Segurança caso o servidor não exista
        
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
            <button class="check-btn ${entry.confirmed ? 'present' : ''}" onclick="togglePresence(${entry.server_id}, '${entry.mass_id}')">
                ${entry.confirmed ? '✅ Confirmado' : 'Confirmar'}
            </button>
        `;
        attendanceList.appendChild(item);
    });
}

window.togglePresence = async function(serverId, massId) {
    const entry = attendanceData.find(a => a.server_id === serverId && a.mass_id === massId);
    if (entry) {
        const newConfirmedStatus = !entry.confirmed;
        
        try {
            const { error } = await supabaseClient
                .from('attendance')
                .update({ confirmed: newConfirmedStatus })
                .eq('id', entry.id);

            if (error) throw error;

            entry.confirmed = newConfirmedStatus;
            updateAttendanceList();
        } catch (e) {
            console.error("Erro ao atualizar presença", e);
            showToast("Erro ao atualizar.");
        }
    }
};

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Inicia o app
init();
