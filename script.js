class VocabularyGame {
    constructor() {
        this.currentQuestion = 0;
        this.score = 0;
        this.questions = [];
        
        this.init();
    }

    async init() {
        await this.loadQuestions();
        this.bindEvents();
        this.showScreen('start-screen');
    }

    async loadQuestions() {
        try {
            // question.txt 파일 로드
            const questionResponse = await fetch('question.txt');
            const questionText = await questionResponse.text();
            
            // answer.txt 파일 로드
            const answerResponse = await fetch('answer.txt');
            const answerText = await answerResponse.text();
            
            this.parseQuestions(questionText, answerText);
        } catch (error) {
            console.error('문제 로드 실패:', error);
            // 기본 문제로 폴백
            this.questions = this.getDefaultQuestions();
        }
    }

    parseQuestions(questionText, answerText) {
        const questionLines = questionText.split('\n').filter(line => line.trim());
        const answerLines = answerText.split('\n').filter(line => line.trim());
        
        this.questions = [];
        
        for (let i = 0; i < 10; i++) { // 10문제
            const questionStart = i * 8 + 1; // 각 문제는 8줄씩
            
            if (questionStart < questionLines.length) {
                const questionLine = questionLines[questionStart];
                const options = [];
                
                // 보기 추출 (5개)
                for (let j = 1; j <= 5; j++) {
                    const optionLine = questionLines[questionStart + j];
                    if (optionLine) {
                        const optionText = optionLine.replace(/^[①②③④⑤]\s*/, '').trim();
                        options.push(optionText);
                    }
                }
                
                // 정답 추출
                const answerMatch = answerLines.find(line => line.includes(`${i + 1}번`));
                let correctAnswer = 1;
                if (answerMatch) {
                    const correctMatch = answerMatch.match(/정답:\s*[①②③④⑤]/);
                    if (correctMatch) {
                        const answerChar = correctMatch[0].charAt(correctMatch[0].length - 1);
                        correctAnswer = this.convertAnswerToNumber(answerChar);
                    }
                }
                
                // 해설 추출
                let explanation = '';
                const answerStart = answerLines.findIndex(line => line.includes(`${i + 1}번`));
                if (answerStart !== -1) {
                    const explanationLines = [];
                    for (let k = answerStart + 1; k < answerLines.length && k < answerStart + 20; k++) {
                        const line = answerLines[k];
                        if (line.includes(`${i + 2}번`) || line.includes('번 (정답:')) {
                            break;
                        }
                        if (line.trim() && !line.includes('문장') && !line.includes('해석') && !line.includes('정답 해설') && !line.includes('오답 해설')) {
                            explanationLines.push(line.trim());
                        }
                    }
                    explanation = explanationLines.join(' ');
                }
                
                if (options.length === 5 && questionLine && explanation) {
                    this.questions.push({
                        question: questionLine.trim(),
                        options: options,
                        correct: correctAnswer,
                        explanation: explanation
                    });
                }
            }
        }
        
        // 문제가 3개 미만이면 기본 문제 추가
        if (this.questions.length < 3) {
            this.questions = this.getDefaultQuestions();
        }
        
        // 3개만 사용
        this.questions = this.questions.slice(0, 3);
    }

    convertAnswerToNumber(answerChar) {
        const answerMap = {
            '①': 1,
            '②': 2,
            '③': 3,
            '④': 4,
            '⑤': 5
        };
        return answerMap[answerChar] || 1;
    }

    getDefaultQuestions() {
        return [
            {
                question: "다음 중 '부지런하다'의 의미를 가진 단어는?",
                options: ["근면하다", "게으르다", "느리다", "빠르다", "조용하다"],
                correct: 1,
                explanation: "근면하다는 부지런하고 성실한 것을 의미합니다. 수능에서 자주 출제되는 어휘입니다."
            },
            {
                question: "'아름답다'와 가장 유사한 의미를 가진 단어는?",
                options: ["예쁘다", "크다", "작다", "높다", "낮다"],
                correct: 1,
                explanation: "아름답다와 예쁘다는 모두 미적 가치를 나타내는 동의어입니다."
            },
            {
                question: "다음 중 '기쁘다'의 반대말은?",
                options: ["슬프다", "즐겁다", "재미있다", "좋다", "나쁘다"],
                correct: 1,
                explanation: "기쁘다의 반대말은 슬프다입니다. 감정의 대립 관계를 나타냅니다."
            }
        ];
    }

    bindEvents() {
        // 시작 버튼
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        // 답변 제출
        document.getElementById('submit-btn').addEventListener('click', () => {
            this.submitAnswer();
        });

        // 다음 문제 버튼
        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextQuestion();
        });

        // 홈으로 버튼들
        document.getElementById('home-btn').addEventListener('click', () => {
            this.goHome();
        });

        document.getElementById('final-home-btn').addEventListener('click', () => {
            this.goHome();
        });

        // 상장 저장 버튼
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveCertificate();
        });

        // 입력 필드 엔터 키
        document.getElementById('answer-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });

        // 옵션 클릭 이벤트
        document.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectOption(option);
            });
        });
    }

    showScreen(screenId) {
        // 모든 화면 숨기기
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // 선택된 화면 보이기
        document.getElementById(screenId).classList.add('active');
    }

    startGame() {
        this.currentQuestion = 0;
        this.score = 0;
        this.updateScore();
        this.showQuestion();
    }

    showQuestion() {
        this.showScreen('question-screen');
        this.resetQuestionUI();
        
        const question = this.questions[this.currentQuestion];
        document.getElementById('question-text').textContent = question.question;
        
        // 옵션 설정
        question.options.forEach((option, index) => {
            document.getElementById(`option${index + 1}`).textContent = option;
        });
    }

    resetQuestionUI() {
        // 입력 필드 초기화
        document.getElementById('answer-input').value = '';
        document.getElementById('answer-input').focus();
        
        // 결과 영역 숨기기
        document.getElementById('result-area').classList.add('hidden');
        
        // 실패 애니메이션 숨기기
        document.getElementById('fail-animation').classList.add('hidden');
        
        // 옵션 선택 상태 초기화
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected');
        });
    }

    selectOption(selectedOption) {
        // 이전 선택 해제
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // 현재 선택 표시
        selectedOption.classList.add('selected');
        
        // 입력 필드에 번호 입력
        const optionNumber = selectedOption.dataset.option;
        document.getElementById('answer-input').value = optionNumber;
    }

    submitAnswer() {
        const input = document.getElementById('answer-input');
        const answer = parseInt(input.value);
        
        if (!answer || answer < 1 || answer > 5) {
            alert('1부터 5까지의 숫자를 입력해주세요.');
            return;
        }
        
        this.checkAnswer(answer);
    }

    checkAnswer(userAnswer) {
        const question = this.questions[this.currentQuestion];
        const isCorrect = userAnswer === question.correct;
        
        if (isCorrect) {
            this.score++;
            this.updateScore();
            this.playSound('success-sound');
            this.showResult(true, "정답입니다!");
        } else {
            this.playSound('fail-sound');
            this.showFailAnimation();
            this.showResult(false, "아쉽습니다!");
        }
    }

    showResult(isCorrect, message) {
        const resultArea = document.getElementById('result-area');
        const resultMessage = document.getElementById('result-message');
        const explanation = document.getElementById('explanation');
        
        resultMessage.textContent = message;
        resultMessage.style.color = isCorrect ? '#00b894' : '#e74c3c';
        
        const question = this.questions[this.currentQuestion];
        explanation.textContent = question.explanation;
        
        resultArea.classList.remove('hidden');
    }

    showFailAnimation() {
        const failAnimation = document.getElementById('fail-animation');
        failAnimation.classList.remove('hidden');
        
        // 4초 후 애니메이션 숨기기
        setTimeout(() => {
            failAnimation.classList.add('hidden');
        }, 4000);
    }

    nextQuestion() {
        this.currentQuestion++;
        
        if (this.currentQuestion >= this.questions.length) {
            this.showFinalResult();
        } else {
            this.showQuestion();
        }
    }

    showFinalResult() {
        this.showScreen('result-screen');
        
        const finalMessage = document.getElementById('final-message');
        const certificate = document.getElementById('certificate');
        
        if (this.score === 3) {
            finalMessage.textContent = "🎉 축하합니다! 당신은 수능 만점가능자이시군요!!";
            certificate.textContent = "🥤 수능 만점가능자";
            this.playSound('final-success-sound');
        } else if (this.score === 2) {
            finalMessage.textContent = "🎉 축하합니다! 당신은 수능 우수생가능자시군요!";
            certificate.textContent = "🥤 수능 우수생가능자";
            this.playSound('final-success-sound');
        } else if (this.score === 1) {
            finalMessage.textContent = "🎉 축하합니다! 당신은 수능 만점희망자이시군요!";
            certificate.textContent = "🥤 수능 만점희망자";
            this.playSound('final-success-sound');
            this.createConfetti();
        } else {
            finalMessage.textContent = "아쉽습니다. 다음엔 더 잘하실 수 있을 거에요!";
            certificate.textContent = "🥤 수능 우수생 희망자";
            this.playSound('fail-sound');
        }
    }

    createConfetti() {
        const container = document.getElementById('result-screen');
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            container.appendChild(confetti);
            
            // 애니메이션 완료 후 제거
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }
    }

    updateScore() {
        document.getElementById('current-score').textContent = this.score;
    }

    playSound(soundId) {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log('오디오 재생 실패:', e));
        }
    }

    goHome() {
        this.showScreen('start-screen');
        this.resetGame();
    }

    resetGame() {
        this.currentQuestion = 0;
        this.score = 0;
        this.updateScore();
    }

    saveCertificate() {
        // Canvas를 사용하여 상장 이미지 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800;
        canvas.height = 600;
        
        // 배경
        const gradient = ctx.createLinearGradient(0, 0, 800, 600);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        
        // 제목
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Noto Sans KR';
        ctx.textAlign = 'center';
        ctx.fillText('수능 어휘 테스트', 400, 150);
        
        // 상장 내용
        ctx.font = 'bold 36px Noto Sans KR';
        ctx.fillText(document.getElementById('certificate').textContent, 400, 300);
        
        // 점수
        ctx.font = '24px Noto Sans KR';
        ctx.fillText(`정답: ${this.score}/3`, 400, 400);
        
        // 날짜
        const today = new Date();
        ctx.fillText(`발급일: ${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`, 400, 500);
        
        // 이미지 다운로드
        const link = document.createElement('a');
        link.download = '수능어휘테스트_상장.png';
        link.href = canvas.toDataURL();
        link.click();
    }
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    new VocabularyGame();
});
