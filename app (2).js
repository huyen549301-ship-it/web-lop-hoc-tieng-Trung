let allWords = [];
let currentData = null
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

// 2. Bắt đầu bài học
function startLesson(lessonId) {
    if (allWords.length === 0) { alert("Đang tải dữ liệu, vui lòng chờ..."); return;}
    currentLessonData = allWords.find(item => item.lesson_id === lessonId);
    if (!currentLessonData || !currentLessonData.vocabulary) {alert("Bài học này chưa có danh sách từ vựng!"); return;}
    
    wordQueue = [...currentLessonData.vocabulary];
    wordQueue.sort(() => Math.random() - 0.5);

    document.getElementById('menu').style.display = 'none';
    document.getElementById('mode-menu').style.display = 'block';
    
    totalAttempts = 0;
    correctAttempts = 0;
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById('menu').style.display = 'none';
    document.getElementById('mode-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    const isDictation = (mode === 'dictation');
    document.getElementById('options').style.display = (mode === 'dictation') ? 'none' : 'flex';
    document.getElementById('dictation-box').style.display = (mode === 'dictation') ? 'block' : 'none';
    
    // Mồi âm thanh
    const mồi = new SpeechSynthesisUtterance("你好");
mồi.lang = 'zh-CN';
mồi.volume = 0;
window.speechSynthesis.speak(mồi);
    
    loadQuestion();
}

// 3. Tải câu hỏi
function loadQuestion() {
    if (wordQueue.length === 0) { showResult(); return; }
    
    const current = wordQueue[0];
    const questionEl = document.getElementById('question');
    const inputEl = document.getElementById('answer-input');
    const speakerBtn = document.getElementById('speaker-btn');
    const optionsEl = document.getElementById('options');

    // Reset giao diện
    questionEl.innerText = current.word;
    questionEl.style.color = "";
    questionEl.classList.add('hidden-text');
    inputEl.value = '';

    // Logic hiển thị phần tử theo chế độ
    if (currentMode === 'dictation') {
        inputEl.style.display = 'block';
        optionsEl.style.display = 'none';
        speakerBtn.style.display = 'block';
        inputEl.focus();
        setTimeout(() => speakQuestion(), 500);
    } 
    else if (currentMode === 'listen') {
        inputEl.style.display = 'none';
        optionsEl.style.display = 'flex';
        speakerBtn.style.display = 'block';
        questionEl.classList.add('hidden-text');
        setTimeout(() => speakQuestion(), 800);
    } 
    else { // Chế độ 'look'
        inputEl.style.display = 'none';
        optionsEl.style.display = 'flex';
        speakerBtn.style.display = 'none'; // Ẩn loa
        questionEl.classList.remove('hidden-text');
    }

    // Tạo nút trắc nghiệm (nếu không phải chế độ chép chính tả)
    if (currentMode !== 'dictation') {
        let options = [current.meaning];
        while(options.length < 4 && options.length < wordQueue.length) {
            let rand = wordQueue[Math.floor(Math.random() * wordQueue.length)].meaning;
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

// 4. Kiểm tra đáp án
function checkAnswer(selected, correct, btn) {
    document.getElementById('options').style.pointerEvents = 'none';
    const questionEl = document.getElementById('question');
    
    totalAttempts++;
    questionEl.classList.remove('hidden-text');
    
    if (selected === correct) {
        correctAttempts++;
        btn.style.backgroundColor = "#4CAF50";
        questionEl.classList.add('text-correct');
        setTimeout(() => { 
            wordQueue.shift(); 
            document.getElementById('options').style.pointerEvents = 'auto';
            loadQuestion(); 
        }, 1500);
    } else {
        btn.style.backgroundColor = "#f44336";
        questionEl.classList.add('text-wrong');
        
        if (wordQueue.length > 1) {
            const wrongWord = wordQueue.shift(); 
            wordQueue.push(wrongWord); 
        }
        
        setTimeout(() => { 
            btn.style.backgroundColor = "#007bff"; 
            document.getElementById('options').style.pointerEvents = 'auto';
            loadQuestion(); 
        }, 1500);
    }
}

// Kiểm tra đáp án (Viết)
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
        // Giữ lại từ gốc để hiển thị chính xác trước khi chuyển câu
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
            // Không cần remove class text-wrong nếu bạn không dùng CSS cho nó, 
            // nhưng giữ lại để logic sạch sẽ
            qEl.classList.remove('text-wrong'); 
            loadQuestion(); 
        }, 1500);
    }
}

