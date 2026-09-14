let allWords = [];
let currentHskLevel = 1;
let currentData = null;
let currentLessonData = null;
let wordQueue = [];
let totalAttempts = 0;
let correctAttempts = 0;
let currentMode = '';
let arrangeQueue = []; 
let totalArrangeAttempts = 0;
let correctArrangeAttempts = 0;

// 1. Tải dữ liệu
async function loadData() {
    try {
        const response = await fetch('data.json');
        allWords = await response.json();
        console.log("Dữ liệu đã tải xong!"); 
    } catch (e) { alert("Lỗi tải file data.json. Hãy kiểm tra lại file!"); }
}
loadData();

// 2. Chọn cấp độ HSK
function selectHskLevel(level) {
    currentHskLevel = level;
    const availableLessons = allWords.filter(item => (item.hsk_level || 1) === level);

    if (availableLessons.length === 0) {
        alert(`Dữ liệu HSK ${level} chưa sẵn sàng!`);
        return;
    }

    const menuEl = document.getElementById('menu');
    menuEl.innerHTML = '';
    
    availableLessons.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'btn-lesson';
        btn.innerText = `Bài ${item.lesson_id}`;
        btn.onclick = () => startLesson(item.lesson_id);
        menuEl.appendChild(btn);
    });

    document.getElementById('lesson-title').innerText = `Bài Học HSK ${level}`;
    document.getElementById('hsk-select-section').style.display = 'none';
    document.getElementById('menu-section').style.display = 'block';
}

// 3. Chọn bài học
function startLesson(lessonId) {
    if (allWords.length === 0) { alert("Đang tải dữ liệu, vui lòng chờ..."); return; }
    
    currentLessonData = allWords.find(item => 
        (item.hsk_level || 1) === currentHskLevel && item.lesson_id === lessonId
    );
    
    if (!currentLessonData || !currentLessonData.vocabulary) {
        alert("Bài học này chưa có danh sách từ vựng!"); 
        return;
    }

    document.getElementById('menu-section').style.display = 'none';
    document.getElementById('mode-menu').style.display = 'block';
}

// 4. Chọn Chế độ chơi
function setMode(mode) {
    currentMode = mode;
    
    wordQueue = JSON.parse(JSON.stringify(currentLessonData.vocabulary));
    wordQueue.sort(() => Math.random() - 0.5);

    totalAttempts = 0;
    correctAttempts = 0;

    document.getElementById('menu-section').style.display = 'none';
    document.getElementById('mode-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    
    document.getElementById('options').style.display = (mode === 'dictation') ? 'none' : 'flex';
    document.getElementById('dictation-box').style.display = (mode === 'dictation') ? 'block' : 'none';
    
    // Mồi âm thanh
    const mồi = new SpeechSynthesisUtterance("你好");
    mồi.lang = 'zh-CN';
    mồi.volume = 0;
    window.speechSynthesis.speak(mồi);
    
    loadQuestion();
}

// 5. Tải câu hỏi 
function loadQuestion() {
    if (wordQueue.length === 0) { showResult(); return; }
    
    const current = wordQueue[0];
    const questionEl = document.getElementById('question');
    const inputEl = document.getElementById('answer-input');
    const speakerBtn = document.getElementById('speaker-btn');
    const optionsEl = document.getElementById('options');

    optionsEl.style.pointerEvents = 'auto';
    questionEl.innerText = current.word;
    questionEl.style.color = ""; 
    questionEl.classList.remove('text-correct', 'text-wrong', 'hidden-text');
    inputEl.value = '';

    if (currentMode === 'dictation') {
        questionEl.classList.add('hidden-text');
        inputEl.style.display = 'block';
        optionsEl.style.display = 'none';
        speakerBtn.style.display = 'block';
        inputEl.focus();
        setTimeout(() => speakQuestion(), 100);
    } 
    else if (currentMode === 'listen') {
        questionEl.classList.add('hidden-text');
        inputEl.style.display = 'none';
        optionsEl.style.display = 'flex';
        speakerBtn.style.display = 'block';
        setTimeout(() => speakQuestion(), 100);
    } 
    else {
        inputEl.style.display = 'none';
        optionsEl.style.display = 'flex';
        speakerBtn.style.display = 'none';
    }

    if (currentMode !== 'dictation') {
        let options = [current.meaning];
        let fullList = currentLessonData.vocabulary;
        
        while(options.length < 4 && options.length < fullList.length) {
            let rand = fullList[Math.floor(Math.random() * fullList.length)].meaning;
            if (!options.includes(rand)) options.push(rand);
        }
        options.sort(() => Math.random() - 0.5);

        optionsEl.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.onclick = () => checkAnswer(opt, current.meaning, btn);
            optionsEl.appendChild(btn);
        });
    } else {
        optionsEl.innerHTML = '';
    }
}

