// 初始化音频上下文
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// 钢琴音色数据
const pianoNotes = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
    'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25
};

// 创建钢琴音色
function createPianoSound(frequency) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1);
}

// 播放音符
function playNote(note) {
    const frequency = pianoNotes[note];
    if (frequency) {
        createPianoSound(frequency);
        const key = document.querySelector(`[data-note="${note}"]`);
        key.classList.add('active');
        setTimeout(() => key.classList.remove('active'), 200);
    }
}

// 初始化摄像头
const video = document.getElementById('video');
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.play();
    } catch (err) {
        console.error('无法访问摄像头:', err);
    }
}

// 初始化 MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

// 处理手指追踪结果
hands.onResults((results) => {
    if (results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // 获取食指和中指的位置
        const indexFinger = landmarks[8];
        const middleFinger = landmarks[12];
        
        // 将手指位置映射到钢琴键
        const videoWidth = video.videoWidth;
        const keyWidth = videoWidth / 8;
        
        // 检测食指位置
        const indexX = indexFinger.x * videoWidth;
        const indexKey = Math.floor(indexX / keyWidth);
        if (indexKey >= 0 && indexKey < 8) {
            const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
            playNote(notes[indexKey]);
        }
        
        // 检测中指位置
        const middleX = middleFinger.x * videoWidth;
        const middleKey = Math.floor(middleX / keyWidth);
        if (middleKey >= 0 && middleKey < 8) {
            const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
            playNote(notes[middleKey]);
        }
    }
});

// 启动摄像头和手指追踪
setupCamera().then(() => {
    const camera = new Camera(video, {
        onFrame: async () => {
            await hands.send({ image: video });
        },
        width: 640,
        height: 480
    });
    camera.start();
}); 