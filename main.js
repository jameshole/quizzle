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
    // Load questions from date-based JSON file
    await loadQuizForDate();

    loadProgress();

    updateSubtitle();
    document.getElementById("start-button").addEventListener("click", startQuiz);
    document.querySelector(".next").addEventListener("click", nextQuestion);
    document.getElementById("share-button").addEventListener("click", shareText);
    document.getElementById("copy-button").addEventListener("click", copyText);
});

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
    });
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

    // hide question, show result
    document.querySelector(".question").classList.add('hidden');
    document.querySelector(".result").classList.remove('hidden');

    // set result text
    document.getElementById("result-text").textContent = isCorrect ? "✅ Correct" : "❌ Incorrect";
    document.getElementById("result-text").classList.add(isCorrect ? 'correct' : 'incorrect');
    document.getElementById("result-text").classList.remove(isCorrect ? 'incorrect' : 'correct');

    // set explanation text
    document.getElementById("result-explanation").textContent = currentQuestion.explanation;
}

function nextQuestion() {
    currentQuestionIndex++;
    updateDisplay();
}

function updateDisplay() {
    if (currentQuestionIndex < questions.length) {
        // hide result, show question
        document.querySelector(".result").classList.add('hidden');
        document.querySelector(".question").classList.remove('hidden');

        // load next question
        loadQuestion(currentQuestionIndex);
    } else if (currentQuestionIndex === questions.length) {
        document.querySelector(".result").classList.add('hidden');
        document.querySelector(".final").classList.remove('hidden');
        setShareable();
    }
}

function setShareable() {
    const shareable = `Quizzle ${getFormattedDate()}
${totalCorrect}/${questions.length}

🌍🇦🇺📍⚽🎬
${resultString}
`;
    document.querySelector("#shareable").textContent = shareable;
}

function shareText() {
    const shareableText = document.querySelector("#shareable").textContent;
    if (navigator.share) {
        navigator.share({
            text: shareableText
        });
    }
}

function copyText() {
    const shareableText = document.querySelector("#shareable").textContent;
    navigator.clipboard.writeText(shareableText);
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