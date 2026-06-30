# 🚀 Smart Study Exam Preparation

> An AI-powered exam preparation assistant that helps students study smarter by transforming notes into summaries, quizzes, exam answers, flashcards, and personalized study plans.


## 🌟 Overview

Smart Study Exam Preparation is a full-stack AI-powered learning platform built for students.

The goal of this project is to reduce the time students spend on manual preparation and provide an intelligent assistant that helps them understand, practice, and revise effectively.

Using the power of **Chutes.ai LLM**, Smart Study converts study materials into useful learning resources automatically.

---

## 🎯 Problem Statement

Students often struggle with:

- Reading and revising large notes
- Creating summaries manually
- Finding important exam questions
- Preparing answers according to marks
- Making revision flashcards
- Creating proper study schedules

Smart Study solves this by using AI to generate all these resources instantly.

---

# ✨ Features

## 📚 AI Note Summarizer

Upload your notes and generate:

- Short summaries
- Important points
- Easy-to-understand explanations


## 🧠 AI Quiz Generator

Create quizzes from your study material:

- Multiple Choice Questions
- True / False Questions
- Automatic evaluation
- Score tracking


## 📝 Exam Answer Generator

Generate exam-ready answers:

- 5 marks answers
- 10 marks answers
- Structured explanations


## 🔥 AI Flashcards

Create revision flashcards:

- Question-answer format
- Quick revision
- Better memory retention


## 📅 Smart Study Planner

Generate personalized study plans:

- Select subject
- Set exam timeline
- Get daily preparation tasks


## 📜 History Management

Manage your learning history:

- View previous generations
- Delete history
- Track activities


## 🎨 User Experience

Includes:

- Clean dashboard
- Responsive design
- Theme switching
- Simple navigation

---

# 🛠️ Tech Stack

## Frontend

- Next.js
- React.js
- TypeScript
- Tailwind CSS
- Shadcn UI


## Backend

- Next.js API Routes


## AI

- Chutes.ai LLM API


## Database

- Neon DB
- Prisma ORM


## Deployment

- Vercel


---

# 🏗️ System Architecture


User
|
|
Next.js Frontend
|
|
API Routes
|
|
Chutes.ai LLM API
|
|
AI Generated Content
|
|
Neon Database
|
|
User Dashboard


---

# 🔄 Application Flow

Login
|
Dashboard
|
Upload Notes
|
AI Processing
|
Choose Feature
|
| | | |
Summary Quiz Answers Flashcards
| | | |
      |
  Study Plan
      |
   History

---

# 📂 Project Structure


smart-study/

├── app/
│ ├── api/
│ ├── dashboard/
│ ├── summary/
│ ├── quiz/
│ ├── flashcard/
│ └── study-plan/
│
├── components/
│
├── prisma/
│
├── public/
│
├── lib/
│
├── package.json
│
└── README.md


---

# ⚙️ Installation

Clone repository:

```bash
git clone YOUR_GITHUB_URL

Go inside project:

cd smart-study

Install dependencies:

npm install
🔐 Environment Variables

Create .env file:

DATABASE_URL=your_neon_database_url

CHUTES_API_KEY=your_chutes_api_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
▶️ Run Locally

Start development server:

npm run dev

Open:

http://localhost:3000
🚀 Deployment

Build project:

npm run build

Start production:

npm start

Deploy easily using:

Vercel
Neon Database
🧪 Demo Flow
Login with name and age
Upload study notes
Generate AI summary
Create quizzes
Check score
Generate exam answers
Create flashcards
Generate study plan
Manage history
🔮 Future Improvements
AI voice tutor
AI doubt solving chatbot
Mobile application
Learning analytics dashboard
Multi-language support
AI personalized recommendations
🏆 Hackathon

Built for:

Chutes Hack Malaysia 2026

Powered by:

Chutes.ai LLM

👨‍💻 Author
Vishal kumar

⭐ Support

If you like this project, give it a star ⭐
