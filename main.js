const categoryIconMap = {
    "Global": '🌍',
    "National": '🇦🇺',
    "Local": '📍',
    "Sports": '⚽',
    "Entertainment": '🎬',
};

const questions = [
    {
        question: "Which international court is expected to rule on whether countries have a duty to prevent climate harm?",
        category: "Global",
        answers: [
            { text: "The International Criminal Court" },
            { text: "The International Court of Justice" },
            { text: "The International Tribunal for the Law of the Sea" },
            { text: "The African Court on Human and Peoples' Rights" },
        ],
        explanation: "The ICJ is set to issue a landmark ruling on whether countries are legally obligated to prevent climate-related harm. Big move for climate accountability!",
        correctAnswer: 1,
    },
    {
        question: "Following the opening of the 48th Australian Parliament on 22 July 2025, which among these statements is correct?",
        category: "National",
        answers: [
            { text: "Pauline Hanson became Senate President" },
            { text: "Ali France unseated Peter Dutton in Dickson" },
            { text: "Federal student debt forgiveness was rejected" },
            { text: "The Greens staged no protests" },
        ],
        explanation: "Ali France won Dickson, unseating Opposition Leader Peter Dutton—a stunning federal upset.",
        correctAnswer: 1,
    },
    {
        question: "The Victorian government recently refuted a report claiming a child in which scandal tested positive for an STD?",
        category: "Local",
        answers: [
            { text: "A public school star scandal" },
            { text: "A Point Cook childcare abuse case" },
            { text: "Victoria Police recruitment scandal" },
            { text: "Melbourne train crash incident" },
        ],
        explanation: "The Victorian government rejected claims that a child in the Point Cook abuse case tested positive for an STD, calling it “highly irresponsible.”",
        correctAnswer: 1,
    },
    {
        question: "When and where is the Second Test between the British & Irish Lions and Australia scheduled?",
        category: "Sports",
        answers: [
            { text: "July 24 at Suncorp Stadium, Brisbane" },
            { text: "July 26 at the MCG, Melbourne" },
            { text: "August 2 at ANZ Stadium, Sydney" },
            { text: "July 26 at Eden Park, Auckland" },
        ],
        explanation: "The second Test between the British & Irish Lions and Australia is happening at the MCG on July 26. Huge turnout expected.",
        correctAnswer: 1,
    },
    {
        question: "What is notable about Ed Sheeran’s ticket pricing for his 2026 Australian tour?",
        category: "Entertainment",
        answers: [
            { text: "They’re the most expensive concert tickets ever in Australia" },
            { text: "He’s charging between $109.90 and $249.90 to keep prices accessible" },
            { text: "Only VIP packages are being sold" },
            { text: "Tickets will only be available via charity auction" },
        ],
        explanation: "Ed Sheeran is keeping ticket prices relatively affordable for his 2026 Aussie tour—fans love him for it.",
        correctAnswer: 1,
    },
];

let currentQuestionIndex = 0;
let totalCorrect = 0;
let resultString = "";

// on document ready
document.addEventListener("DOMContentLoaded", function() {
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
    
    // hide question, show result
    document.querySelector(".question").classList.add('hidden');
    document.querySelector(".result").classList.remove('hidden');
    
    // set result text
    document.getElementById("result-text").textContent = isCorrect ? "Correct" : "Incorrect";
    
    // set explanation text
    document.getElementById("result-explanation").textContent = currentQuestion.explanation;
}

function nextQuestion() {
    currentQuestionIndex++;
    
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