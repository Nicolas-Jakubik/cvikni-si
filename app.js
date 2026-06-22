// ============ SUPABASE INICIALIZÁCIA ============
const SUPABASE_URL = 'https://zduvtihmbppwgukbaaxx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ISftud-eccL_0Dw1m1VR0g_O9xgKHR_';
const ADMIN_PASSWORD = 'admin123';

let supabaseClient = null;
let editingEmployeeId = null;

async function initSupabase() {
    if (supabaseClient) return;
    try {
        const { createClient } = window.supabase;
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase connected');
    } catch (error) {
        console.error('❌ Chyba pri inicializácii Supabase:', error);
        alert('❌ Chyba pri pripojení k Supabase!');
    }
}

// ============ VEDÚCI FORMULÁR ============

async function loadEmployeesForLead() {
    await initSupabase();
    try {
        const { data, error } = await supabaseClient.from('employees').select('id, name');
        if (error) {
            console.error('❌ Chyba pri načítaní zamestnancov:', error);
            return;
        }
        
        const select = document.getElementById('employeeName');
        if (!select) return;
        
        select.innerHTML = '<option value="">Vyber meno</option>';
        if (data && data.length > 0) {
            data.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = emp.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('❌ Chyba pri načítaní zamestnancov:', error);
    }
}

async function loadProjectsForLead() {
    await initSupabase();
    try {
        const { data, error } = await supabaseClient
            .from('projects')
            .select('id, name')
            .eq('is_active', true);
        
        if (error) {
            console.error('❌ Chyba pri načítaní projektov:', error);
            return;
        }
        
        const select = document.getElementById('projectName');
        if (!select) return;
        
        select.innerHTML = '<option value="">Vyber projekt</option>';
        if (data && data.length > 0) {
            data.forEach(proj => {
                const option = document.createElement('option');
                option.value = proj.id;
                option.textContent = proj.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('❌ Chyba pri načítaní projektov:', error);
    }
}

function calculateWorkHours() {
    const timeFrom = document.getElementById('timeFrom').value;
    const timeTo = document.getElementById('timeTo').value;
    const breakMinutes = parseFloat(document.getElementById('breakMinutes').value) || 0;

    if (!timeFrom || !timeTo) return;

    const [fromHours, fromMins] = timeFrom.split(':').map(Number);
    const [toHours, toMins] = timeTo.split(':').map(Number);

    const fromTotalMins = fromHours * 60 + fromMins;
    const toTotalMins = toHours * 60 + toMins;

    const workMins = toTotalMins - fromTotalMins - breakMinutes;
    const workHours = workMins / 60;

    document.getElementById('hoursCalculated').textContent = Math.max(0, workHours.toFixed(2));
}

async function submitAttendance() {
    const employeeId = document.getElementById('employeeName').value;
    const projectId = document.getElementById('projectName').value;
    const workDate = document.getElementById('workDate').value;
    const messageDiv = document.getElementById('message');

    const calculatedHours = parseFloat(document.getElementById('hoursCalculated').textContent);

    if (!employeeId || !projectId || !workDate) {
        messageDiv.className = 'message error';
        messageDiv.textContent = '❌ Vyplň všetky polia!';
        return;
    }

    if (calculatedHours <= 0) {
        messageDiv.className = 'message error';
        messageDiv.textContent = '❌ Neplatný čas!';
        return;
    }

    try {
        const { error } = await supabaseClient.from('attendance').insert({
            employee_id: parseInt(employeeId),
            project_id: parseInt(projectId),
            hours: calculatedHours,
            date: workDate
        });

        if (error) {
            console.error('❌ Chyba pri ukladaní:', error);
            throw error;
        }

        messageDiv.className = 'message success';
        messageDiv.textContent = '✅ Hodiny boli uložené!';
        
        document.getElementById('attendanceForm').reset();
        setTodayDate();
        calculateWorkHours();
        setTimeout(() => {
            messageDiv.textContent = '';
        }, 3000);
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = '❌ Chyba: ' + error.message;
    }
}

function goToAdmin() {
    window.location.href = 'admin.html';
}

// ============ ADMIN PANEL ============

function switchSection(sectionId) {
    document.querySelectorAll('.section').forEach(el => {
        el.classList.remove('active');
    });

    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');

    const titles = {
        dashboard: '📊 Dashboard',
        employees: '👥 Zamestnanci',
        projects: '📦 Projekty',
        attendance: '📋 Dochádzka',
        salaries: '💰 Výplaty'
    };
    document.getElementById('sectionTitle').textContent = titles[sectionId];

    if (sectionId === 'dashboard') {
        loadDashboard();
    } else if (sectionId === 'employees') {
        loadEmployees();
    } else if (sectionId === 'projects') {
        loadProjects();
    } else if (sectionId === 'attendance') {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        document.getElementById('attendanceMonth').value = `${year}-${month}`;
        loadAttendance();
    } else if (sectionId === 'salaries') {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        document.getElementById('salaryMonth').value = `${year}-${month}`;
        calculateSalaries();
    }
}

function openAddEmployee() {
    editingEmployeeId = null;
    document.getElementById('addEmployeeForm').style.display = 'flex';
    document.getElementById('newEmployeeName').value = '';
    document.getElementById('newEmployeeRate').value = '';
    document.getElementById('newEmployeeName').focus();
}

function closeAddEmployee() {
    document.getElementById('addEmployeeForm').style.display = 'none';
    document.getElementById('newEmployeeName').value = '';
    document.getElementById('newEmployeeRate').value = '';
    editingEmployeeId = null;
}

function openEditEmployee(empId, name, rate) {
    editingEmployeeId = empId;
    document.getElementById('newEmployeeName').value = name;
    document.getElementById('newEmployeeRate').value = rate;
    document.getElementById('addEmployeeForm').style.display = 'flex';
    document.getElementById('newEmployeeName').focus();
}

function openAddProject() {
    document.getElementById('addProjectForm').style.display = 'flex';
    document.getElementById('newProjectName').focus();
}

function closeAddProject() {
    document.getElementById('addProjectForm').style.display = 'none';
    document.getElementById('newProjectName').value = '';
}

async function initializeAdmin() {
    await initSupabase();
    
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showAdminPanel();
    }
}

function loginAdmin() {
    const password = document.getElementById('adminPassword').value;
    const message = document.getElementById('loginMessage');

    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('adminLoggedIn', 'true');
        message.className = 'message success';
        message.textContent = '✅ Prihlásenie úspešné!';
        setTimeout(() => {
            showAdminPanel();
        }, 500);
    } else {
        message.className = 'message error';
        message.textContent = '❌ Nesprávne heslo!';
    }
}

function showAdminPanel() {
    const loginModal = document.getElementById('loginModal');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loginModal) loginModal.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'flex';
    
    loadDashboard();
}

function logoutAdmin() {
    localStorage.removeItem('adminLoggedIn');
    const loginModal = document.getElementById('loginModal');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loginModal) loginModal.style.display = 'flex';
    if (adminPanel) adminPanel.style.display = 'none';
    
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) passwordInput.value = '';
}

