const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let firebaseInitialized = false;
try { firebase.initializeApp(firebaseConfig); firebaseInitialized = true; }
catch (e) { console.warn('Firebase not configured - running in demo mode'); }

let currentUser = null;
let currentCompetition = null;
let registrations = JSON.parse(localStorage.getItem('registrations') || '[]');

const competitions = [
    { id: 1, name: "Vårcupen 2025", date: "2025-03-15", dateDisplay: "15 mars 2025", time: "10:00 - 18:00", location: "Bowling City, Stockholm", deadline: "2025-03-10", deadlineDisplay: "10 mars 2025", fee: "450 kr", feeAmount: 450, totalSpots: 64, registeredCount: 41, status: "open", category: "Singel", description: "Välkommen till Vårcupen 2025! En populär singeltävling med 6 serier kvalificering och slutspel för topp 8. Handikapp tillämpas enligt Svenska Bowlingförbundets regler.", classes: ["A","B","C","damer","herrar"] },
    { id: 2, name: "Stockholm Open", date: "2025-04-05", dateDisplay: "5-6 april 2025", time: "09:00 - 20:00", location: "Kungsholmens Bowlinghall", deadline: "2025-03-28", deadlineDisplay: "28 mars 2025", fee: "800 kr", feeAmount: 800, totalSpots: 128, registeredCount: 89, status: "open", category: "Ranking", description: "Stockholm Open är en av Sveriges största rankingtävlingar. Två dagars tävling med 8 serier kvalificering, semifinal och final. Prispengar: 50 000 kr totalt.", classes: ["A","B","herrar","damer"] },
    { id: 3, name: "Juniormästerskapet", date: "2025-03-22", dateDisplay: "22 mars 2025", time: "13:00 - 19:00", location: "Söder Bowling, Stockholm", deadline: "2025-03-14", deadlineDisplay: "14 mars 2025", fee: "250 kr", feeAmount: 250, totalSpots: 32, registeredCount: 30, status: "closing-soon", category: "Ungdom", description: "Distriktets juniormästerskap för spelare under 21 år. 4 serier med handikapp. Åldersklasser: U15 och U21.", classes: ["ungdom"] },
    { id: 4, name: "Lagserien Omgång 5", date: "2025-03-29", dateDisplay: "29 mars 2025", time: "11:00 - 16:00", location: "Täby Bowlinghall", deadline: "2025-03-25", deadlineDisplay: "25 mars 2025", fee: "350 kr/lag", feeAmount: 350, totalSpots: 16, registeredCount: 12, status: "open", category: "Lag", description: "Femte omgången i vårens lagserie. 4-manna lag. 3 serier per spelare.", classes: ["herrar","damer"] },
    { id: 5, name: "Påsktouren 2025", date: "2025-04-19", dateDisplay: "19-20 april 2025", time: "10:00 - 18:00", location: "Gothenburg Bowl, Göteborg", deadline: "2025-04-12", deadlineDisplay: "12 april 2025", fee: "650 kr", feeAmount: 650, totalSpots: 96, registeredCount: 34, status: "open", category: "Ranking", description: "Påsktouren är tillbaka! Rankingtävling över två dagar. 6 serier dag 1, topp 24 går vidare till dag 2.", classes: ["A","B","C","D","herrar","damer","senior"] },
    { id: 6, name: "Seniorernas Vintercup", date: "2025-02-28", dateDisplay: "28 februari 2025", time: "10:00 - 15:00", location: "Hammarby Bowling", deadline: "2025-02-20", deadlineDisplay: "20 februari 2025", fee: "300 kr", feeAmount: 300, totalSpots: 48, registeredCount: 48, status: "closed", category: "Senior", description: "Vintercupen för seniorer (55+). 4 serier med handikapp. Gemensam lunch inkluderad.", classes: ["senior"] }
];

