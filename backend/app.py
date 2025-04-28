from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import requests
import os
import json
import traceback
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Code Iterator AI API",
    description="API for Code Iterator AI tool that helps modify and improve code",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ollama API URL - Default is localhost:11434
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
# Models to try (in order of preference)
OLLAMA_MODELS = ["deepseek-coder:6.7B", "codellama:latest", "deepseek-r:latest"]

# Groq API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
# Default Groq model to use
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
# Whether to use Groq API as default (True) or Ollama (False)
USE_GROQ_DEFAULT = os.getenv("USE_GROQ_DEFAULT", "True").lower() in ["true", "1", "yes"]

class SelectionInfo(BaseModel):
    start_line: int
    end_line: int

class CodeRequest(BaseModel):
    code: str
    instruction: str
    language: str = "javascript"  # Default to JavaScript if not specified
    selection: Optional[SelectionInfo] = None
    full_context: Optional[str] = None  # The full code when a selection is provided
    use_groq: Optional[bool] = None  # Optional override for using Groq API

class CodeResponse(BaseModel):
    modified_code: str
    explanation: str

class ChatMessage(BaseModel):
    role: str
    content: str

@app.get("/")
def read_root():
    return {"message": "Code Iterator AI API is running"}

def try_generate_with_model(model, prompt):
    """Try to generate a response with the specified Ollama model"""
    print(f"Trying to generate with Ollama model: {model}")
    print(f"API URL: {OLLAMA_API_URL}")
    
    # Request payload
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
    }
    
    print(f"Sending payload: {json.dumps(payload)[:200]}...")
    
    # Set extended timeout to allow model to process
    response = requests.post(
        f"{OLLAMA_API_URL}/api/generate",
        json=payload,
        timeout=120,  # Increased timeout
    )
    
    print(f"Response status code: {response.status_code}")
    
    # Force raise for status code
    response.raise_for_status()
    
    # Parse JSON response
    data = response.json()
    print(f"Received response of length: {len(json.dumps(data))}")
    return data

def try_generate_with_groq(prompt, model=GROQ_MODEL):
    """Generate a response using the Groq API"""
    print(f"Generating with Groq model: {model}")
    
    # Verify API key is available
    if not GROQ_API_KEY:
        raise ValueError("Groq API key not found in environment variables")
    
    # Format prompt into messages for chat completions API
    messages = [
        {"role": "system", "content": "You are a professional coding assistant that helps improve and modify code according to user instructions. ALWAYS return the modified code in a code block using triple backticks (```). Make sure the code you provide is complete and can be run directly. Use this format for your response: provide a brief explanation first, then include the complete modified code in a code block."},
        {"role": "user", "content": prompt}
    ]
    
    # Request payload
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.3,  # Lower temperature for more deterministic code generation
        "max_completion_tokens": 4096,
    }
    
    print(f"Sending Groq API request...")
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Make the API request
    response = requests.post(
        GROQ_API_URL,
        headers=headers,
        json=payload,
        timeout=120  # Extended timeout
    )
    
    print(f"Groq API response status code: {response.status_code}")
    
    # Raise for HTTP errors
    response.raise_for_status()
    
    # Parse the response
    data = response.json()
    
    # Extract the assistant's message content
    if data.get("choices") and len(data["choices"]) > 0:
        ai_response = data["choices"][0]["message"]["content"]
        return {"response": ai_response}
    else:
        raise ValueError("Unexpected response format from Groq API")