function backToLead() {
    window.location.href = 'index.html';
}

// ============ ZAMESTNANCI ============

async function addEmployee() {
    const name = document.getElementById('newEmployeeName').value.trim();
    const rate = parseFloat(document.getElementById('newEmployeeRate').value);

    if (!name || !rate || rate <= 0) {
        alert('❌ Vyplň všetky polia správne!');
        return;
    }

    try {
        if (editingEmployeeId) {
            const { error } = await supabaseClient
                .from('employees')
                .update({ name, hourly_rate: rate })
                .eq('id', editingEmployeeId);
            
            if (error) throw error;
            alert('✅ Zamestnanec bol upravený!');
        } else {
            const { error } = await supabaseClient.from('employees').insert({
                name: name,
                hourly_rate: rate
            });

            if (error) throw error;
            alert('✅ Zamestnanec bol pridaný!');
        }

        closeAddEmployee();
        loadEmployees();
        loadEmployeesForLead();
    } catch (error) {
        console.error('❌ Chyba:', error);
        alert('❌ Chyba: ' + error.message);
    }
}

async function deleteEmployee(empId) {
    if (!confirm('Naozaj chceš zmazať zamestnanca?')) return;

    try {
        const { error } = await supabaseClient.from('employees').delete().eq('id', empId);
        if (error) throw error;
        loadEmployees();
        loadEmployeesForLead();
    } catch (error) {
        console.error('❌ Chyba:', error);
        alert('❌ Chyba: ' + error.message);
    }
}

