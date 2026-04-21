// ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ

let currentDayNum = 1;
let readDays = JSON.parse(localStorage.getItem('elli_progress')) || [];
let unlockedDays = [1]; 

let userHomeworkProgress = {}; 
const GOOGLE_APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwQfK1nmnK5TrqxabtXqO-Kum4QxKW65HOV4_gDGqWf8Gkr7CPtACDnikFJpNptog_/exec";

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
        const timestamp = new Date().getTime();
        const response = await fetch(`${GOOGLE_APP_SCRIPT_URL}?action=getProgress&email=${encodeURIComponent(email)}&t=${timestamp}`);
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
    unlockedDays = [1]; 
    for (let day = 1; day <= 10; day++) {
        if (userHomeworkProgress[day] && 
            userHomeworkProgress[day].status && 
            userHomeworkProgress[day].status.toLowerCase().includes("одобрено")) {
            
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
    if (!grid) return; 
    grid.innerHTML = '';
    items.forEach((item, i) => {
        const dayNum = i + 1;
        const card = document.createElement('div');
        const isRead = readDays.includes(dayNum);
        const isLocked = !unlockedDays.includes(dayNum);

        card.className = `day-card ${isLocked ? 'locked' : ''} ${isRead && !isLocked ? 'completed' : ''}`;
        
        card.onclick = () => handleDayClick(dayNum, item.n, isLocked, isRead);

        card.innerHTML = `
            <div style="font-size:9px; color: ${isRead && !isLocked ? '#d4af37' : '#aaa'}; font-weight:${isRead && !isLocked ?'bold':'normal'};">ДЕНЬ ${dayNum}</div>
            <div class="day-icon">${item.i}</div>
            <div class="day-name">${item.n}</div>
        `;
        grid.appendChild(card);
    });

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
    stopScroll(); 

    const container = document.getElementById('scroll-box');
    container.scrollTop = 0;
    const titleLabel = document.getElementById('header-title');
    
    const videoArea = document.getElementById('video-area');
    const videoPlayer = document.getElementById('video-player');
    const textBox = document.getElementById('text-box');
    const textDisplay = document.getElementById('text-display');
    const audioBox = document.getElementById('audio-box');
    const audioPlayer = document.getElementById('audio-player');
    const audioTitle = document.getElementById('audio-title');
    const mainImage = document.getElementById('main-image');
    const scrollBtn = document.getElementById('scroll-btn');

    videoPlayer.pause();
    audioPlayer.pause();
    videoArea.style.display = 'none';
    textBox.style.display = 'none';
    audioBox.style.display = 'none';
    mainImage.style.display = 'none';
    
    const homeworkBox = document.getElementById('homework-box');
    if (homeworkBox) homeworkBox.style.display = 'none';
    
    textDisplay.innerHTML = ""; 
    scrollBtn.classList.remove('visible');

    const filePrefix = currentDayNum === 'final' ? 'final' : `day${currentDayNum}`;

    if (type === 'story') {
        titleLabel.innerText = "📖 История";
        document.getElementById('main-image').src = `images/day${currentDayNum}.jpg`;
        document.getElementById('main-image').style.display = 'block';
        
        audioBox.style.display = 'block';
        audioPlayer.src = `audios/day${currentDayNum}.mp3`;
        
        textBox.style.display = 'block';
        textDisplay.innerHTML = "Загрузка текста...";
        
        try {
            const response = await fetch(`texts/day${currentDayNum}.html`);
            if (response.ok) {
                const text = await response.text();
                textDisplay.innerHTML = formatText(text, currentDayNum);
            } else {
                textDisplay.innerHTML = "Текст скоро появится.";
            }
        } catch (e) {
            textDisplay.innerHTML = "Текст скоро появится.";
        }
        return;
    }
    
    else if (type === 'homework') {
        titleLabel.innerText = "✍️ Домашнее задание";
        if (homeworkBox) {
            homeworkBox.style.display = 'block';
            document.getElementById('homework-text').innerHTML = "Загрузка задания...";
            
            if (!document.getElementById('homework-inputs-container')) {
                const container = document.createElement('div');
                container.id = 'homework-inputs-container';
                document.getElementById('homework-text').parentNode.insertBefore(container, document.getElementById('homework-text').nextSibling);
            }
            
            document.getElementById('homework-inputs-container').innerHTML = ""; 
            
            const submitBtn = document.getElementById('homework-submit-btn');
            if (submitBtn) submitBtn.style.display = 'none';
            
            const statusBox = document.getElementById('homework-status');
            if (statusBox) statusBox.style.display = 'none';

            try {
                const response = await fetch(`texts/${filePrefix}_homework.html`);
                if (response.ok) {
                    const text = await response.text();
                    const formattedHtml = text;
                    
                    const parts = formattedHtml.split(/\[ВОПРОС\]/i);
                    let finalHtml = parts[0]; 
                    
                    if (parts.length > 1) {
                        for (let i = 1; i < parts.length; i++) {
                            finalHtml += `
                                <div class="question-block" style="margin-top: 15px;">
                                    <div style="font-weight: bold; margin-bottom: 5px; color: var(--accent);">Вопрос ${i}:</div>
                                    <div style="margin-bottom: 8px;">${parts[i]}</div>
                                    <textarea class="homework-input-field" data-qnum="${i}" placeholder="Напишите ваш ответ на вопрос ${i}..." style="width: 100%; height: 80px; padding: 10px; border-radius: 8px; border: 1px solid #ccc; font-size: 16px; font-family: inherit; resize: vertical; box-sizing: border-box;"></textarea>
                                </div>
                            `;
                        }
                        document.getElementById('homework-inputs-container').innerHTML = finalHtml;
                        document.getElementById('homework-text').innerHTML = ""; 
                    } else {
                        document.getElementById('homework-text').innerHTML = formattedHtml;
                        document.getElementById('homework-inputs-container').innerHTML = `
                            <textarea class="homework-input-field" data-qnum="1" placeholder="Напишите ваш ответ здесь..." style="width: 100%; height: 120px; padding: 10px; border-radius: 8px; border: 1px solid #ccc; font-size: 16px; font-family: inherit; resize: vertical; box-sizing: border-box; margin-top: 15px;"></textarea>
                        `;
                    }
                    if (submitBtn) submitBtn.style.display = 'block';
                    
                    const oldInput = document.getElementById('homework-input');
                    if (oldInput) oldInput.style.display = 'none';
                    
                    const currentStatus = userHomeworkProgress[currentDayNum];
                    if (currentStatus && currentStatus.status && statusBox) {
                        if (currentStatus.status.toLowerCase().includes("на проверке")) {
                            statusBox.innerHTML = "⏳ Ваше задание находится на проверке.";
                            statusBox.style.color = "#d4af37";
                            statusBox.style.display = 'block';
                            if (submitBtn) submitBtn.style.display = 'none'; 
                            
                            document.querySelectorAll('.homework-input-field').forEach(ta => {
                                ta.disabled = true;
                                ta.style.backgroundColor = '#f5f5f5';
                            });
                        } else if (currentStatus.status.toLowerCase().includes("одобрено")) {
                            statusBox.innerHTML = "✅ Задание проверено и одобрено!";
                            statusBox.style.color = "#28a745";
                            statusBox.style.display = 'block';
                            if (submitBtn) submitBtn.style.display = 'none'; 
                            
                            document.querySelectorAll('.homework-input-field').forEach(ta => {
                                ta.disabled = true;
                                ta.style.backgroundColor = '#f5f5f5';
                                ta.placeholder = 'Ответ принят';
                            });
                        } else if (currentStatus.status.toLowerCase().includes("переделать")) {
                            statusBox.innerHTML = `❌ <b>Нужно дополнить/переделать:</b><br>${currentStatus.comment || "Без комментариев"}`;
                            statusBox.style.color = "#d9534f";
                            statusBox.style.display = 'block';
                        }
                    }

                } else {
                    document.getElementById('homework-text').innerHTML = "Задание для этого урока скоро появится.";
                }
            } catch(e) {
                document.getElementById('homework-text').innerHTML = "Ошибка загрузки задания.";
            }
        }
        return;
    }
    
    else if (type === 'presentation') {
        titleLabel.innerText = "🖼️ Презентация";
        textBox.style.display = 'block';
        textDisplay.innerHTML = "Загрузка...";
        try {
            const response = await fetch(`texts/${filePrefix}_presentation.html`);
            if (response.ok) {
                const text = await response.text();
                textDisplay.innerHTML = formatText(text, currentDayNum);
            } else {
                textDisplay.innerHTML = "Материалы скоро появятся.";
            }
        } catch (e) {
            textDisplay.innerHTML = "Материалы скоро появятся.";
        }
        return;
    }
    
    else if (type === 'video') {
        titleLabel.innerText = "🎬 Видео";
        videoArea.style.display = 'block';
        videoPlayer.src = `videos/${filePrefix}.mp4`;
        videoPlayer.play().catch(e => console.log('Auto-play prevented'));
        return;
    }

    else {
        audioBox.style.display = 'block';
        if (type === 'song') { titleLabel.innerText = "🎵 Песенка"; audioPlayer.src = `audios/${filePrefix}_song.mp3`; }
        if (type === 'child') { titleLabel.innerText = "👶 Детская практика"; audioPlayer.src = `audios/${filePrefix}_child.mp3`; }
        if (type === 'adult') { titleLabel.innerText = "🧘 Взрослая практика"; audioPlayer.src = `audios/${filePrefix}_adult.mp3`; }

        mainImage.src = `images/${filePrefix}_${type}.jpg`;
        mainImage.style.display = 'block';
        
        audioPlayer.play().catch(e=>console.log(e));
    }
}

async function openInstructions() {
    switchView('view-content');
    stopScroll();

    document.getElementById('header-title').innerText = "❓ Инструкция";
    document.getElementById('video-area').style.display = 'none';
    document.getElementById('audio-box').style.display = 'none';
    document.getElementById('main-image').style.display = 'none';
    
    const homeworkBox = document.getElementById('homework-box');
    if (homeworkBox) homeworkBox.style.display = 'none';
    
    document.getElementById('text-box').style.display = 'block';
    const textDisplay = document.getElementById('text-display');
    const scrollBtn = document.getElementById('scroll-btn');

    textDisplay.innerHTML = "Загрузка...";
    try {
        const response = await fetch('texts/instructions.html');
        if (response.ok) {
            const html = await response.text();
            textDisplay.innerHTML = html;
        } else {
            textDisplay.innerHTML = "<p style='text-align:center'>Инструкция скоро появится.</p>";
        }
    } catch (e) {
        textDisplay.innerHTML = "<p style='text-align:center'>Инструкция пока недоступна.</p>";
    }
    if (scrollBtn) scrollBtn.classList.add('visible');
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
    return html;
}

function goBackToMenu() {
    document.getElementById('audio-player').pause();
    document.getElementById('video-player').pause();
    
    if (document.getElementById('header-title').innerText === "❓ Инструкция") {
        // Если пользователь залогинен, возвращаем на сетку, иначе на стартовый экран
        if (localStorage.getItem('userEmail')) {
            goHome();
        } else {
            switchView('start-screen');
        }
    } else {
        switchView('view-menu');
    }
}

function goHome() {
    document.getElementById('audio-player').pause();
    document.getElementById('video-player').pause();
    
    if (document.getElementById('header-title').innerText === "❓ Инструкция" && !localStorage.getItem('userEmail')) {
        switchView('start-screen');
    } else {
        switchView('view-grid');
    }
}

function stopScroll() {} 

// --- МОДАЛЬНЫЕ ОКНА И ЛОГИКА ДОСТУПА ---

function showWarningModal(lockedDayNum) {
    const modal = document.getElementById('warning-modal');
    const textElement = document.getElementById('warning-modal-text');
    
    const prevDay = lockedDayNum - 1;
    const progressData = userHomeworkProgress[prevDay];

    if (prevDay > 0) {
        if (!progressData || !progressData.status) {
            textElement.innerHTML = `Чтобы открыть <b>День ${lockedDayNum}</b>, вам необходимо отправить Домашнее задание за <b>День ${prevDay}</b>.`;
        } else if (progressData.status.toLowerCase().includes("на проверке")) {
            textElement.innerHTML = `Ваше Домашнее задание за <b>День ${prevDay}</b> находится <b>на проверке</b>.<br><br>Пожалуйста, подождите, пока преподаватель не проверит его.`;
        } else if (progressData.status.toLowerCase().includes("переделать")) {
            textElement.innerHTML = `Преподаватель попросил <b>дополнить</b> домашнее задание за <b>День ${prevDay}</b>. 😔<br><br><b>Комментарий:</b><br><i>"${progressData.comment || "Без комментариев"}"</i><br><br>Пожалуйста, вернитесь в День ${prevDay}, напишите исправленный ответ и отправьте его заново.`;
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
    const textareas = document.querySelectorAll('.homework-input-field');
    let combinedText = "";
    let hasEmpty = false;

    textareas.forEach((ta) => {
        const val = ta.value.trim();
        if (!val) hasEmpty = true;
        
        if (textareas.length === 1) {
            combinedText = val;
        } else {
            combinedText += `Вопрос ${ta.getAttribute('data-qnum')}:\n${val}\n\n`;
        }
    });

    if (hasEmpty) {
        alert("Пожалуйста, заполните ответы на все вопросы перед отправкой.");
        return;
    }

    const userEmail = localStorage.getItem('userEmail') || 'unknown';

    const btn = document.getElementById('homework-submit-btn');
    if (btn) {
        btn.innerText = "Отправка...";
        btn.disabled = true;
    }

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
                text: combinedText.trim()
            })
        });
        
        const statusBox = document.getElementById('homework-status');
        if (statusBox) {
            statusBox.innerHTML = "⏳ Задание отправлено на проверку!";
            statusBox.style.color = "#28a745";
            statusBox.style.display = 'block';
        }
        
        userHomeworkProgress[currentDayNum] = {
            status: "На проверке",
            comment: ""
        };
        
        if (btn) btn.style.display = 'none';
        textareas.forEach(ta => {
            ta.disabled = true;
            ta.style.backgroundColor = '#f5f5f5';
        });
        
    } catch (error) {
        console.error("Ошибка при отправке ДЗ:", error);
        alert("Произошла ошибка при отправке. Пожалуйста, попробуйте позже.");
        if (btn) {
            btn.innerText = "Отправить на проверку";
            btn.disabled = false;
        }
    }
}