const demoPlayers = [
    { id: 1, name: "Anna Andersson", club: "Sollentuna BK", license: "12345", hcp: 8, average: 192, playerClass: "A" },
    { id: 2, name: "Erik Eriksson", club: "Stockholms BS", license: "23456", hcp: 12, average: 185, playerClass: "A" },
    { id: 3, name: "Maria Johansson", club: "Täby BK", license: "34567", hcp: 20, average: 172, playerClass: "B" },
    { id: 4, name: "Johan Svensson", club: "Kungsholmens BK", license: "45678", hcp: 5, average: 198, playerClass: "A" },
    { id: 5, name: "Sara Lindström", club: "Hammarby BF", license: "56789", hcp: 15, average: 180, playerClass: "B" },
    { id: 6, name: "Karl Nilsson", club: "Södermalms BK", license: "67890", hcp: 25, average: 165, playerClass: "C" },
    { id: 7, name: "Lisa Pettersson", club: "Sollentuna BK", license: "78901", hcp: 18, average: 175, playerClass: "B" },
    { id: 8, name: "Anders Karlsson", club: "Västerås BK", license: "89012", hcp: 3, average: 205, playerClass: "A" },
    { id: 9, name: "Emma Larsson", club: "Uppsalas BK", license: "90123", hcp: 22, average: 168, playerClass: "C" },
    { id: 10, name: "Magnus Olsson", club: "Stockholms BS", license: "01234", hcp: 10, average: 190, playerClass: "A" }
];

function loginWith(provider) {
    if (!firebaseInitialized || firebaseConfig.apiKey === "YOUR_API_KEY") { demoLogin(provider); return; }
    showLoading();
    let authProvider;
    if (provider === 'google') authProvider = new firebase.auth.GoogleAuthProvider();
    else if (provider === 'microsoft') authProvider = new firebase.auth.OAuthProvider('microsoft.com');
    else if (provider === 'apple') { authProvider = new firebase.auth.OAuthProvider('apple.com'); authProvider.addScope('email'); authProvider.addScope('name'); }
    firebase.auth().signInWithPopup(authProvider)
        .then(result => { currentUser = { name: result.user.displayName || 'Användare', email: result.user.email, avatar: result.user.photoURL || generateAvatar(result.user.displayName || 'U'), uid: result.user.uid, provider }; onLoginSuccess(); })
        .catch(error => { console.error(error); hideLoading(); alert('Inloggning misslyckades: ' + error.message); });
}

function demoLogin(provider) {
    showLoading();
    const names = { google: 'Demo Användare', microsoft: 'Test Person', apple: 'Apple Testare' };
    setTimeout(() => { currentUser = { name: names[provider], email: `demo@${provider}.com`, avatar: generateAvatar(names[provider]), uid: 'demo-' + provider, provider }; onLoginSuccess(); }, 800);
}

function generateAvatar(name) {
    const canvas = document.createElement('canvas'); canvas.width = 100; canvas.height = 100;
    const ctx = canvas.getContext('2d');
    const colors = ['#6C5CE7','#00B894','#FD79A8','#FDCB6E','#E17055','#00CEC9'];
    ctx.fillStyle = colors[name.charCodeAt(0) % colors.length]; ctx.fillRect(0,0,100,100);
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 42px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase(), 50, 50);
    return canvas.toDataURL();
}

function onLoginSuccess() {
    document.querySelectorAll('.user-avatar').forEach(el => el.src = currentUser.avatar);
    document.querySelectorAll('.user-name').forEach(el => el.textContent = currentUser.name);
    document.getElementById('email').value = currentUser.email;
    if (currentUser.name && currentUser.name !== 'Användare') {
        const parts = currentUser.name.split(' ');
        if (parts.length >= 2) { document.getElementById('first-name').value = parts[0]; document.getElementById('last-name').value = parts.slice(1).join(' '); }
    }
    renderCompetitions(); hideLoading(); showScreen('competitions-screen');
}

function logout() {
    if (firebaseInitialized && firebaseConfig.apiKey !== "YOUR_API_KEY") firebase.auth().signOut();
    currentUser = null; showScreen('login-screen');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active'); window.scrollTo(0,0);
}

