import requests
import sys
import json

# Backend API URL
API_URL = "http://localhost:8000"

def test_api_connection():
    """Test connection to the FastAPI backend"""
    print(f"Testing connection to API at {API_URL}")
    
    try:
        response = requests.get(f"{API_URL}/")
        print(f"API root response status: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"Error connecting to API: {e}")
        return False

def test_code_iteration(language="python"):
    """Test the code iteration endpoint with a simple example"""
    print(f"\nTesting code iteration with {language} code")
    
    # Simple test code based on language
    if language == "python":
        code = """
def greet(name):
    print("Hello " + name)
"""
        instruction = "Add docstring and input validation"
    else:
        code = """
function greet(name) {
    console.log("Hello " + name);
}
"""
        instruction = "Add JSDoc and input validation"
    
    payload = {
        "code": code,
        "instruction": instruction,
        "language": language
    }
    
    print(f"Sending payload:\n{json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            f"{API_URL}/iterate-code",
            json=payload,
            timeout=120  # Extended timeout
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\nExplanation:")
            print(data["explanation"])
            print("\nModified code:")
            print(data["modified_code"])
            return True
        else:
            print(f"Error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error calling API: {e}")
        return False

if __name__ == "__main__":
    language = sys.argv[1] if len(sys.argv) > 1 else "python"
    
    if test_api_connection():
        print("API connection successful!")
        test_code_iteration(language)
    else:
        print("Failed to connect to API. Make sure the FastAPI server is running.") 