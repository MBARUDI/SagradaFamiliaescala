// --- CONFIGURAÇÃO DO SUPABASE ---
const supabaseUrl = 'https://uokmwzqqwpojfxrdiuzg.supabase.co';
const supabaseKey = 'sb_publishable_SQd6xVIZnFqAbqwgFel_cw_J-cOIsPO';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Dados dinâmicos
let servers = [];
let attendanceData = [];
let specialMasses = [];
let attendanceChart = null;
let currentMode = 'month'; // 'month' (mensal) ou 'special'
let currentSpecialMassId = null;

// Gestão de Mês e Ano
let selectedYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth(); // 0 a 11
let massSchedules = [];
let weekendGroups = [];
let selectedMassId = null;
let currentScaleFilter = 'all'; // 'all' ou número do weekendIndex
let adminMassFilter = 'all';

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Cálculo e Geração das Missas do Mês
function calculateMonthMassSchedules(year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const schedules = [];
    const groups = [];
    
    let currentGroup = null;
    let weekendCount = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const dayOfWeek = d.getDay(); // 0=Dom, 6=Sáb
        
        const dd = String(day).padStart(2, '0');
        const mm = String(month + 1).padStart(2, '0');
        const yyyy = year;
        const dateFormatted = `${dd}/${mm}`;
        const isoDate = `${yyyy}-${mm}-${dd}`;
        
        if (dayOfWeek === 6) { // Sábado
            weekendCount++;
            currentGroup = {
                index: weekendCount,
                dates: [dateFormatted],
                masses: []
            };
            groups.push(currentGroup);
            
            const mass = {
                id: `sab-17-${isoDate}`,
                dia: 'Sábado',
                data: dateFormatted,
                hora: '17:00',
                isoDate: isoDate,
                dayOfWeek: 6,
                weekendIndex: weekendCount
            };
            schedules.push(mass);
            currentGroup.masses.push(mass);
        } else if (dayOfWeek === 0) { // Domingo
            if (!currentGroup) {
                weekendCount++;
                currentGroup = {
                    index: weekendCount,
                    dates: [dateFormatted],
                    masses: []
                };
                groups.push(currentGroup);
            } else {
                currentGroup.dates.push(dateFormatted);
            }
            
            const domMasses = [
                { id: `dom-09-${isoDate}`, dia: 'Domingo', data: dateFormatted, hora: '09:00', isoDate: isoDate, dayOfWeek: 0, weekendIndex: weekendCount },
                { id: `dom-11-${isoDate}`, dia: 'Domingo', data: dateFormatted, hora: '11:00', isoDate: isoDate, dayOfWeek: 0, weekendIndex: weekendCount },
                { id: `dom-18-${isoDate}`, dia: 'Domingo', data: dateFormatted, hora: '18:30', isoDate: isoDate, dayOfWeek: 0, weekendIndex: weekendCount }
            ];
            
            domMasses.forEach(m => {
                schedules.push(m);
                currentGroup.masses.push(m);
            });
            
            currentGroup = null;
        }
    }
    
    // Atualizar labels dos grupos
    groups.forEach(g => {
        if (g.dates.length >= 2) {
            g.label = `${g.index}º FDS (${g.dates[0]} e ${g.dates[1]})`;
            g.fullLabel = `${g.index}º Final de Semana (${g.dates[0]} e ${g.dates[1]})`;
        } else {
            g.label = `${g.index}º FDS (${g.dates[0]})`;
            g.fullLabel = `${g.index}º Final de Semana (${g.dates[0]})`;
        }
    });
    
    return { schedules, groups };
}

// Elementos do DOM
const viewSelection = document.getElementById('view-selection');
const viewInscricao = document.getElementById('view-inscricao');
const viewControle = document.getElementById('view-luiggi');

const btnSelectWeekend = document.getElementById('btn-select-weekend');
const btnSelectSpecial = document.getElementById('btn-select-special');
const btnAdminAccess = document.getElementById('btn-admin-access');
const btnControle = document.getElementById('btn-controle');
const btnInscricaoNav = document.getElementById('btn-inscricao');
const btnsBack = document.querySelectorAll('.btn-back');

const inscricaoTitle = document.getElementById('inscricao-title');
const inscricaoSubtitle = document.getElementById('inscricao-subtitle');
const specialMassPickerContainer = document.getElementById('special-mass-picker-container');
const selectSpecialMass = document.getElementById('select-special-mass');
const inscricaoMonthNav = document.getElementById('inscricao-month-nav');
const labelQuaisMissas = document.getElementById('label-quais-missas');

// Navegadores de Mês
const btnPrevMonth = document.getElementById('btn-prev-month');
const btnNextMonth = document.getElementById('btn-next-month');
const currentMonthDisplay = document.getElementById('current-month-display');
const btnAdminPrevMonth = document.getElementById('btn-admin-prev-month');
const btnAdminNextMonth = document.getElementById('btn-admin-next-month');
const weekendLabel = document.getElementById('current-weekend-label');

// Form e Ticks
const selectName = document.getElementById('select-name');
const massOptions = document.getElementById('mass-options');
const formEscala = document.getElementById('form-escala');
const btnSubmitEscala = document.getElementById('btn-submit-escala');
const serverTickBanner = document.getElementById('server-tick-banner');
const massQuickActions = document.getElementById('mass-quick-actions');
const btnQuickDesmarcar = document.getElementById('btn-quick-desmarcar');
const btnQuickSabados = document.getElementById('btn-quick-sabados');
const btnQuickDomManha = document.getElementById('btn-quick-dom-manha');
const btnQuickDomNoite = document.getElementById('btn-quick-dom-noite');

// Tabela Pública
const publicScaleTitle = document.getElementById('public-scale-title');
const publicScaleMonthBadge = document.getElementById('public-scale-month-badge');
const scaleFilterContainer = document.getElementById('scale-filter-container');
const publicScaleList = document.getElementById('public-scale-list');
const toast = document.getElementById('toast');

// Sub-abas Controle
const btnSubChamada = document.getElementById('btn-sub-chamada');
const btnSubEspecial = document.getElementById('btn-sub-especial');
const btnSubRelatorio = document.getElementById('btn-sub-relatorio');
const controlChamada = document.getElementById('control-chamada');
const controlEspecial = document.getElementById('control-especial');
const controlRelatorio = document.getElementById('control-relatorio');
const adminMassFilterContainer = document.getElementById('admin-mass-filter');
const massTabs = document.getElementById('mass-tabs');
const attendanceList = document.getElementById('attendance-list');
const generalStatusList = document.getElementById('general-status-list');
const roleInputs = document.querySelectorAll('input[name="user-role"]');
const btnExportPdf = document.getElementById('btn-export-pdf');
const btnExportExcel = document.getElementById('btn-export-excel');

