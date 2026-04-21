// --- CONFIGURAÇÃO DO SUPABASE ---
const supabaseUrl = 'https://uokmwzqqwpojfxrdiuzg.supabase.co';
const supabaseKey = 'sb_publishable_SQd6xVIZnFqAbqwgFel_cw_J-cOIsPO';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Dados dinâmicos
let servers = [];
let attendanceData = [];
let attendanceChart = null;

// Lógica de Datas do Final de Semana
function getWeekendDates() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const satOffset = (6 - dayOfWeek + 7) % 7;
    const satDate = new Date(now);
    satDate.setDate(now.getDate() + satOffset);
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
const viewInscricao = document.getElementById('view-inscricao');
const viewControle = document.getElementById('view-luiggi');

const btnInscricao = document.getElementById('btn-inscricao');
const btnControle = document.getElementById('btn-controle');

const selectName = document.getElementById('select-name');
const massOptions = document.getElementById('mass-options');
const formEscala = document.getElementById('form-escala');
const massTabs = document.getElementById('mass-tabs');
const attendanceList = document.getElementById('attendance-list');
const generalStatusList = document.getElementById('general-status-list');
const publicScaleList = document.getElementById('public-scale-list');
const toast = document.getElementById('toast');

// Sub-abas Controle
const btnSubChamada = document.getElementById('btn-sub-chamada');
const btnSubRelatorio = document.getElementById('btn-sub-relatorio');
const controlChamada = document.getElementById('control-chamada');
const controlRelatorio = document.getElementById('control-relatorio');
const weekendLabel = document.getElementById('current-weekend-label');
const roleInputs = document.querySelectorAll('input[name="user-role"]');
const btnExportPdf = document.getElementById('btn-export-pdf');

// Inicialização
async function init() {
    try {
        if (weekendLabel) weekendLabel.textContent = `Final de Semana: ${dates.weekendRange}`;
        await fetchData();
        renderServerSelect();
        renderMassOptions();
        renderMassTabs();
        renderPublicScale();
        setupNavigation();
        setupRoleFilter();
        updateAttendanceList();
        updateGeneralList();
        initChart();
        
        btnExportPdf.addEventListener('click', exportToPDF);
    } catch (error) {
        console.error("Erro na inicialização:", error);
    }
}

async function fetchData() {
    try {
        const { data: sData, error: sErr } = await supabaseClient.from('servers').select('*');
        if (sErr) throw sErr;
        servers = sData || [];

        const { data: aData, error: aErr } = await supabaseClient.from('attendance').select('*');
        if (aErr) throw aErr;
        attendanceData = aData || [];
    } catch (e) {
        console.error("Erro ao buscar dados:", e);
        showToast("Erro ao conectar ao banco de dados.");
    }
}

function setupNavigation() {
    btnInscricao.addEventListener('click', () => {
        showView(viewInscricao, btnInscricao);
    });

    btnControle.addEventListener('click', () => {
        const pass = prompt("Digite a senha de acesso:");
        if (pass === "121008") {
            showView(viewControle, btnControle);
            fetchData().then(() => {
                updateAttendanceList();
                updateGeneralList();
                updateChart();
            });
        } else {
            showToast("Senha incorreta!");
        }
    });

    // Sub-navegação Controle
    btnSubChamada.addEventListener('click', () => {
        controlChamada.classList.remove('hidden');
        controlRelatorio.classList.add('hidden');
        btnSubChamada.classList.add('active');
        btnSubRelatorio.classList.remove('active');
        updateAttendanceList();
    });

    btnSubRelatorio.addEventListener('click', () => {
        controlRelatorio.classList.remove('hidden');
        controlChamada.classList.add('hidden');
        btnSubRelatorio.classList.add('active');
        btnSubChamada.classList.remove('active');
        updateChart();
        updateGeneralList();
    });
}

function showView(view, btn) {
    [viewInscricao, viewControle].forEach(v => v.classList.add('hidden'));
    [btnInscricao, btnControle].forEach(b => b.classList.remove('active'));
    view.classList.remove('hidden');
    btn.classList.add('active');
}

