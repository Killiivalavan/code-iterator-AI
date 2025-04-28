# Code Iterator AI Backend

This is the FastAPI backend for the Code Iterator AI tool, which communicates with Groq API (default) or Ollama (fallback) to provide code modifications and improvements.

## Setup

1. Create a virtual environment (recommended):
```bash
python -m venv venv
```

2. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file based on `.env.example`:
```
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant

# Ollama Configuration (Fallback)
OLLAMA_API_URL=http://localhost:11434

# Default Configuration
USE_GROQ_DEFAULT=True  # Set to "True" to use Groq by default, "False" to use Ollama
```

## Running the Server

Start the FastAPI server:
```bash
uvicorn app:app --reload
```

The API will be available at: http://localhost:8000

## API Documentation

Once the server is running, you can access the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Using with Groq API (Default)

The application is configured to use Groq API by default for better performance and quality. To use it:

1. Sign up at [Groq Console](https://console.groq.com/) to get your API key
2. Add your API key to the `.env` file in the backend directory
3. **Important**: Never commit your `.env` file to version control or include your API key in the code
4. Run the application normally

### API Key Security

To protect your Groq API key:
- Store it only in the `.env` file or environment variables
- Add `.env` to your `.gitignore` file to prevent accidental commits
- For production deployments, use a secure secrets management solution
- Never hardcode the API key in your source code

## Using with Ollama (Fallback)

If Groq API is unavailable or you prefer using local models, the application will fall back to Ollama:

1. [Install Ollama](https://ollama.ai/)
2. Pull the models:
```bash
ollama pull deepseek-coder:6.7B
ollama pull codellama:latest
ollama pull deepseek-r:latest
```
3. Make sure Ollama is running in the background
4. Optionally set `USE_GROQ_DEFAULT=False` in your `.env` file to always use Ollama

## Environment Variables

- `GROQ_API_KEY`: Your Groq API key
- `GROQ_MODEL`: Groq model to use (default: llama-3.1-8b-instant)
- `USE_GROQ_DEFAULT`: Whether to use Groq API by default (default: True)
- `OLLAMA_API_URL`: URL for the Ollama API (default: http://localhost:11434)
- `OLLAMA_MODELS`: Models to try in order of preference 