function renderCompetitions(filter = 'all') {
    const grid = document.getElementById('competitions-grid');
    let filtered = [...competitions];
    if (filter === 'open') filtered = filtered.filter(c => c.status === 'open');
    else if (filter === 'closing-soon') filtered = filtered.filter(c => c.status === 'closing-soon');
    else if (filter === 'registered') { const ids = registrations.filter(r => r.userId === currentUser?.uid).map(r => r.competitionId); filtered = filtered.filter(c => ids.includes(c.id)); }
    if (filtered.length === 0) { grid.innerHTML = `<div class="no-results"><i class="fas fa-search"></i><h3>Inga tävlingar hittades</h3><p>Prova att ändra filter.</p></div>`; return; }
    grid.innerHTML = filtered.map(comp => {
        const isReg = registrations.some(r => r.competitionId === comp.id && r.userId === currentUser?.uid);
        const spotsLeft = comp.totalSpots - comp.registeredCount;
        let badgeClass = comp.status; let badgeText = comp.status === 'open' ? 'Öppen' : comp.status === 'closing-soon' ? 'Stänger snart' : 'Stängd';
        if (isReg) { badgeClass = 'registered-badge'; badgeText = '✓ Anmäld'; }
        return `<div class="competition-card ${isReg?'registered':''}" onclick="openRegistration(${comp.id})">
            <div class="comp-card-header"><span class="comp-badge ${badgeClass}">${badgeText}</span><span class="comp-spots">${spotsLeft} platser kvar</span></div>
            <div class="comp-card-body"><h3>${comp.name}</h3><div class="comp-details">
                <div class="comp-detail"><i class="fas fa-calendar-alt"></i><span>${comp.dateDisplay}</span></div>
                <div class="comp-detail"><i class="fas fa-map-marker-alt"></i><span>${comp.location}</span></div>
                <div class="comp-detail"><i class="fas fa-clock"></i><span>Sista anmälan: ${comp.deadlineDisplay}</span></div>
                <div class="comp-detail"><i class="fas fa-tag"></i><span>${comp.category}</span></div>
            </div></div>
            <div class="comp-card-footer"><span class="comp-fee">${comp.fee}</span>
                ${comp.status==='closed'?'<button class="comp-register-btn" disabled><i class="fas fa-lock"></i> Stängd</button>':isReg?'<button class="comp-register-btn registered-btn"><i class="fas fa-check"></i> Anmäld</button>':'<button class="comp-register-btn"><i class="fas fa-arrow-right"></i> Anmäl dig</button>'}
            </div></div>`;
    }).join('');
}

function filterCompetitions(filter, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); renderCompetitions(filter);
}

function openRegistration(compId) {
    const comp = competitions.find(c => c.id === compId);
    if (!comp || comp.status === 'closed') return;
    if (registrations.some(r => r.competitionId === comp.id && r.userId === currentUser?.uid)) { alert('Du är redan anmäld till denna tävling!'); return; }
    currentCompetition = comp;
    document.getElementById('reg-comp-title').textContent = 'Anmälan - ' + comp.name;
    document.getElementById('reg-comp-name').textContent = comp.name;
    document.getElementById('reg-comp-date').textContent = comp.dateDisplay + ' | ' + comp.time;
    document.getElementById('reg-comp-location').textContent = comp.location;
    document.getElementById('reg-comp-deadline').textContent = 'Sista anmälan: ' + comp.deadlineDisplay;
    document.getElementById('reg-comp-fee').textContent = 'Avgift: ' + comp.fee;
    document.getElementById('reg-comp-spots').textContent = (comp.totalSpots - comp.registeredCount) + ' av ' + comp.totalSpots + ' platser kvar';
    document.getElementById('reg-comp-description').textContent = comp.description;
    document.getElementById('reg-comp-badge').textContent = comp.status === 'open' ? 'Öppen för anmälan' : 'Stänger snart';
    ['hcp','average','comments','license-number','license-nr'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('player-class').value = '';
    document.getElementById('preferred-time').value = '';
    document.getElementById('terms').checked = false;
    document.getElementById('gdpr').checked = false;
    document.getElementById('player-info-card').classList.add('hidden');
    document.getElementById('search-results').classList.add('hidden');
    showScreen('registration-screen');
}

async function searchPlayer() {
    const query = document.getElementById('license-number').value.trim();
    if (!query) { alert('Ange ett licensnummer eller namn.'); return; }
    const btn = document.querySelector('.search-btn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Söker...'; btn.disabled = true;
    try {
        let players = [];
        try {
            const res = await fetch(`https://bits.swebowl.se/api/v1/player/search?searchterm=${encodeURIComponent(query)}`, { headers: { 'Accept': 'application/json' } });
            if (res.ok) { const data = await res.json(); players = data.map(p => ({ id: p.id||p.licNbr, name: `${p.firstName} ${p.lastName}`, club: p.clubName||'Okänd', license: p.licNbr||'', hcp: p.hcp||0, average: p.avgResult||0, playerClass: p.classText||'' })); }
        } catch(e) { console.log('API ej tillgänglig, använder demodata'); }
        if (players.length === 0) players = demoPlayers.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.license.includes(query) || p.club.toLowerCase().includes(query.toLowerCase()));
        displaySearchResults(players);
    } catch(e) { displaySearchResults(demoPlayers.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))); }
    finally { btn.innerHTML = '<i class="fas fa-search"></i><span>Sök</span>'; btn.disabled = false; }
}

