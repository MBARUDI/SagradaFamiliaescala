// --- CONFIGURAÇÃO DO SUPABASE ---
const supabaseUrl = 'https://uokmwzqqwpojfxrdiuzg.supabase.co';
const supabaseKey = 'sb_publishable_SQd6xVIZnFqAbqwgFel_cw_J-cOIsPO';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Dados dinâmicos
let servers = [];
let attendanceData = [];
let specialMasses = [];
let attendanceChart = null;
let currentMode = 'weekend'; // 'weekend' ou 'special'
let currentSpecialMassId = null;

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
const viewSelection = document.getElementById('view-selection');
const viewInscricao = document.getElementById('view-inscricao');
const viewControle = document.getElementById('view-luiggi');

const btnSelectWeekend = document.getElementById('btn-select-weekend');
const btnSelectSpecial = document.getElementById('btn-select-special');
const btnAdminAccess = document.getElementById('btn-admin-access');
const btnsBack = document.querySelectorAll('.btn-back');

const inscricaoTitle = document.getElementById('inscricao-title');
const inscricaoSubtitle = document.getElementById('inscricao-subtitle');
const specialMassPickerContainer = document.getElementById('special-mass-picker-container');
const selectSpecialMass = document.getElementById('select-special-mass');

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
const btnSubEspecial = document.getElementById('btn-sub-especial');
const btnSubRelatorio = document.getElementById('btn-sub-relatorio');
const controlChamada = document.getElementById('control-chamada');
const controlEspecial = document.getElementById('control-especial');
const controlRelatorio = document.getElementById('control-relatorio');
const weekendLabel = document.getElementById('current-weekend-label');
const roleInputs = document.querySelectorAll('input[name="user-role"]');
const btnExportPdf = document.getElementById('btn-export-pdf');

// Form Missa Especial
const formSpecialMass = document.getElementById('form-special-mass');
const specialMassList = document.getElementById('special-mass-list');

// Inicialização
async function init() {
    try {
        if (weekendLabel) weekendLabel.textContent = `Final de Semana: ${dates.weekendRange}`;
        await fetchData();
        setupNavigation();
        setupRoleFilter();
        setupSpecialMassForm();
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

        const { data: mData, error: mErr } = await supabaseClient.from('special_masses').select('*').order('mass_date', { ascending: true });
        if (mErr) throw mErr;
        specialMasses = mData || [];
        
        renderSpecialMassSelect();
        renderSpecialMassListAdmin();
    } catch (e) {
        console.error("Erro ao buscar dados:", e);
        showToast("Erro ao conectar ao banco de dados.");
    }
}

function setupNavigation() {
    btnSelectWeekend.addEventListener('click', () => {
        currentMode = 'weekend';
        inscricaoTitle.textContent = "Escala do Final de Semana";
        inscricaoSubtitle.textContent = "Selecione seu nome e as missas que você pode servir.";
        specialMassPickerContainer.classList.add('hidden');
        document.getElementById('label-quais-missas').classList.remove('hidden');
        showView(viewInscricao);
        renderServerSelect();
        renderMassOptions();
        renderPublicScale();
    });

    btnSelectSpecial.addEventListener('click', () => {
        currentMode = 'special';
        inscricaoTitle.textContent = "Missa Especial";
        inscricaoSubtitle.textContent = "Selecione a missa, seu nome e informe se estará presente.";
        specialMassPickerContainer.classList.remove('hidden');
        document.getElementById('label-quais-missas').classList.add('hidden');
        showView(viewInscricao);
        renderServerSelect();
        renderMassOptions();
        renderPublicScale();
    });

    btnAdminAccess.addEventListener('click', () => {
        const pass = prompt("Digite a senha de acesso:");
        if (pass === "121008") {
            showView(viewControle);
            fetchData().then(() => {
                renderMassTabs();
                updateAttendanceList();
                updateGeneralList();
                updateChart();
            });
        } else {
            showToast("Senha incorreta!");
        }
    });

    btnsBack.forEach(btn => {
        btn.addEventListener('click', () => {
            showView(viewSelection);
        });
    });

    // Sub-navegação Controle
    btnSubChamada.addEventListener('click', () => {
        showControlSection(controlChamada, btnSubChamada);
        renderMassTabs();
        updateAttendanceList();
    });

    btnSubEspecial.addEventListener('click', () => {
        showControlSection(controlEspecial, btnSubEspecial);
        renderSpecialMassListAdmin();
    });

    btnSubRelatorio.addEventListener('click', () => {
        showControlSection(controlRelatorio, btnSubRelatorio);
        updateChart();
        updateGeneralList();
    });
}

function showView(view) {
    [viewSelection, viewInscricao, viewControle].forEach(v => v.classList.add('hidden'));
    view.classList.remove('hidden');
}

