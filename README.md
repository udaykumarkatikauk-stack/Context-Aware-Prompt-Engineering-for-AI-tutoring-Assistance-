# Context-Aware Prompt Engineering for AI Tutoring Assistance

An AI-powered tutoring platform designed to provide personalized learning experiences through context-aware responses, retrieval-augmented generation (RAG), interactive quizzes, and voice-based assistance.

## Overview

The project aims to make learning more personalized by helping students understand concepts, clear doubts, explore engineering project ideas, and access learning resources through an AI tutor.

The platform combines a web application, backend services, database storage, and AI integrations to deliver learning assistance based on user interactions and available educational materials.

## Features

- **AI Tutoring:** Get explanations and assistance for technical topics.
- **Context-Aware Responses:** Use relevant learning context to improve AI-generated answers.
- **Retrieval-Augmented Generation (RAG):** Process educational documents and store searchable knowledge with vector embeddings.
- **Voice-Based Tutoring:** Interact with an AI tutor through a phone-call interface.
- **Doubt Clearance:** Receive concise answers to technical questions.
- **Project Suggestions:** Explore engineering project ideas based on a selected domain.
- **Learning Resources:** Organize educational content for student learning.
- **MongoDB Integration:** Store application data, learning records, and contextual information.

## Technology Stack

### Frontend
- React.js
- JavaScript
- HTML and CSS

### Backend
- Node.js
- Express.js
- REST APIs

### AI and Machine Learning
- Groq API
- Large Language Models (LLMs)
- Retrieval-Augmented Generation (RAG)
- Sentence Transformers
- `all-MiniLM-L6-v2` embeddings
- LangChain text splitters

### Database and Storage
- MongoDB
- MongoDB Atlas
- Vector embeddings

### Voice Assistant
- Python
- FastAPI
- Twilio
- Ngrok
- Motor (asynchronous MongoDB driver)

## Project Structure

```text
PE_Work/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── backend/
│   ├── models/
│   ├── Coursers/
│   ├── server.js
│   ├── db.js
│   ├── seedCourses.js
│   ├── voice_agent.py
│   ├── package.json
│   └── package-lock.json
├── my_engineering_docs/
├── train_rag.py
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the project:

- Node.js and npm
- Python 3
- MongoDB Atlas account or an accessible MongoDB instance
- Groq API key
- Twilio account for voice-based features
- Ngrok account for exposing the voice-agent server to Twilio

## Installation and Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a local `backend/.env` file and configure the environment variables required by `server.js`, including your MongoDB connection string and Groq API key.

Example:

```dotenv
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
```

Add any additional variables required by your backend configuration. Never commit real credentials.

Start the backend using the command configured in `backend/package.json`, commonly:

```bash
npm start
```

### 3. Set up the frontend

Open another terminal:

```bash
cd frontend
npm install
npm start
```

The React development server typically runs at:

`http://localhost:3000`

### 4. Configure the Python voice agent

Install the Python dependencies used by `backend/voice_agent.py`, including FastAPI, Uvicorn, Groq, Twilio, Motor, Pydantic, and Python dotenv.

Create a local `backend/.env` containing the required voice-agent variables:

```dotenv
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=your_available_groq_model
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_US_NUMBER=your_twilio_phone_number
MONGO_URI=your_mongodb_connection_string
NGROK_URL=your_ngrok_public_url
```

Run the voice agent from the `backend` directory:

```bash
python voice_agent.py
```

The FastAPI server is configured to use port `8000`. Configure Ngrok to expose that port and use the current public URL in your local environment configuration.

### 5. Prepare the educational knowledge base

Configure the `DATA_FOLDER` in `train_rag.py` to point to your educational documents. Set `MONGO_URI` and `GROQ_API_KEY` as environment variables.

Install the dependencies required by the training script, including:

- `pymongo`
- `python-dotenv`
- `Pillow`
- `pytesseract`
- `pypdf`
- `python-docx`
- `python-pptx`
- `sentence-transformers`
- `langchain-text-splitters`
- `groq`

For image-based documents, install the Tesseract OCR application separately.

Run the training script:

```bash
python train_rag.py
```

The script extracts text from supported documents, splits it into chunks, generates embeddings, analyzes chunks using the AI model, and stores the resulting records in MongoDB.

## Environment Variables and Security

- Keep API keys, database credentials, and authentication tokens in local `.env` files.
- Ensure `.env` files are excluded through `.gitignore`.
- Never hardcode secrets in Python or JavaScript source files.
- Rotate any credentials that have been exposed.
- Use environment-variable placeholders in documentation rather than real credentials.

## Usage

1. Start the backend server.
2. Start the React frontend.
3. Configure MongoDB and the required AI API credentials.
4. Access the web application in your browser.
5. Use the AI tutor to learn technical concepts and clear doubts.
6. Start the voice agent separately if voice-based assistance is enabled.
7. Run the RAG training script to prepare the educational knowledge base.

## Future Enhancements

- Improved personalization using learner profiles and interaction history.
- More comprehensive learning analytics.
- Enhanced quiz generation and performance tracking.
- Expanded multilingual voice tutoring.
- Improved retrieval accuracy and knowledge-base evaluation.
- Deployment to a cloud hosting platform.

## License

No license has been specified yet. Add a license before distributing or reusing the project publicly.
