import requests
import sys

# Ollama API URL
OLLAMA_API_URL = "http://localhost:11434"
# Try both models
MODELS = ["codellama:latest", "deepseek-r:latest"]

def test_ollama_connection(model_name=None):
    """
    Test if we can connect to Ollama and use the specified model
    """
    if model_name:
        models_to_try = [model_name]
    else:
        models_to_try = MODELS
    
    print(f"Testing connection to Ollama API at {OLLAMA_API_URL}")
    
    try:
        # First, let's check if the Ollama server is reachable
        response = requests.get(f"{OLLAMA_API_URL}")
        print(f"Server response status: {response.status_code}")
        
        # Now let's try to list available models
        response = requests.get(f"{OLLAMA_API_URL}/api/tags")
        if response.status_code == 200:
            available_models = response.json()
            print("Available models:")
            print(available_models)
        else:
            print(f"Failed to get models list: {response.status_code}")
            return False
        
        # Try each model until one works
        for model in models_to_try:
            print(f"\nTrying model: {model}")
            try:
                # Try to generate a simple response
                response = requests.post(
                    f"{OLLAMA_API_URL}/api/generate",
                    json={
                        "model": model,
                        "prompt": "Hello, are you working properly?",
                        "stream": False,
                    },
                    timeout=30,
                )
                
                response.raise_for_status()
                data = response.json()
                print("Model response:")
                print(data.get("response", "No response received"))
                
                print(f"\nSuccess with model: {model}")
                print(f"You should update your backend/app.py to use this model: MODEL_NAME = \"{model}\"")
                return True
                
            except requests.exceptions.HTTPError as e:
                print(f"HTTP Error with model {model}: {e}")
                if "404" in str(e):
                    print(f"The model '{model}' might not be available or correctly spelled.")
                continue
        
        print("\nNone of the models worked.")
        return False
        
    except requests.exceptions.ConnectionError as e:
        print(f"Connection Error: {e}")
        print("The Ollama service may not be running or is not accessible at the specified URL.")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    model = sys.argv[1] if len(sys.argv) > 1 else None
    test_ollama_connection(model) 