function showControlSection(section, btn) {
    [controlChamada, controlEspecial, controlRelatorio].forEach(s => s.classList.add('hidden'));
    [btnSubChamada, btnSubEspecial, btnSubRelatorio].forEach(b => b.classList.remove('active'));
    section.classList.remove('hidden');
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

function renderSpecialMassSelect() {
    selectSpecialMass.innerHTML = '<option value="" disabled selected>Escolha a missa especial...</option>';
    if (specialMasses.length === 0) {
        selectSpecialMass.innerHTML = '<option value="" disabled>Nenhuma missa especial cadastrada</option>';
        return;
    }
    specialMasses.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        const [y, mon, d] = m.mass_date.split('-');
        opt.textContent = `${m.description} (${d}/${mon} às ${m.mass_time.substring(0,5)})`;
        selectSpecialMass.appendChild(opt);
    });

    selectSpecialMass.onchange = () => {
        currentSpecialMassId = selectSpecialMass.value;
        renderMassOptions();
        renderPublicScale();
    };
}

function renderMassOptions() {
    massOptions.innerHTML = '';
    
    if (currentMode === 'weekend') {
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
    } else if (currentMode === 'special' && currentSpecialMassId) {
        // Para missa especial, mostramos apenas duas opções: Presente ou Ausente
        const div = document.createElement('div');
        div.className = 'options-grid';
        div.style.gridTemplateColumns = '1fr 1fr';
        div.style.width = '100%';
        div.innerHTML = `
            <div class="mass-item">
                <input type="radio" id="special-present" name="special-status" value="present" checked>
                <label for="special-present" class="mass-label">
                    <span>Estarei Presente</span>
                    <span>Confirmar presença</span>
                </label>
            </div>
            <div class="mass-item">
                <input type="radio" id="special-absent" name="special-status" value="absent">
                <label for="special-absent" class="mass-label">
                    <span>Estarei Ausente</span>
                    <span>Informar falta</span>
                </label>
            </div>
        `;
        massOptions.appendChild(div);
    } else if (currentMode === 'special') {
        massOptions.innerHTML = '<p style="text-align:center; color:#7f8c8d;">Selecione uma missa especial acima primeiro.</p>';
    }
}

