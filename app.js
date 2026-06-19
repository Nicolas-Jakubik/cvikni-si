// ============ SUPABASE INICIALIZÁCIA ============
const SUPABASE_URL = 'https://zduvtihmbppwgukbaaxx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ISftud-eccL_0Dw1m1VR0g_O9xgKHR_';
const ADMIN_PASSWORD = 'admin123';

let supabase = null;
let isAdminLoggedIn = false;

// Inicializácia Supabase
async function initSupabase() {
    if (supabase) return;
    
    const { createClient } = window.supabase;
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ============ VEDÚCI FORMULÁR ============

async function loadEmployeesForLead() {
    await initSupabase();
    try {
        const { data, error } = await supabase.from('employees').select('id, name');
        if (error) throw error;
        
        const select = document.getElementById('employeeName');
        if (!select) return;
        
        select.innerHTML = '<option value="">-- Vyber meno --</option>';
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
        const { data, error } = await supabase
            .from('projects')
            .select('id, name')
            .eq('is_active', true);
        
        if (error) throw error;
        
        const select = document.getElementById('projectName');
        if (!select) return;
        
        select.innerHTML = '<option value="">-- Vyber projekt --</option>';
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

async function submitAttendance() {
    const employeeId = document.getElementById('employeeName').value;
    const projectId = document.getElementById('projectName').value;
    const hours = parseFloat(document.getElementById('hours').value);
    const workDate = document.getElementById('workDate').value;
    const messageDiv = document.getElementById('message');

    if (!employeeId || !projectId || !hours || !workDate) {
        messageDiv.className = 'message error';
        messageDiv.textContent = '❌ Vyplň všetky polia!';
        return;
    }

    try {
        const { error } = await supabase.from('attendance').insert({
            employee_id: employeeId,
            project_id: projectId,
            hours: hours,
            date: workDate
        });

        if (error) throw error;

        messageDiv.className = 'message success';
        messageDiv.textContent = '✅ Hodiny boli uložené!';
        
        document.getElementById('attendanceForm').reset();
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

async function initializeAdmin() {
    await initSupabase();
    
    const today = new Date().toISOString().split('T')[0];
    const filterDateInput = document.getElementById('filterDate');
    if (filterDateInput) filterDateInput.value = today;
    
    const salaryMonthInput = document.getElementById('salaryMonth');
    if (salaryMonthInput) {
        const currentMonth = new Date().toISOString().substring(0, 7);
        salaryMonthInput.value = currentMonth;
    }
    
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
    if (adminPanel) adminPanel.style.display = 'block';
    
    loadEmployees();
    loadProjects();
    loadAttendance();
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
        const { error } = await supabase.from('employees').insert({
            name: name,
            hourly_rate: rate
        });

        if (error) throw error;

        document.getElementById('newEmployeeName').value = '';
        document.getElementById('newEmployeeRate').value = '';
        loadEmployees();
        loadEmployeesForLead();
    } catch (error) {
        alert('Chyba: ' + error.message);
    }
}

async function deleteEmployee(empId) {
    if (!confirm('Naozaj chceš zmazať zamestnanca?')) return;

    try {
        const { error } = await supabase.from('employees').delete().eq('id', empId);
        if (error) throw error;
        loadEmployees();
        loadEmployeesForLead();
    } catch (error) {
        alert('Chyba: ' + error.message);
    }
}

async function loadEmployees() {
    try {
        const { data, error } = await supabase.from('employees').select('*').order('name', { ascending: true });
        if (error) throw error;

        const list = document.getElementById('employeesList');
        if (!list) return;
        
        list.innerHTML = '';

        if (data.length === 0) {
            list.innerHTML = '<p>Žiadni zamestnanci</p>';
            return;
        }

        data.forEach(emp => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <div>
                    <strong>${emp.name}</strong><br>
                    <small>Hodinová mzda: ${emp.hourly_rate} €</small>
                </div>
                <button onclick="deleteEmployee(${emp.id})" class="btn-delete">Zmaž</button>
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
        const { error } = await supabase.from('projects').insert({
            name: name,
            is_active: true
        });

        if (error) throw error;

        document.getElementById('newProjectName').value = '';
        loadProjects();
        loadProjectsForLead();
    } catch (error) {
        alert('Chyba: ' + error.message);
    }
}

async function toggleProject(projId, currentStatus) {
    try {
        const { error } = await supabase
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
        const { error } = await supabase.from('projects').delete().eq('id', projId);
        if (error) throw error;
        loadProjects();
        loadProjectsForLead();
    } catch (error) {
        alert('Chyba: ' + error.message);
    }
}

async function loadProjects() {
    try {
        const { data, error } = await supabase.from('projects').select('*').order('name', { ascending: true });
        if (error) throw error;

        const list = document.getElementById('projectsList');
        if (!list) return;
        
        list.innerHTML = '';

        if (data.length === 0) {
            list.innerHTML = '<p>Žiadne projekty</p>';
            return;
        }

        data.forEach(proj => {
            const div = document.createElement('div');
            div.className = 'list-item';
            const statusText = proj.is_active ? '✅ Aktívny' : '❌ Neaktívny';
            const statusClass = proj.is_active ? '' : 'inactive-project';
            
            div.innerHTML = `
                <div class="${statusClass}">
                    <strong>${proj.name}</strong><br>
                    <small>${statusText}</small>
                </div>
                <div class="list-item-actions">
                    <button onclick="toggleProject(${proj.id}, ${proj.is_active})" class="btn-toggle ${!proj.is_active ? 'inactive' : ''}">
                        ${proj.is_active ? 'Deaktivuj' : 'Aktivuj'}
                    </button>
                    <button onclick="deleteProject(${proj.id})" class="btn-delete">Zmaž</button>
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
        let query = supabase.from('attendance').select(`
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
            list.innerHTML = '<p>Žiadne záznamy</p>';
            return;
        }

        data.forEach(att => {
            const div = document.createElement('div');
            div.className = 'list-item';
            const empName = att.employees ? att.employees.name : 'N/A';
            const projName = att.projects ? att.projects.name : 'N/A';
            
            div.innerHTML = `
                <div>
                    <strong>${empName}</strong><br>
                    <small>Projekt: ${projName}</small><br>
                    <small>Dátum: ${att.date} | Hodiny: ${att.hours}</small>
                </div>
                <button onclick="deleteAttendance(${att.id})" class="btn-delete">Zmaž</button>
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
        const { error } = await supabase.from('attendance').delete().eq('id', attId);
        if (error) throw error;
        loadAttendance();
    } catch (error) {
        alert('Chyba: ' + error.message);
    }
}

// ============ DASHBOARD ============

async function loadDashboard() {
    try {
        const { data: employees } = await supabase.from('employees').select('id');
        const { data: projects } = await supabase.from('projects').select('id');
        
        const today = new Date().toISOString().split('T')[0];
        const { data: todayAttendance } = await supabase
            .from('attendance')
            .select('hours')
            .eq('date', today);
        
        const totalHoursToday = todayAttendance.reduce((sum, att) => sum + parseFloat(att.hours), 0);

        const firstDay = new Date();
        firstDay.setDate(1);
        const monthStart = firstDay.toISOString().split('T')[0];
        
        const { data: monthAttendance } = await supabase
            .from('attendance')
            .select('hours')
            .gte('date', monthStart);
        
        const totalHoursMonth = monthAttendance.reduce((sum, att) => sum + parseFloat(att.hours), 0);

        const dashboard = document.getElementById('dashboard');
        if (!dashboard) return;
        
        dashboard.innerHTML = `
            <div class="dashboard-card">
                <h3>👥 Zamestnanci</h3>
                <div class="value">${employees.length}</div>
            </div>
            <div class="dashboard-card">
                <h3>📦 Projekty</h3>
                <div class="value">${projects.length}</div>
            </div>
            <div class="dashboard-card">
                <h3>⏱️ Hodiny dnes</h3>
                <div class="value">${totalHoursToday.toFixed(1)}</div>
            </div>
            <div class="dashboard-card">
                <h3>📊 Hodiny tento mesiac</h3>
                <div class="value">${totalHoursMonth.toFixed(1)}</div>
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

        const { data: employees } = await supabase.from('employees').select('*').order('name', { ascending: true });

        let html = `<h3>Výplaty za ${monthInput}</h3>`;
        html += `<table class="salary-table">
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
            const { data: firstHalf } = await supabase
                .from('attendance')
                .select('hours')
                .eq('employee_id', emp.id)
                .gte('date', firstHalfStart)
                .lte('date', firstHalfEnd);

            const hoursFirstHalf = firstHalf.reduce((sum, att) => sum + parseFloat(att.hours), 0);
            const salaryFirstHalf = hoursFirstHalf * emp.hourly_rate;

            const { data: secondHalf } = await supabase
                .from('attendance')
                .select('hours')
                .eq('employee_id', emp.id)
                .gte('date', secondHalfStart)
                .lte('date', secondHalfEnd);

            const hoursSecondHalf = secondHalf.reduce((sum, att) => sum + parseFloat(att.hours), 0);
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

        html += `</tbody></table>`;
        document.getElementById('salariesList').innerHTML = html;
    } catch (error) {
        console.error('Chyba pri výpočte výplat:', error);
        alert('Chyba: ' + error.message);
    }
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
        
        document.getElementById('attendanceForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitAttendance();
        });
    }
});