def extract_code_and_explanation(ai_response, language, original_code):
    """
    Extract code and explanation from the AI response using multiple strategies
    """
    # Save original response for debugging
    full_response = ai_response
    
    # Add detailed debugging of the raw response
    print("==== RAW AI RESPONSE START ====")
    print(ai_response[:1000] + ("..." if len(ai_response) > 1000 else ""))
    print("==== RAW AI RESPONSE END ====")
    
    try:
        print("Attempting to parse AI response...")
        
        # Strategy 1: Look for standard format with EXPLANATION: and MODIFIED CODE: keywords
        explanation_start = ai_response.find("EXPLANATION:")
        explanation_end = ai_response.find("MODIFIED CODE:")
        
        print(f"Strategy 1 markers - EXPLANATION: at {explanation_start}, MODIFIED CODE: at {explanation_end}")
        
        if explanation_start != -1 and explanation_end != -1:
            print("Found standard format markers")
            explanation = ai_response[explanation_start + len("EXPLANATION:"):explanation_end].strip()
            
            # Find code blocks after MODIFIED CODE:
            code_pattern = r"```(?:\w+)?\s*([\s\S]*?)\s*```"
            code_blocks = re.findall(code_pattern, ai_response[explanation_end:])
            
            print(f"Found {len(code_blocks)} code blocks after MODIFIED CODE:")
            
            if code_blocks:
                modified_code = code_blocks[0].strip()
                print(f"Successfully extracted with Strategy 1 - Explanation length: {len(explanation)}, Code length: {len(modified_code)}")
                return modified_code, explanation
        
        # Strategy 2: Look for markdown code blocks directly
        code_blocks = re.findall(r"```(?:\w+)?\s*([\s\S]*?)\s*```", ai_response)
        print(f"Strategy 2 - Found {len(code_blocks)} code blocks in the entire response")
        
        if len(code_blocks) >= 1:
            print("Found code blocks using regex")
            # The last code block is likely the final modified code
            modified_code = code_blocks[-1].strip()
            
            # Try to extract explanation - everything before the first code block
            first_block_start = ai_response.find("```")
            if first_block_start > 0:
                explanation = ai_response[:first_block_start].strip()
            else:
                explanation = "No explanation provided."
                
            print(f"Successfully extracted with Strategy 2 - Explanation length: {len(explanation)}, Code length: {len(modified_code)}")
            print(f"First 100 chars of modified code: {modified_code[:100]}...")
            
            # Return original code if the modified code is empty or just whitespace
            if not modified_code.strip() or len(modified_code) < 10:
                print("Warning: Modified code is too short, falling back to original")
                return original_code, explanation + "\n\nNote: The AI did not provide valid modified code, showing original."
                
            return modified_code, explanation
        
        # Strategy 3: Check for specific Python code patterns even without code blocks 
        # (sometimes the model forgets to wrap code in backticks)
        if language.lower() in ['python', 'py']:
            code_pattern = r"(?:^|\n)(from\s+\w+\s+import|import\s+\w+|def\s+\w+\s*\(|class\s+\w+\s*:)"
            if re.search(code_pattern, ai_response):
                print("Found Python code patterns without code blocks")
                # Try to extract a decent chunk of code
                # Check if there's clear explanation/code separation
                for separator in ["Here's the improved code:", "Modified code:", "Here is the modified code:", "Here's the modified code:"]:
                    if separator in ai_response:
                        parts = ai_response.split(separator, 1)
                        explanation = parts[0].strip()
                        modified_code = parts[1].strip()
                        print(f"Found code separator: '{separator}'")
                        return modified_code, explanation
        
        # Strategy 3: If there are no code blocks but we have clear differences, use the whole response as explanation
        print(f"Strategy 3 - Checking if response differs from original (original length: {len(original_code)}, response length: {len(ai_response)})")
        
        if original_code != ai_response and len(ai_response) > 20:
            print("No code blocks found, but response differs from original code")
            # Try to detect if the response itself is code
            if ai_response.strip().startswith(("def ", "class ", "function", "import ", "from ", "#", "//")):
                print("Response appears to be code")
                return ai_response.strip(), "The AI provided modified code without explanation."
            else:
                print("Response appears to be explanation only")
                return original_code, ai_response.strip()
        
        # If all else fails, return original with error
        print("All parsing strategies failed")
        # In this case, return the original code but with a warning message
        return original_code, f"The AI was unable to generate modified code. Please try a different instruction. Here's what it said: {ai_response[:500]}..."
        
    except Exception as e:
        print(f"Error parsing AI response: {str(e)}")
        print(traceback.format_exc())
        return original_code, f"Error parsing AI response: {str(e)}. Raw response: {full_response[:300]}..."