// Form Missa Especial
const formSpecialMass = document.getElementById('form-special-mass');
const specialMassList = document.getElementById('special-mass-list');

// Inicialização
async function init() {
    try {
        updateMonthState();
        setupNavigation();
        setupRoleFilter();
        setupQuickActions();
        setupSpecialMassForm();
        initChart();

        if (btnExportPdf) btnExportPdf.addEventListener('click', exportToPDF);
        if (btnExportExcel) btnExportExcel.addEventListener('click', exportToExcel);
    } catch (error) {
        console.error("Erro na inicialização:", error);
    }

    // Busca os dados DEPOIS de registrar os handlers, para que a navegação
    // (inclusive o Acesso Coordenador) já funcione mesmo com a rede lenta.
    try {
        await fetchData();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// Navegação de Mês
function changeMonth(delta) {
    selectedMonth += delta;
    if (selectedMonth > 11) {
        selectedMonth = 0;
        selectedYear++;
    } else if (selectedMonth < 0) {
        selectedMonth = 11;
        selectedYear--;
    }
    updateMonthState();
}

function updateMonthState() {
    const { schedules, groups } = calculateMonthMassSchedules(selectedYear, selectedMonth);
    massSchedules = schedules;
    weekendGroups = groups;
    currentScaleFilter = 'all';
    adminMassFilter = 'all';
    
    if (massSchedules.length > 0 && !selectedMassId) {
        selectedMassId = massSchedules[0].id;
    }
    
    const monthText = `${MONTH_NAMES[selectedMonth]} de ${selectedYear}`;
    const monthShort = `${MONTH_NAMES[selectedMonth].substring(0, 3)}/${selectedYear}`;
    
    if (currentMonthDisplay) currentMonthDisplay.textContent = monthText;
    if (weekendLabel) weekendLabel.textContent = `Mês: ${monthText}`;
    if (publicScaleTitle) publicScaleTitle.textContent = `Agenda Geral - ${monthText}`;
    if (publicScaleMonthBadge) publicScaleMonthBadge.textContent = monthShort;
    
    renderMassOptions();
    updateTicksForSelectedServer();
    renderPublicScale();
    renderMassTabs();
    updateAttendanceList();
    renderMassesReport();
    updateGeneralList();
    updateChart();
}

async function fetchData() {
    try {
        const { data: sData, error: sErr } = await supabaseClient.from('servers').select('*');
        if (sErr) throw sErr;
        servers = sData || [];

        // Garante que o Coroinha Davi esteja presente na lista de servidores
        if (!servers.some(s => s.nome.trim().toLowerCase() === 'davi')) {
            try {
                const { data: newDavi, error: daviErr } = await supabaseClient
                    .from('servers')
                    .insert([{ nome: 'Davi', cargo: 'Coroinha' }])
                    .select();
                if (!daviErr && newDavi && newDavi.length > 0) {
                    servers.push(newDavi[0]);
                } else {
                    servers.push({ id: 22, nome: 'Davi', cargo: 'Coroinha' });
                }
            } catch (e) {
                servers.push({ id: 22, nome: 'Davi', cargo: 'Coroinha' });
            }
        }

        const { data: aData, error: aErr } = await supabaseClient.from('attendance').select('*');
        if (aErr) throw aErr;
        attendanceData = aData || [];

        const { data: mData, error: mErr } = await supabaseClient.from('special_masses').select('*').order('mass_date', { ascending: true });
        if (mErr) throw mErr;
        specialMasses = mData || [];
        
        renderSpecialMassSelect();
        renderSpecialMassListAdmin();
        renderServerSelect();
        updateTicksForSelectedServer();
        renderPublicScale();
        renderMassTabs();
        updateAttendanceList();
        renderMassesReport();
        updateGeneralList();
        updateChart();
    } catch (e) {
        console.error("Erro ao buscar dados:", e);
        showToast("Erro ao conectar ao banco de dados.");
    }
}

function setupNavigation() {
    btnSelectWeekend.addEventListener('click', () => {
        currentMode = 'month';
        inscricaoTitle.textContent = "Escala Mensal";
        inscricaoSubtitle.textContent = "Selecione seu nome e marque os dias que você pode servir neste mês. Você pode alterar seus ticks ou desmarcar dias a qualquer momento.";
        specialMassPickerContainer.classList.add('hidden');
        if (labelQuaisMissas) labelQuaisMissas.classList.remove('hidden');
        if (inscricaoMonthNav) inscricaoMonthNav.classList.remove('hidden');
        showView(viewInscricao);
        renderServerSelect();
        renderMassOptions();
        updateTicksForSelectedServer();
        renderPublicScale();
    });

    btnSelectSpecial.addEventListener('click', () => {
        currentMode = 'special';
        inscricaoTitle.textContent = "Missa Especial";
        inscricaoSubtitle.textContent = "Selecione a missa, seu nome e informe se estará presente.";
        specialMassPickerContainer.classList.remove('hidden');
        if (labelQuaisMissas) labelQuaisMissas.classList.add('hidden');
        if (inscricaoMonthNav) inscricaoMonthNav.classList.add('hidden');
        if (serverTickBanner) serverTickBanner.classList.add('hidden');
        if (massQuickActions) massQuickActions.classList.add('hidden');
        showView(viewInscricao);
        renderServerSelect();
        renderMassOptions();
        renderPublicScale();
    });

    // Controles de Mês
    if (btnPrevMonth) btnPrevMonth.addEventListener('click', () => changeMonth(-1));
    if (btnNextMonth) btnNextMonth.addEventListener('click', () => changeMonth(1));
    if (btnAdminPrevMonth) btnAdminPrevMonth.addEventListener('click', () => changeMonth(-1));
    if (btnAdminNextMonth) btnAdminNextMonth.addEventListener('click', () => changeMonth(1));

    // Função de acesso ao admin com logs detalhados
    console.log('setupNavigation: registrando handlers de admin');
    const openAdminArea = () => {
        console.log('openAdminArea chamada');
        // Mostrar modal customizado para senha
        const modal = document.getElementById('admin-password-modal');
        const input = document.getElementById('admin-pass-input');
        const errorMsg = document.getElementById('admin-pass-error');
        modal.classList.remove('hidden');
        input.value = '';
        errorMsg.classList.add('hidden');
        input.focus();

        const hideModal = () => modal.classList.add('hidden');

        const verify = () => {
            const senha = input.value.trim();
            console.log('Senha digitada:', senha);
            if (senha === "121008") {
                console.log('Senha correta – exibindo viewControle');
                hideModal();
                if (viewControle) {
                    showView(viewControle);
                } else {
                    console.warn('Elemento viewControle não encontrado');
                }
                fetchData()
                    .then(() => {
                        updateMonthState();
                        const btnSubChamada = document.getElementById('btn-sub-chamada');
                        if (btnSubChamada) btnSubChamada.click();
                    })
                    .catch(err => console.error('Erro ao buscar dados admin:', err));
            } else {
                console.warn('Senha incorreta');
                errorMsg.classList.remove('hidden');
            }
        };
        // Handlers dos botões do modal
        document.getElementById('admin-pass-confirm').onclick = verify;
        document.getElementById('admin-pass-cancel').onclick = hideModal;
        // Permitir Enter para confirmar
        input.onkeypress = e => { if (e.key === 'Enter') verify(); };
    };

    if (btnAdminAccess) {
        btnAdminAccess.addEventListener('click', () => {
            console.log('Botão Acesso Coordenador clicado');
            openAdminArea();
        });
    }
    if (btnControle) {
        btnControle.addEventListener('click', () => {
            console.log('Botão Controle (Acesso Coordenador) clicado');
            openAdminArea();
        });
    }
    if (btnInscricaoNav) {
        btnInscricaoNav.addEventListener('click', () => {
            showView(viewSelection);
            currentMode = 'month';
            currentSpecialMassId = null;
        });
    }

    btnsBack.forEach(btn => {
        btn.addEventListener('click', () => {
            showView(viewSelection);
            currentMode = 'month';
            currentSpecialMassId = null;
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
        renderMassesReport();
        updateChart();
        updateGeneralList();
    });

    // Seleção de Nome -> Atualiza Ticks Imediatamente
    selectName.addEventListener('change', () => {
        updateTicksForSelectedServer();
    });

    // Toggle de Tick ao clicar no Card ou Checkbox
    massOptions.addEventListener('change', (e) => {
        if (e.target.name === 'mass') {
            const label = e.target.closest('.mass-item')?.querySelector('.mass-label');
            if (label) {
                if (e.target.checked) label.classList.add('is-checked');
                else label.classList.remove('is-checked');
            }
            updateSubmitButtonText();
        }
    });
}

function showView(view) {
    [viewSelection, viewInscricao, viewControle].forEach(v => v.classList.add('hidden'));
    view.classList.remove('hidden');

    // Mantém o menu superior em sincronia com a tela aberta
    if (btnInscricaoNav && btnControle) {
        const onAdmin = (view === viewControle);
        btnControle.classList.toggle('active', onAdmin);
        btnInscricaoNav.classList.toggle('active', !onAdmin);
    }

    // Garante que a nova tela comece visível (evita a sensação de "não abriu")
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showControlSection(section, btn) {
    [controlChamada, controlEspecial, controlRelatorio].forEach(s => s.classList.add('hidden'));
    [btnSubChamada, btnSubEspecial, btnSubRelatorio].forEach(b => b.classList.remove('active'));
    section.classList.remove('hidden');
    btn.classList.add('active');
}

function setupRoleFilter() {
    roleInputs.forEach(input => {
        input.addEventListener('change', () => {
            renderServerSelect(input.value);
            updateTicksForSelectedServer();
        });
    });
}

function renderServerSelect(filterRole = null) {
    if (!filterRole) {
        const checkedRole = document.querySelector('input[name="user-role"]:checked');
        filterRole = checkedRole ? checkedRole.value : "Coroinha";
    }
    
    const previousSelected = selectName.value;
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

    if (previousSelected && Array.from(selectName.options).some(o => o.value == previousSelected)) {
        selectName.value = previousSelected;
    }
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

// Configuração dos Botões de Ação Rápida (Shortcuts)
function setupQuickActions() {
    if (btnQuickDesmarcar) {
        btnQuickDesmarcar.addEventListener('click', () => {
            document.querySelectorAll('input[name="mass"]').forEach(cb => {
                cb.checked = false;
                const label = cb.closest('.mass-item')?.querySelector('.mass-label');
                if (label) label.classList.remove('is-checked');
            });
            updateSubmitButtonText();
            showToast("Todos os ticks foram desmarcados! Clique no botão abaixo para salvar.");
        });
    }

    if (btnQuickSabados) {
        btnQuickSabados.addEventListener('click', () => {
            document.querySelectorAll('input[name="mass"]').forEach(cb => {
                if (cb.value.startsWith('sab-')) {
                    cb.checked = true;
                    const label = cb.closest('.mass-item')?.querySelector('.mass-label');
                    if (label) label.classList.add('is-checked');
                }
            });
            updateSubmitButtonText();
            showToast("Todos os sábados foram marcados!");
        });
    }

    if (btnQuickDomManha) {
        btnQuickDomManha.addEventListener('click', () => {
            document.querySelectorAll('input[name="mass"]').forEach(cb => {
                if (cb.value.startsWith('dom-09-') || cb.value.startsWith('dom-11-')) {
                    cb.checked = true;
                    const label = cb.closest('.mass-item')?.querySelector('.mass-label');
                    if (label) label.classList.add('is-checked');
                }
            });
            updateSubmitButtonText();
            showToast("Missas de domingo pela manhã foram marcadas!");
        });
    }

    if (btnQuickDomNoite) {
        btnQuickDomNoite.addEventListener('click', () => {
            document.querySelectorAll('input[name="mass"]').forEach(cb => {
                if (cb.value.startsWith('dom-18-')) {
                    cb.checked = true;
                    const label = cb.closest('.mass-item')?.querySelector('.mass-label');
                    if (label) label.classList.add('is-checked');
                }
            });
            updateSubmitButtonText();
            showToast("Missas de domingo à noite foram marcadas!");
        });
    }
}

// Renderização das Opções de Missa (Agrupadas por Final de Semana)
function renderMassOptions() {
    massOptions.innerHTML = '';
    
    if (currentMode === 'month' || currentMode === 'weekend') {
        const selectedServerId = selectName.value ? parseInt(selectName.value) : null;
        let serverMassIds = [];
        if (selectedServerId) {
            serverMassIds = attendanceData
                .filter(a => a.server_id === selectedServerId)
                .map(a => a.mass_id);
        }

        if (weekendGroups.length === 0) {
            massOptions.innerHTML = '<p style="text-align:center; color:#7f8c8d; padding:20px;">Nenhuma data encontrada para este mês.</p>';
            return;
        }

        weekendGroups.forEach(group => {
            const block = document.createElement('div');
            block.className = 'weekend-block';
            
            block.innerHTML = `
                <div class="weekend-block-header">
                    <span class="weekend-title">📅 ${group.fullLabel}</span>
                    <span class="weekend-badge">${group.masses.length} missa${group.masses.length > 1 ? 's' : ''}</span>
                </div>
                <div class="weekend-grid"></div>
            `;
            
            const grid = block.querySelector('.weekend-grid');
            
            group.masses.forEach(m => {
                const isTicked = serverMassIds.includes(m.id);
                const item = document.createElement('div');
                item.className = 'mass-item';
                item.innerHTML = `
                    <input type="checkbox" id="check-${m.id}" name="mass" value="${m.id}" ${isTicked ? 'checked' : ''}>
                    <label for="check-${m.id}" class="mass-label ${isTicked ? 'is-checked' : ''}">
                        <div class="tick-indicator">✓</div>
                        <div class="mass-info-wrap">
                            <span class="mass-info-date">${m.dia} (${m.data})</span>
                            <span class="mass-info-time">${m.hora}</span>
                        </div>
                    </label>
                `;
                grid.appendChild(item);
            });
            
            massOptions.appendChild(block);
        });
        
        updateSubmitButtonText();
    } else if (currentMode === 'special' && currentSpecialMassId) {
        const div = document.createElement('div');
        div.className = 'options-grid';
        div.style.gridTemplateColumns = '1fr 1fr';
        div.style.width = '100%';
        div.innerHTML = `
            <div class="mass-item">
                <input type="radio" id="special-present" name="special-status" value="present" checked>
                <label for="special-present" class="mass-label is-checked">
                    <div class="tick-indicator">✓</div>
                    <div class="mass-info-wrap">
                        <span class="mass-info-date">Estarei Presente</span>
                        <span class="mass-info-time">Confirmar presença</span>
                    </div>
                </label>
            </div>
            <div class="mass-item">
                <input type="radio" id="special-absent" name="special-status" value="absent">
                <label for="special-absent" class="mass-label">
                    <div class="tick-indicator">✕</div>
                    <div class="mass-info-wrap">
                        <span class="mass-info-date">Estarei Ausente</span>
                        <span class="mass-info-time">Informar falta</span>
                    </div>
                </label>
            </div>
        `;
        massOptions.appendChild(div);
        
        div.querySelectorAll('input[name="special-status"]').forEach(r => {
            r.addEventListener('change', () => {
                div.querySelectorAll('.mass-label').forEach(l => l.classList.remove('is-checked'));
                const parent = r.closest('.mass-item')?.querySelector('.mass-label');
                if (parent) parent.classList.add('is-checked');
            });
        });
    } else if (currentMode === 'special') {
        massOptions.innerHTML = '<p style="text-align:center; color:#7f8c8d; padding:20px;">Selecione uma missa especial acima primeiro.</p>';
    }
}

// Atualiza Ticks e Banner quando um Servidor é Selecionado
function updateTicksForSelectedServer() {
    if (currentMode === 'special') {
        if (serverTickBanner) serverTickBanner.classList.add('hidden');
        if (massQuickActions) massQuickActions.classList.add('hidden');
        return;
    }
    
    const serverId = selectName.value ? parseInt(selectName.value) : null;
    if (!serverId) {
        if (serverTickBanner) serverTickBanner.classList.add('hidden');
        if (massQuickActions) massQuickActions.classList.add('hidden');
        
        document.querySelectorAll('input[name="mass"]').forEach(cb => {
            cb.checked = false;
            const label = cb.closest('.mass-item')?.querySelector('.mass-label');
            if (label) label.classList.remove('is-checked');
        });
        updateSubmitButtonText();
        return;
    }
    
    const server = servers.find(s => s.id === serverId);
    if (!server) return;
    
    if (massQuickActions) massQuickActions.classList.remove('hidden');
    if (serverTickBanner) serverTickBanner.classList.remove('hidden');
    
    const monthMassIds = massSchedules.map(m => m.id);
    const serverRegistrations = attendanceData.filter(a => a.server_id === serverId && monthMassIds.includes(a.mass_id));
    const registeredIds = serverRegistrations.map(a => a.mass_id);
    
    document.querySelectorAll('input[name="mass"]').forEach(cb => {
        const isTicked = registeredIds.includes(cb.value);
        cb.checked = isTicked;
        const label = cb.closest('.mass-item')?.querySelector('.mass-label');
        if (label) {
            if (isTicked) label.classList.add('is-checked');
            else label.classList.remove('is-checked');
        }
    });
    
    const monthText = `${MONTH_NAMES[selectedMonth]} de ${selectedYear}`;
    if (serverRegistrations.length > 0) {
        serverTickBanner.className = 'tick-banner has-ticks';
        serverTickBanner.innerHTML = `
            <div class="tick-banner-content">
                <div class="tick-banner-icon">📋</div>
                <div class="tick-banner-text">
                    <h4>Marcações de ${server.nome}</h4>
                    <p>Você tem <strong>${serverRegistrations.length} missa(s) marcada(s)</strong> para ${monthText}. Altere as caixas (ticks) abaixo para <strong>mudar</strong> ou <strong>desmarcar</strong> qualquer dia, depois clique em Salvar.</p>
                </div>
            </div>
        `;
    } else {
        serverTickBanner.className = 'tick-banner no-ticks';
        serverTickBanner.innerHTML = `
            <div class="tick-banner-content">
                <div class="tick-banner-icon">💡</div>
                <div class="tick-banner-text">
                    <h4>Olá, ${server.nome}!</h4>
                    <p>Você ainda não marcou nenhuma missa para ${monthText}. Clique nos dias que você pode servir para marcar o tick (✓) e depois clique em Salvar.</p>
                </div>
            </div>
        `;
    }
    
    updateSubmitButtonText();
}

// Atualiza o Texto do Botão de Submit Dinamicamente
function updateSubmitButtonText() {
    if (!btnSubmitEscala) return;
    
    if (currentMode === 'special') {
        btnSubmitEscala.textContent = "Confirmar Presença na Missa Especial";
        btnSubmitEscala.className = "btn-primary";
        return;
    }
    
    const checkedCount = document.querySelectorAll('input[name="mass"]:checked').length;
    if (checkedCount > 0) {
        btnSubmitEscala.textContent = `Salvar Alterações na Escala (${checkedCount} missa${checkedCount > 1 ? 's' : ''} marcada${checkedCount > 1 ? 's' : ''})`;
        btnSubmitEscala.className = "btn-primary";
    } else {
        btnSubmitEscala.textContent = "Desmarcar Todas as Minhas Missas do Mês";
        btnSubmitEscala.className = "btn-primary";
    }
}

// Submissão do Formulário de Escala
formEscala.addEventListener('submit', async (e) => {
    e.preventDefault();
    const serverId = selectName.value;
    if (!serverId) {
        showToast("Por favor, selecione seu nome!");
        return;
    }
    
    const server = servers.find(s => s.id == serverId);
    const serverName = server ? server.nome : "Servidor";
    const monthText = `${MONTH_NAMES[selectedMonth]} de ${selectedYear}`;
    
    let selectedEntries = [];
    const monthMassIds = massSchedules.map(m => m.id);
    
    if (currentMode === 'month' || currentMode === 'weekend') {
        const selectedMasses = Array.from(document.querySelectorAll('input[name="mass"]:checked')).map(i => i.value);
        
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
        if (currentMode === 'month' || currentMode === 'weekend') {
            // Remove todas as marcações deste servidor no mês atual
            await supabaseClient.from('attendance').delete().eq('server_id', serverId).in('mass_id', monthMassIds);
            attendanceData = attendanceData.filter(item => item.server_id != serverId || !monthMassIds.includes(item.mass_id));
            
            if (selectedEntries.length > 0) {
                const { data, error } = await supabaseClient.from('attendance').insert(selectedEntries).select();
                if (error) throw error;
                if (data) attendanceData.push(...data);
                showToast(`Escala de ${serverName} atualizada! ${selectedEntries.length} missa(s) marcada(s) para ${monthText} ⛪`);
            } else {
                showToast(`Todas as suas missas de ${monthText} foram desmarcadas com sucesso! 👍`);
            }
        } else {
            // Missa Especial
            const mId = `special-${currentSpecialMassId}`;
            await supabaseClient.from('attendance').delete().eq('server_id', serverId).eq('mass_id', mId);
            attendanceData = attendanceData.filter(item => item.server_id != serverId || item.mass_id != mId);
            
            const { data, error } = await supabaseClient.from('attendance').insert(selectedEntries).select();
            if (error) throw error;
            if (data) attendanceData.push(...data);
            
            const m = specialMasses.find(sm => sm.id == currentSpecialMassId);
            const massName = m ? m.description : "Missa Especial";
            const status = document.querySelector('input[name="special-status"]:checked').value;
            if (status === 'present') {
                showToast(`Você foi cadastrado como presente na ${massName}! 🌟`);
            } else {
                showToast("Sua ausência foi informada com sucesso.");
            }
        }

        // Atualiza a visualização mantendo a seleção ativa
        updateTicksForSelectedServer();
        renderPublicScale();
        updateGeneralList();
        updateChart();
    } catch (err) {
        console.error("Erro ao salvar escala:", err);
        showToast("Erro ao salvar. Tente novamente.");
    } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
        updateSubmitButtonText();
    }
});

// Renderização dos Filtros da Tabela Pública
function renderScaleFilters() {
    if (!scaleFilterContainer) return;
    scaleFilterContainer.innerHTML = '';
    
    const btnAll = document.createElement('button');
    btnAll.type = 'button';
    btnAll.className = `btn-filter ${currentScaleFilter === 'all' ? 'active' : ''}`;
    btnAll.textContent = `Todo o Mês (${massSchedules.length})`;
    btnAll.onclick = () => {
        currentScaleFilter = 'all';
        renderPublicScale();
    };
    scaleFilterContainer.appendChild(btnAll);
    
    weekendGroups.forEach(g => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn-filter ${currentScaleFilter == g.index ? 'active' : ''}`;
        btn.textContent = g.label;
        btn.onclick = () => {
            currentScaleFilter = g.index;
            renderPublicScale();
        };
        scaleFilterContainer.appendChild(btn);
    });
}

// Renderização do Resumo Público de Quantidade por Missa
function renderPublicMassSummary(massList) {
    const container = document.getElementById('public-mass-summary');
    if (!container) return;
    container.innerHTML = '';

    if (!massList || massList.length === 0) return;

    massList.forEach(mass => {
        const entriesForMass = attendanceData.filter(a => a.mass_id === mass.id);

        let acolitoCount = 0;
        let coroinhaCount = 0;

        entriesForMass.forEach(entry => {
            const server = servers.find(s => s.id === entry.server_id);
            if (server) {
                if (server.cargo === 'Acólito') acolitoCount++;
                else if (server.cargo === 'Coroinha') coroinhaCount++;
            }
        });

        const total = acolitoCount + coroinhaCount;
        const chip = document.createElement('div');
        chip.className = 'mass-summary-chip';
        chip.innerHTML = `
            <span class="chip-title">${mass.dia.substring(0,3)} ${mass.data} – ${mass.hora}</span>
            <div class="chip-counts">
                <span class="chip-count-badge total">👥 ${total}</span>
                <span class="chip-count-badge acolito">⛪ Ac: ${acolitoCount}</span>
                <span class="chip-count-badge coroinha">✝️ Co: ${coroinhaCount}</span>
            </div>
        `;
        container.appendChild(chip);
    });
}

// Renderização da Tabela Pública da Escala
function renderPublicScale() {
    if (!publicScaleList) return;
    publicScaleList.innerHTML = '';
    
    const attendanceMap = {};
    attendanceData.forEach(entry => {
        if (!attendanceMap[entry.server_id]) attendanceMap[entry.server_id] = {};
        attendanceMap[entry.server_id][entry.mass_id] = entry.status;
    });

    const sortedServers = [...servers].sort((a,b) => a.nome.localeCompare(b.nome));

    let massList = [];
    if (currentMode === 'month' || currentMode === 'weekend') {
        renderScaleFilters();
        if (currentScaleFilter === 'all') {
            massList = massSchedules;
        } else {
            massList = massSchedules.filter(m => m.weekendIndex == currentScaleFilter);
        }
    } else {
        if (scaleFilterContainer) scaleFilterContainer.innerHTML = '';
        if (!currentSpecialMassId) {
            publicScaleList.innerHTML = '<p style="text-align:center; padding:20px; color:#7f8c8d;">Selecione uma missa especial para ver a agenda.</p>';
            return;
        }
        const m = specialMasses.find(sm => sm.id == currentSpecialMassId);
        if (m) {
            const [y, mon, d] = m.mass_date.split('-');
            massList = [{
                id: `special-${currentSpecialMassId}`,
                dia: m.description,
                data: `${d}/${mon}`,
                hora: m.mass_time.substring(0,5)
            }];
        }
    }

    if (massList.length === 0) {
        publicScaleList.innerHTML = '<p style="text-align:center; padding:20px; color:#7f8c8d;">Nenhuma missa encontrada para este período.</p>';
        renderPublicMassSummary([]);
        return;
    }

    // Atualiza o resumo de quantidade de acólitos/coroinhas por missa
    renderPublicMassSummary(massList);

    const header = document.createElement('div');
    header.className = 'scale-header';
    const colWidth = Math.max(75, Math.floor(700 / massList.length));
    header.style.gridTemplateColumns = `190px repeat(${massList.length}, minmax(${colWidth}px, 1fr))`;
    header.style.minWidth = `${190 + (massList.length * colWidth)}px`;

    const nameHeader = document.createElement('span');
    nameHeader.innerHTML = '<strong>Servidor</strong>';
    header.appendChild(nameHeader);

    massList.forEach(m => {
        const span = document.createElement('span');
        span.innerHTML = `<strong>${m.dia.substring(0,3)} ${m.data}</strong><small style="display:block; font-size:0.68rem; opacity:0.85;">${m.hora}</small>`;
        header.appendChild(span);
    });
    publicScaleList.appendChild(header);

    // Linhas de resumo: quantos já clicaram em cada missa
    const countsByMass = {};
    massList.forEach(m => { countsByMass[m.id] = getMassCounts(m.id); });

    const summaryRows = [
        { cls: 'coroinhas-row', label: 'Coroinhas', value: c => c.coroinha },
        { cls: 'acolitos-row', label: 'Acólitos', value: c => c.acolito },
        { cls: 'total-row', label: 'Total que já clicaram', value: c => c.total }
    ];

    summaryRows.forEach(row => {
        const div = document.createElement('div');
        div.className = `scale-summary-row ${row.cls}`;
        div.style.gridTemplateColumns = header.style.gridTemplateColumns;
        div.style.minWidth = header.style.minWidth;

        const nameCol = document.createElement('div');
        nameCol.className = 'scale-name';
        nameCol.textContent = row.label;
        div.appendChild(nameCol);

        massList.forEach(m => {
            const col = document.createElement('div');
            col.className = 'scale-col';
            col.textContent = row.value(countsByMass[m.id]);
            div.appendChild(col);
        });

        publicScaleList.appendChild(div);
    });

    const monthMassIds = massSchedules.map(m => m.id);

    sortedServers.forEach(server => {
        const div = document.createElement('div');
        div.className = 'scale-row';
        div.style.gridTemplateColumns = header.style.gridTemplateColumns;
        div.style.minWidth = header.style.minWidth;
        
        const totalTicksMonth = attendanceData.filter(a => a.server_id === server.id && monthMassIds.includes(a.mass_id)).length;
        
        const nameCol = document.createElement('div');
        nameCol.className = 'scale-name';
        nameCol.title = `Clique para alterar ou desmarcar a escala de ${server.nome}`;
        nameCol.onclick = () => editServerTicks(server.id);
        
        // Compute role‑specific tick counts
        const roleCounts = (() => {
            const entries = attendanceData.filter(a => a.server_id === server.id);
            const acolyteCount = entries.filter(e => {
                const srv = servers.find(s => s.id === e.server_id);
                return srv && srv.cargo === 'Acólito';
            }).length;
            const coroinhaCount = entries.filter(e => {
                const srv = servers.find(s => s.id === e.server_id);
                return srv && srv.cargo === 'Coroinha';
            }).length;
            return { acolyteCount, coroinhaCount };
        })();
        
        const roleShort = server.cargo === 'Acólito' ? 'Acólito' : 'Coroinha';
        const roleClass = server.cargo === 'Acólito' ? 'role-acolito' : 'role-coroinha';
        
        nameCol.innerHTML = `
            <div class="scale-name-text">
                <div>${server.nome}</div>
                <div style="display:flex; gap:4px; align-items:center; margin-top:2px;">
                    <span class="badge ${roleClass}" style="font-size:0.58rem; padding:1px 5px;">${roleShort}</span>
                    <span class="badge-total-ticks ${totalTicksMonth > 0 ? 'has-ticks' : ''}" style="font-size:0.58rem; padding:1px 5px;">${totalTicksMonth} missa${totalTicksMonth !== 1 ? 's' : ''}</span>
                    <span class="badge ${roleClass}" style="font-size:0.5rem; padding:1px 4px; background:#e0f7fa;">A: ${roleCounts.acolyteCount}</span>
                    <span class="badge ${roleClass}" style="font-size:0.5rem; padding:1px 4px; background:#fff3e0;">C: ${roleCounts.coroinhaCount}</span>
                </div>
            </div>
            <div class="scale-name-actions">
                <button type="button" class="btn-row-edit" title="Alterar ou desmarcar dias">✏️ Alterar</button>
            </div>
        `;
        div.appendChild(nameCol);
        
        massList.forEach(m => {
            const col = document.createElement('div');
            col.className = 'scale-col';
            
            const status = attendanceMap[server.id] ? attendanceMap[server.id][m.id] : null;
            let icon = '—';
            let cls = 'status-none';
            let title = 'Não inscrito';
            
            if (status === 'present') {
                icon = '✔';
                cls = 'status-present';
                title = 'Presença Confirmada';
            } else if (status === 'absent') {
                icon = '✖';
                cls = 'status-absent';
                title = 'Falta Informada';
            } else if (status === 'pending' || status === 'pretended') {
                icon = '✔';
                cls = 'status-pending';
                title = 'Inscrito (Tick Marcado)';
            }
            
            col.innerHTML = `<span class="status-icon ${cls}" title="${title}">${icon}</span>`;
            div.appendChild(col);
        });
        
        publicScaleList.appendChild(div);
    });
}

// Atalho rápido: Carregar ticks de um servidor ao clicar na tabela
window.editServerTicks = function(serverId) {
    const server = servers.find(s => s.id == serverId);
    if (!server) return;
    
    const roleRadio = document.querySelector(`input[name="user-role"][value="${server.cargo}"]`);
    if (roleRadio) {
        roleRadio.checked = true;
        renderServerSelect(server.cargo);
    }
    
    selectName.value = serverId;
    updateTicksForSelectedServer();
    
    const card = document.getElementById('card-escala');
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        card.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
        card.style.boxShadow = '0 0 25px rgba(26, 35, 126, 0.4)';
        card.style.borderColor = 'var(--primary)';
        setTimeout(() => {
            card.style.boxShadow = '';
            card.style.borderColor = '';
        }, 1800);
    }
    
    showToast(`Carregados os ticks de ${server.nome}! Altere ou desmarque como desejar.`);
};

// --- ÁREA DO COORDENADOR ---

// Conta quantos acólitos e coroinhas já marcaram (clicaram) em uma missa
function getMassCounts(massId) {
    let acolitoCount = 0;
    let coroinhaCount = 0;

    attendanceData.filter(a => a.mass_id === massId).forEach(entry => {
        const server = servers.find(s => s.id === entry.server_id);
        if (!server) return;
        if (server.cargo === 'Acólito') acolitoCount++;
        else if (server.cargo === 'Coroinha') coroinhaCount++;
    });

    return { acolito: acolitoCount, coroinha: coroinhaCount, total: acolitoCount + coroinhaCount };
}

function countTag(cls, text) {
    return `<span class="count-tag ${cls}">${text}</span>`;
}

// KPI de Quantidades da Missa Selecionada (Chamada)
function renderAdminMassKpi() {
    const kpi = document.getElementById('admin-mass-kpi');
    if (!kpi) return;

    if (!selectedMassId) {
        kpi.innerHTML = '';
        return;
    }

    const counts = getMassCounts(selectedMassId);
    kpi.innerHTML = `
        <div class="kpi-item total">
            <span class="kpi-value">${counts.total}</span>
            <span class="kpi-label">Total que já clicaram</span>
        </div>
        <div class="kpi-item acolito">
            <span class="kpi-value">${counts.acolito}</span>
            <span class="kpi-label">Acólitos</span>
        </div>
        <div class="kpi-item coroinha">
            <span class="kpi-value">${counts.coroinha}</span>
            <span class="kpi-label">Coroinhas</span>
        </div>
    `;
}

// Quadro de Servidores por Missa (Relatório Geral)
function renderMassesReport() {
    const grid = document.getElementById('admin-masses-report');
    if (!grid) return;
    grid.innerHTML = '';

    if (massSchedules.length === 0) {
        grid.innerHTML = '<p style="text-align:center; padding:20px; color:#7f8c8d;">Nenhuma missa encontrada para este mês.</p>';
        return;
    }

    massSchedules.forEach(m => {
        const counts = getMassCounts(m.id);
        const names = attendanceData
            .filter(a => a.mass_id === m.id)
            .map(a => servers.find(s => s.id === a.server_id))
            .filter(Boolean)
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .map(s => `${s.nome} (${s.cargo})`)
            .join(', ');

        const card = document.createElement('div');
        card.className = 'mass-report-card';
        card.innerHTML = `
            <div class="mass-report-card-header">
                <span class="mass-report-card-title">${m.dia} ${m.data} – ${m.hora}</span>
            </div>
            <div class="mass-report-card-stats">
                ${countTag('total', `👥 Total: ${counts.total}`)}
                ${countTag('acolito', `⛪ Acólitos: ${counts.acolito}`)}
                ${countTag('coroinha', `✝️ Coroinhas: ${counts.coroinha}`)}
            </div>
            <div class="mass-report-names-list">${names || 'Ninguém escalado para esta missa ainda.'}</div>
        `;
        grid.appendChild(card);
    });
}

function renderMassTabs() {
    if (!massTabs) return;
    massTabs.innerHTML = '';
    
    renderAdminMassFilter();
    
    let displayedMasses = massSchedules;
    if (adminMassFilter !== 'all') {
        displayedMasses = massSchedules.filter(m => m.weekendIndex == adminMassFilter);
    }
    
    if (displayedMasses.length > 0 && !displayedMasses.some(m => m.id === selectedMassId)) {
        selectedMassId = displayedMasses[0].id;
    }

    // Abas de missas regulares do mês
    displayedMasses.forEach(m => {
        const counts = getMassCounts(m.id);
        const tab = document.createElement('div');
        tab.className = `tab ${selectedMassId === m.id ? 'active' : ''}`;
        tab.innerHTML = `
            <div>${m.dia}</div>
            <small>${m.data} - ${m.hora}</small>
            <div class="tab-counts-badge"><span>Ac: ${counts.acolito}</span><span>Co: ${counts.coroinha}</span></div>
        `;
        tab.onclick = () => {
            selectedMassId = m.id;
            updateTabStates();
            updateAttendanceList();
            updateChart();
        };
        massTabs.appendChild(tab);
    });

    // Abas das missas especiais
    specialMasses.forEach(m => {
        const mId = `special-${m.id}`;
        const counts = getMassCounts(mId);
        const tab = document.createElement('div');
        tab.className = `tab ${selectedMassId === mId ? 'active' : ''}`;
        const [y, mon, d] = m.mass_date.split('-');
        tab.innerHTML = `
            <div>🌟 ${m.description}</div>
            <small>${d}/${mon} - ${m.mass_time.substring(0,5)}</small>
            <div class="tab-counts-badge"><span>Ac: ${counts.acolito}</span><span>Co: ${counts.coroinha}</span></div>
        `;
        tab.onclick = () => {
            selectedMassId = mId;
            updateTabStates();
            updateAttendanceList();
            updateChart();
        };
        massTabs.appendChild(tab);
    });
}

function renderAdminMassFilter() {
    if (!adminMassFilterContainer) return;
    adminMassFilterContainer.innerHTML = '';
    
    const btnAll = document.createElement('button');
    btnAll.type = 'button';
    btnAll.className = `btn-filter ${adminMassFilter === 'all' ? 'active' : ''}`;
    btnAll.textContent = 'Todas as Missas';
    btnAll.onclick = () => {
        adminMassFilter = 'all';
        renderMassTabs();
        updateAttendanceList();
    };
    adminMassFilterContainer.appendChild(btnAll);
    
    weekendGroups.forEach(g => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn-filter ${adminMassFilter == g.index ? 'active' : ''}`;
        btn.textContent = g.label;
        btn.onclick = () => {
            adminMassFilter = g.index;
            renderMassTabs();
            updateAttendanceList();
        };
        adminMassFilterContainer.appendChild(btn);
    });
}

function updateTabStates() {
    const allTabs = document.querySelectorAll('#mass-tabs .tab');
    let displayedMasses = massSchedules;
    if (adminMassFilter !== 'all') {
        displayedMasses = massSchedules.filter(m => m.weekendIndex == adminMassFilter);
    }
    
    const combinedSchedules = [
        ...displayedMasses.map(m => m.id),
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
    if (!attendanceList) return;
    renderAdminMassKpi();
    const list = attendanceData.filter(a => a.mass_id === selectedMassId);
    attendanceList.innerHTML = '';

    if (list.length === 0) {
        attendanceList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">Ninguém escalado para esta missa ainda.</p>';
        return;
    }

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
                    <p>Status: ${entry.status === 'present' ? 'Confirmado' : entry.status === 'absent' ? 'Ausente' : 'Inscrito (Aguardando chamada)'}</p>
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

function updateGeneralList() {
    if (!generalStatusList) return;
    generalStatusList.innerHTML = '';
    
    const monthMassIds = massSchedules.map(m => m.id);
    
    const grouped = {};
    attendanceData.forEach(entry => {
        if (!grouped[entry.server_id]) grouped[entry.server_id] = [];
        grouped[entry.server_id].push(entry);
    });

    const sortedServers = [...servers].sort((a,b) => a.nome.localeCompare(b.nome));
    
    sortedServers.forEach(server => {
        const allEntries = grouped[server.id] || [];
        const serverEntries = allEntries.filter(e => monthMassIds.includes(e.mass_id) || e.mass_id.startsWith('special-'));
        
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
                    return `🌟 ${m.description} (${d}/${mon})`;
                } else {
                    const m = massSchedules.find(ms => ms.id === e.mass_id);
                    if (m) {
                        return `${m.dia.substring(0,3)} ${m.data} (${m.hora})`;
                    } else {
                        const parts = e.mass_id.split('-');
                        if (parts.length >= 5) {
                            const diaSemana = parts[0] === 'sab' ? 'Sáb' : 'Dom';
                            const dataFormatada = `${parts[4]}/${parts[3]}`;
                            return `${diaSemana} ${dataFormatada}`;
                        }
                        return e.mass_id;
                    }
                }
            }).filter(d => d !== '').join(', ');

            const hasConfirmed = serverEntries.some(e => e.status === 'present');
            const hasAbsent = serverEntries.some(e => e.status === 'absent');
            const hasPending = serverEntries.some(e => e.status === 'pretended' || e.status === 'pending');

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
                    <span class="badge-total-ticks ${serverEntries.length > 0 ? 'has-ticks' : ''}">${serverEntries.length} missa${serverEntries.length !== 1 ? 's' : ''} em ${MONTH_NAMES[selectedMonth]}</span>
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
            renderPublicScale();
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
    if (!specialMassList) return;
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
    
    const monthMassIds = massSchedules.map(m => m.id);
    const grouped = {};
    attendanceData.forEach(entry => {
        if (!grouped[entry.server_id]) grouped[entry.server_id] = [];
        grouped[entry.server_id].push(entry);
    });

    let confirmedCount = 0;
    let pendingCount = 0;
    let inactiveCount = 0;

    servers.forEach(server => {
        const allEntries = grouped[server.id] || [];
        const entries = allEntries.filter(e => monthMassIds.includes(e.mass_id) || e.mass_id.startsWith('special-'));
        
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
    const monthName = MONTH_NAMES[selectedMonth];
    const opt = {
        margin: 10,
        filename: `Escala_Sagrada_Familia_${monthName}_${selectedYear}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}

function exportToExcel() {
    try {
        const sortedServers = [...servers].sort((a, b) => a.nome.localeCompare(b.nome));
        const monthMassIds = massSchedules.map(m => m.id);
        const monthText = `${MONTH_NAMES[selectedMonth]}_${selectedYear}`;
        
        const data = sortedServers.map(server => {
            const allEntries = attendanceData.filter(a => a.server_id === server.id);
            const serverEntries = allEntries.filter(e => monthMassIds.includes(e.mass_id) || e.mass_id.startsWith('special-'));
            
            let daysText = 'Não se inscreveu';
            if (serverEntries.length > 0) {
                daysText = serverEntries.map(e => {
                    if (e.mass_id.startsWith('special-')) {
                        const id = e.mass_id.replace('special-', '');
                        const m = specialMasses.find(sm => sm.id == id);
                        if (!m) return '';
                        const [y, mon, d] = m.mass_date.split('-');
                        return `Missa Especial: ${m.description} (${d}/${mon})`;
                    } else {
                        const m = massSchedules.find(ms => ms.id === e.mass_id);
                        if (m) {
                            return `${m.dia} ${m.data} às ${m.hora}`;
                        } else {
                            return e.mass_id;
                        }
                    }
                }).filter(d => d !== '').join('; ');
            }

            return {
                'Nome': server.nome,
                'Cargo': server.cargo,
                'Total Missas no Mês': serverEntries.length,
                'Datas/Horários': daysText,
                'Status Geral': serverEntries.some(e => e.status === 'present') ? 'Confirmado' : 
                                serverEntries.some(e => e.status === 'absent') ? 'Ausente' : 
                                serverEntries.length > 0 ? 'Aguardando' : 'Inativo'
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `Escala_${MONTH_NAMES[selectedMonth]}`);

        const wscols = [
            {wch: 25}, // Nome
            {wch: 15}, // Cargo
            {wch: 20}, // Total Missas
            {wch: 60}, // Datas/Horários
            {wch: 15}  // Status
        ];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, `Escala_Sagrada_Familia_${monthText}.xlsx`);
        showToast("Excel mensal gerado com sucesso! 📊");
    } catch (error) {
        console.error("Erro ao exportar Excel:", error);
        showToast("Erro ao gerar Excel.");
    }
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3500);
}

// Inicializa a aplicação
init();