async function loadEmployees() {
    try {
        const { data, error } = await supabaseClient.from('employees').select('*').order('name', { ascending: true });
        if (error) {
            console.error('❌ Chyba pri načítaní:', error);
            throw error;
        }

        const list = document.getElementById('employeesList');
        if (!list) return;
        
        list.innerHTML = '';

        if (!data || data.length === 0) {
            list.innerHTML = '<div class="empty-state">Žiadni zamestnanci. Pridaj prvého!</div>';
            return;
        }

        data.forEach(emp => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">${emp.name}</div>
                    <div class="list-item-subtitle">Hodinová mzda: <strong>${emp.hourly_rate} €</strong></div>
                </div>
                <div class="list-item-actions">
                    <button onclick="openEditEmployee(${emp.id}, '${emp.name}', ${emp.hourly_rate})" class="btn-item-delete">✏️</button>
                    <button onclick="deleteEmployee(${emp.id})" class="btn-item-delete">🗑️</button>
                </div>
            `;
            list.appendChild(div);
        });
    } catch (error) {
        console.error('❌ Chyba pri načítaní zamestnancov:', error);
    }
}

// ============ PROJEKTY ============

async function addProject() {
    const name = document.getElementById('newProjectName').value.trim();

    if (!name) {
        alert('❌ Zadaj názov projektu!');
        return;
    }

    try {
        const { error } = await supabaseClient.from('projects').insert({
            name: name,
            is_active: true
        });

        if (error) throw error;

        closeAddProject();
        loadProjects();
        loadProjectsForLead();
    } catch (error) {
        console.error('❌ Chyba:', error);
        alert('❌ Chyba: ' + error.message);
    }
}

async function toggleProject(projId, currentStatus) {
    try {
        const { error } = await supabaseClient
            .from('projects')
            .update({ is_active: !currentStatus })
            .eq('id', projId);

        if (error) throw error;
        loadProjects();
        loadProjectsForLead();
    } catch (error) {
        console.error('❌ Chyba:', error);
        alert('❌ Chyba: ' + error.message);
    }
}

async function deleteProject(projId) {
    if (!confirm('Naozaj chceš zmazať projekt?')) return;

    try {
        const { error } = await supabaseClient.from('projects').delete().eq('id', projId);
        if (error) throw error;
        loadProjects();
        loadProjectsForLead();
    } catch (error) {
        console.error('❌ Chyba:', error);
        alert('❌ Chyba: ' + error.message);
    }
}

async function loadProjects() {
    try {
        const { data, error } = await supabaseClient.from('projects').select('*').order('name', { ascending: true });
        if (error) {
            console.error('❌ Chyba pri načítaní:', error);
            throw error;
        }

        const list = document.getElementById('projectsList');
        if (!list) return;
        
        list.innerHTML = '';

        if (!data || data.length === 0) {
            list.innerHTML = '<div class="empty-state">Žiadne projekty. Pridaj prvý!</div>';
            return;
        }

        data.forEach(proj => {
            const div = document.createElement('div');
            div.className = 'list-item';
            const statusText = proj.is_active ? '✅ Aktívny' : '❌ Neaktívny';
            const statusClass = proj.is_active ? 'active' : 'inactive';
            
            div.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">${proj.name}</div>
                    <div class="list-item-subtitle status-${statusClass}">${statusText}</div>
                </div>
                <div class="list-item-actions">
                    <button onclick="toggleProject(${proj.id}, ${proj.is_active})" class="btn-item-toggle">
                        ${proj.is_active ? '🔴' : '🟢'}
                    </button>
                    <button onclick="deleteProject(${proj.id})" class="btn-item-delete">🗑️</button>
                </div>
            `;
            list.appendChild(div);
        });
    } catch (error) {
        console.error('❌ Chyba pri načítaní projektov:', error);
    }
}

// ============ DOCHÁDZKA ============

