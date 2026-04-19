// ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ

let currentDayNum = 1;
let readDays = JSON.parse(localStorage.getItem('elli_progress')) || [];
let unlockedDays = [1]; // По умолчанию открыт только 1-й день

let userHomeworkProgress = {}; // Сохраняем статусы ДЗ из Google Apps Script
const GOOGLE_APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeWSIbgIuXZj6on2JyfDx-ywpWq9J9jey71IJh_XPJzShEAMGWs0wK8ndTq4xy1lNG/exec";

let isScrolling = false;
let scrollInterval;

// --- ИНИЦИАЛИЗАЦИЯ И АВТОРИЗАЦИЯ ---

window.onload = () => {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
        document.getElementById('auth-box').style.display = 'none';
        document.getElementById('resume-btn').style.display = 'inline-block';
        fetchProgress(savedEmail);
    }
};

async function loginAndStart() {
    const emailInput = document.getElementById('user-email-input').value.trim();
    if (!emailInput || !emailInput.includes('@')) {
        alert("Пожалуйста, введите корректный Email.");
        return;
    }
    
    localStorage.setItem('userEmail', emailInput);
    document.getElementById('auth-box').style.display = 'none';
    
    await fetchProgress(emailInput);
    showGrid();
}

async function fetchProgress(email) {
    document.getElementById('loading-box').style.display = 'block';
    if(document.getElementById('resume-btn')) document.getElementById('resume-btn').style.display = 'none';

    try {
        const response = await fetch(`${GOOGLE_APP_SCRIPT_URL}?action=getProgress&email=${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (data && data.progress) {
            userHomeworkProgress = data.progress;
            calculateUnlockedDays();
        }
    } catch (error) {
        console.error("Ошибка при загрузке прогресса:", error);
    }

    document.getElementById('loading-box').style.display = 'none';
    if(document.getElementById('resume-btn')) document.getElementById('resume-btn').style.display = 'inline-block';
}

function calculateUnlockedDays() {
    unlockedDays = [1]; // День 1 открыт всегда
    for (let day = 1; day <= 10; day++) {
        // Если за предыдущий день статус "Одобрено", открываем текущий
        if (userHomeworkProgress[day] && userHomeworkProgress[day].toLowerCase().includes("одобрено")) {
            if (!unlockedDays.includes(day + 1) && day + 1 <= 10) {
                unlockedDays.push(day + 1);
            }
        }
    }
}

function showGrid() {
    renderGrid();
    switchView('view-grid');
}

// --- 1. ОТРИСОВКА СЕТКИ ---
function renderGrid() {
    const grid = document.getElementById('main-grid');
    if (!grid) return; // Защита от ошибок, если элемента нет
    grid.innerHTML = '';
    items.forEach((item, i) => {
        const dayNum = i + 1;
        const card = document.createElement('div');
        const isRead = readDays.includes(dayNum);
        const isLocked = !unlockedDays.includes(dayNum);

        card.className = `day-card ${isLocked ? 'locked' : ''} ${isRead && !isLocked ? 'completed' : ''}`;
        
        // Обработчик клика
        card.onclick = () => handleDayClick(dayNum, item.n, isLocked, isRead);

        card.innerHTML = `
            <div style="font-size:9px; color: ${isRead && !isLocked ? '#d4af37' : '#aaa'}; font-weight:${isRead && !isLocked ?'bold':'normal'};">ДЕНЬ ${dayNum}</div>
            <div class="day-icon">${item.i}</div>
            <div class="day-name">${item.n}</div>
        `;
        grid.appendChild(card);
    });

    // ПРОВЕРКА ФИНАЛА
    if (readDays.length >= 10 && unlockedDays.includes(10)) {
        const finalCard = document.createElement('div');
        finalCard.className = `day-card completed`;
        finalCard.style.gridColumn = '1 / -1'; 
        finalCard.style.marginTop = '10px';
        finalCard.style.background = 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
        finalCard.style.color = '#fff';
        finalCard.style.border = 'none';

        finalCard.onclick = () => {
            currentDayNum = 'final';
            switchView('view-menu');
            document.getElementById('menu-title').innerText = "🏆 Вершина Пути";
            loadContent('final');
        };

        finalCard.innerHTML = `
            <div style="font-size:12px; font-weight:bold; margin-bottom:5px;">ПОЗДРАВЛЯЕМ!</div>
            <div class="day-icon">🏆</div>
            <div class="day-name">Вершина Пути</div>
        `;
        grid.appendChild(finalCard);
    }
}

// Обработка клика по дню
function handleDayClick(dayNum, name, isLocked, isRead) {
    if (isLocked) {
        showWarningModal(dayNum);
    } else {
        openDayMenu(dayNum, name);
    }
}

// --- 2. ОТКРЫТИЕ МЕНЮ ДНЯ ---
function openDayMenu(num, name) {
    currentDayNum = num;
    
    switchView('view-menu');
    document.getElementById('menu-title').innerText = `День ${num}: ${name}`;

    if (!readDays.includes(num)) {
        readDays.push(num);
        localStorage.setItem('elli_progress', JSON.stringify(readDays));
    }
}

// --- 3. ОТКРЫТИЕ КОНТЕНТА ---
async function openContent(type) {
    switchView('view-content');
    
    const item = currentDayNum === 'final' ? items[items.length-1] : items[currentDayNum - 1];
    
    let title = "";
    if(type === 'story') title = "Сказочная история";
    if(type === 'video') title = "Смотреть видео";
    if(type === 'song') title = "Песенка дня";
    if(type === 'child') title = "Практика для детей";
    if(type === 'adult') title = "Взрослая практика";
    if(type === 'presentation') title = "Презентация";
    if(type === 'homework') title = "Домашнее задание";

    document.getElementById('header-title').innerText = `${currentDayNum === 'final' ? '🏆' : 'ДЕНЬ ' + currentDayNum} | ${title}`;

    document.getElementById('text-box').style.display = 'none';
    document.getElementById('audio-box').style.display = 'none';
    document.getElementById('main-image').style.display = 'none';
    document.getElementById('video-area').style.display = 'none';
    document.getElementById('homework-box').style.display = 'none';

    stopScroll();

    // Специальная логика для домашнего задания
    if (type === 'homework') {
        document.getElementById('homework-box').style.display = 'block';
        document.getElementById('homework-text').innerHTML = "Загрузка задания...";
        document.getElementById('homework-status').style.display = 'none';
        try {
            const response = await fetch(`texts/day${currentDayNum}_homework.html`);
            if (response.ok) {
                const text = await response.text();
                document.getElementById('homework-text').innerHTML = formatText(text, currentDayNum);
            } else {
                document.getElementById('homework-text').innerHTML = "Задание для этого дня скоро появится.";
            }
        } catch (e) {
            document.getElementById('homework-text').innerHTML = "Задание для этого дня скоро появится.";
        }
        return;
    }

    // Если презентация, грузим HTML
    if (type === 'presentation') {
        document.getElementById('text-box').style.display = 'block';
        document.getElementById('text-display').innerHTML = "Загрузка...";
        try {
            const response = await fetch(`texts/day${currentDayNum}_presentation.html`);
            if (response.ok) {
                const text = await response.text();
                document.getElementById('text-display').innerHTML = formatText(text, currentDayNum);
            } else {
                document.getElementById('text-display').innerHTML = "Материалы скоро появятся.";
            }
        } catch (e) {
            document.getElementById('text-display').innerHTML = "Материалы скоро появятся.";
        }
        return;
    }

    if (type === 'video') {
        document.getElementById('video-area').style.display = 'block';
        const vp = document.getElementById('video-player');
        vp.src = `videos/day${currentDayNum}.mp4`;
        vp.play().catch(e => console.log('Auto-play prevented'));
        return;
    }

    if (type === 'story') {
        document.getElementById('main-image').src = `images/day${currentDayNum}.jpg`;
        document.getElementById('main-image').style.display = 'block';
        
        document.getElementById('audio-box').style.display = 'block';
        document.getElementById('audio-player').src = `audios/day${currentDayNum}.mp3`;
        
        document.getElementById('text-box').style.display = 'block';
        document.getElementById('text-display').innerHTML = "Загрузка текста...";
        
        try {
            const response = await fetch(`texts/day${currentDayNum}.html`);
            if (response.ok) {
                const text = await response.text();
                document.getElementById('text-display').innerHTML = formatText(text, currentDayNum);
                setupVideoObserver();
            } else {
                document.getElementById('text-display').innerHTML = "Текст скоро появится.";
            }
        } catch (e) {
            document.getElementById('text-display').innerHTML = "Текст скоро появится.";
        }
        return;
    }

    // Другие типы (аудио)
    document.getElementById('audio-box').style.display = 'block';
    const ap = document.getElementById('audio-player');
    
    if (type === 'song') ap.src = `audios/day${currentDayNum}_song.mp3`;
    if (type === 'child') ap.src = `audios/day${currentDayNum}_child.mp3`;
    if (type === 'adult') ap.src = `audios/day${currentDayNum}_adult.mp3`;

    document.getElementById('main-image').src = `images/day${currentDayNum}_${type}.jpg`;
    document.getElementById('main-image').style.display = 'block';
    
    ap.play().catch(e=>console.log(e));
}

function setupVideoObserver() {
    const videos = document.querySelectorAll('#text-display video');
    if (videos.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.play().catch(e => console.log('Autoplay blocked', e));
            } else {
                entry.target.pause();
            }
        });
    }, { threshold: 0.1 });
    videos.forEach(video => observer.observe(video));
}

function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
    document.getElementById(viewId).classList.add('active-view');
}

function formatText(text, dayNum) {
    if (!text) return "";
    let html = text.replace(/\[IMAGE(\d*)\]/g, (match, p1) => {
        const suffix = p1 ? `_${p1}` : ''; 
        return `<img src="images/day${dayNum}${suffix}.jpg" class="book-media" onerror="this.style.display='none'">`;
    });
    html = html.replace(/\[GIF(\d*)\]/g, (match, p1) => {
        const suffix = p1 ? `_${p1}` : '';
        return `<img src="images/day${dayNum}${suffix}.gif" class="book-media" onerror="this.style.display='none'">`;
    });
    html = html.replace(/\[VID(\d*)\]/g, (match, p1) => {
        const suffix = p1 ? `_${p1}` : '';
        return `<video src="videos/day${dayNum}${suffix}.mp4" class="book-media" autoplay muted loop playsinline onerror="this.style.display='none'"></video>`;
    });
    return html;
}

function goBackToMenu() {
    stopScroll();
    document.getElementById('audio-player').pause();
    document.getElementById('video-player').pause();
    switchView('view-menu');
}

function goHome() {
    stopScroll();
    document.getElementById('audio-player').pause();
    document.getElementById('video-player').pause();
    switchView('view-grid');
}

function toggleAutoScroll() {
    const container = document.getElementById('scroll-box');
    const btn = document.getElementById('scroll-btn');
    
    if (isScrolling) {
        clearInterval(scrollInterval);
        btn.classList.remove('active');
    } else {
        scrollInterval = setInterval(() => {
            container.scrollTop += 1; 
            if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
                stopScroll();
            }
        }, 35);
        btn.classList.add('active');
    }
    isScrolling = !isScrolling;
}

function stopScroll() {
    clearInterval(scrollInterval);
    isScrolling = false;
    const btn = document.getElementById('scroll-btn');
    if(btn) btn.classList.remove('active');
}

// Остановка скролла при касании
document.getElementById('scroll-box').addEventListener('touchstart', stopScroll, {passive: true});
document.getElementById('scroll-box').addEventListener('wheel', stopScroll, {passive: true});


// --- МОДАЛЬНЫЕ ОКНА И ЛОГИКА ДОСТУПА ---

// Окно предупреждения (проверка ДЗ / перескок)
function showWarningModal(lockedDayNum) {
    const modal = document.getElementById('warning-modal');
    const textElement = document.getElementById('warning-modal-text');
    
    // Проверяем статус ДЗ за предыдущий день
    const prevDay = lockedDayNum - 1;
    const prevStatus = userHomeworkProgress[prevDay];

    if (prevDay > 0) {
        if (!prevStatus) {
            textElement.innerHTML = `Чтобы открыть <b>День ${lockedDayNum}</b>, вам необходимо отправить Домашнее задание за <b>День ${prevDay}</b>.`;
        } else if (prevStatus.toLowerCase().includes("на проверке")) {
            textElement.innerHTML = `Ваше Домашнее задание за <b>День ${prevDay}</b> находится <b>на проверке</b>.<br><br>Пожалуйста, подождите, пока преподаватель не проверит его.`;
        } else {
            textElement.innerHTML = `Доступ к <b>Дню ${lockedDayNum}</b> пока закрыт.`;
        }
    } else {
        textElement.innerHTML = `Нельзя перескочить, не пройдя предыдущий день.`;
    }

    modal.classList.add('visible');
}

function closeWarningModal() {
    document.getElementById('warning-modal').classList.remove('visible');
}


// --- СБРОС ---
function confirmReset() {
    if (confirm("Вы точно хотите сбросить прогресс и выйти?")) {
        readDays = [];
        localStorage.removeItem('elli_progress');
        localStorage.removeItem('userEmail');
        location.reload();
    }
}

// --- ОТПРАВКА ДОМАШНЕГО ЗАДАНИЯ ---
async function submitHomework() {
    const textInput = document.getElementById('homework-input').value.trim();
    if (!textInput) {
        alert("Пожалуйста, напишите ответ перед отправкой.");
        return;
    }

    const userEmail = localStorage.getItem('userEmail') || 'unknown';

    try {
        await fetch(GOOGLE_APP_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'submitHomework',
                email: userEmail,
                day: currentDayNum,
                text: textInput
            })
        });
        
        document.getElementById('homework-status').style.display = 'block';
        document.getElementById('homework-input').value = '';
        
        // Локально обновляем прогресс
        userHomeworkProgress[currentDayNum] = "На проверке";
    } catch (error) {
        console.error("Ошибка при отправке ДЗ:", error);
        alert("Произошла ошибка при отправке. Пожалуйста, попробуйте позже.");
    }
}
