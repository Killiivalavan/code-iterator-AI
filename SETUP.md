# Setup Guide for Code Iterator AI

This document provides detailed setup instructions for the Code Iterator AI tool.

## Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- Groq API key (recommended) or Ollama (fallback option)

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd code-iterator-ai
```

## Step 2: Backend Setup

### Setup Python Environment

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Configure AI Provider

You have two options:

#### Option A: Groq API (Recommended)

1. Sign up at [Groq Console](https://console.groq.com/) to get your API key
2. Create a `.env` file in the backend directory:

```bash
# Create .env file
echo "GROQ_API_KEY=your_groq_api_key_here" > .env
echo "GROQ_MODEL=llama-3.1-8b-instant" >> .env
echo "USE_GROQ_DEFAULT=True" >> .env
```

##### API Key Security

For proper security of your Groq API key:

- Never commit the `.env` file to version control
- Ensure `.env` is in your `.gitignore` file
- Never share your API key or include it in code comments or documentation
- For development, use environment variables
- For production:
  - Use a proper secrets management solution (e.g., AWS Secrets Manager, HashiCorp Vault)
  - Use environment variables set at the infrastructure level
  - Consider using a service like GitHub Actions Secrets for CI/CD pipelines

The Groq API offers superior performance and code generation quality compared to local models.

#### Option B: Ollama (Fallback Option)

If you prefer to use local models or want a fallback option:

1. Install [Ollama](https://ollama.ai/) for your platform
2. Pull the required models:

```bash
ollama pull deepseek-coder:6.7B
ollama pull codellama:latest
ollama pull deepseek-r:latest
```

3. Make sure Ollama is running in the background

4. If you want to use Ollama as the default, update your `.env` file:

```
USE_GROQ_DEFAULT=False
OLLAMA_API_URL=http://localhost:11434
```

### Start the Backend Server

```bash
# Make sure you're in the backend directory with venv activated
uvicorn app:app --reload
```

The backend API will be available at: http://localhost:8000

## Step 3: Frontend Setup

```bash
# From the project root
npm install
npm run dev
```

The frontend will be available at: http://localhost:3000

## Step 4: Usage

1. Open your browser and navigate to http://localhost:3000
2. Enter or paste code into the editor
3. Write instructions for how you want the code to be modified
4. Use the Groq/Ollama toggle to select your preferred AI provider
5. Click "Submit to AI" to process your request
6. Review the changes and explanation
7. Click "Integrate Code" to apply the changes to your code

## Troubleshooting

### API Connection Issues

- **Groq API issues**: Verify your API key is correct in the `.env` file. Check Groq console for any rate limiting or account issues.
- **Ollama issues**: Ensure Ollama is running with `ollama list`. Check if the models are properly installed.

### CORS Errors

- Make sure both frontend and backend are running
- Check that the backend is running on port 8000

### Slow Responses

- Groq API should be quite fast
- Ollama performance depends on your local hardware resources

## Advanced Configuration

### Environment Variables

The backend supports several environment variables you can set in `.env`:

- `GROQ_API_KEY`: Your Groq API key
- `GROQ_MODEL`: Model to use with Groq (default: llama-3.1-8b-instant)
- `USE_GROQ_DEFAULT`: Whether to use Groq (True) or Ollama (False) by default
- `OLLAMA_API_URL`: URL for Ollama API (default: http://localhost:11434)
- `OLLAMA_MODELS`: Comma-separated list of models to try with Ollama 