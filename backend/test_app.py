import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app import app

client = TestClient(app)

def test_read_root():
    """Test that the root endpoint returns the expected message."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Code Iterator AI API is running"}

def test_iterate_code_empty_code():
    """Test that providing empty code results in an appropriate error."""
    response = client.post(
        "/iterate-code",
        json={"code": "", "instruction": "Make it better"}
    )
    assert response.status_code == 400
    assert "Code cannot be empty" in response.json()["detail"]

def test_iterate_code_empty_instruction():
    """Test that providing empty instruction results in an appropriate error."""
    response = client.post(
        "/iterate-code",
        json={"code": "function test() { return 1; }", "instruction": ""}
    )
    assert response.status_code == 400
    assert "Instruction cannot be empty" in response.json()["detail"]

@patch("requests.post")
def test_iterate_code_successful(mock_post):
    """Test successful code iteration."""
    # Mock the response from Ollama
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "response": """
EXPLANATION:
I've improved the function by adding proper comments.

MODIFIED CODE:
```
/**
 * Test function that returns 1
 * @returns {number} Always returns 1
 */
function test() {
  return 1;
}
```
        """
    }
    mock_response.raise_for_status.return_value = None
    mock_post.return_value = mock_response
    
    # Test our API
    response = client.post(
        "/iterate-code",
        json={
            "code": "function test() { return 1; }",
            "instruction": "Add proper comments"
        }
    )
    
    # Assertions
    assert response.status_code == 200
    assert "modified_code" in response.json()
    assert "explanation" in response.json()
    assert "Test function that returns 1" in response.json()["explanation"]
    assert "function test()" in response.json()["modified_code"]

@patch("requests.post")
def test_iterate_code_parsing_error(mock_post):
    """Test handling of responses that don't match the expected format."""
    # Mock a response that doesn't follow the expected format
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "response": "This is not in the expected format."
    }
    mock_response.raise_for_status.return_value = None
    mock_post.return_value = mock_response
    
    # Test our API
    original_code = "function test() { return 1; }"
    response = client.post(
        "/iterate-code",
        json={
            "code": original_code,
            "instruction": "Add proper comments"
        }
    )
    
    # Assertions
    assert response.status_code == 200
    assert response.json()["modified_code"] == original_code
    assert "Failed to parse AI response" in response.json()["explanation"]

@patch("requests.post")
def test_iterate_code_ollama_error(mock_post):
    """Test handling of Ollama API errors."""
    # Mock a request exception
    mock_post.side_effect = Exception("Connection error")
    
    # Test our API
    response = client.post(
        "/iterate-code",
        json={
            "code": "function test() { return 1; }",
            "instruction": "Add proper comments"
        }
    )
    
    # Assertions
    assert response.status_code == 500
    assert "An unexpected error occurred" in response.json()["detail"] 