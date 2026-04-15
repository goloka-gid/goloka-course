// ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ

let currentDayNum = 1;
let readDays = JSON.parse(localStorage.getItem('elli_progress')) || [];
let unlockedDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

let isScrolling = false;
let scrollInterval;

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
    // Если открыты все 10 дней
    const allUnlocked = items.every((_, i) => unlockedDays.includes(i + 1));
    
    if (allUnlocked) {
        const finalCard = document.createElement('div');
        finalCard.className = 'day-card final-day-card';
        finalCard.onclick = () => openDayMenu('final', 'ФИНАЛ');
        
        finalCard.innerHTML = `
            <div style="font-size:11px; font-weight:bold; color: rgba(255,255,255,0.9);">ГРАНД ФИНАЛ</div>
            <div class="day-icon">🏆</div>
            <div class="day-name">Вершина Пути</div>
        `;
        grid.appendChild(finalCard);
    }
}
// Запускаем отрисовку при загрузке
document.addEventListener('DOMContentLoaded', renderGrid);

// Обработка клика по дню
function handleDayClick(dayNum, name, isLocked, isRead) {
    openDayMenu(dayNum, name);
}

// --- 2. ОТКРЫТИЕ МЕНЮ ДНЯ ---
function openDayMenu(num, name) {
    currentDayNum = num;
    
    switchView('view-menu');
    document.getElementById('menu-title').innerText = `День ${num}: ${name}`;

    // Сохраняем, что день открыт
    if (!readDays.includes(num)) {
        readDays.push(num);
        localStorage.setItem('elli_progress', JSON.stringify(readDays));
        renderGrid();
    }
}

// --- 3. ЗАГРУЗКА КОНТЕНТА (HTML, ВИДЕО, АУДИО) ---
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
    scrollBtn.classList.remove('visible');
    textDisplay.innerHTML = ""; 

    // Определяем префикс файла (если финал, то особое имя, иначе dayN)
    const filePrefix = currentDayNum === 'final' ? 'final' : `day${currentDayNum}`;

    // 1. ИСТОРИЯ
    if (type === 'story') {
        titleLabel.innerText = "📖 История";
        await loadTextContent(`texts/${filePrefix}_story.html`); 
        
        audioBox.style.display = 'block';
        audioTitle.innerText = "🎧 Слушать сказку";
        audioPlayer.src = `audio/${filePrefix}_story.mp3`;
        scrollBtn.classList.add('visible');
    } 
    // 2. ВИДЕО
    else if (type === 'video') {
        titleLabel.innerText = "🎬 Видео";
        videoArea.style.display = 'block';
        // Если финал видео
        const videoName = currentDayNum === 'final' ? 'final' : `day${currentDayNum}`;
        videoPlayer.src = `videos/${videoName}.mp4`;
    } 
    // 3. ПЕСНЯ
    else if (type === 'song') {
        titleLabel.innerText = "🎵 Песенка";
        const imgName = currentDayNum === 'final' ? 'final' : `day${currentDayNum}`;
        mainImage.src = `images/${imgName}.jpg`;
        mainImage.style.display = 'block';
        
        audioBox.style.display = 'block';
        audioTitle.innerText = "🎧 Слушать песенку";
        audioPlayer.src = `audio/${filePrefix}_song.mp3`;
    } 
    // 4. ДЕТИ
    else if (type === 'child') {
        titleLabel.innerText = "👶 Практика (Дети)";
        await loadTextContent(`texts/${filePrefix}_child.html`);
        
        audioBox.style.display = 'block';
        audioTitle.innerText = "🎧 Слушать практику";
        audioPlayer.src = `audio/${filePrefix}_child.mp3`;
        scrollBtn.classList.add('visible');
    } 
    // 5. ВЗРОСЛЫЕ
    else if (type === 'adult') {
        titleLabel.innerText = "🧘‍♀️ Практика (Взр)";
        await loadTextContent(`texts/${filePrefix}_adult.html`);
        
        audioBox.style.display = 'block';
        audioTitle.innerText = "🎧 Слушать практику";
        audioPlayer.src = `audio/${filePrefix}_adult.mp3`;
        scrollBtn.classList.add('visible');
    }
            // 6. ПРЕЗЕНТАЦИЯ
    else if (type === 'presentation') {
        titleLabel.innerText = "🖼️ Презентация";
        textBox.style.display = 'block';
        try {
            const response = await fetch(`texts/${filePrefix}_presentation.html`);
            if (response.ok) {
                const html = await response.text();
                document.getElementById('text-display').innerHTML = html;
            } else {
                throw new Error("Not found");
            }
        } catch (e) {
            document.getElementById('text-display').innerHTML = `<p style="text-align:center;">Здесь будет презентация для урока ${currentDayNum}</p><p style="text-align:center; color:#888;">(Добавьте файл texts/${filePrefix}_presentation.html с iframe или изображениями)</p>`;
        }
    }
    // 7. ДОМАШНЕЕ ЗАДАНИЕ
    else if (type === 'homework') {
        titleLabel.innerText = "✍️ Домашнее задание";
        const homeworkBox = document.getElementById('homework-box');
        if (homeworkBox) {
            homeworkBox.style.display = 'block';
            let hwText = `<strong>Задание для урока ${currentDayNum}:</strong><br>Пожалуйста, опишите, как прошла ваша волшебная практика.`;
            
            // Пытаемся загрузить индивидуальный текст задания, если он есть
            try {
                const response = await fetch(`texts/${filePrefix}_homework.html`);
                if (response.ok) {
                    hwText = await response.text();
                }
            } catch(e) {}
            
            document.getElementById('homework-text').innerHTML = hwText;
            document.getElementById('homework-input').value = '';
            document.getElementById('homework-status').style.display = 'none';
        }
    }
    
    if (audioBox.style.display === 'block') audioPlayer.load();
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

    await loadTextContent('texts/instructions.html');
    scrollBtn.classList.add('visible');
}