// 6. Kiểm tra đáp án Trắc nghiệm (Đã sửa lỗi hiển thị chữ Hán chuẩn)
function checkAnswer(selected, correct, btn) {
    document.getElementById('options').style.pointerEvents = 'none';
    const questionEl = document.getElementById('question');
    
    totalAttempts++;
    
    // Đảm bảo gán lại đúng chữ Hán hiện tại và gỡ ẩn
    questionEl.innerText = wordQueue[0].word;
    questionEl.classList.remove('hidden-text');
    
    if (selected === correct) {
        correctAttempts++;
        btn.style.backgroundColor = "#4CAF50";
        btn.style.color = "#ffffff";
        questionEl.classList.add('text-correct');
        setTimeout(() => { 
            wordQueue.shift(); 
            document.getElementById('options').style.pointerEvents = 'auto';
            loadQuestion(); 
        }, 1500);
    } else {
        btn.style.backgroundColor = "#f44336";
        btn.style.color = "#ffffff";
        questionEl.classList.add('text-wrong');
        
        if (wordQueue.length > 1) {
            const wrongWord = wordQueue.shift(); 
            wordQueue.push(wrongWord); 
        }
        
        setTimeout(() => { 
            btn.style.backgroundColor = ""; 
            btn.style.color = "";
            document.getElementById('options').style.pointerEvents = 'auto';
            loadQuestion(); 
        }, 1500);
    }
}

// 7. Kiểm tra Chính tả
function checkDictation() {
    totalAttempts++;
    const userInput = document.getElementById('answer-input').value.trim();
    const correct = wordQueue[0].word;
    const qEl = document.getElementById('question');

    const normalize = (str) => {
        return str.toString().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    };

    const cleanInput = normalize(userInput);
    const cleanCorrect = normalize(correct);

    qEl.classList.remove('hidden-text');

    if (cleanInput === cleanCorrect) {
        correctAttempts++;
        qEl.style.color = "#4CAF50";
        qEl.innerText = correct; 
        document.getElementById('answer-input').value = '';
        
        setTimeout(() => { 
            qEl.style.color = "";
            wordQueue.shift(); 
            loadQuestion(); 
        }, 1000);
    } else {
        qEl.style.color = "#f44336";
        qEl.innerText = "❌  " + correct;
        
        wordQueue.push(wordQueue.shift());
        
        setTimeout(() => { 
            qEl.style.color = "";
            qEl.classList.remove('text-wrong'); 
            loadQuestion(); 
        }, 1500);
    }
}

document.getElementById('answer-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkDictation();
});

// 8. Game Sắp xếp câu
function startArrangeGame() {
    if (!currentLessonData || !currentLessonData.arrange_sentences || currentLessonData.arrange_sentences.length === 0) {
        alert("Bài này chưa có bài tập sắp xếp câu!");
        return;
    }
    currentMode = 'arrange';
    
    arrangeQueue = JSON.parse(JSON.stringify(currentLessonData.arrange_sentences));
    arrangeQueue.sort(() => Math.random() - 0.5);
    
    totalArrangeAttempts = 0;
    correctArrangeAttempts = 0;

    document.getElementById('menu-section').style.display = 'none';
    document.getElementById('mode-menu').style.display = 'none';
    document.getElementById('arrange-container').style.display = 'block';
    
    loadArrangeQuestion();
}

