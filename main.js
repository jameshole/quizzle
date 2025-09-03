const categoryIconMap = {
    "Global": '🌍',
    "National": '🇦🇺',
    "Local": '📍',
    "Sports": '⚽',
    "Entertainment": '🎬',
};

let questions = [];
let currentQuestionIndex = 0;
let totalCorrect = 0;
let resultString = "";
let quizDate = null;
let userAnswers = [];
let touchStartX = 0;
let touchEndX = 0;

// on document ready
document.addEventListener("DOMContentLoaded", async function() {
    setupTheme();
    // Load questions from date-based JSON file
    await loadQuizForDate();

    loadProgress();

    updateSubtitle();
    document.getElementById("start-button").addEventListener("click", startQuiz);
    document.querySelector(".next").addEventListener("click", nextQuestion);
    document.getElementById("share-button").addEventListener("click", shareText);
    
    // Add swipe event listeners
    setupSwipeListeners();
});

function setupTheme() {
    const deviceDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = localStorage.getItem('theme') ?? (deviceDark ? 'dark' : 'light');
    if (theme === 'dark') {
        document.getElementsByTagName('body')[0].classList.add('dark');
    }
    document.getElementById('theme-toggle').addEventListener("click", toggleTheme);
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const prevTheme = localStorage.getItem('theme');
    const theme = prevTheme === 'dark' ? 'light' : 'dark';
    if (theme === 'dark') {
        document.getElementsByTagName('body')[0].classList.add('dark');
    } else {
        document.getElementsByTagName('body')[0].classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
}

async function loadQuizForDate() {
    let daysBack = 0;
    const maxDaysBack = 4;
    let loaded = false;

    while (daysBack <= maxDaysBack && !loaded) {
        const tryDate = new Date();
        tryDate.setDate(tryDate.getDate() - daysBack);

        const year = tryDate.getFullYear();
        const month = String(tryDate.getMonth() + 1).padStart(2, '0');
        const day = String(tryDate.getDate()).padStart(2, '0');
        const fileName = `questions/${year}-${month}-${day}.json`;

        try {
            const response = await fetch(fileName);
            if (response.ok) {
                const data = await response.json();
                questions = data.questions;
                quizDate = tryDate;
                loaded = true;

                // Show message if loading previous day's quiz
                if (daysBack > 0) {
                    showNotification("Today's quiz isn't ready yet, but here's a recent one!");
                }
            } else {
                throw new Error('File not found');
            }
        } catch (error) {
            console.log(`No quiz found for ${fileName}`);
            daysBack++;
        }
    }

    if (!loaded) {
        showError("Sorry, something's gone wrong. Please come back again later!");
        // Hide start button if no quiz loaded
        document.getElementById("start-button").style.display = 'none';
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        text-align: center;
        color: #d32f2f;
        padding: 20px;
        margin: 20px;
        font-size: 18px;
    `;

    const splashContent = document.querySelector('.splash-screen');
    splashContent.insertBefore(errorDiv, splashContent.firstChild);
}

function updateSubtitle() {
    // get the subtitle element
    const subtitle = document.getElementById("subtitle");
    // use quiz date if available, otherwise current date
    subtitle.textContent = 'Daily news quiz for ' + getFormattedDate();
}

function getFormattedDate() {
    const currentDate = quizDate || new Date();
    // format the date as dd MMM yyyy
    return currentDate.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function startQuiz() {
    // hide the splash screen
    document.querySelector(".splash-screen").classList.add('hidden');
    // show the question
    document.querySelector(".question").classList.remove('hidden');
    loadQuestion(0);
}

function loadQuestion(index) {
    // Update progress indicator
    updateProgressIndicator(index);
    
    // get the question element
    const questionElement = document.querySelector(".question");
    // get the question
    const question = questions[index];
    // set the question category
    const categoryElement = questionElement.querySelector("#question-category");
    categoryElement.textContent = question.category;
    categoryElement.classList.remove(...categoryElement.classList);
    categoryElement.classList.add(question.category.toLowerCase());
    // set the question text
    questionElement.querySelector("#question-text").textContent = question.question;
    
    // Check if this question was already answered
    const wasAnswered = userAnswers[index] !== undefined;
    
    if (wasAnswered) {
        // Restore the answered state
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correctAnswer;
        
        // Update category header
        categoryElement.textContent = isCorrect ? '✅ Correct' : '❌ Incorrect';
        categoryElement.classList.remove(...categoryElement.classList);
        categoryElement.classList.add(isCorrect ? 'result-correct' : 'result-incorrect');
        
        // Set answers and highlight correct/incorrect
        question.answers.forEach((answer, idx) => {
            const answerElement = questionElement.querySelector(`#answer-${idx + 1}`);
            answerElement.textContent = answer.text;
            answerElement.disabled = true;
            answerElement.classList.remove('correct', 'incorrect');
            
            if (idx === question.correctAnswer) {
                answerElement.classList.add('correct');
            } else if (idx === userAnswer && !isCorrect) {
                answerElement.classList.add('incorrect');
            }
            
            answerElement.onclick = null;
        });
        
        // Show feedback
        const explanationElement = document.getElementById("result-explanation");
        explanationElement.textContent = question.explanation;
        
        // Add "Read more" link if source is available
        if (question.source) {
            const lineBreak = document.createElement('br');
            explanationElement.appendChild(lineBreak);
            
            const readMoreLink = document.createElement('a');
            readMoreLink.href = question.source;
            readMoreLink.target = '_blank';
            readMoreLink.rel = 'noopener';
            readMoreLink.textContent = 'Read more';
            readMoreLink.style.textDecoration = 'underline';
            explanationElement.appendChild(readMoreLink);
        }
        
        document.getElementById('feedback').classList.remove('hidden');
    } else {
        // set the answers for unanswered question
        question.answers.forEach((answer, idx) => {
            const answerElement = questionElement.querySelector(`#answer-${idx + 1}`);
            answerElement.textContent = answer.text;
            answerElement.onclick = () => checkAnswer(idx);
            // Reset any previous styling
            answerElement.classList.remove('correct', 'incorrect');
            answerElement.disabled = false;
        });
        // Hide feedback initially
        document.getElementById('feedback').classList.add('hidden');
    }
}