function displaySearchResults(players) {
    const div = document.getElementById('search-results');
    if (players.length === 0) { div.innerHTML = `<div class="search-result-item"><span class="result-name" style="color:var(--dark-light)"><i class="fas fa-info-circle"></i> Inga spelare hittades. Prova "Anna", "Erik" eller licensnr "12345"</span></div>`; }
    else { div.innerHTML = players.map(p => `<div class="search-result-item" onclick='selectPlayer(${JSON.stringify(p)})'><div><div class="result-name">${p.name}</div><div class="result-club">${p.club} | Lic: ${p.license}</div></div><div class="result-hcp">HCP ${p.hcp}</div></div>`).join(''); }
    div.classList.remove('hidden');
}

function selectPlayer(player) {
    const parts = player.name.split(' ');
    document.getElementById('first-name').value = parts[0]||'';
    document.getElementById('last-name').value = parts.slice(1).join(' ')||'';
    document.getElementById('club').value = player.club||'';
    document.getElementById('license-nr').value = player.license||'';
    document.getElementById('hcp').value = player.hcp||'';
    document.getElementById('average').value = player.average||'';
    if (player.playerClass) { const s = document.getElementById('player-class'); const o = Array.from(s.options).find(o => o.value.toLowerCase()===player.playerClass.toLowerCase()); if(o) s.value = o.value; }
    document.getElementById('player-display-name').textContent = player.name;
    document.getElementById('player-display-club').textContent = player.club;
    document.getElementById('player-display-license').textContent = player.license;
    document.getElementById('player-display-hcp').textContent = player.hcp;
    document.getElementById('player-display-avg').textContent = player.average;
    document.getElementById('player-display-class').textContent = player.playerClass||'-';
    document.getElementById('player-info-card').classList.remove('hidden');
    document.getElementById('search-results').classList.add('hidden');
}

function submitRegistration(e) {
    e.preventDefault();
    if (!currentCompetition || !currentUser) return;
    const data = { competitionId: currentCompetition.id, competitionName: currentCompetition.name, userId: currentUser.uid, firstName: document.getElementById('first-name').value, lastName: document.getElementById('last-name').value, email: document.getElementById('email').value, phone: document.getElementById('phone').value, club: document.getElementById('club').value, licenseNr: document.getElementById('license-nr').value, hcp: document.getElementById('hcp').value, average: document.getElementById('average').value, playerClass: document.getElementById('player-class').value, preferredTime: document.getElementById('preferred-time').value, comments: document.getElementById('comments').value, registeredAt: new Date().toISOString() };
    registrations.push(data); localStorage.setItem('registrations', JSON.stringify(registrations));
    competitions.find(c => c.id === currentCompetition.id).registeredCount++;
    document.getElementById('modal-details').innerHTML = `
        <div class="detail-row"><span class="detail-label">Tävling</span><span class="detail-value">${data.competitionName}</span></div>
        <div class="detail-row"><span class="detail-label">Spelare</span><span class="detail-value">${data.firstName} ${data.lastName}</span></div>
        <div class="detail-row"><span class="detail-label">Förening</span><span class="detail-value">${data.club||'-'}</span></div>
        <div class="detail-row"><span class="detail-label">Klass</span><span class="detail-value">${data.playerClass||'-'}</span></div>
        <div class="detail-row"><span class="detail-label">Avgift</span><span class="detail-value">${currentCompetition.fee}</span></div>`;
    document.getElementById('success-modal').classList.remove('hidden');
}

function closeModal() { document.getElementById('success-modal').classList.add('hidden'); renderCompetitions(); }
function showLoading() { document.getElementById('loading-overlay').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loading-overlay').classList.add('hidden'); }

document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.activeElement === document.getElementById('license-number')) searchPlayer();
    if (e.key === 'Escape') closeModal();
});

if (firebaseInitialized && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    firebase.auth().onAuthStateChanged(user => { if (user) { currentUser = { name: user.displayName||'Användare', email: user.email, avatar: user.photoURL||generateAvatar(user.displayName||'U'), uid: user.uid }; onLoginSuccess(); } });
}
