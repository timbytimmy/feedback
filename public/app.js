// Global variables
let currentUser = null;
let surveys = [];
let currentSurvey = null;

// DOM Elements
const loginForm = document.getElementById('login-form');
const surveysContainer = document.getElementById('surveys-container');
const surveyForm = document.getElementById('survey-form');
const adminDashboard = document.getElementById('admin-dashboard');
const createSurveyBtn = document.getElementById('create-survey-btn');
const createSurveyForm = document.getElementById('create-survey-form');
const newSurveyForm = document.getElementById('new-survey-form');
const addQuestionBtn = document.getElementById('add-question-btn');
const questionsList = document.getElementById('questions-list');
const feedbackForm = document.getElementById('feedback-form');
const feedbackSuccess = document.getElementById('feedback-success');
const loginError = document.getElementById('login-error');
const adminLoginSection = document.getElementById('admin-login-section');
const feedbackTableBody = document.querySelector('#feedback-table tbody');
const logoutBtn = document.getElementById('logout-btn');
const feedbackFormSection = document.getElementById('feedback-form-section');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadSurveys();
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackSuccess = document.getElementById('feedback-success');

    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const feedback = document.getElementById('feedback').value.trim();
            if (!name || !email || !feedback) return;
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, feedback })
            });
            if (res.ok) {
                feedbackForm.reset();
                feedbackSuccess.style.display = 'block';
                setTimeout(() => feedbackSuccess.style.display = 'none', 3000);
            }
        });
    }
});

// Functions
async function loadSurveys() {
    try {
        const response = await fetch('/api/surveys');
        surveys = await response.json();
        displaySurveys();
    } catch (error) {
        console.error('Error loading surveys:', error);
    }
}

function displaySurveys() {
    surveysContainer.innerHTML = '';
    surveys.forEach(survey => {
        const surveyCard = document.createElement('div');
        surveyCard.className = 'survey-card';
        surveyCard.innerHTML = `
            <h3>${survey.title}</h3>
            <p>${survey.description}</p>
        `;
        surveyCard.addEventListener('click', () => loadSurvey(survey.survey_id));
        surveysContainer.appendChild(surveyCard);
    });
}

async function loadSurvey(surveyId) {
    try {
        const response = await fetch(`/api/surveys/${surveyId}/questions`);
        const questions = await response.json();
        
        currentSurvey = { id: surveyId, questions };
        const survey = surveys.find(s => s.survey_id === surveyId);
        
        document.getElementById('survey-title').textContent = survey.title;
        document.getElementById('survey-description').textContent = survey.description;
        
        const questionsContainer = document.getElementById('questions-container');
        questionsContainer.innerHTML = '';
        
        questions.forEach(question => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-container';
            questionDiv.innerHTML = `
                <label for="question-${question.question_id}">${question.question_text}</label>
                <input type="text" id="question-${question.question_id}" name="question-${question.question_id}" required>
            `;
            questionsContainer.appendChild(questionDiv);
        });
        
        surveyForm.style.display = 'block';
        document.getElementById('surveys-list').style.display = 'none';
    } catch (error) {
        console.error('Error loading survey:', error);
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            currentUser = data.admin;
            localStorage.setItem('adminToken', data.token);
            document.getElementById('admin-login').style.display = 'none';
            adminDashboard.style.display = 'block';
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Error logging in');
    }
}

function addQuestionBuilder() {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-builder';
    questionDiv.innerHTML = `
        <input type="text" placeholder="Question text" required>
        <select>
            <option value="text">Text</option>
            <option value="radio">Multiple Choice</option>
            <option value="checkbox">Checkbox</option>
        </select>
        <button type="button" class="remove-question" onclick="this.parentElement.remove()">Remove</button>
    `;
    questionsList.appendChild(questionDiv);
}

async function handleCreateSurvey(e) {
    e.preventDefault();
    
    const title = document.getElementById('survey-title-input').value;
    const description = document.getElementById('survey-description-input').value;
    
    const questions = Array.from(questionsList.children).map(div => {
        const inputs = div.querySelectorAll('input, select');
        return {
            text: inputs[0].value,
            type: inputs[1].value
        };
    });
    
    try {
        const response = await fetch('/api/surveys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                title,
                description,
                questions,
                created_by_admin_id: currentUser.id
            })
        });
        
        if (response.ok) {
            alert('Survey created successfully');
            createSurveyForm.style.display = 'none';
            newSurveyForm.reset();
            questionsList.innerHTML = '';
            loadSurveys();
        } else {
            const data = await response.json();
            alert(data.error);
        }
    } catch (error) {
        console.error('Error creating survey:', error);
        alert('Error creating survey');
    }
}

// Handle survey submission
document.getElementById('feedback-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const answers = currentSurvey.questions.map(question => ({
        question_id: question.question_id,
        answer_text: document.getElementById(`question-${question.question_id}`).value
    }));
    
    try {
        const response = await fetch('/api/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: 1, // This should be replaced with actual user ID
                survey_id: currentSurvey.id,
                answers
            })
        });
        
        if (response.ok) {
            alert('Thank you for your feedback!');
            surveyForm.style.display = 'none';
            document.getElementById('surveys-list').style.display = 'block';
        } else {
            const data = await response.json();
            alert(data.error);
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Error submitting feedback');
    }
}); 