function checkAnswer(answerIndex) {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;

    // Store the user's answer
    userAnswers[currentQuestionIndex] = answerIndex;
    
    if (isCorrect) {
        totalCorrect++;
        resultString += '✅'
    } else {
        resultString += '❌';
    }

    saveProgress();

    // Update the category header to show result
    const categoryElement = document.getElementById("question-category");
    categoryElement.textContent = isCorrect ? '✅ Correct' : '❌ Incorrect';
    categoryElement.classList.remove(...categoryElement.classList);
    categoryElement.classList.add(isCorrect ? 'result-correct' : 'result-incorrect');

    // Disable all answer buttons
    document.querySelectorAll('.answer').forEach(btn => {
        btn.disabled = true;
    });

    // Highlight the correct answer in green
    const correctButton = document.querySelector(`#answer-${currentQuestion.correctAnswer + 1}`);
    correctButton.classList.add('correct');

    // If user selected wrong answer, highlight it in red
    if (!isCorrect) {
        const selectedButton = document.querySelector(`#answer-${answerIndex + 1}`);
        selectedButton.classList.add('incorrect');
    }

    // Show explanation and continue button
    const explanationElement = document.getElementById("result-explanation");
    explanationElement.textContent = currentQuestion.explanation;
    
    // Add "Read more" link if source is available
    if (currentQuestion.source) {
        const lineBreak = document.createElement('br');
        explanationElement.appendChild(lineBreak);
        
        const readMoreLink = document.createElement('a');
        readMoreLink.href = currentQuestion.source;
        readMoreLink.target = '_blank';
        readMoreLink.rel = 'noopener';
        readMoreLink.textContent = 'Read more';
        readMoreLink.style.textDecoration = 'underline';
        explanationElement.appendChild(readMoreLink);
    }
    
    document.getElementById('feedback').classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex++;
    updateDisplay();
}

function updateDisplay() {
    if (currentQuestionIndex < questions.length) {
        // Make sure question screen is visible
        document.querySelector(".question").classList.remove('hidden');

        // load next question
        loadQuestion(currentQuestionIndex);
    } else if (currentQuestionIndex === questions.length) {
        document.querySelector(".question").classList.add('hidden');
        document.querySelector(".final").classList.remove('hidden');
        displayFinal();
    }
}

