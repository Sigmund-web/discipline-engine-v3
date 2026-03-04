/* --- DISCIPLINE ENGINE v3: MISSION CRITICAL --- */

const quotes = [
    "HARD WORK ISN'T ENOUGH. PRECISION IS REQUIRED.",
    "CODE YOUR DESTINY.",
    "EMBRACE THE DEEP WORK.",
    "REPETITION IS THE MOTHER OF MASTERY."
];

let currentUser = null;
let performanceChart = null; // Graph instance
const DAYS_IN_MONTH = 31;
const DB_NAME = 'discipline_engine_db';

window.onload = () => {
    renderMonthHeaders();
    checkSession();
    restoreAvatar();
};

/** 1. IDENTITY & AUTH **/
function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            const imgData = e.target.result;
            document.getElementById('profile-preview').src = imgData;
            document.getElementById('dash-photo').src = imgData;
            localStorage.setItem('officer_avatar', imgData);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function restoreAvatar() {
    const savedImg = localStorage.getItem('officer_avatar');
    if (savedImg) {
        document.getElementById('profile-preview').src = savedImg;
        document.getElementById('dash-photo').src = savedImg;
    }
}

function handleAuth() {
    const userField = document.getElementById('login-user');
    const user = userField.value.trim().toUpperCase();
    
    if (!user) return alert("CALLSIGN REQUIRED FOR MISSION START.");

    let db = JSON.parse(localStorage.getItem(DB_NAME)) || {};
    if (!db[user]) {
        db[user] = { habits: [] };
        localStorage.setItem(DB_NAME, JSON.stringify(db));
    }

    sessionStorage.setItem('active_officer', user);
    currentUser = user;
    initEngine();
}

function checkSession() {
    const session = sessionStorage.getItem('active_officer');
    if (session) {
        currentUser = session;
        initEngine();
    }
}

function logout() {
    sessionStorage.removeItem('active_officer');
    location.reload();
}

function initEngine() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('display-name').innerText = currentUser;
    
    const quoteBox = document.getElementById('quote-display');
    quoteBox.innerText = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
    
    loadHabitData();
}

/** 2. HABIT ENGINE **/
function renderMonthHeaders() {
    const row = document.getElementById('month-headers');
    if (!row) return;
    row.innerHTML = '<th style="text-align: left; padding: 15px;">OBJECTIVE</th>';
    for (let i = 1; i <= DAYS_IN_MONTH; i++) {
        const th = document.createElement('th');
        th.innerText = i.toString().padStart(2, '0');
        row.appendChild(th);
    }
}

function loadHabitData() {
    const db = JSON.parse(localStorage.getItem(DB_NAME)) || {};
    const userData = db[currentUser]?.habits || [];
    const container = document.getElementById('master-rows');
    if (!container) return;
    container.innerHTML = "";

    userData.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.className = "task-row";
        
        let html = `<td class="task-info">
            <button class="action-btn" onclick="deleteHabit(${index})">✕</button>
            <strong style="color:var(--accent)">${item.time}</strong> ${item.task}
        </td>`;

        item.states.forEach((state, dayIndex) => {
            html += `<td style="text-align:center">
                <div class="checker-circle ${state ? 'active' : ''}" 
                     onclick="toggleCheck(${index}, ${dayIndex})"></div>
            </td>`;
        });

        tr.innerHTML = html;
        container.appendChild(tr);
    });
    
    updateEfficiency();
    updatePerformanceGraph(); // Update Graph
}

function addNewTask() {
    const timeInput = document.getElementById('new-time');
    const taskInput = document.getElementById('new-task');
    const time = timeInput.value || "00:00";
    const task = taskInput.value.trim();
    
    if (!task) return;

    let db = JSON.parse(localStorage.getItem(DB_NAME));
    db[currentUser].habits.push({ 
        time, 
        task, 
        states: new Array(DAYS_IN_MONTH).fill(false) 
    });
    localStorage.setItem(DB_NAME, JSON.stringify(db));
    
    loadHabitData();
    taskInput.value = "";
}

function toggleCheck(habitIndex, dayIndex) {
    let db = JSON.parse(localStorage.getItem(DB_NAME));
    db[currentUser].habits[habitIndex].states[dayIndex] = !db[currentUser].habits[habitIndex].states[dayIndex];
    localStorage.setItem(DB_NAME, JSON.stringify(db));
    loadHabitData();
}

function deleteHabit(index) {
    if (!confirm("ERASE MISSION?")) return;
    let db = JSON.parse(localStorage.getItem(DB_NAME));
    db[currentUser].habits.splice(index, 1);
    localStorage.setItem(DB_NAME, JSON.stringify(db));
    loadHabitData();
}

function updateEfficiency() {
    const day = new Date().getDate() - 1; 
    const db = JSON.parse(localStorage.getItem(DB_NAME));
    const habits = db[currentUser]?.habits || [];
    
    const percentDisplay = document.getElementById('circle-percent');
    const ring = document.getElementById('ring-progress');
    
    if (habits.length === 0) {
        percentDisplay.innerText = "0%";
        ring.style.strokeDashoffset = 188.5;
        return;
    }

    let done = 0;
    habits.forEach(h => { if (h.states[day]) done++; });
    const percent = Math.round((done / habits.length) * 100);
    
    percentDisplay.innerText = percent + "%";
    
    const circumference = 2 * Math.PI * 30;
    const offset = circumference - (percent / 100 * circumference);
    ring.style.strokeDashoffset = offset;
}

/** 3. PERFORMANCE GRAPH **/
function updatePerformanceGraph() {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const db = JSON.parse(localStorage.getItem(DB_NAME));
    const habits = db[currentUser]?.habits || [];
    
    // Calculate efficiency for each day (1-31)
    const dailyEfficiency = Array.from({ length: DAYS_IN_MONTH }, (_, dayIndex) => {
        if (habits.length === 0) return 0;
        let done = 0;
        habits.forEach(h => { if (h.states[dayIndex]) done++; });
        return Math.round((done / habits.length) * 100);
    });

    const labels = Array.from({ length: DAYS_IN_MONTH }, (_, i) => (i + 1).toString().padStart(2, '0'));

    if (performanceChart) {
        performanceChart.data.datasets[0].data = dailyEfficiency;
        performanceChart.update();
    } else {
        performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Efficiency %',
                    data: dailyEfficiency,
                    borderColor: '#00f2ff',
                    backgroundColor: 'rgba(0, 242, 255, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#00f2ff',
                    pointRadius: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.4)', font: { family: 'Fira Code', size: 10 } }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.4)', font: { family: 'Fira Code', size: 10 } }
                    }
                }
            }
        });
    }
}