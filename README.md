# Code Iterator AI Tool

A lightweight AI assistant that helps game developers and programmers improve, modify, and integrate changes into their code.

## Features

- Select code in the Monaco Editor
- Provide instructions for changes
- Review AI-generated suggestions
- Visualize diff between original and modified code
- Integrate changes directly into the editor

## Tech Stack

- **Frontend**: Next.js with TypeScript
- **Editor**: Monaco Editor
- **Styling**: Tailwind CSS
- **Backend**: FastAPI (Python)
- **Model**: Groq API (llama-3.1-8b-instant) with Ollama as fallback
- **Communication**: REST API

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- Groq API key (recommended)
- [Ollama](https://ollama.ai/) (optional fallback)

### Setup

#### 1. API Configuration

You have two options for the AI model:

**Option A: Groq API (Recommended)**
1. Sign up at [Groq Console](https://console.groq.com/) to get your API key
2. Add your API key to the `.env` file in the backend directory
3. **Security Note:** Never commit your API key to version control - the `.env` file is included in `.gitignore` by default
4. For production deployments, consider using a secure secrets management system

**Option B: Ollama (Fallback)**
1. Install Ollama from [ollama.ai](https://ollama.ai/)
2. Pull the required models:
```bash
ollama pull deepseek-coder:6.7B
ollama pull codellama:latest
ollama pull deepseek-r:latest
```
3. Ensure Ollama is running (it usually starts automatically after installation)

#### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: http://localhost:3000

#### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate the virtual environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file with your Groq API key
echo "GROQ_API_KEY=your_groq_api_key_here" > .env
echo "USE_GROQ_DEFAULT=True" >> .env

# Start FastAPI server
uvicorn app:app --reload
```

The backend API will be available at: http://localhost:8000

## Usage

1. Enter or paste code into the editor
2. Write an instruction describing what changes you want
3. Click "Submit to AI"
4. Review the suggested changes in the diff view
5. Click "Integrate Code" to apply the changes

## Project Structure

- `/components` - React components including Monaco Editor integration
- `/app` - Next.js application code
- `/backend` - FastAPI server for communicating with AI models

## Troubleshooting

- If you encounter CORS issues, ensure both frontend and backend are running
- If using Ollama and the AI model is not responding, check that Ollama is running with `ollama list`
- For connection issues with the backend, ensure the FastAPI server is running on port 8000
- If you get errors with the Groq API, verify your API key is correctly set in the `.env` file

## Future Improvements

- Multi-language support
- Streaming responses
- Inline suggestions
- Authentication
- History of iterations
- Version control integration 