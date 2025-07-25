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

// on document ready
document.addEventListener("DOMContentLoaded", async function() {
    // Load questions from JSON file
    try {
        const response = await fetch('questions.json');
        questions = (await response.json()).questions;
    } catch (error) {
        console.error('Failed to load questions:', error);
    }

    loadProgress();

    updateSubtitle();
    document.getElementById("start-button").addEventListener("click", startQuiz);
    document.querySelector(".next").addEventListener("click", nextQuestion);
    document.getElementById("share-button").addEventListener("click", shareText);
    document.getElementById("copy-button").addEventListener("click", copyText);
});

function updateSubtitle() {
    // get the subtitle element
    const subtitle = document.getElementById("subtitle");
    // get the current date
    subtitle.textContent = 'Daily news quiz for ' + getFormattedDate();
}

function getFormattedDate() {
    const currentDate = new Date();
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
    const today = new Date();
    const month = String(today.getMonth()+1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `quizzle-${today.getFullYear()}-${month}-${day}`;
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