// Hỗ trợ nhấn Enter để kiểm tra
document.getElementById('answer-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkDictation();
});


function checkArrange() {
    const dropZone = document.getElementById('drop-zone');
    const checkBtn = event.target;
    
    totalArrangeAttempts++;
    checkBtn.disabled = true;
    
    const droppedWords = Array.from(dropZone.children).map(child => child.innerText);
    const userSentence = droppedWords.join(" ");
    const correctSentence = currentData.meaning_words.join(" ");

    if (userSentence === correctSentence) {
        correctArrangeAttempts++; // Tăng điểm
        dropZone.style.borderColor = "#4CAF50";
        dropZone.style.backgroundColor = "#e8f5e9";
        
        setTimeout(() => {
            dropZone.style.borderColor = "#ccc";
            dropZone.style.backgroundColor = "transparent";
            checkBtn.disabled = false;
            
            arrangeQueue.shift(); // Loại bỏ câu đã làm đúng khỏi hàng đợi
            loadArrangeQuestion(); // Tải câu tiếp theo
        }, 1000);
    } else {
        dropZone.style.borderColor = "#f44336";
        dropZone.style.backgroundColor = "#ffebee";
        
        // Sai thì đưa xuống cuối hàng đợi để lặp lại
        const wrongSentence = arrangeQueue.shift();
        arrangeQueue.push(wrongSentence);
        
        setTimeout(() => {
            dropZone.style.borderColor = "#ccc";
            dropZone.style.backgroundColor = "transparent";
            checkBtn.disabled = false;
            loadArrangeQuestion(); // Tải lại câu hỏi
        }, 1000);
    }
}

// 5. Hàm phát âm thanh
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

// Tính năng độc lập: Sắp xếp câu
function startArrangeGame() {
    if (!currentLessonData || !currentLessonData.arrange_sentences || currentLessonData.arrange_sentences.length === 0) {
        alert("Bài này chưa có bài tập sắp xếp câu!");
        return;
    }
    currentMode = 'arrange';
    document.getElementById('menu').style.display = 'none';
    document.getElementById('mode-menu').style.display = 'none';
    document.getElementById('arrange-container').style.display = 'block';
    let tempQueue = [...currentLessonData.arrange_sentences];
    for (let i = tempQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tempQueue[i], tempQueue[j]] = [tempQueue[j], tempQueue[i]];
    }
    arrangeQueue = tempQueue; 
    
    totalArrangeAttempts = 0;
    correctArrangeAttempts = 0;
    
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


window.speechSynthesis.onvoiceschanged = () => {
    console.log("Giọng nói đã sẵn sàng");
};

function backToMenu() {
    // 1. Dừng ngay âm thanh đang đọc (nếu có)
    window.speechSynthesis.cancel();

    const gameContainer = document.getElementById('game-container');
    const arrangeContainer = document.getElementById('arrange-container');
    const modeMenu = document.getElementById('mode-menu');
    const mainMenu = document.getElementById('menu');

    // Kiểm tra xem có đang ở trong màn hình làm bài/game hay không
    const isPlayingGame = (gameContainer && gameContainer.style.display !== 'none') || 
                          (arrangeContainer && arrangeContainer.style.display !== 'none');

    if (isPlayingGame) {
        // Đang ở trong game -> Thoát ra menu Chọn Chế Độ
        if (gameContainer) gameContainer.style.display = 'none';
        if (arrangeContainer) arrangeContainer.style.display = 'none';
        if (modeMenu) modeMenu.style.display = 'block';
    } else {
        // Đang ở menu Chọn Chế Độ -> Thoát ra màn hình Chọn Bài
        if (modeMenu) modeMenu.style.display = 'none';
        if (mainMenu) mainMenu.style.display = 'grid'; // Dùng 'grid' thay vì 'block' để không vỡ giao diện nút
        currentMode = '';
    }
}