function setupRoleFilter() {
    roleInputs.forEach(input => {
        input.addEventListener('change', () => renderServerSelect(input.value));
    });
}

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
        if (data) attendanceData.push(...data);

        showToast("Escala salva com sucesso! ⛪");
        formEscala.reset();
        renderPublicScale();
        updateGeneralList();
        updateChart();
    } catch (err) {
        console.error("Erro ao salvar escala:", err);
        showToast("Erro ao salvar. Tente novamente.");
    } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
    }
});

// Função renderPublicScale removida pois a lista agora está na aba Escala Geral

function renderMassTabs() {
    massTabs.innerHTML = '';
    massSchedules.forEach(m => {
        const tab = document.createElement('div');
        tab.className = `tab ${selectedMassId === m.id ? 'active' : ''}`;
        tab.innerHTML = `<div>${m.dia}</div><small>${m.data} - ${m.hora}</small>`;
        tab.onclick = () => {
            selectedMassId = m.id;
            updateTabStates();
            updateAttendanceList();
            updateChart();
        };
        massTabs.appendChild(tab);
    });
}

function updateTabStates() {
    const allTabs = document.querySelectorAll('#mass-tabs .tab');
    allTabs.forEach((t, index) => {
        if (massSchedules[index].id === selectedMassId) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });
}

// Funções de Abas do Relatório removidas para foco no gráfico geral do final de semana

function updateAttendanceList() {
    const list = attendanceData.filter(a => a.mass_id === selectedMassId);
    attendanceList.innerHTML = '';

    if (list.length === 0) {
        attendanceList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">Ninguém escalado para esta missa ainda.</p>';
        return;
    }

    list.forEach(entry => {
        const server = servers.find(s => s.id === entry.server_id);
        if (!server) return;
        
        const item = document.createElement('div');
        item.className = 'attendance-item';
        const roleClass = server.cargo === 'Acólito' ? 'role-acolito' : 'role-coroinha';
        
        item.innerHTML = `
            <div class="person-info">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <h4>${server.nome}</h4>
                    <span class="badge ${roleClass}">${server.cargo}</span>
                </div>
                <p>Status: ${entry.status === 'present' ? 'Confirmado' : entry.status === 'absent' ? 'Ausente' : 'Aguardando'}</p>
            </div>
            <div class="status-buttons">
                <button class="status-btn ${entry.status === 'present' ? 'confirmed' : ''}" onclick="setStatus(${entry.server_id}, '${entry.mass_id}', 'present')">Confirmar</button>
                <button class="status-btn ${entry.status === 'absent' ? 'absent' : ''}" onclick="setStatus(${entry.server_id}, '${entry.mass_id}', 'absent')">Ausente</button>
            </div>
        `;
        attendanceList.appendChild(item);
    });
}

function renderPublicScale() {
    publicScaleList.innerHTML = '';
    
    // Agrupar inscrições por servidor e missa
    const attendanceMap = {};
    attendanceData.forEach(entry => {
        if (!attendanceMap[entry.server_id]) attendanceMap[entry.server_id] = {};
        attendanceMap[entry.server_id][entry.mass_id] = entry.status;
    });

    const sortedServers = [...servers].sort((a,b) => a.nome.localeCompare(b.nome));

    // Header
    const header = document.createElement('div');
    header.className = 'scale-header';
    header.innerHTML = `
        <span>Nome</span>
        <span>Sáb ${dates.sab}<br>17:00</span>
        <span>Dom ${dates.dom}<br>09:00</span>
        <span>Dom ${dates.dom}<br>11:00</span>
        <span>Dom ${dates.dom}<br>18:00</span>
    `;
    publicScaleList.appendChild(header);

    sortedServers.forEach(server => {
        const div = document.createElement('div');
        div.className = 'scale-row';
        
        const massIds = ['sab-17', 'dom-09', 'dom-11', 'dom-18'];
        let html = `<span class="scale-name">${server.nome}</span>`;
        
        massIds.forEach(mId => {
            const status = attendanceMap[server.id] ? attendanceMap[server.id][mId] : null;
            let icon = 'I';
            let cls = 'status-none';
            
            if (status === 'present') {
                icon = 'P';
                cls = 'status-present';
            } else if (status === 'absent') {
                icon = 'A';
                cls = 'status-absent';
            } else if (status === 'pending' || status === 'pretended') {
                icon = '✔';
                cls = 'status-present';
            }
            
            html += `<div class="scale-col"><span class="status-icon ${cls}">${icon}</span></div>`;
        });
        
        div.innerHTML = html;
        publicScaleList.appendChild(div);
    });
}

