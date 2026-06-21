// ============ SUPABASE INICIALIZÁCIA ============
const SUPABASE_URL = 'https://zduvtihmbppwgukbaaxx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ISftud-eccL_0Dw1m1VR0g_O9xgKHR_';
const ADMIN_PASSWORD = 'admin123';

let supabaseClient = null;

// Inicializácia Supabase
async function initSupabase() {
    if (supabaseClient) return;
    
    try {
        const { createClient } = window.supabase;
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (error) {
        console.error('Chyba pri inicializácii Supabase:', error);
    }
}

// ============ VEDÚCI FORMULÁR ============

async function loadEmployeesForLead() {
    await initSupabase();
    try {
        const { data, error } = await supabaseClient.from('employees').select('id, name');
        if (error) throw error;
        
        const select = document.getElementById('employeeName');
        if (!select) return;
        
        select.innerHTML = '<option value="">Vyber meno</option>';
        data.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.id;
            option.textContent = emp.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Chyba pri načítaní zamestnancov:', error);
    }
}

async function loadProjectsForLead() {
    await initSupabase();
    try {
        const { data, error } = await supabaseClient
            .from('projects')
            .select('id, name')
            .eq('is_active', true);
        
        if (error) throw error;
        
        const select = document.getElementById('projectName');
        if (!select) return;
        
        select.innerHTML = '<option value="">Vyber projekt</option>';
        data.forEach(proj => {
            const option = document.createElement('option');
            option.value = proj.id;
            option.textContent = proj.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Chyba pri načítaní projektov:', error);
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
            employee_id: employeeId,
            project_id: projectId,
            hours: calculatedHours,
            date: workDate
        });

        if (error) throw error;

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

// ============ ADMIN PANEL - NOVÉ FUNKCIE ============

function switchSection(sectionId) {
    // Skry všetky sekcie
    document.querySelectorAll('.section').forEach(el => {
        el.classList.remove('active');
    });

    // Zobraz vybraný section
    document.getElementById(sectionId).classList.add('active');

    // Update navbar
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');

    // Update titulok
    const titles = {
        dashboard: '📊 Dashboard',
        employees: '👥 Zamestnanci',
        projects: '📦 Projekty',
        attendance: '📋 Dochádzka',
        salaries: '💰 Výplaty'
    };
    document.getElementById('sectionTitle').textContent = titles[sectionId];

    // Načítaj dáta
    if (sectionId === 'dashboard') {
        loadDashboard();
    } else if (sectionId === 'employees') {
        loadEmployees();
    } else if (sectionId === 'projects') {
        loadProjects();
    } else if (sectionId === 'attendance') {
        loadAttendance();
    } else if (sectionId === 'salaries') {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        document.getElementById('salaryMonth').value = `${year}-${month}`;
    }
}

function openAddEmployee() {
    document.getElementById('addEmployeeForm').style.display = 'block';
    document.getElementById('newEmployeeName').focus();
}

function closeAddEmployee() {
    document.getElementById('addEmployeeForm').style.display = 'none';
    document.getElementById('newEmployeeName').value = '';
    document.getElementById('newEmployeeRate').value = '';
}

function openAddProject() {
    document.getElementById('addProjectForm').style.display = 'block';
    document.getElementById('newProjectName').focus();
}

function closeAddProject() {
    document.getElementById('addProjectForm').style.display = 'none';
    document.getElementById('newProjectName').value = '';
}

// ============ ADMIN INICIALIZÁCIA ============

async function initializeAdmin() {
    await initSupabase();
    
    const today = new Date().toISOString().split('T')[0];
    const filterDateInput = document.getElementById('filterDate');
    if (filterDateInput) filterDateInput.value = today;
    
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
    const name = document.getElementById('newEmployeeName').value;
    const rate = parseFloat(document.getElementById('newEmployeeRate').value);

    if (!name || !rate || rate <= 0) {
        alert('Vyplň všetky polia správne!');
        return;
    }

    try {
        const { error } = await supabaseClient.from('employees').insert({
            name: name,
            hourly_rate: rate
        });

        if (error) throw error;

        closeAddEmployee();
        loadEmployees();
        loadEmployeesForLead();
    } catch (error) {
        alert('Chyba: ' + error.message);
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
        alert('Chyba: ' + error.message);
    }
}

async function loadEmployees() {
    try {
        const { data, error } = await supabaseClient.from('employees').select('*').order('name', { ascending: true });
        if (error) throw error;

        const list = document.getElementById('employeesList');
        if (!list) return;
        
        list.innerHTML = '';

        if (data.length === 0) {
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
                <button onclick="deleteEmployee(${emp.id})" class="btn-item-delete">🗑️</button>
            `;
            list.appendChild(div);
        });
    } catch (error) {
        console.error('Chyba pri načítaní zamestnancov:', error);
    }
}

// ============ PROJEKTY ============

async function addProject() {
    const name = document.getElementById('newProjectName').value;

    if (!name) {
        alert('Zadaj názov projektu!');
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
        alert('Chyba: ' + error.message);
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
        alert('Chyba: ' + error.message);
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
        alert('Chyba: ' + error.message);
    }
}

async function loadProjects() {
    try {
        const { data, error } = await supabaseClient.from('projects').select('*').order('name', { ascending: true });
        if (error) throw error;

        const list = document.getElementById('projectsList');
        if (!list) return;
        
        list.innerHTML = '';

        if (data.length === 0) {
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
        console.error('Chyba pri načítaní projektov:', error);
    }
}

// ============ DOCHÁDZKA ============

async function loadAttendance() {
    await filterAttendance();
}

async function filterAttendance() {
    const filterDate = document.getElementById('filterDate').value;

    try {
        let query = supabaseClient.from('attendance').select(`
            id, 
            employee_id, 
            project_id, 
            hours, 
            date, 
            employees(name), 
            projects(name)
        `).order('date', { ascending: false });

        if (filterDate) {
            query = query.eq('date', filterDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        const list = document.getElementById('attendanceList');
        if (!list) return;
        
        list.innerHTML = '';

        if (data.length === 0) {
            list.innerHTML = '<div class="empty-state">Žiadne záznamy na tento deň.</div>';
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
        console.error('Chyba pri načítaní dochádzky:', error);
    }
}

async function deleteAttendance(attId) {
    if (!confirm('Naozaj chceš zmazať záznam?')) return;

    try {
        const { error } = await supabaseClient.from('attendance').delete().eq('id', attId);
        if (error) throw error;
        loadAttendance();
    } catch (error) {
        alert('Chyba: ' + error.message);
    }
}

// ============ DASHBOARD ============

async function loadDashboard() {
    try {
        const { data: employees } = await supabaseClient.from('employees').select('id');
        const { data: projects } = await supabaseClient.from('projects').select('id');
        
        const today = new Date().toISOString().split('T')[0];
        const { data: todayAttendance } = await supabaseClient
            .from('attendance')
            .select('hours')
            .eq('date', today);
        
        const totalHoursToday = todayAttendance ? todayAttendance.reduce((sum, att) => sum + parseFloat(att.hours), 0) : 0;

        const firstDay = new Date();
        firstDay.setDate(1);
        const monthStart = firstDay.toISOString().split('T')[0];
        
        const { data: monthAttendance } = await supabaseClient
            .from('attendance')
            .select('hours')
            .gte('date', monthStart);
        
        const totalHoursMonth = monthAttendance ? monthAttendance.reduce((sum, att) => sum + parseFloat(att.hours), 0) : 0;

        const dashboard = document.getElementById('dashboard');
        if (!dashboard) return;
        
        dashboard.innerHTML = `
            <div class="dashboard-card">
                <div class="card-icon">👥</div>
                <div class="card-content">
                    <div class="card-label">Zamestnanci</div>
                    <div class="card-value">${employees ? employees.length : 0}</div>
                </div>
            </div>
            <div class="dashboard-card">
                <div class="card-icon">📦</div>
                <div class="card-content">
                    <div class="card-label">Projekty</div>
                    <div class="card-value">${projects ? projects.length : 0}</div>
                </div>
            </div>
            <div class="dashboard-card">
                <div class="card-icon">⏱️</div>
                <div class="card-content">
                    <div class="card-label">Hodiny dnes</div>
                    <div class="card-value">${totalHoursToday.toFixed(1)}</div>
                </div>
            </div>
            <div class="dashboard-card">
                <div class="card-icon">📊</div>
                <div class="card-content">
                    <div class="card-label">Hodiny mesiac</div>
                    <div class="card-value">${totalHoursMonth.toFixed(1)}</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Chyba pri načítaní dashboardu:', error);
    }
}

// ============ VÝPLATY ============

async function calculateSalaries() {
    const monthInput = document.getElementById('salaryMonth').value;
    
    if (!monthInput) {
        alert('Vyber mesiac!');
        return;
    }

    try {
        const [year, month] = monthInput.split('-');
        const firstHalfStart = `${year}-${month}-01`;
        const firstHalfEnd = `${year}-${month}-15`;
        const secondHalfStart = `${year}-${month}-16`;
        const secondHalfEnd = `${year}-${month}-31`;

        const { data: employees } = await supabaseClient.from('employees').select('*').order('name', { ascending: true });

        let html = `<div class="salary-header"><h3>Výplaty za ${monthInput}</h3></div>`;
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

        for (const emp of employees) {
            const { data: firstHalf } = await supabaseClient
                .from('attendance')
                .select('hours')
                .eq('employee_id', emp.id)
                .gte('date', firstHalfStart)
                .lte('date', firstHalfEnd);

            const hoursFirstHalf = firstHalf ? firstHalf.reduce((sum, att) => sum + parseFloat(att.hours), 0) : 0;
            const salaryFirstHalf = hoursFirstHalf * emp.hourly_rate;

            const { data: secondHalf } = await supabaseClient
                .from('attendance')
                .select('hours')
                .eq('employee_id', emp.id)
                .gte('date', secondHalfStart)
                .lte('date', secondHalfEnd);

            const hoursSecondHalf = secondHalf ? secondHalf.reduce((sum, att) => sum + parseFloat(att.hours), 0) : 0;
            const salarySecondHalf = hoursSecondHalf * emp.hourly_rate;

            const totalHours = hoursFirstHalf + hoursSecondHalf;
            const totalSalary = salaryFirstHalf + salarySecondHalf;

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

        html += `</tbody></table></div>`;
        document.getElementById('salariesList').innerHTML = html;
    } catch (error) {
        console.error('Chyba pri výpočte výplat:', error);
        alert('Chyba: ' + error.message);
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
    
    // Admin panel
    if (document.getElementById('loginModal')) {
        initializeAdmin();
    } 
    // Vedúci formulár
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