function loadArrangeQuestion() {
    if (arrangeQueue.length === 0) {
        showResult(); 
        return;
    }
    currentData = arrangeQueue[0];
    document.getElementById('arrange-question').innerText = currentData.word;
    const pool = document.getElementById('word-pool');
    const dropZone = document.getElementById('drop-zone');
    pool.innerHTML = '';
    dropZone.innerHTML = '';
    
    const shuffled = [...currentData.meaning_words].sort(() => Math.random() - 0.5);
    shuffled.forEach(word => {
        const btn = document.createElement('div');
        btn.innerText = word;
        btn.className = 'tag';
        btn.onclick = function() {
            if (this.parentElement.id === 'word-pool') {
                dropZone.appendChild(this);
            } else {
                pool.appendChild(this);
            }
        };
        pool.appendChild(btn);
    });
}

function checkArrange() {
    const dropZone = document.getElementById('drop-zone');
    const checkBtn = event.target;
    
    totalArrangeAttempts++;
    checkBtn.disabled = true;
    
    const droppedWords = Array.from(dropZone.children).map(child => child.innerText);
    const userSentence = droppedWords.join(" ");
    const correctSentence = currentData.meaning_words.join(" ");

    if (userSentence === correctSentence) {
        correctArrangeAttempts++; 
        dropZone.style.borderColor = "#4CAF50";
        dropZone.style.backgroundColor = "#e8f5e9";
        
        setTimeout(() => {
            dropZone.style.borderColor = "#cbd5e1";
            dropZone.style.backgroundColor = "transparent";
            checkBtn.disabled = false;
            
            arrangeQueue.shift(); 
            loadArrangeQuestion(); 
        }, 1000);
    } else {
        dropZone.style.borderColor = "#f44336";
        dropZone.style.backgroundColor = "#ffebee";
        
        const wrongSentence = arrangeQueue.shift();
        arrangeQueue.push(wrongSentence);
        
        setTimeout(() => {
            dropZone.style.borderColor = "#cbd5e1";
            dropZone.style.backgroundColor = "transparent";
            checkBtn.disabled = false;
            loadArrangeQuestion(); 
        }, 1000);
    }
}

// 9. Phát âm
function speakQuestion() {
    window.speechSynthesis.cancel();
    const text = wordQueue[0].word;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.7;
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang === 'zh' || v.name.includes('ZH'));
    if (viVoice) utterance.voice = viVoice;
    window.speechSynthesis.speak(utterance);
} 

// 10. Hiển thị kết quả
function showResult() {
    let total, correct;
    if (currentMode === 'arrange') {
        total = totalArrangeAttempts;
        correct = correctArrangeAttempts;
    } else {
        total = totalAttempts;
        correct = correctAttempts;
    }
    const percent = (total > 0) ? Math.round((correct / total) * 100) : 0;
    const resultText = document.getElementById('resultText');
    resultText.innerHTML = `Khả năng ghi nhớ: <b>${percent}%</b>`;
    document.getElementById('resultModal').style.display = 'flex';
}

window.speechSynthesis.onvoiceschanged = () => {
    console.log("Giọng nói đã sẵn sàng");
};

// 11. Các hàm quay lại Điều hướng
function backToHskSelect() {
    document.getElementById('menu-section').style.display = 'none';
    document.getElementById('hsk-select-section').style.display = 'block';
}

function backToLessonMenu() {
    document.getElementById('mode-menu').style.display = 'none';
    document.getElementById('menu-section').style.display = 'block';
    currentMode = '';
}

function backToMenu() {
    window.speechSynthesis.cancel();
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('arrange-container').style.display = 'none';
    document.getElementById('mode-menu').style.display = 'block';
}

function backToModeMenu() {
    window.speechSynthesis.cancel();
    document.getElementById('resultModal').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('arrange-container').style.display = 'none';
    document.getElementById('mode-menu').style.display = 'block';
    currentMode = '';
}