function updateGeneralList() {
    generalStatusList.innerHTML = '';
    
    // Agrupar dias por servidor
    const grouped = {};
    attendanceData.forEach(entry => {
        if (!grouped[entry.server_id]) grouped[entry.server_id] = [];
        grouped[entry.server_id].push(entry);
    });

    const sortedServers = [...servers].sort((a,b) => a.nome.localeCompare(b.nome));
    
    sortedServers.forEach(server => {
        const serverEntries = grouped[server.id] || [];
        
        let statusText = 'Inativo';
        let statusClass = 'role-inativo';
        let daysText = 'Não se inscreveu';

        if (serverEntries.length > 0) {
            // Se tiver pelo menos uma inscrição para o final de semana atual
            daysText = serverEntries.map(e => {
                const m = massSchedules.find(ms => ms.id === e.mass_id);
                return m ? `${m.dia} ${m.data} (${m.hora})` : '';
            }).filter(d => d !== '').join(', ');

            // Status Agregado do Final de Semana
            const hasConfirmed = serverEntries.some(e => e.status === 'present');
            const hasAbsent = serverEntries.some(e => e.status === 'absent');
            const hasPending = serverEntries.some(e => e.status === 'pretended');

            if (hasConfirmed) {
                statusText = 'Confirmado (Fim de Semana)';
                statusClass = 'role-presente';
            } else if (hasAbsent) {
                statusText = 'Ausente (Fim de Semana)';
                statusClass = 'role-ausente';
            } else if (hasPending) {
                statusText = 'Aguardando Confirmação';
                statusClass = 'role-aguardando';
            }
        }

        const item = document.createElement('div');
        item.className = 'attendance-item';
        const roleClass = server.cargo === 'Acólito' ? 'role-acolito' : 'role-coroinha';

        item.innerHTML = `
            <div class="person-info">
                <div class="person-name-row" style="display: flex; align-items: center; gap: 8px;">
                    <h4>${server.nome}</h4>
                    <span class="badge ${roleClass}">${server.cargo}</span>
                </div>
                <p style="margin-top: 5px; font-weight: 600;">Dias: ${daysText}</p>
            </div>
            <span class="badge ${statusClass}">${statusText}</span>
        `;
        generalStatusList.appendChild(item);
    });
}

window.setStatus = async function(serverId, massId, status) {
    const entry = attendanceData.find(a => a.server_id === serverId && a.mass_id === massId);
    if (entry) {
        const isConfirmed = (status === 'present');
        try {
            const { error } = await supabaseClient
                .from('attendance')
                .update({ status: status, confirmed: isConfirmed })
                .eq('id', entry.id);

            if (error) throw error;

            entry.status = status;
            entry.confirmed = isConfirmed;
            updateAttendanceList();
            updateGeneralList();
            updateChart();
        } catch (e) {
            console.error("Erro ao atualizar status", e);
            showToast("Erro ao atualizar.");
        }
    }
};

function initChart() {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    attendanceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Com Escala (Presença Confirmada)', 'Com Escala (Aguardando/Ausente)', 'Não se Inscreveram'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#27ae60', '#f1c40f', '#95a5a6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function updateChart() {
    if (!attendanceChart) return;
    
    // Agrupar inscrições por servidor
    const grouped = {};
    attendanceData.forEach(entry => {
        if (!grouped[entry.server_id]) grouped[entry.server_id] = [];
        grouped[entry.server_id].push(entry);
    });

    let confirmedCount = 0; // Pelo menos uma missa confirmada
    let pendingCount = 0;   // Inscrito mas nada confirmado ainda
    let inactiveCount = 0;  // Zero inscrições

    servers.forEach(server => {
        const entries = grouped[server.id] || [];
        if (entries.length === 0) {
            inactiveCount++;
        } else if (entries.some(e => e.status === 'present')) {
            confirmedCount++;
        } else {
            pendingCount++;
        }
    });

    attendanceChart.data.datasets[0].data = [confirmedCount, pendingCount, inactiveCount];
    attendanceChart.update();
}

function exportToPDF() {
    const element = document.getElementById('view-luiggi');
    const opt = {
        margin: 10,
        filename: `Escala_Geral_Controle.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

init();
