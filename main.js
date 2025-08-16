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
    // set the answers
    question.answers.forEach((answer, index) => {
        const answerElement = questionElement.querySelector(`#answer-${index + 1}`);
        answerElement.textContent = answer.text;
        answerElement.onclick = () => checkAnswer(index);
        // Reset any previous styling
        answerElement.classList.remove('correct', 'incorrect');
        answerElement.disabled = false;
    });
    // Hide feedback initially
    document.getElementById('feedback').classList.add('hidden');
}

function checkAnswer(answerIndex) {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;

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
    document.getElementById("result-explanation").textContent = currentQuestion.explanation;
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
    localStorage.setItem(getSaveKey(), resultString);
}

function loadProgress() {
    let saveState = localStorage.getItem(getSaveKey());
    if (!saveState) return;
    resultString = saveState;
    currentQuestionIndex = resultString.length;
    totalCorrect = (resultString.match(new RegExp("✅", "g")) || []).length;

    document.querySelector(".splash-screen").classList.add('hidden');
    updateDisplay();
}