# CareerPilot-AI
Final Year Software Development Project

## Overview

CareerPilot-AI is an AI-powered web application developed for my Final Year Software Development Project.

The system helps students and graduates get prepared for jobs by uploading their cv, it allows the user to register an account then login into the account they created, so the user can upload their cv and enter their job description. it then identify their skills, discover their missing skills, it then do the job comparison and give the user alternative career recommendations, and also learning roadmaps, and integrates Google Gemini AI to generate interveiew questions and can also generate cover letters.


CareerPilot-AI combines CV analysis, ESCO occupational and skills data, and Google Gemini AI to provide personalised career guidance based on the user's information.

## Technologies Used

- Python with FastAPI - Backend development
- React - Frontend user interface
- Vite - Frontend development and build tool
- JavaScript / JSX - Frontend functionality
- CSS - User interface styling
- ESCO Dataset - Occupation and skills matching
- Google Gemini API - AI-generated career guidance


## Features

- User registration and login
- CV upload with description and then analysis
- Skills identification from CV information
- ESCO-based occupation and skills matching
- Matched and missing skills analysis
- Job comparison
- Alternative Career recommendations
- Learning roadmap based on the uploaded cv
- AI-generated interview practice questions
- AI-generated cover letters
- User dashboard
- Protected application routes

## What was Installed
Before running the application, this are what needed to be installed:

- Python 3
- Node.js
- npm
- Git

A Google Gemini API key is also required for the AI features.

## Setup Requirements

### 1. Clone the repository

```bash
git clone https://github.com/Toluwani9-ai/CareerPilot-AI.git
cd CareerPilot-AI
```

### 2. Set up the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file inside the backend directory and add the required environment variables, including the Gemini API key.

API keys and other private credentials should never be uploaded to GitHub.

### 4. Set up the frontend

Open another terminal:

```bash
cd CareerPilot-AI/frontend
npm install
```

## How to Run

### Start the backend

From the backend directory, activate the virtual environment and start the backend application.

```bash
cd backend
source venv/bin/activate
```

Then run the backend using the command configured for the project.

### Start the frontend

Open a second terminal:

```bash
cd frontend
npm run dev
```

Open the local address displayed by Vite in your browser.

## How CareerPilot-AI Works

1. The user registers or login into the application.
2. The user uploads their CV and then enters their job description.
3. CareerPilot-AI processes the CV and identifies the matched skills and missiing skills. relevant skills.
4. The skills are compared with ESCO occupation and skills data.
5. The system identifies matched skills and possible skill gaps.
6. Career recommendations are produced from the analysis.
7. learning roadmaps with the missing skills that the user needed to study in other to get the Job
8. Gemini AI provide ten interveiew questions and also it generate cover letter for the user.

## ESCO Skills Data

CareerPilot-AI uses ESCO occupational and skills data to support career and matching skills. The application uses information about occupations, skills and the relationships between occupations and skills to compare a user's profile with career requirements.

## AI Career Guidance

Gemini AI uses Important rules to use the information supplied by the user and the results produced by CareerPilot-AI.
It allows features such as interview preparation and cover letter guidance.

## Notes

- The backend and frontend must both be running for the application to work.
- A valid Gemini API key is required for AI functionality.