@app.post("/iterate-code", response_model=CodeResponse)
async def iterate_code(request: CodeRequest):
    """
    Process code with an instruction using either Groq API or Ollama
    """
    print(f"Received request - Language: {request.language}, Instruction length: {len(request.instruction)}, Code length: {len(request.code)}")
    
    if request.selection:
        print(f"Selection provided: Lines {request.selection.start_line}-{request.selection.end_line}")
    
    if not request.code:
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    if not request.instruction:
        raise HTTPException(status_code=400, detail="Instruction cannot be empty")
    
    # Create prompt for the model
    prompt = ""
    
    # Different prompt based on whether selection is provided
    if request.selection and request.full_context:
        # Selection-based prompt
        prompt = f"""
You are a professional coding assistant. I'm showing you a {request.language} code snippet which is a part of a larger codebase.

ORIGINAL CODE:
```{request.language}
{request.code}
```

INSTRUCTION:
{request.instruction}

CONTEXT (The full file for reference):
```{request.language}
{request.full_context}
```

Please modify the code snippet according to the instruction. Ensure your changes are compatible with the rest of the code.

IMPORTANT: 
1. Return ONLY the modified version of the snippet, not the entire file
2. Make sure your code is complete and follows best practices
3. Do not include any explanation mixed with the code
4. Provide the code in a code block using triple backticks (```)
5. Start your response with a brief explanation of the changes, then provide the complete modified code in a separate code block

EXPLANATION:
[Your explanation here]

MODIFIED CODE:
```{request.language}
[Your modified code here]
```
"""
    else:
        # Full code prompt
        prompt = f"""
You are a professional coding assistant. I'm showing you some {request.language} code that needs to be modified.

ORIGINAL CODE:
```{request.language}
{request.code}
```

INSTRUCTION:
{request.instruction}

Please modify the code according to the instruction. Follow these guidelines:

IMPORTANT: 
1. Return the complete modified code
2. Make sure your code is complete and follows best practices
3. Do not include any explanation mixed with the code
4. Provide the code in a code block using triple backticks (```)
5. Start your response with a brief explanation of the changes, then provide the complete modified code in a separate code block

EXPLANATION:
[Your explanation here]

MODIFIED CODE:
```{request.language}
[Your modified code here]
```
"""
    
    # Pick the API to use - if use_groq is explicitly set, use that value, otherwise use the default
    use_groq = request.use_groq if request.use_groq is not None else USE_GROQ_DEFAULT
    
    # Check if Groq API key is set when trying to use Groq
    if use_groq and not GROQ_API_KEY:
        print("Groq API key not found in environment variables. Falling back to Ollama.")
        use_groq = False
    
    if use_groq:
        # Try with Groq API
        try:
            print("Using Groq API for code generation")
            data = try_generate_with_groq(prompt)
            
            # Process the response to extract explanation and modified code
            ai_response = data.get("response", "")
            
            if not ai_response:
                print("Received empty response from Groq API")
                raise ValueError("Empty response from Groq API")
                
            print(f"Received response of length: {len(ai_response)}")
            
            # Use more robust extraction
            modified_code, explanation = extract_code_and_explanation(ai_response, request.language, request.code)
            
            # Make sure we got something different
            if modified_code == request.code:
                print("Modified code is identical to original code, will try Ollama as fallback")
                use_groq = False  # Fall back to Ollama
            else:
                return CodeResponse(
                    modified_code=modified_code,
                    explanation=explanation
                )
                
        except Exception as e:
            error_msg = f"Error with Groq API: {str(e)}"
            print(f"GROQ API ERROR: {error_msg}")
            print(f"Error details: {traceback.format_exc()}")
            
            # Fall back to Ollama
            print("Falling back to Ollama models")
            use_groq = False
    
    # If Groq is disabled or failed, try with Ollama models
    if not use_groq:
        # Keep track of errors for all models
        all_errors = []
        
        for model in OLLAMA_MODELS:
            try:
                # Try with this model
                print(f"Attempting to use model: {model}")
                data = try_generate_with_model(model, prompt)
                
                # Process the response to extract explanation and modified code
                ai_response = data.get("response", "")
                
                if not ai_response:
                    print("Received empty response from model")
                    all_errors.append(f"Empty response from {model}")
                    continue
                    
                print(f"Received response of length: {len(ai_response)}")
                
                # Use more robust extraction
                modified_code, explanation = extract_code_and_explanation(ai_response, request.language, request.code)
                
                # Make sure we got something different
                if modified_code == request.code:
                    print("Modified code is identical to original code, will try again or use another model")
                    all_errors.append(f"Model {model} did not modify the code")
                    continue
                
                return CodeResponse(
                    modified_code=modified_code,
                    explanation=explanation
                )
                    
            except requests.RequestException as e:
                error_msg = f"Error with model {model}: {str(e)}"
                print(f"REQUEST ERROR: {error_msg}")
                print(f"Error details: {traceback.format_exc()}")
                all_errors.append(error_msg)
                # Continue to the next model
                continue
            except Exception as e:
                error_msg = f"Unexpected error with model {model}: {str(e)}"
                print(f"UNEXPECTED ERROR: {error_msg}")
                print(f"Error details: {traceback.format_exc()}")
                all_errors.append(error_msg)
                # Continue to the next model
                continue
        
        # If we get here, all models failed
        error_detail = "All models failed to process. Errors: " + "; ".join(all_errors)
        print(f"CRITICAL ERROR: {error_detail}")
        raise HTTPException(
            status_code=503,
            detail=error_detail
        )

if __name__ == "__main__":
    import uvicorn
    
    # Start the server if this file is run directly
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 