function displayFinal() {
    document.querySelector(".final h2").textContent = `${totalCorrect}/${questions.length}`;
    document.querySelector(".final .results").textContent = resultString;
    let comment = 'Flawless!';
    switch(totalCorrect) {
        case 0:
            comment = 'Better luck next time.'
            break;
        case 1:
            comment = 'Good try.'
            break;
        case 2:
            comment = 'Not bad.'
            break;
        case 3:
            comment = 'Fair effort.'
            break;
        case 4:
            comment = 'Great job!'
            break;
        case 5:
            comment = 'Flawless!'
        break;
    }
    document.querySelector(".final .comment").textContent = comment;
}

function updateProgressIndicator(index) {
    // Update dots
    const dots = document.querySelectorAll('.progress-dots .dot');
    dots.forEach((dot, i) => {
        dot.classList.remove('active', 'correct', 'incorrect', 'clickable');
        
        // Check if this question has been answered
        if (resultString[i] === '✅') {
            dot.classList.add('correct');
        } else if (resultString[i] === '❌') {
            dot.classList.add('incorrect');
        }
        
        // Add active state to current question
        if (i === index) {
            dot.classList.add('active');
        }
        
        // Make dots clickable if they're answered or before current progress
        if (i < resultString.length) {
            dot.classList.add('clickable');
            dot.onclick = () => navigateToQuestion(i);
        } else {
            dot.onclick = null;
        }
    });
}

function navigateToQuestion(questionIndex) {
    // Only allow navigation to questions that have been reached
    if (questionIndex < resultString.length) {
        currentQuestionIndex = questionIndex;
        updateDisplay();
    }
}

function setupSwipeListeners() {
    const questionElement = document.querySelector('.question');
    
    questionElement.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    questionElement.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

function handleSwipe() {
    const swipeThreshold = 50; // Minimum distance for swipe
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) < swipeThreshold) return;
    
    if (diff > 0) {
        // Swipe left - go to next question
        navigateForward();
    } else {
        // Swipe right - go to previous question
        navigateBackward();
    }
}

function navigateForward() {
    // Can only go forward if current question is answered
    if (userAnswers[currentQuestionIndex] !== undefined) {
        // Check if we're not at the last question
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            updateDisplay();
        } else if (currentQuestionIndex === questions.length - 1) {
            // Go to final screen
            currentQuestionIndex++;
            updateDisplay();
        }
    }
}

function navigateBackward() {
    if (currentQuestionIndex > 0) {
        // Don't go back from final screen to questions if quiz is complete
        if (currentQuestionIndex === questions.length && resultString.length === questions.length) {
            currentQuestionIndex--;
        } else if (currentQuestionIndex <= questions.length) {
            currentQuestionIndex--;
        }
        updateDisplay();
    }
}

function getShareable() {
    return `Quizzle ${getFormattedDate()}
${totalCorrect}/${questions.length}

🌍🇦🇺📍⚽🎬
${resultString}`;
}

function shareText() {
    if (navigator.share) {
        navigator.share({
            text: getShareable()
        });
    }
}

function getSaveKey() {
    const dateToUse = quizDate || new Date();
    const month = String(dateToUse.getMonth()+1).padStart(2, '0');
    const day = String(dateToUse.getDate()).padStart(2, '0');
    return `quizzle-${dateToUse.getFullYear()}-${month}-${day}`;
}

function saveProgress() {
    const saveData = {
        resultString: resultString,
        userAnswers: userAnswers
    };
    localStorage.setItem(getSaveKey(), JSON.stringify(saveData));
}

function loadProgress() {
    let saveState = localStorage.getItem(getSaveKey());
    if (!saveState) return;
    
    try {
        // Try to parse as JSON (new format)
        const data = JSON.parse(saveState);
        resultString = data.resultString;
        userAnswers = data.userAnswers || [];
    } catch {
        // Fall back to old format (plain string)
        resultString = saveState;
        userAnswers = [];
    }
    
    currentQuestionIndex = resultString.length;
    totalCorrect = (resultString.match(new RegExp("✅", "g")) || []).length;

    document.querySelector(".splash-screen").classList.add('hidden');
    updateDisplay();
}