formEscala.addEventListener('submit', async (e) => {
    e.preventDefault();
    const serverId = selectName.value;
    
    let selectedEntries = [];
    
    if (currentMode === 'weekend') {
        const selectedMasses = Array.from(document.querySelectorAll('input[name="mass"]:checked')).map(i => i.value);
        if (selectedMasses.length === 0) {
            showToast("Selecione pelo menos uma missa!");
            return;
        }
        selectedEntries = selectedMasses.map(mId => ({
            server_id: parseInt(serverId),
            mass_id: mId,
            status: 'pretended',
            confirmed: false
        }));
    } else {
        if (!currentSpecialMassId) {
            showToast("Selecione a missa especial!");
            return;
        }
        const status = document.querySelector('input[name="special-status"]:checked').value;
        selectedEntries = [{
            server_id: parseInt(serverId),
            mass_id: `special-${currentSpecialMassId}`,
            status: status,
            confirmed: (status === 'present')
        }];
    }

    const btnSubmit = formEscala.querySelector('button[type="submit"]');
    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = "Salvando...";
    btnSubmit.disabled = true;

    try {
        // Para final de semana, removemos as inscrições anteriores de final de semana
        if (currentMode === 'weekend') {
            const weekendIds = massSchedules.map(m => m.id);
            await supabaseClient.from('attendance').delete().eq('server_id', serverId).in('mass_id', weekendIds);
            attendanceData = attendanceData.filter(item => item.server_id != serverId || !weekendIds.includes(item.mass_id));
        } else {
            // Para especial, removemos apenas a inscrição dessa missa especial específica
            const mId = `special-${currentSpecialMassId}`;
            await supabaseClient.from('attendance').delete().eq('server_id', serverId).eq('mass_id', mId);
            attendanceData = attendanceData.filter(item => item.server_id != serverId || item.mass_id != mId);
        }

        const { data, error } = await supabaseClient.from('attendance').insert(selectedEntries).select();
        if (error) throw error;
        if (data) attendanceData.push(...data);

        // Mensagem customizada conforme solicitado
        if (currentMode === 'special') {
            const m = specialMasses.find(sm => sm.id == currentSpecialMassId);
            const massName = m ? m.description : "Missa Especial";
            const status = document.querySelector('input[name="special-status"]:checked').value;
            if (status === 'present') {
                showToast(`Você foi cadastrado como presente na ${massName}! 🌟`);
            } else {
                showToast("Sua ausência foi informada com sucesso.");
            }
        } else {
            const selectedMassesIds = Array.from(document.querySelectorAll('input[name="mass"]:checked')).map(i => i.value);
            const chosenDetails = selectedMassesIds.map(id => {
                const m = massSchedules.find(ms => ms.id === id);
                return m ? `${m.dia} (${m.hora})` : '';
            }).filter(d => d !== '').join(', ');
            
            showToast(`Inscrito com sucesso nas missas: ${chosenDetails} ⛪`);
        }

        formEscala.reset();
        // Não resetamos mais o currentSpecialMassId para permitir que o servidor veja sua marcação na agenda
        if (currentMode === 'special') {
            renderSpecialMassSelect();
            // Restauramos o valor selecionado no select para manter a visualização
            selectSpecialMass.value = currentSpecialMassId;
        }
        renderMassOptions();
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

function renderMassTabs() {
    massTabs.innerHTML = '';
    
    // Adiciona abas do final de semana
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

    // Adiciona abas das missas especiais
    specialMasses.forEach(m => {
        const mId = `special-${m.id}`;
        const tab = document.createElement('div');
        tab.className = `tab ${selectedMassId === mId ? 'active' : ''}`;
        const [y, mon, d] = m.mass_date.split('-');
        tab.innerHTML = `<div>${m.description}</div><small>${d}/${mon} - ${m.mass_time.substring(0,5)}</small>`;
        tab.onclick = () => {
            selectedMassId = mId;
            updateTabStates();
            updateAttendanceList();
            updateChart();
        };
        massTabs.appendChild(tab);
    });
}

function updateTabStates() {
    const allTabs = document.querySelectorAll('#mass-tabs .tab');
    const combinedSchedules = [
        ...massSchedules.map(m => m.id),
        ...specialMasses.map(m => `special-${m.id}`)
    ];
    
    allTabs.forEach((t, index) => {
        if (combinedSchedules[index] === selectedMassId) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });
}

function updateAttendanceList() {
    const list = attendanceData.filter(a => a.mass_id === selectedMassId);
    attendanceList.innerHTML = '';

    if (list.length === 0) {
        attendanceList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">Ninguém escalado para esta missa ainda.</p>';
        return;
    }

    // Dividir por cargo
    const acolitos = list.filter(a => {
        const s = servers.find(srv => srv.id === a.server_id);
        return s && s.cargo === 'Acólito';
    }).sort((a,b) => {
        const sa = servers.find(s => s.id === a.server_id);
        const sb = servers.find(s => s.id === b.server_id);
        return sa.nome.localeCompare(sb.nome);
    });

    const coroinhas = list.filter(a => {
        const s = servers.find(srv => srv.id === a.server_id);
        return s && s.cargo === 'Coroinha';
    }).sort((a,b) => {
        const sa = servers.find(s => s.id === a.server_id);
        const sb = servers.find(s => s.id === b.server_id);
        return sa.nome.localeCompare(sb.nome);
    });

    const renderSection = (title, items) => {
        if (items.length === 0) return;
        const h = document.createElement('h4');
        h.style.margin = "20px 0 10px 0";
        h.style.color = "var(--primary)";
        h.style.borderBottom = "2px solid var(--secondary)";
        h.style.paddingBottom = "5px";
        h.textContent = title;
        attendanceList.appendChild(h);

        items.forEach(entry => {
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
    };

    renderSection("Acólitos", acolitos);
    renderSection("Coroinhas", coroinhas);
}

function renderPublicScale() {
    publicScaleList.innerHTML = '';
    
    const attendanceMap = {};
    attendanceData.forEach(entry => {
        if (!attendanceMap[entry.server_id]) attendanceMap[entry.server_id] = {};
        attendanceMap[entry.server_id][entry.mass_id] = entry.status;
    });

    const sortedServers = [...servers].sort((a,b) => a.nome.localeCompare(b.nome));

    let massIds = [];
    let headers = ['Nome'];

    if (currentMode === 'weekend') {
        massIds = ['sab-17', 'dom-09', 'dom-11', 'dom-18'];
        headers.push(`Sáb ${dates.sab}<br>17:00`, `Dom ${dates.dom}<br>09:00`, `Dom ${dates.dom}<br>11:00`, `Dom ${dates.dom}<br>18:00`);
    } else {
        if (!currentSpecialMassId) {
            publicScaleList.innerHTML = '<p style="text-align:center; padding:20px;">Selecione uma missa especial para ver a agenda.</p>';
            return;
        }
        const m = specialMasses.find(sm => sm.id == currentSpecialMassId);
        const [y, mon, d] = m.mass_date.split('-');
        massIds = [`special-${currentSpecialMassId}`];
        headers.push(`${m.description}<br>${d}/${mon} ${m.mass_time.substring(0,5)}`);
    }

    const header = document.createElement('div');
    header.className = 'scale-header';
    header.style.gridTemplateColumns = `160px repeat(${massIds.length}, 1fr)`;
    if (window.innerWidth <= 768) header.style.gridTemplateColumns = `85px repeat(${massIds.length}, 1fr)`;

    headers.forEach((h, i) => {
        const span = document.createElement('span');
        span.innerHTML = h;
        header.appendChild(span);
    });
    publicScaleList.appendChild(header);

    sortedServers.forEach(server => {
        const div = document.createElement('div');
        div.className = 'scale-row';
        div.style.gridTemplateColumns = header.style.gridTemplateColumns;
        
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
            daysText = serverEntries.map(e => {
                if (e.mass_id.startsWith('special-')) {
                    const id = e.mass_id.replace('special-', '');
                    const m = specialMasses.find(sm => sm.id == id);
                    if (!m) return '';
                    const [y, mon, d] = m.mass_date.split('-');
                    return `${m.description} (${d}/${mon})`;
                } else {
                    const m = massSchedules.find(ms => ms.id === e.mass_id);
                    return m ? `${m.dia} ${m.data}` : '';
                }
            }).filter(d => d !== '').join(', ');

            const hasConfirmed = serverEntries.some(e => e.status === 'present');
            const hasAbsent = serverEntries.some(e => e.status === 'absent');
            const hasPending = serverEntries.some(e => e.status === 'pretended');

            if (hasConfirmed) {
                statusText = 'Confirmado';
                statusClass = 'role-presente';
            } else if (hasAbsent) {
                statusText = 'Ausente';
                statusClass = 'role-ausente';
            } else if (hasPending) {
                statusText = 'Aguardando';
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
                <p style="margin-top: 5px; font-weight: 600;">Escalado em: ${daysText}</p>
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

function setupSpecialMassForm() {
    formSpecialMass.addEventListener('submit', async (e) => {
        e.preventDefault();
        const desc = document.getElementById('special-desc').value;
        const date = document.getElementById('special-date').value;
        const time = document.getElementById('special-time').value;

        const btn = formSpecialMass.querySelector('button');
        btn.disabled = true;
        btn.textContent = "Criando...";

        try {
            const { data, error } = await supabaseClient
                .from('special_masses')
                .insert([{ description: desc, mass_date: date, mass_time: time }])
                .select();

            if (error) throw error;
            
            showToast("Missa especial criada com sucesso! 🌟");
            formSpecialMass.reset();
            await fetchData();
            renderSpecialMassListAdmin();
        } catch (err) {
            console.error(err);
            const errorMsg = err.message || "Erro desconhecido";
            showToast(`Erro: ${errorMsg}`);
            
            if (errorMsg.includes("404") || errorMsg.includes("not found")) {
                showToast("Erro: A tabela 'special_masses' não foi encontrada no banco.");
            }
        } finally {
            btn.disabled = false;
            btn.textContent = "Criar Missa Especial";
        }
    });
}

function renderSpecialMassListAdmin() {
    specialMassList.innerHTML = '';
    if (specialMasses.length === 0) {
        specialMassList.innerHTML = '<p style="text-align:center; padding:20px;">Nenhuma missa especial cadastrada.</p>';
        return;
    }

    specialMasses.forEach(m => {
        const item = document.createElement('div');
        item.className = 'attendance-item';
        const [y, mon, d] = m.mass_date.split('-');
        item.innerHTML = `
            <div class="person-info">
                <h4>${m.description}</h4>
                <p>${d}/${mon}/${y} às ${m.mass_time.substring(0,5)}</p>
            </div>
            <button class="status-btn absent" onclick="deleteSpecialMass(${m.id})">Excluir</button>
        `;
        specialMassList.appendChild(item);
    });
}

window.deleteSpecialMass = async function(id) {
    if (!confirm("Tem certeza que deseja excluir esta missa especial e todas as suas presenças?")) return;
    
    try {
        const mId = `special-${id}`;
        await supabaseClient.from('attendance').delete().eq('mass_id', mId);
        const { error } = await supabaseClient.from('special_masses').delete().eq('id', id);
        if (error) throw error;
        
        showToast("Missa excluída!");
        await fetchData();
        renderSpecialMassListAdmin();
    } catch (err) {
        console.error(err);
        showToast("Erro ao excluir.");
    }
};

function initChart() {
    const canvas = document.getElementById('attendanceChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    attendanceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Confirmados', 'Aguardando/Ausente', 'Não Inscritos'],
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
    
    const grouped = {};
    attendanceData.forEach(entry => {
        if (!grouped[entry.server_id]) grouped[entry.server_id] = [];
        grouped[entry.server_id].push(entry);
    });

    let confirmedCount = 0;
    let pendingCount = 0;
    let inactiveCount = 0;

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
        filename: `Escala_Geral_SagradaFamilia.pdf`,
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
