# Product Requirement Document (PRD)

## Project Title: Code Iterator AI Tool (MVP)

---

## Objective
Build a **lightweight AI assistant** that helps **game developers** and **programmers** improve, modify, and integrate changes into their code.

Inspired by tools like **Cursor AI**, this MVP will allow users to **select code**, **prompt changes**, **review AI suggestions**, and **directly integrate changes** into the original code.

---

## Scope of the MVP
- Accept a **code snippet** (selected by the user).
- Accept a **prompt input** (what the user wants changed or improved).
- Use **AI model** to suggest **modified code** and a **clear explanation**.
- Display both **old and new code** (highlighting changes).
- Provide an **"Integrate Code"** button to apply the change directly into the code editor.
- Final output shows the updated code with changes merged.

---

## Tech Stack (Finalized)

| Layer | Technology | Notes |
|:---|:---|:---|
| **Frontend (UI)** | **Next.js** (React Framework) | Modern, fast, SSR support, easy deployment. |
| **Editor** | **Monaco Editor** | Same code editor as VS Code. Supports code selection, syntax highlighting, diffing. |
| **Styling** | **Tailwind CSS** | Rapid UI development, responsive, minimal custom CSS. |
| **Backend (API server)** | **FastAPI (Python)** | High-performance, async-ready, lightweight server for handling API calls. |
| **Model Hosting** | **Ollama (Local)** | Hosting **CodeLlama-Instruct** model locally for fast inference and offline control. |
| **Communication** | **REST API (HTTP)** | API endpoints for interaction between frontend and backend. |
| **Deployment** | Localhost (Dev), Vercel (Frontend) + Local/Cloud server (Backend + Ollama) | Deploy as needed after MVP. |

---

## Target User
- Game developers
- Developers familiar with in-editor AI tools (e.g., Cursor, Copilot).

---

## Core Functionalities

1. **Code Selection**
    - Allow users to select parts of code inside Monaco Editor.

2. **Prompt Input**
    - Free text box for users to describe what they want changed.

3. **AI Code Suggestion**
    - Send selected code + prompt to backend.
    - Backend uses CodeLlama-Instruct via Ollama to process and suggest changes.
    - Return **modified code** + **explanation**.

4. **Diff View**
    - Show original code vs suggested code.
    - Highlight differences.

5. **Integrate Code Button**
    - Apply changes into the user's current code.
    - Update the Monaco Editor content.

6. **Final Output**
    - User sees the new code inside the editor.
    - Explanation optionally shown below.

---

## User Flow

1. User opens the web app.
2. User writes or pastes code inside the Monaco Editor.
3. User selects a portion of the code.
4. User types a prompt (e.g., "Optimize this loop").
5. User clicks "Submit to AI".
6. AI responds with improved code + an explanation.
7. User previews the changes.
8. User clicks "Integrate Code" if satisfied.
9. Editor updates with the new code.

---

## Detailed API Design

### Request: `/iterate-code`
- **Method:** `POST`
- **Input:**
  ```json
  {
    "code": "<selected_code>",
    "instruction": "<user_prompt>"
  }
  ```
- **Process:**
  - FastAPI receives input.
  - Sends to local Ollama instance (CodeLlama-Instruct model).
  - Awaits AI response.

### Response:
- **Output:**
  ```json
  {
    "modified_code": "<AI_modified_code>",
    "explanation": "<Why the changes were made>"
  }
  ```

---

## MVP Requirements (Minimum Viable Product)
- Monaco Editor fully functional.
- Ability to select code.
- Prompt input field.
- Submit button.
- Display AI's modified code + explanation.
- Display diff view.
- Integrate Code button updates the editor.

---

## Future Expansion (Post-MVP)
- Multi-language support (Python, C#, C++, etc.).
- Streaming responses (token by token generation).
- Inline suggestions (like Github Copilot Ghost Text).
- Authentication (user accounts).
- Saving history of iterations.
- Better AI models (like Deepseek Coder, WizardCoder).
- Version control integration (GitHub commits on integrate).

---

## Key Notes for Development
- MVP should prioritize **functionality** and **speed** over **perfect UI/UX**.
- API should handle **errors** gracefully (like no code selected, invalid prompts, etc).
- Ollama model must be **tested locally** before connecting frontend.
- Ensure **diffing** is smooth and easy to understand for the user.
- Code comments must be added for all parts of backend and frontend.

---

## Deliverables
- Fully working MVP.
- Demo video or live link.
- Source code repository.
- Brief description of tool working and capabilities.

---