// Загрузка текста и форматирование картинок
async function loadTextContent(url) {
    const textBox = document.getElementById('text-box');
    const textDisplay = document.getElementById('text-display');
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error();
        let html = await response.text();
        html = formatText(html, currentDayNum);
        textDisplay.innerHTML = html;
        textBox.style.display = 'block';
    } catch (e) {
        textBox.style.display = 'block';
        textDisplay.innerHTML = "<p style='text-align:center'>Текст пока недоступен.</p>";
    }
}

// --- НАВИГАЦИЯ ---
function goHome() {
    stopScroll();
    document.getElementById('video-player').pause();
    document.getElementById('audio-player').pause();
    switchView('view-grid');
    renderGrid(); 
}

function goBackToMenu() {
    stopScroll();
    document.getElementById('video-player').pause();
    document.getElementById('audio-player').pause();
    // Если мы зашли в инструкцию, вернемся в сетку
    if (document.getElementById('header-title').innerText === "❓ Инструкция") {
        goHome();
    } else {
        openDayMenu(currentDayNum, items[currentDayNum === 'final' ? items.length - 1 : currentDayNum - 1].n);
    }
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

    html = html.replace(/\[VID(\d*)\]/g, (match, p1) => {
        const suffix = p1 ? `_${p1}` : '';
        return `
        <div class="video-wrapper book-media">
            <video controls playsinline preload="metadata">
                <source src="videos/day${dayNum}${suffix}.mp4" type="video/mp4">
            </video>
        </div>`;
    });
    return html;
}

// --- АВТОСКРОЛЛ ---
function toggleAutoScroll() {
    const btn = document.getElementById('scroll-btn');
    const container = document.getElementById('scroll-box');

    if (isScrolling) {
        stopScroll();
    } else {
        isScrolling = true;
        btn.classList.add('active');
        scrollInterval = setInterval(() => {
            container.scrollBy(0, 1);
            if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
                stopScroll();
            }
        }, 30);
    }
}

function stopScroll() {
    isScrolling = false;
    clearInterval(scrollInterval);
    const btn = document.getElementById('scroll-btn');
    if(btn) btn.classList.remove('active');
}

// Остановка скролла при касании
document.getElementById('scroll-box').addEventListener('touchstart', stopScroll, {passive: true});
document.getElementById('scroll-box').addEventListener('wheel', stopScroll, {passive: true});

// --- СБРОС ---
function confirmReset() {
    if (confirm("Вы точно хотите сбросить прогресс чтения? Открытые дни останутся.")) {
        readDays = [];
        localStorage.removeItem('elli_progress');
        renderGrid();
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
    const GOOGLE_APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7KdRDInC76sew3pKHhDgPjfhUv3e4zlRNqOz-gGNMb90yGY8-RJiMkt4mXnZcZqPD/exec";

    try {
        const response = await fetch(GOOGLE_APP_SCRIPT_URL, {
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
    } catch (error) {
        console.error("Ошибка при отправке ДЗ:", error);
        alert("Произошла ошибка при отправке. Пожалуйста, попробуйте позже.");
    }
}