async function loadAttendance() {
    const monthInput = document.getElementById('attendanceMonth').value;
    
    if (!monthInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        document.getElementById('attendanceMonth').value = `${year}-${month}`;
        return;
    }

    const [year, month] = monthInput.split('-');
    const monthStart = `${year}-${month}-01`;
    const lastDay = new Date(year, parseInt(month), 0).getDate();
    const monthEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

    const monthNames = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 
                       'Júl', 'August', 'September', 'Október', 'November', 'December'];

    try {
        const { data, error } = await supabaseClient
            .from('attendance')
            .select(`
                id, 
                employee_id, 
                project_id, 
                hours, 
                date, 
                employees(name), 
                projects(name)
            `)
            .gte('date', monthStart)
            .lte('date', monthEnd)
            .order('date', { ascending: false });

        if (error) {
            console.error('❌ Chyba pri načítaní:', error);
            throw error;
        }

        const list = document.getElementById('attendanceList');
        if (!list) return;
        
        list.innerHTML = '';

        if (!data || data.length === 0) {
            list.innerHTML = `<div class="empty-state">Žiadne záznamy v ${monthNames[parseInt(month) - 1]} ${year}.</div>`;
            return;
        }

        data.forEach(att => {
            const div = document.createElement('div');
            div.className = 'list-item';
            const empName = att.employees ? att.employees.name : 'N/A';
            const projName = att.projects ? att.projects.name : 'N/A';
            
            div.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">${empName}</div>
                    <div class="list-item-subtitle">📦 ${projName} • 📅 ${att.date} • ⏱️ ${att.hours}h</div>
                </div>
                <button onclick="deleteAttendance(${att.id})" class="btn-item-delete">🗑️</button>
            `;
            list.appendChild(div);
        });
    } catch (error) {
        console.error('❌ Chyba pri načítaní dochádzky:', error);
    }
}

async function deleteAttendance(attId) {
    if (!confirm('Naozaj chceš zmazať záznam?')) return;

    try {
        const { error } = await supabaseClient.from('attendance').delete().eq('id', attId);
        if (error) throw error;
        loadAttendance();
    } catch (error) {
        console.error('❌ Chyba:', error);
        alert('❌ Chyba: ' + error.message);
    }
}

// ============ DASHBOARD ============

async function loadDashboard() {
    try {
        // LOAD ALL DATA
        const { data: employees } = await supabaseClient.from('employees').select('id, name');
        const { data: projects } = await supabaseClient.from('projects').select('*').eq('is_active', true);
        
        const today = new Date().toISOString().split('T')[0];
        const { data: todayAttendance } = await supabaseClient
            .from('attendance')
            .select('hours, employee_id, project_id, employees(name), projects(name)')
            .eq('date', today);
        
        const firstDay = new Date();
        firstDay.setDate(1);
        const monthStart = firstDay.toISOString().split('T')[0];
        
        const { data: monthAttendance } = await supabaseClient
            .from('attendance')
            .select('hours, employee_id, project_id, date, employees(name), projects(name)')
            .gte('date', monthStart);

        // METRIKY
        const totalHoursToday = todayAttendance ? todayAttendance.reduce((sum, att) => sum + parseFloat(att.hours), 0) : 0;
        const totalHoursMonth = monthAttendance ? monthAttendance.reduce((sum, att) => sum + parseFloat(att.hours), 0) : 0;
        const uniqueWorkersToday = new Set(todayAttendance?.map(att => att.employee_id) || []).size;

        document.getElementById('activeWorkers').textContent = uniqueWorkersToday;
        document.getElementById('totalProjects').textContent = projects ? projects.length : 0;
        document.getElementById('hoursToday').textContent = totalHoursToday.toFixed(1);
        document.getElementById('hoursMonth').textContent = totalHoursMonth.toFixed(1);

        // AKTÍVNE PROJEKTY
        const projectsHours = {};
        monthAttendance?.forEach(att => {
            const projName = att.projects?.name || 'Bez projektu';
            projectsHours[projName] = (projectsHours[projName] || 0) + parseFloat(att.hours);
        });

        const projectsList = document.getElementById('projectsList');
        projectsList.innerHTML = '';
        if (projects && projects.length > 0) {
            projects.slice(0, 5).forEach(proj => {
                const hours = projectsHours[proj.name] || 0;
                const div = document.createElement('div');
                div.className = 'project-item';
                div.innerHTML = `
                    <div class="project-item-header">
                        <span class="project-name">🏗️ ${proj.name}</span>
                        <span class="project-status">Aktívny</span>
                    </div>
                    <div class="project-info">
                        <span>⏱️ ${hours.toFixed(1)}h</span>
                    </div>
                `;
                projectsList.appendChild(div);
            });
        }

        // PRACOVNÍCI DNES
        const workersList = document.getElementById('workersList');
        workersList.innerHTML = '';
        const workersToday = {};
        todayAttendance?.forEach(att => {
            const name = att.employees?.name || 'Neznámy';
            workersToday[name] = (workersToday[name] || 0) + parseFloat(att.hours);
        });

        Object.entries(workersToday).forEach(([name, hours]) => {
            const div = document.createElement('div');
            div.className = 'worker-item';
            div.innerHTML = `
                <div class="project-item-header">
                    <span class="project-name">👷 ${name}</span>
                </div>
                <div class="project-info">
                    <span>⏱️ ${hours.toFixed(1)}h dnes</span>
                </div>
            `;
            workersList.appendChild(div);
        });

        if (Object.keys(workersToday).length === 0) {
            workersList.innerHTML = '<div class="stat-item"><span class="stat-name">Nikto neštvára dnes</span></div>';
        }

        // MESAČNÝ TREND
        const dailyHours = {};
        monthAttendance?.forEach(att => {
            dailyHours[att.date] = (dailyHours[att.date] || 0) + parseFloat(att.hours);
        });

        const sortedDates = Object.keys(dailyHours).sort();
        const chartLabels = sortedDates.map(d => {
            const date = new Date(d);
            return date.getDate() + '.' + (date.getMonth() + 1);
        });
        const chartData = sortedDates.map(d => dailyHours[d]);

        const ctx = document.getElementById('trendsChart')?.getContext('2d');
        if (ctx && window.Chart) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'Hodiny za deň',
                        data: chartData,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#667eea',
                        pointBorderColor: '#fff',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            labels: { color: '#94a3b8', font: { size: 12 } }
                        }
                    },
                    scales: {
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#94a3b8' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            });
        }

        // HODINY PODĽA PROJEKTOV
        const projectsStats = document.getElementById('projectsStats');
        projectsStats.innerHTML = '';
        Object.entries(projectsHours)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([name, hours]) => {
                const div = document.createElement('div');
                div.className = 'stat-item';
                div.innerHTML = `
                    <span class="stat-name">📌 ${name}</span>
                    <span class="stat-value">${hours.toFixed(1)}h</span>
                `;
                projectsStats.appendChild(div);
            });

        // TOP PRACOVNÍCI
        const workersStats = {};
        monthAttendance?.forEach(att => {
            const name = att.employees?.name || 'Neznámy';
            workersStats[name] = (workersStats[name] || 0) + parseFloat(att.hours);
        });

        const topWorkers = document.getElementById('topWorkers');
        topWorkers.innerHTML = '';
        Object.entries(workersStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([name, hours]) => {
                const div = document.createElement('div');
                div.className = 'stat-item';
                div.innerHTML = `
                    <span class="stat-name">👷 ${name}</span>
                    <span class="stat-value">${hours.toFixed(1)}h</span>
                `;
                topWorkers.appendChild(div);
            });

    } catch (error) {
        console.error('❌ Chyba pri načítaní dashboardu:', error);
    }
}

// ============ VÝPLATY ============

// ============ VÝPLATY ============

async function calculateSalaries() {
    const monthInput = document.getElementById('salaryMonth').value;
    
    if (!monthInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        document.getElementById('salaryMonth').value = `${year}-${month}`;
        return;
    }

    try {
        const [year, month] = monthInput.split('-');
        const firstHalfStart = `${year}-${month}-01`;
        const firstHalfEnd = `${year}-${month}-15`;
        const secondHalfStart = `${year}-${month}-16`;
        
        // Posledný deň mesiaca
        const lastDay = new Date(year, parseInt(month), 0).getDate();
        const secondHalfEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

        console.log('📊 Výpočet výplat za:', monthInput);
        console.log('Rozsahy dátumov:', { firstHalfStart, firstHalfEnd, secondHalfStart, secondHalfEnd });

        // LOAD ZAMESTNANCOV
        const { data: employees, error: empError } = await supabaseClient
            .from('employees')
            .select('*')
            .order('name', { ascending: true });

        if (empError) {
            console.error('❌ Chyba pri načítaní zamestnancov:', empError);
            throw empError;
        }

        console.log('👥 Zamestnanci:', employees);

        if (!employees || employees.length === 0) {
            document.getElementById('salariesList').innerHTML = '<div class="empty-state">Žiadni zamestnanci v systéme.</div>';
            return;
        }

        const monthNames = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 
                           'Júl', 'August', 'September', 'Október', 'November', 'December'];

        let html = `<div class="salary-header"><h3>Výplaty za ${monthNames[parseInt(month) - 1]} ${year}</h3></div>`;
        html += `<div class="salary-table-wrapper"><table class="salary-table">
                    <thead>
                        <tr>
                            <th>Meno</th>
                            <th>Hodinová mzda</th>
                            <th>1. polovica (1-15)</th>
                            <th>2. polovica (16-31)</th>
                            <th>Celkem za mesiac</th>
                        </tr>
                    </thead>
                    <tbody>`;

        let totalMonthSalary = 0;
        let totalMonthHours = 0;

        for (const emp of employees) {
            console.log(`\n📝 Spracúvam: ${emp.name} (ID: ${emp.id})`);

            // 1. POLOVICA
            const { data: firstHalf, error: fhError } = await supabaseClient
                .from('attendance')
                .select('hours, date')
                .eq('employee_id', emp.id)
                .gte('date', firstHalfStart)
                .lte('date', firstHalfEnd);

            console.log(`  1. pol. data:`, firstHalf, 'Error:', fhError);
            const hoursFirstHalf = (firstHalf && !fhError) ? firstHalf.reduce((sum, att) => sum + parseFloat(att.hours || 0), 0) : 0;
            const salaryFirstHalf = hoursFirstHalf * emp.hourly_rate;
            console.log(`  1. pol: ${hoursFirstHalf}h × ${emp.hourly_rate}€ = ${salaryFirstHalf}€`);

            // 2. POLOVICA
            const { data: secondHalf, error: shError } = await supabaseClient
                .from('attendance')
                .select('hours, date')
                .eq('employee_id', emp.id)
                .gte('date', secondHalfStart)
                .lte('date', secondHalfEnd);

            console.log(`  2. pol. data:`, secondHalf, 'Error:', shError);
            const hoursSecondHalf = (secondHalf && !shError) ? secondHalf.reduce((sum, att) => sum + parseFloat(att.hours || 0), 0) : 0;
            const salarySecondHalf = hoursSecondHalf * emp.hourly_rate;
            console.log(`  2. pol: ${hoursSecondHalf}h × ${emp.hourly_rate}€ = ${salarySecondHalf}€`);

            const totalHours = hoursFirstHalf + hoursSecondHalf;
            const totalSalary = salaryFirstHalf + salarySecondHalf;

            totalMonthHours += totalHours;
            totalMonthSalary += totalSalary;

            html += `
                <tr>
                    <td><strong>${emp.name}</strong></td>
                    <td>${emp.hourly_rate.toFixed(2)} €</td>
                    <td>${hoursFirstHalf.toFixed(1)}h (${salaryFirstHalf.toFixed(2)} €)</td>
                    <td>${hoursSecondHalf.toFixed(1)}h (${salarySecondHalf.toFixed(2)} €)</td>
                    <td><strong>${totalHours.toFixed(1)}h (${totalSalary.toFixed(2)} €)</strong></td>
                </tr>
            `;
        }

        console.log(`\n✅ CELKEM: ${totalMonthHours}h = ${totalMonthSalary}€`);

        html += `
            <tr style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%); font-weight: 700; border-top: 2px solid #667eea;">
                <td colspan="2">CELKEM ZA MESIAC</td>
                <td colspan="3"><strong>${totalMonthHours.toFixed(1)}h (${totalMonthSalary.toFixed(2)} €)</strong></td>
            </tr>
        `;

        html += `</tbody></table></div>`;
        document.getElementById('salariesList').innerHTML = html;
    } catch (error) {
        console.error('❌ Chyba pri výpočte výplat:', error);
        document.getElementById('salariesList').innerHTML = `<div class="empty-state">❌ Chyba: ${error.message}</div>`;
    }
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('workDate');
    if (dateInput) dateInput.value = today;
}

// ============ INICIALIZÁCIA ============
document.addEventListener('DOMContentLoaded', async () => {
    await initSupabase();
    
    if (document.getElementById('loginModal')) {
        initializeAdmin();
    } 
    else if (document.getElementById('attendanceForm')) {
        loadEmployeesForLead();
        loadProjectsForLead();
        
        setTodayDate();
        calculateWorkHours();
        
        document.getElementById('timeFrom').addEventListener('change', calculateWorkHours);
        document.getElementById('timeTo').addEventListener('change', calculateWorkHours);
        document.getElementById('breakMinutes').addEventListener('input', calculateWorkHours);
        document.getElementById('attendanceForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitAttendance();
        });
    }
});